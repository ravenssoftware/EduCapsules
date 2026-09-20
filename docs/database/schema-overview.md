# Database Schema — Phase 3 Implementation

**Status:** Phase 3 (Database Foundation), implemented.
**Source of truth:** Master SRS v1.0 §37 (Data Model) + `docs/architecture/database.md`. This document records what Phase 3 actually built; it does not restate or re-derive the SRS's normative model.

This document, `migration-strategy.md`, and `tenancy-and-security.md` in this folder together satisfy the Phase 3 documentation requirement. Keep them synchronized with `packages/db/src/schema/` as the schema evolves — a stale doc is worse than no doc. **Phase 6** (`docs/academic-structure/academic-structure.md`) is the module that turned the academic-structure tables described here into real CRUD/workflows and closed several gaps this document explicitly deferred (PER-003's cardinality rule, PER-004's overlap rule, the polymorphic `memberships.container_id`/`course_audiences.target_id` reference validation named in `tenancy-and-security.md` §1) — see that document for the business-rule enforcement mechanics, not here.

## 1. Package layout

```
packages/db/
  src/
    schema/
      sqlite/            — SQLite (D1) Drizzle table definitions
      postgres/           — PostgreSQL Drizzle table definitions (structural mirror)
      parity.test.ts       — fails the build if the two schemas diverge
      db-behavior-scenarios.ts — dialect-agnostic real-engine behavior tests
    client/                — connection factories (createSqliteDb, createPostgresDb)
    seed/data.ts            — dialect-agnostic seed data (system roles + dev sample data)
    scripts/                — migrate-*.ts / seed-*.ts CLI entry points
  migrations/
    sqlite/                 — generated SQLite migrations (drizzle-kit)
    postgres/                — generated PostgreSQL migrations (drizzle-kit)
  drizzle.sqlite.config.ts / drizzle.postgres.config.ts — drizzle-kit generation config
```

## 2. Why two schema modules, not one (portability decision, flagged per Phase 3 instructions)

Drizzle ORM does not offer one table builder that targets both SQLite and PostgreSQL — `sqliteTable` and `pgTable` are separate APIs with dialect-specific column builders (e.g. `integer(..., { mode: "timestamp_ms" })` vs `timestamp(..., { withTimezone: true })`). The Phase 1 architecture doc's original "one schema definition, two generated dialects" framing was therefore not achievable as written; see the correction in `docs/architecture/database.md` §1.

The implementation instead hand-mirrors two schema modules, kept honest by `packages/db/src/schema/parity.test.ts`, which introspects both via Drizzle's `getTableColumns`/`getTableName` and asserts, per table: the same table-name set across both dialects, the same column-name set, the same `notNull` per column, and the same `primary` status per column. It deliberately does **not** compare concrete SQL types (a portable UTC timestamp is legitimately `integer` in SQLite and `timestamp with time zone` in Postgres) — see §5 below. A schema change that adds a column, constraint, or table to one dialect and not the other fails this test, not just code review.

## 3. Entities implemented (Phase 3 foundation + Phase 4 identity/auth)

Per the SRS's authoritative terminology — **Organization → Classroom → Group**; **Subject → Course → Cycle → Topic** — kept distinct, never collapsed:

| Table | Purpose | SRS reference | Phase |
|---|---|---|---|
| `organizations` | Tenant root | Table 37.2, ORG-* | 3 |
| `users` | Identity, org-scoped | Table 37.2, DB-012 | 3 (extended in 4) |
| `user_profiles` | Display profile, 1:1 with `users` | Table 37.2 | 3 |
| `roles` | System roles (org_id null) + org-custom roles | GEN-006, Table 37.2 | 3 |
| `permissions` | Global permission catalogue | §26 | 3 |
| `role_permissions` | Role ↔ Permission join | §26 | 3 |
| `user_role_assignments` | Scoped role grants (ORG/CLASSROOM/GROUP/SUBJECT/COURSE) | §7.3 | 3 |
| `academic_periods` | Academic year/term | PER-* | 3 |
| `classrooms` | Organization → Classroom | CLS-* | 3 |
| `groups` | Classroom → Group (mandatory container, GEN-008/GRP-001) | GRP-* | 3 |
| `memberships` | User ↔ (Classroom \| Group), polymorphic | GRP-*, CLS-* | 3 |
| `subjects` | Subject catalogue | SUB-* | 3 |
| `courses` | Subject → Course | CRS-* | 3 |
| `course_audiences` | Course ↔ (Classroom \| Group), polymorphic | CRS-* | 3 |
| `cycles` | Course → Cycle | CYC-* | 3 |
| `topics` | Cycle → Topic | TOP-* | 3 |
| `enrollments` | Student ↔ Course, per academic period | CRS-*, PER-* | 3 |
| `audit_log` | Append-only audit trail | DB-004, AUD-* | 3 |
| `login_sessions` | LoginSession — opaque, hash-stored session credentials | Table 37.2, §35, AUTH-101..119 | 4 |
| `mfa_factors` | TOTP enrollment state, encrypted secret | Table 37.2, AUTH-116/126 | 4 |
| `mfa_recovery_codes` | Single-use MFA backup codes | AUTH-127 | 4 |
| `password_reset_tokens` | Single-use, short-lived password-reset credentials | AUTH-121 | 4 |
| `email_verification_tokens` | Single-use, short-lived email-verification credentials | AUTH-121 | 4 |
| `security_events` | Append-only abuse/threat signals (rate limits, brute force, token reuse) | DB-004, API-018 | 4 |
| `assistant_assignments` | Assistant delegation record — PENDING/ACTIVE/EXPIRED/REVOKED/SUSPENDED | Table 37.2, §21 AST-* | 5 |
| `assistant_assignment_scopes` | AssistantAssignment's scope set (§7.3: a combination, not a single pair) | §7.3, §21.1 | 5 |
| `assistant_assignment_permissions` | AssistantAssignment's delegated permission set — Table 37.2's `PermissionGrant`, realised as a join table | Table 37.2, §21 AST-* | 5 |
| `parent_links` | Parent<->Student linking — REQUESTED/CONFIRMED/REVOKED | Table 37.2, §22 PAR-* | 5 |

No entity outside this list (e.g. Activity, StudentActivity, Submission, TeachingSession — each explicitly distinct per the SRS and this instruction) is implemented; those belong to later phases that own that domain. `Teaching Session` (a scheduled class meeting) is a different concept from `Login Session` and still doesn't exist — see `docs/auth/authentication.md` for the full Phase 4 authentication design.

## 4. Identifiers (DB-002)

Every primary key is a UUIDv7 string (RFC 9562: 48-bit millisecond timestamp + version/variant bits + random tail), generated by `packages/shared/src/uuid7.ts` on Node's Web Crypto (`crypto.getRandomValues`) — no external dependency, portable to Workers and Node alike. UUIDv7 is non-sequential in the enumerable sense (the random tail defeats incrementing) while remaining roughly time-ordered for index locality, and is used uniformly — there is no integer-PK exception anywhere in this schema.

## 5. Portable core types (DB-007)

- **Timestamps** — UTC always. SQLite: `integer` with Drizzle's `timestamp_ms` mode (epoch milliseconds). Postgres: `timestamp with time zone`. Application code reads/writes a JS `Date` in both cases; no dialect-specific formatting leaks past the client factories in `src/client/`.
- **Booleans** — SQLite: `integer` with `boolean` mode. Postgres: native `boolean`.
- **JSON-shaped data** (e.g. `user_profiles.contact_preferences`) — stored as opaque `text` in both dialects, never a Postgres `jsonb` column with operators the application would depend on.
- **No stored procedures or triggers carrying business logic** (DB-019) — the one exception considered (a SQLite trigger to block `audit_log` mutation) was evaluated and rejected; see `tenancy-and-security.md` §3.

## 6. Constraints and indexes — what was added and why

Every table declares primary keys, the foreign keys described in `tenancy-and-security.md` §1, and indexes on its actual query paths (organization scope, the parent id used to list children, the columns named in SRS Table 37.9 where that table is in Phase 3 scope). Indexes were not added speculatively beyond that — see the per-table Drizzle definitions in `src/schema/*/academic-structure.ts` and `identity.ts` for the exact list.

CHECK constraints were added only where the SRS text itself gives an explicit, closed enumeration, never for a self-invented status vocabulary that a later phase actually owns:

| Table.column | Values | SRS basis |
|---|---|---|
| `organizations.status` | `active, closure_requested, closure_confirmed, grace_period, read_only, archived` | ORG-009's stated lifecycle |
| `user_role_assignments.scope_type` | `ORG, CLASSROOM, GROUP, SUBJECT, COURSE` | §7.3's scope containment list |
| `courses.status` | `draft, published, archived` | CRS-002 |
| `memberships.container_type` | `classroom, group` | Structural — the polymorphic column has exactly these two legal targets by construction, not by business choice |
| `course_audiences.target_type` | `classroom, group` | Same as above |
| `users.status` | `pending, active, suspended, locked, deactivated, anonymised, purged` | Table 44.1 / §45.3's full account-state machine (added Phase 4, which owns account lifecycle) |
| `mfa_factors.type` | `TOTP` | AUTH-126 — the only first-class factor decided so far; others are explicitly FUTURE |
| `mfa_factors.status` | `pending, active, disabled` | Structural — enrollment lifecycle |
| `security_events.event_type` | `RATE_LIMIT_EXCEEDED, LOGIN_BRUTE_FORCE, ACCOUNT_LOCKED, TOKEN_REUSE_DETECTED, SUSPICIOUS_SESSION` | Table 36.2's Authentication-domain vocabulary, the subset this table's narrower purpose (API-018) actually raises |
| `security_events.severity` | `medium, high, critical` | §34.4's own severity vocabulary — no invented `low` tier |
| `assistant_assignments.status` | `pending, active, expired, revoked, suspended` | §45.3's AssistantAssignment lifecycle (added Phase 5) |
| `assistant_assignment_scopes.scope_type` | `CLASSROOM, GROUP, SUBJECT, COURSE, CYCLE` | §7.3's scope containment list, minus `ORG` — an Assistant assignment is always a bounded delegation, never organization-wide (AST-002, GEN-006) |
| `parent_links.status` | `requested, confirmed, revoked` | §45.3's ParentLink lifecycle (added Phase 5) |
| `academic_periods.status` | `planned, active, closed` | PER-001's own three-state vocabulary (added Phase 6, migration `0006` — see `docs/academic-structure/academic-structure.md` §8) |
| `enrollments.status` | `requested, active, withdrawn, completed, transferred` | §45.3's Enrollment state machine (added Phase 6, migration `0006`); Phase 6 code only reaches `active`/`withdrawn` — see that same doc's §5 known limitations |

Other status-like columns (`classrooms.status`, `groups.status`, `subjects.status`) still deliberately carry **no** CHECK constraint, unchanged from Phase 3: their value sets are not enumerated anywhere in the SRS, and locking one in now would silently pre-commit an unstated business rule — this held true even once Phase 6 became the phase that owns these entities' lifecycle, since there remains no enumerated source to draw the vocabulary from. This is a scope boundary, not an oversight.

Two requirements are explicitly **PROVISIONAL** per decision record D-16 (CLS-002/CLS-003/GRP-002): rather than hard-coding one unconfirmed interpretation into a constraint, the schema stays permissive there. See the header comment in `src/schema/sqlite/academic-structure.ts` for the exact citation. Phase 6 (the academic-structure module, `apps/api/src/modules/academic-structure/`) did not force a resolution either — the schema remains as permissive as Phase 3 left it, per Table 9.1a's own note that these PROVISIONAL rows "do not block Phase 6 architecture; they block only finalising their own specific behaviour."

Uniqueness: `organizations.slug`; `users(organization_id, email)` (DB-012 — scoped, never global); `roles(organization_id, key)`; `cycles(course_id, sequence_no)` and `topics(cycle_id, sequence_no)` (CYC-002); `course_audiences(course_id, target_type, target_id)`; plus every `unique(organization_id, id)` that exists solely to give child tables a composite-FK target (see `tenancy-and-security.md` §1).

## 6a. Attribution columns (DB-017)

Every table holding user-generated content carries `created_at`/`updated_at` (all tables) and, additionally, `created_by` (`users`, `classrooms`, `groups`, `memberships`, `subjects`, `courses`, `course_audiences`, `cycles`, `topics`, `enrollments`) and `deleted_by` wherever `deleted_at` already exists (`users`, `classrooms`, `groups`, `subjects`, `courses`). `academic_periods.created_by` predates this and follows the same pattern. `created_by`/`deleted_by` are deliberately plain nullable `text` columns with **no** foreign key — unlike every other cross-table reference in this schema (§6), these are audit-attribution metadata rather than a structural relationship the domain depends on, so a hard FK was judged not worth the added coupling at this stage; revisit once Phase 4 (Authentication) and the eventual attribution/audit model are in place. Tables that are system catalogues rather than user-generated content (`permissions`, `role_permissions`, `roles`, `audit_log` itself) do not carry these columns — `audit_log` already has its own `actor_user_id`, which is the more specific field for that table.

## 7. Versioning / history

No versioned content entity (QuestionVersion, FileVersion, LessonVersion, GradingScaleVersion) exists yet — those entities are out of Phase 3's foundation scope. What Phase 3 does establish, so later phases inherit it rather than re-deriving it: `academic_periods` and `enrollments` are the mechanism by which a later phase snapshots historical academic facts against a specific period rather than "current" config, per DB-005 — e.g. a `Grade` (future phase) pins `academic_period_id` at creation, not merely "the student's current period."

## 8. Local development setup

Requires Node 22 and, for the PostgreSQL path, a reachable Postgres 16 instance (a local install or `postgres:16` in Docker/CI — see `.github/workflows/ci.yml`).

```bash
cd packages/db

# SQLite (D1 stand-in) — no external service needed
SQLITE_DB_PATH=./dev.sqlite pnpm run db:migrate:sqlite
SQLITE_DB_PATH=./dev.sqlite pnpm run db:seed:sqlite         # system roles only — safe in every environment
SQLITE_DB_PATH=./dev.sqlite pnpm run db:seed:sqlite:dev     # + synthetic dev sample data

# PostgreSQL — DATABASE_URL must point at a real, reachable database
export DATABASE_URL=postgresql://educapsules:<password>@localhost:5432/educapsules_dev
pnpm run db:migrate:postgres
pnpm run db:seed:postgres
pnpm run db:seed:postgres:dev

# Regenerate migrations after a schema change (review the generated SQL before committing it)
pnpm run db:generate:sqlite
pnpm run db:generate:postgres

# Tests — SQLite tests always run (in-memory); Postgres tests run only when
# DATABASE_URL is set, and skip (not fail) otherwise
pnpm run test
```

`db:seed:*:dev` refuses to run when `NODE_ENV=production`, regardless of the `--dev` flag being passed — see `tenancy-and-security.md` §4 for the full seed-data policy.
