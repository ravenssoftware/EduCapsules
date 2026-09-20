import "package:flutter/material.dart";

import "../../theme/colors.dart";

/// The five role tiles shown on both the Login and Signup reference
/// designs. This is a client-side UI concept only (FE-002): neither
/// `/api/v1/auth/login` nor `/api/v1/auth/register` currently accept a
/// role, so selecting one here never changes what is sent to the server —
/// it only drives which registration form and accent colour are shown.
/// Role-based authorization itself is decided server-side by the Phase 5
/// authz pipeline once a session exists, not by this picker.
enum AuthRole { student, teacher, assistant, parent, admin }

extension AuthRoleDisplay on AuthRole {
  String get label => switch (this) {
    AuthRole.student => "Student",
    AuthRole.teacher => "Teacher",
    AuthRole.assistant => "Assistant",
    AuthRole.parent => "Parent",
    AuthRole.admin => "Admin",
  };

  IconData get icon => switch (this) {
    AuthRole.student => Icons.school_outlined,
    AuthRole.teacher => Icons.school,
    AuthRole.assistant => Icons.support_agent_outlined,
    AuthRole.parent => Icons.family_restroom_outlined,
    AuthRole.admin => Icons.shield_outlined,
  };

  Color get accent => switch (this) {
    AuthRole.student => EduCapsulesColors.roleStudent,
    AuthRole.teacher => EduCapsulesColors.roleTeacher,
    AuthRole.assistant => EduCapsulesColors.roleAssistant,
    AuthRole.parent => EduCapsulesColors.roleParent,
    AuthRole.admin => EduCapsulesColors.roleAdmin,
  };
}
