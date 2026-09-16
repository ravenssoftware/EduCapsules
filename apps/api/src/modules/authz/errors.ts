/**
 * Domain-layer authorization errors — no Hono/HTTP types here (BE-002),
 * same split as ../auth/errors.ts.
 *
 * `not_found` vs `forbidden` encodes SEC-009 ("Denials shall not disclose
 * whether the resource exists") directly in the type: any check against a
 * *specific existing-or-not object* (an `objectId` was supplied to
 * `authorize()`) denies as `not_found` — identical to a genuinely
 * nonexistent id — never `forbidden`, which would itself leak "it's there,
 * you just can't see it." `forbidden` is reserved for checks that aren't
 * about a specific object's existence at all (e.g. "create a classroom" —
 * there is nothing to disclose the existence of).
 */
export type AuthzErrorCode = "forbidden" | "not_found" | "validation_failed";

export class AuthzDomainError extends Error {
  readonly code: AuthzErrorCode;

  constructor(code: AuthzErrorCode, message: string) {
    super(message);
    this.name = "AuthzDomainError";
    this.code = code;
  }
}

export const AUTHZ_ERROR_STATUS: Record<AuthzErrorCode, number> = {
  forbidden: 403,
  not_found: 404,
  validation_failed: 422,
};
