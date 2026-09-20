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
}
