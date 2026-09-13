import { describe, expect, it } from "vitest";
import { HTTPException } from "hono/http-exception";
import { createApp } from "./app.js";

describe("createApp", () => {
  it("GET /health returns 200 ok", async () => {
    const app = createApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("GET /ready returns 200 ready", async () => {
    const app = createApp();
    const res = await app.request("/ready");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ready" });
  });

  it("assigns a correlation id when the client sends none", async () => {
    const app = createApp();
    const res = await app.request("/health");
    expect(res.headers.get("x-correlation-id")).toBeTruthy();
  });

  it("echoes back a client-supplied correlation id (NFR-012)", async () => {
    const app = createApp();
    const res = await app.request("/health", {
      headers: { "x-correlation-id": "test-correlation-id" },
    });
    expect(res.headers.get("x-correlation-id")).toBe("test-correlation-id");
  });

  it("returns security headers on every response (SEC-038)", async () => {
    const app = createApp();
    const res = await app.request("/health");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("returns an RFC 9457 problem-detail body for a deliberate HTTP error", async () => {
    const app = createApp();
    app.get("/boom", () => {
      throw new HTTPException(404, { message: "Not Found" });
    });
    const res = await app.request("/boom");
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: 404, title: "Not Found" });
    expect(body.correlationId).toBeTruthy();
  });

  it("never leaks internal error details for an unexpected exception (SEC-037)", async () => {
    const app = createApp();
    app.get("/crash", () => {
      throw new Error("a secret internal detail that must never reach the client");
    });
    const res = await app.request("/crash");
    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain("secret internal detail");
  });
});
