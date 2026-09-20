import "package:flutter/material.dart";

import "../../../theme/colors.dart";

/// A single labelled input matching the reference's field chrome (leading
/// icon, light border, rounded corners, muted placeholder). Used for every
/// plain text/email/date/dropdown-style field across Login and Signup.
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
    this.readOnly = false,
    this.onTap,
    this.autofillHints,
    this.focusNode,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final String? hintText;
  final IconData? icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? trailing;
  final String? Function(String?)? validator;
  final bool readOnly;
  final VoidCallback? onTap;
  final Iterable<String>? autofillHints;
  final FocusNode? focusNode;
  final ValueChanged<String>? onChanged;

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
          readOnly: readOnly,
          onTap: onTap,
          onChanged: onChanged,
          autofillHints: autofillHints,
          validator: validator,
          style: const TextStyle(fontSize: 14, color: EduCapsulesColors.authHeading),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(color: EduCapsulesColors.authPlaceholder, fontSize: 14),
            prefixIcon: icon == null
                ? null
                : Icon(icon, size: 18, color: EduCapsulesColors.authMutedText),
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

  OutlineInputBorder _border(Color color, {double width = 1}) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: color, width: width),
  );
}

/// A labelled dropdown sharing the same visual chrome as [AuthTextField]
/// (used for Gender, Grade/Class, Subjects, Admin Role, etc.).
class AuthDropdownField<T> extends StatelessWidget {
  const AuthDropdownField({
    super.key,
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
    this.hintText,
    this.icon,
    this.validator,
  });

  final String label;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  final String? hintText;
  final IconData? icon;
  final String? Function(T?)? validator;

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
        DropdownButtonFormField<T>(
          value: value,
          items: items,
          onChanged: onChanged,
          validator: validator,
          icon: const Icon(Icons.keyboard_arrow_down, color: EduCapsulesColors.authMutedText),
          style: const TextStyle(fontSize: 14, color: EduCapsulesColors.authHeading),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(color: EduCapsulesColors.authPlaceholder, fontSize: 14),
            prefixIcon: icon == null
                ? null
                : Icon(icon, size: 18, color: EduCapsulesColors.authMutedText),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: EduCapsulesColors.authBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: EduCapsulesColors.authBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: EduCapsulesColors.authIdentity, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
