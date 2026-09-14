# @educapsules/db

Database schema, migrations, seeds, and connection factories — Drizzle ORM, dual-dialect (SQLite/D1 for the MVP, PostgreSQL for production). Implemented in Phase 3 (Database Foundation) per `docs/architecture/database.md`.

**Documentation:** see `docs/database/schema-overview.md` (entities, identifiers, constraints, indexing), `docs/database/tenancy-and-security.md` (tenant isolation, soft deletion, audit, seed policy), and `docs/database/migration-strategy.md` (migration tooling, history, testing, CI) for the full picture. This file covers local commands only.

## Commands

```bash
# SQLite (D1 stand-in) — no external service needed
SQLITE_DB_PATH=./dev.sqlite pnpm run db:migrate:sqlite
SQLITE_DB_PATH=./dev.sqlite pnpm run db:seed:sqlite        # system roles only
SQLITE_DB_PATH=./dev.sqlite pnpm run db:seed:sqlite:dev    # + synthetic dev sample data

# PostgreSQL — requires DATABASE_URL pointing at a real, reachable database
export DATABASE_URL=postgresql://user:pass@localhost:5432/educapsules_dev
pnpm run db:migrate:postgres
pnpm run db:seed:postgres
pnpm run db:seed:postgres:dev

# Regenerate migrations after a schema change — review the generated SQL before committing
pnpm run db:generate:sqlite
pnpm run db:generate:postgres

pnpm run typecheck
pnpm run test    # SQLite tests always run; PostgreSQL tests run when DATABASE_URL is set, else skip
```

`--dev` seeding refuses to run when `NODE_ENV=production`, regardless of the flag.
