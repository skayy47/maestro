import { describe, it, expect } from "vitest";
import {
  canAutoloadMissionOver,
  STARTER_MISSIONS,
  AGENT_MISSION_EXAMPLES,
} from "@/lib/agents/registry";

describe("canAutoloadMissionOver — agent-click mission swap", () => {
  it("fills an empty or whitespace-only box", () => {
    expect(canAutoloadMissionOver("")).toBe(true);
    expect(canAutoloadMissionOver("   \n ")).toBe(true);
  });

  it("swaps over an unedited starter mission (fluid agent-to-agent exploration)", () => {
    for (const example of Object.values(AGENT_MISSION_EXAMPLES)) {
      expect(canAutoloadMissionOver(example!)).toBe(true);
      // tolerant of the textarea's incidental surrounding whitespace
      expect(canAutoloadMissionOver(`  ${example}  `)).toBe(true);
    }
  });

  it("protects a mission the user actually typed", () => {
    expect(canAutoloadMissionOver("Build me a churn model for my SaaS")).toBe(false);
    // an edited starter is now the user's — protect it
    expect(
      canAutoloadMissionOver(
        AGENT_MISSION_EXAMPLES.research + " for the Moroccan market"
      )
    ).toBe(false);
  });

  it("exposes exactly the three built-agent starters", () => {
    expect(STARTER_MISSIONS.size).toBe(3);
  });
});
