import "package:flutter/material.dart";

import "auth_repository.dart";

/// Minimal Phase 4 foundation screen — email/password plus an optional MFA
/// step. No role-specific UI, no routing framework (Phases 14-17/22 own
/// that); this exists to exercise the authentication flow end-to-end
/// against the real API, not to be the final login experience.
class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.authRepository,
    required this.organizationId,
    required this.onAuthenticated,
  });

  final AuthRepository authRepository;
  final String organizationId;
  final VoidCallback onAuthenticated;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();

  String? _mfaChallengeToken;
  String? _errorMessage;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submitCredentials() async {
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      final outcome = await widget.authRepository.login(
        organizationId: widget.organizationId,
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      if (!mounted) return;
      if (outcome.mfaRequired) {
        setState(() {
          _mfaChallengeToken = outcome.mfaChallengeToken;
          _isSubmitting = false;
        });
      } else {
        widget.onAuthenticated();
      }
    } catch (_) {
      // FE-002/AUTH-122's spirit on the client too: a generic message,
      // never the server's distinction between "no such user" and "wrong
      // password" beyond what the API itself already chose to disclose.
      if (!mounted) return;
      setState(() {
        _errorMessage = "Sign-in failed. Check your email and password.";
        _isSubmitting = false;
      });
    }
  }

  Future<void> _submitMfaCode() async {
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      await widget.authRepository.verifyMfaChallenge(
        mfaChallengeToken: _mfaChallengeToken!,
        code: _codeController.text.trim(),
      );
      if (!mounted) return;
      widget.onAuthenticated();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _errorMessage = "That code didn't work. Try again.";
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 360),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  "EduCapsules",
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                if (_errorMessage != null) ...[
                  Text(_errorMessage!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  const SizedBox(height: 16),
                ],
                if (_mfaChallengeToken == null) ..._credentialFields() else ..._mfaFields(context),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _credentialFields() {
    return [
      TextField(
        controller: _emailController,
        decoration: const InputDecoration(labelText: "Email"),
        keyboardType: TextInputType.emailAddress,
        autocorrect: false,
      ),
      const SizedBox(height: 12),
      TextField(
        controller: _passwordController,
        decoration: const InputDecoration(labelText: "Password"),
        obscureText: true,
      ),
      const SizedBox(height: 24),
      FilledButton(
        onPressed: _isSubmitting ? null : _submitCredentials,
        child: _isSubmitting
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : const Text("Sign in"),
      ),
    ];
  }

  List<Widget> _mfaFields(BuildContext context) {
    return [
      Text("Enter your 6-digit authentication code", style: Theme.of(context).textTheme.bodyMedium),
      const SizedBox(height: 12),
      TextField(
        controller: _codeController,
        decoration: const InputDecoration(labelText: "Code"),
        keyboardType: TextInputType.number,
      ),
      const SizedBox(height: 24),
      FilledButton(
        onPressed: _isSubmitting ? null : _submitMfaCode,
        child: _isSubmitting
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : const Text("Verify"),
      ),
    ];
  }
}
