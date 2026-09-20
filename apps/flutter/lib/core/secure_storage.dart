import "package:flutter_secure_storage/flutter_secure_storage.dart";

/// AUTH-125: session/refresh tokens live only in the platform's secure
/// credential storage (OS keychain, keystore, or credential locker) —
/// never in plaintext application storage (SharedPreferences, a file, an
/// in-memory singleton written to disk by a crash-report tool, etc).
/// `flutter_secure_storage` gives one API across every platform this
/// project targets (Windows/macOS/Linux now, Android/iOS later), so this
/// wrapper adds nothing platform-specific of its own — it exists so the
/// rest of the app depends on this interface, not on the package directly,
/// the same "swap the adapter, not the caller" pattern the backend uses
/// for its own platform primitives (docs/architecture/backend.md §5).
abstract class SecureSessionStore {
  Future<String?> readSessionToken();
  Future<void> writeSessionToken(String token);
  Future<void> clear();
}

class FlutterSecureSessionStore implements SecureSessionStore {
  FlutterSecureSessionStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const _sessionTokenKey = "educapsules.session_token";
  final FlutterSecureStorage _storage;

  @override
  Future<String?> readSessionToken() async {
    try {
      return await _storage.read(key: _sessionTokenKey);
    } catch (_) {
      // A storage read failure (locked keychain, first run before the OS
      // grants access, a platform channel genuinely unavailable) must
      // never crash the app or be treated as "logged in" — it fails
      // closed to "no session", the same outcome as a normal logged-out
      // start.
      return null;
    }
  }

  @override
  Future<void> writeSessionToken(String token) async {
    await _storage.write(key: _sessionTokenKey, value: token);
  }

  @override
  Future<void> clear() async {
    try {
      await _storage.delete(key: _sessionTokenKey);
    } catch (_) {
      // Best-effort — a failed delete must not block the in-app logout flow.
    }
  }
}
