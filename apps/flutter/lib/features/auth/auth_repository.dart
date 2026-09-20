import "../../core/api_client.dart";
import "../../core/secure_storage.dart";

/// AUTH-121/AUTH-101: the client-side half of email/password
/// authentication. Calls the /api/v1/auth surface and keeps the resulting
/// session token in [SecureSessionStore] — never only in a widget's
/// in-memory state, and never in a non-secure store (AUTH-125). No
/// authorization logic here (FE-002): this repository proves *who*,
/// nothing about what they can do.
class AuthRepository {
  AuthRepository({required ApiClient apiClient, required SecureSessionStore sessionStore})
    : _apiClient = apiClient,
      _sessionStore = sessionStore;

  final ApiClient _apiClient;
  final SecureSessionStore _sessionStore;

  Future<bool> hasStoredSession() async => (await _sessionStore.readSessionToken()) != null;

  /// [LoginOutcome.mfaRequired] means the caller must collect a code and
  /// call [verifyMfaChallenge] — this repository never invents its own MFA
  /// step beyond what the server states is required.
  Future<LoginOutcome> login({
    required String organizationId,
    required String email,
    required String password,
  }) async {
    final body = await _apiClient.post("/api/v1/auth/login", {
      "organizationId": organizationId,
      "email": email,
      "password": password,
    });
    if (body["status"] == "mfa_required") {
      return LoginOutcome.mfaRequired(body["mfaChallengeToken"] as String);
    }
    await _sessionStore.writeSessionToken(body["sessionToken"] as String);
    return LoginOutcome.authenticated();
  }

  Future<void> verifyMfaChallenge({
    required String mfaChallengeToken,
    required String code,
    bool isRecoveryCode = false,
  }) async {
    final body = await _apiClient.post("/api/v1/auth/mfa/verify", {
      "mfaChallengeToken": mfaChallengeToken,
      "code": code,
      "isRecoveryCode": isRecoveryCode,
    });
    await _sessionStore.writeSessionToken(body["sessionToken"] as String);
  }

  /// AUTH-121's registration half. Calls `/api/v1/auth/register`, which
  /// today accepts only organizationId/email/password/locale/timezone
  /// (see routes/auth.ts) — it does not yet accept a role, name, phone
  /// number, or any of the other profile fields the signup UI collects.
  /// Those extra fields are validated and held in the UI for a future
  /// profile-completion step; this method only ever sends what the real
  /// endpoint accepts, and never pretends the rest was persisted.
  Future<RegisterOutcome> register({
    required String organizationId,
    required String email,
    required String password,
  }) async {
    final body = await _apiClient.post("/api/v1/auth/register", {
      "organizationId": organizationId,
      "email": email,
      "password": password,
    });
    return RegisterOutcome(message: body["message"] as String? ?? "Check your email to verify your account.");
  }

  Future<void> logout() async {
    final token = await _sessionStore.readSessionToken();
    if (token != null) {
      try {
        await _apiClient.post("/api/v1/auth/logout", const {}, bearerToken: token);
      } on ApiException {
        // A session that's already invalid server-side is not a reason to
        // fail client-side logout — clear() below still runs either way.
      }
    }
    await _sessionStore.clear();
  }
}

class LoginOutcome {
  LoginOutcome._({required this.mfaRequired, this.mfaChallengeToken});

  factory LoginOutcome.authenticated() => LoginOutcome._(mfaRequired: false);

  factory LoginOutcome.mfaRequired(String token) =>
      LoginOutcome._(mfaRequired: true, mfaChallengeToken: token);

  final bool mfaRequired;
  final String? mfaChallengeToken;
}

class RegisterOutcome {
  RegisterOutcome({required this.message});

  final String message;
}
