import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { PermissionKey } from "@educapsules/shared";
import { AUTHZ_ERROR_STATUS, AuthzDomainError } from "./errors.js";
import { authorize, type AuthzTarget } from "./service.js";
import type { AppEnv } from "../../types.js";

/**
 * Stage 2+ of the §7.1 pipeline — runs strictly after ../auth's
 * `requireSession()` (stage 1: who is this bearer token). This module never
 * re-derives identity itself; it only reads the already-validated
 * `session` the auth middleware set, per SEC-003 ("A valid authenticated
 * Login Session shall not by itself grant access to any resource") — a
 * missing `session` here is a route-wiring bug, not a case this middleware
 * tries to paper over, so it throws rather than silently allowing.
 */

type TargetResolver = (c: Context<AppEnv>) => Promise<AuthzTarget> | AuthzTarget;

function requireSessionPrincipal(c: Context<AppEnv>) {
  const session = c.get("session");
  if (!session) {
    throw new Error(
      "requirePermission()/requireRelationship() used without requireSession() first.",
    );
  }
  return { organizationId: session.organizationId, userId: session.userId };
}

/** Requires the caller to hold `permissionKey` covering the resolved target's scope — the permission stage of §7.1. */
export function requirePermission(
  permissionKey: PermissionKey,
  resolveTarget: TargetResolver,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const principal = requireSessionPrincipal(c);
    const repo = c.get("authzRepository");
    const target = await resolveTarget(c);
    try {
      await authorize(repo, principal, target, new Date(), { permissionKey });
    } catch (err) {
      if (err instanceof AuthzDomainError) {
        throw new HTTPException(AUTHZ_ERROR_STATUS[err.code] as 400, { message: err.message });
      }
      throw err;
    }
    await next();
  };
}

/** Requires only that the caller has SOME relationship to the resolved target's scope (role, ownership, Student membership, Parent link, Assistant assignment) — no specific catalogue permission. For read/visibility gating, not for mutating actions. */
export function requireRelationship(resolveTarget: TargetResolver): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const principal = requireSessionPrincipal(c);
    const repo = c.get("authzRepository");
    const target = await resolveTarget(c);
    try {
      await authorize(repo, principal, target, new Date());
    } catch (err) {
      if (err instanceof AuthzDomainError) {
        throw new HTTPException(AUTHZ_ERROR_STATUS[err.code] as 400, { message: err.message });
      }
      throw err;
    }
    await next();
  };
}
