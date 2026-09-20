import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types.js";
import { ipHashFromRequest, requireSession } from "../modules/auth/middleware.js";
import { AUTHZ_ERROR_STATUS, AuthzDomainError } from "../modules/authz/errors.js";
import * as parentLinksService from "../modules/authz/parent-links.js";

/**
 * /api/v1/parent-links (§22 PAR-*) — the Parent<->Student linking
 * lifecycle. REQUESTED -> CONFIRMED -> (REVOKED); every rule (who may
 * request/confirm/revoke) lives in ../modules/authz/parent-links.ts.
 */

export const parentLinks = new Hono<AppEnv>();

parentLinks.use("*", requireSession());

function toHttpException(err: unknown): HTTPException {
  if (err instanceof AuthzDomainError) {
    return new HTTPException(AUTHZ_ERROR_STATUS[err.code] as 400, { message: err.message });
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

function requireString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || value.length === 0) {
    throw new HTTPException(422, { message: `"${field}" is required.` });
  }
  return value;
}

parentLinks.post("/", async (c) => {
  const session = c.get("session")!;
  const repo = c.get("authzRepository");
  const body = await readJsonBody(c.req.raw);

  try {
    const link = await parentLinksService.requestParentLink(
      repo,
      { organizationId: session.organizationId, userId: session.userId },
      {
        parentUserId: requireString(body, "parentUserId"),
        studentUserId: requireString(body, "studentUserId"),
        relationship: requireString(body, "relationship"),
      },
      { ipHash: await ipHashFromRequest(c) },
    );
    return c.json({ link }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

parentLinks.post("/:id/confirm", async (c) => {
  const session = c.get("session")!;
  const repo = c.get("authzRepository");
  try {
    await parentLinksService.confirmParentLink(
      repo,
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      { ipHash: await ipHashFromRequest(c) },
    );
    return c.json({ status: "confirmed" });
  } catch (err) {
    throw toHttpException(err);
  }
});

parentLinks.delete("/:id", async (c) => {
  const session = c.get("session")!;
  const repo = c.get("authzRepository");
  const body = await c.req.raw
    .clone()
    .json()
    .catch(() => ({}) as Record<string, unknown>);
  const reason =
    typeof (body as Record<string, unknown>)["reason"] === "string"
      ? ((body as Record<string, unknown>)["reason"] as string)
      : null;

  try {
    await parentLinksService.revokeParentLink(
      repo,
      { organizationId: session.organizationId, userId: session.userId },
      c.req.param("id"),
      reason,
      { ipHash: await ipHashFromRequest(c) },
    );
    return c.json({ status: "revoked" });
  } catch (err) {
    throw toHttpException(err);
  }
});

parentLinks.get("/", async (c) => {
  const session = c.get("session")!;
  const repo = c.get("authzRepository");
  const links = await repo.listParentLinksForParent(session.organizationId, session.userId);
  return c.json({ links });
});

parentLinks.get("/for-student/:studentId", async (c) => {
  const session = c.get("session")!;
  const repo = c.get("authzRepository");
  const studentId = c.req.param("studentId");

  // GEN-025: only the student themselves, or staff (Teacher/Admin), may
  // list a given student's links — not an arbitrary authenticated caller
  // who happens to know the student's id.
  if (session.userId !== studentId) {
    const roles = await repo.activeUserRoleAssignments(
      session.organizationId,
      session.userId,
      new Date(),
    );
    if (!roles.some((r) => r.roleKey === "TEACHER" || r.roleKey === "ADMIN")) {
      throw new HTTPException(404, { message: "Not found." });
    }
  }

  const links = await repo.listParentLinksForStudent(session.organizationId, studentId);
  return c.json({ links });
});
