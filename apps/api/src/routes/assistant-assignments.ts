import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { PermissionKey } from "@educapsules/shared";
import type { AppEnv } from "../types.js";
import { ipHashFromRequest, requireSession } from "../modules/auth/middleware.js";
import { AUTHZ_ERROR_STATUS, AuthzDomainError } from "../modules/authz/errors.js";
import * as assistantsService from "../modules/authz/assistants.js";
import type { ScopeType } from "../modules/authz/scope.js";

/**
 * /api/v1/assistant-assignments (§21 AST-*) — the Assistant delegation
 * lifecycle. Every route requires an authenticated session; the
 * non-amplification and role checks live in ../modules/authz/assistants.ts,
 * never duplicated here.
 */

export const assistantAssignments = new Hono<AppEnv>();

assistantAssignments.use("*", requireSession());

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

const SCOPE_TYPES: ScopeType[] = ["CLASSROOM", "GROUP", "SUBJECT", "COURSE", "CYCLE"];

function parseScopes(
  body: Record<string, unknown>,
): Array<{ scopeType: ScopeType; scopeId: string }> {
  const raw = body["scopes"];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HTTPException(422, { message: '"scopes" must be a non-empty array.' });
  }
  return raw.map((entry) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as Record<string, unknown>)["scopeType"] !== "string" ||
      typeof (entry as Record<string, unknown>)["scopeId"] !== "string"
    ) {
      throw new HTTPException(422, { message: "Each scope requires scopeType and scopeId." });
    }
    const e = entry as { scopeType: string; scopeId: string };
    if (!SCOPE_TYPES.includes(e.scopeType as ScopeType)) {
      throw new HTTPException(422, { message: `Invalid scopeType "${e.scopeType}".` });
    }
    return { scopeType: e.scopeType as ScopeType, scopeId: e.scopeId };
  });
}

function parsePermissionKeys(body: Record<string, unknown>): PermissionKey[] {
  const raw = body["permissionKeys"];
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every((k) => typeof k === "string")) {
    throw new HTTPException(422, {
      message: '"permissionKeys" must be a non-empty array of strings.',
    });
  }
  return raw as PermissionKey[];
}

assistantAssignments.post("/", async (c) => {
  const session = c.get("session")!;
  const repo = c.get("authzRepository");
  const body = await readJsonBody(c.req.raw);

  const assistantUserId = body["assistantUserId"];
  if (typeof assistantUserId !== "string" || assistantUserId.length === 0) {
    throw new HTTPException(422, { message: '"assistantUserId" is required.' });
  }
  const scopes = parseScopes(body);
  const permissionKeys = parsePermissionKeys(body);
  const validUntil =
    typeof body["validUntil"] === "string" ? new Date(body["validUntil"] as string) : null;

  try {
    const assignment = await assistantsService.createAssistantAssignment(
      repo,
      { organizationId: session.organizationId, userId: session.userId },
      { assistantUserId, scopes, permissionKeys, validUntil },
      { ipHash: await ipHashFromRequest(c) },
    );
    return c.json({ assignment }, 201);
  } catch (err) {
    throw toHttpException(err);
  }
});

assistantAssignments.get("/", async (c) => {
  const session = c.get("session")!;
  const repo = c.get("authzRepository");
  const assignments = await repo.listAssistantAssignmentsForTeacher(
    session.organizationId,
    session.userId,
  );
  return c.json({ assignments });
});

assistantAssignments.get("/delegated-to-me", async (c) => {
  const session = c.get("session")!;
  const repo = c.get("authzRepository");
  const assignments = await repo.listAssistantAssignmentsForAssistant(
    session.organizationId,
    session.userId,
  );
  return c.json({ assignments });
});

assistantAssignments.delete("/:id", async (c) => {
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
    await assistantsService.revokeAssistantAssignment(
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
