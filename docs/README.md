# EduCapsules — Documentation Index

Start here on any device: clone the repo, read this file, follow the links.

## Source of truth
- [`srs/`](srs/README.md) — the Master SRS (v1.3: v1.1 audit + D-08 grading-scale resolution + D-16 §9/§21 provenance classification). All requirement IDs referenced anywhere in this repo point here.

## Phase 0 — Specification & Decision Freeze
- [`decisions/00-architecture-readiness-report.md`](decisions/00-architecture-readiness-report.md) — what the SRS fixes vs. what's genuinely open
- [`decisions/01-open-decision-register.md`](decisions/01-open-decision-register.md) — all 18 open decisions (D-01..D-18), owner, launch-blocking status, interim plan
- [`decisions/02-assumptions-register.md`](decisions/02-assumptions-register.md) — every assumption in play, tagged confirmed / proposed-pending-approval / deferred
- [`decisions/03-implementation-roadmap.md`](decisions/03-implementation-roadmap.md) — the 28-phase build order, mapped to SRS sections and planned modules

## Traceability
- [`srs-traceability/00-traceability-strategy.md`](srs-traceability/00-traceability-strategy.md) — the mechanism (format, CI enforcement plan, test-level map)
- [`srs-traceability/matrix.csv`](srs-traceability/matrix.csv) — the live requirement → module → test matrix (populated incrementally, phase by phase)

## Not yet created (arrives with the phases that produce them)
`architecture/`, `database/`, `api/`, `security/`, `deployment/`, `testing/` — per the repository structure agreed with the Project Owner.
