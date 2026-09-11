# Open-Decision Register

**Phase:** 0
**Source:** SRS v1.1 §51 (Table 51.1), plus D-17/D-18 added by the v1.1 audit.
**Rule:** nothing here is decided by implementation. Each row states who decides, whether it blocks anything before launch, and — where it doesn't block launch — the generic, reversible interim behavior the code will implement so that resolving the decision later is a config change, not a rework.

Per Table 51.1, **only D-03, D-05, D-06, D-07, D-08 and D-17 are required before launch** (AC-20). None of the 18 items block starting the build.

| # | Decision | Owner | Launch-blocking? | Interim plan (reversible, no rework) |
|---|---|---|---|---|
| D-01 | Read-model strategy for dashboards/progress/leaderboards | Engineer | No — schema freeze only | Direct queries first. `ProgressSnapshot` (§37.3.3) is already specified as a rebuildable derived projection (DB-016); materializing it is additive, never a correctness dependency |
| D-02 | Concrete rate-limit budgets per endpoint class | Engineer | No — load-test plan | Config-driven limiter with conservative placeholder values; no number hard-coded in application logic |
| D-03 | Arabic/RTL launch scope | **Project Owner** | **Yes** | Build RTL-ready per FE-009 (logical CSS properties, externalized strings, no concatenated grammar) regardless of the answer; the launch locale set is a content/config decision, not a code fork |
| D-04 | Full brand token set (type scale, spacing, elevation, motion, icons, dark palette) | Design | No — component library | Seed semantic tokens from the working values already given in §42.2; swappable without touching component code (UI-004 requires this anyway) |
| D-05 | Performance thresholds | Engineer + QA | **Yes** | Instrument every metric named in §43.1 now (histograms, RUM); no threshold value invented anywhere in code or docs |
| D-06 | Retention periods, applicable data-protection regime, minors' data rules | **Project Owner + counsel** | **Yes** | Build the LIF-001..012 erasure/retention pipeline generically, with retention period as a per-data-category config value defaulting to "retain, do not auto-purge" until set |
| D-07 | V1 capacity model (cohort size, peak concurrent assessment, storage growth) | **Project Owner** | No — capacity planning | Size dev/staging conservatively; nothing in the architecture assumes a specific number |
| D-08 | Grade scale: numeric, letter, or configurable per organization | **Project Owner** | **Yes** | Schema (`Grade.scaled_score`, `grading_scale_snapshot`) already supports any of the three; **no default will be implemented without your sign-off** before Phase 13 — this is the one item I'd ask you to resolve earliest, since it's cheap to decide now and expensive to guess wrong |
| D-09 | Whether Achievements/Leaderboards ship in V1 or immediately after | Project Owner | No — sprint planning | Already SHOULD in the SRS, leaderboards ship disabled-by-default (LDB-009); build both, gate by a flag, no schedule commitment implied |
| D-10 | Assistant permission defaults: which permissions are delegatable out of the box | Project Owner | No — permission catalogue freeze | §26.2 already fixes which permissions are *structurally* delegatable (Yes/No column); "on by default in the delegation UI" is a Phase 16 UX default, not a backend blocker |
| D-11 | Whether the Math Knowledge Hub is V1 content or a distinct product surface | Project Owner | No — content model | FUTURE/COULD per §49; out of V1 build scope entirely until decided otherwise |
| D-12 | Payment verification SLA and who performs it at volume | Project Owner | No — operational readiness | Build the verification queue with SLA-relevant fields (submitted_at, reviewed_at, reviewer) now; the SLA number itself is operational |
| D-13 | Whether teacher content ownership permits platform reuse, and on what terms | Project Owner + counsel | No — Terms of Service | No code impact; ownership model itself (§33.2) is already fixed |
| D-14 | Session and token lifetimes per session type | Engineer | No — auth implementation, but should be set early | Config-driven, seeded with the indicative bands the SRS itself gives (§35.3: ~30–60 min idle / 7–30 days absolute for students; shorter for admins) |
| D-15 | Whether V1 supports more than one organization in production | Project Owner | No — tenancy testing scope | Irrelevant to architecture — GEN-019 requires structural multi-tenancy regardless of how many orgs actually launch |
| D-16 | Confirmation of the two source specs not supplied (`assistant_acc`, `classroom_details`) | **Project Owner** | No — but affects Phases 5–6 confidence | Building §9 (Classroom/Group) and §21 (Assistant) exactly as reconstructed in the SRS. Flagging again here because this is the one register item that could mean "the requirement is wrong," not just "a parameter is unset." |
| D-17 *(added in v1.1 audit)* | Progress-weighting formula per Activity type | Project Owner | **Yes** (Progress tracking is MUST for V1) | Completion-not-attainment principle (PRG-008) is binding regardless of formula; implement per-type weighting as config, default to equal weighting until you set the formula |
| D-18 *(added in v1.1 audit)* | Leaderboard ranking source, tie rule, reset period | Project Owner | No — blocks only *enabling* a leaderboard, which is off by default (LDB-009) | Config-driven; no leaderboard is user-visible until this is set and a Teacher/Admin explicitly enables it |

## Items requiring your attention soonest

Ranked by how early they'd otherwise force a guess:

1. **D-08 (grade scale)** — cheapest to decide now, most expensive to guess wrong once submissions exist.
2. **D-16 (reconstructed §9/§21)** — worth a quick read-through of those two sections against your original intent before Phase 5–6, since "confirm" vs "correct" changes what gets built.
3. **D-06 (retention/legal)** — not urgent for code, but has the longest lead time (needs counsel), so starting it now avoids it becoming the Phase 28 blocker.

Everything else can wait for its natural phase without any rework cost.
