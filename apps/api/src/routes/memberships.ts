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

/**
 * /api/v1/memberships (SRS §9, CLS-009/010, PER-003) — Classroom/Group
 * membership, and the explicit move-student operation BR-015 describes
 * ("moving a student ends one membership and creates another").
 */

export const memberships = new Hono<AppEnv>();

memberships.use("*", requireSession());

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

memberships.get("/", async (c) => {
  const session = c.get("session")!;
  const containerType = c.req.query("containerType");
  const containerId = c.req.query("containerId");
  if (
    (containerType !== "classroom" && containerType !== "group") ||
    typeof containerId !== "string" ||
    containerId.length === 0
  ) {
    throw new HTTPException(422, {
      message: 'Query params "containerType" (classroom|group) and "containerId" are required.',
    });
  }

  try {
    const list = await service.listMemberships(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      containerType,
      containerId,
    );
    return c.json({ memberships: list });
  } catch (err) {
    throw toHttpException(err);
  }
});

memberships.post("/", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const userId = typeof body["userId"] === "string" ? body["userId"] : "";
  const containerType = body["containerType"];
  const containerId = typeof body["containerId"] === "string" ? body["containerId"] : "";
  const roleInContainer =
    typeof body["roleInContainer"] === "string" ? body["roleInContainer"] : null;
  if (containerType !== "classroom" && containerType !== "group") {
    throw new HTTPException(422, { message: '"containerType" must be "classroom" or "group".' });
  }

  try {
    const membership = await service.addMembership(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      { userId, containerType, containerId, roleInContainer },
      { loginSessionId: session.id },
    );
    return c.json({ membership }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

memberships.post("/move", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const userId = typeof body["userId"] === "string" ? body["userId"] : "";
  const toClassroomId = typeof body["toClassroomId"] === "string" ? body["toClassroomId"] : "";

  try {
    const membership = await service.moveStudent(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      { userId, toClassroomId },
      { loginSessionId: session.id },
    );
    return c.json({ membership });
  } catch (err) {
    throw toHttpException(err);
  }
});

memberships.delete("/:id", async (c) => {
  const session = c.get("session")!;
  try {
    await service.endMembership(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { loginSessionId: session.id },
    );
    return c.json({ status: "ended" });
  } catch (err) {
    throw toHttpException(err);
  }
});
