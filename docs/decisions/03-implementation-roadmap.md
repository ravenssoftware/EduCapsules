# Implementation Roadmap & Requirements-to-Module Map

**Phase:** 0
**Status:** Confirms and formalizes the 28-phase roadmap given by the Project Owner. No changes to phase order or scope were made — I cross-checked it against the SRS and it maps cleanly. One gap is flagged below (§3) for awareness, not as a decision requiring approval — it's a sequencing completeness note, not a product change.

This document is stack-agnostic: module paths are indicative (`apps/api/src/modules/<name>`) and will be finalized in Phase 1 once the backend framework proposal (see Assumptions Register, section B) is confirmed.

## 1. Dependency order (as given, confirmed feasible)

```
SRS → Decisions → Architecture → Repo/CI/CD → Database Foundation → Authentication →
Authorization → Organization/Tenancy → Academic Structure → Teaching Sessions →
Storage → Content Protection → Question Bank → Activities → Submissions → Grading →
Progress → Teacher → Student → Assistant → Parent → Communication →
Notifications/Calendar → Achievements/Leaderboards → Payments/Entitlements →
Administration → Security Hardening → Performance → Disaster Recovery → QA/E2E →
Traceability → V1 Acceptance → Production
```

This is a valid topological ordering of the SRS's own dependencies (§7 authorization before anything that uses it; §8–9 tenancy/academic structure before content or activities; §12–13 activities/question-bank before §14 submissions; grading after submissions; every role experience after the authorization model it depends on is proven). No reordering needed.

## 2. Phase → SRS sections → requirement prefixes → module map

| Phase | SRS sections | Prefixes | Planned module(s) |
|---|---|---|---|
| 0 | §1, §51, Appendix A–E | D, R, CON | `docs/decisions/`, `docs/srs-traceability/` |
| 1 | §5, §34, §37, §39, §41 | GEN, SEC, DB, BE, INF | `docs/decisions/` (architecture proposal), no code |
| 2 | §39 (BE-006..010), §41.3–41.5 | BE, INF | repo root, `.github/workflows/`, `packages/config` |
| 3 | §8, §37.3.1 | ORG, DB | `apps/api/src/modules/identity/`, `database/migrations/0001_*` |
| 4 | §35, §36 | AUTH, AUD | `apps/api/src/modules/auth/` |
| 5 | §6, §7, §9, §21, §22, §26 | SEC, CLS/GRP, AST, PAR, ORG | `apps/api/src/modules/authz/` (the centralized policy engine — §7.1's pipeline lives here and nowhere else). D-16 (§9/§21 provenance, v1.3) does not block this — the pipeline itself rests on GEN-006/GEN-008, both independently CONFIRMED |
| 6 | §8.1 (PER — v1.1), §9, §10 | PER, CLS/GRP, SUB/CRS/CYC/TOP | `apps/api/src/modules/academic-structure/`. Before implementing CLS-002/CLS-003/GRP-002 specifically, check SRS Table 9.1a — they're PROVISIONAL (D-16); everything else in §9 is confirmed elsewhere and unaffected |
| 7 | §11 | SES | `apps/api/src/modules/teaching-sessions/` |
| 8 | §14, §37.3.4 | STR | `apps/api/src/modules/storage/` |
| 9 | §15, §16, §37.3.4 | CNT | `apps/api/src/modules/content-gateway/` |
| 10 | §13 | QBN | `apps/api/src/modules/question-bank/` |
| 11 | §12, §45.1 | ACT | `apps/api/src/modules/activities/` |
| 12 | §12.6, §45.2, DB-013 | ACT, DB | `apps/api/src/modules/submissions/` |
| 13 | §17, §45.3 | GRD, PRG | `apps/api/src/modules/grading/` — D-08 resolved (grading scale configurable per Organization, GRD-013..020); no longer blocked |
| 14 | §19, §24, §25, S-02/06/07/08/09/12/13 | TCH, UI | `apps/web/src/features/teacher/` |
| 15 | §20, §24, §25, S-01/10/11/14/15 | STU, UI | `apps/web/src/features/student/` |
| 16 | §21, S-03 | AST | `apps/web/src/features/assistant/`. Before implementing AST-009 (concurrent Teacher relationships) specifically, check SRS Table 21.1a — it's PROVISIONAL (D-16); everything else in §21 is confirmed elsewhere and unaffected |
| 17 | §22, S-04 | PAR | `apps/web/src/features/parent/` |
| 18 | §27 | MSG | `apps/api/src/modules/communication/` |
| 19 | §28, §29 | NOT, CAL | `apps/api/src/modules/notifications/`, `apps/api/src/modules/calendar/` |
| 20 | §18, S-15 | ACH, PTS, LDB | `apps/api/src/modules/gamification/` |
| 21 | §30, §31 | PAY, BIL | `apps/api/src/modules/payments/` |
| 22 | §23, §26.3–26.4 | ADM | `apps/api/src/modules/admin/`, `apps/web/src/features/admin/` |
| 23 | §34.3–34.4, Threat model | SEC | cross-cutting — no new module, adversarial test pass over all of the above |
| 24 | §43.1–43.2 | PERF | `tests/performance/` |
| 25 | §41.4–41.5, §44 | INF, LIF | `infrastructure/`, `scripts/backup/` |
| 26 | §47 | QA, TC | `tests/` (all levels) |
| 27 | §48 | TRC | `docs/srs-traceability/` |
| 28 | §48.1, §51 | AC | `docs/decisions/` (readiness report) |

## 3. Gap flagged during cross-check (informational, not a decision)

**AcademicPeriod (PER-001..006, added in the v1.1 audit) wasn't named in the original Phase 3 or Phase 6 scope**, but it's structurally required before Classroom/Enrollment/Course can be built correctly — Table 37.7 states "one active Classroom per student per AcademicPeriod" as an enforced cardinality rule, and Classroom/Course/Enrollment all carry `academic_period_id` as a required field. I've placed it in **Phase 6** (Core Academic Structure) alongside Classroom/Group, above, since that's where it's load-bearing. No SRS requirement changes — this is a build-sequencing note only, surfaced now so it doesn't get missed when Phase 6 starts.

## 4. Definition of done per phase

Unchanged from the Project Owner's Phase Completion Gate (§7 of the master build instructions): requirements reviewed, dependencies satisfied, architecture respected, DB/backend/frontend implemented as applicable, authorization implemented, audit implemented where required, error handling implemented, tests written and passing, security checked, documentation updated, SRS traceability updated, no known critical regression, no silent requirement change. I'll report against this checklist explicitly at the end of every phase, plus: files created/modified, tests run, commit hash, push status, remaining work — per the GitHub workflow rules already agreed.
