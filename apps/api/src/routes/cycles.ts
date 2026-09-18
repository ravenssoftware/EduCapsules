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

/** /api/v1/cycles (SRS §10, CYC-*). Creation is nested under Course — see ../routes/courses.js's POST /:id/cycles. Topic creation is nested here — see POST /:id/topics below. */

export const cycles = new Hono<AppEnv>();

cycles.use("*", requireSession());

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

cycles.get("/:id", async (c) => {
  const session = c.get("session")!;
  try {
    const cycle = await service.getCycle(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ cycle });
  } catch (err) {
    throw toHttpException(err);
  }
});

cycles.patch("/:id", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const patch: {
    title?: string;
    sequenceNo?: number;
    startsOn?: string | null;
    endsOn?: string | null;
    status?: "active" | "archived";
  } = {};
  if (typeof body["title"] === "string") patch.title = body["title"];
  if (typeof body["sequenceNo"] === "number") patch.sequenceNo = body["sequenceNo"];
  if (typeof body["startsOn"] === "string" || body["startsOn"] === null) {
    patch.startsOn = body["startsOn"] as string | null;
  }
  if (typeof body["endsOn"] === "string" || body["endsOn"] === null) {
    patch.endsOn = body["endsOn"] as string | null;
  }
  if (body["status"] === "active" || body["status"] === "archived") patch.status = body["status"];

  try {
    const cycle = await service.updateCycle(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      patch,
      { loginSessionId: session.id },
    );
    return c.json({ cycle });
  } catch (err) {
    throw toHttpException(err);
  }
});

// --- Topics (nested creation — see ../routes/topics.js for the standalone surface) ---

cycles.get("/:id/topics", async (c) => {
  const session = c.get("session")!;
  try {
    const topics = await service.listTopics(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ topics });
  } catch (err) {
    throw toHttpException(err);
  }
});

cycles.post("/:id/topics", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const title = typeof body["title"] === "string" ? body["title"] : "";
  const sequenceNo = typeof body["sequenceNo"] === "number" ? body["sequenceNo"] : NaN;
  const learningObjectives =
    typeof body["learningObjectives"] === "string" ? body["learningObjectives"] : null;

  try {
    const topic = await service.createTopic(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { title, sequenceNo, learningObjectives },
      { loginSessionId: session.id },
    );
    return c.json({ topic }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});
