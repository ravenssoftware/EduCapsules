import "package:flutter/material.dart";

import "../../../theme/colors.dart";

/// The left-hand branding panel (docs/design-references/
/// 01-login-and-general-signup.webp): logo, heading, illustration, three
/// benefit rows, and a support link. Hidden on narrow viewports by
/// [AuthPageShell], which switches to a single-column layout there.
class PromoPanel extends StatelessWidget {
  const PromoPanel({super.key});

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
          const Text(
            "Welcome back!",
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: EduCapsulesColors.authHeading, height: 1.2),
          ),
          const SizedBox(height: 10),
          const Text(
            "Login to continue your learning journey with EduCapsules.",
            style: TextStyle(fontSize: 15, color: EduCapsulesColors.authMutedText, height: 1.4),
          ),
          const SizedBox(height: 32),
          const _PromoIllustration(),
          const SizedBox(height: 32),
          for (final feature in _features) ...[
            _FeatureRow(icon: feature.icon, title: feature.title, description: feature.description),
            const SizedBox(height: 18),
          ],
          const SizedBox(height: 24),
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.headset_mic_outlined, size: 18, color: EduCapsulesColors.authMutedText),
                  const SizedBox(width: 8),
                  const Text("Need help? ", style: TextStyle(color: EduCapsulesColors.authMutedText, fontSize: 13)),
                ],
              ),
              GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).clearSnackBars();
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(const SnackBar(content: Text("Support isn't configured for this deployment yet.")));
                },
                child: const Text(
                  "Contact Support",
                  style: TextStyle(color: EduCapsulesColors.authIdentity, fontWeight: FontWeight.w600, fontSize: 13),
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
        Text.rich(
          const TextSpan(
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

/// No bitmap illustration asset exists anywhere in this repository (no
/// `assets/` directory is declared in pubspec.yaml, and none was provided)
/// — this is a hand-built vector approximation of the reference's monitor
/// + play button + graduation-cap + bar-chart-card + book-stack
/// illustration using only Flutter primitives (Icons, shapes), not an
/// unrelated stock image. If a real illustration asset becomes available,
/// swap this widget's body for an `Image.asset(...)`.
class _PromoIllustration extends StatelessWidget {
  const _PromoIllustration();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 210,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Soft blurred background circles, as in the reference.
          Positioned(
            left: -10,
            top: 10,
            child: _BlurCircle(diameter: 150, color: EduCapsulesColors.authIdentity.withValues(alpha: 0.08)),
          ),
          Positioned(
            left: 60,
            top: 60,
            child: _BlurCircle(diameter: 70, color: EduCapsulesColors.authIdentity.withValues(alpha: 0.12)),
          ),

          // Book stack + plant, bottom-left.
          Positioned(
            left: 4,
            bottom: 6,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _BookStack(),
                const SizedBox(width: 8),
                Icon(Icons.local_florist, color: EduCapsulesColors.authIllustrationAccent, size: 26),
              ],
            ),
          ),

          // Monitor with play button + lines.
          Positioned(
            left: 30,
            bottom: 40,
            child: Container(
              width: 190,
              height: 120,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: EduCapsulesColors.authHeading,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 20, offset: const Offset(0, 10)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: const BoxDecoration(color: EduCapsulesColors.authIdentity, shape: BoxShape.circle),
                    child: const Icon(Icons.play_arrow, color: Colors.white, size: 18),
                  ),
                  const SizedBox(height: 14),
                  Container(height: 6, width: 110, decoration: _lineDecoration()),
                  const SizedBox(height: 8),
                  Container(height: 6, width: 80, decoration: _lineDecoration()),
                ],
              ),
            ),
          ),

          // Graduation cap badge, floating top-right of the monitor.
          Positioned(
            right: 30,
            top: 0,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: EduCapsulesColors.authIdentity,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 12, offset: const Offset(0, 6)),
                ],
              ),
              child: const Icon(Icons.school, color: Colors.white, size: 24),
            ),
          ),

          // Small bar-chart card, bottom-right.
          Positioned(
            right: 0,
            bottom: 20,
            child: Container(
              width: 90,
              height: 70,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: EduCapsulesColors.authBorder),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 14, offset: const Offset(0, 8)),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  for (final h in [16.0, 30.0, 22.0])
                    Container(
                      width: 12,
                      height: h,
                      decoration: BoxDecoration(
                        color: EduCapsulesColors.authIllustrationAccent,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  BoxDecoration _lineDecoration() =>
      BoxDecoration(color: Colors.white.withValues(alpha: 0.25), borderRadius: BorderRadius.circular(4));
}

class _BlurCircle extends StatelessWidget {
  const _BlurCircle({required this.diameter, required this.color});

  final double diameter;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(width: diameter, height: diameter, decoration: BoxDecoration(color: color, shape: BoxShape.circle));
  }
}

class _BookStack extends StatelessWidget {
  const _BookStack();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final w in [56.0, 62.0, 50.0])
          Container(
            width: w,
            height: 12,
            margin: const EdgeInsets.only(bottom: 2),
            decoration: BoxDecoration(color: EduCapsulesColors.authIdentityDark, borderRadius: BorderRadius.circular(3)),
          ),
      ],
    );
  }
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
                style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: EduCapsulesColors.authHeading),
              ),
              const SizedBox(height: 2),
              Text(description, style: const TextStyle(fontSize: 12.5, color: EduCapsulesColors.authMutedText, height: 1.35)),
            ],
          ),
        ),
      ],
    );
  }
}
