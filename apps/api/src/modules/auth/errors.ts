/**
 * Domain-layer auth errors — no Hono/HTTP types here (BE-002). The routes
 * layer (routes.ts) maps `code` to an HTTP status and an RFC 9457
 * problem-detail body; this module only ever says *what* went wrong in
 * domain terms.
 *
 * `code` values are deliberately coarse where the SRS requires it:
 * `invalid_credentials` covers "no such user", "wrong password" AND
 * "account not yet verified enough to say more" alike (AUTH-122 — a login
 * failure must not reveal which of those was true). Anything needing a
 * finer-grained internal reason logs it to security_events/audit_log, not
 * to the client-visible error.
 */
export type AuthErrorCode =
  | "invalid_credentials"
  | "account_locked"
  | "account_not_active"
  | "email_not_verified"
  | "mfa_required"
  | "admin_mfa_setup_required"
  | "mfa_invalid"
  | "session_invalid"
  | "token_invalid"
  | "email_already_registered"
  | "validation_failed"
  | "rate_limited";

export class AuthDomainError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthDomainError";
    this.code = code;
  }
}

/** Single source of truth for code -> HTTP status, shared by the routes layer and the session middleware so the two never drift. */
export const AUTH_ERROR_STATUS: Record<AuthErrorCode, number> = {
  invalid_credentials: 401,
  account_locked: 423,
  account_not_active: 403,
  email_not_verified: 403,
  mfa_required: 401,
  admin_mfa_setup_required: 403,
  mfa_invalid: 400,
  session_invalid: 401,
  token_invalid: 400,
  email_already_registered: 409,
  validation_failed: 422,
  rate_limited: 429,
};
