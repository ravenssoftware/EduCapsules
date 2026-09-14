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
