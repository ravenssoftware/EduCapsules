import "package:flutter/material.dart";

import "core/api_client.dart";
import "core/secure_storage.dart";
import "features/auth/auth_repository.dart";
import "features/auth/login_screen.dart";
import "screens/placeholder_home_screen.dart";
import "theme/app_theme.dart";

/// The root widget. Phase 4 wires real authentication for the first time
/// (see docs/auth/authentication.md) — no role experience (Teacher/
/// Student/Assistant/Parent/Admin, Phases 14-17/22) is implemented yet, so
/// a successful sign-in currently lands on the same placeholder screen
/// Phase 2 shipped, now reachable only through a real session.
class EduCapsulesApp extends StatelessWidget {
  const EduCapsulesApp({super.key, AuthRepository? authRepository}) : _authRepository = authRepository;

  /// Injectable for tests; production uses the real API client + secure
  /// storage built below.
  final AuthRepository? _authRepository;

  @override
  Widget build(BuildContext context) {
    final authRepository =
        _authRepository ??
        AuthRepository(apiClient: ApiClient(), sessionStore: FlutterSecureSessionStore());

    return MaterialApp(
      title: "EduCapsules",
      debugShowCheckedModeBanner: false,
      theme: buildEduCapsulesTheme(),
      home: AuthGate(authRepository: authRepository),
    );
  }
}

/// Shows the login screen or the (placeholder) authenticated area
/// depending on whether a session token is already in secure storage. This
/// is a client-side convenience only (FE-002/GEN-024) — it is never an
/// authorization decision, and the server re-validates the session on
/// every request regardless of what this widget renders.
class AuthGate extends StatefulWidget {
  const AuthGate({super.key, required this.authRepository, this.organizationId = "demo-organization"});

  final AuthRepository authRepository;

  /// Phase 4 does not build organization selection/onboarding (that is a
  /// later-phase concern — see docs/auth/authentication.md's known
  /// limitations) — this constant is a placeholder a later phase replaces
  /// with real organization resolution. It is not a security boundary:
  /// the server is what actually scopes every request to an organization.
  final String organizationId;

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _checkingSession = true;
  bool _authenticated = false;

  @override
  void initState() {
    super.initState();
    _checkStoredSession();
  }

  Future<void> _checkStoredSession() async {
    final hasSession = await widget.authRepository.hasStoredSession();
    if (!mounted) return;
    setState(() {
      _authenticated = hasSession;
      _checkingSession = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingSession) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_authenticated) {
      return const PlaceholderHomeScreen();
    }
    return LoginScreen(
      authRepository: widget.authRepository,
      organizationId: widget.organizationId,
      onAuthenticated: () => setState(() => _authenticated = true),
    );
  }
}
