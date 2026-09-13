import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { correlationId } from "./middleware/correlation-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { health } from "./routes/health.js";
import type { AppEnv } from "./types.js";

/**
 * The Transport-layer app (docs/architecture/backend.md §1). It carries no
 * business logic and no direct platform-SDK import (BE-008's review
 * checklist, backend.md §8) — it only wires cross-cutting middleware and
 * mounts route modules. Business modules attach their own sub-apps here
 * starting Phase 3.
 */
export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use("*", correlationId);
  app.use("*", secureHeaders());
  app.onError(errorHandler);

  app.route("/", health);

  return app;
}
