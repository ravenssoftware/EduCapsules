import "package:flutter/material.dart";

import "../../../theme/colors.dart";

/// The full-width gradient action button used for Login/Sign Up and every
/// "Create ROLE Account" button, with the trailing arrow icon shown in the
/// references and a loading spinner while [isLoading] is true.
class GradientActionButton extends StatelessWidget {
  const GradientActionButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.colors = const [EduCapsulesColors.authIdentity, EduCapsulesColors.authIdentityDark],
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || isLoading;
    return Opacity(
      opacity: disabled && isLoading ? 0.85 : 1,
      child: Material(
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: disabled ? null : onPressed,
          child: Container(
            height: 50,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: colors, begin: Alignment.centerLeft, end: Alignment.centerRight),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        label,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward, color: Colors.white, size: 18),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
