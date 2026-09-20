import { Hono } from "hono";
import type { AppEnv } from "../types.js";

/**
 * Liveness and readiness endpoints (SRS BE-009). These carry no
 * authorization requirement (SRS API-003's public allow-list) and no
 * business logic — they exist purely so the hosting platform (and a human)
 * can tell the process is up and able to serve traffic.
 */
export const health = new Hono<AppEnv>();

health.get("/health", (c) => c.json({ status: "ok" }));

health.get("/ready", (c) => c.json({ status: "ready" }));
