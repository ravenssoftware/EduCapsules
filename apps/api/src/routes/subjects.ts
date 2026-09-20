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

/** /api/v1/subjects (SRS §10, SUB-*). Course creation is nested — see ../routes/courses.js's POST /subjects/:id/courses. */

export const subjects = new Hono<AppEnv>();

subjects.use("*", requireSession());

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

subjects.get("/", async (c) => {
  const session = c.get("session")!;
  const list = await service.listSubjects(deps(c), {
    organizationId: session.organizationId,
    userId: session.userId,
  });
  return c.json({ subjects: list });
});

subjects.get("/:id", async (c) => {
  const session = c.get("session")!;
  try {
    const subject = await service.getSubject(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
    );
    return c.json({ subject });
  } catch (err) {
    throw toHttpException(err);
  }
});

subjects.post("/", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const name = typeof body["name"] === "string" ? body["name"] : "";
  const code = typeof body["code"] === "string" ? body["code"] : null;
  const description = typeof body["description"] === "string" ? body["description"] : null;

  try {
    const subject = await service.createSubject(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      { name, code, description },
      { loginSessionId: session.id },
    );
    return c.json({ subject }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

subjects.patch("/:id", async (c) => {
  const session = c.get("session")!;
  const body = await readJsonBody(c.req.raw);
  const patch: {
    name?: string;
    code?: string | null;
    description?: string | null;
    status?: "active" | "archived";
  } = {};
  if (typeof body["name"] === "string") patch.name = body["name"];
  if (typeof body["code"] === "string" || body["code"] === null) {
    patch.code = body["code"] as string | null;
  }
  if (typeof body["description"] === "string" || body["description"] === null) {
    patch.description = body["description"] as string | null;
  }
  if (body["status"] === "active" || body["status"] === "archived") patch.status = body["status"];

  try {
    const subject = await service.updateSubject(
      deps(c),
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      patch,
      { loginSessionId: session.id },
    );
    return c.json({ subject });
  } catch (err) {
    throw toHttpException(err);
  }
});
