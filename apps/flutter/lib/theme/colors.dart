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

  // --- Login page tokens ---------------------------------------------
  //
  // Additive tokens for the Login page only (docs/design-references/
  // 01-login-and-general-signup.webp is the visual source of truth). They
  // don't replace the semantic tokens above and follow the same UI-004
  // "named token, not a hex literal in a widget" rule. The reference uses
  // a violet identity brand distinct from the SRS Table 42.2 primary/
  // accent above; both sets coexist until D-04 resolves which one is
  // final.
  static const authIdentity = Color(0xFF5B4FE5);
  static const authIdentityDark = Color(0xFF4438C9);
  static const authBackground = Color(0xFFF5F4FC);
  static const authCardBackground = Color(0xFFFFFFFF);
  static const authBorder = Color(0xFFE7E6F2);
  static const authHeading = Color(0xFF1A1B2E);
  static const authMutedText = Color(0xFF6B7280);
  static const authPlaceholder = Color(0xFF9CA3AF);

  /// Secondary accent used only inside the promo-panel illustration (bar
  /// chart, plant) — not a role or status colour.
  static const authIllustrationAccent = Color(0xFF1FA97A);
}
