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

/** /api/v1/groups (SRS §9, GRP-*). Creation is nested under Classroom — see ../routes/classrooms.ts's POST /:id/groups (GRP-001: a Group belongs to exactly one Classroom). */

export const groups = new Hono<AppEnv>();

groups.use("*", requireSession());

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

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) throw new Error("not an object");
    return body as Record<string, unknown>;
  } catch {
    throw new HTTPException(422, { message: "Request body must be valid JSON." });
  }
}

function deps(c: Context<AppEnv>): service.Deps {
  return { repo: c.get("academicStructureRepository"), authzRepo: c.get("authzRepository") };
}

groups.get("/:id", async (c) => {
  const session = c.get("session")!;
  try {
    const group = await service.getGroup(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ group });
  } catch (err) {
    throw toHttpException(err);
  }
});

groups.patch("/:id", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const patch: { name?: string; purpose?: string | null; status?: "active" | "archived" } = {};
  if (typeof body["name"] === "string") patch.name = body["name"];
  if (typeof body["purpose"] === "string" || body["purpose"] === null) {
    patch.purpose = body["purpose"] as string | null;
  }
  if (body["status"] === "active" || body["status"] === "archived") patch.status = body["status"];

  try {
    const group = await service.updateGroup(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      patch,
      { loginSessionId: session.id },
    );
    return c.json({ group });
  } catch (err) {
    throw toHttpException(err);
  }
});
