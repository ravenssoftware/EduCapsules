import "package:flutter/material.dart";

import "../../../core/api_client.dart";
import "../../../theme/colors.dart";
import "../auth_repository.dart";
import "../auth_role.dart";
import "auth_text_field.dart";
import "gradient_button.dart";
import "password_field.dart";
import "password_requirements.dart";
import "phone_field.dart";
import "section_heading.dart";
import "terms_checkbox.dart";

/// The four role-specific registration forms (Reference Image 2): Teacher,
/// Student, Parent, Admin. Field sets, section groupings and accent colour
/// follow the reference exactly for each role; only the account-security
/// section (password/confirm/terms) and submission plumbing are shared.
///
/// Backend note (read before assuming every field is persisted): the real
/// `/api/v1/auth/register` endpoint (routes/auth.ts) accepts only
/// organizationId/email/password/locale/timezone — no name, phone, date of
/// birth, gender, or any of the role-specific professional/academic/child/
/// organization fields exist anywhere in the current schema or API. This
/// form still collects and validates all of them, because the reference
/// design and this task both require the full field set, but only email +
/// password are actually sent to the server; the rest is UI-side profile
/// data with nowhere to be stored yet. This is a reported gap, not an
/// invented backend — a future phase that adds a `user_profile` table (or
/// equivalent) is what would let the rest of this form's data persist.
class RoleRegistrationForm extends StatefulWidget {
  const RoleRegistrationForm({
    super.key,
    required this.role,
    required this.authRepository,
    required this.organizationId,
    required this.onRegistered,
  });

  final AuthRole role;
  final AuthRepository authRepository;
  final String organizationId;
  final VoidCallback onRegistered;

  @override
  State<RoleRegistrationForm> createState() => _RoleRegistrationFormState();
}

class _RoleRegistrationFormState extends State<RoleRegistrationForm> {
  final _formKey = GlobalKey<FormState>();

  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _qualificationController = TextEditingController();
  final _schoolController = TextEditingController();
  final _childNameController = TextEditingController();
  final _organizationNameController = TextEditingController();
  final _securityCodeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  DateTime? _dateOfBirth;
  String? _gender;
  String? _subjectsTaught;
  String? _teachingExperience;
  String? _grade;
  String? _subjectsOfInterest;
  String? _relationshipToStudent;
  String? _childGrade;
  String? _adminRole;
  String? _department;

  bool _agreedToTerms = false;
  bool _showTermsError = false;
  bool _isSubmitting = false;
  String? _password = "";

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _qualificationController.dispose();
    _schoolController.dispose();
    _childNameController.dispose();
    _organizationNameController.dispose();
    _securityCodeController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Color get _accent => widget.role.accent;

  String? _requiredValidator(String? value, String field) =>
      (value == null || value.trim().isEmpty) ? "$field is required." : null;

  String? _emailValidator(String? value) {
    if (value == null || value.trim().isEmpty) return "Email Address is required.";
    final ok = RegExp(r"^[^@\s]+@[^@\s]+\.[^@\s]+$").hasMatch(value.trim());
    return ok ? null : "Enter a valid email address.";
  }

  String? _phoneValidator(String? value) {
    if (value == null || value.trim().isEmpty) return "Phone Number is required.";
    final digits = value.replaceAll(RegExp(r"[^0-9]"), "");
    return digits.length >= 7 ? null : "Enter a valid phone number.";
  }

  String? _passwordValidator(String? value) {
    if (value == null || value.isEmpty) return "Password is required.";
    return passwordMeetsAllRequirements(value) ? null : "Password does not meet all requirements.";
  }

  String? _confirmPasswordValidator(String? value) {
    if (value != _passwordController.text) return "Passwords do not match.";
    return null;
  }

  Future<void> _pickDateOfBirth() async {
    final now = DateTime.now();
    final selected = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 16, now.month, now.day),
      firstDate: DateTime(now.year - 100),
      lastDate: now,
    );
    if (selected != null) setState(() => _dateOfBirth = selected);
  }

  String _formatDate(DateTime date) =>
      "${date.year.toString().padLeft(4, "0")}-${date.month.toString().padLeft(2, "0")}-${date.day.toString().padLeft(2, "0")}";

  Future<void> _submit() async {
    final formValid = _formKey.currentState?.validate() ?? false;
    final dobRequired = widget.role == AuthRole.student || widget.role == AuthRole.teacher;
    final dobOk = !dobRequired || _dateOfBirth != null;
    setState(() => _showTermsError = !_agreedToTerms);

    if (!formValid || !_agreedToTerms || !dobOk) {
      if (!dobOk) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Date of Birth is required.")),
        );
      }
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final outcome = await widget.authRepository.register(
        organizationId: widget.organizationId,
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      await showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text("Almost there"),
          content: Text(outcome.message),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text("OK")),
          ],
        ),
      );
      if (!mounted) return;
      widget.onRegistered();
    } on ApiException catch (err) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err.toString())));
    } catch (_) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Registration failed. Please try again.")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          _Header(role: widget.role),
          const SizedBox(height: 20),
          ..._sectionsForRole(),
          RegistrationSectionHeading(title: "Account Security", accent: _accent),
          PasswordField(
            label: "Password",
            hintText: "Create a strong password",
            controller: _passwordController,
            validator: _passwordValidator,
            onChanged: (value) => setState(() => _password = value),
          ),
          const SizedBox(height: 6),
          PasswordRequirementsChecklist(password: _password ?? ""),
          const SizedBox(height: 14),
          PasswordField(
            label: "Confirm Password",
            hintText: "Confirm your password",
            controller: _confirmPasswordController,
            validator: _confirmPasswordValidator,
          ),
          if (widget.role == AuthRole.admin) ...[
            const SizedBox(height: 14),
            AuthTextField(
              label: "Security Code (Optional)",
              controller: _securityCodeController,
              hintText: "Enter invite or security code",
              icon: Icons.verified_user_outlined,
            ),
          ],
          const SizedBox(height: 16),
          TermsAgreementCheckbox(
            value: _agreedToTerms,
            activeColor: _accent,
            showError: _showTermsError,
            onChanged: (value) => setState(() {
              _agreedToTerms = value;
              _showTermsError = false;
            }),
          ),
          const SizedBox(height: 20),
          GradientActionButton(
            label: "Create ${widget.role.label} Account",
            isLoading: _isSubmitting,
            colors: [_accent, _accent.withValues(alpha: 0.78)],
            onPressed: _submit,
          ),
        ],
      ),
    );
  }

  List<Widget> _sectionsForRole() {
    switch (widget.role) {
      case AuthRole.teacher:
        return _teacherSections();
      case AuthRole.student:
        return _studentSections();
      case AuthRole.parent:
        return _parentSections();
      case AuthRole.admin:
        return _adminSections();
      case AuthRole.assistant:
        return _assistantSections();
    }
  }

  List<Widget> _fieldGap() => [const SizedBox(height: 14)];

  List<Widget> _teacherSections() {
    return [
      RegistrationSectionHeading(title: "Personal Information", accent: _accent),
      AuthTextField(
        label: "Full Name",
        controller: _fullNameController,
        hintText: "Enter your full name",
        icon: Icons.person_outline,
        validator: (v) => _requiredValidator(v, "Full Name"),
      ),
      ..._fieldGap(),
      AuthTextField(
        label: "Email Address",
        controller: _emailController,
        hintText: "Enter your email",
        icon: Icons.mail_outline,
        keyboardType: TextInputType.emailAddress,
        validator: _emailValidator,
      ),
      ..._fieldGap(),
      PhoneField(controller: _phoneController),
      ..._fieldGap(),
      _DateOfBirthField(date: _dateOfBirth, onTap: _pickDateOfBirth),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Gender",
        value: _gender,
        hintText: "Select your gender",
        icon: Icons.wc_outlined,
        items: const [
          DropdownMenuItem(value: "female", child: Text("Female")),
          DropdownMenuItem(value: "male", child: Text("Male")),
          DropdownMenuItem(value: "prefer_not_to_say", child: Text("Prefer not to say")),
        ],
        onChanged: (v) => setState(() => _gender = v),
      ),
      const SizedBox(height: 18),
      RegistrationSectionHeading(title: "Professional Information", accent: _accent),
      AuthTextField(
        label: "Qualification / Degree",
        controller: _qualificationController,
        hintText: "Enter your highest qualification",
        icon: Icons.workspace_premium_outlined,
        validator: (v) => _requiredValidator(v, "Qualification / Degree"),
      ),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Subjects You Teach",
        value: _subjectsTaught,
        hintText: "Select subjects",
        icon: Icons.menu_book_outlined,
        items: const [
          DropdownMenuItem(value: "mathematics", child: Text("Mathematics")),
          DropdownMenuItem(value: "science", child: Text("Science")),
          DropdownMenuItem(value: "languages", child: Text("Languages")),
          DropdownMenuItem(value: "social_studies", child: Text("Social Studies")),
          DropdownMenuItem(value: "other", child: Text("Other")),
        ],
        onChanged: (v) => setState(() => _subjectsTaught = v),
        validator: (v) => v == null ? "Select at least one subject." : null,
      ),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Teaching Experience",
        value: _teachingExperience,
        hintText: "Select experience level",
        icon: Icons.timeline_outlined,
        items: const [
          DropdownMenuItem(value: "0-1", child: Text("Less than 1 year")),
          DropdownMenuItem(value: "1-3", child: Text("1–3 years")),
          DropdownMenuItem(value: "3-5", child: Text("3–5 years")),
          DropdownMenuItem(value: "5+", child: Text("5+ years")),
        ],
        onChanged: (v) => setState(() => _teachingExperience = v),
        validator: (v) => v == null ? "Select your experience level." : null,
      ),
      const SizedBox(height: 18),
    ];
  }

  List<Widget> _studentSections() {
    return [
      RegistrationSectionHeading(title: "Personal Information", accent: _accent),
      AuthTextField(
        label: "Full Name",
        controller: _fullNameController,
        hintText: "Enter your full name",
        icon: Icons.person_outline,
        validator: (v) => _requiredValidator(v, "Full Name"),
      ),
      ..._fieldGap(),
      AuthTextField(
        label: "Email Address",
        controller: _emailController,
        hintText: "Enter your email",
        icon: Icons.mail_outline,
        keyboardType: TextInputType.emailAddress,
        validator: _emailValidator,
      ),
      ..._fieldGap(),
      _DateOfBirthField(date: _dateOfBirth, onTap: _pickDateOfBirth),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Gender",
        value: _gender,
        hintText: "Select your gender",
        icon: Icons.wc_outlined,
        items: const [
          DropdownMenuItem(value: "female", child: Text("Female")),
          DropdownMenuItem(value: "male", child: Text("Male")),
          DropdownMenuItem(value: "prefer_not_to_say", child: Text("Prefer not to say")),
        ],
        onChanged: (v) => setState(() => _gender = v),
      ),
      const SizedBox(height: 18),
      RegistrationSectionHeading(title: "Academic Information", accent: _accent),
      AuthTextField(
        label: "School / Institution (Optional)",
        controller: _schoolController,
        hintText: "Enter your school or institution",
        icon: Icons.apartment_outlined,
      ),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Grade / Class",
        value: _grade,
        hintText: "Select your grade or class",
        icon: Icons.grade_outlined,
        items: const [
          for (var grade = 1; grade <= 12; grade++)
            DropdownMenuItem(value: "grade_$grade", child: Text("Grade $grade")),
        ],
        onChanged: (v) => setState(() => _grade = v),
        validator: (v) => v == null ? "Select your grade or class." : null,
      ),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Subjects of Interest",
        value: _subjectsOfInterest,
        hintText: "Select subjects",
        icon: Icons.menu_book_outlined,
        items: const [
          DropdownMenuItem(value: "mathematics", child: Text("Mathematics")),
          DropdownMenuItem(value: "science", child: Text("Science")),
          DropdownMenuItem(value: "languages", child: Text("Languages")),
          DropdownMenuItem(value: "arts", child: Text("Arts")),
          DropdownMenuItem(value: "other", child: Text("Other")),
        ],
        onChanged: (v) => setState(() => _subjectsOfInterest = v),
      ),
      const SizedBox(height: 18),
    ];
  }

  List<Widget> _parentSections() {
    return [
      RegistrationSectionHeading(title: "Personal Information", accent: _accent),
      AuthTextField(
        label: "Full Name",
        controller: _fullNameController,
        hintText: "Enter your full name",
        icon: Icons.person_outline,
        validator: (v) => _requiredValidator(v, "Full Name"),
      ),
      ..._fieldGap(),
      AuthTextField(
        label: "Email Address",
        controller: _emailController,
        hintText: "Enter your email",
        icon: Icons.mail_outline,
        keyboardType: TextInputType.emailAddress,
        validator: _emailValidator,
      ),
      ..._fieldGap(),
      PhoneField(controller: _phoneController),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Relationship to Student",
        value: _relationshipToStudent,
        hintText: "Select your relationship",
        icon: Icons.diversity_1_outlined,
        items: const [
          DropdownMenuItem(value: "mother", child: Text("Mother")),
          DropdownMenuItem(value: "father", child: Text("Father")),
          DropdownMenuItem(value: "guardian", child: Text("Legal Guardian")),
          DropdownMenuItem(value: "other", child: Text("Other")),
        ],
        onChanged: (v) => setState(() => _relationshipToStudent = v),
        validator: (v) => v == null ? "Select your relationship to the student." : null,
      ),
      const SizedBox(height: 18),
      RegistrationSectionHeading(title: "Child Information", accent: _accent),
      AuthTextField(
        label: "Child's Full Name",
        controller: _childNameController,
        hintText: "Enter your child's full name",
        icon: Icons.person_outline,
        validator: (v) => _requiredValidator(v, "Child's Full Name"),
      ),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Child's Grade / Class",
        value: _childGrade,
        hintText: "Select grade or class",
        icon: Icons.grade_outlined,
        items: const [
          for (var grade = 1; grade <= 12; grade++)
            DropdownMenuItem(value: "grade_$grade", child: Text("Grade $grade")),
        ],
        onChanged: (v) => setState(() => _childGrade = v),
        validator: (v) => v == null ? "Select your child's grade or class." : null,
      ),
      ..._fieldGap(),
      AuthTextField(
        label: "School / Institution (Optional)",
        controller: _schoolController,
        hintText: "Enter school or institution",
        icon: Icons.apartment_outlined,
      ),
      const SizedBox(height: 18),
    ];
  }

  List<Widget> _adminSections() {
    return [
      RegistrationSectionHeading(title: "Personal Information", accent: _accent),
      AuthTextField(
        label: "Full Name",
        controller: _fullNameController,
        hintText: "Enter your full name",
        icon: Icons.person_outline,
        validator: (v) => _requiredValidator(v, "Full Name"),
      ),
      ..._fieldGap(),
      AuthTextField(
        label: "Email Address",
        controller: _emailController,
        hintText: "Enter your email",
        icon: Icons.mail_outline,
        keyboardType: TextInputType.emailAddress,
        validator: _emailValidator,
      ),
      ..._fieldGap(),
      PhoneField(controller: _phoneController),
      const SizedBox(height: 18),
      RegistrationSectionHeading(title: "Organization Information", accent: _accent),
      AuthTextField(
        label: "Organization Name",
        controller: _organizationNameController,
        hintText: "Enter organization name",
        icon: Icons.apartment_outlined,
        validator: (v) => _requiredValidator(v, "Organization Name"),
      ),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Admin Role",
        value: _adminRole,
        hintText: "Select admin role",
        icon: Icons.admin_panel_settings_outlined,
        items: const [
          DropdownMenuItem(value: "org_admin", child: Text("Organization Admin")),
          DropdownMenuItem(value: "it_admin", child: Text("IT Admin")),
          DropdownMenuItem(value: "registrar", child: Text("Registrar")),
        ],
        onChanged: (v) => setState(() => _adminRole = v),
        validator: (v) => v == null ? "Select an admin role." : null,
      ),
      ..._fieldGap(),
      AuthDropdownField<String>(
        label: "Department / Unit",
        value: _department,
        hintText: "Select department or unit",
        icon: Icons.corporate_fare_outlined,
        items: const [
          DropdownMenuItem(value: "academics", child: Text("Academics")),
          DropdownMenuItem(value: "operations", child: Text("Operations")),
          DropdownMenuItem(value: "it", child: Text("IT")),
          DropdownMenuItem(value: "other", child: Text("Other")),
        ],
        onChanged: (v) => setState(() => _department = v),
      ),
      const SizedBox(height: 18),
    ];
  }

  List<Widget> _assistantSections() {
    // No dedicated reference form exists for Assistant — the general
    // Signup card's field set (Full Name/Email/Username covered by Email/
    // Password) is reused rather than inventing an unreferenced layout.
    return [
      RegistrationSectionHeading(title: "Personal Information", accent: _accent),
      AuthTextField(
        label: "Full Name",
        controller: _fullNameController,
        hintText: "Enter your full name",
        icon: Icons.person_outline,
        validator: (v) => _requiredValidator(v, "Full Name"),
      ),
      ..._fieldGap(),
      AuthTextField(
        label: "Email",
        controller: _emailController,
        hintText: "Enter your email address",
        icon: Icons.mail_outline,
        keyboardType: TextInputType.emailAddress,
        validator: _emailValidator,
      ),
      const SizedBox(height: 18),
    ];
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.role});

  final AuthRole role;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(color: role.accent.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(14)),
          child: Icon(role.icon, color: role.accent, size: 24),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RichText(
                text: TextSpan(
                  style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: EduCapsulesColors.authHeading),
                  children: [
                    const TextSpan(text: "Create "),
                    TextSpan(text: role.label, style: TextStyle(color: role.accent)),
                    const TextSpan(text: " Account"),
                  ],
                ),
              ),
              const SizedBox(height: 3),
              Text(
                _subtitleForRole(role),
                style: const TextStyle(fontSize: 12.5, color: EduCapsulesColors.authMutedText),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _subtitleForRole(AuthRole role) => switch (role) {
    AuthRole.teacher => "Join EDUCapsules and start teaching the future.",
    AuthRole.student => "Join EDUCapsules and start your learning journey.",
    AuthRole.parent => "Join EDUCapsules to support your child's learning journey.",
    AuthRole.admin => "Create an administrator account to manage the platform.",
    AuthRole.assistant => "Join EDUCapsules to support classrooms and teachers.",
  };
}

class _DateOfBirthField extends StatelessWidget {
  const _DateOfBirthField({required this.date, required this.onTap});

  final DateTime? date;
  final VoidCallback onTap;

  String? get _formatted => date == null
      ? null
      : "${date!.year.toString().padLeft(4, "0")}-${date!.month.toString().padLeft(2, "0")}-${date!.day.toString().padLeft(2, "0")}";

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Date of Birth",
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: EduCapsulesColors.authHeading),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
            decoration: BoxDecoration(
              border: Border.all(color: EduCapsulesColors.authBorder),
              borderRadius: BorderRadius.circular(10),
              color: Colors.white,
            ),
            child: Row(
              children: [
                const Icon(Icons.cake_outlined, size: 18, color: EduCapsulesColors.authMutedText),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _formatted ?? "Select your date of birth",
                    style: TextStyle(
                      fontSize: 14,
                      color: _formatted == null ? EduCapsulesColors.authPlaceholder : EduCapsulesColors.authHeading,
                    ),
                  ),
                ),
                const Icon(Icons.calendar_today_outlined, size: 16, color: EduCapsulesColors.authMutedText),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
