import "package:flutter/material.dart";

import "../../../theme/colors.dart";
import "promo_panel.dart";

/// Shared two-column page chrome for the Login and Signup screens
/// (Reference Image 1): a promotional panel on the left and a scrollable
/// card on the right, both centred on a light page background.
///
/// Below [_breakpoint] the promo panel is dropped entirely and only the
/// card is shown, full-width — the responsive requirement in the design
/// brief ("single-column layout on smaller screens", "no horizontal
/// overflow") without inventing a different desktop composition than the
/// reference.
class AuthPageShell extends StatelessWidget {
  const AuthPageShell({
    super.key,
    required this.promoHeading,
    required this.promoSubheading,
    required this.card,
    this.cardMaxWidth = 460,
  });

  final String promoHeading;
  final String promoSubheading;
  final Widget card;
  final double cardMaxWidth;

  static const _breakpoint = 860.0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EduCapsulesColors.authBackground,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= _breakpoint;
            final cardColumn = Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: cardMaxWidth),
                  child: card,
                ),
              ),
            );

            if (!isWide) {
              return cardColumn;
            }

            return Row(
              children: [
                Expanded(
                  flex: 5,
                  child: SingleChildScrollView(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(minHeight: constraints.maxHeight),
                      child: PromoPanel(heading: promoHeading, subheading: promoSubheading),
                    ),
                  ),
                ),
                Expanded(flex: 6, child: cardColumn),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// The white rounded card every auth form is placed inside, matching the
/// reference's card borders/shadow/padding.
class AuthCard extends StatelessWidget {
  const AuthCard({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.fromLTRB(32, 32, 32, 28),
      decoration: BoxDecoration(
        color: EduCapsulesColors.authCardBackground,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: EduCapsulesColors.authBorder),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 28, offset: const Offset(0, 14)),
        ],
      ),
      child: child,
    );
  }
}
