import "package:flutter/material.dart";

import "../../../theme/colors.dart";

/// The five role tiles on the Login card. This is a client-side-only
/// concept — `/api/v1/auth/login` (routes/auth.ts) has no "role" field, so
/// selecting a tile here never changes what's sent to the server. It may
/// drive future client-side routing once role-specific experiences exist
/// (Phases 14-17/22); it is never an authorization decision, which is
/// decided server-side by the Phase 5 authorization pipeline.
enum LoginRole { student, teacher, assistant, parent, admin }

extension LoginRoleDisplay on LoginRole {
  String get label => switch (this) {
    LoginRole.student => "Student",
    LoginRole.teacher => "Teacher",
    LoginRole.assistant => "Assistant",
    LoginRole.parent => "Parent",
    LoginRole.admin => "Admin",
  };

  IconData get icon => switch (this) {
    LoginRole.student => Icons.school_outlined,
    LoginRole.teacher => Icons.school,
    LoginRole.assistant => Icons.support_agent_outlined,
    LoginRole.parent => Icons.family_restroom_outlined,
    LoginRole.admin => Icons.shield_outlined,
  };
}

/// All five tiles share one row, each sharing the available width equally
/// (rather than wrapping) — matches the reference and avoids overflow at
/// any width, including "Assistant", the longest label.
class RoleSelector extends StatelessWidget {
  const RoleSelector({super.key, required this.selected, required this.onChanged});

  final LoginRole selected;
  final ValueChanged<LoginRole> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final role in LoginRole.values) ...[
          Expanded(child: _RoleTile(role: role, isSelected: role == selected, onTap: () => onChanged(role))),
          if (role != LoginRole.values.last) const SizedBox(width: 8),
        ],
      ],
    );
  }
}

class _RoleTile extends StatelessWidget {
  const _RoleTile({required this.role, required this.isSelected, required this.onTap});

  final LoginRole role;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: isSelected,
      label: "${role.label} role",
      // Without this, the descendant Text/Icon's own implicit semantics
      // merge into this node, announcing e.g. "Student role, Student" —
      // redundant since the label above already says it once.
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected ? EduCapsulesColors.authIdentity : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? EduCapsulesColors.authIdentity : EduCapsulesColors.authBorder),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(role.icon, size: 20, color: isSelected ? Colors.white : EduCapsulesColors.authMutedText),
              const SizedBox(height: 6),
              // FittedBox: "Assistant" is the longest label and clips
              // under some system fallback fonts at a fixed size — scale
              // down instead of truncating.
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  role.label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : EduCapsulesColors.authHeading,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
