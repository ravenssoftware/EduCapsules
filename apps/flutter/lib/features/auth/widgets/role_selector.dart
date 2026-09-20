import "package:flutter/material.dart";

import "../../../theme/colors.dart";
import "../auth_role.dart";

/// The five role tiles at the top of the Login and Signup cards
/// (Reference Image 1): all five fit on a single row, each sharing the
/// available width equally, matching the reference rather than wrapping.
class RoleSelector extends StatelessWidget {
  const RoleSelector({super.key, required this.selected, required this.onChanged});

  final AuthRole selected;
  final ValueChanged<AuthRole> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final role in AuthRole.values) ...[
          Expanded(child: _RoleTile(role: role, isSelected: role == selected, onTap: () => onChanged(role))),
          if (role != AuthRole.values.last) const SizedBox(width: 8),
        ],
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
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
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
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
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
