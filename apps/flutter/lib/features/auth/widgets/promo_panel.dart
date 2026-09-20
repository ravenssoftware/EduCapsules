import "package:flutter/material.dart";

import "../../../theme/colors.dart";

/// The left-hand promotional panel shared by the Login and Signup pages
/// (Reference Image 1). Hidden on narrow viewports by [AuthPageShell],
/// which switches to a single-column layout there.
class PromoPanel extends StatelessWidget {
  const PromoPanel({super.key, required this.heading, required this.subheading});

  final String heading;
  final String subheading;

  static const _features = [
    (
      icon: Icons.auto_stories_outlined,
      title: "Smart Learning",
      description: "Access your classes, sessions and study materials anywhere.",
    ),
    (
      icon: Icons.show_chart,
      title: "Track Progress",
      description: "Monitor your performance and achievements in real time.",
    ),
    (
      icon: Icons.verified_user_outlined,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security.",
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(48, 40, 40, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _BrandLogo(),
          const SizedBox(height: 40),
          Text(
            heading,
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: EduCapsulesColors.authHeading,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            subheading,
            style: const TextStyle(
              fontSize: 15,
              color: EduCapsulesColors.authMutedText,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 32),
          const _PromoIllustration(),
          const SizedBox(height: 32),
          for (final feature in _features) ...[
            _FeatureRow(icon: feature.icon, title: feature.title, description: feature.description),
            const SizedBox(height: 18),
          ],
          const Spacer(),
          Row(
            children: [
              Icon(Icons.headset_mic_outlined, size: 18, color: EduCapsulesColors.authMutedText),
              const SizedBox(width: 8),
              Text(
                "Need help? ",
                style: const TextStyle(color: EduCapsulesColors.authMutedText, fontSize: 13),
              ),
              const Text(
                "Contact Support",
                style: TextStyle(
                  color: EduCapsulesColors.authIdentity,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BrandLogo extends StatelessWidget {
  const _BrandLogo();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [EduCapsulesColors.authIdentity, EduCapsulesColors.authIdentityDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.school, color: Colors.white, size: 20),
        ),
        const SizedBox(width: 10),
        RichText(
          text: const TextSpan(
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: EduCapsulesColors.authHeading),
            children: [
              TextSpan(text: "EDU", style: TextStyle(color: EduCapsulesColors.authIdentity)),
              TextSpan(text: "Capsules"),
            ],
          ),
        ),
      ],
    );
  }
}

/// A simplified vector reproduction of the reference illustration (a
/// device showing a play/lesson icon, a bar chart and a book stack) — no
/// bitmap asset for this exists in the repository, so it is drawn from
/// Material primitives rather than substituted with an unrelated stock
/// image.
class _PromoIllustration extends StatelessWidget {
  const _PromoIllustration();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 180,
      child: Stack(
        alignment: Alignment.bottomLeft,
        children: [
          Positioned(
            left: 0,
            bottom: 0,
            child: Container(
              width: 210,
              height: 140,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: EduCapsulesColors.authBorder),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 24, offset: const Offset(0, 12)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: EduCapsulesColors.authIdentity.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.play_arrow, color: EduCapsulesColors.authIdentity, size: 20),
                  ),
                  const SizedBox(height: 12),
                  Container(height: 8, width: 120, decoration: _barDecoration()),
                  const SizedBox(height: 8),
                  Container(height: 8, width: 90, decoration: _barDecoration()),
                  const Spacer(),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      for (final h in [14.0, 26.0, 18.0, 32.0])
                        Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: Container(
                            width: 10,
                            height: h,
                            decoration: BoxDecoration(
                              color: EduCapsulesColors.roleStudent.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            right: 8,
            bottom: 8,
            child: Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: EduCapsulesColors.authIdentity.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.menu_book_outlined, color: EduCapsulesColors.authIdentityDark, size: 30),
            ),
          ),
        ],
      ),
    );
  }

  BoxDecoration _barDecoration() =>
      BoxDecoration(color: const Color(0xFFE9EAF5), borderRadius: BorderRadius.circular(4));
}

class _FeatureRow extends StatelessWidget {
  const _FeatureRow({required this.icon, required this.title, required this.description});

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: EduCapsulesColors.authIdentity.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: EduCapsulesColors.authIdentity, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w700,
                  color: EduCapsulesColors.authHeading,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: const TextStyle(fontSize: 12.5, color: EduCapsulesColors.authMutedText, height: 1.35),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
