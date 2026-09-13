# Backend Architecture

**Source:** SRS §39 (Backend & Application Architecture Requirements), §7 (Authorization Model), BE-001..010

## 1. Layering (§39.1 — normative, not a proposal)

| Layer | Responsibility | May not |
|---|---|---|
| Edge | TLS termination, WAF, DDoS mitigation, static asset delivery, geographic routing | Make authorization decisions about educational data |
| Transport / API | Request parsing, schema validation, authentication, rate limiting, correlation-id assignment, serialization, error mapping | Contain educational business rules |
| Authorization | The §7 eleven-stage pipeline | Be bypassed by any other layer, including background jobs |
| Domain / Service | Educational rules: enrolment, activity lifecycle, grading, progress, achievements, points, storage semantics, payment state | Depend on HTTP types, the specific database engine, or the client platform |
| Persistence | Repositories, transactions, migrations, query construction | Contain educational decisions or authorization logic |
| Integration | Email/SMS/push delivery, object storage, payment evidence handling, video packaging, external identity providers | Be called directly from the transport layer |
| Background | Queues, scheduled jobs, projections, notification fan-out, retention sweeps, anomaly scoring | Skip authorization or audit because "the system" is the actor (BE-003) |

Each SRS module (see `README.md` §5) is a vertical slice through these seven layers, not a layer itself.

## 2. Domain-layer design (BE-001, BE-002)

- Business rules exist in exactly one place, reachable identically from the API, from background jobs, and from administrative tooling (BE-001).
- The domain layer has no compile-time dependency on the HTTP framework, database driver, or hosting platform (BE-002). Concretely: domain functions take and return plain domain objects/DTOs, never framework request/response types, never an ORM entity with framework-specific behavior attached.
- Every externally triggered side effect (email, push, payment-evidence processing, video packaging) is idempotent and retry-safe (BE-004).
- Long-running work (bulk import/export, video packaging, report generation) is asynchronous with an observable job-status resource (BE-005).

## 3. Statelessness (BE-006)

The backend holds no request-handling state in process memory beyond the lifetime of a single request. All session and workflow state lives in the datastore or cache, so any instance can serve any request — required both for horizontal scaling (PERF-021) and for the Workers execution model (which does not guarantee instance affinity).

## 4. Background jobs (§39.1 Background row, BE-003)

Background jobs execute under an explicit principal (a service principal or an impersonated user with recorded justification) and are audited like any other actor — there is no "the system did it" audit gap. Concretely, every job:

- Carries a `job_type`, an explicit actor (service principal id), and a correlation id propagated from whatever triggered it (if anything did).
- Goes through the same domain-layer functions as an API request would — a job never contains business logic the API path doesn't also exercise, since both call the same domain layer (BE-001).
- Writes an audit entry for any consequential change, same as an API-triggered change.

## 5. Platform adapters (BE-008 — the portability contract)

Every platform primitive is reached only through an interface, with at least two implementations exercised in CI from the start (not retrofitted later, per the R-01 risk in SRS §41.3):

| Interface | MVP implementation | Production implementation |
|---|---|---|
| `ObjectStore` (put, get, signed-url, delete, copy, head) | Cloudflare R2 | S3-compatible storage |
| `JobQueue` (enqueue, consume, retry, dead-letter) | Cloudflare Queues | Redis-backed durable queue |
| `Cache` | KV / Durable Objects (only where genuinely needed — no business state lives only here) | Redis |
| Relational data access | D1 (SQLite) via repository interfaces | PostgreSQL via the same repository interfaces |
| Mail | Provider behind a `MailSender` interface | Same interface, same or different provider |

A service class that calls a Cloudflare SDK directly is a defect regardless of whether it currently works — this is the single highest architectural risk the SRS names (R-01) and the review checklist (§8 below) exists specifically to catch it.

**Portability directive (Project Owner, 2026-09-13 — see `docs/decisions/02-assumptions-register.md` A-13):** this table is not aspirational — the core business/application architecture shall not become tightly coupled to D1, Cloudflare, or any other vendor. Any capability that genuinely has no portable equivalent (e.g., a Cloudflare-only primitive) is still required to sit behind an adapter/interface, with the vendor dependency explicitly documented at the point of isolation, never called directly from domain code or from more than the thinnest possible slice of the transport layer.

## 6. API framework — Hono (APPROVED, 2026-09-13)

**Decision:** [Hono](https://hono.dev), TypeScript. Hono runs unmodified on both Cloudflare Workers (CON-01, the required MVP runtime) and a Node/container server (CON-02, the required production runtime) — the same application code satisfies BE-008's "two implementations exercised in CI" for the transport layer itself, not just the primitives it calls. Alternatives (Express, Fastify) don't run natively on Workers and would need a compatibility shim, which is exactly the kind of extra moving part BE-008 is trying to avoid.

Approved by the Project Owner alongside the full Phase 1 stack proposal; see `docs/decisions/05-phase1-decisions-pending-approval.md` for the full approval record and `docs/decisions/02-assumptions-register.md` A-06. Scaffolding begins in Phase 2.

## 7. Idempotency and concurrency (API-006, DB-013, DB-014, DB-015)

- Every mutating endpoint accepts an `Idempotency-Key` header; the domain layer, not the transport layer, is responsible for returning the original result on a replay (since background-job-triggered mutations need the same guarantee and don't go through the transport layer).
- Grade writes use optimistic concurrency (a version column); a conflicting concurrent edit is rejected with 409, never silently overwritten (DB-014).
- Quiz auto-scoring, grade creation, and points-ledger entry for one submission occur in a single transaction where the database supports it, or through a durable outbox with at-least-once delivery and idempotent consumers where it doesn't (DB-015) — this distinction matters because D1 (MVP) and Postgres (production) have different transaction/isolation capabilities, and the domain layer must not assume the stronger one.

## 8. Review checklist for every PR touching this layer

Derived directly from BE-008/R-01 and the layering table above — this is what a reviewer checks, not new requirements:

- [ ] No platform SDK (R2, D1, Queues, KV) is imported outside the adapter implementations.
- [ ] No domain-layer file imports an HTTP framework type.
- [ ] No business rule exists only in a background job (BE-001).
- [ ] Every mutating endpoint has an idempotency story.
- [ ] Every background job records an actor and is audited if consequential.
