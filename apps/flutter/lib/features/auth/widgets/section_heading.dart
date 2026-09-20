import "package:flutter/material.dart";

import "../../../theme/colors.dart";

/// A coloured section label with a divider beneath it (e.g. "Personal
/// Information", "Professional Information") as shown in every role
/// registration reference.
class RegistrationSectionHeading extends StatelessWidget {
  const RegistrationSectionHeading({super.key, required this.title, required this.accent});

  final String title;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: accent),
          ),
          const SizedBox(height: 8),
          Divider(color: EduCapsulesColors.authBorder, height: 1),
        ],
      ),
    );
  }
}
