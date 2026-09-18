import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { correlationId } from "./middleware/correlation-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { health } from "./routes/health.js";
import { auth } from "./routes/auth.js";
import { academicPeriods } from "./routes/academic-periods.js";
import { classrooms } from "./routes/classrooms.js";
import { groups } from "./routes/groups.js";
import { memberships } from "./routes/memberships.js";
import { subjects } from "./routes/subjects.js";
import { courses, subjectCourses } from "./routes/courses.js";
import { cycles } from "./routes/cycles.js";
import { topics } from "./routes/topics.js";
import { enrollments } from "./routes/enrollments.js";
import { assistantAssignments } from "./routes/assistant-assignments.js";
import { parentLinks } from "./routes/parent-links.js";
import type { AuthRepository } from "./modules/auth/repository.js";
import type { AuthzRepository } from "./modules/authz/repository.js";
import type { AcademicStructureRepository } from "./modules/academic-structure/repository.js";
import type { AppEnv } from "./types.js";

export interface CreateAppDeps {
  /** Omitted in tests that only exercise health/error-handling — the /api/v1/auth routes simply aren't mounted then. server.ts always supplies a real one (db.ts). */
  authRepository?: AuthRepository;
  /** Phase 5 — required alongside authRepository to mount the authorization-gated routes. */
  authzRepository?: AuthzRepository;
  /** Phase 6 — the real academic-structure module (replaces the Phase 5 classrooms/ demonstrator). */
  academicStructureRepository?: AcademicStructureRepository;
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
  if (deps.authzRepository) {
    const repo = deps.authzRepository;
    app.use("*", async (c, next) => {
      c.set("authzRepository", repo);
      await next();
    });
  }
  if (deps.academicStructureRepository) {
    const repo = deps.academicStructureRepository;
    app.use("*", async (c, next) => {
      c.set("academicStructureRepository", repo);
      await next();
    });
  }
  app.onError(errorHandler);

  app.route("/", health);
  // API-002: versioned path. Table 38.2's /auth resource group.
  if (deps.authRepository) {
    app.route("/api/v1/auth", auth);
  }
  // Phase 6 — the real academic-structure module. Every route below
  // requires BOTH authentication (stage 1) and the centralized
  // authorization pipeline (stage 2+), so nothing here mounts without all
  // three repositories present.
  if (deps.authRepository && deps.authzRepository && deps.academicStructureRepository) {
    app.route("/api/v1/academic-periods", academicPeriods);
    app.route("/api/v1/classrooms", classrooms);
    app.route("/api/v1/groups", groups);
    app.route("/api/v1/memberships", memberships);
    app.route("/api/v1/subjects", subjects);
    app.route("/api/v1/subjects/:id/courses", subjectCourses);
    app.route("/api/v1/courses", courses);
    app.route("/api/v1/cycles", cycles);
    app.route("/api/v1/topics", topics);
    app.route("/api/v1/enrollments", enrollments);
  }
  if (deps.authRepository && deps.authzRepository) {
    app.route("/api/v1/assistant-assignments", assistantAssignments);
    app.route("/api/v1/parent-links", parentLinks);
  }

  return app;
}
