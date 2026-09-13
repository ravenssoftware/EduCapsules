import "package:flutter/material.dart";

/// A minimal placeholder confirming the app boots. This is not a role
/// experience — it is replaced by role-specific navigation once
/// authentication exists (Phase 4) and the Teacher/Student/Assistant/
/// Parent/Admin experiences are built (Phases 14-17, 22).
class PlaceholderHomeScreen extends StatelessWidget {
  const PlaceholderHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "EduCapsules",
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              "Teach safely · Learn in order · Monitor with confidence",
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
