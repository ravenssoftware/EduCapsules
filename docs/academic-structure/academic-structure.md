# Academic Structure — Phase 6 Implementation Record

**Source:** SRS §8.1 (Academic Periods), §9 (Classroom & Group), §10 (Subject · Course · Cycle · Topic), §37.3.2 (entity catalogue). Module: `apps/api/src/modules/academic-structure/` (`repository.ts`, `service.ts`, `errors.ts`), routed from `apps/api/src/routes/academic-periods.ts`, `classrooms.ts`, `groups.ts`, `memberships.ts`, `subjects.ts`, `courses.ts`, `cycles.ts`, `topics.ts`, `enrollments.ts`.

This document follows the same structure `docs/authz/authorization.md` established for Phase 5: scope, entity-by-entity implementation notes, business-rule enforcement mechanics, denial semantics, and an explicit "known limitations" section — reported, not silently absorbed.

## 1. Scope

Phase 6 turns Phase 3's structural schema and Phase 5's authorization pipeline into real CRUD and workflows for the ten academic-structure entities: AcademicPeriod, Classroom, Group, Membership, Subject, Course, CourseAudience, Cycle, Topic, Enrollment. No new tables were needed — all ten already existed from Phase 3 (`packages/db/src/schema/{sqlite,postgres}/academic-structure.ts`). Every mutating and every scope/object-identified read action calls the centralized `apps/api/src/modules/authz/service.ts`'s `authorize()` — this module adds no authorization logic of its own, only business rules and plain CRUD.

The Phase 5 `apps/api/src/modules/classrooms/` demonstrator (list/get/patch only, built solely to prove the authz pipeline end-to-end) is retired entirely and replaced by this module — see that file's own header comment, which named this module as its intended successor from the start.

Out of scope (later phases, per the Phase 0 roadmap): Teaching Sessions/Attendance, Storage, Content, Question Bank, Activities, Submissions, Grading, Progress, Communication, Notifications, Achievements, Payments, Administration.

## 2. Permission-key mapping (a documented interpretive decision)

SRS §26.1 states the permission catalogue is closed: "an action with no permission code cannot be performed." The catalogue (`packages/shared/src/permissions.ts`, Table 26.1) has exactly two academic-structure-shaped educational permissions — `MANAGE_CLASSROOM` ("Create/edit classrooms and groups") and `MANAGE_COURSE` ("Create/edit courses, cycles, topics") — plus `MANAGE_STUDENTS` ("Manage student membership in scope"), `VIEW_STUDENTS`, and `PUBLISH_CONTENT`. There is no dedicated permission for Subject, AcademicPeriod, Membership or Enrollment specifically. Phase 6's mapping, applied uniformly:

| Entity | Mutating action | Permission | Read (list/get) |
|---|---|---|---|
| AcademicPeriod | create / update / close | `ORG_MANAGE` (administrative; PER-001/002's actor is Admin) | relationship only (no specific permission) |
| Classroom | create / update / archive | `MANAGE_CLASSROOM` | relationship only |
| Group | create / update / archive | `MANAGE_CLASSROOM` (GRP-001: a Group belongs to exactly one Classroom, and its own catalogue description explicitly reads "Create/edit classrooms **and groups**") | relationship only |
| Membership | add / end / move-student | `MANAGE_STUDENTS` | `VIEW_STUDENTS` |
| Subject | create / update / archive | `MANAGE_COURSE` (SUB-001's actor is "Teacher/Admin"; no dedicated Subject permission exists, and Subject is the content-tree's own root, so it is treated as part of the same "courses, cycles, topics" management surface) | relationship only |
| Course | create / update | `MANAGE_COURSE` | relationship only |
| Course | publish / unpublish | `PUBLISH_CONTENT` | — |
| Course | archive | `MANAGE_COURSE` | — |
| Course co-teachers | add / remove | `MANAGE_COURSE` **and** owner-only (see §6) | `MANAGE_COURSE` is what a co-teacher inherits; listing uses relationship only |
| CourseAudience | add / remove | `MANAGE_COURSE` | relationship only |
| Cycle | create / update / archive | `MANAGE_COURSE` | relationship only |
| Topic | create / update / archive | `MANAGE_COURSE` | relationship only |
| Enrollment | create / withdraw | `MANAGE_STUDENTS` | `VIEW_STUDENTS` (per-course); self-access for a Student's own list (see §7) |

`ORG_MANAGE`/`ORG_VIEW` are §26.3 administrative permissions, seeded only onto the ADMIN system role (`packages/db/src/seed/data.ts`'s `ADMIN_PERMISSION_KEYS`) — this is why AcademicPeriod management is effectively Admin-only in this implementation (see §5's PER-002 note).

## 3. Scope-target mapping for sub-entities without their own `ScopeType`

`apps/api/src/modules/authz/scope.ts`'s `ScopeType` union is `ORG | CLASSROOM | GROUP | SUBJECT | COURSE | CYCLE` — fixed by Phase 5, unmodified here. Three Phase 6 entities have no scope type of their own and are authorized against their nearest containing scope, with the entity's own id carried as `objectId` for SEC-009 denial semantics:

- **AcademicPeriod** → `{ scopeType: "ORG", scopeId: null, objectId: period.id }`
- **Topic** → `{ scopeType: "CYCLE", scopeId: topic.cycleId, objectId: topic.id }`
- **Membership** → `{ scopeType: containerType === "classroom" ? "CLASSROOM" : "GROUP", scopeId: containerId, objectId: containerId }`
- **Enrollment** / **CourseAudience** → `{ scopeType: "COURSE", scopeId: courseId, objectId: courseId }`

A "create a new child under an existing parent" action (e.g. add a Group to a Classroom, add a Cycle to a Course) targets the **parent's own scope with the parent's own id as `objectId`** — the same convention the Phase 5 classroom demonstrator's own PATCH endpoint established (`{scopeType: "CLASSROOM", scopeId: id, objectId: id}`). This means denial for "you may not add a Group to this Classroom" is reported identically to "this Classroom does not exist" (SEC-009), never disclosing which is true.

A "create a brand-new top-level resource" action (AcademicPeriod, Classroom, Subject) has no existing object to check against at all, so it targets `{scopeType: "ORG", scopeId: null}` with **no `objectId`** — denial is `forbidden` (403), since there is nothing whose existence could be disclosed.

## 4. Business rules enforced at the application layer

### 4.1 PER-003 — one active Classroom membership per (organization, user, AcademicPeriod)

SRS Table 37.3's Classroom entity row states directly: "A student has exactly one active Classroom per AcademicPeriod (BR-015)." PER-003 restates this independently. `docs/database/schema-overview.md`'s Phase 3 write-up explicitly deferred this to a later phase, since it requires a join through `Membership → Classroom → AcademicPeriod` that no single database CHECK or UNIQUE constraint can express. Phase 6 closes this gap in `service.ts`'s `addMembership()`: before inserting a new classroom-type Membership, it calls `listActiveClassroomMembershipsForUser()` (a repository method that joins `memberships` to `classrooms` to read each membership's `academic_period_id`) and rejects with `409 conflict` if the student already holds an active classroom membership in the **same** AcademicPeriod. A membership in a **different** period is unaffected (different periods naturally produce different rows).

### 4.2 PER-004 — non-overlapping AcademicPeriods

"AcademicPeriods shall not overlap within the same Organization unless the Organization explicitly supports concurrent periods... the default is non-overlapping." No `Organization`-settings field exists anywhere in the schema for the opt-in this sentence describes. Phase 6 enforces the stated default — non-overlapping — **unconditionally**, for every period in an Organization, via a plain ISO-date string range-overlap check (`aStart <= bEnd && bStart <= aEnd`) in `service.ts`'s `createAcademicPeriod`/`updateAcademicPeriod`. `starts_on`/`ends_on` are stored as ISO `YYYY-MM-DD` text on both dialects specifically so they sort/compare correctly as plain strings (see §8's dialect-parity note).

### 4.3 The move-student operation (CLS-009, BR-015)

"Moving a Student ends the current membership with a `left_at` date and creates a new one. Grades, submissions, point history and achievements are never moved, recalculated or deleted." `service.ts`'s `moveStudent()` implements this exactly: it finds the caller's current active classroom membership in the **same AcademicPeriod as the destination Classroom** (PER-003's own scope), calls `authorize()` a second time against that membership's own container (so a Teacher who owns only the destination Classroom cannot silently pull a student out of a Classroom they have no authority over), ends it (`leftAt`/`status='ended'`, the row is never deleted), and creates a fresh Membership row in the destination. Since Phase 6 has no Grade/Submission/Achievement entities yet (later phases), the "never moved" half of BR-015 is trivially true — there is nothing to move.

### 4.4 Polymorphic container/target reference validation

`docs/database/tenancy-and-security.md` §1 explicitly named `memberships.container_id` and `course_audiences.target_id` as columns with **no foreign key at all** (a generic polymorphic reference to either `classrooms` or `groups`), and said "the actual referenced row's existence and organization match must be validated at the application/service layer for these specific columns." Phase 6 implements this: `addMembership()` and `addCourseAudience()` both call a shared `resolveContainerOrThrow()` helper that looks the referenced row up by `(organizationId, id)` before proceeding, raising `404 not_found` for a nonexistent or cross-organization id — closing the exact gap that document named.

### 4.5 Course lifecycle (CRS-002/007/008)

`DRAFT → published (publish, requires PUBLISH_CONTENT) → archived (archive, requires MANAGE_COURSE)`, with `published → draft` (unpublish, requires PUBLISH_CONTENT) as the only backward transition. `archived` is terminal — no code path returns an archived Course to any other state, matching the lifecycle diagram in SRS §10.1 ("readable forever to those who studied it"). Each transition is a dedicated action endpoint (`POST /courses/:id/publish|unpublish|archive`), never a generic status-field PATCH — CRS-008's own text ("publishing shall be an explicit action, separate from creating or uploading") and mirroring the Phase 5 `ParentLink` `/confirm` pattern for consistency and auditability. **CRS-007's Submission-existence gate on unpublish is not implemented** — see §5.

## 5. Known limitations (reported, not silently absorbed)

- **PER-002's Teacher-delegation clause.** "Authorized Admins, and Teachers where the Organization delegates it, shall create and manage AcademicPeriods." No Organization-settings field or mechanism exists anywhere in the SRS or schema to determine when an Organization "delegates" this to Teachers. Only the Admin path (`ORG_MANAGE`) is implemented; a Teacher, however senior, currently cannot create or manage AcademicPeriods.
- **PER-004's concurrent-periods opt-in.** The non-overlap rule is enforced unconditionally for every Organization — the "unless the Organization explicitly supports concurrent periods" exception has no settings field to build against, so it cannot be selectively disabled. Any Organization that genuinely needs parallel tracks cannot create them today.
- **CRS-007's Submission-existence gate.** "A Course shall not be returned to draft once a Submission exists against any of its Activities." The `Submission` entity does not exist until Phase 12 (Question Bank/Activities/Grading phases). The DRAFT↔PUBLISHED↔ARCHIVED state machine itself is implemented and tested correctly; the specific gate blocking unpublish once real student work exists against the Course is a documented gap for Phase 12 to close, not silently omitted or faked with a placeholder check.
- **CLS-008/GRP-003's content-targeting behavior.** CourseAudience add/remove/list — the *mechanism* that records which Classroom/Group a Course is targeted to — is implemented and tested. The actual consequence (a Student in that Classroom/Group being able to *see* the Course, its Cycles/Topics, or its content) is not implemented: `apps/api/src/modules/authz/service.ts`'s `resolveAuthoritySources()` was deliberately **not** extended in Phase 6 to resolve Student/Parent visibility across the content tree via CourseAudience membership — that is Activities/Content-phase work (explicitly out of Phase 6 scope per the Phase 0 roadmap), and extending the core authz pipeline for it was judged to be scope creep beyond "academic structure." A Student or Parent currently has no authorization path to read Subject/Course/Cycle/Topic records at all (they see Classroom/Group only, as Phase 5 already supported).
- **Enrollment's REQUESTED/COMPLETED/TRANSFERRED states.** SRS §45.3's full state machine is `REQUESTED → ACTIVE → (WITHDRAWN | COMPLETED | TRANSFERRED)`. Phase 6 only reaches `active` (immediately, on creation — no request/approval workflow exists) and `withdrawn` (via the withdraw action). The new `enrollments_status_check` CHECK constraint (migration `0006`) reserves the full five-value vocabulary, but `requested`, `completed` and `transferred` are not reachable from any current code path.
- **`listEnrollmentsForStudent` is self-access only.** There is no single scope object a cross-course "list everything this Student is enrolled in" query can be checked against in the §7.3 scope model (each Enrollment is independently COURSE-scoped). Only the Student themself may call `GET /api/v1/enrollments/mine`; a Teacher, Parent or Admin wanting a student's enrollments must query per-Course via `GET /courses/:id/enrollments`, which *is* authorized normally. This is a deliberate, reported scope cut, not a silent gap.
- **AcademicPeriod status transitions.** `planned`/`active`/`closed` are freely inter-transitionable except that `closed` is terminal (cannot be reopened) — there is no SRS-specified ordering requiring `planned → active → closed` strictly in sequence, so none is enforced.

## 6. CRS-009/010 — co-teachers

Co-teachers are `UserRoleAssignment` rows scoped to the Course (`roleId = TEACHER`, `scopeType = 'COURSE'`, `scopeId = courseId`) — exactly as SRS Table 37.3's Course entity row specifies, **not** additional owner columns on `courses`. This also closes a gap the Phase 5 completion report flagged: "no endpoint exists to grant/revoke `UserRoleAssignment`" now has one, scoped specifically to this use case.

A co-teacher's default authority equals the owner's educational permissions in that scope (they hold the same `MANAGE_COURSE` grant, evaluated through the same `authorize()` pipeline every other Teacher role assignment goes through — no separate code path). CRS-009 requires that ownership transfer, co-teacher management, and Course deletion remain owner-only, **never** delegable to a co-teacher even though the co-teacher does hold `MANAGE_COURSE`: `service.ts`'s `addCoTeacher()`/`removeCoTeacher()` therefore perform an explicit `course.ownerTeacherId !== principal.userId` check **after** the generic `authorize(MANAGE_COURSE)` call succeeds — a business rule enforced in the service layer on top of, not instead of, the centralized permission check, the same pattern `classroomOwnerTeacherId`/`courseOwnerTeacherId` already use inside the authz pipeline itself for "teacher_ownership" authority.

Every grant and removal raises an audit event (`COURSE_CO_TEACHER_ADDED`/`COURSE_CO_TEACHER_REMOVED`, CRS-010), and visibility to all current co-teachers follows from `listCoTeachers()` being reachable by anyone with authority over the Course — which every current co-teacher has, by construction.

## 7. Soft deletion, archival, and historical integrity

- **"Archive" is a lifecycle status, not a delete.** For Classroom, Group, Subject, Cycle, Topic, `status = 'archived'` is a normal (if terminal-in-practice) state transition, exactly analogous to Course's own DRAFT/PUBLISHED/ARCHIVED lifecycle — reversible in principle, never a row removal. No hard-DELETE endpoint exists for any Phase 6 entity.
- **`deletedAt`/`deletedBy` (DB-003) remain reserved but unused.** These columns exist on Classroom/Group/Subject/Course from Phase 3 and are never written by any Phase 6 code path — mirroring exactly how `users.deletedAt` stayed reserved-but-unused through Phase 4, and how Phase 3's own schema-overview.md documented this columns-exist-ahead-of-their-owning-phase pattern.
- **Membership rows are never deleted** (CLS-009) — `endMembership()`/`moveStudent()` both set `leftAt`/`status='ended'`, the row stays queryable forever. Verified by a dedicated test asserting the old row is still present, with `leftAt` populated, after a move.
- **Enrollment withdrawal preserves the row** (BR-015) — `withdrawEnrollment()` sets `status='withdrawn'`/`withdrawnAt`, never deletes. Verified by a dedicated test, including that a fresh Enrollment can subsequently be created for the same student/Course pair (the withdrawn row does not block re-enrollment).
- **Closing an AcademicPeriod (PER-005) touches nothing else** — verified by a dedicated test that creates a Classroom inside a period, closes the period, and confirms the Classroom is still fully readable with its `academicPeriodId` unchanged.

## 8. Database changes

Migration `0006` (both dialects) adds two CHECK constraints, generated by `drizzle-kit generate` and applied and verified against clean scratch SQLite and PostgreSQL databases:

- `academic_periods_status_check`: `status IN ('planned', 'active', 'closed')` (PER-001's own three-state vocabulary, already documented in the Phase 3 code comment; no new decision, just enforcing what was already stated).
- `enrollments_status_check`: `status IN ('requested', 'active', 'withdrawn', 'completed', 'transferred')` (SRS §45.3's explicit state machine — the full vocabulary is reserved even though Phase 6 only reaches two of the five values; see §5).

No other entity's `status` column received a CHECK constraint — `classrooms`/`groups`/`subjects`/`cycles`/`topics`/`memberships`.status remain unconstrained at the database layer, for the same reason Phase 3 originally left them that way: no SRS-enumerated vocabulary exists for these specific entities' status values, and locking one in now would silently pre-commit an unstated business rule. Only `active`/`archived` are actually written by Phase 6 code for these entities.

**A dialect-parity defect found and fixed during Phase 6:** `packages/db/src/schema/postgres/academic-structure.ts`'s `academic_periods.starts_on`/`ends_on` and `cycles.starts_on`/`ends_on` used Drizzle's `date()` column type without an explicit `mode`, which defaults to mapping the column to a JS `Date` object — while the SQLite mirror's `text()` column always returns a plain string. This is exactly the kind of silent dual-dialect divergence `packages/db/src/schema/parity.test.ts` exists to catch at the schema-shape level, but it doesn't catch ORM value-mapping differences, only column presence/type/nullability. It surfaced while implementing PER-004's overlap check, which compares these values as plain ISO date strings. Fixed by adding `{ mode: "string" }` to both Postgres column declarations — a pure `mapFromDriverValue`/`mapToDriverValue` change (`getSQLType()` is still `'date'` either way), so **no new migration was required**; verified directly against a real PostgreSQL instance that `startsOn` now returns a JS `string`, not a `Date`.

## 9. Testing

`apps/api/src/routes/academic-structure.test.ts` — 57 tests, full HTTP-surface integration tests against a real in-memory SQLite database migrated with the real generated migrations, through the real routes, exercising the actual `authorize()` pipeline end-to-end (never mocked). Covers: CRUD happy/invalid paths for every entity, PER-003/PER-004 business rules, the move-student operation (including old-row preservation), polymorphic reference validation, duplicate handling (Subject code, Cycle/Topic sequence numbers, duplicate co-teacher, duplicate audience target, duplicate active Enrollment), Course lifecycle transitions and their invalid-transition rejections, co-teacher grant/revoke/ownership-restriction, cross-organization isolation, forged client fields (`ownerTeacherId`, `organizationId`, `academicPeriodId`), IDOR-style IDOR attempts against every entity type, and SEC-009 denial-semantics assertions (object-identified denials report 404, not 403 — verified explicitly, since several early drafts of these tests got this backwards before being corrected against the actual pipeline behavior).

`apps/api/src/routes/authz.test.ts` (Phase 5's own suite) was updated only at the wiring level — `createClassroomsRepository`/`classroomsRepository` swapped for `createAcademicStructureRepository`/`academicStructureRepository` — and passes unchanged, proving the new module preserves the exact HTTP/authorization semantics the Phase 5 demonstrator established for Classroom read/update.

Full regression: 257/257 tests pass (200 pre-existing + 57 new) against **both** real SQLite and real PostgreSQL, plus `typecheck`, `lint`, `format`, and the Playwright e2e smoke suite, all clean.
