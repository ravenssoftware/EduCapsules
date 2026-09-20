import "package:flutter/material.dart";

/// Normative colour semantics (SRS Table 42.2, §42.2). Values are the
/// current working reference, not final brand tokens (D-04 is open) —
/// UI-004 requires every colour to be a named semantic token, never a
/// hard-coded hex value inside a widget, so this file is the one place
/// that changes when D-04 resolves.
abstract final class EduCapsulesColors {
  /// Structure, navigation, primary action, informational emphasis, links,
  /// selected state. Never used for errors, destructive actions, warnings.
  static const primary = Color(0xFF1E7FC2);

  /// Attention that requires a decision: destructive actions, validation
  /// errors, overdue items, security notices, required markers.
  static const accent = Color(0xFFC8332C);

  /// Body text, headings, data.
  static const foreground = Color(0xFF111418);

  /// Page and card background; the default canvas.
  static const surface = Color(0xFFFFFFFF);

  // --- Auth surface tokens (Login/Signup, requested pixel-reproduction of
  // the uploaded reference designs) --------------------------------------
  //
  // These are additive UI tokens for the auth screens only; they do not
  // replace the semantic tokens above and follow the same UI-004
  // "named token, not a hex literal in a widget" rule. Not yet reconciled
  // with D-04 — the reference images use a purple identity brand distinct
  // from the SRS Table 42.2 primary/accent above, so both sets of tokens
  // currently coexist by design.
  static const authIdentity = Color(0xFF6D5BF5);
  static const authIdentityDark = Color(0xFF4F3FE0);
  static const authBackground = Color(0xFFF5F5FC);
  static const authCardBackground = Color(0xFFFFFFFF);
  static const authBorder = Color(0xFFE5E7F0);
  static const authHeading = Color(0xFF1A1B2E);
  static const authMutedText = Color(0xFF6B7280);
  static const authPlaceholder = Color(0xFF9CA3AF);

  /// Role accent colours (Reference Image 2): Teacher = purple (reuses
  /// [authIdentity]), Student = green, Parent = pink, Admin = orange.
  /// Assistant has no dedicated reference form, so it uses the neutral
  /// identity colour rather than an invented accent.
  static const roleTeacher = authIdentity;
  static const roleStudent = Color(0xFF1FA97A);
  static const roleParent = Color(0xFFE0457B);
  static const roleAdmin = Color(0xFFE08A1F);
  static const roleAssistant = authIdentity;
}
