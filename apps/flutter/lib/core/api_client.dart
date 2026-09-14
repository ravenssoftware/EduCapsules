import "dart:convert";

import "package:http/http.dart" as http;

/// Base URL is a build-time/runtime constant, never hard-coded per
/// environment inside a widget (BE-007's equivalent on the client side).
/// Defaults to the local dev API (`apps/api`'s default PORT, server.ts).
const String _defaultBaseUrl = "http://localhost:8787";

class ApiException implements Exception {
  ApiException(this.statusCode, this.title, this.detail);

  final int statusCode;
  final String title;
  final String? detail;

  @override
  String toString() => detail ?? title;
}

/// Thin HTTP client for /api/v1 (§38). No business logic here — FE-002:
/// "the client shall never contain a business rule that is not also
/// enforced by the server." Every error response is expected to be RFC
/// 9457 problem-detail JSON (API-008); this class turns that into an
/// [ApiException] the UI layer can show, never a raw stack trace.
class ApiClient {
  ApiClient({String? baseUrl, http.Client? httpClient})
    : baseUrl = baseUrl ?? _defaultBaseUrl,
      _client = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _client;

  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    String? bearerToken,
  }) async {
    final response = await _client.post(
      Uri.parse("$baseUrl$path"),
      headers: {
        "content-type": "application/json",
        if (bearerToken != null) "authorization": "Bearer $bearerToken",
      },
      body: jsonEncode(body),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> get(String path, {String? bearerToken}) async {
    final response = await _client.get(
      Uri.parse("$baseUrl$path"),
      headers: {if (bearerToken != null) "authorization": "Bearer $bearerToken"},
    );
    return _decode(response);
  }

  Map<String, dynamic> _decode(http.Response response) {
    final Map<String, dynamic> body = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    // API-013: the server never sends internals in this body; nothing
    // extra to strip on the client side, just surface title/detail as-is.
    throw ApiException(
      response.statusCode,
      (body["title"] as String?) ?? "Request failed",
      body["detail"] as String?,
    );
  }
}
