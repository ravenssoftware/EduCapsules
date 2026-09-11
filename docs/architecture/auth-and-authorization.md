# Authentication & Authorization Architecture

**Source:** SRS §7 (Authorization Model — normative), §35 (Authentication & Login Sessions), §36 (Audit, Logging & Monitoring), SEC-001..018, AUTH-101..127, AUD-001..010

§7 is the section the whole SRS depends on, and it is not re-derived here — this document is the architecture that makes §7 mechanically true in code: where the pipeline lives, what each stage checks against, and how authentication (proving identity) and authorization (deciding what an identity may do) stay two separate, never-conflated concerns (SEC-003: "a valid authenticated Login Session shall not by itself grant access to any resource").

## 1. One pipeline, one location (SEC-001, SEC-002)

The eleven-stage decision (§7.1) — identity → session → tenant → role → scope → relationship → permission → entitlement → object state → constraint → audit — runs as a single, centralized policy engine in the `authz` module (`README.md` §5), invoked identically from every entry point: ordinary API routes, the Content Gateway, and background jobs acting under a service principal (`backend.md` §4). No route handler, no domain-service method, and no background job implements its own ad hoc check. Concretely:

- The pipeline is a function (or ordered chain of functions) that domain-layer callers invoke with `(principal, action, target)` and that returns an allow/deny decision plus the caller's authorized projection — never a boolean callers are trusted to interpret differently.
- A failure at any stage denies, fails closed, and is audited (§7.1's figure note, GEN-004) — there is no stage where "not yet checked" defaults to allow.
- Authorization is enforced server-side only; anything the client does (hiding a button, graying out a menu item) is presentation, carries no authority, and is never trusted as a substitute (SEC-002, GEN-024).

## 2. Authentication is stage 1 of 11, not the whole decision

AUTH-101..127 (§35) govern how a Login Session is established and maintained — this is necessary but never sufficient for access. Architecturally:

- **LoginSession is a distinct entity from TeachingSession** (§37.3.1) and from the Content Access Session (Table 35.1) — three different session concepts, never conflated in code or schema.
- **Session validity and authorization are independently enforced** (AUTH-112): a valid session gets a request into the pipeline at stage 2; every subsequent stage still runs on every request.
- **Five session types, one mechanism, different policy parameters** (Table 35.1: standard, admin, elevated, support-impersonation, content-access) — implemented as one session model with per-type timeout/MFA/monitoring policy, not five separate systems. The content-access session in particular is deliberately separate from the account session (Table 35.1's own note) — this is the architectural reason a stolen content URL is useless without a live, independently-scoped content-access ticket, which is what `storage-and-content.md`'s Content Gateway consumes.
- **Session credentials are never reusable across identity boundaries**: no cross-user, no cross-tenant session access (AUTH-118); a password change revokes existing sessions and issues a new one (AUTH-119); suspending an account terminates or restricts its sessions (AUTH-117).
- **MFA is a first-class recovery-aware feature, not just an enrolment checkbox** (AUTH-116, AUTH-127, added in the v1.1 audit): a lost MFA factor must have a defined recovery path (single-use backup codes, or admin-assisted reset after identity verification), and both recovery-code use and admin-assisted reset raise a security-relevant audit event and a NOT-012 notification.
- **Session timeout values are explicitly TBD** (Table 35.3, D-14) — the architecture parameterizes idle/absolute timeout per role rather than hard-coding a value, so this stays a config change when §50 security testing sets the final numbers. Nothing in Phase 1 fixes these numbers.

## 3. Scope model (§7.3, SEC-011)

Scopes nest — Organization ⊃ {Classroom ⊃ Group, Subject ⊃ Course ⊃ Cycle} — and a grant at scope S applies to S and everything S contains, never to a parent or sibling. This is implemented as a scope-containment check the pipeline's "scope" stage evaluates structurally (walking the containment relationship recorded in the academic-structure module's tables — `Classroom.academic_period_id`, `Group.classroom_id`, `Course.subject_id`, `Cycle.course_id`), not as a flat list of scope strings compared for equality. A single `AssistantAssignment` may combine a cohort scope and a content scope; the pipeline requires the caller to satisfy every scope named on the grant, not any one of them.

## 4. Relationship-based authorization (§7.4, SEC-012..015)

Four relationships are re-verified on every request, never cached client-side and never trusted from a prior check:

| Relationship | Verified against | Requirement |
|---|---|---|
| Parent → Student | `ParentLink.status = ACTIVE` | SEC-012 |
| Teacher → Classroom/Course | ownership or org role assignment | SEC-013 |
| Assistant → Assignment | `AssistantAssignment` active, unexpired, and the delegating Teacher still holds the permission | SEC-014 |
| Student → Classroom/Group | active `Membership` row | SEC-015 |

The Assistant case is the one with a temporal dependency on another principal's current authority: SEC-014 requires checking, at request time, that the delegating Teacher still holds the delegated permission in an equal-or-wider scope — a Teacher losing a permission silently invalidates every Assistant delegation drawn from it, without a separate cleanup step. This is what SEC-006/§7.6 ("no privilege amplification") requires structurally: a grant is only ever as good as the granter's *current* authority, evaluated live.

## 5. Entitlement — a separate, later stage (§7.5, SEC-016..018)

Entitlement answers "has this user paid for or been granted *this* content?" — a different question from authorization's "may this user access things of this kind?" — and is evaluated after authorization, server-side, at the point of content delivery (never cached client-side, per SEC-018). An expired or revoked Entitlement denies new content access while leaving academic history intact (SEC-017) — revoking payment access to a course never deletes or hides the grades already earned in it. This is the stage the Content Gateway (`storage-and-content.md`) consults on every protected-content request; it is not folded into the role/scope/relationship stages because it changes independently of them (a subscription lapsing doesn't change a Teacher's role or a Student's classroom membership).

## 6. No privilege amplification (§7.6) and identifier possession is not authorization (§7.7)

Two structural rules the pipeline enforces, not conventions left to reviewers:

- **SEC-006**: a permission grant can never exceed the granting user's own permissions at that scope; permissions marked non-delegatable (§26.3) can never be passed on at all. The pipeline's permission stage checks the grantor's current authority at grant-evaluation time (not just at grant-creation time), so a Teacher who later loses a permission cannot have "already" delegated something they no longer hold.
- **GEN-025**: no user accesses or modifies a resource solely because they know its identifier. This is why the pipeline's object-state stage (SEC-005) verifies the caller's relationship to the *specific target object*, not merely to objects of that type — a request for `GET /submissions/{id}` is authorized against that submission's actual student/course/organization, never merely against "the caller may read submissions." This is the same principle DB-002 (`database.md` §3) supports at the identifier-design level (non-guessable external ids) — two independent layers defending against the same vulnerability class (IDOR/BOLA), deliberately redundant.

## 7. Denial behavior (SEC-009)

A denial never discloses whether the resource exists (§40.3, error-handling architecture — referenced, not re-specified here): an unauthorized request for someone else's submission and a request for a submission id that doesn't exist return the same shape of response. This is enforced at the pipeline boundary, not left to each route handler to remember.

## 8. Audit is not optional and not bypassable (§36, AUD-001..010)

- Every security- or record-significant action raises an audit event (AUD-001), capturing actor, actor role, action, target, organization/scope, outcome, timestamp, reason (where applicable), before/after values (where applicable), device/IP/session metadata, and a correlation id (AUD-002) — this is the same correlation id the Transport layer assigns per request (`backend.md` §1), propagated through so a background job triggered by a request is traceable back to it.
- Audit records are append-only and tamper-resistant at the database-privilege level (AUD-004, DB-004 — `database.md` §4): no application role, including Admin, has an `UPDATE`/`DELETE` grant on `AuditLog`.
- Audit records remain attributable after an account is deactivated or deleted (AUD-005) — a hard-deleted user's audit trail is not deleted with them; this constrains the erasure pipeline (§44, deferred to Phase 25) to anonymize the actor reference rather than remove the row.
- The catalogue in Table 36.2 (authentication, access-control, academic, content/storage, commercial, administration, legal event families) is the audited-event contract every module implements against; a module emitting a consequential change without an audit event is a defect, same severity class as a missing authorization check.

## 9. What this document does not decide

The concrete session-token mechanism (opaque server-side session vs. signed JWT with revocation list), the specific MFA factor types beyond what AUTH-116/126 already fix (TOTP first-class; passkeys/hardware keys/SSO explicitly FUTURE per AUTH-126), and the session-timeout numeric values (Table 35.3, D-14) are implementation or Project-Owner decisions outside Phase 1's architecture scope — none of them change the pipeline's shape, only its parameters or its stage-1 credential mechanics.
