/**
 * POST /api/orchestrate
 *
 * Takes a mission, calls the Orchestrator planner, runs the selected agents,
 * and streams the results as Server-Sent Events (SSE).
 *
 * SSE event types:
 * - plan: MissionPlan (which agents, why, order)
 * - agent_start: agent is running
 * - token: streaming token from the agent's reasoning
 * - agent_done: AgentEnvelope (full result)
 * - synthesis: final synthesized result
 * - done: mission complete
 * - error: something went wrong
 */

import { planMission } from "@/lib/agents/orchestrator";
import { runResearch } from "@/lib/agents/research";
import { runData } from "@/lib/agents/data";
import { runAutomation } from "@/lib/agents/automation";

export const runtime = "nodejs";

interface SSEEvent {
  type: string;
  data: unknown;
}

function formatSSEEvent(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export async function POST(request: Request) {
  try {
    const { mission } = (await request.json()) as { mission: string };

    if (!mission || !mission.trim()) {
      return new Response(
        formatSSEEvent({
          type: "error",
          data: { message: "Mission is required" },
        }),
        { status: 400, headers: { "Content-Type": "text/event-stream" } }
      );
    }

    // Return SSE stream
    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Plan the mission
          console.log("[MAESTRO] Planning mission:", mission);
          const plan = await planMission(mission);

          controller.enqueue(
            encoder.encode(
              formatSSEEvent({
                type: "plan",
                data: plan,
              })
            )
          );

          // Step 2: Run each agent group sequentially
          const collectedEnvelopes: unknown[] = [];

          for (const agentGroup of plan.execution_order) {
            // For MVP, agents in a group run sequentially (we can parallelize later)
            for (const agentId of agentGroup) {
              controller.enqueue(
                encoder.encode(
                  formatSSEEvent({
                    type: "agent_start",
                    data: { agent: agentId },
                  })
                )
              );

              // Call the actual agent
              let envelope: unknown;
              try {
                if (agentId === "research") {
                  envelope = await runResearch(mission, collectedEnvelopes);
                } else if (agentId === "data") {
                  envelope = await runData(mission, collectedEnvelopes);
                } else if (agentId === "automation") {
                  envelope = await runAutomation(mission, collectedEnvelopes);
                } else {
                  // Skip unknown agents
                  continue;
                }

                collectedEnvelopes.push(envelope);

                // Stream reasoning tokens (simulate streaming)
                const reasoning = (envelope as any)?.reasoning || "";
                for (const char of reasoning.split("")) {
                  if (isClosed) break;
                  controller.enqueue(
                    encoder.encode(
                      formatSSEEvent({
                        type: "token",
                        data: { agent: agentId, delta: char },
                      })
                    )
                  );
                  await new Promise((resolve) => setTimeout(resolve, 5));
                }

                controller.enqueue(
                  encoder.encode(
                    formatSSEEvent({
                      type: "agent_done",
                      data: envelope,
                    })
                  )
                );
              } catch (agentError) {
                console.error(`[MAESTRO] ${agentId} agent error:`, agentError);
                controller.enqueue(
                  encoder.encode(
                    formatSSEEvent({
                      type: "error",
                      data: {
                        agent: agentId,
                        message:
                          agentError instanceof Error
                            ? agentError.message
                            : "Agent failed",
                        recoverable: true,
                      },
                    })
                  )
                );
              }
            }
          }

          // Step 3: Synthesis (Orchestrator merges agent outputs)
          controller.enqueue(
            encoder.encode(
              formatSSEEvent({
                type: "synthesis",
                data: {
                  status: "synthesizing",
                  message: "Maestro is composing the final symphony...",
                },
              })
            )
          );

          const synthesisOutput = {
            executive_summary: `Orchestration complete: ${plan.expected_deliverable}`,
            deliverable: {
              type: plan.expected_deliverable,
              agent_contributions: collectedEnvelopes.map(
                (e: any) => `${e.agent}: ${e.reasoning}`
              ),
              confidence: collectedEnvelopes.reduce(
                (sum: number, e: any) => sum + (e.confidence || 0),
                0
              ) / Math.max(collectedEnvelopes.length, 1),
            },
            total_agents_run: collectedEnvelopes.length,
            total_duration_ms: collectedEnvelopes.reduce(
              (sum: number, e: any) => sum + (e.timing_ms || 0),
              0
            ),
          };

          controller.enqueue(
            encoder.encode(
              formatSSEEvent({
                type: "synthesis",
                data: synthesisOutput,
              })
            )
          );

          // Step 4: Done
          controller.enqueue(
            encoder.encode(
              formatSSEEvent({
                type: "done",
                data: { missionId: `mission-${Date.now()}` },
              })
            )
          );

          controller.close();
        } catch (error) {
          isClosed = true;
          console.error("[MAESTRO] Error:", error);
          controller.enqueue(
            encoder.encode(
              formatSSEEvent({
                type: "error",
                data: {
                  message: error instanceof Error ? error.message : "Unknown error",
                  recoverable: false,
                },
              })
            )
          );
          controller.close();
        }
      },

      cancel() {
        isClosed = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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
