import "package:flutter/material.dart";

import "../../../theme/colors.dart";

/// The four password rules shown under "Password must contain:" in the
/// general Signup reference. Applied consistently on every password-
/// creation form in this feature (login has no password-creation step, so
/// it never shows this) per the design brief's "unless the existing
/// authentication specification explicitly defines different
/// requirements" clause — the SRS does not define a different rule set for
/// registration, so this checklist is the one source of truth client-side.
class PasswordRequirement {
  const PasswordRequirement(this.label, this.isMet);

  final String label;
  final bool isMet;
}

List<PasswordRequirement> evaluatePasswordRequirements(String password) => [
  PasswordRequirement("At least 8 characters", password.length >= 8),
  PasswordRequirement("One uppercase letter", RegExp(r"[A-Z]").hasMatch(password)),
  PasswordRequirement("One number", RegExp(r"[0-9]").hasMatch(password)),
  PasswordRequirement(
    "One special character",
    RegExp(r'[!@#$%^&*(),.?":{}|<>_\-\[\]\\/~`+=;]').hasMatch(password),
  ),
];

bool passwordMeetsAllRequirements(String password) =>
    evaluatePasswordRequirements(password).every((r) => r.isMet);

class PasswordRequirementsChecklist extends StatelessWidget {
  const PasswordRequirementsChecklist({super.key, required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    final requirements = evaluatePasswordRequirements(password);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Password must contain:",
          style: TextStyle(fontSize: 12.5, color: EduCapsulesColors.authMutedText, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 16,
          runSpacing: 4,
          children: [
            for (final requirement in requirements)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    requirement.isMet ? Icons.check_circle : Icons.check_circle_outline,
                    size: 15,
                    color: requirement.isMet ? EduCapsulesColors.roleStudent : EduCapsulesColors.authPlaceholder,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    requirement.label,
                    style: TextStyle(
                      fontSize: 12,
                      color: requirement.isMet ? EduCapsulesColors.authHeading : EduCapsulesColors.authMutedText,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ],
    );
  }
}
