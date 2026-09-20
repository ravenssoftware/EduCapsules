import "dart:convert";
import "dart:io";

import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:http/http.dart" as http;
import "package:http/testing.dart";

import "package:educapsules/core/api_client.dart";
import "package:educapsules/core/secure_storage.dart";
import "package:educapsules/features/auth/auth_repository.dart";
import "package:educapsules/features/auth/login_screen.dart";
import "package:educapsules/features/auth/signup_screen.dart";
import "package:educapsules/features/auth/widgets/gradient_button.dart";

/// Taps the primary gradient action button (there is exactly one per
/// screen under test here) — more robust than `find.text("Login")`, whose
/// computed tap offset is the *text's* tight bounding box, not necessarily
/// centred within the button's full hit-testable area.
Future<void> _tapPrimaryButton(WidgetTester tester) async {
  await tester.tap(find.byType(GradientActionButton));
}

class _InMemorySessionStore implements SecureSessionStore {
  String? token;

  @override
  Future<void> clear() async => token = null;

  @override
  Future<String?> readSessionToken() async => token;

  @override
  Future<void> writeSessionToken(String value) async => token = value;
}

http.Response _jsonResponse(int status, Map<String, dynamic> body) =>
    http.Response(jsonEncode(body), status, headers: {"content-type": "application/json"});

/// Not pumpAndSettle(): a focused TextFormField's cursor-blink timer never
/// stops on its own, so pumpAndSettle() hangs (times out) whenever a field
/// still has focus, which it does immediately after enterText(). A few
/// explicit frames are enough for the async MockClient response and the
/// resulting rebuild to land.
Future<void> _pumpAfterAsyncWork(WidgetTester tester) async {
  for (var i = 0; i < 10; i++) {
    await tester.pump(const Duration(milliseconds: 50));
  }
}

/// 800x600 (the flutter_test default) is shorter than the login card's
/// natural content height plus the pinned legal footer, so the Login
/// button sits below the fold — a real user would just scroll, but these
/// interaction tests care about behaviour, not scroll mechanics, so they
/// use a comfortably tall desktop-sized surface instead.
Future<void> _pumpAtDesktopSize(WidgetTester tester, Widget child) async {
  await tester.binding.setSurfaceSize(const Size(900, 1000));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(MaterialApp(home: child));
}

void main() {
  testWidgets("shows validation errors and never calls the API when the form is empty", (tester) async {
    var wasCalled = false;
    final client = MockClient((request) async {
      wasCalled = true;
      return _jsonResponse(200, {"status": "authenticated", "sessionToken": "t", "userId": "u"});
    });
    final authRepository = AuthRepository(
      apiClient: ApiClient(httpClient: client),
      sessionStore: _InMemorySessionStore(),
    );

    await _pumpAtDesktopSize(
      tester,
      LoginScreen(authRepository: authRepository, organizationId: "org-1", onAuthenticated: () {}),
    );

    await _tapPrimaryButton(tester);
    await tester.pump();

    expect(find.text("Enter your email or username."), findsOneWidget);
    expect(find.text("Enter your password."), findsOneWidget);
    expect(wasCalled, isFalse);
  });

  testWidgets("role selector defaults to Student and switching roles updates the selected tile", (tester) async {
    // Semantics are only computed on demand; a handle must be held for the
    // duration of the test for the tree to be built at all. Disposed
    // explicitly at the end of the test body (not via addTearDown, which
    // runs after the framework's own end-of-test semantics-handle check).
    final semanticsHandle = tester.ensureSemantics();

    final authRepository = AuthRepository(
      apiClient: ApiClient(httpClient: MockClient((_) async => _jsonResponse(200, {}))),
      sessionStore: _InMemorySessionStore(),
    );

    await _pumpAtDesktopSize(
      tester,
      LoginScreen(authRepository: authRepository, organizationId: "org-1", onAuthenticated: () {}),
    );
    await tester.pump();

    bool isSelected(String label) =>
        tester.getSemantics(find.bySemanticsLabel("$label role")).flagsCollection.isSelected;

    expect(isSelected("Student"), isTrue);
    expect(isSelected("Teacher"), isFalse);

    await tester.tap(find.bySemanticsLabel("Teacher role"));
    await tester.pump();

    expect(isSelected("Teacher"), isTrue);
    expect(isSelected("Student"), isFalse);

    semanticsHandle.dispose();
  });

  testWidgets("password visibility toggle switches the obscured state", (tester) async {
    final authRepository = AuthRepository(
      apiClient: ApiClient(httpClient: MockClient((_) async => _jsonResponse(200, {}))),
      sessionStore: _InMemorySessionStore(),
    );

    await _pumpAtDesktopSize(
      tester,
      LoginScreen(authRepository: authRepository, organizationId: "org-1", onAuthenticated: () {}),
    );

    expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);
    expect(find.byIcon(Icons.visibility_outlined), findsNothing);

    await tester.tap(find.byIcon(Icons.visibility_off_outlined));
    await tester.pump();

    expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
    expect(find.byIcon(Icons.visibility_off_outlined), findsNothing);
  });

  testWidgets("valid credentials call the real repository and trigger onAuthenticated", (tester) async {
    Map<String, dynamic>? sentBody;
    final client = MockClient((request) async {
      sentBody = jsonDecode(request.body) as Map<String, dynamic>;
      return _jsonResponse(200, {"status": "authenticated", "sessionToken": "session-abc", "userId": "user-1"});
    });
    final sessionStore = _InMemorySessionStore();
    final authRepository = AuthRepository(apiClient: ApiClient(httpClient: client), sessionStore: sessionStore);

    var authenticated = false;
    await _pumpAtDesktopSize(
      tester,
      LoginScreen(
        authRepository: authRepository,
        organizationId: "org-1",
        onAuthenticated: () => authenticated = true,
      ),
    );

    await tester.enterText(find.widgetWithText(TextFormField, "Enter your email or username"), "person@example.com");
    await tester.enterText(find.widgetWithText(TextFormField, "Enter your password"), "correct-password");
    await _tapPrimaryButton(tester);
    await tester.pump(); // isSubmitting becomes true, shows spinner
    await _pumpAfterAsyncWork(tester);

    expect(authenticated, isTrue);
    expect(sentBody, isNotNull);
    expect(sentBody!["organizationId"], "org-1");
    expect(sentBody!["email"], "person@example.com");
    expect(sentBody!["password"], "correct-password");
    // The login request body never carries a client-side "role" concept —
    // /api/v1/auth/login has no such field.
    expect(sentBody!.containsKey("role"), isFalse);
    expect(await sessionStore.readSessionToken(), "session-abc");
  });

  testWidgets("invalid credentials show a generic error and never call onAuthenticated", (tester) async {
    final client = MockClient(
      (_) async => _jsonResponse(401, {
        "type": "about:blank",
        "title": "Invalid email or password.",
        "status": 401,
      }),
    );
    final authRepository = AuthRepository(apiClient: ApiClient(httpClient: client), sessionStore: _InMemorySessionStore());

    var authenticated = false;
    await _pumpAtDesktopSize(
      tester,
      LoginScreen(
        authRepository: authRepository,
        organizationId: "org-1",
        onAuthenticated: () => authenticated = true,
      ),
    );

    await tester.enterText(find.widgetWithText(TextFormField, "Enter your email or username"), "person@example.com");
    await tester.enterText(find.widgetWithText(TextFormField, "Enter your password"), "wrong-password");
    await _tapPrimaryButton(tester);
    await _pumpAfterAsyncWork(tester);

    expect(find.text("Sign-in failed. Check your email and password."), findsOneWidget);
    expect(authenticated, isFalse);
  });

  testWidgets("network failure shows a distinct error from invalid credentials", (tester) async {
    final client = MockClient((_) async => throw const HttpException("connection refused"));
    final authRepository = AuthRepository(apiClient: ApiClient(httpClient: client), sessionStore: _InMemorySessionStore());

    await _pumpAtDesktopSize(
      tester,
      LoginScreen(authRepository: authRepository, organizationId: "org-1", onAuthenticated: () {}),
    );

    await tester.enterText(find.widgetWithText(TextFormField, "Enter your email or username"), "person@example.com");
    await tester.enterText(find.widgetWithText(TextFormField, "Enter your password"), "any-password");
    await _tapPrimaryButton(tester);
    await _pumpAfterAsyncWork(tester);

    expect(find.text("Couldn't reach the server. Check your connection and try again."), findsOneWidget);
  });

  testWidgets("Sign up navigates to the signup placeholder", (tester) async {
    final authRepository = AuthRepository(
      apiClient: ApiClient(httpClient: MockClient((_) async => _jsonResponse(200, {}))),
      sessionStore: _InMemorySessionStore(),
    );

    await _pumpAtDesktopSize(
      tester,
      LoginScreen(authRepository: authRepository, organizationId: "org-1", onAuthenticated: () {}),
    );

    await tester.tap(find.widgetWithText(GestureDetector, "Sign up"));
    await tester.pumpAndSettle();

    expect(find.byType(SignupScreen), findsOneWidget);
  });
}
