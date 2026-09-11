# Assumptions Register

**Phase:** 0
**Rule:** an assumption here is either (a) already confirmed by the Project Owner, (b) a proposal I will bring back for explicit sign-off at the start of Phase 1 before it's implemented, or (c) a deferred/legal item with no code impact yet. Nothing marked PROPOSED is being built against in Phase 0.

## A. Confirmed by the Project Owner

| # | Assumption | Confirmed | Reversibility if wrong |
|---|---|---|---|
| A-01 | SRS v1.1 (audited) is the build baseline, not the originally-attached v1.0 | 2026-09-11 | High — v1.1 only fixes internal contradictions/gaps in v1.0; reverting means re-introducing the duplicate BR-014 ID and the two contradictions it resolved |
| A-02 | Frontend framework is React + Vite (SPA, no SSR) | 2026-09-11 | Medium — affects Phase 1 frontend architecture and every screen built after; changing later means a rewrite of the web app, not a config change |

## B. Proposed — to be brought to you for explicit approval at Phase 1 kickoff, not decided here

These follow directly from constraints the SRS *does* fix (CON-01/CON-02: Cloudflare MVP → InterServer VPS production; BE-008: portability contract; §41.3's explicit Workers/D1/R2/Queues/KV listing) but the specific tool within each constraint is architect's-choice per GEN-013.

| # | Area | Proposal | Rationale | Reversibility |
|---|---|---|---|---|
| B-01 | Language | TypeScript, end to end (API, Workers, frontend) | Workers' native language; one type system shared between backend and frontend via `packages/shared` | Low cost to keep; high cost to change (touches everything) — **this is the one I most want your eyes on before Phase 1 starts writing code against it** |
| B-02 | API framework | Hono | Runs unmodified on both Cloudflare Workers and a Node server — gives BE-008's "two implementations exercised in CI" almost for free, since it's the same application code on both platforms rather than two separate implementations to keep in sync | Medium — swappable early, expensive once hundreds of routes exist |
| B-03 | DB / query layer | Drizzle ORM | Has first-class dialects for both D1 (SQLite, MVP) and node-postgres (production) from one schema definition; generates portable SQL migrations with no stored procedures, matching DB-019 directly | Medium — schema definitions would need translating to another tool, but the underlying SQL/migrations are portable regardless |
| B-04 | Object storage abstraction | Custom `ObjectStore` interface; R2 adapter (MVP), S3-compatible adapter (production) | Directly what BE-008 and the §41.3 service-mapping table ask for | Low — it's an interface either way; adapters are swappable by design |
| B-05 | Queue abstraction | Custom `JobQueue` interface; Cloudflare Queues adapter (MVP), Redis/BullMQ adapter (production) | Same pattern as B-04 | Low |
| B-06 | Monorepo tool | pnpm workspaces: `apps/api`, `apps/web`, `packages/db`, `packages/shared`, `packages/domain` | Matches the layering §39.1 already requires (a framework-agnostic domain/business-rule layer, BE-002) | Low — workspace tooling is the easiest thing here to change later |
| B-07 | Testing | Vitest (unit/integration), Playwright (E2E) | TS-native, fast; Playwright/Chromium is already provisioned in this build environment | Low |
| B-08 | CI | GitHub Actions | Repository already lives on GitHub | Low |

**I am not writing application code against B-01..B-08 until you've confirmed or redirected them.** Phase 0's remaining deliverables (roadmap, traceability baseline) are written to be stack-agnostic so they don't need this decided first.

## C. Deferred — legal/operational, no near-term code impact

| # | Assumption | Why deferred |
|---|---|---|
| C-01 | Retention periods will end up as per-category config values, not hard-coded | Blocked on D-06 (counsel) |
| C-02 | Grade scale will end up as a per-organization config value | Blocked on D-08 (Project Owner) — see the Open-Decision Register for why this is the one I'd resolve soonest anyway |
| C-03 | Performance thresholds will be measured, not asserted | Blocked on D-05 (requires a load test to exist first — Phase 24) |

## D. Structural assumptions (not really "open" — implied directly by SRS golden rules, listed for completeness)

| # | Assumption | Basis |
|---|---|---|
| D-a | Every scoped table gets `organization_id` from its first migration | GEN-019, DB-001 |
| D-b | External-facing IDs are non-sequential (UUIDv7/ULID) | DB-002 |
| D-c | Business logic lives in the domain layer only, never in DB triggers beyond audit-capture/`updated_at` | DB-010, GEN-013 |
| D-d | All timestamps stored UTC; presentation timezone is a user attribute | DB-008 |
