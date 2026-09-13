# EduCapsules — Flutter client

**Status:** Repository/engineering foundation only (Phase 2). No role experience is implemented yet.

Flutter Desktop (Windows/macOS/Linux) is the V1 demo target; the same codebase extends to Android and iOS as a future release — see [`docs/decisions/06-flutter-client-decision.md`](../../docs/decisions/06-flutter-client-decision.md) at the repo root for the full decision record, and [`docs/architecture/README.md`](../../docs/architecture/README.md) for the system architecture this client talks to.

## Structure

- `lib/app.dart` — the root widget (`MaterialApp` shell, theme wiring). No routing framework or API client yet.
- `lib/theme/` — semantic colour tokens (SRS Table 42.2, UI-004) and the app theme built from them.
- `lib/screens/` — the placeholder boot screen. Real screens start in Phase 14+.
- `lib/features/{teacher,student,assistant,parent,admin}/` — empty, one per role experience per the [implementation roadmap](../../docs/decisions/03-implementation-roadmap.md) (Phases 14, 15, 16, 17, 22).

## Commands

```sh
flutter pub get       # install dependencies
flutter analyze        # static analysis
dart format --output=none --set-exit-if-changed .   # formatting check
flutter test           # unit/widget tests
flutter run -d linux    # run the desktop app (or -d macos / -d windows)
flutter build linux    # build a release binary
```

No Android SDK or Xcode toolchain is required to work on the desktop target. They're only needed when the Android/iOS release (a separate, later decision) is scheduled.
