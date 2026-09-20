# Design references — Login & Signup

Visual source of truth for the Flutter Login/Signup rebuild (frontend reset,
see repository history for the cleanup commit). Reproduce these as
faithfully as possible: layout, colors, typography, spacing, form fields,
role selectors, buttons.

- `01-login-and-general-signup.webp` — Login page (left promo panel + role
  selector + email/password card) and the general Signup page (role
  selector + Full Name/Email/Username/Password/Confirm/password-requirements
  checklist).
- `02-role-registration-forms.webp` — four dedicated registration forms:
  Teacher (purple), Student (green), Parent (pink), Admin (orange). Each has
  its own field set and section grouping — see the screenshot for exact
  fields per role.

## Screens to build (6 total)

1. Login
2. General Signup
3. Student registration
4. Teacher registration
5. Parent registration
6. Admin registration

No reference exists for an "Assistant" registration form — the fifth role
tile shown in the Login/Signup role selector. Don't invent a layout for it;
confirm with the project owner what it should contain, or fall back to the
general Signup fields until that's decided.

## Existing integration layer (already verified against the real API — reuse it)

- `apps/flutter/lib/core/api_client.dart` — thin HTTP client for
  `/api/v1/*`, parses RFC 9457 problem-detail error bodies.
- `apps/flutter/lib/core/secure_storage.dart` — `SecureSessionStore`
  abstraction + the real `flutter_secure_storage`-backed implementation
  (AUTH-125).
- `apps/flutter/lib/features/auth/auth_repository.dart` — `login()`,
  `verifyMfaChallenge()`, `logout()`, `register()` against the real
  `/api/v1/auth/*` endpoints. No business logic beyond calling the API and
  storing the session token (FE-002).

None of these three files depend on any UI code — they were deliberately
kept when the old Login/Signup screens were deleted, and the new
implementation should build on them rather than re-implementing HTTP/session
handling.

## Known backend gaps — do not invent behavior to paper over these

- **`POST /api/v1/auth/register`** (`apps/api/src/routes/auth.ts`) accepts
  only `organizationId`, `email`, `password`, `locale`, `timezone`. It has
  **no fields** for full name, phone, date of birth, gender, or any of the
  role-specific professional/academic/child/organization data the reference
  forms show. The UI can still collect and validate those fields, but they
  currently have nowhere to be persisted server-side. Don't fabricate a
  request body the server will silently ignore and call it "saved" —
  surface this as a known limitation (e.g. in a completion report), the
  same way the previous implementation did.
- **No OAuth/social-login provider is wired up anywhere in this backend** —
  no `/api/v1/auth/oauth/*` route, no provider config. Google/Apple/
  Microsoft buttons must not simulate a successful sign-in; show a clear
  "not configured" state instead.
- **Login/registration have no server-side concept of "role"** — neither
  `/api/v1/auth/login` nor `/api/v1/auth/register` accepts one. A role
  selector on these screens is a client-side-only concept (it may drive
  which registration form is shown, or future client-side routing) and
  must never be assumed to affect authorization, which is decided
  server-side by the Phase 5 authorization pipeline once a session exists.
