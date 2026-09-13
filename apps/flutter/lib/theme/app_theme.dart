import "package:flutter/material.dart";

import "colors.dart";

/// The application theme, built only from the semantic tokens in
/// [EduCapsulesColors] (UI-004). Full brand tokens — type scale, spacing,
/// elevation, motion, icons, dark palette — are D-04, still open; dark mode
/// support (UI-020, SHOULD) is added when that resolves.
ThemeData buildEduCapsulesTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: EduCapsulesColors.primary,
    primary: EduCapsulesColors.primary,
    error: EduCapsulesColors.accent,
    surface: EduCapsulesColors.surface,
    onSurface: EduCapsulesColors.foreground,
  );

  return ThemeData(colorScheme: colorScheme, useMaterial3: true);
}
