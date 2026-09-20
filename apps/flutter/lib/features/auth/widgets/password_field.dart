import "package:flutter/material.dart";

import "auth_text_field.dart";

/// A password [AuthTextField] with a visibility toggle (eye icon).
class PasswordField extends StatefulWidget {
  const PasswordField({
    super.key,
    required this.label,
    required this.controller,
    this.hintText = "Enter your password",
    this.validator,
    this.autofillHints,
    this.focusNode,
    this.textInputAction,
    this.onFieldSubmitted,
  });

  final String label;
  final TextEditingController controller;
  final String hintText;
  final String? Function(String?)? validator;
  final Iterable<String>? autofillHints;
  final FocusNode? focusNode;
  final TextInputAction? textInputAction;
  final void Function(String)? onFieldSubmitted;

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
      autofillHints: widget.autofillHints,
      focusNode: widget.focusNode,
      textInputAction: widget.textInputAction,
      onFieldSubmitted: widget.onFieldSubmitted,
      trailing: IconButton(
        icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18),
        tooltip: _obscure ? "Show password" : "Hide password",
        onPressed: () => setState(() => _obscure = !_obscure),
      ),
    );
  }
}
