import "package:flutter/material.dart";

import "../../../theme/colors.dart";

class CountryCode {
  const CountryCode(this.dialCode, this.flagEmoji, this.iso);

  final String dialCode;
  final String flagEmoji;
  final String iso;
}

/// A short, representative set — this is a UI affordance for the reference
/// design's country-code selector, not a claim of full ITU E.164 coverage.
const List<CountryCode> _countryCodes = [
  CountryCode("+20", "🇪🇬", "EG"),
  CountryCode("+1", "🇺🇸", "US"),
  CountryCode("+44", "🇬🇧", "GB"),
  CountryCode("+971", "🇦🇪", "AE"),
  CountryCode("+966", "🇸🇦", "SA"),
  CountryCode("+91", "🇮🇳", "IN"),
];

/// The "Phone Number" field with a country-code selector shown in the
/// Teacher/Parent/Admin registration references.
class PhoneField extends StatefulWidget {
  const PhoneField({
    super.key,
    required this.controller,
    this.initialCountry = "+20",
    this.onCountryChanged,
  });

  final TextEditingController controller;
  final String initialCountry;
  final ValueChanged<String>? onCountryChanged;

  @override
  State<PhoneField> createState() => _PhoneFieldState();
}

class _PhoneFieldState extends State<PhoneField> {
  late CountryCode _selected = _countryCodes.firstWhere(
    (c) => c.dialCode == widget.initialCountry,
    orElse: () => _countryCodes.first,
  );

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Phone Number",
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: EduCapsulesColors.authHeading),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: EduCapsulesColors.authBorder),
            borderRadius: BorderRadius.circular(10),
            color: Colors.white,
          ),
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<CountryCode>(
                    value: _selected,
                    items: [
                      for (final country in _countryCodes)
                        DropdownMenuItem(
                          value: country,
                          child: Text("${country.flagEmoji} ${country.dialCode}", style: const TextStyle(fontSize: 13)),
                        ),
                    ],
                    onChanged: (country) {
                      if (country == null) return;
                      setState(() => _selected = country);
                      widget.onCountryChanged?.call(country.dialCode);
                    },
                  ),
                ),
              ),
              Container(width: 1, height: 24, color: EduCapsulesColors.authBorder),
              Expanded(
                child: TextFormField(
                  controller: widget.controller,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(fontSize: 14, color: EduCapsulesColors.authHeading),
                  decoration: const InputDecoration(
                    hintText: "Ex: 10 1234 5678",
                    hintStyle: TextStyle(color: EduCapsulesColors.authPlaceholder, fontSize: 14),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String get fullDialCode => _selected.dialCode;
}
