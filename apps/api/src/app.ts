import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { correlationId } from "./middleware/correlation-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { health } from "./routes/health.js";
import { auth } from "./routes/auth.js";
import type { AuthRepository } from "./modules/auth/repository.js";
import type { AppEnv } from "./types.js";

export interface CreateAppDeps {
  /** Omitted in tests that only exercise health/error-handling — the /api/v1/auth routes simply aren't mounted then. server.ts always supplies a real one (db.ts). */
  authRepository?: AuthRepository;
}

/**
 * The Transport-layer app (docs/architecture/backend.md §1). It carries no
 * business logic and no direct platform-SDK import (BE-008's review
 * checklist, backend.md §8) — it only wires cross-cutting middleware and
 * mounts route modules. Business modules attach their own sub-apps here
 * starting Phase 3.
 */
export function createApp(deps: CreateAppDeps = {}): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use("*", correlationId);
  app.use("*", secureHeaders());
  if (deps.authRepository) {
    const repo = deps.authRepository;
    app.use("*", async (c, next) => {
      c.set("authRepository", repo);
      await next();
    });
  }
  app.onError(errorHandler);

  app.route("/", health);
  // API-002: versioned path. Table 38.2's /auth resource group.
  if (deps.authRepository) {
    app.route("/api/v1/auth", auth);
  }

  return app;
}
