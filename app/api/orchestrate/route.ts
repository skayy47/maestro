/**
 * POST /api/orchestrate
 *
 * Takes a mission, calls the Orchestrator planner, runs the selected agents as
 * a DAG (groups run in parallel, groups execute in sequence), and streams the
 * results as Server-Sent Events (SSE).
 *
 * SSE event types:
 * - plan: MissionPlan (which agents, why, order)
 * - agent_start: agent is running
 * - agent_done: AgentEnvelope (full result)
 * - synthesis: final synthesized result
 * - done: mission complete
 * - error: something went wrong (per-agent recoverable, or fatal)
 *
 * Production notes:
 * - `maxDuration` keeps the serverless function alive long enough for the LLM
 *   chain; `dynamic = force-dynamic` ensures the stream is never cached.
 * - A 15s heartbeat comment keeps proxies/load-balancers from killing an idle
 *   SSE connection during long LLM calls; `X-Accel-Buffering: no` disables
 *   intermediary buffering so events flush immediately.
 * - The agent loop honors `request.signal`, so a client abort (navigation,
 *   timeout, new run) stops scheduling further work instead of running on.
 * - We do NOT fake token streaming on the server: reasoning ships in the
 *   `agent_done` envelope and the client presents it. This frees the function
 *   to finish as fast as the model allows.
 */

import { planMission } from "@/lib/agents/orchestrator";
import { runResearch } from "@/lib/agents/research";
import { runData } from "@/lib/agents/data";
import { runAutomation } from "@/lib/agents/automation";
import { synthesize } from "@/lib/agents/synthesizer";
import type { AgentEnvelope } from "@/lib/agents/envelopes";
import type { AgentId } from "@/lib/agents/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface SSEEvent {
  type: string;
  data: unknown;
}

function formatSSEEvent(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

/** Run a single roster agent, given the mission + everything gathered so far. */
async function runAgent(
  agentId: AgentId,
  mission: string,
  collected: unknown[],
  csvContent: string | undefined
): Promise<unknown | null> {
  if (agentId === "research") return runResearch(mission, collected);
  if (agentId === "data") return runData(mission, collected, csvContent);
  if (agentId === "automation") return runAutomation(mission, collected);
  return null; // unknown / not-yet-built agent
}

export async function POST(request: Request) {
  try {
    const { mission, csv } = (await request.json()) as {
      mission: string;
      csv?: { name: string; content: string };
    };
    const csvContent = csv?.content?.trim() ? csv.content : undefined;

    if (!mission || !mission.trim()) {
      return new Response(JSON.stringify({ error: "Mission is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const signal = request.signal;
    let isClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        // Guarded enqueue — never throws after the stream is closed/cancelled.
        const send = (event: SSEEvent) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(formatSSEEvent(event)));
          } catch {
            isClosed = true;
          }
        };

        // Keep the connection warm during long LLM calls.
        const heartbeat = setInterval(() => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            isClosed = true;
          }
        }, 15000);

        const finish = () => {
          clearInterval(heartbeat);
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {
              /* already closed */
            }
          }
        };

        try {
          // Step 1: Plan the mission
          console.log("[MAESTRO] Planning mission:", mission);
          const plan = await planMission(mission);

          // If the user uploaded a CSV, the Data agent MUST run even if the
          // planner didn't select it — they explicitly gave data to analyze.
          if (csvContent && !plan.execution_order.flat().includes("data")) {
            plan.execution_order.push(["data"]);
            plan.selected_agents.push({
              agent: "data",
              reason: "User uploaded a dataset to analyze.",
              depends_on: [],
            });
          }

          send({ type: "plan", data: plan });

          // Step 2: Run the DAG. Each inner array is a group that runs in
          // parallel; groups execute in sequence so dependencies are honored.
          const collectedEnvelopes: unknown[] = [];

          for (const agentGroup of plan.execution_order) {
            if (signal.aborted || isClosed) break;

            await Promise.all(
              agentGroup.map(async (agentId) => {
                send({ type: "agent_start", data: { agent: agentId } });
                try {
                  const envelope = await runAgent(
                    agentId,
                    mission,
                    collectedEnvelopes,
                    csvContent
                  );
                  if (envelope == null) return; // unknown agent — skip silently
                  collectedEnvelopes.push(envelope);
                  send({ type: "agent_done", data: envelope });
                } catch (agentError) {
                  console.error(`[MAESTRO] ${agentId} agent error:`, agentError);
                  send({
                    type: "error",
                    data: {
                      agent: agentId,
                      message:
                        agentError instanceof Error
                          ? agentError.message
                          : "Agent failed",
                      recoverable: true,
                    },
                  });
                }
              })
            );
          }

          // Step 3: Synthesis (Orchestrator weaves agent outputs into a briefing)
          if (!signal.aborted && !isClosed) {
            send({
              type: "synthesis",
              data: {
                status: "synthesizing",
                message: "Maestro is composing the final movement...",
              },
            });

            const briefing = await synthesize(
              mission,
              collectedEnvelopes as AgentEnvelope[]
            );

            send({
              type: "synthesis",
              data: {
                ...briefing,
                total_agents_run: collectedEnvelopes.length,
                total_duration_ms: collectedEnvelopes.reduce(
                  (sum: number, e: any) => sum + (e.timing_ms || 0),
                  0
                ),
              },
            });

            // Step 4: Done
            send({ type: "done", data: { missionId: `mission-${Date.now()}` } });
          }

          finish();
        } catch (error) {
          console.error("[MAESTRO] Error:", error);
          send({
            type: "error",
            data: {
              message: error instanceof Error ? error.message : "Unknown error",
              recoverable: false,
            },
          });
          finish();
        }
      },

      cancel() {
        isClosed = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // Disable proxy buffering (nginx / some CDNs) so events flush live.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[MAESTRO] Request error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
