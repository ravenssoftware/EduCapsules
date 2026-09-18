import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types.js";
import { requireSession } from "../modules/auth/middleware.js";
import { AUTHZ_ERROR_STATUS, AuthzDomainError } from "../modules/authz/errors.js";
import {
  ACADEMIC_STRUCTURE_ERROR_STATUS,
  AcademicStructureDomainError,
} from "../modules/academic-structure/errors.js";
import * as service from "../modules/academic-structure/service.js";

/** /api/v1/enrollments (§37.3.2, PER-003). Creation is nested under Course — see ../routes/courses.js's POST /:id/enrollments. */

export const enrollments = new Hono<AppEnv>();

enrollments.use("*", requireSession());

function toHttpException(err: unknown): HTTPException {
  if (err instanceof AuthzDomainError) {
    return new HTTPException(AUTHZ_ERROR_STATUS[err.code] as 400, { message: err.message });
  }
  if (err instanceof AcademicStructureDomainError) {
    return new HTTPException(ACADEMIC_STRUCTURE_ERROR_STATUS[err.code] as 400, {
      message: err.message,
    });
  }
  throw err;
}

function deps(c: Context<AppEnv>): service.Deps {
  return { repo: c.get("academicStructureRepository"), authzRepo: c.get("authzRepository") };
}

// Self-access only — see service.js's listEnrollmentsForStudent doc comment
// for why this deliberately bypasses the generic scope-object authorize()
// call.
enrollments.get("/mine", async (c) => {
  const session = c.get("session")!;
  const list = await service.listEnrollmentsForStudent(
    deps(c),
    { organizationId: session.organizationId, userId: session.userId },
    session.userId,
  );
  return c.json({ enrollments: list });
});

enrollments.post("/:id/withdraw", async (c) => {
  const session = c.get("session")!;
  try {
    const enrollment = await service.withdrawEnrollment(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { loginSessionId: session.id },
    );
    return c.json({ enrollment });
  } catch (err) {
    throw toHttpException(err);
  }
});
