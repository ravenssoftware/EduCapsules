# Requirements Traceability Strategy

**Phase:** 0
**Purpose:** define the mechanism now (per TRC-001), populate it incrementally as each phase implements requirements. A ~600-row matrix with nothing behind it yet would be documentation for its own sake — the SRS's own chain (BR → Requirement → Use Case → Test → Acceptance, §48.2) only becomes meaningful once there's a module and a test on the other end of each link.

## 1. The chain (per SRS §48.2, unchanged)

```
Business Rule → Requirement (ID) → Use Case (UC-xxx) → Test Case (TC-xxx) → Acceptance Criterion (AC-xxx)
```

Every requirement marked **MUST** must reach at least one test. Every test must reach at least one requirement. Every AC must be satisfiable by named tests. (TRC-001/TRC-002/§48.2's own rule.)

## 2. Storage format

`docs/srs-traceability/matrix.csv` — one row per requirement ID, columns:

```
id, title, srs_section, priority, module_path, test_ids, status, notes
```

- `status` ∈ `pending | in_design | in_dev | in_test | accepted` (TRC-004).
- `module_path` points at the implementing module (per the map in `docs/decisions/03-implementation-roadmap.md`).
- `test_ids` is a `;`-separated list of test identifiers (file path + test name, e.g. `apps/api/tests/authz.spec.ts::denies cross-tenant read` for the backend, or `apps/flutter/test/features/grading/grading_screen_test.dart::shows released grade only` for the client).

CSV rather than a database: it's diffable in PRs, reviewable without tooling, and greppable — consistent with "prefer focused, reviewable artifacts" and with the repo being the single source of truth from any device.

## 3. Population plan

- **Not populated now.** Phase 0 defines the format only.
- **Populated incrementally**: every phase, when it implements a set of requirement IDs, adds/updates their rows in the same commit as the implementation — this is now part of the Phase Completion Gate ("SRS traceability updated") already agreed.
- Starting with Phase 3 (Database Foundation), each phase's rows are added for the prefixes it owns per the module map (e.g. Phase 4 adds all `AUTH-*` and relevant `AUD-*` rows).

## 4. CI enforcement (built in Phase 2, not before)

A script (`scripts/check-traceability.ts`, to be written when Phase 2 sets up CI) will:
1. Parse the SRS's requirement-ID inventory (extractable from `docs/srs/EduCapsules_Master_SRS_v1.0.md` — every `**XXX-nnn**` bolded ID in a requirements table).
2. Fail the build if any `MUST` ID has `status = accepted` claimed without at least one `test_ids` entry that exists in the actual test suite (TRC-002).
3. This is additive to, not a replacement for, normal test-suite pass/fail — it checks *coverage of the right things*, not just that some tests pass (the SRS is explicit about this: "Coverage Percentage Is Not the Target," §47.2).

## 5. Requirements-to-test-level map (§47.1, confirmed applicable, no changes)

| SRS test level | What it covers | Gate |
|---|---|---|
| Unit | Domain rules in isolation: grading arithmetic, scope containment, points calculation, state-machine guards, late policy, attempt limits | Every commit |
| Integration | Service + persistence + authorization together, against a real DB engine | Every PR |
| Contract | Every endpoint vs. the OpenAPI spec, both directions | Every PR — drift fails the build (API-011) |
| End-to-end | The 22 SRS use cases (§46) driven through the real client — `integration_test` against the Flutter desktop build; Playwright retained at the API/contract level where it's genuinely useful (`06-flutter-client-decision.md`), not for client UI since the client is no longer a browser app | Every release |
| Security | Authorization matrix, IDOR probes, injection, XSS, CSRF, SSRF, upload abuse, rate-limit behavior, token replay, session revocation | Every PR (fast subset) + full sweep before release |
| Performance/load | Full-cohort simultaneous assessment (PERF-022) + the AP-1..AP-10 access patterns | Before launch, and before any release touching an assessment path |
| Accessibility | Flutter's own accessibility test matchers (`meetsGuideline` — text contrast, tap-target size, labeled tap targets) every screen; manual keyboard/screen-reader (desktop OS accessibility APIs) on core flows | Automated every PR; manual before release |
| Migration | Full MVP→production rehearsal | Before cutover, and after any schema change touching an academic table |
| Usability | NFR-020 (teacher), NFR-021 (student) moderated sessions | Before launch |
| Disaster recovery | Restore-from-backup into a clean environment | Quarterly + before launch |

The mandatory coverage areas from §47.2 (authorization pipeline negative tests for every role×scope×permission combination in §26; every grading mode/override/release/regrade path; timer/window/attempt-limit/concurrent-submit/network-loss/answer-key-exclusion; every state-machine transition, positive *and* invalid; payment/entitlement state separation; cross-tenant read/write for every scoped resource group; both BE-008 abstraction implementations) carry over unchanged as the acceptance bar for the corresponding phases (5, 13, 11–12, 21, 3, 2 respectively).

## 6. What "traceability updated" means per phase, concretely

At the end of each phase, the phase report (per the GitHub workflow rules) includes: which `matrix.csv` rows were added/changed, and a spot-check that every `MUST` requirement implemented in that phase has ≥1 real test id, not a placeholder.
