import "package:flutter/material.dart";

import "../../../theme/colors.dart";
import "../auth_role.dart";

/// The five role tiles at the top of the Login and Signup cards
/// (Reference Image 1). Wraps onto a second line on narrow widths instead
/// of overflowing horizontally.
class RoleSelector extends StatelessWidget {
  const RoleSelector({super.key, required this.selected, required this.onChanged});

  final AuthRole selected;
  final ValueChanged<AuthRole> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final role in AuthRole.values) _RoleTile(role: role, isSelected: role == selected, onTap: () => onChanged(role)),
      ],
    );
  }
}

class _RoleTile extends StatelessWidget {
  const _RoleTile({required this.role, required this.isSelected, required this.onTap});

  final AuthRole role;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: isSelected,
      label: "${role.label} role",
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: 78,
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? EduCapsulesColors.authIdentity : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? EduCapsulesColors.authIdentity : EduCapsulesColors.authBorder,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(role.icon, size: 20, color: isSelected ? Colors.white : EduCapsulesColors.authMutedText),
              const SizedBox(height: 6),
              Text(
                role.label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : EduCapsulesColors.authHeading,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
