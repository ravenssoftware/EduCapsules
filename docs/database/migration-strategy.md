# Migration Strategy — Phase 3 Implementation

Companion to `schema-overview.md`. Covers how migrations are generated, applied, and tested for both dialects.

## 1. Tooling

`drizzle-kit generate` diffs the current Drizzle schema (`src/schema/sqlite/` or `src/schema/postgres/`) against the migration history and writes a new, ordered, versioned SQL file plus a matching entry in `migrations/<dialect>/meta/_journal.json`. Migrations are applied programmatically via `drizzle-orm/better-sqlite3/migrator` and `drizzle-orm/node-postgres/migrator` (`src/scripts/migrate-sqlite.ts`, `migrate-postgres.ts`) — never `drizzle-kit push`, which is a prototyping tool that diffs straight against a live database and is not reproducible or reviewable the way a generated SQL file is.

Each dialect has its own independent, ordered migration history (`migrations/sqlite/`, `migrations/postgres/`) because the generated SQL is genuinely dialect-specific (composite-FK syntax, CHECK constraint syntax, column types), even though both histories are generated from the same reviewed source-of-truth schema pair (see `schema-overview.md` §2). The two histories are kept in lockstep by convention — a schema change is generated and reviewed for both dialects in the same PR — not by a shared tool.

## 2. Current migration history

| # | File | Contents |
|---|---|---|
| 0000 | `0000_*.sql` | All 18 Phase 3 tables, their primary/foreign keys, unique constraints, indexes, and CHECK constraints |
| 0001 | `0001_audit_log_append_only.sql` | PostgreSQL: guarded `REVOKE` on `audit_log` (see `tenancy-and-security.md` §3). SQLite: documentation-only no-op — the append-only guarantee is application-enforced on this dialect. |
| 0002 | `0002_*.sql` | Adds the `created_by`/`deleted_by` attribution columns required by DB-017 (see `schema-overview.md` §6a) — nullable, additive, no data migration needed |
| 0003 | `0003_*.sql` | Phase 4: adds the 6 identity/auth tables (`login_sessions`, `mfa_factors`, `mfa_recovery_codes`, `password_reset_tokens`, `email_verification_tokens`, `security_events`), the `users.status` CHECK constraint (Table 44.1's full account-state machine), and `users.failed_login_count`/`locked_until`/`email_verified_at`. On SQLite this required a full-table rebuild of `users` (adding a CHECK constraint isn't a simple `ALTER TABLE ADD COLUMN`) — drizzle-kit's generated rebuild had a real bug (its `INSERT INTO __new_users ... SELECT` referenced the brand-new columns from the *old* table, which don't exist there yet); hand-fixed by removing those columns from the copy so they take their own `DEFAULT`/`NULL` instead, verified against a real database afterward — see the comment left in the migration file itself. |
| 0004 | `0004_security_events_append_only.sql` | Same guarded-REVOKE / documented-SQLite-gap treatment as 0001, applied to `security_events` (`tenancy-and-security.md` §3). |

Each migration file was applied to a real, freshly created instance of both engines during Phase 3 development (a local PostgreSQL 16 database and a `better-sqlite3` file) and confirmed clean — not merely generated and assumed correct.

## 3. No destructive migrations without justification (DB-018)

Phase 3 contains no `DROP TABLE`/`DROP COLUMN`/type-narrowing migrations — it is the initial schema. This section exists so the *policy* is on record before it is ever needed: a future migration that drops a column, drops a table, or narrows a type requires an explicit, approved decision record before it is written, the same way an architecture decision does. "Because the code doesn't use it anymore" is not sufficient justification on its own — the review must consider whether it's actually safe against data still present in a deployed database.

## 4. Testing (Phase 3 requirement: verify actual behavior, not just exit codes)

Both dialects are exercised against real engines, not mocks:

- **SQLite** — an in-memory `better-sqlite3` database, migrated with the real generated migration files, in every CI run and every local `pnpm test`.
- **PostgreSQL** — a real PostgreSQL connection (local dev, or the `postgres:16` service container added to `.github/workflows/ci.yml`'s backend job), read from `DATABASE_URL`. The suite drops and recreates **both** the `public` schema (where the tables live) and drizzle-kit's own `drizzle` tracking schema before migrating, so this is a genuine clean-database migration test on every run, not a test that silently no-ops against stale tracking state left by a previous run. (This exact failure mode — `migrate()` silently skipping because it believed the migrations already ran, once `public` was reset but `drizzle` wasn't — was hit and fixed during Phase 3 development; see the comment at the top of `postgres/db-behavior.test.ts`'s `beforeAll`.) When `DATABASE_URL` is unset, this suite skips itself rather than failing, so a contributor without a local Postgres can still run `pnpm test`.

What is actually verified, per dialect (`packages/db/src/schema/db-behavior-scenarios.ts`, run once against each real engine):

- Migrations apply to a clean database, and re-applying them against an already-migrated database is a no-op, not an error.
- Every CHECK constraint listed in `schema-overview.md` §6 actually rejects an out-of-enumeration value.
- `organizations.slug` and `users(organization_id, email)` uniqueness (the latter scoped, not global — a duplicate email in a *different* organization must succeed).
- A row referencing a non-existent parent is rejected (plain FK integrity).
- The DB-011 cross-tenant composite-FK case described in `tenancy-and-security.md` §1.
- `groups.classroom_id` is enforced `NOT NULL` at the database layer itself (raw SQL, bypassing the TypeScript type system, since GRP-001 is a database-layer requirement, not merely an application-layer one).
- `cycles`/`topics` sequence-number uniqueness within their parent (CYC-002).
- The soft-delete + hard-delete-blocked-by-FK behavior in `tenancy-and-security.md` §2.
- Seed idempotency (re-inserting the same seed row twice yields one row, no error).
- `audit_log.organization_id` is required at the database layer, and a non-existent-organization reference is rejected.
- A multi-statement transaction rolls back in full when a later statement violates a constraint — verified with a real transaction against each driver (SQLite: `better-sqlite3`'s synchronous transaction API; PostgreSQL: `node-postgres`'s async transaction API — the two drivers require genuinely different call shapes here, so this one scenario is written per-dialect rather than shared, unlike everything else in the suite).

Also covered by a separate, structural test rather than a live-database one: `packages/db/src/schema/parity.test.ts` (see `schema-overview.md` §2) and `packages/shared/src/uuid7.test.ts` (id format, version/variant bits, uniqueness across 1000 generations, time-ordering).

## 5. CI integration

`.github/workflows/ci.yml`'s `backend` job runs a `postgres:16` service container with `DATABASE_URL` set for the whole job, so the PostgreSQL behavior suite always actually runs in CI (never silently skipped there). Before the test suite runs, the job also separately invokes the real CLI migration and seed commands (`db:migrate:sqlite`, `db:seed:sqlite:dev`, `db:migrate:postgres`, `db:seed:postgres:dev`) against a scratch SQLite file and the CI Postgres instance — this validates the actual npm-script/CLI entry points a developer or a deploy pipeline would run, as a check independent of the deeper behavioral assertions the vitest suite performs.
