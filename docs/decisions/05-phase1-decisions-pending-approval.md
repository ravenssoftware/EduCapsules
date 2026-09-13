# Phase 1 Stack Decisions — APPROVED

**Status: APPROVED by the Project Owner, 2026-09-13.** All ten items below are confirmed. Filename and structure kept unchanged from the original approval request for a stable link and history; see `docs/decisions/02-assumptions-register.md` §A (A-05..A-13) for the current authoritative record.

**Phase:** 1 (approved at Phase 1 close, applied starting Phase 2)
**Original rule (per the Project Owner's Phase 1 instruction):** "Identify architectural decisions that require my approval. Do not make irreversible product decisions without my approval." Everything else in `docs/architecture/` derives directly from already-CONFIRMED SRS requirements and was never a decision requiring approval — it is architecture that follows from the spec regardless of which tool is chosen.

This consolidated the stack proposals first raised in `docs/decisions/02-assumptions-register.md` §B (now approved and moved to §A). Item #10 (React + Vite) was already confirmed as A-02 at Phase 0 and is included below only because the Project Owner's approval message listed it explicitly — it is a reconfirmation, not a new decision.

## What is fixed regardless of any answer below (not being asked)

These come directly from the SRS and don't change no matter which tool is picked — restated only so the scope of what *is* being asked stays narrow:

- CON-01/CON-02: Cloudflare for MVP, InterServer VPS for production, Cloudflare retained at the edge.
- BE-008: every platform primitive behind an interface with ≥2 implementations exercised in CI.
- The eleven-stage §7.1 authorization pipeline, the seven-layer backend architecture (§39.1), the three-layer storage model (§14.1), the Content Gateway (§16), and every SRS-derived invariant documented in `docs/architecture/`.

## Approved decisions

### 1. Language — TypeScript end to end — APPROVED

**Proposal:** TypeScript for the API, background workers, and frontend, sharing types through a `packages/shared` workspace.
**Why:** Native to Cloudflare Workers; one type system spanning backend and frontend removes an entire class of API-contract drift.
**Reversibility:** Low cost to keep; high cost to change later — this touches every file in the codebase. **This is the proposal most worth your scrutiny before Phase 2 starts writing code against it.**
**Architecture dependency:** All of `docs/architecture/backend.md` assumes a single-language domain layer (§2's "no compile-time dependency on framework/driver/platform" is easiest to enforce with one language throughout).

### 2. API framework — Hono — APPROVED

**Proposal:** [Hono](https://hono.dev), running unmodified on both Cloudflare Workers (MVP) and a Node/container server (production).
**Why:** The same application code satisfies BE-008's "two implementations exercised in CI" for the transport layer itself, not just the primitives it calls — alternatives (Express, Fastify) need a compatibility shim on Workers, which is exactly the extra moving part BE-008 exists to avoid.
**Reversibility:** Medium — swappable early in the build, expensive once hundreds of routes exist.
**Architecture dependency:** `docs/architecture/backend.md` §6, `docs/architecture/README.md`'s component diagram (label updated to drop "proposed, pending approval" now that this is decided).

### 3. DB / query layer — Drizzle ORM — APPROVED

**Proposal:** Drizzle, with first-class D1 and Postgres dialects generated from one schema definition.
**Why:** Matches DB-019 (no stored procedures, portable SQL) directly; one schema, two engines, no hand-kept-in-sync duplication.
**Reversibility:** Medium — schema definitions would need translating to another tool; the underlying SQL/migrations stay portable regardless of ORM choice (DB-018/DB-019 are tool-independent).
**Architecture dependency:** `docs/architecture/database.md` §1 ("Dual-dialect strategy") names this as the mechanism, updated to reflect approval. This decision now carries the additional portability directive in §0 below — see there before Phase 2 scaffolds `packages/db`.

### 4. Object storage abstraction — custom `ObjectStore` interface — APPROVED

**Proposal:** A custom interface (put/get/signed-url/delete/copy/head) with an R2 adapter (MVP) and an S3-compatible adapter (production).
**Why:** Directly what BE-008 and SRS Table 41.3's service-mapping table ask for.
**Reversibility:** Low — it's an interface either way; adapters are swappable by design.
**Architecture dependency:** `docs/architecture/backend.md` §5, `docs/architecture/storage-and-content.md` §1, `docs/architecture/observability-and-deployment.md` §1.

### 5. Queue abstraction — custom `JobQueue` interface — APPROVED

**Proposal:** A custom interface with a Cloudflare Queues adapter (MVP) and a Redis/BullMQ adapter (production).
**Why:** Same pattern as #4, required by BE-008 and Table 41.3/41.4.
**Reversibility:** Low.
**Architecture dependency:** `docs/architecture/backend.md` §4 (background jobs), §5.

### 6. Monorepo tool — pnpm workspaces — APPROVED

**Proposal:** `apps/api`, `apps/web`, `packages/db`, `packages/shared`, `packages/domain`.
**Why:** Matches the layering §39.1 already requires — a framework-agnostic domain/business-rule layer (BE-002) needs to be an independently importable package regardless of tool.
**Reversibility:** Low — workspace tooling is the easiest item on this list to change later.

### 7. Testing (unit/integration) — Vitest — APPROVED

**Proposal:** Vitest for unit and integration tests.
**Why:** TS-native, fast; matches the TypeScript decision above.
**Reversibility:** Low.

### 8. Testing (E2E) — Playwright — APPROVED

**Proposal:** Playwright for end-to-end tests.
**Why:** Playwright/Chromium is already provisioned in this build environment; TS-native.
**Reversibility:** Low.

### 9. CI — GitHub Actions — APPROVED

**Proposal:** GitHub Actions, since the repository already lives on GitHub.
**Why:** No new platform dependency; directly supports NFR-011 (tests gate every merge), NFR-016 (dependency scanning in CI), and the security-testing hooks named in `docs/architecture/security-and-trust-boundaries.md` §8.
**Reversibility:** Low.

### 10. Frontend framework — React + Vite — APPROVED (reconfirmation)

**Status:** Already confirmed at Phase 0 as A-02 (2026-09-11: React + Vite, SPA, no SSR). Listed here again only because the Project Owner's 2026-09-13 approval message named it explicitly alongside the backend stack. No change in scope or shape from the original A-02 decision.

## 0. Additional binding architectural requirement — portability (Project Owner directive, 2026-09-13)

Approval of items 1–9 above comes with an explicit condition that is now a standing architectural requirement, not a preference:

**The core business/application architecture shall remain portable and shall not become tightly coupled to D1, Cloudflare, or any other infrastructure vendor.** Concretely, for the D1/Postgres dual-dialect strategy specifically:

- Database access stays behind the repository/data-access boundaries already defined in `docs/architecture/database.md` §§1–2 — no domain-layer function queries the database directly.
- Core types stay portable (DB-007) — no D1-specific (SQLite) or Postgres-specific type is allowed to leak into a shared type used by domain code.
- Domain/business logic never relies on D1-specific behavior (its looser FK enforcement, its SQLite type affinity, its transaction model) — where the two engines differ, the domain layer codes to the weaker common guarantee, exactly as `docs/architecture/database.md` §6 already requires for DB-015's transactional-vs-outbox split.
- A future Postgres migration must never require rewriting the application/domain layer — only repointing the adapter binding, per `docs/architecture/observability-and-deployment.md` §2's migration path.
- Where a feature genuinely requires a vendor-specific implementation (e.g., a Cloudflare-only capability with no portable equivalent), it is isolated behind an adapter/interface with the vendor dependency documented at the point of isolation — never called directly from domain or even from most of the transport layer.

This directive does not change any SRS requirement — it sharpens enforcement of BE-002, BE-008, DB-007, DB-009, and DB-019, which already required exactly this. It is now also recorded as `docs/decisions/02-assumptions-register.md` A-13, and the Phase 1 architecture docs (`backend.md` §5, `database.md` §§1–2) are updated to state it explicitly rather than leave it implicit in the adapter-interface pattern.

## Traceability

This document recorded the formal approval request the Assumptions Register (`docs/decisions/02-assumptions-register.md`, formerly §B) promised at Phase 1's start. All ten items were approved by the Project Owner on 2026-09-13, along with the additional portability directive in §0. The authoritative current record is `docs/decisions/02-assumptions-register.md` §A (A-05..A-13); this document is retained as the historical approval record and is not expected to change further except to note a future redirection, should one occur.
