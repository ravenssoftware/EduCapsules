import "package:flutter/material.dart";

import "screens/placeholder_home_screen.dart";
import "theme/app_theme.dart";

/// The root widget. This is repository/engineering foundation only —
/// Phase 2 per docs/decisions/03-implementation-roadmap.md — no role
/// experience (Teacher/Student/Assistant/Parent/Admin, Phases 14-17/22) is
/// implemented yet, no routing framework, no API client. Those start once
/// the backend and authentication exist (Phase 3+).
class EduCapsulesApp extends StatelessWidget {
  const EduCapsulesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "EduCapsules",
      debugShowCheckedModeBanner: false,
      theme: buildEduCapsulesTheme(),
      home: const PlaceholderHomeScreen(),
    );
  }
}
