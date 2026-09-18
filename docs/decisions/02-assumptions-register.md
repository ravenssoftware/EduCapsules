# Assumptions Register

**Phase:** 2 (register originated in Phase 0; updated as decisions resolve)
**Rule:** an assumption here is either (a) already confirmed by the Project Owner, (b) a proposal awaiting explicit sign-off before it's implemented, or (c) a deferred/legal item with no code impact yet. Section B is now empty — every stack proposal raised there was approved at Phase 1 close (2026-09-13, see `05-phase1-decisions-pending-approval.md`) and is recorded in Section A below.

## A. Confirmed by the Project Owner

| # | Assumption | Confirmed | Reversibility if wrong |
|---|---|---|---|
| A-01 | SRS v1.1 (audited) is the build baseline, not the originally-attached v1.0 | 2026-09-11 | High — v1.1 only fixes internal contradictions/gaps in v1.0; reverting means re-introducing the duplicate BR-014 ID and the two contradictions it resolved |
| ~~A-02~~ | ~~Frontend framework is React + Vite (SPA, no SSR)~~ | 2026-09-11 | **SUPERSEDED 2026-09-13 — see A-14 and `docs/decisions/06-flutter-client-decision.md`.** The client is Flutter, not React/Vite. Retained here, struck through, for traceability rather than deleted. |
| A-03 | D-08 resolved: grade scales configurable per Organization (never global), scale/criteria pinned per Grade at creation/release. Baseline bumped to SRS v1.2. | 2026-09-11 | Low to change the *value* (it's a config-driven, versioned entity by design — GRD-016); high to change the *shape* (per-Organization vs. some other scope) once Phase 13 has built against it |
| A-04 | D-16 narrowed, not resolved: §9/§21 requirements individually classified CONFIRMED-elsewhere or PROVISIONAL, no text changed. Baseline bumped to SRS v1.3. | 2026-09-11 | N/A — this is a labeling pass, not a design decision; nothing to reverse. The underlying PROVISIONAL items (CLS-002, CLS-003, GRP-002, AST-009, two rows of Table 21.2) remain genuinely open until you confirm them |
| A-05 | Language: TypeScript, end to end (API, Workers, frontend), one type system shared via `packages/shared` | 2026-09-13 (was B-01) | Low cost to keep; high cost to change (touches everything) |
| A-06 | API framework: Hono — runs unmodified on both Cloudflare Workers and a Node server, satisfying BE-008's "two implementations exercised in CI" for the transport layer itself | 2026-09-13 (was B-02) | Medium — swappable early, expensive once hundreds of routes exist |
| A-07 | DB / query layer: Drizzle ORM — first-class D1 and node-postgres dialects from one schema definition, portable SQL migrations, no stored procedures (DB-019) | 2026-09-13 (was B-03) | Medium — schema definitions would need translating to another tool; underlying SQL/migrations stay portable regardless |
| A-08 | Object storage abstraction: custom `ObjectStore` interface; R2 adapter (MVP), S3-compatible adapter (production) | 2026-09-13 (was B-04) | Low — it's an interface either way; adapters are swappable by design |
| A-09 | Queue abstraction: custom `JobQueue` interface; Cloudflare Queues adapter (MVP), Redis/BullMQ adapter (production) | 2026-09-13 (was B-05) | Low |
| A-10 | Monorepo tool: pnpm workspaces — `apps/api`, `apps/flutter` (client, see A-14), `packages/db`, `packages/shared`, `packages/domain` | 2026-09-13 (was B-06); path updated 2026-09-13 when A-02 was superseded by A-14 | Low — workspace tooling is the easiest thing here to change later |
| A-11 | Testing (backend): Vitest (unit/integration); Testing (Flutter client): `flutter test` for unit/widget tests, `integration_test` for on-device/desktop integration tests. Playwright (E2E) is retained where genuinely useful (§0 of `docs/decisions/06-flutter-client-decision.md`) — not silently dropped because the client changed | 2026-09-13 (was B-07); scope note added 2026-09-13 alongside A-14 | Low |
| A-12 | CI: GitHub Actions | 2026-09-13 (was B-08) | Low |
| A-13 | **Portability directive (Project Owner, 2026-09-13):** the core business/application architecture shall remain portable and shall not become tightly coupled to D1, Cloudflare, or any other infrastructure vendor. Concretely — database access stays behind repository/data-access boundaries; core types stay portable; domain/business logic never relies on D1-specific behavior; a future Postgres migration must never require rewriting the application/domain layer; any feature that genuinely requires a vendor-specific implementation is isolated behind an adapter/interface and documented as such. | 2026-09-13 | N/A — this sharpens and makes explicit what BE-002/BE-008/DB-019 already require of the architecture (see `docs/architecture/backend.md` §5, `docs/architecture/database.md` §1); it does not change any SRS requirement, it raises the bar for how strictly the existing ones are enforced in code review |
| A-14 | **Client technology is Flutter** (supersedes A-02): Flutter Desktop (Windows/macOS/Linux) is the V1 demo target; the same Flutter application/codebase extends to Android and iOS as a future release, without rewriting business logic or UI structure. The backend stays fully client-independent (GEN-004) — see `docs/decisions/06-flutter-client-decision.md` for full rationale, alternatives considered, and consequences. SRS consolidated into the official Version 1.0 baseline (§5.2, §41.1, §49, and related requirements updated; see `docs/srs/README.md` for the full development lineage and the internal-iteration naming note). | 2026-09-13 | Medium-high — Flutter/Dart is a different toolchain from TypeScript/React; reverting to a web client means a client rewrite, not a config change. The backend is unaffected either way |

## B. Proposed — none currently open

All items previously listed here (B-01..B-08) were approved by the Project Owner on 2026-09-13 and moved to Section A above (A-05..A-12). This section is kept as a placeholder for any future stack proposal that needs the same explicit-approval treatment.

## C. Deferred — legal/operational, no near-term code impact

| # | Assumption | Why deferred |
|---|---|---|
| C-01 | Retention periods will end up as per-category config values, not hard-coded | Blocked on D-06 (counsel) |
| ~~C-02~~ | ~~Grade scale will end up as a per-organization config value~~ | **Resolved — moved to section A (A-03).** No longer deferred. |
| C-03 | Performance thresholds will be measured, not asserted | Blocked on D-05 (requires a load test to exist first — Phase 24) |

## D. Structural assumptions (not really "open" — implied directly by SRS golden rules, listed for completeness)

| # | Assumption | Basis |
|---|---|---|
| D-a | Every scoped table gets `organization_id` from its first migration | GEN-019, DB-001 |
| D-b | External-facing IDs are non-sequential (UUIDv7/ULID) | DB-002 |
| D-c | Business logic lives in the domain layer only, never in DB triggers beyond audit-capture/`updated_at` | DB-010, GEN-013 |
| D-d | All timestamps stored UTC; presentation timezone is a user attribute | DB-008 |
