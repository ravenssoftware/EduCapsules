import "package:flutter/material.dart";

import "../../../theme/colors.dart";
import "promo_panel.dart";

/// Two-column page chrome for the Login screen: promo panel on the left,
/// the login card centred on the right, both on a light lavender
/// background, plus the page-wide legal notice pinned at the bottom.
///
/// Below [_breakpoint] the promo panel is dropped and only the card is
/// shown, full-width, addressing the "tablet-sized / narrow window"
/// responsive requirement without inventing a different desktop
/// composition than the reference.
class AuthPageShell extends StatelessWidget {
  const AuthPageShell({super.key, required this.card, this.cardMaxWidth = 460});

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
                child: ConstrainedBox(constraints: BoxConstraints(maxWidth: cardMaxWidth), child: card),
              ),
            );

            return Column(
              children: [
                Expanded(
                  child: isWide
                      ? Row(
                          children: [
                            Expanded(
                              flex: 5,
                              child: SingleChildScrollView(
                                child: ConstrainedBox(
                                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                                  child: const PromoPanel(),
                                ),
                              ),
                            ),
                            Expanded(flex: 6, child: cardColumn),
                          ],
                        )
                      : cardColumn,
                ),
                const _LegalFooter(),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// "By continuing, you agree to our Terms of Service and Privacy Policy."
/// No legal-pages URL is configured anywhere in this repository (no
/// terms/privacy route in apps/api, no constant, nothing in docs/) — per
/// the design brief, this must not invent a destination. Tapping either
/// link reports that clearly instead of navigating nowhere silently.
class _LegalFooter extends StatelessWidget {
  const _LegalFooter();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      child: Center(
        child: Wrap(
          alignment: WrapAlignment.center,
          children: [
            const Text(
              "By continuing, you agree to our ",
              style: TextStyle(fontSize: 12.5, color: EduCapsulesColors.authMutedText),
            ),
            _LegalLink(label: "Terms of Service"),
            const Text(" and ", style: TextStyle(fontSize: 12.5, color: EduCapsulesColors.authMutedText)),
            _LegalLink(label: "Privacy Policy"),
            const Text(".", style: TextStyle(fontSize: 12.5, color: EduCapsulesColors.authMutedText)),
          ],
        ),
      ),
    );
  }
}

class _LegalLink extends StatelessWidget {
  const _LegalLink({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("$label page isn't published for this deployment yet.")));
      },
      child: Text(
        label,
        style: const TextStyle(fontSize: 12.5, color: EduCapsulesColors.authIdentity, fontWeight: FontWeight.w600),
      ),
    );
  }
}

/// The white rounded card the login form sits inside.
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
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 28, offset: const Offset(0, 14))],
      ),
      child: child,
    );
  }
}
