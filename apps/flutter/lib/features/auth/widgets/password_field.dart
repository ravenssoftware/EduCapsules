import "package:flutter/material.dart";

import "auth_text_field.dart";

/// A password [AuthTextField] with a visibility toggle (eye icon), matching
/// the reference's password inputs on both Login and every registration
/// form.
class PasswordField extends StatefulWidget {
  const PasswordField({
    super.key,
    required this.label,
    required this.controller,
    this.hintText = "Enter your password",
    this.validator,
    this.onChanged,
    this.autofillHints,
  });

  final String label;
  final TextEditingController controller;
  final String hintText;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final Iterable<String>? autofillHints;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return AuthTextField(
      label: widget.label,
      controller: widget.controller,
      hintText: widget.hintText,
      icon: Icons.lock_outline,
      obscureText: _obscure,
      validator: widget.validator,
      onChanged: widget.onChanged,
      autofillHints: widget.autofillHints,
      trailing: IconButton(
        icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18),
        tooltip: _obscure ? "Show password" : "Hide password",
        onPressed: () => setState(() => _obscure = !_obscure),
      ),
    );
  }
}
