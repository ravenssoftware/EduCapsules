import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";

import "package:educapsules/app.dart";

void main() {
  testWidgets("EduCapsulesApp boots and shows the placeholder home screen", (
    tester,
  ) async {
    await tester.pumpWidget(const EduCapsulesApp());

    expect(find.text("EduCapsules"), findsOneWidget);
    expect(
      find.text("Teach safely · Learn in order · Monitor with confidence"),
      findsOneWidget,
    );
  });

  testWidgets("theme primary colour matches SRS Table 42.2 (UI-004)", (
    tester,
  ) async {
    await tester.pumpWidget(const EduCapsulesApp());

    final BuildContext context = tester.element(find.byType(Scaffold));
    expect(Theme.of(context).colorScheme.primary, const Color(0xFF1E7FC2));
  });
}
