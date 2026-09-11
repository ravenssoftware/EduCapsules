# Phase 1 Decisions Pending Project Owner Approval

**Phase:** 1
**Rule (per the Project Owner's Phase 1 instruction):** "Identify architectural decisions that require my approval. Do not make irreversible product decisions without my approval." Nothing below has been implemented. Everything else in `docs/architecture/` derives directly from already-CONFIRMED SRS requirements and is not a decision — it is architecture that follows from the spec regardless of which tool is chosen.

This consolidates the stack proposals first raised in `docs/decisions/02-assumptions-register.md` §B, now that Phase 1 has designed the architecture those proposals sit inside. Nothing here is new: it is the same B-01..B-08 list, brought back for the explicit sign-off the Assumptions Register promised at Phase 1 kickoff, with the Phase 1 architecture context (`docs/architecture/`) that now backs each one.

## What is fixed regardless of any answer below (not being asked)

These come directly from the SRS and don't change no matter which tool is picked — restated only so the scope of what *is* being asked stays narrow:

- CON-01/CON-02: Cloudflare for MVP, InterServer VPS for production, Cloudflare retained at the edge.
- BE-008: every platform primitive behind an interface with ≥2 implementations exercised in CI.
- The eleven-stage §7.1 authorization pipeline, the seven-layer backend architecture (§39.1), the three-layer storage model (§14.1), the Content Gateway (§16), and every SRS-derived invariant documented in `docs/architecture/`.

## Decisions requiring your approval

### 1. Language — TypeScript end to end

**Proposal:** TypeScript for the API, background workers, and frontend, sharing types through a `packages/shared` workspace.
**Why:** Native to Cloudflare Workers; one type system spanning backend and frontend removes an entire class of API-contract drift.
**Reversibility:** Low cost to keep; high cost to change later — this touches every file in the codebase. **This is the proposal most worth your scrutiny before Phase 2 starts writing code against it.**
**Architecture dependency:** All of `docs/architecture/backend.md` assumes a single-language domain layer (§2's "no compile-time dependency on framework/driver/platform" is easiest to enforce with one language throughout).

### 2. API framework — Hono

**Proposal:** [Hono](https://hono.dev), running unmodified on both Cloudflare Workers (MVP) and a Node/container server (production).
**Why:** The same application code satisfies BE-008's "two implementations exercised in CI" for the transport layer itself, not just the primitives it calls — alternatives (Express, Fastify) need a compatibility shim on Workers, which is exactly the extra moving part BE-008 exists to avoid.
**Reversibility:** Medium — swappable early in the build, expensive once hundreds of routes exist.
**Architecture dependency:** `docs/architecture/backend.md` §6, `docs/architecture/README.md`'s component diagram (labeled "proposed, pending approval").

### 3. DB / query layer — Drizzle ORM

**Proposal:** Drizzle, with first-class D1 and Postgres dialects generated from one schema definition.
**Why:** Matches DB-019 (no stored procedures, portable SQL) directly; one schema, two engines, no hand-kept-in-sync duplication.
**Reversibility:** Medium — schema definitions would need translating to another tool; the underlying SQL/migrations stay portable regardless of ORM choice (DB-018/DB-019 are tool-independent).
**Architecture dependency:** `docs/architecture/database.md` §1 ("Dual-dialect strategy") names this as the proposed mechanism, explicitly flagged not-yet-approved there.

### 4. Object storage abstraction — custom `ObjectStore` interface

**Proposal:** A custom interface (put/get/signed-url/delete/copy/head) with an R2 adapter (MVP) and an S3-compatible adapter (production).
**Why:** Directly what BE-008 and SRS Table 41.3's service-mapping table ask for.
**Reversibility:** Low — it's an interface either way; adapters are swappable by design.
**Architecture dependency:** `docs/architecture/backend.md` §5, `docs/architecture/storage-and-content.md` §1, `docs/architecture/observability-and-deployment.md` §1.

### 5. Queue abstraction — custom `JobQueue` interface

**Proposal:** A custom interface with a Cloudflare Queues adapter (MVP) and a Redis/BullMQ adapter (production).
**Why:** Same pattern as #4, required by BE-008 and Table 41.3/41.4.
**Reversibility:** Low.
**Architecture dependency:** `docs/architecture/backend.md` §4 (background jobs), §5.

### 6. Monorepo tool — pnpm workspaces

**Proposal:** `apps/api`, `apps/web`, `packages/db`, `packages/shared`, `packages/domain`.
**Why:** Matches the layering §39.1 already requires — a framework-agnostic domain/business-rule layer (BE-002) needs to be an independently importable package regardless of tool.
**Reversibility:** Low — workspace tooling is the easiest item on this list to change later.

### 7. Testing — Vitest (unit/integration), Playwright (E2E)

**Proposal:** Vitest for unit/integration; Playwright for E2E.
**Why:** TS-native, fast; Playwright/Chromium is already provisioned in this build environment.
**Reversibility:** Low.

### 8. CI — GitHub Actions

**Proposal:** GitHub Actions, since the repository already lives on GitHub.
**Why:** No new platform dependency; directly supports NFR-011 (tests gate every merge), NFR-016 (dependency scanning in CI), and the security-testing hooks named in `docs/architecture/security-and-trust-boundaries.md` §8.
**Reversibility:** Low.

## What I need from you

A yes/no (or redirect) on each of #1–8 above, or a blanket "proceed as proposed," before Phase 2 (Repository, CI/CD & Environment Foundation) scaffolds any code against them. Items #4–8 are low-reversibility and likely uncontroversial; #1–3 (TypeScript, Hono, Drizzle) are the ones with real cost if wrong, and are where your judgment matters most.

## Traceability

This document does not change any SRS requirement, decision register entry, or assumption. It is the formal approval request the Assumptions Register (`docs/decisions/02-assumptions-register.md` §B) said would come at Phase 1's start. Once approved, each item there moves from Section B ("proposed") to a new confirmed entry, and this document is updated to record the approval date and any redirection.
