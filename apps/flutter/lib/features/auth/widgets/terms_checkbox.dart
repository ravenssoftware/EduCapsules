import "package:flutter/material.dart";

import "../../../theme/colors.dart";

/// "I agree to the Terms of Service and Privacy Policy" checkbox, shared by
/// the general Signup card and all four role-specific registration forms.
/// [activeColor] lets each role form use its own accent (green/purple/
/// pink/orange) as in Reference Image 2.
class TermsAgreementCheckbox extends StatelessWidget {
  const TermsAgreementCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
    this.activeColor = EduCapsulesColors.authIdentity,
    this.showError = false,
  });

  final bool value;
  final ValueChanged<bool> onChanged;
  final Color activeColor;
  final bool showError;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: Checkbox(
                value: value,
                onChanged: (v) => onChanged(v ?? false),
                activeColor: activeColor,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Wrap(
                children: [
                  const Text("I agree to the ", style: TextStyle(fontSize: 12.5, color: EduCapsulesColors.authMutedText)),
                  Text("Terms of Service", style: TextStyle(fontSize: 12.5, color: activeColor, fontWeight: FontWeight.w600)),
                  const Text(" and ", style: TextStyle(fontSize: 12.5, color: EduCapsulesColors.authMutedText)),
                  Text("Privacy Policy", style: TextStyle(fontSize: 12.5, color: activeColor, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
        if (showError)
          Padding(
            padding: const EdgeInsets.only(left: 30, top: 2),
            child: Text(
              "You must agree to the Terms of Service and Privacy Policy.",
              style: TextStyle(fontSize: 11.5, color: Theme.of(context).colorScheme.error),
            ),
          ),
      ],
    );
  }
}
