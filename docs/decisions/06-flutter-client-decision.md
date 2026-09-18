# Decision Record: Flutter as the EduCapsules Client Technology

**Status:** CONFIRMED · **Date:** 13 September 2026 · **Decided by:** Project Owner

## Decision

EduCapsules's client application is **Flutter**, not the previously approved React + Vite responsive web SPA.

- **Initial target (V1 demo):** Flutter Desktop (Windows, macOS, Linux).
- **Future release target:** the same Flutter application and codebase extends to Android and iOS, without rewriting business logic or UI structure. Release timing is a Project Owner decision, not gated on an unmet-requirement trigger.
- **Backend independence preserved:** the backend (TypeScript, Hono, Drizzle ORM, and the rest of the approved stack — `05-phase1-decisions-pending-approval.md`) is unchanged and remains client-agnostic. Any future client — Flutter or otherwise — consumes the same authorised API without rewriting core business logic (SRS GEN-004).

## Rationale

The Project Owner's product strategy is to demonstrate EduCapsules as a desktop Flutter application first, then release the same client architecture as Android and iOS mobile applications, sharing one codebase across all three rather than maintaining separate web, Android and iOS clients.

## Alternatives considered

- **React + Vite (the prior decision, A-02):** a responsive web SPA. Superseded because the Project Owner's demo and release strategy specifically calls for a native desktop-first, then mobile, application — a single Flutter codebase serves both without the separate-codebase cost a web SPA plus native wrappers would carry.
- **Web SPA + native wrapper (e.g., Electron/Capacitor) for desktop/mobile:** not selected; Flutter's own multi-platform compilation serves the same goal more directly, with one framework instead of a web app plus a wrapper layer.

## What is superseded, and what is not

**Superseded** (was CONFIRMED in SRS v1.0–v1.3, now historical):
- The responsive web application as the V1 client (SRS §41.1 Table 41.1, §5.2, the "PLATFORM DECISION" box).
- The Installable PWA proposal (SRS §41.1, §49) — a PWA has no meaning for a native Flutter build; the row is marked SUPERSEDED in the SRS rather than deleted, for traceability.
- The Assumptions Register's A-02 (React + Vite) — see `02-assumptions-register.md`, marked SUPERSEDED with a pointer here.

**Not changed:**
- The backend stack approval (`05-phase1-decisions-pending-approval.md`, items 1–9: TypeScript, Hono, Drizzle ORM, ObjectStore/JobQueue interfaces, pnpm, Vitest, Playwright, GitHub Actions) and the portability directive (A-13) — the backend never depended on the client technology.
- Every SRS requirement not specifically about client platform, browser mechanics, or the web-first scope decision (authorization, data model, grading, content protection, etc.) — none of it referenced React, Vite, or the web stack, so none of it needed to change.
- The 28-phase roadmap's dependency order — only the *client* half of the role-experience phases (14–17, 22, 26) changes what it builds against; the phase sequence itself is unaffected.

## Affected documents

- `docs/srs/EduCapsules_Master_SRS_v1.0.docx` / `.md` — the official consolidated baseline; see `docs/srs/README.md` and the SRS's own Appendix E (§52.5) for the itemised requirement-level changes.
- `docs/decisions/02-assumptions-register.md` — A-02 marked SUPERSEDED, new confirmed entry added.
- `docs/architecture/*.md` — client-facing references updated from React/Vite/web to Flutter; backend/database/auth/storage/security architecture is otherwise unaffected since none of it depended on the client framework.
- `docs/decisions/03-implementation-roadmap.md` — Phase 2 and the client-facing role-experience phases (14–17, 22, 26) updated to reference Flutter deliverables instead of a React/Vite web app.
- `docs/srs-traceability/00-traceability-strategy.md` and `matrix.csv` — client-responsibility column now points at the Flutter codebase, not `apps/web` (React).
- `docs/README.md`, root `README.md`.

## Affected phases

- **Phase 2** (Repository, CI/CD & Environment Foundation): the monorepo now provisions a Flutter client app (not a React/Vite web app) alongside the unchanged backend; CI adds Flutter-appropriate checks (format, static analysis, unit/widget tests) alongside the existing backend checks.
- **Phases 14–17, 22** (Teacher/Student/Assistant/Parent/Admin experience): built as Flutter screens against the same authorised API, not React components.
- **Phase 26** (Complete QA/E2E): Flutter desktop testing (unit, widget, integration) is the V1 test target; Android/iOS testing is added when the mobile release is scheduled. Playwright is retained where it is genuinely useful (see `docs/decisions/03-implementation-roadmap.md` for where that is) rather than removed outright — a previously approved tool is never silently dropped, only re-scoped with a recorded reason.

## Consequences

- One client codebase to build and test for the desktop demo, extensible to mobile without a rewrite — directly serves the "architected from the beginning for desktop, Android and iOS" requirement.
- **New risk (SRS R-14, §50.2):** the V1 desktop-first strategy does not directly serve students who own only a low-end mobile phone (SRS CON-05's target population) until the Android/iOS release ships. Mitigation: treat the mobile release as a near-term platform-target addition, not a speculative future rewrite, and avoid scheduling full-population rollout ahead of it.
- Client-side session/token storage moves from browser cookies to platform secure credential storage (SRS AUTH-125) — a lower-risk mechanism for a native client, not a compromise.
- Distribution moves from web hosting (Cloudflare Pages serving a static bundle) to native binary distribution (installer download for desktop, app stores for the future mobile release) — this removes "static client delivery" as a backend/infrastructure concern (SRS Table 41.3).

## Reversibility

Medium-high. Flutter/Dart is a different language and toolchain from TypeScript/React; reverting to a web client would mean a client rewrite, not a configuration change. The backend is unaffected either way — its independence from client technology (SRS GEN-004) is exactly what makes this decision reversible in principle without touching business logic, even though the client rewrite cost itself would be real.
