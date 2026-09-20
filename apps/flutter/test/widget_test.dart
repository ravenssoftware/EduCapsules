import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";

import "package:educapsules/app.dart";
import "package:educapsules/core/api_client.dart";
import "package:educapsules/core/secure_storage.dart";
import "package:educapsules/features/auth/auth_repository.dart";

/// In-memory fake — the real [FlutterSecureSessionStore] talks to a
/// platform channel that is unavailable under `flutter test`, so these
/// widget tests inject this instead rather than relying on that channel
/// failing closed (see that class's own doc comment for why it does, in
/// the real app, fail closed rather than crash).
class _FakeSessionStore implements SecureSessionStore {
  _FakeSessionStore({String? initialToken}) : _token = initialToken;

  String? _token;

  @override
  Future<void> clear() async => _token = null;

  @override
  Future<String?> readSessionToken() async => _token;

  @override
  Future<void> writeSessionToken(String token) async => _token = token;
}

void main() {
  testWidgets("EduCapsulesApp shows the login screen when no session is stored", (tester) async {
    final authRepository = AuthRepository(apiClient: ApiClient(), sessionStore: _FakeSessionStore());

    await tester.pumpWidget(EduCapsulesApp(authRepository: authRepository));
    await tester.pumpAndSettle();

    expect(find.text("Login to EduCapsules"), findsOneWidget);
    expect(find.text("Login"), findsOneWidget);
    expect(find.text("Email or Username"), findsOneWidget);
    expect(find.text("Password"), findsOneWidget);
  });

  testWidgets(
    "EduCapsulesApp shows the placeholder home screen when a session is already stored",
    (tester) async {
      final authRepository = AuthRepository(
        apiClient: ApiClient(),
        sessionStore: _FakeSessionStore(initialToken: "an-existing-session-token"),
      );

      await tester.pumpWidget(EduCapsulesApp(authRepository: authRepository));
      await tester.pumpAndSettle();

      expect(find.text("EduCapsules"), findsOneWidget);
      expect(
        find.text("Teach safely · Learn in order · Monitor with confidence"),
        findsOneWidget,
      );
    },
  );

  testWidgets("theme primary colour matches SRS Table 42.2 (UI-004)", (tester) async {
    final authRepository = AuthRepository(
      apiClient: ApiClient(),
      sessionStore: _FakeSessionStore(initialToken: "an-existing-session-token"),
    );

    await tester.pumpWidget(EduCapsulesApp(authRepository: authRepository));
    await tester.pumpAndSettle();

    final BuildContext context = tester.element(find.byType(Scaffold));
    expect(Theme.of(context).colorScheme.primary, const Color(0xFF1E7FC2));
  });
}
