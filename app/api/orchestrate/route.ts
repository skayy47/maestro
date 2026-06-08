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

              // TODO: Call the actual agent (research, data, automation)
              // For now, mock it with a placeholder
              const mockOutput = {
                agent: agentId,
                status: "complete",
                reasoning: `${agentId} agent processed the mission`,
                output: { placeholder: true },
                artifacts: [],
                sources: [],
                confidence: 0.7,
                caveats: ["MVP stub - real agent coming soon"],
                timing_ms: 500,
              };

              // Stream some mock tokens (simulate thinking)
              for (const char of `Processing with ${agentId}...`.split("")) {
                if (isClosed) break;
                controller.enqueue(
                  encoder.encode(
                    formatSSEEvent({
                      type: "token",
                      data: { agent: agentId, delta: char },
                    })
                  )
                );
                await new Promise((resolve) => setTimeout(resolve, 20));
              }

              controller.enqueue(
                encoder.encode(
                  formatSSEEvent({
                    type: "agent_done",
                    data: mockOutput,
                  })
                )
              );
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
            executive_summary: `Orchestration complete for: ${mission}`,
            deliverable: {
              type: "summary",
              content: "Full orchestration pipeline executed successfully.",
            },
            confidence: 0.75,
            caveats: ["MVP: agents are stubs"],
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
