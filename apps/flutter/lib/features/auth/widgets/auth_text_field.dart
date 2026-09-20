import "package:flutter/material.dart";

import "../../../theme/colors.dart";

/// A single labelled input matching the reference's field chrome (leading
/// icon, light border, rounded corners, muted placeholder).
class AuthTextField extends StatelessWidget {
  const AuthTextField({
    super.key,
    required this.label,
    required this.controller,
    this.hintText,
    this.icon,
    this.keyboardType,
    this.obscureText = false,
    this.trailing,
    this.validator,
    this.autofillHints,
    this.focusNode,
    this.textInputAction,
    this.onFieldSubmitted,
  });

  final String label;
  final TextEditingController controller;
  final String? hintText;
  final IconData? icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? trailing;
  final String? Function(String?)? validator;
  final Iterable<String>? autofillHints;
  final FocusNode? focusNode;
  final TextInputAction? textInputAction;
  final void Function(String)? onFieldSubmitted;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: EduCapsulesColors.authHeading),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          focusNode: focusNode,
          keyboardType: keyboardType,
          obscureText: obscureText,
          autofillHints: autofillHints,
          validator: validator,
          textInputAction: textInputAction,
          onFieldSubmitted: onFieldSubmitted,
          style: const TextStyle(fontSize: 14, color: EduCapsulesColors.authHeading),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(color: EduCapsulesColors.authPlaceholder, fontSize: 14),
            prefixIcon: icon == null ? null : Icon(icon, size: 18, color: EduCapsulesColors.authMutedText),
            suffixIcon: trailing,
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
            border: _border(EduCapsulesColors.authBorder),
            enabledBorder: _border(EduCapsulesColors.authBorder),
            focusedBorder: _border(EduCapsulesColors.authIdentity, width: 1.5),
            errorBorder: _border(Theme.of(context).colorScheme.error),
            focusedErrorBorder: _border(Theme.of(context).colorScheme.error, width: 1.5),
          ),
        ),
      ],
    );
  }

  OutlineInputBorder _border(Color color, {double width = 1}) =>
      OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: color, width: width));
}
