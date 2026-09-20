import { expect, test } from "@playwright/test";

test.describe("API smoke test (real HTTP server, not in-process)", () => {
  test("GET /health responds 200 ok", async ({ request }) => {
    const res = await request.get("/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  test("GET /ready responds 200 ready", async ({ request }) => {
    const res = await request.get("/ready");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: "ready" });
  });

  test("every response carries a correlation id (NFR-012)", async ({ request }) => {
    const res = await request.get("/health");
    expect(res.headers()["x-correlation-id"]).toBeTruthy();
  });
});
