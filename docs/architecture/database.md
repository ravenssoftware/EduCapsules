# Database Architecture

**Source:** SRS §37 (Data Model — normative logical model, not re-derived here), DB-001..020, BE-008

The logical model (entity catalogue, cardinalities, Tables 37.1–37.9) lives in the SRS and is authoritative. This document covers what SRS §37 leaves to architecture: physical dialect strategy, tenant-isolation enforcement mechanics, migration discipline, and indexing derived from Table 37.9's access patterns.

## 1. Dual-dialect strategy (CON-01/CON-02, BE-008)

The MVP runs on Cloudflare D1 (SQLite); production runs on PostgreSQL (INF requirements, §41.4). DB-007/DB-009/DB-019 exist specifically so this is a configuration change, not a schema rewrite:

- **No stored procedures, no database-specific functions in business paths** (DB-019) — every rule that would tempt one lives in the domain layer instead.
- **Portable types only** (DB-007) — timestamps as UTC ISO-8601/epoch, money as integer minor units + ISO-4217 currency code, no JSONB-specific operators relied upon for correctness (JSON columns are read/written as opaque blobs by the domain layer).
- **Foreign keys declared even where the MVP engine enforces them weakly** (DB-009) — D1's SQLite FK enforcement depends on `PRAGMA foreign_keys`; the schema declares every FK regardless, and the data-access layer enforces referential integrity in code where the platform doesn't, so production Postgres is a superset of behavior, never a divergent rewrite.
- **Drizzle ORM, with first-class D1 and Postgres dialects** (APPROVED 2026-09-13, `docs/decisions/02-assumptions-register.md` A-07). **Correction to this document's original Phase 1 framing, made during Phase 3 implementation:** Drizzle has no single cross-dialect table builder — `sqliteTable` and `pgTable` are genuinely separate APIs with different column-type builders, so "one schema definition, two generated dialects" was not achievable as literally written. The actual implementation is two hand-mirrored schema modules (`packages/db/src/schema/sqlite/`, `packages/db/src/schema/postgres/`) kept in lockstep by an automated structural-parity test (`packages/db/src/schema/parity.test.ts`) that fails the build if the two ever diverge in table set, column set, nullability, or primary-key shape. The constraint that made Drizzle the right tool is unchanged — a single reviewable source of truth for the schema, never two definitions maintained by hand with no safety net — it is enforced by a test rather than by the tool itself. See `docs/database/schema-overview.md` for the full Phase 3 implementation.

### Portability directive (Project Owner, 2026-09-13 — A-13)

Approving Drizzle came with an explicit, binding condition: the core business/application architecture shall not become tightly coupled to D1, Cloudflare, or any other vendor. Applied to this layer specifically:

- Every domain-layer function reaches the database only through the repository interfaces described in §2 below — never through a raw Drizzle client, a raw SQL string, or a D1-specific binding, imported outside the `packages/db` adapter implementations.
- Core types passed between the domain layer and the persistence layer are portable (DB-007) — no SQLite-affinity type or Postgres-specific type (e.g., a native `jsonb` operator, a Postgres array type) is allowed to leak into a shared type domain code depends on.
- Domain logic never assumes D1-specific behavior (its looser FK enforcement, SQLite's dynamic typing, its transaction/isolation model) — where D1 and Postgres genuinely differ, the domain layer codes to the weaker common guarantee, per §6's transaction-vs-outbox discussion below.
- A future Postgres cutover (§41.5's migration path, detailed in `observability-and-deployment.md` §2) is a repointed adapter binding plus a data export/import — never a domain-layer rewrite. This is the acceptance bar for every PR touching `packages/db`, alongside the existing BE-008 review checklist in `backend.md` §8.
- If a feature genuinely needs a D1-only or Postgres-only capability with no portable equivalent, it is isolated behind its own narrow adapter interface and documented as vendor-specific at the point of isolation — it is never allowed to widen into a general-purpose escape hatch other code starts depending on.

## 2. Tenant isolation — enforcement, not convention (DB-001, DB-011, DB-012, GEN-019)

Every scoped table carries `organization_id`. This is enforced at three independent layers, deliberately redundant:

1. **Schema** — every cross-table foreign key within a tenant is composite on `(organization_id, id)` (DB-011), so a row referencing another tenant's row is a foreign-key violation, not just a logic bug.
2. **Query layer** — the repository layer (Persistence, per `backend.md` §1) injects `organization_id` into every query predicate; no repository method accepts an unscoped query. This is what the §7.1 pipeline's "tenant" stage relies on downstream of authorization.
3. **Unique constraints scoped by tenant** (DB-012) — e.g. `UNIQUE(organization_id, email)`, `UNIQUE(course_id, sequence_no)` — so uniqueness rules never leak cross-tenant.

A migration that adds a scoped table without `organization_id` from its first version, or a repository method that builds a query without it, is a defect regardless of whether a test happens to catch it — this is the database-layer equivalent of the BE-008 "no direct SDK import" review rule in `backend.md` §8, and belongs in the same PR checklist.

## 3. Identifiers (DB-002)

Internal primary keys may be integer or UUID. Any identifier that leaves the server — in a URL, an API response, or a share link — is non-sequential (UUIDv7 or ULID), so resource enumeration by incrementing an id is not possible. This applies uniformly across every entity in Tables 37.2–37.6; there is no exception list.

## 4. Soft delete, audit tables, and history (DB-003, DB-004, DB-005, DB-017)

- User-visible academic and content records use `deleted_at`/`deleted_by`/`deletion_reason`. Hard delete is reserved for the erasure pipeline (§44) and transient technical rows only.
- `AuditLog`, `GradeHistory`, `ContentAccessEvent`, `SecurityEvent`, `PaymentEvent` are append-only: the application's database role receives no `UPDATE`/`DELETE` grant on these tables at all (DB-004) — this is a database-user-privilege control, not just an application-level convention, so a compromised or buggy application process cannot alter history even if it tried.
- Every table with user-generated content carries `created_at`, `updated_at`, `created_by`, and (where deletion is possible) `deleted_at`/`deleted_by` (DB-017).
- Historical academic facts (released grades, awarded achievements, recorded attendance) are snapshotted at creation time, never recomputed from current config (DB-005) — this is the mechanism D-08's grading-scale resolution relies on: `Grade.grading_scale_version_id` and `Grade.grading_scale_snapshot` pin the scale that was in force, per GRD-017.

## 5. Copy-on-write versioning (DB-006)

`QuestionVersion`, `FileVersion`, `LessonVersion`, and `GradingScaleVersion` (added under D-08) all follow the same pattern: editing creates a new row, the prior row is never mutated, and a consumer (a published Activity, a released Grade, a rendered lesson) pins a specific version id at the moment it consumes it. This is one mechanism applied consistently across four entity families, not four separate designs — a new versioned entity added later should reuse it rather than invent a variant.

## 6. Concurrency and transactional boundaries (DB-013, DB-014, DB-015)

- **Idempotent submission creation** (DB-013): a client-supplied idempotency key prevents a retried request from creating a duplicate `Submission`. Same mechanism as API-006 (`backend.md` §7), applied at the persistence layer.
- **Optimistic concurrency on grade writes** (DB-014): `Grade` carries a version column; a conflicting concurrent edit is rejected with 409, never silently overwritten.
- **Submission → auto-score → Grade → PointsLedger as one unit** (DB-015): where the engine supports it (Postgres in production, and D1 within a single `D1Database.batch()`/transaction where applicable), this happens in one transaction. Where it doesn't, a durable outbox with at-least-once delivery and idempotent consumers provides the same effective guarantee. The domain layer must not assume the stronger guarantee is always available, since it has to run correctly against both engines (per BE-002's platform-independence rule in `backend.md` §2) — this is a direct consequence of running the same domain code against D1 in MVP and Postgres in production, not an extra abstraction added for its own sake.

## 7. Migrations (DB-018, DB-019)

- Forward-only, reviewed migrations under version control (`database/migrations/`, per the repository structure agreed with the Project Owner). No down-migrations relied upon in production; a mistake is fixed by a new forward migration.
- Destructive migrations (drop column, drop table, narrow a type) require an explicit approved change record — this is a process control, not a tooling one, and applies regardless of which migration tool is approved.
- One migration history, two targets: the same migration files apply to D1 and Postgres. Where a construct isn't portable (an engine-specific type, a generated column syntax that differs), the schema definition avoids it rather than forking the migration per engine (DB-019).

## 8. Indexing — derived from Table 37.9's access patterns (DB-020)

DB-020 requires an index for every foreign key used in a filter, and for the access patterns SRS Table 37.9 names. Restating the patterns here as index targets (implementation detail beyond this is an architect's-choice per DB-020's own SHOULD/"index design beyond that" clause):

| Access pattern (SRS Table 37.9) | Index target |
|---|---|
| AP-1 — open activities for one student across enrolled courses, by `due_at` | `Enrollment(student_user_id)` join path + `Activity(course_id, due_at)` |
| AP-2 — submissions awaiting grading for one teacher across owned courses | `Submission(state)` filtered join through `Activity(course_id)` where `Course.owner_teacher_id` |
| AP-3 — one student's full result history in one course/period | `Grade(student_user_id, organization_id)` + `Enrollment(student_user_id, course_id, academic_period_id)` |
| AP-4 — attendance roll for one teaching session | `AttendanceRecord(teaching_session_id)` |
| AP-5 — points ledger sum per student/scope/window | `PointsLedger(student_user_id, scope_type, scope_id, created_at)` |
| AP-6 — folder listing with current version metadata for one teacher | `Folder(owner_user_id, parent_folder_id)`, `File(folder_id)` |
| AP-7 — question bank search by subject/topic/type/difficulty | `Question(organization_id, subject_id, topic_tag, type, difficulty)` |
| AP-8 — audit trail for one target object, newest first | `AuditLog(target_type, target_id, occurred_at DESC)` |
| AP-9 — unread notifications for one user | `Notification(user_id, read_at)` |
| AP-10 — entitlement check for one user against one resource | `Entitlement(holder_user_id, resource_type, resource_id)` |

Every one of these also carries `organization_id` in the composite key per DB-011/DB-012, even though it's omitted from the short form above for readability.

## 9. What is explicitly not decided here

Per SRS D-01 (Table 37.9, "read-model strategy"), whether AP-2/AP-3/AP-5 are served by direct queries, materialized views, or a separate read store is deferred to implementation, constrained only by the §43 response-time targets and DB-016's rebuildability requirement (every derived value — points balance, progress percentage, leaderboard rank — must be fully reconstructible from source rows, never a mutable counter that can drift). This is a Phase-13/20 implementation decision, not a Phase 1 architecture decision, and is not being made now.
