import "package:flutter/gestures.dart";
import "package:flutter/material.dart";

import "../../core/api_client.dart";
import "../../theme/colors.dart";
import "auth_repository.dart";
import "auth_role.dart";
import "widgets/auth_page_shell.dart";
import "widgets/gradient_button.dart";
import "widgets/password_field.dart";
import "widgets/password_requirements.dart";
import "widgets/role_registration_form.dart";
import "widgets/role_selector.dart";
import "widgets/social_auth_row.dart";
import "widgets/auth_text_field.dart";
import "widgets/terms_checkbox.dart";

/// Signup entry point (Reference Image 1's general Signup page +
/// Reference Image 2's four role-specific forms). Picking a role switches
/// which form is shown: Teacher/Student/Parent/Admin render their
/// dedicated [RoleRegistrationForm]; Assistant (no reference form exists
/// for it) falls back to the general card fields from Reference Image 1.
class SignupScreen extends StatefulWidget {
  const SignupScreen({
    super.key,
    required this.authRepository,
    required this.organizationId,
    required this.onRegistered,
  });

  final AuthRepository authRepository;
  final String organizationId;
  final VoidCallback onRegistered;

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  AuthRole _role = AuthRole.student;

  void _backToLogin() => Navigator.of(context).maybePop();

  @override
  Widget build(BuildContext context) {
    final showGeneralForm = _role == AuthRole.assistant;

    return AuthPageShell(
      promoHeading: "Create your account",
      promoSubheading: "Join EduCapsules and start your smarter learning journey.",
      cardMaxWidth: 520,
      card: AuthCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showGeneralForm) ...[
              const Text(
                "Create your account",
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: EduCapsulesColors.authHeading),
              ),
              const SizedBox(height: 4),
              const Text(
                "Fill in the details below to get started",
                style: TextStyle(fontSize: 13, color: EduCapsulesColors.authMutedText),
              ),
              const SizedBox(height: 18),
            ],
            const Text(
              "I am a",
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: EduCapsulesColors.authHeading),
            ),
            const SizedBox(height: 8),
            RoleSelector(selected: _role, onChanged: (role) => setState(() => _role = role)),
            const SizedBox(height: 22),
            if (showGeneralForm)
              _GeneralSignupForm(
                authRepository: widget.authRepository,
                organizationId: widget.organizationId,
                onRegistered: widget.onRegistered,
              )
            else
              RoleRegistrationForm(
                key: ValueKey(_role),
                role: _role,
                authRepository: widget.authRepository,
                organizationId: widget.organizationId,
                onRegistered: widget.onRegistered,
              ),
            const SizedBox(height: 22),
            const SocialAuthRow(),
            const SizedBox(height: 20),
            Center(
              child: RichText(
                text: TextSpan(
                  style: const TextStyle(fontSize: 13, color: EduCapsulesColors.authMutedText),
                  children: [
                    const TextSpan(text: "Already have an account? "),
                    TextSpan(
                      text: "Login",
                      style: const TextStyle(color: EduCapsulesColors.authIdentity, fontWeight: FontWeight.w700),
                      recognizer: TapGestureRecognizer()..onTap = _backToLogin,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The Assistant fallback / general signup form (Reference Image 1's
/// right-hand signup card): Full Name, Email, Username, Password, Confirm
/// Password, requirements checklist, terms.
class _GeneralSignupForm extends StatefulWidget {
  const _GeneralSignupForm({
    required this.authRepository,
    required this.organizationId,
    required this.onRegistered,
  });

  final AuthRepository authRepository;
  final String organizationId;
  final VoidCallback onRegistered;

  @override
  State<_GeneralSignupForm> createState() => _GeneralSignupFormState();
}

class _GeneralSignupFormState extends State<_GeneralSignupForm> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String _password = "";
  bool _agreedToTerms = false;
  bool _showTermsError = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final formValid = _formKey.currentState?.validate() ?? false;
    setState(() => _showTermsError = !_agreedToTerms);
    if (!formValid || !_agreedToTerms) return;

    setState(() => _isSubmitting = true);
    try {
      final outcome = await widget.authRepository.register(
        organizationId: widget.organizationId,
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      await showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text("Almost there"),
          content: Text(outcome.message),
          actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text("OK"))],
        ),
      );
      if (!mounted) return;
      widget.onRegistered();
    } on ApiException catch (err) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err.toString())));
    } catch (_) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Registration failed. Please try again.")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          AuthTextField(
            label: "Full Name",
            controller: _fullNameController,
            hintText: "Enter your full name",
            icon: Icons.person_outline,
            validator: (v) => (v == null || v.trim().isEmpty) ? "Full Name is required." : null,
          ),
          const SizedBox(height: 14),
          AuthTextField(
            label: "Email",
            controller: _emailController,
            hintText: "Enter your email address",
            icon: Icons.mail_outline,
            keyboardType: TextInputType.emailAddress,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return "Email is required.";
              final ok = RegExp(r"^[^@\s]+@[^@\s]+\.[^@\s]+$").hasMatch(v.trim());
              return ok ? null : "Enter a valid email address.";
            },
          ),
          const SizedBox(height: 14),
          AuthTextField(
            label: "Username",
            controller: _usernameController,
            hintText: "Choose a username",
            icon: Icons.alternate_email,
            validator: (v) => (v == null || v.trim().isEmpty) ? "Username is required." : null,
          ),
          const SizedBox(height: 14),
          PasswordField(
            label: "Password",
            controller: _passwordController,
            validator: (v) {
              if (v == null || v.isEmpty) return "Password is required.";
              return passwordMeetsAllRequirements(v) ? null : "Password does not meet all requirements.";
            },
            onChanged: (v) => setState(() => _password = v),
          ),
          const SizedBox(height: 6),
          PasswordRequirementsChecklist(password: _password),
          const SizedBox(height: 14),
          PasswordField(
            label: "Confirm Password",
            controller: _confirmPasswordController,
            validator: (v) => v != _passwordController.text ? "Passwords do not match." : null,
          ),
          const SizedBox(height: 16),
          TermsAgreementCheckbox(
            value: _agreedToTerms,
            showError: _showTermsError,
            onChanged: (v) => setState(() {
              _agreedToTerms = v;
              _showTermsError = false;
            }),
          ),
          const SizedBox(height: 20),
          GradientActionButton(label: "Sign Up", isLoading: _isSubmitting, onPressed: _submit),
        ],
      ),
    );
  }
}
