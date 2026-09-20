# Authorization — Phase 5 Implementation

**Status:** Phase 5 (Roles, Permissions & Authorization), implemented.
**Source of truth:** Master SRS v1.0 §6 (Actors & Roles), §7 (Authorization Model — normative), §9 (Classroom/Group structural rules), §21 (Assistant Experience & Delegation), §22 (Parent Experience & Linking), §26 (Permission Catalogue & Matrix), plus `docs/architecture/auth-and-authorization.md` (Phase 1 — normative on the pipeline's *shape*; this document covers what that one deliberately left as "not decided here", §9, now resolved).

This document records what Phase 5 actually built. It does not restate SRS text; see the SRS sections above for the normative requirements themselves.

## 1. Scope

Per the Phase 0 roadmap's own phase map (`docs/decisions/03-implementation-roadmap.md` §2, Phase 5 row): `apps/api/src/modules/authz/` is "the centralized policy engine — §7.1's pipeline lives here and nowhere else," covering §6/§7/§9/§21/§22/§26. Table §26.3/§26.4's platform-governance sub-roles (Platform Owner, Super, Security, Support, Billing, Moderation — SRS §23) are the roadmap's own later **Administration** phase, not this one — Phase 5 seeds their permission *codes* (the catalogue is closed and global per §26.1) but builds no role, endpoint, or workflow for them. The single tenant-scoped ADMIN system role (one of GEN-006's five) gets a conservative, individually-justified subset instead — see §3.

No business/content feature (Homework, Quiz, Grade, Achievement, etc.) is built here — none of those entities exist in this codebase yet. A minimal Classroom read/manage surface (`apps/api/src/modules/classrooms/`, `apps/api/src/routes/classrooms.ts`) exists solely to prove the pipeline end-to-end against a real protected resource; it is explicitly not the real academic-structure module Phase 6 owns.

## 2. Two SRS textual issues found, resolved by internal consistency (not silently, and not blocking)

- **§21.1 cross-reference**: states an AssistantAssignment's `permissions[]` are drawn from "§26.3" — but §26.3 is the *administrative* catalogue, has no "Delegatable to Assistant?" column, and AST-004 independently forbids an Assistant ever holding an administrative permission. §26.2 is unambiguously the intended source (it has exactly that column, for exactly this purpose). Read as a cross-reference typo; implemented against §26.2.
- **ParentLink "ACTIVE"**: §7.4/SEC-012 say "ParentLink.status = ACTIVE," but the entity's own state machine (§45.3, §37.3.1) is `REQUESTED -> CONFIRMED -> (REVOKED)` — no `ACTIVE` state exists. Read "ACTIVE" as a prose synonym for "currently in force" — i.e. `status = 'confirmed' AND revoked_at IS NULL` — not a fourth enum value.

## 3. Permission catalogue and role grants (§26)

`permissions`/`role_permissions`/`user_role_assignments` already existed as empty tables from Phase 3 — Phase 5 is the first phase to put data in them. The full catalogue (all of §26.2's ~41 educational codes and §26.3's 20 administrative codes) is seeded as data — `packages/shared/src/permissions.ts` is the single source of truth, imported by both the seed script and the authz module's own type (`PermissionKey`), so a route can never ask for a permission the catalogue doesn't recognise.

Baseline grants (`packages/db/src/seed/data.ts`'s `rolePermissionRows()`):

- **TEACHER** — every §26.2 code. Table 26.1's own "Default holder" column names Teacher for every single row, with no exceptions.
- **ADMIN** — a deliberately conservative §26.3 subset: `USER_VIEW`/`USER_SUSPEND`/`USER_RESTORE`, `ORG_VIEW`/`ORG_MANAGE` (ORG-007), `AUDIT_VIEW`, `GRADING_SCALE_MANAGE` (GRD-019 names this explicitly for "the Admin capacity of an independent Teacher's own Organization"). The remaining §26.3 codes (billing, security response, content moderation, system config, impersonation, private-data access) are §23's platform-governance sub-roles' territory, not this tenant-scoped role's — granting them here would invent authority the SRS attributes to a different, not-yet-built actor category.
- **STUDENT / PARENT** — no catalogue grants at all. Their access is entirely relationship-based (§7.4: Membership, ParentLink respectively), never permission-based.
- **ASSISTANT** — no *static* role grant either. Every permission an Assistant ever holds comes from their own AssistantAssignment (§7.4: "Assistant -> Assignment: exactly the delegated permissions"); a static grant would silently give every Assistant everywhere access, contradicting GEN-006 ("being an Assistant, on its own, grants nothing").

**A defect this asymmetry caught during testing, fixed**: a role assignment that resolves to zero permissions (which is *every* STUDENT/PARENT/ASSISTANT assignment, by the design above) must never itself count as a "relationship" for the plain visibility check either — the pipeline's role-source resolution (`authz/service.ts`'s `resolveDirectAuthority`) skips any role assignment whose permission set is empty. Without this, a Student or Parent holding the ordinary org-wide STUDENT/PARENT role assignment (their normal shape, since their authority isn't scope-bound the way a Teacher's is) would satisfy `grantCoversTarget` for *every* scope in the organization purely because an ORG-scoped grant structurally covers everything — a real, caught-by-the-test-suite blanket-visibility leak, not a hypothetical one.

## 4. The pipeline (§7.1)

`apps/api/src/modules/authz/service.ts`'s `authorize(repo, principal, target, now, options?)` is the one function every protected route calls (directly, or via `requirePermission()`/`requireRelationship()` middleware). It resolves every currently-applicable **authority source** for the principal against the target's scope, then either:

- requires at least one source whose `permissionKeys` include the specific requested `PermissionKey` (a mutating action), or
- requires at least one source at all, of any kind (a plain visibility/relationship check — no specific permission).

Fails closed unconditionally: any resolution error, or zero matching sources, denies. There is no code path where "couldn't determine" defaults to allow (§7.1's own figure note, GEN-004).

**Tenant isolation is structural, not a checked stage that could be forgotten** (SEC-004): `Principal.organizationId` always comes from the caller's already-validated session (`../auth`'s `requireValidSession()`), never from any client-supplied field. No function in this module accepts an organization id from anywhere else — there is no `organizationId` parameter on `AuthzTarget` at all.

Authority source kinds, each independently resolved and then unioned:

| Kind | Source | Grants |
|---|---|---|
| `role` | An ACTIVE `UserRoleAssignment` whose scope covers the target, filtered to roles that hold at least one permission (§3) | That role's `role_permissions` set |
| `teacher_ownership` | `classrooms.homeroom_teacher_id` / `courses.owner_teacher_id` matching the caller, **and** the caller currently holds an active TEACHER role assignment somewhere | The TEACHER role's full permission set, scoped to that specific classroom/course |
| `student_membership` | An active `Membership` row for the caller against the target classroom/group (SEC-015) | Visibility only — no catalogue permissions (§6.1: Student holds none) |
| `parent_link` | A CONFIRMED, not-revoked `ParentLink` (§3.2) to a student who has an active Membership covering the target (SEC-012) | Visibility only, transitively through the linked child |
| `assistant_assignment` | An ACTIVE, unexpired `AssistantAssignment` whose recorded scopes all cover the target (§7.3), intersected live with the delegating Teacher's *current* authority (SEC-014, §5) | The intersection of the assignment's delegated set and the Teacher's currently-held set |

**Scope containment** (`authz/scope.ts`) walks two independent trees (Figure 9.1): cohort (`ORG > CLASSROOM > GROUP`) and content (`ORG > SUBJECT > COURSE > CYCLE`), meeting only at ORG. A grant at a wider scope covers everything it contains; it never leaks to a parent or sibling (SEC-011).

**Entitlement (§7.5, SEC-016..018) is a deliberate, documented no-op** — no Entitlement/subscription/commercial entity exists yet in this codebase (a later, not-yet-built phase's concern). There is nothing to check against; this is stated here rather than silently skipped.

## 5. Assistant delegation (§21, AST-*)

`apps/api/src/modules/authz/assistants.ts` owns the full lifecycle — never done ad hoc from a route handler, so the non-amplification check can never be bypassed by a caller that forgot to run it.

- **Scope-as-a-set, not a single pair**: §7.3 explicitly allows combining a cohort scope and a content scope in one assignment ("the caller must satisfy every scope named on the grant"). A single `scope_type`/`scope_id` column (as `UserRoleAssignment` has) cannot represent that; `assistant_assignment_scopes` is a child table instead, and every recorded row must independently cover the target on its own tree.
- **The SRS's `PermissionGrant` entity** (Table 37.2: "chiefly used for assistant delegation") is realised as `assistant_assignment_permissions` — a join table on AssistantAssignment, the same shape Phase 3 already established for `role_permissions` — rather than a second, more generic freestanding grant entity Phase 5 has no other confirmed use for.
- **No privilege amplification (SEC-006/GEN-025)**: at creation time, for *every* (scope, permission) pair being delegated, the delegating Teacher's own current authority is re-checked by calling `authorize()` for that exact pair — the same pipeline every ordinary request goes through, not a separate, weaker check.
- **Live re-verification (SEC-014)**: this is not only a creation-time check. Every time an Assistant's request is authorized, the delegating Teacher's *current* authority is re-resolved (non-recursively — only role/ownership sources, never the Teacher's own possible delegated authority, since a delegation chain isn't a real feature) and intersected with the assignment's nominal permission set. A permission the Teacher has since lost silently drops out of what the Assistant may use that request, with no separate cleanup step — verified by a dedicated test that revokes the Teacher's authority mid-suite without ever touching the AssistantAssignment row.
- **Expiry is evaluated at authorisation time** (AST-006/AST-007), by comparing `valid_until` against the current request's timestamp — never by a background job flipping `status`. A verified test confirms an expired assignment denies access while its stored `status` remains `'active'` indefinitely.
- **Revocation** (AST-007) is immediate — an UPDATE of `status`/`revoked_at`, never a delete, preserving the historical row and its attribution. Permitted for the delegating Teacher or an Admin, symmetric with ParentLink's PAR-006 (§6). Revoking an already-revoked assignment 404s, matching SEC-009's denial-hides-existence treatment.
- **Non-delegatable permissions are rejected outright** (AST-004): only §26.2 rows marked `isDelegatable: true` may ever appear on an assignment — never a §26.3 code, and never one of §26.2's own structurally-non-delegatable rows (`CREATE_ACHIEVEMENT`, `ADJUST_POINTS`, `MANAGE_STORAGE_PERMISSIONS`, `ASSIGN_ASSISTANT`).
- **AST-001**: the target account must currently hold the ASSISTANT role — checked at creation time, not assumed.
- Every grant and revocation is audited (AST-005), visible to the delegating Teacher.

## 6. ParentLink (§22, PAR-*)

`apps/api/src/modules/authz/parent-links.ts` owns `REQUESTED -> CONFIRMED -> (REVOKED)` (§45.3). A REQUESTED link grants nothing (PAR-002) — enforced structurally, not by convention: `authz/service.ts`'s relationship resolution only ever reads `status = 'confirmed'`, never `'requested'`.

- **Request**: either the parent themselves (self-service, must hold the PARENT role) or a Teacher/Admin acting on their behalf. Both the target parent and target student are validated to actually hold the PARENT/STUDENT role, respectively, in the caller's own organization — a cross-organization request is rejected as validation failure, never silently attempted.
- **Confirm** (PAR-002): only a Teacher or Admin — never the parent confirming their own claim, which would defeat "an explicit, verified process."
- **Revoke** (PAR-006): only a Teacher or Admin, takes effect immediately — verified by a test that revokes a link mid-session and confirms the parent's access stops on the very next request.
- Every issuance, confirmation and revocation is audited (PAR-009).

## 7. Denial semantics (SEC-009)

Every `AuthzDomainError` carries one of two codes, chosen by whether the check concerned a specific, already-identified object:

- **`not_found` (404)** — the target carried an `objectId` (e.g. `GET /classrooms/:id`). Indistinguishable from the object genuinely not existing — a real classroom the caller has no relationship to and a nonexistent classroom id return the exact same status, verified by a dedicated test.
- **`forbidden` (403)** — no specific object's existence is in question (e.g. "create an AssistantAssignment I'm not entitled to grant," "confirm a ParentLink without the right role"). There is nothing to disclose the existence of.

List endpoints (`GET /classrooms`) never error on a per-item denial — each candidate is independently authorized and silently omitted, the list-shaped equivalent of a single object's 404.

## 8. Audit (SEC-010, AUD-001)

The pipeline's `authorize()` call itself does **not** write an audit_log row on every invocation — ordinary reads are not "record-significant," matching how Phase 4's `requireValidSession()` doesn't audit every authenticated request either. What *is* audited: every AssistantAssignment grant/revocation (AST-005), every ParentLink request/confirmation/revocation (PAR-009), and the demonstrator's own classroom mutation (`CLASSROOM_UPDATED`) — the write actions, and the access-control lifecycle events, not every read.

## 9. Open items / known limitations (reported, not silently absorbed)

- **No admin-role-granting or admin-suspend UI** (carried over from Phase 4's own note) — ADMIN's permission grants work correctly wherever the role is held, but nothing in this codebase yet lets one user grant it to another.
- **§23/§26.3-4's platform-governance sub-roles are entirely out of scope** — see §1. `PRIVATE_DATA_ACCESS`, `IMPERSONATE_USER`, billing, security-response and moderation codes exist as catalogue data only; nothing consumes them.
- **`student_membership` does not additionally gate on holding the STUDENT role** — SEC-015's literal text requires only an active Membership, not a role check; a stray Membership row for a non-Student user (not currently reachable — no self-service "join a classroom" endpoint exists) would grant visibility. Flagged for revisit if such an endpoint is ever added.
- **Assistant scope-set cross-tree intersection is unexercised** — an assignment combining a cohort scope (Classroom/Group) *and* a content scope (Course/Cycle) is supported structurally (every recorded scope row must independently cover the target on its own tree), but no content-bearing resource exists yet to test the intersection semantics against; only the Classroom demonstrator is covered.
- **No real business resource yet** — the Classroom read/manage surface is a deliberately narrow demonstrator (§1), not academic-structure's real API (Phase 6's).
- **Entitlement stage is a no-op** — §4.

## 10. Testing approach

Real-engine integration tests (`apps/api/src/routes/authz.test.ts`) drive the actual HTTP surface (`app.request(...)`) against an in-memory SQLite database migrated with the real generated migrations, seeded with the real permission catalogue and role grants (the same functions the production seed script uses) — the same pattern `auth.test.ts` established. Every role × relationship combination, cross-organization access, IDOR-style object-id guessing, forged client-supplied identity fields, delegation non-amplification, live re-verification, expiry, and revocation race are each a dedicated test, not folded into a single happy-path assertion.
