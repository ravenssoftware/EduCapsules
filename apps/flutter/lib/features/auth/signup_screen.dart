import "package:flutter/material.dart";

import "../../theme/colors.dart";

/// Integration point for "Don't have an account? Sign up" — not a
/// completed registration flow. Building the Signup page (general +
/// Student/Teacher/Parent/Admin registration forms) is a separate,
/// explicitly out-of-scope task from the Login-page rebuild this screen
/// was added for; this placeholder exists so the Login screen's Sign-up
/// link has a real navigation target instead of a dead end or a faked
/// success state.
class SignupScreen extends StatelessWidget {
  const SignupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EduCapsulesColors.authBackground,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.construction_outlined, size: 40, color: EduCapsulesColors.authMutedText),
                const SizedBox(height: 16),
                const Text(
                  "Sign up isn't built yet",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: EduCapsulesColors.authHeading),
                ),
                const SizedBox(height: 8),
                const Text(
                  "The registration screens are a separate implementation task.",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: EduCapsulesColors.authMutedText),
                ),
                const SizedBox(height: 24),
                TextButton.icon(
                  onPressed: () => Navigator.of(context).maybePop(),
                  icon: const Icon(Icons.arrow_back, size: 16),
                  label: const Text("Back to Login"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
