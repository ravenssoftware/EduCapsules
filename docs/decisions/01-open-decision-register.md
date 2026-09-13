# Open-Decision Register

**Phase:** 0
**Source:** SRS v1.4 §51 (Table 51.1), plus D-17/D-18 added by the v1.1 audit. (None of D-01..D-18 are affected by the v1.4 Flutter client-strategy update — see `06-flutter-client-decision.md`; that was a CONFIRMED decision, not an open one.)
**Rule:** nothing here is decided by implementation. Each row states who decides, whether it blocks anything before launch, and — where it doesn't block launch — the generic, reversible interim behavior the code will implement so that resolving the decision later is a config change, not a rework.

Per Table 51.1 (as of v1.2), **D-03, D-05, D-06, D-07 and D-17 are required before launch** (AC-20). **D-08 is now RESOLVED** (below) — it was launch-blocking until the Project Owner resolved it directly; removed from the list accordingly, and D-17 added (it was omitted from the launch-blocking list when first registered in v1.1 — corrected in the same pass). 17 items remain open; none block starting the build.

| # | Decision | Owner | Launch-blocking? | Interim plan (reversible, no rework) |
|---|---|---|---|---|
| D-01 | Read-model strategy for dashboards/progress/leaderboards | Engineer | No — schema freeze only | Direct queries first. `ProgressSnapshot` (§37.3.3) is already specified as a rebuildable derived projection (DB-016); materializing it is additive, never a correctness dependency |
| D-02 | Concrete rate-limit budgets per endpoint class | Engineer | No — load-test plan | Config-driven limiter with conservative placeholder values; no number hard-coded in application logic |
| D-03 | Arabic/RTL launch scope | **Project Owner** | **Yes** | Build RTL-ready per FE-009 (logical CSS properties, externalized strings, no concatenated grammar) regardless of the answer; the launch locale set is a content/config decision, not a code fork |
| D-04 | Full brand token set (type scale, spacing, elevation, motion, icons, dark palette) | Design | No — component library | Seed semantic tokens from the working values already given in §42.2; swappable without touching component code (UI-004 requires this anyway) |
| D-05 | Performance thresholds | Engineer + QA | **Yes** | Instrument every metric named in §43.1 now (histograms, RUM); no threshold value invented anywhere in code or docs |
| D-06 | Retention periods, applicable data-protection regime, minors' data rules | **Project Owner + counsel** | **Yes** | Build the LIF-001..012 erasure/retention pipeline generically, with retention period as a per-data-category config value defaulting to "retain, do not auto-purge" until set |
| D-07 | V1 capacity model (cohort size, peak concurrent assessment, storage growth) | **Project Owner** | No — capacity planning | Size dev/staging conservatively; nothing in the architecture assumes a specific number |
| D-08 | ~~Grade scale: numeric, letter, or configurable per organization~~ | **Project Owner** | **RESOLVED** | **Decided:** grade scales are configurable per Organization; never a single global scale; the scale and criteria in force at grade creation/release are permanently preserved. Recorded in SRS v1.2 §17.1 (GRD-013..020) and §51 (D-08 row). Data model: new `GradingScale`/`GradingScaleVersion` entities (§37.3.3, copy-on-write, mirroring QuestionVersion/FileVersion), `Grade.grading_scale_version_id` pins the version at creation. Permission: `GRADING_SCALE_MANAGE` (Admin, §26.3). API: `/grading-scales` (§38.2). This is now unblocked for Phase 13. |
| D-09 | Whether Achievements/Leaderboards ship in V1 or immediately after | Project Owner | No — sprint planning | Already SHOULD in the SRS, leaderboards ship disabled-by-default (LDB-009); build both, gate by a flag, no schedule commitment implied |
| D-10 | Assistant permission defaults: which permissions are delegatable out of the box | Project Owner | No — permission catalogue freeze | §26.2 already fixes which permissions are *structurally* delegatable (Yes/No column); "on by default in the delegation UI" is a Phase 16 UX default, not a backend blocker |
| D-11 | Whether the Math Knowledge Hub is V1 content or a distinct product surface | Project Owner | No — content model | FUTURE/COULD per §49; out of V1 build scope entirely until decided otherwise |
| D-12 | Payment verification SLA and who performs it at volume | Project Owner | No — operational readiness | Build the verification queue with SLA-relevant fields (submitted_at, reviewed_at, reviewer) now; the SLA number itself is operational |
| D-13 | Whether teacher content ownership permits platform reuse, and on what terms | Project Owner + counsel | No — Terms of Service | No code impact; ownership model itself (§33.2) is already fixed |
| D-14 | Session and token lifetimes per session type | Engineer | No — auth implementation, but should be set early | Config-driven, seeded with the indicative bands the SRS itself gives (§35.3: ~30–60 min idle / 7–30 days absolute for students; shorter for admins) |
| D-15 | Whether V1 supports more than one organization in production | Project Owner | No — tenancy testing scope | Irrelevant to architecture — GEN-019 requires structural multi-tenancy regardless of how many orgs actually launch |
| D-16 | Confirmation of the two source specs not supplied (`assistant_acc`, `classroom_details`) | **Project Owner** | No — narrowed in v1.3, see below | **Narrowed, per Project Owner instruction:** every CLS-\*/GRP-\* (§9.2) and AST-\* (§21.2, §21.3) requirement is now individually classified in SRS v1.3 as CONFIRMED elsewhere or PROVISIONAL (Tables 9.1a / 21.1a). No requirement text was changed or invented — verified byte-identical to v1.2. The majority is CONFIRMED elsewhere (independently corroborated by a golden rule, another section, the data model, or a worked use case) and is safe to build against normally. Only **CLS-002, CLS-003, GRP-002, AST-009, and two rows of Table 21.2** are PROVISIONAL — build against them provisionally, but their *specific* final behavior needs your confirmation before it's treated as settled; this does not block the surrounding Phase 5/6 architecture (the authorization engine rests on GEN-006, and the Classroom/Group model on GEN-008 — both independently CONFIRMED, not reconstructed). |
| D-17 *(added in v1.1 audit)* | Progress-weighting formula per Activity type | Project Owner | **Yes** (Progress tracking is MUST for V1) | Completion-not-attainment principle (PRG-008) is binding regardless of formula; implement per-type weighting as config, default to equal weighting until you set the formula |
| D-18 *(added in v1.1 audit)* | Leaderboard ranking source, tie rule, reset period | Project Owner | No — blocks only *enabling* a leaderboard, which is off by default (LDB-009) | Config-driven; no leaderboard is user-visible until this is set and a Teacher/Admin explicitly enables it |

## Items requiring your attention soonest

Ranked by how early they'd otherwise force a guess:

1. **D-16's PROVISIONAL rows** (CLS-002, CLS-003, GRP-002, AST-009, two rows of Table 21.2) — worth a quick read-through against your original intent before Phase 5/6/16 finalize their specific behavior. Everything else in §9/§21 is already independently confirmed and doesn't need this.
2. **D-06 (retention/legal)** — not urgent for code, but has the longest lead time (needs counsel), so starting it now avoids it becoming the Phase 28 blocker.

~~D-08 (grade scale)~~ — resolved, see above.

Everything else can wait for its natural phase without any rework cost.
