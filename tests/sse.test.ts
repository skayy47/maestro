import { describe, it, expect, vi } from "vitest";
import { makeSseParser, type ParsedSseEvent } from "@/lib/hooks/sse";

/**
 * Regression suite for the SSE parser.
 * The original inline parser dropped events when multiple arrived in one chunk
 * (the "nothing happens on Conduct" bug). These tests lock that shut.
 */
describe("makeSseParser", () => {
  function collect() {
    const events: ParsedSseEvent[] = [];
    const parser = makeSseParser((e) => events.push(e));
    return { events, parser };
  }

  it("emits a single complete event", () => {
    const { events, parser } = collect();
    parser('event: plan\ndata: {"agents":["research"]}\n\n');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("plan");
    expect(events[0].data).toEqual({ agents: ["research"] });
  });

  it("emits MULTIPLE events delivered in one chunk (the dropped-event bug)", () => {
    const { events, parser } = collect();
    parser(
      'event: agent_start\ndata: {"agent":"research"}\n\n' +
        'event: agent_done\ndata: {"agent":"research","timing_ms":120}\n\n' +
        'event: done\ndata: {"missionId":"m1"}\n\n'
    );
    expect(events.map((e) => e.type)).toEqual([
      "agent_start",
      "agent_done",
      "done",
    ]);
    expect((events[1].data as any).timing_ms).toBe(120);
  });

  it("reassembles an event split across two chunks (chunked transport)", () => {
    const { events, parser } = collect();
    // Caller splits on trailing newline; type arrives first, data later.
    parser("event: token\n");
    expect(events).toHaveLength(0); // not yet — no data line
    parser('data: {"delta":"H"}\n\n');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("token");
    expect((events[0].data as any).delta).toBe("H");
  });

  it("routes malformed JSON to onError instead of throwing", () => {
    const onError = vi.fn();
    const events: ParsedSseEvent[] = [];
    const parser = makeSseParser((e) => events.push(e), onError);
    parser("event: plan\ndata: {not valid json}\n\n");
    expect(events).toHaveLength(0);
    expect(onError).toHaveBeenCalledOnce();
  });

  it("does not emit a data line with no preceding event type", () => {
    const { events, parser } = collect();
    parser('data: {"orphan":true}\n\n');
    expect(events).toHaveLength(0);
  });
});
