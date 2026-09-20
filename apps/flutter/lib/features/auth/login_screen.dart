import "package:flutter/material.dart";

import "../../core/api_client.dart";
import "../../theme/colors.dart";
import "auth_repository.dart";
import "signup_screen.dart";
import "widgets/auth_page_shell.dart";
import "widgets/auth_text_field.dart";
import "widgets/gradient_button.dart";
import "widgets/password_field.dart";
import "widgets/role_selector.dart";
import "widgets/social_auth_row.dart";

/// The Login page (docs/design-references/01-login-and-general-signup.webp
/// is the visual source of truth). Wires the real [AuthRepository] — no
/// mock authentication, no hardcoded success.
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
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordFocusNode = FocusNode();

  LoginRole _role = LoginRole.student;
  bool _rememberMe = true;
  String? _mfaChallengeToken;
  String? _errorMessage;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  Future<void> _submitCredentials() async {
    if (_isSubmitting) return; // prevent duplicate submissions
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      final outcome = await widget.authRepository.login(
        organizationId: widget.organizationId,
        email: _emailController.text.trim(),
        password: _passwordController.text,
        rememberMe: _rememberMe,
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
    } on ApiException catch (_) {
      // FE-002/AUTH-122's spirit on the client too: a generic message,
      // never the server's distinction between "no such user" and "wrong
      // password" beyond what the API itself already chose to disclose.
      if (!mounted) return;
      setState(() {
        _errorMessage = "Sign-in failed. Check your email and password.";
        _isSubmitting = false;
      });
    } catch (_) {
      // Not an ApiException: the request itself never reached the server
      // (offline, DNS failure, connection refused) — a distinct message
      // from "wrong credentials" is more honest and more actionable.
      if (!mounted) return;
      setState(() {
        _errorMessage = "Couldn't reach the server. Check your connection and try again.";
        _isSubmitting = false;
      });
    }
  }

  Future<void> _submitMfaCode() async {
    if (_isSubmitting) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      await widget.authRepository.verifyMfaChallenge(mfaChallengeToken: _mfaChallengeToken!, code: _codeController.text.trim());
      if (!mounted) return;
      widget.onAuthenticated();
    } on ApiException catch (_) {
      if (!mounted) return;
      setState(() {
        _errorMessage = "That code didn't work. Try again.";
        _isSubmitting = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _errorMessage = "Couldn't reach the server. Check your connection and try again.";
        _isSubmitting = false;
      });
    }
  }

  Future<void> _showForgotPasswordDialog() async {
    final controller = TextEditingController(text: _emailController.text.trim());
    final email = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text("Reset your password"),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: "Email", hintText: "Enter your account email"),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(), child: const Text("Cancel")),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(controller.text.trim()),
            child: const Text("Send reset link"),
          ),
        ],
      ),
    );
    if (email == null || email.isEmpty || !mounted) return;

    try {
      await widget.authRepository.forgotPassword(organizationId: widget.organizationId, email: email);
    } catch (_) {
      // AUTH-122: the server itself never distinguishes "no such account"
      // from "email sent" — a network/server failure here must not leak
      // that distinction either, so the same generic confirmation is
      // shown either way. A real send failure is still logged server-side
      // by the API; there is nothing more specific this client may say.
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text("If that email is registered, a reset link is on its way.")));
  }

  void _openSignUp() {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignupScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageShell(
      card: AuthCard(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text.rich(
                const TextSpan(
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: EduCapsulesColors.authHeading),
                  children: [
                    TextSpan(text: "Login to "),
                    TextSpan(text: "EduCapsules", style: TextStyle(color: EduCapsulesColors.authIdentity)),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              const Text("Choose your role to continue", style: TextStyle(fontSize: 13, color: EduCapsulesColors.authMutedText)),
              const SizedBox(height: 18),
              RoleSelector(selected: _role, onChanged: (role) => setState(() => _role = role)),
              const SizedBox(height: 22),
              if (_errorMessage != null) ...[_ErrorBanner(message: _errorMessage!), const SizedBox(height: 16)],
              if (_mfaChallengeToken == null) ..._credentialFields() else ..._mfaFields(),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _credentialFields() {
    return [
      AuthTextField(
        label: "Email or Username",
        controller: _emailController,
        hintText: "Enter your email or username",
        icon: Icons.person_outline,
        keyboardType: TextInputType.emailAddress,
        autofillHints: const [AutofillHints.email],
        textInputAction: TextInputAction.next,
        onFieldSubmitted: (_) => _passwordFocusNode.requestFocus(),
        validator: (value) => (value == null || value.trim().isEmpty) ? "Enter your email or username." : null,
      ),
      const SizedBox(height: 16),
      PasswordField(
        label: "Password",
        controller: _passwordController,
        focusNode: _passwordFocusNode,
        autofillHints: const [AutofillHints.password],
        textInputAction: TextInputAction.done,
        onFieldSubmitted: (_) => _submitCredentials(),
        validator: (value) => (value == null || value.isEmpty) ? "Enter your password." : null,
      ),
      const SizedBox(height: 10),
      Align(
        alignment: Alignment.centerRight,
        child: TextButton(
          onPressed: _showForgotPasswordDialog,
          style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
          child: const Text(
            "Forgot password?",
            style: TextStyle(fontSize: 12.5, color: EduCapsulesColors.authIdentity, fontWeight: FontWeight.w600),
          ),
        ),
      ),
      const SizedBox(height: 6),
      Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: Checkbox(
              value: _rememberMe,
              onChanged: (v) => setState(() => _rememberMe = v ?? true),
              activeColor: EduCapsulesColors.authIdentity,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
          const SizedBox(width: 8),
          const Text("Remember me", style: TextStyle(fontSize: 13, color: EduCapsulesColors.authMutedText)),
        ],
      ),
      const SizedBox(height: 20),
      GradientActionButton(label: "Login", isLoading: _isSubmitting, onPressed: _submitCredentials),
      const SizedBox(height: 22),
      const SocialAuthRow(),
      const SizedBox(height: 20),
      _BottomLink(text: "Don't have an account? ", actionText: "Sign up", onTap: _openSignUp),
    ];
  }

  List<Widget> _mfaFields() {
    return [
      const Text("Enter your 6-digit authentication code", style: TextStyle(fontSize: 13, color: EduCapsulesColors.authMutedText)),
      const SizedBox(height: 14),
      AuthTextField(
        label: "Verification Code",
        controller: _codeController,
        hintText: "123456",
        icon: Icons.shield_outlined,
        keyboardType: TextInputType.number,
        textInputAction: TextInputAction.done,
        onFieldSubmitted: (_) => _submitMfaCode(),
      ),
      const SizedBox(height: 20),
      GradientActionButton(label: "Verify", isLoading: _isSubmitting, onPressed: _submitMfaCode),
    ];
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.error.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.3)),
        ),
        child: Text(message, style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 13)),
      ),
    );
  }
}

class _BottomLink extends StatelessWidget {
  const _BottomLink({required this.text, required this.actionText, required this.onTap});

  final String text;
  final String actionText;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Wrap(
        alignment: WrapAlignment.center,
        children: [
          Text(text, style: const TextStyle(fontSize: 13, color: EduCapsulesColors.authMutedText)),
          GestureDetector(
            onTap: onTap,
            child: Text(
              actionText,
              style: const TextStyle(fontSize: 13, color: EduCapsulesColors.authIdentity, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
