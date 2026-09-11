# Architecture Readiness Report

**Phase:** 0 — Specification & Decision Freeze
**Status:** Draft for Project Owner review
**Source of truth:** `docs/srs/EduCapsules_Master_SRS_v1.3.docx` (see `docs/srs/README.md` for provenance)

This report states what the SRS already fixes (so it is *not* re-decided here) and what it deliberately leaves open. Per the Project Owner's instruction, **no architectural or product decision in this report is being locked in Phase 0** — items requiring a decision are marked and routed to Phase 1 (System Architecture) for formal sign-off, or to the Project Owner directly where the SRS itself says so.

## 1. What the SRS already fixes (not open for re-decision)

These are CONFIRMED in the SRS and treated as immovable constraints for every later phase, unless the Project Owner initiates a change through the SRS's own change-control process (§1.5):

| Area | Fixed by | What it means for the build |
|---|---|---|
| Authorization | §7.1 (11-stage pipeline), GEN-003/004/025 | One centralized authorization pipeline; server-side only; no per-endpoint ad hoc checks; object-level checks on every protected operation |
| Tenant isolation | GEN-019, DB-001, DB-011, ORG-001..004 | `organization_id` on every scoped table, part of every query predicate, composite FKs; structural, not a filter |
| Data model shape | §37 (entity catalogue, invariants, cardinality) | The logical model — entities, relationships, ownership — is normative. Physical choices (indexing, partitioning, table-vs-JSON-column) are not (DB-000) |
| Content protection | §16 (GEN-016/017), Content Gateway pattern | Protected content never reaches a client as a durable URL; short-lived signed access only |
| Versioning | GEN-015, DB-006 | Copy-on-write for Files/Questions/Content; consumers pin a version id; published content never changes under a student |
| API shape | §38 | Resource-oriented JSON, `/api/v1/` path versioning, RFC 9457 errors, cursor pagination, idempotency keys on mutations, OpenAPI 3.1 spec-first with CI drift detection |
| Backend layering | §39.1 | Edge / Transport / Authorization / Domain / Persistence / Integration / Background — each with explicit prohibitions (e.g. Domain layer has zero HTTP/DB-engine dependency) |
| Infrastructure path | CON-01, CON-02, §41.3–41.5 | MVP **must** run on Cloudflare (Workers/D1/R2/Queues/KV/Pages); production **must** be an InterServer Linux VPS (containers/Postgres/Redis/S3-compatible), fronted by Cloudflare edge. This is a stated project constraint, not an option. |
| Portability contract | BE-008 | Every platform primitive (object storage, queue, cache, mail, scheduler) sits behind an interface with **at least two implementations exercised in CI from sprint one** — not retrofitted later |
| State machines | §45 | Activity, Submission, Grade, Enrollment, AssistantAssignment, ParentLink, PaymentRecord, File, ContentItem, User, LoginSession, AchievementAward lifecycles are normative; invalid transitions must be rejected (409/422), not merely discouraged in the UI |
| Roles & permission model | §6–§9, §21–§26 | Five roles (Teacher, Assistant, Student, Parent, Admin); closed permission catalogue; scope containment rules; Assistant = Assignment+Scope+Permissions with no amplification (SEC-006) |
| Commercial model (V1) | §30, BR-001..BR-015 | Manual evidence-based payment verification; no payment gateway in V1; revenue-share figures are reportable, not platform-executed (PAY-014) |

**Readiness verdict: the SRS is sufficient to begin Phase 1 architecture design.** It is unusually explicit for a document of this kind — the open items below are the genuine gaps, not oversights on my part.

## 2. What is genuinely open — and who decides it

### 2a. Decisions that are the Project Owner's alone (not mine to propose a default for)

These are called out explicitly in the SRS itself as requiring Owner (and in some cases counsel) input. I am not proposing values for them — see the Open-Decision Register (`01-open-decision-register.md`) for the full list and my interim-safe-default plan for each. The ones with real near-term impact:

- ~~D-08 — Grade scale~~ **RESOLVED** by explicit Project Owner decision: configurable per Organization, never global, scale/criteria preserved at grade creation/release. See SRS v1.2 §17.1 (GRD-013..020) and the Open-Decision Register.
- **D-06 — Retention periods & applicable data-protection regime.** Legal decision requiring counsel. Does not block building the erasure/retention *pipeline* (LIF-001..012), which is designed generically with retention as a config value — but the actual numbers cannot be invented.
- **D-05 — Performance thresholds.** Cannot be set before a load test exists (Phase 24). Metrics and instrumentation points are fixed now (§43.1); the numbers are not.
- **D-16 — Two source documents never supplied** (`assistant_acc`, `classroom_details`). **Narrowed in v1.3, per Project Owner instruction**: every affected requirement in §9 and §21 is now individually labeled CONFIRMED elsewhere or PROVISIONAL (SRS Tables 9.1a/21.1a) — no requirement text changed or invented. The majority is independently corroborated elsewhere in the SRS and is being built normally. Only **CLS-002, CLS-003, GRP-002, AST-009**, and two rows of Table 21.2 are PROVISIONAL — built against provisionally, final behavior pending your confirmation. This does not block Phase 5 (authorization rests on the independently-CONFIRMED GEN-006) or Phase 6 (Classroom/Group structure rests on the independently-CONFIRMED GEN-008).

### 2b. Decisions the SRS deliberately leaves to the architect (GEN-013) — routed to Phase 1, not decided here

The SRS fixes *what* must be true of the backend (§39) and *where* it must run (CON-01/CON-02) but deliberately does not name a language, framework, or ORM. That selection is real architecture work and belongs in Phase 1's "Define backend architecture / database architecture" task, not Phase 0. I have candidate recommendations ready (see the Assumptions Register) and will bring them to you as a formal proposal when Phase 1 starts, rather than assuming them now.

Decisions in this category **already made by you**, not by me, and treated as confirmed:
- SRS baseline: **v1.3** (v1.1 audited, plus your D-08 and D-16 resolutions — see the Open-Decision Register).
- Frontend framework: **React + Vite (SPA)**.

## 3. Repository state

Greenfield except for `docs/srs/` (the reference SRS) and `README.md`. No code, schema, or CI exists yet. Nothing to reconcile or preserve.

## 4. Recommendation

Proceed to complete the remaining Phase 0 deliverables (open-decision register, assumptions register, roadmap, traceability baseline — none of which require the stack decision to be locked). Bring the backend/ORM/tooling proposal to you explicitly at the start of Phase 1 for approval before any of it is implemented.
