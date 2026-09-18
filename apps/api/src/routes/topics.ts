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

/** /api/v1/topics (SRS §10, TOP-*). Creation is nested under Cycle — see ../routes/cycles.js's POST /:id/topics. */

export const topics = new Hono<AppEnv>();

topics.use("*", requireSession());

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

topics.get("/:id", async (c) => {
  const session = c.get("session")!;
  try {
    const topic = await service.getTopic(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ topic });
  } catch (err) {
    throw toHttpException(err);
  }
});

topics.patch("/:id", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const patch: {
    title?: string;
    sequenceNo?: number;
    learningObjectives?: string | null;
    status?: "active" | "archived";
  } = {};
  if (typeof body["title"] === "string") patch.title = body["title"];
  if (typeof body["sequenceNo"] === "number") patch.sequenceNo = body["sequenceNo"];
  if (typeof body["learningObjectives"] === "string" || body["learningObjectives"] === null) {
    patch.learningObjectives = body["learningObjectives"] as string | null;
  }
  if (body["status"] === "active" || body["status"] === "archived") patch.status = body["status"];

  try {
    const topic = await service.updateTopic(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      patch,
      { loginSessionId: session.id },
    );
    return c.json({ topic });
  } catch (err) {
    throw toHttpException(err);
  }
});
