import { describe, it, expect } from "vitest";
import { DEFAULT_SHOWCASE, SHOWCASES, getShowcase } from "@/lib/showcase/missions";

/**
 * The showcase is what plays for recruiters and as the failure fallback, so it
 * must always be a complete, valid run — these tests stop it rotting.
 */
describe("showcase", () => {
  it("default showcase has a full, ordered event sequence", () => {
    const types = DEFAULT_SHOWCASE.events.map((e) => e.type);
    expect(types[0]).toBe("plan");
    expect(types).toContain("agent_done");
    expect(types).toContain("synthesis");
    expect(types[types.length - 1]).toBe("done");
  });

  it("every agent in the showcase actually delivered (status complete)", () => {
    const agentDone = DEFAULT_SHOWCASE.events.filter((e) => e.type === "agent_done");
    expect(agentDone.length).toBeGreaterThanOrEqual(3);
    for (const e of agentDone) {
      expect((e.data as any).status).toBe("complete");
    }
  });

  it("carries a real, importable n8n workflow artifact", () => {
    const auto = DEFAULT_SHOWCASE.events.find(
      (e) => e.type === "agent_done" && (e.data as any).agent === "automation"
    );
    const wf = (auto!.data as any).output.workflow_json;
    expect(Array.isArray(wf.nodes)).toBe(true);
    expect(wf.nodes.length).toBeGreaterThan(0);
    expect(Object.keys(wf.connections).length).toBe(wf.nodes.length - 1);
    expect(wf.nodes.every((n: any) => n.type.startsWith("n8n-nodes-base."))).toBe(true);
  });

  it("has a synthesis briefing with summary + findings", () => {
    const syn = DEFAULT_SHOWCASE.events.find(
      (e) => e.type === "synthesis" && (e.data as any).executive_summary
    );
    expect(syn).toBeTruthy();
    expect((syn!.data as any).key_findings.length).toBeGreaterThan(0);
  });

  it("getShowcase falls back to the default for an unknown id", () => {
    expect(getShowcase("nope").id).toBe(DEFAULT_SHOWCASE.id);
    expect(SHOWCASES.length).toBeGreaterThan(0);
  });
});
