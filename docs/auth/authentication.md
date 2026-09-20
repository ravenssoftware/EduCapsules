# Authentication — Phase 4 Implementation

**Status:** Phase 4 (Identity & Authentication), implemented.
**Source of truth:** Master SRS v1.0 §35 (Authentication & Login Sessions), §36 (Audit), §44 (Account Lifecycle), §34.2 (SEC-023/024/030-032/034), §38 (API), plus `docs/architecture/auth-and-authorization.md` (Phase 1 — normative on the pipeline shape; this document covers what that one deliberately left as "not decided here", §9).

This document records what Phase 4 actually built. It does not restate SRS text; see the SRS sections above for the normative requirements themselves.

## 1. Identity model

`users` (Phase 3, extended in Phase 4) is the identity record: `id`, `organization_id`, `email` (unique per organization, never globally — DB-012), `password_hash`, `status`, `failed_login_count`, `locked_until`, `email_verified_at`, `mfa_enabled`. Account state follows the SRS's own state machine exactly (§44.1, §45.3): `pending → active → (suspended | locked | deactivated) → anonymised → purged`, enforced by a database CHECK constraint (`docs/database/schema-overview.md` §6). Only `pending`, `active`, `suspended`, and `locked` are reachable by any Phase 4 code path — `deactivated`/`anonymised`/`purged` are reserved for the account-deletion pipeline (§44.2, Phase 25).

## 2. Portability decisions (flagged per the Phase 4 instruction, not silently resolved)

- **Password hashing — Argon2id via `hash-wasm`, not a native binding.** SEC-023 requires Argon2id (bcrypt acceptable). The obvious choices — the `argon2` or `bcrypt` npm packages — are native (N-API) addons: they cannot run inside a Cloudflare Workers isolate at all (no native code loading), which is exactly the MVP runtime CON-01 requires and `docs/architecture/backend.md` §5/§6 protects against. `hash-wasm` is pure WebAssembly and runs identically under Node (today's actual runtime, per `server.ts`) and Workers (the not-yet-wired-up eventual target) with no code change. Verified against a Postgres/SQLite-agnostic unit suite; RFC-vector-checked (see §4).
- **Session token mechanism — an opaque, server-side, hash-stored credential, not a JWT.** `docs/architecture/auth-and-authorization.md` §9 explicitly left this open ("not Phase 1's architecture scope"). A signed JWT would need its own revocation list to satisfy AUTH-105 (server-side revocation) and AUTH-109 (individual session revocation) anyway, at which point it is no longer meaningfully stateless — so this implementation uses a single mechanism throughout: a cryptographically random opaque token (Web Crypto `getRandomValues`, base64url), only its SHA-256 hash ever persisted (AUTH-103), matching the SRS's own `LoginSession` entity shape (Table 37.2) directly rather than inventing a parallel token format.
- **TOTP's HMAC — Web Crypto, not `node:crypto`.** Same reasoning as password hashing: `crypto.subtle` is available natively in both Node 22 and Workers; `node:crypto` is Node-specific (Workers' `nodejs_compat` support for it is partial and not something to depend on for a security primitive).
- **MFA secret storage — application-managed AES-256-GCM, not a real secrets manager.** Table 37.2 states the `MfaFactor` table "stores a reference, never the secret itself," implying an external secret manager. None exists yet in this project (SEC-034/INF-008's eventual target — no phase before this one built one). Phase 4 encrypts the TOTP secret at rest with a server-held symmetric key (`MFA_SECRET_ENCRYPTION_KEY`, environment-only, never committed) via Web Crypto AES-GCM, isolated in `apps/api/src/modules/auth/crypto.ts`'s `aesGcmEncrypt`/`aesGcmDecrypt` so a real KMS/secrets-manager integration later replaces that one module, not every caller. This is a documented interim step, not a claim that SEC-034 is fully satisfied yet.

## 3. Authentication methods implemented

- **Email + password** (AUTH-121): registration → email verification (single-use, 24h-expiring token) → login. Passwords: Argon2id, ≥12 characters enforced at registration/reset/change, never logged (SEC-024 — verified by an integration test asserting the login response body never contains `passwordHash` or `argon2id`).
- **MFA — TOTP only** (AUTH-116, AUTH-126): RFC 6238, 30-second step, 6 digits, SHA-1 (the interop default every mainstream authenticator app assumes). Passkeys/hardware keys/SSO are explicitly FUTURE per AUTH-126 and are not implemented. Enrollment: generate secret → `otpauth://` provisioning URI (QR/manual entry) → confirm with a live code → 10 single-use recovery codes issued once (AUTH-127), hashed with SHA-256 (these are already-high-entropy machine-generated values, not memorized secrets, so Argon2id's slow-hash property protects against nothing extra here).
- **MFA is required, not merely offered, for administrative accounts** (AUTH-116). An active `ADMIN` role assignment routes login into the standard MFA-challenge path like any other `mfaEnabled` user and issues an `admin`-typed session with a stricter timeout policy — and, if that account has *not yet* enrolled MFA, login does not silently succeed: it issues a restricted `mfa_setup_required` session instead of a real one (see §4). `disableMfa()` also refuses to let an admin-role account drop back out of MFA once enrolled. There is still no user-facing "grant the ADMIN role" flow anywhere in this codebase yet (role assignment is currently only reachable via seed/migration/direct DB action — that UI is Phase 5 authorization territory), but the gate itself no longer depends on that flow existing.

## 4. Session model

One session concept — `login_sessions` (Table 37.2's `LoginSession`) — with per-type policy, not five separate systems (matching `docs/architecture/auth-and-authorization.md` §2's stated design):

| Session type | Idle timeout | Absolute timeout | Notes |
|---|---|---|---|
| `standard` | 60 min | 14 days | Student/Parent/Teacher/Assistant |
| `admin` | 15 min | 10 hours | AUTH-113's "stricter controls" |
| `mfa_pending` | 5 min | 5 min | Not a real session — see below |
| `mfa_setup_required` | 15 min | 15 min | Not a real session either — see below |

Table 35.3 marks the exact idle/absolute numbers **TBD pending D-14** (security testing); the values above are conservative points inside the SRS's own stated indicative bands ("30–60 min idle / 7–30 days absolute for students... 10–20 min / 8–12 hours for admins"), not invented numbers, and are trivially reconfigurable in `apps/api/src/modules/auth/sessions.ts`'s `SESSION_POLICY` once D-14 sets real values.

**`mfa_pending` is deliberately not a real session type from Table 35.1.** AUTH-110 requires that a pre-authentication credential is never reusable as an authenticated one. Rather than trust every future caller to remember to check `mfaVerifiedAt`, `requireValidSession()` (the general "is this bearer token logged in" check every protected route goes through) rejects a `mfa_pending` session outright, regardless of its own expiry — only `verifyMfaChallenge()` (which calls the lower-level `validateSessionToken()` directly) may consume it. Verified by a dedicated integration test ("the mfa_pending challenge token cannot be used as a regular authenticated session").

**`mfa_setup_required` is the same idea, applied to AUTH-116's admin-MFA gate.** When an ADMIN-role account authenticates correctly but has not yet enrolled MFA, login cannot simply refuse outright — enrolling MFA itself requires a session, and there is no other bootstrap path, so a hard refusal would permanently lock every such account out. Instead login issues this restricted session type, and `requireValidSession()` rejects it exactly like `mfa_pending` for every ordinary route *except* `/mfa/enroll` and `/mfa/confirm`, which opt in via `requireSession({ allowMfaSetup: true })`. Completing enrollment (`/mfa/confirm`) revokes the setup session and returns a freshly issued, real `admin` session in the same response, so the account never has to log in a second time. Verified by dedicated integration tests covering: the setup token being rejected on an ordinary route, the full enroll→confirm→upgraded-session path, and the old setup token no longer working once consumed.

**Rotation and reuse detection** (AUTH-110, AUTH-115): `POST /refresh` revokes the presented session (`revocation_reason='rotated'`) and issues a new one carrying `rotated_from_session_id` back to it. Presenting the already-rotated-away token again is treated as a reuse signal — the entire session family for that user is revoked and a `TOKEN_REUSE_DETECTED` security event is raised. Verified by an integration test that rotates a session, then replays the old token and confirms both the old *and* the newly-rotated token stop working.

## 5. Credential/session security controls

- **AUTH-103/AUTH-111**: no plaintext password or session/reset/verification token is ever persisted — only SHA-256 (tokens/codes) or Argon2id (passwords) hashes. Never present in a URL, a log line, or an API response.
- **AUTH-118**: every session/user lookup is scoped by `organization_id` (composite FK per DB-011) and, for session-by-id operations, additionally checked against the caller's own `user_id` — verified by a cross-user and a cross-tenant integration test each.
- **AUTH-119**: both password reset (via emailed token) and authenticated password change revoke every existing session for that user and issue a fresh trusted one.
- **AUTH-122 / enumeration resistance**: `login` and `password/forgot` return the same shape of response regardless of whether the submitted email is registered (verified by test); a non-existent user still runs a dummy Argon2id verify so response timing doesn't itself leak existence. Account-state disclosure (`account_locked`, `email_not_verified`) is intentionally more specific than "invalid credentials" but is reached **only after** the password has already verified correctly — a wrong-password guess against a real, unverified, or locked account still returns the same generic `invalid_credentials` as a guess against a non-existent email.
- **SEC-032 brute-force protection**: 10 consecutive failed attempts locks the account (`status='locked'`, `locked_until` 15 minutes out) and raises `LOGIN_BRUTE_FORCE`/`ACCOUNT_LOCKED` security events. The lock **self-clears** on the next login attempt after `locked_until` passes — a documented, deliberately minimal "defined recovery path" per the Phase 4 instruction to establish only the necessary foundation; there is no admin-initiated unlock endpoint yet (§7). In addition, `apps/api/src/modules/auth/progressive-delay.ts` adds real, capped, exponentially-growing latency to the failure response starting from the 3rd consecutive failed attempt against the same account — independent of both the lockout threshold and the IP-based rate limiter below, satisfying SEC-032/API-017's explicit "progressive delays" requirement rather than relying on the flat lockout threshold alone. Documented residual limitation: this delay is keyed on a real account's failed-attempt counter, so the AUTH-122 dummy-hash timing-normalization path for a non-existent email is not delayed the same way — a narrower, secondary timing signal than what `account_locked` (423) itself already discloses at attempt 10 regardless.
- **SEC-031/API-017 rate limiting**: an in-memory sliding-window limiter (`apps/api/src/modules/auth/rate-limit.ts`) in front of `/register`, `/login`, `/password/forgot`, `/password/reset`, and `/mfa/verify`, independent of the account-lockout mechanism. Every 429 also writes a `RATE_LIMIT_EXCEEDED` `security_events` row (API-018). **Known limitation**: in-memory state does not share across multiple backend instances — adequate for CON-02's current single-VPS-process production target, not for a horizontally-scaled deployment. Written behind a `RateLimiter` interface specifically so it can be swapped for the `Cache` port (`docs/architecture/backend.md` §5 — KV/Durable Objects for MVP, Redis for production) without touching callers, the same BE-008 adapter pattern used everywhere else in this codebase.

## 6. Account lifecycle behavior

Authentication respects every reachable account state: `pending` blocks login with `email_not_verified`; `suspended`/`deactivated` block with a generic `account_not_active`; `locked` blocks with `account_locked` (423) until the lock clears. No authentication code path can bypass a state check — verified by a dedicated test per state.

**AUTH-117**: this account-state check is not only enforced at login. `requireValidSession()` — the general check every protected route goes through — re-reads the account's current status on every request and rejects `session_invalid` the moment it is no longer `active`, regardless of how much of the session's own idle/absolute timeout remains. This is what actually restricts an already-issued session once its account is suspended (or otherwise deactivated) mid-session, rather than only blocking that account's *next* login attempt — verified by a dedicated test that suspends a user with a live session and confirms that session is rejected on its very next use. There is still no admin "suspend user" endpoint in this codebase (Phase 5 authorization territory), so today this state can only be produced directly at the database layer, but the restriction mechanism itself works however `status` ends up changed.

No email delivery exists in this codebase yet (`docs/architecture/backend.md` §1's Integration layer — a `MailSender` port is a later phase's concern, not built here). The raw email-verification and password-reset tokens are therefore returned directly in the API response **only when `NODE_ENV` is not `production`** (`isProduction()` gate in `apps/api/src/routes/auth.ts`), so local development and the automated test suite can exercise the full flow without a mail server. In production, these fields are always omitted from the response — the token exists only as its hash in the database until a real `MailSender` is wired up to deliver it out-of-band.

## 7. Open items / known limitations (reported, not silently absorbed)

- **No admin-role-granting UI** — AUTH-116's login-time and disable-MFA gates are enforced whenever an account holds an active ADMIN role assignment, but nothing in this codebase yet lets one user grant that role to another; today it is only reachable via seed/migration/direct DB action. That is Phase 5 authorization territory, not a gap in the gate itself.
- **SEC-032 recovery path is time-based only** — no admin-assisted unlock endpoint exists yet; a locked account must wait out the 15-minute window. Progressive delay (§5) raises the cost of automated brute-forcing before that threshold is reached, but does not replace the need for an eventual admin override.
- **No admin "suspend user" endpoint** — AUTH-117's session-restriction mechanism (§6) works whenever `status` becomes non-active, but nothing in this codebase yet lets an operator trigger that transition; today it can only be produced directly at the database layer. That endpoint is Phase 5 authorization/admin-tooling territory.
- **Progressive delay does not cover the non-existent-email path** — see §5's residual-limitation note.
- **Rate limiting is single-process, in-memory** — not yet backed by the `Cache` port; fine for the current single-VPS target, a real limitation once the backend scales horizontally.
- **No real secrets manager for MFA secrets** — see §2's third bullet.
- **No organization self-service/onboarding** — the Flutter client's `AuthGate` uses a placeholder constant `organizationId` (`apps/flutter/lib/app.dart`) since organization creation/selection is out of Phase 4's identity-and-authentication scope; it is not a security boundary (the server still scopes every request for real), just an incomplete client UX pending a later phase.
- **Session timeout values are provisional** pending D-14 (§4).

## 8. Local development setup

```bash
# Backend
cd apps/api
cp .env.example .env   # then set your own MFA_SECRET_ENCRYPTION_KEY (openssl rand -base64 32)
pnpm run dev            # SQLite by default; set DATABASE_URL in .env for Postgres

# Flutter client (not runnable/verifiable in this session's environment —
# no flutter/dart SDK available; written against Flutter 3.9 conventions,
# not yet exercised by `flutter analyze`/`flutter test` — see the Phase 4
# completion report's testing section for the explicit statement of this
# limitation)
cd apps/flutter
flutter pub get
flutter run -d windows   # or macos / linux
```

## 9. Testing approach

Real-engine integration tests (`apps/api/src/routes/auth.test.ts`) drive the actual HTTP surface (`app.request(...)`) against an in-memory SQLite database migrated with the real generated migrations — the same pattern `packages/db`'s own Phase 3 test suite established, not a mocked repository. Unit tests cover the cryptographic primitives independently, including two RFC known-answer vectors (SHA-256 and HMAC-SHA1) to catch an implementation bug the integration tests alone might paper over. See the Phase 4 completion report for the full list of scenarios covered and the actual test run results.
