import "package:flutter/material.dart";

import "../../../theme/colors.dart";

enum SocialProvider { google, apple, microsoft }

extension on SocialProvider {
  String get label => switch (this) {
    SocialProvider.google => "Google",
    SocialProvider.apple => "Apple",
    SocialProvider.microsoft => "Microsoft",
  };

  IconData get icon => switch (this) {
    SocialProvider.google => Icons.g_mobiledata,
    SocialProvider.apple => Icons.apple,
    SocialProvider.microsoft => Icons.window,
  };
}

/// "or continue with" divider + Google/Apple/Microsoft buttons.
///
/// No OAuth provider is configured anywhere in this backend — there is no
/// `/api/v1/auth/oauth/*` route, no client ID, no provider SDK dependency
/// in pubspec.yaml. Per the design brief, this must never simulate a
/// successful sign-in, so each button reports a clear "not configured"
/// state instead. To make one of these real: register the provider (OAuth
/// client ID/secret), add its Flutter SDK, and add the corresponding
/// `/api/v1/auth/oauth/<provider>` exchange endpoint server-side — none of
/// that exists today.
class SocialAuthRow extends StatelessWidget {
  const SocialAuthRow({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            const Expanded(child: Divider(color: EduCapsulesColors.authBorder)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text("or continue with", style: const TextStyle(color: EduCapsulesColors.authMutedText, fontSize: 12.5)),
            ),
            const Expanded(child: Divider(color: EduCapsulesColors.authBorder)),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            for (final provider in SocialProvider.values) ...[
              Expanded(child: _SocialButton(provider: provider)),
              if (provider != SocialProvider.values.last) const SizedBox(width: 12),
            ],
          ],
        ),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({required this.provider});

  final SocialProvider provider;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("${provider.label} sign-in isn't configured for this deployment yet.")));
      },
      icon: Icon(provider.icon, size: 20, color: EduCapsulesColors.authHeading),
      label: Text(
        provider.label,
        style: const TextStyle(fontSize: 13, color: EduCapsulesColors.authHeading, fontWeight: FontWeight.w600),
      ),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12),
        side: const BorderSide(color: EduCapsulesColors.authBorder),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
