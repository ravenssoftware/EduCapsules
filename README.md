# EduCapsules

_Teach safely · Learn in order · Monitor with confidence_

A multi-role educational platform (Teacher, Assistant, Student, Parent, Admin) built to the [EduCapsules Master SRS](docs/srs/README.md).

## Status

**Phase 5 — Roles, Permissions & Authorization, complete.** Phases 3 (database foundation) and 4 (identity & authentication) are also complete; Phase 5 adds the centralized authorization pipeline (`apps/api/src/modules/authz/`), the full §26 permission catalogue as seeded data, Assistant delegation (§21) and ParentLink (§22) lifecycles — see [`docs/authz/authorization.md`](docs/authz/authorization.md) and [`docs/auth/authentication.md`](docs/auth/authentication.md). The backend stack is TypeScript + Hono (Drizzle ORM, D1/Postgres portability, ObjectStore/JobQueue abstractions, pnpm, Vitest, Playwright, GitHub Actions — see [`docs/decisions/05-phase1-decisions-pending-approval.md`](docs/decisions/05-phase1-decisions-pending-approval.md)). **The client is Flutter** (Desktop for V1; the same codebase extends to Android/iOS as a future release), superseding the originally approved React + Vite web client — see [`docs/decisions/06-flutter-client-decision.md`](docs/decisions/06-flutter-client-decision.md). Flutter code exists for the authentication flow but remains unvalidated — no Flutter/Dart SDK has been available in any session so far. See [`docs/README.md`](docs/README.md) for the full documentation index.

## Repository layout

```
apps/
  api/          TypeScript + Hono backend (Node runtime; Cloudflare Workers target added when Phase 3+ needs it)
  flutter/      Flutter client — Desktop V1 (Windows/macOS/Linux); Android/iOS scaffolded, not built out
packages/
  shared/       Cross-cutting portable types (RFC 9457 problem details, correlation ids, env config)
  domain/       BE-008 portability-contract interfaces (ObjectStore, JobQueue) + in-memory reference adapters
  db/           Drizzle schema, migrations and seed data (dual-dialect: SQLite/D1 and PostgreSQL)
  config/       Shared tsconfig base
docs/           SRS, architecture, decisions, traceability — the single source of truth
```

## Getting started

Prerequisites: Node.js ≥ 22, [pnpm](https://pnpm.io) ≥ 9, and the [Flutter SDK](https://docs.flutter.dev/get-started/install) (stable channel) if you're working on the client.

```sh
git clone <this-repo> && cd EduCapsules

# Backend
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm --filter @educapsules/api run dev     # http://localhost:8787/health

# In another terminal — everything the CI backend job runs
pnpm run lint
pnpm run format
pnpm run typecheck
pnpm run test        # Vitest, in-process
pnpm run test:e2e     # Playwright, against the real running server

# Flutter client
cd apps/flutter
flutter pub get
flutter run -d linux    # or -d macos / -d windows
flutter analyze
flutter test
```

No secret ever belongs in a committed file — copy `.env.example` to `.env` (gitignored) for local values; every other environment supplies real configuration through its own secret manager (SRS BE-007, SEC-034).
