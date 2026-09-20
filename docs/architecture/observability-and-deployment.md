# Observability & Deployment Architecture

**Source:** SRS §41 (Frontend, Client Applications & Infrastructure), §43.2–43.4 (Capacity, Availability, Maintainability/Observability NFRs), §44 (Account Lifecycle, Retention & Deletion — referenced, not re-derived), INF-001..015, PERF-020..025, NFR-001..018

## 1. Two deployment targets, one artifact (CON-01/CON-02, §41.3–41.5)

MVP runs entirely on Cloudflare; production runs on an InterServer Linux VPS with Cloudflare retained at the edge (DNS, CDN, TLS, WAF, DDoS). Table 41.3/41.4 in the SRS fix the concern → service mapping for each target; this document's job is the migration mechanics and the observability contract that must hold identically on both, not the mapping itself (already stated fully in `backend.md` §5 and `README.md` §2's component diagram).

| Concern | MVP | Production | Portability mechanism |
|---|---|---|---|
| Client distribution | N/A — not a Cloudflare concern | N/A — not a server-infrastructure concern | The Flutter client (`06-flutter-client-decision.md`) compiles to native desktop binaries distributed directly (installer download); a future Android/iOS release adds app-store distribution. No static web bundle is served by either target. |
| App runtime | Workers | containerized service behind reverse proxy (INF-001) | Hono running unmodified on both (`backend.md` §6) |
| Relational data | D1 | PostgreSQL | one migration set, one schema definition (`database.md` §1, §7) |
| Object storage | R2 | S3-compatible or local volume + off-site replication | `ObjectStore` interface (`backend.md` §5) |
| Async work | Queues | Redis-backed durable queue | `JobQueue` interface |
| Cache | KV/DO | Redis | `Cache` interface |
| Edge | Cloudflare WAF/DDoS/TLS/DNS | same, retained (INF-005) | unchanged — edge stays Cloudflare in both targets |

R-01 (the SRS's own named top risk — "platform-primitive leakage," a service class calling a Cloudflare SDK directly) is why BE-008 requires two implementations exercised in CI from the first sprint, not retrofitted later — this is already the review-checklist item in `backend.md` §8, restated here because it's what makes the migration path below a configuration change rather than a rewrite.

## 2. Migration path (§41.5, INF-010..013, R-02)

The application code does not change between MVP and production — only the bindings behind the abstraction interfaces do (Figure 41.3's own framing). The migration sequence is fixed by the SRS:

1. Provision production infrastructure.
2. Run the same forward-only migrations already used on the MVP engine (INF-002, `database.md` §7).
3. Export data — engine-neutral, including object-storage contents with checksum verification of every object (INF-012) — and import.
4. Repoint the abstraction-interface bindings (`ObjectStore`, `JobQueue`, `Cache`, DB dialect) from Cloudflare adapters to VPS adapters — no application code change.
5. Cut over DNS.
6. Verify.
7. Retain rollback for a defined window (INF-013 — the maximum data-loss window is agreed *before* cutover, never discovered during it).

A full rehearsal against production-shaped data is required before the real cutover (INF-011). Cutover timing must avoid the middle of an academic period wherever possible (R-02) — submissions and grades are the two data classes the product cannot afford to damage — and INF-014 makes this absolute where it can't be avoided: no assessment is scheduled to open, close, or run inside an announced maintenance window, and users are notified of the window in advance.

## 3. Deployment automation (INF-015, NFR-010)

Deployment is automated and repeatable from a clean environment — no manual server-configuration step is required to reproduce production (INF-015). This is also what the GitHub workflow rules already require of this repository: reproducibility from a fresh clone on any device, with all config-as-code (migrations, seeds, infra config, environment-reproduction templates) committed, and no direct commit to the release branch (NFR-010) — CI gates every merge (NFR-011).

## 4. Observability — the golden-signal contract (NFR-012..014, INF-006)

- **Correlation id on every request, propagated across services, jobs, and logs** (NFR-012, INF-006) — this is the same correlation id `backend.md` §1 assigns at the Transport layer and §4 requires background jobs to carry forward; there is one id per causal chain, not one per hop.
- **Structured, queryable logs, free of secrets, tokens, answer keys, and unnecessary personal data** (NFR-013, FE-012, AUD-009) — this is the same discipline `security-and-trust-boundaries.md` §3 requires of error responses, applied to logs: a log line is never a place sensitive data leaks because "it's just for engineers."
- **Golden-signal metrics (rate, errors, duration, saturation) for every service, with alerting on defined SLIs** (NFR-014) — one metrics contract every module (`README.md` §5) instruments identically, not a per-module bespoke dashboard.
- **Runbooks for defined operational scenarios exist before launch** (NFR-015) — an operational deliverable for Phase 25/28, not Phase 1, but flagged here so it isn't forgotten at the readiness review.

## 5. Availability and recovery (§43.3, NFR-001..008)

- **NFR-007 is the one non-negotiable target in the entire NFR set**: a submission accepted by the system is durably persisted before the acknowledgement is returned to the student — no buffered-write acknowledgement, ever. This is a direct architectural constraint on the `submissions` module's write path (`README.md` §5): the persistence write must complete (or the outbox entry must be durably recorded, per `database.md` §6's DB-015 outbox pattern) before the API returns success, full stop, regardless of which database engine is in play.
- **RPO/RTO are TBD** (NFR-003/004) but the strictest class is already named: assessment and grade data. The architecture doesn't fix a number, but the backup/replication design in §6 below must be able to serve whatever number is eventually set for that data class specifically, not a single blanket figure across all data.
- **Backups are automated, encrypted, off-site, and restore-tested at least quarterly** (NFR-005, INF-007, SEC-041) — an untested backup is explicitly, per the SRS's own words, "not a backup."
- **No single point of failure in the production topology for the core educational path** (NFR-006) — a design-review gate, not a specific redundancy scheme fixed here.
- **Corruption is detectable, not just prevented**: checksums on stored objects, referential-verification jobs, and reconciliation of ledger sums (`PointsLedger`, `AuditLog`) against derived balances on a scheduled cadence (NFR-008) — this is DB-016's rebuildability requirement (`database.md` §8) turned into an operational verification job, not a new mechanism.

## 6. Capacity and load shape (§43.2, PERF-020..025)

- **The dominant load event is a simultaneous timed assessment for a full cohort** (PERF-022) — capacity planning and load testing use this as the primary scenario, not an average-traffic model. This is why PERF-025's overload behavior specifically protects assessment and grading: under load, the system sheds non-essential work first — analytics, leaderboards, digests — before touching the assessment path.
- **Horizontal scaling at the application tier requires no code change and no instance-local state** (PERF-021, BE-006 — already the statelessness requirement in `backend.md` §3).
- **File and video delivery never consumes application compute** — it is served from object storage or the edge via signed URLs or the Content Gateway (PERF-024), consistent with `storage-and-content.md` §6's gateway design: the gateway issues tickets and streams from `ObjectStore`, it does not proxy bytes through application compute unnecessarily.
- **Read-heavy projections are cacheable with an explicit, documented staleness bound; grades and submissions are never served stale** (PERF-023) — this draws the caching boundary precisely: leaderboards/dashboards/progress may be eventually consistent within a stated bound, but a grade or submission read always reflects the current committed state.

## 7. Performance measurement, not invented targets (§43.1, D-05, GEN-027)

Every NFR in §43 is measurable or it is not a requirement (GEN-027) — where a realistic target can't yet be derived from a measured load profile, the SRS fixes the *metric and its measurement method* and marks the threshold TBD (D-05) rather than inventing a number that would be either trivially met or impossible. PERF-001..010 (API read/write latency, time-to-interactive, bundle size, autosave round trip, bulk grade release, upload throughput, video start time, search latency) are the ten metrics this architecture must be instrumented to measure from day one — the instrumentation points are fixed now (this is a Phase 2/24 CI-and-load-testing deliverable), even though the thresholds are set later from the first load test against production-shaped data.

## 8. Client platform scope (§41.1, Table 41.1; `docs/decisions/06-flutter-client-decision.md`)

V1 ships a Flutter desktop application (Windows/macOS/Linux) as the initial demo target (CONFIRMED, A-14, superseding the earlier web-first decision, A-02). The same Flutter application/codebase is architected from the outset to extend to Android and iOS as a FUTURE RELEASE, not V1 delivery — release timing is a Project Owner decision, not gated on an unmet-requirement trigger. The Installable PWA proposal and the responsive-web-client decision are both SUPERSEDED (SRS Table 41.1). Nothing in Phase 1 architecture should budget effort toward a browser-hosted client; distribution is native binaries, not a served web bundle (§1 above).

## 9. What this document does not decide

The concrete RPO/RTO numbers, the specific metrics/logging/tracing vendor or self-hosted stack, the container orchestration approach for the VPS target, and the runbook content are Phase 2 (repo/CI/CD), Phase 24 (performance), and Phase 25 (disaster recovery) deliverables, not Phase 1 architecture. Retention periods (§44, C-01 in the Assumptions Register) remain explicitly deferred pending D-06 (counsel) and are not addressed here.
