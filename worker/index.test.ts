import { describe, it, expect, vi } from "vitest";
import worker from "./index";
function environment() {
  return {
    AI: {
      run: vi.fn(async (..._args: unknown[]) => ({
        response: "A generated brief",
      })),
    },
    AI_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    ASSETS: { fetch: vi.fn(async () => new Response("asset")) },
  };
}
function request(body: unknown, extra: Record<string, string> = {}) {
  return new Request("https://qirvexa.example/api/brief", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://qirvexa.example",
      ...extra,
    },
    body: JSON.stringify(body),
  });
}
const handle = (req: Request, env: ReturnType<typeof environment>) =>
  worker.fetch(req, env as unknown as Env);
describe("AI endpoint boundaries (stubbed binding, not live inference)", () => {
  it("rejects cross-origin requests before inference", async () => {
    const env = environment();
    const res = await handle(
      request(
        { idea: "A useful client portal" },
        { Origin: "https://other.example" },
      ),
      env,
    );
    expect(res.status).toBe(403);
    expect(env.AI.run).not.toHaveBeenCalled();
  });
  it("rejects invalid input without spending inference", async () => {
    const env = environment();
    const res = await handle(request({ idea: "short" }), env);
    expect(res.status).toBe(400);
    expect(env.AI.run).not.toHaveBeenCalled();
  });
  it("enforces actual body size without trusting Content-Length", async () => {
    const env = environment();
    const res = await handle(request({ idea: "x".repeat(13000) }), env);
    expect(res.status).toBe(413);
    expect(env.AI.run).not.toHaveBeenCalled();
  });
  it("returns a retryable quota error without fake generated content", async () => {
    const env = environment();
    env.AI_LIMITER.limit.mockResolvedValue({ success: false });
    const res = await handle(request({ idea: "A useful client portal" }), env);
    expect(res.status).toBe(429);
    expect(env.AI.run).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({ error: "rate_limited" });
  });
  it("renders a service failure explicitly, preserving no pretend response", async () => {
    const env = environment();
    env.AI.run.mockRejectedValue(new Error("quota"));
    const res = await handle(request({ idea: "A useful client portal" }), env);
    expect(res.status).toBe(503);
    expect(await res.json()).not.toHaveProperty("brief");
  });
  it("uses one bounded model call and returns its text", async () => {
    const env = environment();
    const res = await handle(
      request({ idea: "A useful client portal", language: "ar" }),
      env,
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { brief: string }).brief).toBe(
      "A generated brief",
    );
    expect(env.AI.run).toHaveBeenCalledTimes(1);
    expect(env.AI.run.mock.calls[0]?.[1]).toMatchObject({
      max_tokens: 750,
      temperature: 0.3,
    });
  });
});
