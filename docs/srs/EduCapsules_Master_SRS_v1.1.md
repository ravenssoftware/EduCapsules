**EduCapsules**

*Teach safely · Learn in order · Monitor with confidence*

**MASTER SOFTWARE REQUIREMENTS SPECIFICATION**

**Version 1.1 · Audited & Reconciled Baseline**

11 September 2026 (v1.1 audit pass; supersedes v1.0 of 8 September 2026)

![](media/image1.png){width="6.0in" height="2.749225721784777in"}

*Figure 0.1 --- The fundamental role separation. Every requirement in this document is consistent with it.*

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Project Owner**                                     Miss Selvia
  ----------------------------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Project Manager · Software Engineer · Developer**   Moustafa Mahgoub

  **Testing & Quality Assurance**                       Ramzy Mohamed

  **Consolidates**                                      16 source specifications: roles, dashboards, activities, question bank, storage, import/export, content protection, session security, data security, legal framework, payments, capability matrices

  **Supersedes**                                        All prior EduCapsules SRS drafts and the individual specification documents listed above
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*This document is the single source of truth for EduCapsules. Where it conflicts with an earlier document, this document wins; every such conflict is recorded in §1.4.*

# 1. Document Control

## 1.1 Identification

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Field**            **Value**
  -------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Product**          EduCapsules

  **Document**         Master Software Requirements Specification

  **Version**          1.1 --- Audited & Reconciled Baseline (supersedes 1.0)

  **Date**             11 September 2026

  **Status**           Draft for Project Owner acceptance. This revision is a systematic audit pass over v1.0: every change is itemised in §1.7 and in the change log (§52.5); no confirmed decision was reversed.

  **Authority**        Single source of truth (GEN-001). Supersedes all prior EduCapsules specification documents.

  **Change control**   A requirement changes only through §1.5: identify → explain → trace dependencies → update all affected sections → update business rules, permissions and acceptance criteria → record in the change log.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 1.2 How this document is organised

Sections 2--9 establish the product, its vocabulary and its authorization model --- read these first, because everything else depends on them. Sections 10--23 specify the domain. Sections 24--33 specify the role experiences and cross-cutting services. Sections 34--43 specify architecture, data, API and quality. Sections 44--51 cover verification, traceability and open items.

## 1.3 Requirement conventions

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Convention**    **Rule**
  ----------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Identifier**    PREFIX-NNN, permanent, never reused, never renumbered. §51 lists every prefix.

  **Priority**      **MUST** (V1 required) · **SHOULD** (important, not V1-blocking) · **COULD** (optional) · **WON\'T** (excluded from this release)

  **Status**        **CONFIRMED** (decided) · **PROPOSED** (this document\'s recommendation, binding on acceptance) · **ASSUMPTION** (working position) · **OPEN** (needs a decision) · **FUTURE** (post-V1)

  **Wording**       "shall" = binding requirement. "should" = strong recommendation. Anything not stated as a requirement is not one.

  **Testability**   Every MUST is written so that it can be objectively verified. Where a numeric target is not yet decided it is marked **TBD** rather than invented.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 1.4 Conflicts found in the source material, and how they were resolved

The source specifications were written at different times. Six genuine conflicts were found. Each is resolved below in favour of the latest, most explicit decision, preserving the core architectural principles. No conflict was resolved by silently introducing a different architecture.

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**   **Conflict**                                                                                                                                         **Resolution**                                                                                                                                                                                      **Where**
  -------- ---------------------------------------------------------------------------------------------------------------------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- ----------------
  C-1      "Session" means a teaching occurrence in the academic material and an authenticated access period in the security material.                          **Both concepts are kept and renamed.** \*Teaching Session\* (academic, prefix SES) and \*Login Session\* (security, prefix AUTH). The word "session" is never used unqualified in this document.   §3.2, §14, §32

  C-2      Security material numbered login-session requirements SES-001...020; the agreed prefix table assigns SES to the academic Session.                    SES = Teaching Session. Former SES-001...020 are remapped to AUTH-101...120; the mapping table is in §51.2 so no source requirement is lost.                                                        §51.2

  C-3      Question Bank requirements used prefix QB; the agreed prefix table specifies QBN.                                                                    QBN adopted. QB-nnn → QBN-nnn, numbering preserved.                                                                                                                                                 §51.2

  C-4      Import/export material contains two requirements numbered STR-IMP-008.                                                                               The version-preservation rule keeps STR-IMP-008; the package-import rule is renumbered STR-IMP-013.                                                                                                 §17.6

  C-5      Role material lists four roles in the capability matrices; Admin is specified separately as a fifth.                                                 **Five roles**: Teacher, Assistant, Student, Parent, Admin. The four-role matrices are educational-domain matrices; Admin is added to every matrix in this document.                                §8

  C-6      Storage material offers Option A (students immediately get new file versions) and Option B (published content keeps its version) without deciding.   **Option B is adopted** and made binding --- published content is version-stable (GEN-015). Option A would silently change assessments students had already started.                                §17.5, §18.3
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 1.1 --- Source conflicts and their resolutions. Nothing was dropped; everything was reconciled.*

## 1.5 Change control

+-----------------------------------------------------------------------+
| **GEN-005 · No requirement changes silently**                         |
|                                                                       |
| identify affected requirement(s)                                      |
|                                                                       |
| → explain the change and its reason                                   |
|                                                                       |
| → trace dependencies: DB · API · permissions · UI · security          |
|                                                                       |
| analytics · notifications · testing · business rules                  |
|                                                                       |
| → update every affected section                                       |
|                                                                       |
| → update business rules and the permission matrix                     |
|                                                                       |
| → update acceptance criteria and traceability                         |
|                                                                       |
| → record in the change log (§51.4)                                    |
+=======================================================================+
+-----------------------------------------------------------------------+

## 1.6 Approval

  ------------------------------------------------------------------------------------------------------------------------------
  **Role**            **Name**           **Decision required**                                                      **Signed**
  ------------------- ------------------ -------------------------------------------------------------------------- ------------
  **Project Owner**   Miss Selvia        Accept the scope, the PROPOSED decisions (§50) and the V1 boundary (§49)   

  **PM / Engineer**   Moustafa Mahgoub   Confirm §34--§42 are buildable as specified                                

  **Testing / QA**    Ramzy Mohamed      Confirm every MUST maps to a verifiable acceptance criterion               
  ------------------------------------------------------------------------------------------------------------------------------

## 1.7 What changed in v1.1

v1.0 was audited section by section against its own stated decisions, its data model, its permission catalogue and its traceability chain. This pass **did not** reverse any decision marked CONFIRMED. It corrected internal contradictions, filled gaps the document's own structure already implied, and repaired broken cross-references. Every change is one of four kinds:

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Kind**                            **Count**   **Example**
  ------------------------------------ ----------- -----------------------------------------------------------------------------------------------------------------------------------------
  **Contradiction resolved**          3           Group/classroom cardinality (§9.2 vs §37.3.2); cross-tenant storage deduplication (§14.4 vs §37.3.4); duplicate ID BR-014 (§9.2 vs §30.1)
  **Broken cross-reference repaired** 14          Citations that pointed at the wrong requirement or the wrong open-decision entry (full list in Appendix E)
  **Gap closed with a new requirement** 12        SEC-012...015, ACT-009, STR-023, LDB-009, AUTH-127, ORG-009/010, CRS-009/010, GEN-029, BR-021, and an Academic Period subsection (§8.1)
  **Editorial correction**            2           Figure/illustration count in §24.4; duplicated retention table (§32.3 now references §44.3 instead of repeating it)
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 1.2 --- Amendment summary. The full itemised list, with rationale and affected sections for every change, is Appendix E (§52.5).*

# 2. Introduction, Purpose & Scope

## 2.1 Purpose of the product

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-001 · THE EDUCAPSULES PURPOSE**                                                                                                                                                                                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| EduCapsules exists to let **teachers teach their students in a safe environment**, **students learn in an organised environment**, and **parents monitor their children**. Every requirement in this document serves education, organisation, safety, privacy, security, controlled access, teacher authority, student learning, parent monitoring, delegated assistant support, protected educational content, and strong auditability. |
+==========================================================================================================================================================================================================================================================================================================================================================================================================================================+
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 2.2 Purpose of this document

This SRS is written to be built from. It defines what EduCapsules must do and the constraints under which it must operate, in enough detail that architects, backend, frontend, mobile/desktop, database, DevOps, security and QA engineers, designers and product managers can work from it without relying on undocumented assumptions.

## 2.3 Scope

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **In scope**                                                                                                                                                                                                                                                                                                                                              **Out of scope**
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  The EduCapsules platform: web application and the backend services behind it; the academic domain; activities and assessment; question bank; teacher storage and content protection; the five role experiences; communication; achievements and leaderboards; the early-release payment model; security, privacy, audit and legal-support requirements.   Native desktop and mobile applications (architecture must permit them --- §41); AI-generated content and AI tutoring; enterprise SSO; marketplace; external LMS/SIS integration; proctoring; advanced analytics. See §49.

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 2.4 Product goals

  -----------------------------------------------------------------------------------------------------------------------------------------------
  **\#**   **Goal**                                                        **How this document serves it**
  -------- --------------------------------------------------------------- ----------------------------------------------------------------------
  G-1      A teacher can run real classes end to end inside the platform   §10--§20 specify the full teaching chain; §22 the teacher experience

  G-2      No user can reach data they are not entitled to                 §9 authorization model; §31 security; §33 audit; §45 acceptance

  G-3      Course content is hard to steal, and theft is traceable         §19 content protection; §17 storage; §33 audit

  G-4      Delegation to assistants is safe and revocable                  §23 assistant delegation; §9.6 no amplification

  G-5      Parents see their own children and nothing else                 §24 parent experience; §9.5 relationship checks

  G-6      Nothing is stored twice when it can be referenced               §17 storage; §16 question bank

  G-7      Published content never changes underneath a student            GEN-015; §16.5; §18.3

  G-8      Every consequential action is attributable                      §33 audit; §12 grade history
  -----------------------------------------------------------------------------------------------------------------------------------------------

# 3. Definitions & Terminology

Terminology is a security control in this product: most of the source material\'s ambiguity came from two words used for two things. The vocabulary below is binding across UI, API, database, tests and this document (GEN-029).

## 3.1 Academic vocabulary

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Term**               **Definition**                                                                                                                                                                                                  **Answers**                        **Not**
  ---------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------- -------------------------
  **Organization**       Tenant boundary. A school, institute or independent teaching practice.                                                                                                                                          Whose platform is this?            A classroom

  **Classroom**          A broad student cohort or category --- "Grade 10", "Advanced Students", "2026 Intake", "English B1". May contain many Groups.                                                                                   Who are these students?            **Not** a physical room

  **Group**              A subdivision inside exactly one Classroom.                                                                                                                                                                     How do we divide them?             A classroom

  **Subject**            An academic discipline. Contains Courses.                                                                                                                                                                       Which discipline?                  A course

  **Course**             A structured teaching programme under a Subject. Contains Cycles.                                                                                                                                               Which programme?                   A subject

  **Cycle**              A time period or phase within a Course. Contains Topics.                                                                                                                                                        Which phase?                       A term

  **Topic**              The learning concept or unit.                                                                                                                                                                                   **What is being taught?**          A lesson time

  **Teaching Session**   A real teaching occurrence --- one lesson, delivered to a group at a time (Arabic: \*7essa\*). Carries attendance.                                                                                              **When is teaching happening?**    **Not** a login session

  **Activity**           Anything a student is expected to do, complete, submit or participate in. Homework, Quiz, Assignment, Exam, Exercise, Project, Discussion and Survey are Activity **types**, not separate top-level concepts.   **What does the student do?**      A topic

  **StudentActivity**    One student\'s state against one Activity: status, attempts, best score.                                                                                                                                        How is this student doing on it?   The Activity itself

  **Submission**         One attempt by one student at one Activity.                                                                                                                                                                     What did they hand in?             A grade
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 3.1 --- Academic vocabulary. Topic / Session / Activity are three different things and are never merged.*

## 3.2 The two meanings of "session" --- resolved

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **C-1 · CONFIRMED · BOTH CONCEPTS EXIST AND ARE NAMED APART**                                                                                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Teaching Session** (prefix SES) is an academic entity: a real lesson occurrence with attendance, materials and activities. **Login Session** (prefix AUTH) is a security entity: an authenticated period during which a user may interact with the platform. The bare word "session" is never used in this document, in the API, in the database, or in the UI. Database tables are teaching_session and auth_session. |
|                                                                                                                                                                                                                                                                                                                                                                                                                          |
| *This was the single largest source of ambiguity across the source material and it would have reached the schema if left unresolved.*                                                                                                                                                                                                                                                                                    |
+==========================================================================================================================================================================================================================================================================================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 3.3 Access-control vocabulary

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Term**                         **Definition**
  -------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Role**                         What kind of user this is: Teacher, Assistant, Student, Parent, Admin. Role alone authorises nothing.

  **Scope**                        The boundary within which a role or permission applies: Organization, Classroom, Group, Course, Cycle, or a combination.

  **Permission**                   An explicit named action, e.g. GRADE_HOMEWORK. The catalogue is closed: an action with no permission code cannot be performed.

  **Relationship**                 A verified link that grants access independently of role: Parent↔Student, Teacher↔Classroom, Assistant↔Assignment.

  **Entitlement**                  The right to access specific paid or restricted content, derived from a payment, subscription or grant. Separate from role and from permission.

  **Assistant Assignment**         The record that grants an Assistant a scope and a permission set, optionally time-bounded. Assistant access is \*always\* Assignment + Scope + Permissions.

  **Object-level authorization**   Verifying that the authenticated user may access \*this specific object\*, not merely objects of this kind.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 3.4 Storage & content vocabulary

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Term**                **Definition**
  ----------------------- -------------------------------------------------------------------------------------------------------------------------------------------
  **StorageObject**       The physical stored bytes, identified by content hash (SHA-256). Private, encrypted at rest, never publicly addressable.

  **File**                A Teacher\'s logical file: owner, organization, filename, type, status. Points at StorageObjects through versions.

  **FileVersion**         One version of a File, bound to one StorageObject.

  **FileReference**       A record of \*where a file is used\* --- attached to a Course, Topic, Teaching Session, or Activity, with its own visibility and purpose.

  **Teacher Storage**     The Teacher\'s private workspace. Separate from published content.

  **Published content**   Content a Teacher has explicitly attached and published to authorised students. Uploading is not publishing.

  **Content Gateway**     The service that issues short-lived, scoped, revocable access to protected content after all authorization checks pass.

  **Protection level**    0 Public · 1 Standard · 2 Protected · 3 Premium. Set per content reference, not globally.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 3.5 Acronyms

  ------------------------------------------------------------------------------------------------
  **RBAC**   Role-Based Access Control              IDOR    Insecure Direct Object Reference
  ---------- -------------------------------------- ------- --------------------------------------
  **BOLA**   Broken Object Level Authorization      MFA     Multi-Factor Authentication

  **DRM**    Digital Rights Management              HLS     HTTP Live Streaming

  **DASH**   Dynamic Adaptive Streaming over HTTP   TLS     Transport Layer Security

  **WAF**    Web Application Firewall               CSP     Content Security Policy

  **CSRF**   Cross-Site Request Forgery             XSS     Cross-Site Scripting

  **SSRF**   Server-Side Request Forgery            RPO     Recovery Point Objective

  **RTO**    Recovery Time Objective                WCAG    Web Content Accessibility Guidelines

  **SLA**    Service Level Agreement                QTI     Question & Test Interoperability
  ------------------------------------------------------------------------------------------------

# 4. Architectural Golden Rules

These are the invariants of EduCapsules. Every requirement in this document is consistent with them, and any future requirement that contradicts one of them is wrong until this section is deliberately changed. They are numbered GEN and are directly testable.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**    **Golden rule**                                                                                                                                               **Enforced in**
  --------- ------------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------
  GEN-001   This SRS is the single source of truth for EduCapsules.                                                                                                       §1

  GEN-002   Admin controls the platform. Teacher controls education. Assistant supports education. Student participates. Parent monitors.                                 §8, §21--§25

  GEN-003   The frontend is never a security boundary. Hiding a button is not authorization.                                                                              §9, §31, §40

  GEN-004   Backend authorization is authoritative and is evaluated on every protected operation.                                                                         §9

  GEN-005   No requirement, permission or business rule changes silently.                                                                                                 §1.5

  GEN-006   Assistant access = Assignment + Scope + Permissions. Being an Assistant grants nothing.                                                                       §23

  GEN-007   Parent access is based on a verified Parent↔Student relationship, never on knowing an ID.                                                                     §24

  GEN-008   Classroom = student cohort/category. Group = subdivision of exactly one Classroom.                                                                            §12

  GEN-009   Topic = what is taught.                                                                                                                                       §13

  GEN-010   Teaching Session = when teaching happens.                                                                                                                     §14

  GEN-011   Activity = what the student does.                                                                                                                             §15

  GEN-012   The Question Bank stores the question; the Activity stores the use of the question; the Submission stores the student\'s response.                            §16

  GEN-013   Storage stores physical objects; references connect them to educational entities.                                                                             §17

  GEN-014   Upload once → store once → reference everywhere → version when changed.                                                                                       §17

  GEN-015   Published content is version-stable: it never changes underneath a student.                                                                                   §16.5, §17.5, §18.3

  GEN-016   Access to a course ≠ access to the original course files.                                                                                                     §19

  GEN-017   Protected content is delivered through controlled, short-lived, revocable access.                                                                             §19

  GEN-018   Security-sensitive actions are auditable and attributable.                                                                                                    §33

  GEN-019   Tenant isolation is enforced at every layer.                                                                                                                  §11, §31

  GEN-020   Payment status never determines a user\'s educational role.                                                                                                   §27, §28

  GEN-021   Historical records remain attributable after an account is deactivated.                                                                                       §33, §43

  GEN-022   No control shall claim that screenshots or photography are impossible.                                                                                        §19.7

  GEN-023   Privacy is enforced by architecture, not only by policy.                                                                                                      §29

  GEN-024   Least privilege is the default; new resources start restrictive.                                                                                              §9, §31

  GEN-025   No user accesses a resource merely because they know or possess its identifier.                                                                               §9.7

  GEN-026   Correct answers, unreleased grades and private metadata never reach a client that is not entitled to them --- even if the interface would not display them.   §16.9, §19.10

  GEN-027   Deleting an account never silently destroys educational or audit history.                                                                                     §43

  GEN-028   Architecture is chosen for security, maintainability and cost --- not for novelty.                                                                            §35

  GEN-029   The vocabulary of §3 is binding and exclusive: a defined term is used consistently, and a bare "session" never appears, in the UI, the API, the schema, tests or this document.  §3
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 4.1 --- The twenty-nine golden rules. GEN-025 alone prevents a large class of serious vulnerabilities. GEN-029 added in v1.1 to make §3's terminology discipline independently testable (Appendix E).*

# 5. System Overview & Context

EduCapsules is a multi-role educational platform: a responsive web client and the backend services behind it, with private object storage, a protected content delivery path, and a single authorization core that every request passes through.

![](media/image2.png){width="6.5in" height="3.025157480314961in"}

*Figure 5.1 --- Five role experiences over one authorization core. The dashboards differ; the security decision does not.*

## 5.1 External context

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **External system**            **Purpose**                                        **V1**            **Notes**
  ------------------------------ -------------------------------------------------- ----------------- --------------------------------------------------------------
  Email delivery provider        Verification, password reset, notification email   MUST              Failure must not block the originating transaction (NOT-014)

  Edge / CDN / WAF provider      DNS, TLS, CDN, WAF, DDoS protection                MUST              Infrastructure, not an integration

  Object storage                 Private encrypted content storage                  MUST              Behind a storage interface (§41)

  Video processing / streaming   Transcoding, segmenting, encrypted delivery        SHOULD            Required before Level 3 video protection is claimed

  DRM licence service            Widevine · FairPlay · PlayReady                    **FUTURE**        Level 3 premium video

  Malware scanning               Upload quarantine and scanning                     MUST              §17.9

  Payment provider               ---                                                **WON\'T (V1)**   Early release is evidence-based (§27)

  SSO / identity provider        ---                                                **FUTURE**        §49
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 5.2 Client applications

V1 is a responsive web application. The backend security model shall not be coupled to any one client (GEN-004): every client --- web, Windows, macOS, Android, iOS --- is an equal consumer of the same authorised API. Native applications may add content protections the web cannot provide (§19.7), but never \*replace\* server-side decisions.

# 6. Actors & Roles

## 6.1 The five roles

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Role**        **Philosophy**                                                                    **Authority derives from**                                 **Never has**
  --------------- --------------------------------------------------------------------------------- ---------------------------------------------------------- ---------------------------------------------------------------------------------------------------
  **Teacher**     Teach + Manage + Create + Assess + Delegate. The primary educational authority.   Ownership / assigned educational scope + permissions       Admin authority; another Teacher\'s private storage; platform security or system configuration

  **Assistant**   Support Teacher + perform delegated educational tasks.                            Assistant Assignment + Scope + Permissions                 Anything not explicitly delegated; self-granted permissions; billing; ownership transfer

  **Student**     Learn + Participate.                                                              Classroom/Group membership + role + permissions            Another student\'s private data; any academic authority; grading; structure management

  **Parent**      Monitor + Communicate.                                                            Verified Parent↔Student relationship + role                Any write to academic records; unlinked students; child impersonation

  **Admin**       Govern + Operate + Secure + Support the platform.                                 Admin role + granular permissions + administrative scope   Automatic educational authority; unrestricted private data; silent access; audit-log modification
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 6.1 --- The five roles. The "never has" column is as binding as the rest.*

## 6.2 Cross-role capability matrix --- educational domain

Legend: **✔** allowed within own scope · **⚙** permission-dependent · **✖** not allowed · **---** not applicable.

  --------------------------------------------------------------------------------------------------------
  **Capability**              **Teacher**    **Assistant**   **Student**   **Parent**     **Admin**
  --------------------------- -------------- --------------- ------------- -------------- ----------------
  Manage academic structure   ✔              ⚙               ✖             ✖              Oversight ⚙

  Create activities           ✔              ⚙               ✖             ✖              ⚙

  Grade activities            ✔              ✔ ⚙             ✖             ✖              Exceptional ⚙

  Complete activities         ✖              ✖               ✔             ✖              ✖

  View own progress           ✔              ✔               ✔             ---            ✔

  View child\'s progress      ✖              ✖               ✖             ✔              ✖

  Manage achievements         ✔              ⚙               ✖             ✖              Oversight ⚙

  Earn achievements           ---            ---             ✔             ✖              ---

  View achievements           ✔              ✔               ✔             ✔              ⚙

  View leaderboard            ✔              ✔               ✔             ⚙              ⚙

  Communicate with students   ✔              ⚙               ⚙             ✖              ⚙

  Communicate with teachers   ---            ✔               ⚙             ⚙              ⚙

  Monitor child               ✖              ✖               ✖             ✔              ✖

  Manage students             ✔              ⚙               ✖             ✖              ⚙

  Manage billing              ⚙ payer only   ✖               ✖             ⚙ payer only   ⚙

  Teacher Storage             ✔ own          ⚙ shared only   ✖             ✖              Oversight only

  Platform administration     ✖              ✖               ✖             ✖              ✔

  Audit logs                  Own actions    Own actions     ✖             ✖              ⚙

  System configuration        ✖              ✖               ✖             ✖              Elevated ⚙
  --------------------------------------------------------------------------------------------------------

*Table 6.2 --- The consolidated capability matrix. §26 gives the authoritative per-permission matrix.*

# 7. Authorization Model

This is the section the rest of the document depends on. Wherever a requirement says "authorised", "within scope" or "permitted", it means precisely what is defined here.

## 7.1 The authorization decision

Every protected operation passes through the same eleven-stage decision. A valid login gets a user past stage 1 only; it decides nothing else.

![](media/image3.png){width="4.5in" height="5.1414468503937005in"}

*Figure 7.1 --- The authorization decision. A failure at any stage denies, fails safe, and is audited (SEC-001, GEN-004).*

## 7.2 Requirements

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                           **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **SEC-001**   Every protected operation shall evaluate identity, role, organization, scope, relationship, permission, target object, entitlement and resource state before executing.   **MUST**       System

  **SEC-002**   Authorization shall be enforced server-side. Client-side checks exist for usability only and carry no authority.                                                          **MUST**       System

  **SEC-003**   A valid authenticated Login Session shall not by itself grant access to any resource.                                                                                     **MUST**       System

  **SEC-004**   The system shall never accept a role, permission, scope, organization or user identity supplied by the client as proof of that attribute.                                 **MUST**       System

  **SEC-005**   Object-level authorization shall verify the caller\'s relationship to the specific target object, not merely to objects of that type.                                     **MUST**       System

  **SEC-006**   A permission grant shall never exceed the granting user\'s own permissions at that scope.                                                                                 **MUST**       System

  **SEC-007**   Permissions may carry an expiry; an expired grant shall be treated as absent without further action.                                                                      **MUST**       System

  **SEC-008**   New resources shall default to the most restrictive visibility consistent with their purpose.                                                                             **MUST**       System

  **SEC-009**   Denials shall not disclose whether the resource exists (§40.3).                                                                                                           **MUST**       System

  **SEC-010**   Every grant, modification, expiry and revocation of a role or permission shall be audited.                                                                                **MUST**       System
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 7.1 --- Core authorization requirements.*

## 7.3 Scope model

Scopes nest. A grant at a wider scope applies to everything inside it; a grant at a narrower scope never leaks outward. This is what lets one mechanism describe a head of department, a class teacher and a single-course assistant.

+-----------------------------------------------------------------------------------------+
| **SEC-011 · Scope containment**                                                         |
|                                                                                         |
| Organization widest --- platform / tenant administration                                |
|                                                                                         |
| └── Classroom a cohort                                                                  |
|                                                                                         |
| └── Group a subdivision of that Classroom                                               |
|                                                                                         |
| Subject                                                                                 |
|                                                                                         |
| └── Course                                                                              |
|                                                                                         |
| └── Cycle narrowest educational scope                                                   |
|                                                                                         |
| A grant at scope S applies to S and to every scope contained by S.                      |
|                                                                                         |
| It never applies to a parent or a sibling of S.                                         |
|                                                                                         |
| Cohort scopes (Classroom/Group) and content scopes (Course/Cycle) may be combined       |
|                                                                                         |
| in one Assistant Assignment --- the caller must satisfy every scope named on the grant. |
+=========================================================================================+
+-----------------------------------------------------------------------------------------+

## 7.4 Relationship-based authorization

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Relationship**               **Grants**                                                    **Verified how**                                       **Requirement**
  ------------------------------ ------------------------------------------------------------- ------------------------------------------------------ ------------------
  Parent → Student               Read access to that child\'s permitted academic information   ParentLink.status = ACTIVE, checked on every request   PAR-002, SEC-012

  Teacher → Classroom / Course   Educational authority within that scope                       Ownership or organization assignment                   TCH-028, SEC-013

  Assistant → Assignment         Exactly the delegated permissions within the assigned scope   AssistantAssignment active and not expired             AST-002, SEC-014

  Student → Classroom / Group    Access to content targeted at that membership                 ClassroomMembership / GroupMembership active           STU-002, SEC-015
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 7.2 --- Relationship-based authorization. SEC-012...015 (added in v1.1; previously cited in this table and in §46/§48 but never separately stated) are defined below.*

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                               **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- -----------
  **SEC-012**   The Parent → Student relationship shall be re-verified as ACTIVE on every request; a REQUESTED or REVOKED ParentLink shall grant nothing.                       **MUST**       System

  **SEC-013**   The Teacher → Classroom/Course relationship shall be re-verified on every request against ownership or an organization role assignment, never cached client-side. **MUST**    System

  **SEC-014**   The Assistant → Assignment relationship shall be re-verified on every request: the AssistantAssignment must be ACTIVE, unexpired, and the delegating Teacher must still hold the delegated permission in an equal-or-wider scope. **MUST**  System

  **SEC-015**   The Student → Classroom/Group relationship shall be re-verified on every request against an active ClassroomMembership or GroupMembership.                     **MUST**       System
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 7.3 --- Relationship re-verification requirements. Each closes the corresponding row of Table 7.2 against caching or stale-grant bypass.*

## 7.5 Entitlement

Entitlement is evaluated **after** authorization and answers a different question: not "may this user access things of this kind?" but "has this user paid for, or been granted, \*this\* content?" It is the check that expires when a subscription or session payment lapses (§28).

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                          **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------ -------------- -----------
  **SEC-016**   Access to protected content shall require a valid Entitlement in addition to role, scope, relationship and permission.   **MUST**       System

  **SEC-017**   An expired or revoked Entitlement shall deny new content access while leaving the student\'s academic history intact.    **MUST**       System

  **SEC-018**   Entitlement shall be evaluated server-side at the point of content delivery, not cached on the client.                   **MUST**       System
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------

## 7.6 No privilege amplification

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **SEC-006 · A GRANT CAN NEVER EXCEED THE GRANTER\'S OWN AUTHORITY**                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                                 |
| A Teacher may delegate GRADE_HOMEWORK on Group 1 only if the Teacher holds GRADE_HOMEWORK on Group 1. Permissions marked non-delegatable in §26.3 can never be passed on at all --- so an Assistant can never create another Assistant, expand their own scope, or become a Teacher or Admin. Delegation is therefore never an escalation path. |
+=================================================================================================================================================================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 7.7 The single most important security rule

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-025 · IDENTIFIER POSSESSION IS NOT AUTHORIZATION**                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                                         |
| **No user shall be able to access or modify a resource solely because they know or possess its identifier.** Every protected request shall be authorized according to the authenticated user\'s role, organizational membership, relationship to the resource, assigned scope and explicit permissions. |
|                                                                                                                                                                                                                                                                                                         |
| *This single principle prevents IDOR/BOLA --- the most likely serious vulnerability class in a platform of this shape, and the one that would expose student records.*                                                                                                                                  |
+=========================================================================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 8. Organization & Tenancy

The Organization is the tenant boundary. It may be a school, an institute, or an independent teaching practice operated by a single Teacher --- the model is the same in both cases.

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                    **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **ORG-001**   The system shall support Organizations as the tenant boundary for all scoped data.                                                                 **MUST**       System

  **ORG-002**   Every scoped record shall carry organization_id, and every query shall filter on it.                                                               **MUST**       System

  **ORG-003**   An Organization shall never be able to access another Organization\'s private data by any request shape.                                           **MUST**       System

  **ORG-004**   Tenant isolation shall be enforced at API authorization, scope validation, object authorization and query layers --- not by frontend filtering.    **MUST**       System

  **ORG-005**   The system shall support an Organization operated by a single independent Teacher without requiring an institutional structure.                    **MUST**       System

  **ORG-006**   Organization membership shall be an explicit record; it shall not be inferred from a Login Session.                                                **MUST**       System

  **ORG-007**   Authorized Admins shall manage Organization profile, membership, subscription, usage and settings according to administrative permission.          **MUST**       Admin

  **ORG-008**   A user may hold different roles in different Organizations; each request shall be evaluated against the Organization owning the target resource.   **SHOULD**     System

  **ORG-009**   Deactivating or closing an Organization shall follow a defined lifecycle (request → confirm → grace period → read-only → archived) and shall never cascade-delete its users, courses, content, grades or audit records; retention and erasure follow §44 exactly as for an individual account.   **MUST**   Admin

  **ORG-010**   Organization closure shall require Platform Owner or Super Admin authorization, a stated reason, and shall be fully audited; it shall not be reachable through an Organization-scoped Admin role alone.   **MUST**   Admin
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 8.1 --- Organization and tenancy requirements. ORG-009/010 added in v1.1: the Organization entity (§37.3.1) already promised "never a cascade delete... a lifecycle operation (§44)" but no requirement said what that lifecycle is (Appendix E).*

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-019 · TENANCY IS A DATA-MODEL PROPERTY, NOT A FILTER**                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                                                         |
| organization_id exists on every scoped table from the first migration and is part of every query predicate. Retrofitting tenancy onto a populated schema means touching every table, every query and every authorization check at once --- it is the single most expensive migration this product could face, and it costs almost nothing to avoid now. |
+=========================================================================================================================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 8.1 Academic Periods

*Added in v1.1.* AcademicPeriod (§37.3.2) is load-bearing --- Classroom, Enrollment, Course and the leaderboard/progress windows all bind to it, and Table 37.7 states "one active Classroom per student per AcademicPeriod" as an enforced cardinality rule --- but v1.0 defined no functional requirement for who creates, manages or closes one. This subsection closes that gap; it does not introduce a new concept, only specifies the one the data model already depended on.

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                               **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ---------
  **PER-001**   The system shall support AcademicPeriods scoped to an Organization, each with a name, start date, end date and status.                                        **MUST**       Admin

  **PER-002**   Authorized Admins, and Teachers where the Organization delegates it, shall create and manage AcademicPeriods.                                                 **MUST**       Admin

  **PER-003**   A Classroom, Course and Enrollment shall each belong to exactly one AcademicPeriod; a Student shall hold at most one active Classroom membership per AcademicPeriod (BR-015). **MUST**  System

  **PER-004**   AcademicPeriods shall not overlap within the same Organization unless the Organization explicitly supports concurrent periods (e.g. parallel tracks); the default is non-overlapping. **MUST**  System

  **PER-005**   Closing an AcademicPeriod shall not delete or hide any Classroom, Enrollment, grade, submission or attendance record created within it; historical data remains queryable by period.  **MUST**  System

  **PER-006**   Creating a new AcademicPeriod shall never modify or move records belonging to a prior one.                                                                     **MUST**       System
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 8.2 --- Academic Period requirements. Prefix PER, registered in Appendix A.*

# 9. Classroom & Group

Classroom answers \*who are these students\*. Group answers \*how do we divide them\*. These are different questions and are modelled separately (GEN-008).

![](media/image4.png){width="6.7in" height="4.51952646544182in"}

*Figure 9.1 --- The academic domain model: cohort, content, and time/action as three distinct trees.*

## 9.1 Definitions in force

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Concept**     **Rule**                                                                   **Example**
  --------------- -------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------
  **Classroom**   A broad student category or cohort. **Not** necessarily a physical room.   Grade 10 · Advanced Students · Computer Engineering · 2026 Intake · Summer Program · English B1

  **Group**       A subdivision inside exactly one Classroom.                                Grade 10 → Group A, Group B, Group C
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 9.2 Structural rules --- CONFIRMED

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Rule**                                                                                                                                                            **Priority**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------- --------------
  **CLS-001**   A Classroom may contain multiple Groups.                                                                                                                            **MUST**

  **GRP-001**   A Group belongs to exactly one Classroom.                                                                                                                           **MUST**

  **CLS-002**   A Student may belong to multiple Classrooms.                                                                                                                        **MUST**

  **CLS-003**   Classroom membership and Group membership are separate records with independent lifecycles.                                                                         **MUST**

  **GRP-002**   A Student may belong to a Classroom without currently belonging to any Group.                                                                                       **MUST**

  **CLS-004**   Students shall never be able to modify their own Classroom or Group membership.                                                                                     **MUST**

  **CLS-005**   Teachers shall manage Classrooms and Groups within their authorised scope.                                                                                          **MUST**

  **CLS-006**   Assistants shall manage only the Classrooms and Groups explicitly assigned to them.                                                                                 **MUST**

  **CLS-007**   Parents shall see Classroom and Group information only for their linked children.                                                                                   **MUST**

  **CLS-008**   Classroom-wide content shall be targetable to all Classroom members.                                                                                                **MUST**

  **GRP-003**   Group-specific content shall target only that Group\'s members.                                                                                                     **MUST**

  **CLS-009**   Membership records shall be dated (joined_at, left_at) and shall never be deleted; moving a student ends one membership and creates another.                        **MUST**

  **CLS-010**   Historical grades, submissions, achievements and points shall remain attached to the context in which they were earned when a Student changes Classroom or Group.   **MUST**
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 9.1 --- Classroom and Group rules. CLS-009/010 are what make a mid-term class change non-destructive.*

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **BR-015 · PROPOSED · WHAT A CLASSROOM OR GROUP CHANGE DOES AND DOES NOT DO** (renumbered from BR-014 in v1.1: BR-014 was already assigned to the payment revenue-share rule in §30.1 --- Appendix E)                                                                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                                                                                                         |
| Moving a Student ends the current membership with a left_at date and creates a new one. **Grades, submissions, point history and achievements are never moved, recalculated or deleted** --- they stay attached to the Activity and context in which they were earned. The Student\'s new Group leaderboard reflects points earned within that scope; the Student\'s total achievements are unaffected. |
|                                                                                                                                                                                                                                                                                                                                                                                                         |
| *Rejected: transferring records to the new Group. It corrupts both Groups\' analytics, makes the new Teacher appear to have graded work they never saw, and destroys the audit answer to "who gave this mark".*                                                                                                                                                                                         |
+=========================================================================================================================================================================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 10. Subject · Course · Cycle · Topic

This is the content tree. It is deliberately independent of the cohort tree in §9: content is authored once and delivered to whichever Classrooms, Groups or Students the Teacher targets (§15.4).

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                    **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ---------------
  **SUB-001**   The system shall support Subjects belonging to an Organization.                                                                                    **MUST**       Teacher/Admin

  **SUB-002**   A Subject may contain multiple Courses.                                                                                                            **MUST**       System

  **CRS-001**   The system shall support Courses belonging to exactly one Subject.                                                                                 **MUST**       Teacher

  **CRS-002**   Courses shall support draft, published and archived states with defined transitions.                                                               **MUST**       Teacher

  **CRS-003**   A Course shall record its authoring Teacher permanently.                                                                                           **MUST**       System

  **CYC-001**   A Course may contain multiple Cycles; a Cycle represents a time period or phase and shall have start and end dates.                                **MUST**       Teacher

  **CYC-002**   Cycles shall be ordered within their Course.                                                                                                       **MUST**       Teacher

  **TOP-001**   A Cycle may contain multiple Topics; a Topic is the learning concept being taught.                                                                 **MUST**       Teacher

  **TOP-002**   Topics shall be ordered within their Cycle.                                                                                                        **MUST**       Teacher

  **TOP-003**   A Topic may be referenced by many Teaching Sessions and by many Activities.                                                                        **MUST**       System

  **CRS-004**   Learning materials shall attach to Courses, Cycles, Topics, Teaching Sessions and Activities through FileReferences, never by duplicating files.   **MUST**       System

  **CRS-005**   Students and Parents shall never modify Teacher-owned content.                                                                                     **MUST**       System

  **CRS-006**   Archiving shall preserve all dependent Activities, submissions, grades and audit records.                                                          **MUST**       System

  **CRS-007**   A Course shall not be returned to draft once a Submission exists against any of its Activities; it may only be archived.                           **MUST**       System

  **CRS-008**   Publishing shall be an explicit action separate from creating or uploading.                                                                        **MUST**       Teacher

  **CRS-009**   The owning Teacher shall add or remove a co-teacher on a Course via a UserRoleAssignment scoped to that Course; a co-teacher's default permissions equal the owner's educational permissions in that scope but never include ownership transfer, co-teacher management, or Course deletion, which remain owner-only.   **MUST**   Teacher

  **CRS-010**   Every co-teacher grant, modification and removal shall be audited and visible to all current co-teachers of the Course.                                                                                                                                                                                                    **MUST**   System
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 10.1 --- Subject, Course, Cycle and Topic requirements. CRS-009/010 added in v1.1: the Course entity (§37.3.2) already modelled co-teachers via UserRoleAssignment, but no functional requirement described how one is granted, its default scope, or its limits (Appendix E).*

## 10.1 Content lifecycle

+-----------------------------------------------------------------------+
| **Course & content lifecycle**                                        |
|                                                                       |
| DRAFT ──publish──▶ PUBLISHED ──archive──▶ ARCHIVED                    |
|                                                                       |
| ▲ │ │                                                                 |
|                                                                       |
| └──unpublish──────────┘ │                                             |
|                                                                       |
| (only while no Submission exists --- CRS-007) │                       |
|                                                                       |
| ▼                                                                     |
|                                                                       |
| readable forever to those who studied it                              |
|                                                                       |
| (GEN-027 · no hard delete of academic history)                        |
+=======================================================================+
+-----------------------------------------------------------------------+

# 11. Teaching Sessions & Attendance

A Teaching Session is a first-class academic entity: a specific teaching occurrence where a Teacher or Assistant teaches a specific group of students during a defined time. It answers **when** (GEN-010) and it is where attendance lives.

![](media/image5.png){width="6.5in" height="3.025157480314961in"}

*Figure 11.1 --- The Teaching Session and what attaches to it.*

## 11.1 Requirements

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                       **Priority**   **Actor**
  ------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ---------------------
  **SES-001**   The system shall support Teaching Sessions as a distinct academic entity.                                                                                                                                             **MUST**       System

  **SES-002**   A Teaching Session shall record classroom, group, subject, course, cycle, topic(s), teacher, assistant(s), scheduled start/end, actual start/end, status, location and online-meeting information where applicable.   **MUST**       Teacher

  **SES-003**   Session status shall be one of SCHEDULED · ONGOING · COMPLETED · CANCELED · POSTPONED · RESCHEDULED.                                                                                                                  **MUST**       System

  **SES-004**   Recurring sessions shall generate individual Session records rather than a single recurring object.                                                                                                                   **MUST**       System

  **SES-005**   Authorized users shall schedule, reschedule, cancel, start and end Sessions within their scope.                                                                                                                       **MUST**       Teacher/Assistant ⚙

  **SES-006**   Sessions shall support attached materials through FileReferences.                                                                                                                                                     **MUST**       Teacher

  **SES-007**   Sessions shall support Teacher notes, visible according to configured visibility.                                                                                                                                     **MUST**       Teacher

  **SES-008**   Activities may originate from a Session; Session association shall be optional.                                                                                                                                       **MUST**       System

  **SES-009**   A Topic may span multiple Sessions and a Session may cover multiple Topics.                                                                                                                                           **MUST**       System

  **SES-010**   Sessions shall appear in the Teacher, Assistant, Student and Parent calendars according to scope and relationship.                                                                                                    **MUST**       System

  **SES-011**   The system shall maintain a Session event history recording material changes.                                                                                                                                         **MUST**       System

  **SES-012**   Attendance shall belong to exactly one Teaching Session.                                                                                                                                                              **MUST**       System

  **SES-013**   Attendance shall record student, state, who recorded it and when.                                                                                                                                                     **MUST**       System

  **SES-014**   Attendance shall be recordable only by an authorised Teacher, or an Assistant holding MANAGE_ATTENDANCE in the Session\'s scope.                                                                                      **MUST**       System

  **SES-015**   Attendance changes shall be auditable.                                                                                                                                                                                **MUST**       System

  **SES-016**   Students shall never record or modify their own attendance.                                                                                                                                                           **MUST**       System

  **SES-017**   Parents shall view attendance for linked children where the Organization enables it.                                                                                                                                  **SHOULD**     Parent
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 11.1 --- Teaching Session and attendance requirements.*

# 12. Activities

Activity is the general container for anything a student is expected to do, complete, submit or participate in. Homework, Quiz, Exam and the rest are **Activity types**, not separate top-level academic concepts (GEN-011). This is what keeps the data model, the permission model and the analytics from fragmenting.

## 12.1 Activity types

  --------------------------------------------------------------------------------------------------------------------------
  **Type**             **Purpose**                                                     **V1**       **Default grading**
  -------------------- --------------------------------------------------------------- ------------ ------------------------
  Homework             Work completed outside or after a lesson                        MUST         Manual / hybrid

  Quiz                 Short assessment                                                MUST         Automatic + manual

  Assignment           Structured student task                                         MUST         Manual

  Exam                 Formal assessment, stricter controls                            MUST         Automatic + manual

  Exercise             Practice; may be ungraded                                       MUST         Ungraded / automatic

  Project              Larger multi-step task, milestones, optionally group            MUST         Manual + rubric

  Discussion           Structured student participation and replies                    MUST         Manual / participation

  Survey               Collect responses; optionally anonymous                         MUST         Ungraded

  Reading              Required reading with completion criteria                       **FUTURE**   Completion

  Video Activity       Watch with completion tracking and in-video questions           **FUTURE**   Completion / automatic

  Presentation         Student creates and presents                                    **FUTURE**   Manual + rubric

  Practical Activity   Lab or hands-on work                                            **FUTURE**   Manual + rubric

  Custom Activity      Teacher-defined type with configurable submission and grading   **FUTURE**   Configurable
  --------------------------------------------------------------------------------------------------------------------------

*Table 12.1 --- Activity types. V1 builds the first eight; the remaining five are additions to the same Activity entity, not new entities.*

## 12.2 Universal activity structure

+---------------------------------------------------------------------------+
| **ACT-001 · Every Activity type shares one base structure**               |
|                                                                           |
| Activity = Identity · Academic context · Target · Schedule · Instructions |
|                                                                           |
| Materials · Questions/Tasks · Submission config · Grading                 |
|                                                                           |
| Feedback · Visibility · Attempts · Status · History                       |
|                                                                           |
| Academic context: Subject → Course → Cycle → Topic → \[Teaching Session\] |
|                                                                           |
| (Session association is OPTIONAL --- SES-008)                             |
+===========================================================================+
+---------------------------------------------------------------------------+

## 12.3 Lifecycle

![](media/image6.png){width="6.7in" height="3.279580052493438in"}

*Figure 12.1 --- Activity lifecycle and the separate per-student state. The definition and the student\'s state are different records (ACT-024).*

## 12.4 Targeting --- the rule that prevents accidental disclosure

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **ACT-012 · AN ACTIVITY IS DELIVERED TO AN EXPLICIT TARGET, NEVER TO "EVERYONE"**                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                                                          |
| An Activity shall specify its recipients as one or more of: the entire Classroom, specific Groups, or specific Students. **The system shall never assume that every student in a Teacher\'s account automatically receives an Activity.** The resolved recipient set shall be recorded on the Activity so that later membership changes do not silently rewrite history. |
+==========================================================================================================================================================================================================================================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 12.5 Requirements

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                               **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ---------------------
  **ACT-001**   The system shall provide Activity as a generic educational task entity with a shared base structure across all types.                                         **MUST**       System

  **ACT-002**   The system shall support the Activity types marked V1 in §12.1.                                                                                               **MUST**       System

  **ACT-009**   An Activity with no resolved ActivityTarget shall not transition to OPEN (Table 45.1); it has no recipient and therefore cannot be attempted.                 **MUST**       System

  **ACT-011**   Activities shall associate with Classroom, Group, Course, Cycle, Topic and Teaching Session as applicable.                                                    **MUST**       Teacher

  **ACT-012**   Authorized users shall target Activities to a Classroom, specific Groups, or specific Students.                                                               **MUST**       Teacher/Assistant ⚙

  **ACT-013**   Activities shall support publication and visibility controls (PRIVATE · TEACHER_ONLY · SCHEDULED · PUBLISHED · STUDENTS · STUDENTS_AND_PARENTS · ARCHIVED).   **MUST**       Teacher

  **ACT-014**   Activities shall support publish, start, due and close dates and a time limit where applicable.                                                               **MUST**       Teacher

  **ACT-016**   Activities shall support configurable submission types (TEXT · FILE · MULTIPLE_FILES · LINK · IMAGE · VIDEO).                                                 **MUST**       Teacher

  **ACT-017**   Activities shall support configurable attempt limits.                                                                                                         **MUST**       Teacher

  **ACT-018**   Activities shall support late-submission policy: allowed, not allowed, allowed until a date, with optional penalty, and manual acceptance.                    **MUST**       Teacher

  **ACT-019**   The system shall support automatic grading for objectively gradable question types.                                                                           **MUST**       System

  **ACT-020**   The system shall support manual grading.                                                                                                                      **MUST**       Teacher/Assistant ⚙

  **ACT-021**   The system shall support hybrid grading within a single Activity.                                                                                             **MUST**       System

  **ACT-022**   The system shall support rubrics where applicable, and shall attach rubric results to the submission.                                                         **MUST**       Teacher

  **ACT-023**   Authorized users shall provide written feedback, and file or media feedback where supported.                                                                  **MUST**       Teacher/Assistant ⚙

  **ACT-024**   Student submissions shall be maintained separately from Activity definitions.                                                                                 **MUST**       System

  **ACT-025**   The system shall retain every submission attempt; a new attempt shall never overwrite a previous one.                                                         **MUST**       System

  **ACT-026**   Authorized Teachers and Assistants shall access Activity analytics for their scope.                                                                           **MUST**       Teacher/Assistant ⚙

  **ACT-027**   The system shall notify relevant users of Activity events per §30.                                                                                            **MUST**       System

  **ACT-028**   Activities shall be able to trigger achievements where configured.                                                                                            **MUST**       System

  **ACT-029**   Students shall access only Activities targeted at them or at a membership they hold.                                                                          **MUST**       System

  **ACT-030**   Parents shall view only Activity information for linked children and only at the permitted visibility.                                                        **MUST**       System

  **ACT-031**   Assistants shall manage Activities only within their delegated permissions and scope.                                                                         **MUST**       System

  **ACT-032**   Activity history shall be preserved after completion, grading, closure or archival.                                                                           **MUST**       System

  **ACT-033**   The system shall prevent unauthorized modification of Activity definitions, submissions and grades.                                                           **MUST**       System

  **ACT-034**   The system shall record on-time or late status at submission, computed server-side from the server clock --- never from a client-supplied timestamp.          **MUST**       System

  **ACT-035**   A failed submission shall preserve the student\'s work; no user action shall result in silently lost work.                                                    **MUST**       System

  **ACT-036**   Where multiple attempts are allowed, the Teacher shall configure the final grade as highest, latest, average, or Teacher-selected.                            **MUST**       Teacher
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 12.2 --- Activity requirements.*

## 12.6 Student activity states

  --------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Activity status (definition)**                                                   **StudentActivity status (per student)**
  ---------------------------------------------------------------------------------- ---------------------------------------------------------------------------
  **DRAFT · SCHEDULED · PUBLISHED · OPEN · CLOSED · GRADED · ARCHIVED · CANCELED**   NOT_STARTED · IN_PROGRESS · SUBMITTED · LATE · GRADED · RETURNED · MISSED

  --------------------------------------------------------------------------------------------------------------------------------------------------------------

# 13. Question Bank

The Question Bank is a core reusable system for creating, storing, organising, reusing and managing questions across Quizzes, Exams, Homework, Exercises and other Activities.

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-012 · THE QUESTION BANK GOLDEN RULE**                                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                                    |
| **Create a question once → store it once → reuse it everywhere.** The Question Bank stores the question. The Activity stores the \*use\* of the question. The Submission stores the student\'s response. These three are separate records, which is what makes reuse, versioning, analytics, import/export and randomised selection all tractable. |
+====================================================================================================================================================================================================================================================================================================================================================+
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

![](media/image7.png){width="6.6in" height="3.4867924321959753in"}

*Figure 13.1 --- Question reuse and version pinning. Editing a question never changes an activity that has already been published.*

## 13.1 Question types

  -----------------------------------------------------------------------------------------------------
  **Type**                       **Grading**   **V1**   **Type**        **Grading**        **V1**
  ------------------------------ ------------- -------- --------------- ------------------ ------------
  Multiple choice                Automatic     MUST     Matching        Automatic          SHOULD

  Multiple select                Automatic     MUST     Ordering        Automatic          SHOULD

  True / False                   Automatic     MUST     Image-based     Automatic/manual   SHOULD

  Short answer                   Automatic     MUST     Audio-based     Automatic/manual   **FUTURE**

  Long answer / essay            Manual        MUST     Video-based     Manual             **FUTURE**

  Numerical (tolerance, units)   Automatic     MUST     Code question   Automatic          **FUTURE**

  Fill in the blank              Automatic     MUST                                        
  -----------------------------------------------------------------------------------------------------

*Table 13.1 --- Question types. Code questions require a secure execution environment and are FUTURE.*

## 13.2 Question structure

  ----------------------------------------------------------------------------------------------------------------------------------------------
  **Group**            **Fields**
  -------------------- -------------------------------------------------------------------------------------------------------------------------
  **Identity**         Question ID (unique, immutable, stable across edits), owner, organization

  **Classification**   Type · Subject · Course · Cycle · Topic · learning objective(s) · tags · difficulty

  **Content**          Rich text · mathematics (stored as LaTeX/MathML, **not** as a screenshot) · images · tables · code · media

  **Answers**          Answer options with position, correctness, per-answer feedback and score value

  **Assessment**       Default points · estimated time · explanation with configurable reveal timing

  **Governance**       Status (DRAFT · READY · PUBLISHED · ARCHIVED) · visibility (PRIVATE · SHARED · ORGANIZATION) · versions · usage history
  ----------------------------------------------------------------------------------------------------------------------------------------------

## 13.3 Requirements

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                   **Priority**   **Actor**
  ------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **QBN-001**   The system shall provide a Question Bank for authorized educational staff.                                                                                        **MUST**       Teacher

  **QBN-002**   Each question shall have a unique immutable identifier that remains stable when the question is edited.                                                           **MUST**       System

  **QBN-003**   The system shall support the question types marked V1 in §13.1.                                                                                                   **MUST**       System

  **QBN-014**   The system shall support question difficulty classification.                                                                                                      **MUST**       Teacher

  **QBN-015**   The system shall support academic classification by Subject, Course, Cycle and Topic.                                                                             **MUST**       Teacher

  **QBN-016**   The system shall support custom tags.                                                                                                                             **MUST**       Teacher

  **QBN-017**   The system shall support learning-objective association.                                                                                                          **SHOULD**     Teacher

  **QBN-018**   The system shall support question explanations with configurable reveal timing (always hidden · after submission · after grading · after close · teacher only).   **MUST**       Teacher

  **QBN-019**   The system shall support default points and estimated completion time.                                                                                            **MUST**       Teacher

  **QBN-020**   The system shall support question collections containing references, not copies.                                                                                  **MUST**       Teacher

  **QBN-021**   The system shall allow a question to be reused across multiple Activities.                                                                                        **MUST**       Teacher

  **QBN-022**   Reusing a question shall not create a duplicate question record.                                                                                                  **MUST**       System

  **QBN-023**   The system shall support intentional duplication, which mints a new Question ID.                                                                                  **MUST**       Teacher

  **QBN-024**   The system shall support question versioning.                                                                                                                     **MUST**       System

  **QBN-025**   A published Activity shall preserve the exact question version used at publication.                                                                               **MUST**       System

  **QBN-026**   The system shall support Question Pools.                                                                                                                          **MUST**       Teacher

  **QBN-027**   The system shall support random selection from pools, including per-difficulty quotas.                                                                            **MUST**       Teacher

  **QBN-028**   The system shall support search and filtering across all classification fields.                                                                                   **MUST**       Teacher

  **QBN-029**   The system shall support question import (EduCapsules package · CSV · Excel · JSON; QTI-compatible formats where supported).                                      **MUST**       Teacher ⚙

  **QBN-030**   The system shall support question export.                                                                                                                         **MUST**       Teacher ⚙

  **QBN-031**   The system shall perform duplicate detection during import.                                                                                                       **MUST**       System

  **QBN-032**   The system shall never automatically merge questions solely because they appear similar.                                                                          **MUST**       System

  **QBN-033**   The system shall maintain question usage history.                                                                                                                 **MUST**       System

  **QBN-034**   The system shall provide question-performance analytics to authorized users.                                                                                      **SHOULD**     Teacher

  **QBN-035**   The system shall support Teacher-owned and Organization-owned Question Banks.                                                                                     **MUST**       System

  **QBN-036**   The system shall support controlled sharing of questions with named Teachers or Assistants.                                                                       **SHOULD**     Teacher

  **QBN-037**   Assistants shall access the Question Bank only per delegated permissions and scope.                                                                               **MUST**       System

  **QBN-038**   Students shall have no direct access to any Question Bank.                                                                                                        **MUST**       System

  **QBN-039**   Correct answers and internal question metadata shall never be transmitted to a student client before the Activity permits their release.                          **MUST**       System

  **QBN-040**   Parents shall have no direct access to any Question Bank.                                                                                                         **MUST**       System

  **QBN-041**   Question Bank authorization shall be enforced server-side.                                                                                                        **MUST**       System

  **QBN-042**   Question Bank operations shall be auditable where they affect published assessments.                                                                              **MUST**       System
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 13.2 --- Question Bank requirements.*

## 13.4 What a student never receives

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-026 / QBN-039 · THE ANSWER KEY NEVER LEAVES THE SERVER**                                                                                                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| A student client shall never receive: answer keys, correct-answer flags, teacher notes, internal tags, hidden difficulty metadata, unpublished or future questions, other Teachers\' questions, or Question Bank identifiers where unnecessary. It is not sufficient that the interface does not display them --- they must not be in the response at all. This is a network-inspection-level requirement and is tested as such (TC-011). |
+===========================================================================================================================================================================================================================================================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 13.5 Duplicate detection

Import and upload duplicate detection may use similarity signals, but the system shall present options (use existing · create new anyway · compare · cancel) and shall never merge automatically (QBN-031, QBN-032). Filename or question text alone is never treated as identity.

# 14. Teacher Storage

Teacher Storage is a **private** workspace inside the platform. It is not course content and it is not visible to students. The Teacher owns and manages their educational workspace; EduCapsules controls the infrastructure, security, access and delivery of what is stored there.

+--------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-014 · THE STORAGE GOLDEN RULE**                                                                                                            |
|                                                                                                                                                  |
| **Upload once → store once → reference everywhere → version when changed → export without unnecessary duplication → import with deduplication.** |
+==================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------+

## 14.1 The three-layer model

![](media/image8.png){width="6.7in" height="3.7381102362204723in"}

*Figure 14.1 --- StorageObject (bytes) · File + FileVersion (the Teacher\'s logical file) · FileReference (where it is used). One physical object serves many educational resources.*

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Layer**                **Identity**               **Owned by**                     **Purpose**
  ------------------------ -------------------------- -------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------
  **StorageObject**        SHA-256 content hash       The platform                     The physical encrypted bytes. Private, never publicly addressable. May be shared internally between tenants --- invisibly.

  **File / FileVersion**   File ID + version number   The Teacher (and Organization)   The logical file the Teacher sees, names, versions, organises and owns.

  **FileReference**        Reference ID               The educational entity           Where the file is \*used\* --- a Course, Topic, Teaching Session, Homework or Quiz --- with its own purpose, visibility and content policy.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 14.1 --- Separating these three is what makes deduplication, versioning and content protection all possible without breaking ownership.*

## 14.2 Storage areas

+-----------------------------------------------------------------------+
| **STR-016 · The Teacher\'s storage structure**                        |
|                                                                       |
| Teacher Storage                                                       |
|                                                                       |
| ├── My Files private personal files                                   |
|                                                                       |
| ├── Courses organised by Subject → Course → Cycle → Topic             |
|                                                                       |
| ├── Homework Materials                                                |
|                                                                       |
| ├── Quiz Materials                                                    |
|                                                                       |
| ├── Resources                                                         |
|                                                                       |
| ├── Shared with Assistants explicitly shared, per-permission          |
|                                                                       |
| ├── Archive retained, not offered to students                         |
|                                                                       |
| └── Trash recoverable before purge                                    |
+=======================================================================+
+-----------------------------------------------------------------------+

## 14.3 Core storage requirements

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **STR-001**   The system shall provide each Teacher with logically isolated private storage.                                                                                                                                 **MUST**       System

  **STR-002**   Teacher Storage shall not be publicly accessible by default.                                                                                                                                                   **MUST**       System

  **STR-003**   The system shall enforce server-side authorization for every storage operation.                                                                                                                                **MUST**       System

  **STR-004**   Students shall have no direct access to Teacher Storage.                                                                                                                                                       **MUST**       System

  **STR-005**   Parents shall have no direct access to Teacher Storage.                                                                                                                                                        **MUST**       System

  **STR-006**   Assistants shall access Teacher Storage only where explicitly shared, and only with the granted operations (view · upload · edit · delete · share · publish · download).                                       **MUST**       System

  **STR-007**   Uploaded files shall undergo validation of size, declared MIME type, extension and file signature, and shall be malware-scanned before becoming available.                                                     **MUST**       System

  **STR-008**   Protected files shall be encrypted at rest.                                                                                                                                                                    **MUST**       System

  **STR-009**   Protected content shall be delivered through authorized content-delivery mechanisms, never through permanent public URLs.                                                                                      **MUST**       System

  **STR-010**   The system shall maintain file metadata, ownership and content hash.                                                                                                                                           **MUST**       System

  **STR-011**   The system shall support configurable per-plan storage quotas.                                                                                                                                                 **MUST**       System

  **STR-012**   Deleted files shall go to Trash and be recoverable for a defined retention period before purge.                                                                                                                **MUST**       System

  **STR-013**   The system shall maintain version history where versioning is enabled.                                                                                                                                         **MUST**       System

  **STR-014**   Security-sensitive storage operations shall be logged: upload · download · delete · restore · rename · move · share · permission change · publish · unpublish · version change.                                **MUST**       System

  **STR-015**   A user shall not be able to access another user\'s storage by manipulating file identifiers.                                                                                                                   **MUST**       System

  **STR-016**   Teachers shall organise storage with folders, search, filter, sort, tags, favourites and preview.                                                                                                              **MUST**       Teacher

  **STR-017**   The system shall warn before deleting a file that is currently referenced, stating how many educational resources reference it.                                                                                **MUST**       System

  **STR-018**   Reaching a storage quota shall block new uploads but shall never break students\' access to already-published content.                                                                                         **MUST**       System

  **STR-019**   The system shall notify the Teacher at defined quota thresholds.                                                                                                                                               **SHOULD**     System

  **STR-020**   Teachers shall download their own original files; downloads shall be authenticated and logged.                                                                                                                 **MUST**       Teacher

  **STR-021**   External sharing shall be configurable and, where enabled, shall use expiring, revocable links with optional password and download restrictions. Protected course content shall not be externally shareable.   **SHOULD**     Teacher

  **STR-022**   Large files shall be stored in object storage, not in the relational database; the database shall hold metadata and references.                                                                                **MUST**       System

  **STR-023**   A File with one or more live FileReferences shall not be purged; it may be trashed, but purge is blocked until every reference is removed. STR-017's warning is presentational; this is the enforced guard behind it. **MUST**  System
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 14.2 --- Teacher Storage requirements. STR-023 added in v1.1: Table 37.5 and Table 45.3 already stated this as an enforced rule under a mis-cited ID (Appendix E).*

## 14.4 Import, reference and deduplication

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**            **Requirement**                                                                                                                      **Priority**   **Actor**
  ----------------- ------------------------------------------------------------------------------------------------------------------------------------ -------------- ---------------------
  **STR-IMP-001**   Authorized users shall attach existing Storage files to educational entities without creating physical copies.                       **MUST**       Teacher/Assistant ⚙

  **STR-IMP-002**   The system shall distinguish physical Storage objects from logical file references.                                                  **MUST**       System

  **STR-IMP-003**   One Storage file shall be attachable to multiple Courses, Topics, Teaching Sessions and Activities.                                  **MUST**       System

  **STR-IMP-004**   Duplicate detection shall use content-based identification (SHA-256) together with file size.                                        **MUST**       System

  **STR-IMP-005**   Filename shall never be used alone as the duplicate criterion --- the same name may be a completely different file.                  **MUST**       System

  **STR-IMP-006**   When an identical file is uploaded, the system shall offer to reuse the existing accessible file or to store it as a new version.    **MUST**       System

  **STR-IMP-007**   Versioning shall not duplicate identical versions.                                                                                   **MUST**       System

  **STR-IMP-008**   Published content shall preserve its published version when the source file is subsequently updated.                                 **MUST**       System

  **STR-IMP-011**   Logical ownership and authorization boundaries shall be preserved when storage objects are deduplicated internally.                  **MUST**       System

  **STR-IMP-012**   Deduplication shall never reveal the existence or metadata of another user\'s private file.                                          **MUST**       System

  **STR-IMP-013**   The system shall support importing previously exported EduCapsules content packages.                                                 **MUST**       Teacher ⚙

  **STR-IMP-009**   Imported files shall be compared against accessible existing files before creating new physical copies.                              **MUST**       System

  **STR-IMP-010**   The system shall never automatically overwrite an existing file when an imported file has the same filename but different content.   **MUST**       System

  **STR-EXP-001**   Authorized users shall export Storage files.                                                                                         **MUST**       Teacher ⚙

  **STR-EXP-002**   Authorized users shall export folders and supported content collections.                                                             **SHOULD**     Teacher ⚙

  **STR-EXP-003**   Course exports shall not include multiple physical copies of the same file when several references point to it.                      **MUST**       System

  **STR-EXP-004**   Exports shall preserve relationships between educational entities and files.                                                         **MUST**       System

  **STR-EXP-005**   Export packages shall include a manifest sufficient to reconstruct file references on import.                                        **MUST**       System
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 14.3 --- Import, export, reference and deduplication requirements.*

+-----------------------------------------------------------------------+
| **STR-EXP-003 · Reference-preserving export, not naive duplication**  |
|                                                                       |
| Export/                                                               |
|                                                                       |
| ├── files/                                                            |
|                                                                       |
| │ └── F-10291_Algebra.pdf ONE physical copy                           |
|                                                                       |
| └── manifest.json                                                     |
|                                                                       |
| Topic 1 → files/F-10291_Algebra.pdf                                   |
|                                                                       |
| Topic 2 → files/F-10291_Algebra.pdf                                   |
|                                                                       |
| Session 1 → files/F-10291_Algebra.pdf                                 |
|                                                                       |
| Homework → files/F-10291_Algebra.pdf                                  |
+=======================================================================+
+-----------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **STR-IMP-011/012 · PROPOSED · CROSS-TENANT DEDUPLICATION IS INVISIBLE**                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Physical deduplication may occur at the storage-object layer across tenants, so that two Teachers holding the same file consume one object. Each Teacher still has their own File record, ownership and references, and deleting one Teacher\'s File never deletes the object while another reference exists. **The system shall never say "this file already exists" when the match is in another user\'s storage** --- duplicate checks are performed only within the requesting user\'s accessible storage. |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| *Rejected: naive per-user physical copies (expensive), and cross-user duplicate messages (leaks the existence of another user\'s private file).*                                                                                                                                                                                                                                                                                                                                                               |
+================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================+
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 15. Content Publishing

Uploading is not publishing. The gap between the two is a deliberate security boundary.

+-----------------------------------------------------------------------+
| **CNT-001 · The publishing pipeline**                                 |
|                                                                       |
| Teacher Storage (private)                                             |
|                                                                       |
| ↓ select file                                                         |
|                                                                       |
| Attach to Course / Cycle / Topic / Session / Activity → FileReference |
|                                                                       |
| ↓ configure visibility and content policy                             |
|                                                                       |
| PUBLISH (explicit action)                                             |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| Protected content delivery (§16)                                      |
|                                                                       |
| ↓                                                                     |
|                                                                       |
| Authorized students only                                              |
+=======================================================================+
+-----------------------------------------------------------------------+

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                           **Priority**   **Actor**
  ------------- ----------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **CNT-001**   Uploading a file shall not make it visible to any student; publication shall be an explicit, separate action.                             **MUST**       System

  **CNT-002**   Publication shall create or update a FileReference with an explicit visibility and content policy.                                        **MUST**       System

  **CNT-003**   Draft content shall be visible only to its owner and to explicitly authorised staff.                                                      **MUST**       System

  **CNT-004**   Published references shall pin the file version published (GEN-015).                                                                      **MUST**       System

  **CNT-005**   Unpublishing shall remove student access without deleting the file or its history.                                                        **MUST**       Teacher

  **CNT-006**   Content policy shall be set per reference, not globally: view · download · print · copy · share.                                          **MUST**       Teacher

  **CNT-007**   Archived content shall remain accessible to its owner and to those who already studied it, and shall not be offered for new assignment.   **MUST**       System
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 15.1 --- Publishing requirements.*

# 16. Content Protection

This is a major EduCapsules requirement and it is stated honestly. The goal is **not** to make copying technically impossible --- for content a human can see, that is unachievable. The goal is that unauthorized extraction is difficult, detectable, traceable and economically unattractive.

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-016 · THE CENTRAL CONTENT-PROTECTION PRINCIPLE**                                                                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                                                                              |
| **Access to a course ≠ access to the original course files.** A student never receives the original stored asset merely because they are logged in and enrolled. They receive a protected rendering or an encrypted stream, delivered through the Content Gateway after every authorization, entitlement, policy and abuse check has passed. |
+==============================================================================================================================================================================================================================================================================================================================================+
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 16.1 The delivery pipeline

![](media/image9.png){width="5.6in" height="5.6in"}

*Figure 16.1 --- The content protection pipeline and the four protection levels.*

## 16.2 Protection levels

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Level**         **Applies to**                 **Controls**                                                                                                                               **Example content**
  ----------------- ------------------------------ ------------------------------------------------------------------------------------------------------------------------------------------ -------------------------------------------------
  **0 Public**      Deliberately public material   None beyond normal web serving                                                                                                             Public course introduction, marketing page

  **1 Standard**    Authenticated users            Login required; no public URL                                                                                                              General course information

  **2 Protected**   Normal course content          No public URLs · short-lived scoped access · dynamic watermark · access logging · rate limiting                                            Course PDF, worksheet, lesson notes

  **3 Premium**     High-value paid content        Level 2 + encryption · DRM where applicable · strict entitlement · device/session controls · concurrent-playback limits · detailed audit   Paid course PDF, recorded lecture, exam content
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 16.1 --- Protection is set per content reference. A course may mix levels.*

## 16.3 Requirements

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                   **Priority**   **Actor**
  ------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **CNT-010**   No course content shall be publicly accessible unless explicitly designated Level 0.                                                                              **MUST**       System

  **CNT-011**   Every content request shall undergo server-side authentication, authorization, entitlement and content-policy evaluation.                                         **MUST**       System

  **CNT-012**   Students shall never receive permanent unrestricted URLs to protected assets.                                                                                     **MUST**       System

  **CNT-013**   Protected content shall be delivered through short-lived, scoped, cryptographically random, revocable access.                                                     **MUST**       System

  **CNT-014**   Protected documents shall be delivered through a protected viewer that renders content rather than serving the original file.                                     **MUST**       System

  **CNT-015**   Protected content shall carry a dynamic watermark identifying user, content, session and time where practical.                                                    **MUST**       System

  **CNT-016**   Protected video shall be delivered as encrypted segmented streams (HLS and/or DASH), not as direct file URLs.                                                     **MUST**       System

  **CNT-017**   Level 3 video shall use DRM where the client platform supports it.                                                                                                **SHOULD**     System

  **CNT-018**   Protected course content shall never be embedded in client-side code or configuration.                                                                            **MUST**       System

  **CNT-019**   The system shall rate-limit content requests per user, per resource and per session.                                                                              **MUST**       System

  **CNT-020**   The system shall detect and respond to bulk-extraction and scraping patterns.                                                                                     **MUST**       System

  **CNT-021**   The system shall support concurrent-session and concurrent-playback limits, configurable per plan and per protection level.                                       **SHOULD**     System

  **CNT-022**   Content access shall be logged with user, content, action, device, session and timestamp.                                                                         **MUST**       System

  **CNT-023**   A protected content link shared with an unentitled user shall grant no access.                                                                                    **MUST**       System

  **CNT-024**   Detected extraction abuse shall raise a Security Event, and may revoke content tokens, apply rate limits, require re-authentication or restrict content access.   **MUST**       System

  **CNT-025**   Automated abuse controls shall use thresholds and multiple signals; a single unusual request shall not block a legitimate user.                                   **MUST**       System

  **CNT-026**   Assistants shall access only the Teacher content explicitly shared with them; an Assistant shall not be able to bulk-download a Teacher\'s course library.        **MUST**       System

  **CNT-027**   Students shall have no native "share course content" function unless the Teacher explicitly enables it for that content.                                          **MUST**       System

  **CNT-028**   Content ownership, organization, protection policy and modification history shall be recorded for every protected asset.                                          **MUST**       System
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 16.2 --- Content protection requirements.*

## 16.4 Screenshots and screen recording --- stated honestly

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-022 · WHAT THE PLATFORM MUST NOT CLAIM**                                                                                                                                                                                                                                                                                                   |
|                                                                                                                                                                                                                                                                                                                                                  |
| On ordinary web browsers, screenshots and screen recording **cannot** be reliably prevented, and no EduCapsules requirement, marketing statement or legal document shall claim otherwise. Copy-blocking, context-menu suppression and DevTools-blocking are **deterrents, not security boundaries**, and shall never be relied on as protection. |
|                                                                                                                                                                                                                                                                                                                                                  |
| *The enforceable version of the requirement is CNT-029 below.*                                                                                                                                                                                                                                                                                   |
+==================================================================================================================================================================================================================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                                                                                                                                                                                     **Priority**   **Actor**
  ------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- -----------
  **CNT-029**   On supported native platforms the system shall restrict screenshot and screen-recording capability for Level 3 content using operating-system controls where available. On platforms where prevention is not technically possible, the system shall rely on DRM, dynamic watermarking, access control, entitlement and monitoring to deter, trace and limit unauthorized capture.   **MUST**       System

  **CNT-030**   Highly protected content may be designated native-application-only where the Organization requires stronger capture protection.                                                                                                                                                                                                                                                     **SHOULD**     System

  **CNT-031**   Offline content, where supported, shall use encrypted local storage, device-bound keys, expiring licences and periodic online entitlement checks; protected assets shall never be written to the user\'s ordinary filesystem as plain files.                                                                                                                                        **FUTURE**     System
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 16.5 Development rules that are requirements

-   **Never** place course content, permanent asset URLs or answer keys in JavaScript, client configuration or client-side state (CNT-018).

-   **Never** trust student_id, role, organization_id or any scope value supplied by the client (SEC-004).

-   **Never** rely on disabling F12, right-click or text selection as protection (GEN-003).

-   **Assume the student\'s device is hostile**: the client may inspect network traffic, modify JavaScript, replay and automate requests, and record the screen. Every security decision is therefore made server-side (GEN-004).

# 17. Grading, Feedback & Progress

## 17.1 Grading requirements

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                       **Priority**   **Actor**
  ------------- ----------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ---------------------
  **GRD-001**   Authorized users shall record a score against a Submission.                                                                                           **MUST**       Teacher/Assistant ⚙

  **GRD-002**   The system shall support automatic, manual and hybrid grading within one Activity.                                                                    **MUST**       System

  **GRD-003**   Authorized users shall provide written feedback, and rubric, file or media feedback where supported.                                                  **MUST**       Teacher/Assistant ⚙

  **GRD-004**   Grades shall be released explicitly; an unreleased grade shall not be visible to the Student or Parent.                                               **MUST**       Teacher

  **GRD-005**   Only users holding the relevant permission in the Activity\'s scope shall create or modify a grade.                                                   **MUST**       System

  **GRD-006**   Every grade change shall be recorded in an append-only history capturing old value, new value, actor, timestamp and --- after release --- a reason.   **MUST**       System

  **GRD-007**   Grade history shall be preserved after the grader\'s account is deactivated, and shall continue to identify the original grader.                      **MUST**       System

  **GRD-008**   Where multiple attempts exist, the recorded result shall follow the Activity\'s configured policy (highest · latest · average · teacher-selected).    **MUST**       System

  **GRD-009**   Late submissions shall be flagged, and any configured penalty shall be applied transparently, storing both raw and adjusted score.                    **MUST**       System

  **GRD-010**   Students shall see their own grades and feedback once released; Parents shall see their linked child\'s; no user shall see another student\'s.        **MUST**       System

  **GRD-011**   Administrative grade override, where it exists, shall require elevated permission, a stated reason and a high-severity audit event.                   **MUST**       Admin

  **GRD-012**   Grade writes shall be transactional; a partial grade write shall never be observable.                                                                 **MUST**       System
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 17.1 --- Grading and feedback requirements.*

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GRD-006 · GRADE INTEGRITY IS THE PRODUCT\'S CREDIBILITY**                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                 |
| A grade modification records: old value, new value, who changed it, when, and why. History is append-only --- a correction writes a new row and never edits the previous one. This is what lets the platform answer, months later, the only question that matters in a dispute. |
+=================================================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 17.2 Progress requirements

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                            **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ---------------------
  **PRG-001**   The system shall track Activity completion per student.                                                                                                                    **MUST**       System

  **PRG-002**   The system shall present progress at Topic, Cycle and Course level.                                                                                                        **MUST**       System

  **PRG-003**   The system shall present an overall progress figure per student.                                                                                                           **MUST**       System

  **PRG-004**   Progress shall be derived and reproducible from stored records at any time; a stored progress figure is a cache, not a source of truth.                                    **MUST**       System

  **PRG-005**   Progress shall be recomputed on every event that can change it.                                                                                                            **MUST**       System

  **PRG-006**   Teachers and authorized Assistants shall see progress per student and per group within their scope, without averaging across scopes in a way that hides a lagging group.   **MUST**       Teacher/Assistant ⚙

  **PRG-007**   Optional or ungraded Activities shall not reduce a student\'s progress percentage.                                                                                         **MUST**       System

  **PRG-008**   Progress shall measure completion, not attainment; grade and progress shall be reported as separate figures.                                                               **MUST**       System
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 17.2 --- Progress tracking requirements.*

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **BR-020 · PROPOSED · PROGRESS MEASURES COMPLETION, NEVER ATTAINMENT**                                                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                                                                         |
| A student who submits everything and scores poorly is at 100% progress with a low grade. Conflating the two produces a number that answers neither question. The exact weighting formula per Activity type is **OPEN** (§50, D-17) and shall be configured centrally once decided --- but the completion-not-attainment principle is binding regardless of the formula. |
+=========================================================================================================================================================================================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 18. Achievements, Points & Leaderboards

Gamification is a major EduCapsules component. It is built to be auditable, because a motivation system that can be quietly manipulated stops motivating.

## 18.1 Achievements

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                    **Priority**   **Actor**
  ------------- ---------------------------------------------------------------------------------------------------------------------------------- -------------- ---------------------
  **ACH-001**   Students shall view earned achievements with details, badge, points and award date.                                                **MUST**       Student

  **ACH-002**   Teachers shall create custom achievements within their authorised scope.                                                           **MUST**       Teacher

  **ACH-003**   Achievement categories 1--4 shall be configurable by Teachers, and by Assistants where explicitly permitted within scope.          **MUST**       Teacher/Assistant ⚙

  **ACH-004**   Homework and Quiz achievements shall be decidable by Teachers and by authorized Assistants.                                        **MUST**       Teacher/Assistant ⚙

  **ACH-005**   Criteria-based achievements shall be evaluated automatically when a qualifying event occurs.                                       **MUST**       System

  **ACH-006**   Achievement definition, configuration and awarding shall be permission-controlled.                                                 **MUST**       System

  **ACH-007**   An achievement shall be awarded at most once per student unless explicitly defined as repeatable.                                  **MUST**       System

  **ACH-008**   Achievements shall be retained permanently, including after Classroom or Group change and after course archival.                   **MUST**       System

  **ACH-009**   Achievement awards, revocations and definition changes shall be audited.                                                           **MUST**       System

  **ACH-010**   Parents shall view their linked child\'s achievements; no user shall configure achievements they are not permitted to configure.   **MUST**       System

  **PTS-001**   The system shall maintain a point balance per student.                                                                             **MUST**       System

  **PTS-002**   Point-earning events and their values shall be defined centrally and applied consistently.                                         **MUST**       System

  **PTS-003**   Point corrections shall be made by compensating entries; no point record shall be edited or deleted.                               **MUST**       System

  **PTS-004**   Manual point adjustment shall require permission and a stated reason, and shall be audited.                                        **MUST**       Teacher ⚙

  **PTS-005**   Students, linked Parents and authorized staff shall view relevant point information and history.                                   **MUST**       System

  **PTS-006**   Point values shall be configurable per Organization without a code change.                                                         **SHOULD**     Admin
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 18.1 --- Achievement and points requirements.*

## 18.2 Leaderboards

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                      **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------- -------------- -----------------
  **LDB-001**   The system shall support leaderboards at Group, Classroom, Subject and Cycle scope.                                  **MUST**       System

  **LDB-002**   Students shall view leaderboard information subject to privacy rules.                                                **MUST**       Student

  **LDB-003**   Parents shall view only their linked child\'s leaderboard position.                                                  **MUST**       Parent

  **LDB-004**   Leaderboard configuration, including disabling a leaderboard for a Group, shall be permission-controlled.            **MUST**       Teacher/Admin ⚙

  **LDB-005**   Ties shall be resolved by a single documented rule applied consistently across every scope.                          **MUST**       System

  **LDB-006**   A leaderboard shall be computed over a defined scope and period and shall never silently mix periods.                **MUST**       System

  **LDB-007**   Assistant leaderboard visibility shall be limited to their assigned scope.                                           **MUST**       System

  **LDB-008**   A student shall be able to opt out of appearing to other students without losing their own view of their position.   **SHOULD**     Student

  **LDB-009**   A leaderboard shall default to disabled for a newly created scope; it becomes visible only after a Teacher or authorised Assistant explicitly enables it (LDB-004).   **MUST**   System
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 18.2 --- Leaderboard requirements. LDB-009 added in v1.1: the "off by default" behaviour was already stated as fact elsewhere (§37.3.5, §49.1, R-10) but had never been written as a requirement (Appendix E).*

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **LEADERBOARDS ARE THE HIGHEST REPUTATIONAL RISK IN THE PRODUCT**                                                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                                                                                   |
| Done carelessly, a leaderboard publishes a ranked list of which children are struggling. LDB-004 (a Teacher can switch it off), LDB-008 (a student can opt out), LDB-009 (disabled by default) and the privacy rules in §29 exist for that reason. Exact ranking source, tie rule and reset period remain **OPEN** (§50, D-18) and must be decided before any leaderboard is enabled. |
+===================================================================================================================================================================================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 19. Teacher Experience

The Teacher is the primary educational authority. Teacher authority is bounded by ownership and assigned scope --- never platform-wide.

## 19.1 Account structure

+--------------------------------------------------------------------------------+
| **The Teacher account and what hangs off it**                                  |
|                                                                                |
| Teacher Account = Identity · Profile · Authentication · Security · Preferences |
|                                                                                |
| ├── Organizations                                                              |
|                                                                                |
| ├── Classrooms → Groups                                                        |
|                                                                                |
| ├── Subjects → Courses → Cycles → Topics → Teaching Sessions → Activities      |
|                                                                                |
| ├── Students · Assistants                                                      |
|                                                                                |
| ├── Teacher Storage                                                            |
|                                                                                |
| ├── Question Bank                                                              |
|                                                                                |
| ├── Achievements · Leaderboards · Analytics · Calendar                         |
|                                                                                |
| ├── Messages · Notifications                                                   |
|                                                                                |
| └── Subscription / Billing ← separate from educational authority (GEN-020)     |
+================================================================================+
+--------------------------------------------------------------------------------+

## 19.2 Requirements

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                         **Priority**   **Actor**
  ------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **TCH-001**   The system shall provide each Teacher with a unique immutable Teacher ID that never changes and is never reassigned; email shall not be the primary identity key.                       **MUST**       System

  **TCH-002**   The system shall maintain a Teacher profile separate from educational resources.                                                                                                        **MUST**       System

  **TCH-003**   The system shall support Teacher account status: PENDING_VERIFICATION · ACTIVE · SUSPENDED · LOCKED · DEACTIVATED · DELETED.                                                            **MUST**       System

  **TCH-004**   The system shall support secure Teacher authentication.                                                                                                                                 **MUST**       System

  **TCH-005**   The system shall support MFA for Teacher accounts where enabled or required.                                                                                                            **MUST**       Teacher

  **TCH-006**   Teachers shall manage their own profile, visibility settings and preferences; sensitive account information shall never become public because a profile exists.                         **MUST**       Teacher

  **TCH-007**   Authorized Teachers shall create and manage Classrooms.                                                                                                                                 **MUST**       Teacher

  **TCH-008**   Authorized Teachers shall manage Groups within their Classrooms.                                                                                                                        **MUST**       Teacher

  **TCH-009**   Teachers shall view and manage students within their educational scope, and shall not receive unrelated personal information.                                                           **MUST**       Teacher

  **TCH-010**   Teachers shall assign and manage Assistants according to §23.                                                                                                                           **MUST**       Teacher

  **TCH-011**   The system shall support Assistant scope and permission management by the Teacher.                                                                                                      **MUST**       Teacher

  **TCH-012**   Teachers shall create and manage Courses within their authorised scope.                                                                                                                 **MUST**       Teacher

  **TCH-013**   Teachers shall create and manage Cycles and Topics.                                                                                                                                     **MUST**       Teacher

  **TCH-014**   Teachers shall schedule and manage Teaching Sessions.                                                                                                                                   **MUST**       Teacher

  **TCH-015**   Teachers shall create and manage Activities.                                                                                                                                            **MUST**       Teacher

  **TCH-016**   Teachers shall review and grade student submissions.                                                                                                                                    **MUST**       Teacher

  **TCH-017**   The system shall maintain an auditable history of grade changes.                                                                                                                        **MUST**       System

  **TCH-018**   Teachers shall manage permitted Achievements and leaderboards within scope.                                                                                                             **MUST**       Teacher

  **TCH-019**   The system shall provide each Teacher with private Storage.                                                                                                                             **MUST**       System

  **TCH-020**   Teachers shall attach existing Storage files without unnecessary duplication.                                                                                                           **MUST**       Teacher

  **TCH-021**   The system shall separate private Storage content from published Student content.                                                                                                       **MUST**       System

  **TCH-022**   Teachers shall access educational analytics for their authorised scope at classroom, group, course and individual-student level.                                                        **MUST**       Teacher

  **TCH-023**   Teachers shall have a calendar combining Sessions, deadlines, quizzes, exams and events.                                                                                                **MUST**       Teacher

  **TCH-024**   The system shall support Teacher↔Student, Teacher↔Parent and Teacher↔Assistant communication per §30.                                                                                   **MUST**       Teacher

  **TCH-025**   The system shall provide configurable Teacher notifications.                                                                                                                            **MUST**       Teacher

  **TCH-026**   The system shall separate Teacher educational authority from billing and subscription status.                                                                                           **MUST**       System

  **TCH-027**   The system shall enforce Teacher authorization server-side for every protected operation.                                                                                               **MUST**       System

  **TCH-028**   The system shall prevent Teachers from accessing resources outside their authorised scope, including another Teacher\'s private Storage, unrelated classrooms and unrelated students.   **MUST**       System

  **TCH-029**   The system shall maintain audit records for security-sensitive Teacher actions.                                                                                                         **MUST**       System

  **TCH-030**   The system shall provide an account deletion/deactivation workflow that accounts for owned and dependent resources (§43).                                                               **MUST**       System

  **TCH-031**   Teachers shall preview any student-facing screen as a student would see it.                                                                                                             **SHOULD**     Teacher
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 19.1 --- Teacher requirements.*

## 19.3 Teacher security boundaries

  -------------------------------------------------------------------------------------------------
  **A Teacher shall never be able to...**                              **Enforced by**
  -------------------------------------------------------------------- ----------------------------
  **Become an Admin or grant themselves administrative permissions**   SEC-006, ADM-025

  **Access another Teacher\'s private Storage**                        STR-001, STR-015

  **Access unrelated classrooms, groups or students**                  TCH-028, SEC-005

  **Modify platform security settings or system configuration**        ADM-025, SEC-002

  **Bypass content-protection mechanisms**                             CNT-011, CNT-018

  **Modify or delete audit records**                                   AUD-004

  **Manipulate subscription entitlements**                             BIL-006
  -------------------------------------------------------------------------------------------------

## 19.4 Reference screen

![](media/image10.png){width="6.7in" height="4.108403324584427in"}

*Figure 19.1 --- Teacher dashboard --- reference layout (§42). The grading queue is surfaced at top level because an ungraded backlog is the fastest way to lose student trust.*

# 20. Student Experience

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **STU-000 · THE STUDENT AUTHORIZATION RULE**                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                     |
| A Student may consume educational content, participate in assigned educational activities, see their own academic progress, and take part in permitted social and gamification features --- **but may not modify academic authority or any other student\'s data.** |
+=====================================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 20.1 The four student pillars

+-----------------------------------------------------------------------+
| **The Student account model**                                         |
|                                                                       |
| 1\. LEARN Courses → Cycles → Topics → Materials                       |
|                                                                       |
| 2\. PARTICIPATE Activities → Homework · Quizzes · other types         |
|                                                                       |
| 3\. PROGRESS Grades → Progress → Achievements → Points                |
|                                                                       |
| 4\. ENGAGE Classroom → Group → permitted communication                |
+=======================================================================+
+-----------------------------------------------------------------------+

## 20.2 Capability matrix

  ----------------------------------------------------------------------------------------------------------------------
  **Capability**                              **Student**            **Capability**                        **Student**
  ------------------------------------------- ---------------------- ------------------------------------- -------------
  Manage own profile                          ✔                      Earn achievements                     ✔

  Change own password                         ✔                      View achievements                     ✔

  View own classroom                          ✔                      Earn points                           ✔

  View own group                              ✔                      View points history                   ✔

  View classmates                             ⚙                      View leaderboards                     ✔ ⚙

  View subjects / courses / cycles / topics   ✔                      Send messages                         ⚙

  View published learning materials           ✔                      Receive announcements                 ✔

  Download materials                          ⚙ per content policy   Mark attendance                       ✖

  Submit / edit / resubmit homework           ✔ ⚙                    Create or grade any activity          ✖

  Take quizzes                                ✔                      Create or modify achievements         ✖

  View quiz results                           ⚙ on release           Modify grades or course content       ✖

  View grades and feedback                    ✔ on release           Manage classroom / students / staff   ✖

  Track own progress                          ✔                      Manage billing or change own role     ✖
  ----------------------------------------------------------------------------------------------------------------------

*Table 20.1 --- Student capabilities. ⚙ = permitted only where the Teacher or content policy allows.*

## 20.3 Requirements

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                                   **Priority**   **Actor**
  ------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **STU-001**   Students shall manage their own profile, password and preferences.                                                                                                                                                                **MUST**       Student

  **STU-002**   Students shall access only the Classrooms, Groups, Courses, Cycles, Topics, Sessions and Activities their memberships and targeting entitle them to.                                                                              **MUST**       System

  **STU-003**   A Student shall never access another Student\'s submissions, grades, feedback, files or private information --- including within the same Group.                                                                                  **MUST**       System

  **STU-004**   Students shall access published learning materials only through the protected delivery path (§16), never through Teacher Storage.                                                                                                 **MUST**       System

  **STU-005**   Students shall submit work, and edit or resubmit where the Activity permits.                                                                                                                                                      **MUST**       Student

  **STU-006**   Students shall view their own released grades, feedback and progress.                                                                                                                                                             **MUST**       Student

  **STU-007**   Students shall view their own achievements, points and permitted leaderboards.                                                                                                                                                    **MUST**       Student

  **STU-008**   Students shall view their schedule and receive announcements and notifications.                                                                                                                                                   **MUST**       Student

  **STU-009**   Students shall communicate only within permitted educational relationships.                                                                                                                                                       **MUST**       Student

  **STU-010**   Students shall never modify their own membership, attendance, grades or role.                                                                                                                                                     **MUST**       System

  **STU-011**   The student dashboard shall not expose staff management, other students\' private data, grade editing, structure administration, achievement configuration, billing administration, Teacher Storage or administrative settings.   **MUST**       System

  **STU-012**   A Student\'s visible identity to other students shall be limited by the Organization\'s privacy configuration.                                                                                                                    **MUST**       System
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 20.2 --- Student requirements.*

![](media/image11.png){width="6.7in" height="3.5454166666666667in"}

*Figure 20.1 --- Student dashboard --- reference layout. Everything shown derives from membership and targeting; nothing is manually curated.*

# 21. Assistant Experience & Delegation

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-006 · THE ASSISTANT RULE**                                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                |
| **Assistant access is always Assignment + Scope + Permissions.** Being an Assistant, on its own, grants nothing at all. An Assistant can perform educational and operational tasks delegated by a Teacher, but never ownership, platform-administration, billing or unrestricted account-management functions. |
+================================================================================================================================================================================================================================================================================================================+
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

![](media/image12.png){width="6.7in" height="3.434277121609799in"}

*Figure 21.1 --- The delegation model and its hard limits.*

## 21.1 The Assistant Assignment

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Field**                                **Meaning**
  ---------------------------------------- -----------------------------------------------------------------------------------------------------------------------
  **assistant · teacher · organization**   Who is delegated to, by whom, in which tenant

  **scope**                                Classroom · Group · Course · Cycle, or a combination. The Assistant must satisfy every scope named on the assignment.

  **permissions\[\]**                      An explicit subset of the delegatable permission catalogue (§26.3)

  **start_date · end_date**                Optional time bounds. Expiry terminates access automatically, with no further action required (AST-006).

  **status**                               ACTIVE · EXPIRED · REVOKED
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------

## 21.2 Requirements

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                                                         **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **AST-001**   Assistant shall be a distinct account type, not a Teacher with fewer permissions.                                                                                                                                                                       **MUST**       System

  **AST-002**   An Assistant shall access only the scopes and permissions explicitly assigned.                                                                                                                                                                          **MUST**       System

  **AST-003**   Assistants shall perform activity creation and management, grading, attendance, progress viewing, achievement management, question-bank work, materials management and communication **only** where the corresponding permission is granted in scope.   **MUST**       System

  **AST-004**   An Assistant account shall never hold Admin permissions.                                                                                                                                                                                                **MUST**       System

  **AST-005**   Every Assistant grant, modification, expiry and revocation shall be audited and visible to the delegating Teacher.                                                                                                                                      **MUST**       System

  **AST-006**   An Assistant Assignment shall support an optional expiry, after which its permissions cease automatically.                                                                                                                                              **MUST**       System

  **AST-007**   Revocation shall remove access immediately while preserving historical audit records and the attribution of work already performed.                                                                                                                     **MUST**       System

  **AST-008**   The Assistant dashboard shall show only assigned scopes and permitted actions; hiding a control shall never be the enforcement mechanism.                                                                                                               **MUST**       System

  **AST-009**   An Assistant shall support multiple concurrent Teacher relationships, each with its own assignment, scope and permissions.                                                                                                                              **MUST**       System

  **AST-010**   Assistants shall not access financial, subscription, billing or platform analytics.                                                                                                                                                                     **MUST**       System

  **AST-011**   Assistants shall access Teacher Storage only where explicitly shared, with only the granted operations.                                                                                                                                                 **MUST**       System
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 21.1 --- Assistant requirements.*

## 21.3 Hard prohibitions

  --------------------------------------------------------------------------------------------------------------------------------------
  **An Assistant shall never...**                                                    **Even if...**
  ---------------------------------------------------------------------------------- ---------------------------------------------------
  **Grant themselves permissions or expand their own scope**                         they hold every other permission

  **Create, modify or remove another Assistant**                                     the Teacher granted broad educational permissions

  **Become a Teacher or Admin, or change their own role**                            they administer the whole classroom

  **Transfer ownership, or delete or modify the Teacher account**                    the Teacher is inactive

  **Manage subscriptions, billing or payment methods**                               they process payment evidence (§27)

  **Access students, classrooms or groups outside their assignment**                 the students share an Organization

  **Access unrestricted Teacher Storage**                                            they can publish content

  **Access or modify Parent accounts or remove parent relationships**                they message parents

  **Permanently delete students, or transfer students between unrelated Teachers**   asked to by a student
  --------------------------------------------------------------------------------------------------------------------------------------

*Table 21.2 --- AST-004, SEC-006. These are structural, not configuration.*

# 22. Parent Experience & Linking

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **PAR-000 · THE PARENT AUTHORIZATION RULE**                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                    |
| The Parent has **read-oriented access to their linked child\'s educational information and controlled communication capabilities**, but has no authority to alter the child\'s academic records, grades, activities, achievements, classroom assignments or educational structure. |
+====================================================================================================================================================================================================================================================================================+
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 22.1 Capability matrix

  ---------------------------------------------------------------------------------------------------------------------------
  **Capability**                          **Parent**           **Capability**                                    **Parent**
  --------------------------------------- -------------------- ------------------------------------------------- ------------
  Manage own profile / password           ✔                    View grades                                       ✔

  View linked children                    ✔                    View achievements & points                        ✔

  Add child / remove child relationship   ⚙ verified process   View leaderboards                                 ⚙

  View child\'s classroom                 ✔                    View schedule                                     ✔

  View child\'s group                     ⚙                    Receive announcements                             ✔

  View child\'s subjects / courses        ✔                    Send messages                                     ⚙

  View course / cycle / topic progress    ✔                    Submit homework or take quizzes                   ✖

  View learning materials                 ⚙ per policy         Modify grades / schedule / achievements           ✖

  View homework & status                  ✔                    Manage classroom / courses / students / staff     ✖

  View homework grade & feedback          ✔                    Access Teacher Storage or unrelated students      ✖

  View quizzes                            ✔                    Manage billing (unless designated payer)          ⚙

  View quiz results                       ⚙ on release         Change own or child\'s role · impersonate child   ✖
  ---------------------------------------------------------------------------------------------------------------------------

*Table 22.1 --- Parent capabilities.*

## 22.2 Requirements

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                                                    **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **PAR-001**   A Parent shall access academic information only for Students to whom they hold an ACTIVE ParentLink.                                                                                                                                               **MUST**       System

  **PAR-002**   A Parent↔Student relationship shall be established through an explicit, verified process and confirmed by an authorized Teacher, Organization or Admin. Claiming a relationship, or knowing a Student\'s ID or email, shall never be sufficient.   **MUST**       System

  **PAR-003**   Parent access shall be read-oriented; no Parent action shall write to an academic record.                                                                                                                                                          **MUST**       System

  **PAR-004**   A Parent with multiple linked children shall switch between them, and each switch shall re-evaluate authorization.                                                                                                                                 **MUST**       System

  **PAR-005**   Parents shall never view another student\'s identifiable academic data, private Teacher or Assistant information, or internal administrative data.                                                                                                 **MUST**       System

  **PAR-006**   A ParentLink shall be revocable by an authorized Teacher or Admin, taking effect immediately.                                                                                                                                                      **MUST**       System

  **PAR-007**   Parents shall receive notifications only for events concerning a linked child.                                                                                                                                                                     **MUST**       System

  **PAR-008**   A Parent shall never impersonate their child, submit work on the child\'s behalf, or take an assessment on the child\'s behalf.                                                                                                                    **MUST**       System

  **PAR-009**   ParentLink issuance, confirmation, modification and revocation shall be audited.                                                                                                                                                                   **MUST**       System

  **PAR-010**   The Parent dashboard shall be optimised to answer "how is my child doing, and what needs my attention?"                                                                                                                                            **SHOULD**     System
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 22.2 --- Parent requirements.*

![](media/image13.png){width="6.7in" height="2.977777777777778in"}

*Figure 22.1 --- Parent overview --- reference layout. The screen states its own boundary; what a parent can and cannot see is visible in the interface, not only in this document.*

# 23. Admin Experience & Platform Governance

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-002 · ADMIN IS NOT AN EDUCATIONAL ACCOUNT**                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                    |
| **Admin = Platform Governance + Operations + Security + Support.** An Admin does not become a Teacher because they can oversee Teacher activity. Admin access is itself permission-based, scoped and auditable --- there is no "god mode" account. |
+====================================================================================================================================================================================================================================================+
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 23.1 Administrative roles

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Role**               **Primary responsibility**              **Typically holds**                                        **Never holds by default**
  ---------------------- --------------------------------------- ---------------------------------------------------------- -------------------------------------------------------
  **Platform Owner**     Highest-level governance and recovery   All permissions                                            --- (but every action is audited)

  **Super Admin**        Broad platform operations               User, org, content, audit, support, system config          Nothing structurally, but each grant is explicit

  **Operations Admin**   Day-to-day platform operations          User and organization operations, academic oversight       Security response, billing, system configuration

  **Security Admin**     Security monitoring and response        Security events, sessions, audit, security configuration   Billing, content moderation actions

  **Support Admin**      User support                            User lookup, tickets, limited account actions              Billing, security configuration, private content

  **Billing Admin**      Commercial operations                   Plans, subscriptions, payments, refunds, invoices          Security, moderation, user administration

  **Moderation Admin**   Reports and content moderation          Reports, content review and restriction                    Billing, security configuration, system configuration
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 23.1 --- Administrative roles. A single Admin may hold several if explicitly assigned. \`is_admin = true\` is never sufficient.*

## 23.2 Requirements

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                          **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ -------------- ------------
  **ADM-001**   The system shall provide each Admin with a unique immutable Admin ID.                                                                                                                                                    **MUST**       System

  **ADM-002**   The system shall maintain an Admin profile separate from educational roles.                                                                                                                                              **MUST**       System

  **ADM-003**   The system shall support multiple administrative roles.                                                                                                                                                                  **MUST**       System

  **ADM-004**   The system shall support granular administrative permissions rather than a single administrator flag.                                                                                                                    **MUST**       System

  **ADM-005**   The system shall support administrative scope: global, organization, or functional.                                                                                                                                      **MUST**       System

  **ADM-006**   The system shall support secure Admin authentication with stronger controls than ordinary accounts.                                                                                                                      **MUST**       System

  **ADM-007**   MFA shall be required for administrative accounts.                                                                                                                                                                       **MUST**       System

  **ADM-008**   The system shall provide Admin session and device management.                                                                                                                                                            **MUST**       Admin

  **ADM-009**   Authorized Admins shall manage platform users: search, verify, suspend, restore, lock, force password reset, revoke sessions, review history.                                                                            **MUST**       Admin

  **ADM-010**   Authorized Admins shall manage Organizations.                                                                                                                                                                            **MUST**       Admin

  **ADM-011**   The system shall provide platform-level academic oversight without granting normal teaching authority.                                                                                                                   **MUST**       Admin

  **ADM-012**   Authorized Admins shall review, restrict, remove and restore reported content.                                                                                                                                           **MUST**       Admin

  **ADM-013**   Authorized Admins shall monitor platform storage usage, quotas, failures, malware detections and suspicious activity.                                                                                                    **MUST**       Admin

  **ADM-014**   Authorized Admins shall administer billing: plans, subscriptions, payments, refunds, invoices, entitlements.                                                                                                             **MUST**       Admin

  **ADM-015**   Authorized Admins shall manage support tickets.                                                                                                                                                                          **MUST**       Admin

  **ADM-016**   Authorized Admins shall monitor security events and respond to incidents.                                                                                                                                                **MUST**       Admin

  **ADM-017**   The system shall maintain tamper-resistant, append-only audit records of administrative actions.                                                                                                                         **MUST**       System

  **ADM-018**   Critical administrative operations shall require elevated authorization: permission check → re-authentication → MFA → stated reason → confirmation → action → audit event.                                               **MUST**       System

  **ADM-019**   Administrative impersonation, if enabled, shall be explicit, permission-controlled, temporary, reason-required, visibly indicated and fully audited.                                                                     **SHOULD**     Admin

  **ADM-020**   Impersonation sessions shall be clearly identified in the interface and shall restrict sensitive actions.                                                                                                                **MUST**       System

  **ADM-021**   Admins shall not modify audit records through any administrative interface.                                                                                                                                              **MUST**       System

  **ADM-022**   Admin access shall be revoked when an Admin account is suspended or deactivated.                                                                                                                                         **MUST**       System

  **ADM-023**   Administrative audit history shall be preserved after account deactivation and shall continue to identify the acting Admin.                                                                                              **MUST**       System

  **ADM-024**   Admins shall not access resources outside their assigned administrative scope.                                                                                                                                           **MUST**       System

  **ADM-025**   Platform administration shall be separated from educational authority.                                                                                                                                                   **MUST**       System

  **ADM-026**   Private Teacher Storage shall be protected from unauthorized administrative access.                                                                                                                                      **MUST**       System

  **ADM-027**   Exceptional administrative access to restricted private data shall require permission, re-authentication, MFA, a stated reason and confirmation, and shall be fully audited.                                             **MUST**       System

  **ADM-028**   An Admin shall never have a generic "log in as user" capability.                                                                                                                                                         **MUST**       System

  **ADM-029**   Administrative grade override, if provided, shall require elevated permission, a stated reason and a high-severity audit event.                                                                                          **MUST**       System

  **ADM-030**   Authorized Admins shall manage system configuration, feature flags, platform limits, rate limits, supported file types and maintenance mode; dangerous settings shall require elevated authorization and confirmation.   **MUST**       Admin
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 23.2 --- Admin requirements.*

## 23.3 Exceptional access

+-----------------------------------------------------------------------+
| **ADM-027 · The only route to restricted private data**               |
|                                                                       |
| Permission check                                                      |
|                                                                       |
| → re-authentication                                                   |
|                                                                       |
| → MFA                                                                 |
|                                                                       |
| → stated reason (recorded, not free of consequence)                   |
|                                                                       |
| → explicit confirmation                                               |
|                                                                       |
| → action                                                              |
|                                                                       |
| → high-severity audit event, visible to Security Admin                |
+=======================================================================+
+-----------------------------------------------------------------------+

![](media/image14.png){width="6.7in" height="3.280207786526684in"}

*Figure 23.1 --- Administrative user and permission management --- reference layout. The right-hand panel shows an Assistant\'s grants including the ones structurally blocked.*

# 24. Dashboards & Navigation

Five role experiences over one authorization system. The dashboards are not independent security systems --- they are different views of the same authorised data (GEN-004).

## 24.1 Purpose per role

  -------------------------------------------------------------------------------------------------------------------------
  **Role**        **Dashboard purpose**                                   **First question it answers**
  --------------- ------------------------------------------------------- -------------------------------------------------
  **Student**     Learning and progress centre                            What do I need to do, and how am I doing?

  **Teacher**     Teaching, management, assessment and analytics centre   What needs my attention today?

  **Assistant**   Operational teaching-support centre                     What have I been asked to do, and where?

  **Parent**      Family monitoring and communication centre              How is my child doing, what needs my attention?

  **Admin**       Platform operations, governance, security and support   Is the platform healthy and safe?
  -------------------------------------------------------------------------------------------------------------------------

## 24.2 Primary widgets

  ------------------------------------------------------------------------------------------------------------------------
  **Student**            **Teacher**                **Assistant**         **Parent**                 **Admin**
  ---------------------- -------------------------- --------------------- -------------------------- ---------------------
  My classes · courses   My classrooms · groups     Assigned classrooms   My children                Platform overview

  Continue learning      Courses · active cycles    Assigned groups       Overall progress           System health

  Upcoming activities    Upcoming activities        Assigned courses      Homework status            Active users

  Recent activities      Pending grading            Pending grading       Upcoming deadlines         Organizations

  Grades                 Student progress           Upcoming activities   Quiz results · grades      Subscriptions

  Progress               Attendance                 Student progress      Teacher feedback           Storage

  Achievements           Achievements               Achievements          Achievements               Security alerts

  Leaderboard            Leaderboards               Announcements         Leaderboard ⚙              Reports

  Calendar               Announcements · messages   Messages              Attendance                 Support tickets

  Announcements          Storage                    Calendar              Calendar                   Moderation queue

  Messages               Calendar · analytics       Shared storage        Announcements · messages   Recent audit events
  ------------------------------------------------------------------------------------------------------------------------

*Table 24.1 --- Dashboard widget inventory per role, consolidated from the source dashboard specifications.*

## 24.3 Permission-driven interface

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-003 · HIDING A BUTTON IS NOT AUTHORIZATION**                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                               |
| The Assistant dashboard in particular is dynamic: it shows only what that Assistant\'s assignment permits. That is a **usability** measure. The backend independently enforces every permission on every request, and a hidden control is never the reason an action fails (UI-014, SEC-002). |
+===============================================================================================================================================================================================================================================================================================+
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 24.4 Screen inventory

  ---------------------------------------------------------------------------------------------------------------------------------
  **\#**   **Screen**                              **Roles**                             **Key requirements**     **Illustrated**
  -------- --------------------------------------- ------------------------------------- ------------------------ -----------------
  S-01     Student dashboard                       Student                               STU-011                  §20.3

  S-02     Teacher dashboard                       Teacher                               TCH-001, TCH-022         §19.4

  S-03     Assistant dashboard                     Assistant                             AST-008                  ---

  S-04     Parent overview                         Parent                                PAR-004, PAR-005         §22.2

  S-05     Admin console                           Admin                                 ADM-009...016            §23.3

  S-06     Course builder                          Teacher, Assistant ⚙                  CRS-001...008, TOP-001   §25

  S-07     Teaching session planner & attendance   Teacher, Assistant ⚙                  SES-002...016            ---

  S-08     Activity builder                        Teacher, Assistant ⚙                  ACT-011...022            ---

  S-09     Question bank                           Teacher, Assistant ⚙                  QBN-001...034            ---

  S-10     Activity participation                  Student                               ACT-029, ACT-035         §25

  S-11     Quiz attempt                            Student                               QBN-039, ACT-017         §25

  S-12     Grading queue & detail                  Teacher, Assistant ⚙                  GRD-001...009            §25

  S-13     Teacher storage                         Teacher, Assistant ⚙                  STR-001...022            ---

  S-14     Protected content viewer                Student, Parent ⚙                     CNT-014, CNT-015         ---

  S-15     Achievements & leaderboard              Student, Parent ⚙                     ACH-001, LDB-002         §25

  S-16     Messages & announcements                All                                   MSG-001...010            ---

  S-17     Calendar                                All                                   CAL-001...005            ---

  S-18     Payment evidence & approval             Student/Payer, Teacher, Assistant ⚙   PAY-003...008            ---

  S-19     Security centre (sessions & devices)    All                                   AUTH-108, AUTH-109       ---

  S-20     Audit log viewer                        Admin                                 ADM-017, AUD-008         ---
  ---------------------------------------------------------------------------------------------------------------------------------

*Table 24.2 --- The V1 screen inventory. Nine are illustrated in this document (v1.1 correction: previously stated as seven).*

# 25. Reference Interface Screens

These screens are **specification, not decoration**. Where a screen shows a rule being enforced or explained to the user, that is a requirement about the interface (§38), not a designer\'s suggestion. Visual styling is subject to §38.1.

![](media/image15.png){width="6.7in" height="2.977777777777778in"}

*Figure 25.1 --- S-06 Course builder. The scope check in the right panel makes SEC-005 visible to the Teacher rather than surfacing as a failure after the fact.*

![](media/image16.png){width="6.7in" height="3.1685411198600173in"}

*Figure 25.2 --- S-10 Activity participation. The rules that will be applied --- attempts, late policy, points --- are shown \*\*before\*\* the student submits (UI-007).*

![](media/image17.png){width="6.7in" height="2.977777777777778in"}

*Figure 25.3 --- S-11 Quiz attempt. Auto-submit behaviour is stated on the screen; a timer that discards work without warning is the fastest way to lose a student\'s trust (ACT-035).*

![](media/image18.png){width="6.7in" height="2.977777777777778in"}

*Figure 25.4 --- S-12 Grading queue and detail. The consequences of saving --- points awarded, progress recomputed --- are shown to the grader before they commit.*

![](media/image19.png){width="6.7in" height="3.470972222222222in"}

*Figure 25.5 --- S-15 Achievements and leaderboard. The privacy rules of §18.2 are visible in the interface: most positions are simply not rendered.*

![](media/image20.png){width="6.7in" height="3.289514435695538in"}

*Figure 25.6 --- Structured reference content rendered through the protected viewer path (§16). Definition, cases, worked example and related concepts.*

# 26. Permission Catalogue & Matrix

The permission catalogue is closed: an action with no permission code cannot be performed. Adding a capability is therefore a deliberate act with a traceable requirement (§1.5).

## 26.1 Permission naming

+------------------------------------------------------------------------------+
| **Naming convention**                                                        |
|                                                                              |
| Educational permissions VERB_NOUN e.g. GRADE_HOMEWORK                        |
|                                                                              |
| Administrative permissions NOUN_VERB e.g. USER_SUSPEND                       |
|                                                                              |
| Every permission is evaluated together with a scope; a permission code alone |
|                                                                              |
| authorises nothing (SEC-001).                                                |
+==============================================================================+
+------------------------------------------------------------------------------+

## 26.2 Educational permission catalogue

  -------------------------------------------------------------------------------------------------------------------------------------
  **Permission**                        **Allows**                                 **Default holder**   **Delegatable to Assistant?**
  ------------------------------------- ------------------------------------------ -------------------- -------------------------------
  VIEW_STUDENTS                         See students in scope                      Teacher              Yes

  MANAGE_STUDENTS                       Manage student membership in scope         Teacher              Yes ⚙

  VIEW_STUDENT_PROGRESS                 See progress in scope                      Teacher              Yes

  VIEW_STUDENT_ACTIVITY                 See activity state in scope                Teacher              Yes

  VIEW_STUDENT_ATTENDANCE               See attendance in scope                    Teacher              Yes

  MANAGE_CLASSROOM                      Create/edit classrooms and groups          Teacher              Yes ⚙

  MANAGE_COURSE                         Create/edit courses, cycles, topics        Teacher              Yes ⚙

  PUBLISH_CONTENT                       Publish content to students                Teacher              Yes ⚙

  CREATE_SESSION · EDIT_SESSION         Schedule and manage teaching sessions      Teacher              Yes

  MANAGE_ATTENDANCE                     Record and update attendance               Teacher              Yes

  CREATE_HOMEWORK · EDIT_HOMEWORK       Author homework activities                 Teacher              Yes

  GRADE_HOMEWORK                        Grade homework submissions                 Teacher              Yes

  CREATE_QUIZ · EDIT_QUIZ               Author quizzes                             Teacher              Yes

  GRADE_QUIZ                            Grade quiz submissions                     Teacher              Yes

  VIEW_GRADES · ENTER_GRADES            See and enter grades in scope              Teacher              Yes

  EDIT_GRADES                           Change a grade after entry                 Teacher              Yes ⚙

  RELEASE_GRADES                        Make grades visible to student/parent      Teacher              Yes ⚙

  VIEW_QUESTION_BANK                    Browse the question bank in scope          Teacher              Yes

  CREATE_QUESTION · EDIT_QUESTION       Author questions                           Teacher              Yes

  DELETE_QUESTION                       Archive/remove questions                   Teacher              Yes ⚙

  IMPORT_QUESTIONS · EXPORT_QUESTIONS   Bulk question movement                     Teacher              Yes ⚙

  MANAGE_QUESTION_POOLS                 Create and configure pools                 Teacher              Yes

  MANAGE_ACHIEVEMENTS                   Configure achievement rules in scope       Teacher              Yes ⚙

  CREATE_ACHIEVEMENT                    Define a new custom achievement            Teacher              **No**

  AWARD_ACHIEVEMENTS                    Award an achievement to a student          Teacher              Yes

  ADJUST_POINTS                         Manually adjust points with reason         Teacher              **No**

  MANAGE_LEADERBOARD                    Configure or disable a leaderboard         Teacher              Yes ⚙

  MESSAGE_STUDENTS · MESSAGE_PARENTS    Communicate within scope                   Teacher              Yes ⚙

  CREATE_ANNOUNCEMENTS                  Post announcements in scope                Teacher              Yes ⚙

  VIEW_STORAGE · UPLOAD_FILES           Work with shared Teacher Storage           Teacher              Yes ⚙

  DOWNLOAD_ORIGINAL                     Download original stored files             Teacher              Yes ⚙

  MANAGE_STORAGE_PERMISSIONS            Change who may access stored files         Teacher              **No**

  ASSIGN_ASSISTANT                      Create or modify an Assistant Assignment   Teacher              **No**

  VIEW_ANALYTICS                        Educational analytics in scope             Teacher              Yes
  -------------------------------------------------------------------------------------------------------------------------------------

*Table 26.1 --- Educational permission catalogue. "No" in the last column means structurally non-delegatable (SEC-006) --- not merely off by default.*

## 26.3 Administrative permission catalogue

  ----------------------------------------------------------------------------------------------------------------------------
  **Permission**                                       **Allows**                                      **Typical role**
  ---------------------------------------------------- ----------------------------------------------- -----------------------
  USER_VIEW · USER_SUSPEND · USER_RESTORE              Account administration                          Operations, Support

  ORG_VIEW · ORG_MANAGE                                Organization administration                     Operations, Super

  CONTENT_REVIEW · CONTENT_RESTRICT · CONTENT_REMOVE   Content moderation                              Moderation

  BILLING_VIEW · REFUND_MANAGE · PLAN_MANAGE           Commercial operations                           Billing

  SECURITY_VIEW · SECURITY_RESPOND                     Security monitoring and response                Security

  AUDIT_VIEW                                           Read the audit log                              Security, Super

  SUPPORT_MANAGE                                       Support tickets and user issues                 Support

  SYSTEM_CONFIG · FEATURE_FLAG_MANAGE                  Platform configuration                          Super, Platform Owner

  IMPERSONATE_USER                                     Controlled support impersonation                Support (elevated)

  PRIVATE_DATA_ACCESS                                  Exceptional access to restricted private data   Elevated + audited
  ----------------------------------------------------------------------------------------------------------------------------

*Table 26.2 --- Administrative permission catalogue.*

## 26.4 Administrative permission matrix

  ----------------------------------------------------------------------------------------------------------------------------
  **Permission area**          **Platform Owner**   **Super**     **Security**    **Support**   **Billing**   **Moderation**
  ---------------------------- -------------------- ------------- --------------- ------------- ------------- ----------------
  User management              ✔                    ✔             Limited         Limited       ✖             Limited

  Organization management      ✔                    ✔             ✖               ✖             ✖             ✖

  Security events              ✔                    ✔             ✔               Limited       ✖             Limited

  Billing                      ✔                    ✔             ✖               ✖             ✔             ✖

  Reports & moderation         ✔                    ✔             ✔               ✔             ✖             ✔

  Content moderation actions   ✔                    ✔             Limited         Limited       ✖             ✔

  Audit logs                   ✔                    ✔             ✔               Limited       Limited       Limited

  System configuration         ✔                    ✔             Security only   ✖             ✖             ✖

  Private content access       Exceptional          Exceptional   Exceptional     Exceptional   ✖             Case-based

  Grant admin privileges       ✔                    ⚙             ✖               ✖             ✖             ✖
  ----------------------------------------------------------------------------------------------------------------------------

*Table 26.3 --- Administrative separation of duties. Every "Exceptional" cell requires the §23.3 flow.*

# 27. Communication

Communication is role- and scope-based. It is also the highest child-safety surface in the product, so its rules are stated as requirements rather than as policy alone.

## 27.1 Permitted channels

  ----------------------------------------------------------------------------------------------------------------------
  **Channel**                         **Permitted**   **Condition**
  ----------------------------------- --------------- ------------------------------------------------------------------
  **Teacher ↔ Student**               ✔               Student is in the Teacher\'s authorised scope

  **Teacher ↔ Parent**                ✔               Parent holds an ACTIVE link to a student in the Teacher\'s scope

  **Teacher ↔ Assistant**             ✔               An Assistant Assignment exists between them

  **Assistant ↔ Student**             ⚙               MESSAGE_STUDENTS granted, student inside assigned scope

  **Assistant ↔ Parent**              ⚙               MESSAGE_PARENTS granted, parent linked to an in-scope student

  **Student ↔ Teacher / Assistant**   ⚙               Within the student\'s own educational relationships

  **Student ↔ Student**               **✖ (V1)**      Not supported in V1 --- see §49

  **Parent ↔ Parent**                 **✖**           Never

  **Organization announcements**      ⚙               Authorized staff, scoped to the announcement\'s audience
  ----------------------------------------------------------------------------------------------------------------------

*Table 27.1 --- Communication channels. Every message is authorised against the same model as any other resource (SEC-001).*

## 27.2 Requirements

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                             **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------- -------------- ---------------------
  **MSG-001**   The system shall support direct messages within permitted channels only.                                                                    **MUST**       System

  **MSG-002**   The system shall support announcements scoped to a Classroom, Group, Course or Organization.                                                **MUST**       Teacher/Assistant ⚙

  **MSG-003**   A message shall never be deliverable to a user outside the sender\'s authorised relationships.                                              **MUST**       System

  **MSG-004**   Attachments in messages shall follow the same validation, scanning and authorization rules as all other files (§14).                        **MUST**       System

  **MSG-005**   The system shall provide reporting of abusive or inappropriate messages by any participant.                                                 **MUST**       System

  **MSG-006**   Authorized Moderation Admins shall review reported communications; access to reported content shall be permission-controlled and audited.   **MUST**       Admin

  **MSG-007**   The system shall support restricting or blocking a communication relationship where policy requires.                                        **SHOULD**     System

  **MSG-008**   Communication metadata shall be auditable; message content shall be accessible only under an authorised moderation or legal process.        **MUST**       System

  **MSG-009**   The platform shall not represent that private messages are manually monitored, because they are not.                                        **MUST**       System

  **MSG-010**   Assistants shall not access conversations outside their assigned scope.                                                                     **MUST**       System
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 27.2 --- Communication requirements.*

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **MSG-009 · DO NOT OVERSTATE MODERATION**                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                               |
| The platform provides reporting, review and enforcement. It does **not** manually monitor every private message, and no requirement, interface text or legal document shall imply that it does. Overstating moderation creates an obligation the product cannot meet and a false sense of safety for parents. |
+===============================================================================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 28. Notifications

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **NOT-001**   Students shall be notified of new activities, activity opening, approaching deadlines, late status, grade release, feedback availability, returned work and cancellation.                                      **MUST**       System

  **NOT-002**   Parents shall be notified of new homework, upcoming deadlines, missing work and grade release for linked children only.                                                                                        **MUST**       System

  **NOT-003**   Teachers shall be notified of new submissions, late submissions, pending grading, deadlines, student completion, parent messages, assistant activity, session changes, storage warnings and security alerts.   **MUST**       System

  **NOT-004**   Assistants shall be notified of submissions, late work, questions, announcements and teacher instructions within assigned scope.                                                                               **MUST**       System

  **NOT-005**   Admins shall be notified of security, platform, business and moderation events per their administrative role.                                                                                                  **MUST**       System

  **NOT-006**   Students shall be notified of achievement awards.                                                                                                                                                              **MUST**       System

  **NOT-007**   The system shall support in-app notifications as the authoritative record of what a user was told.                                                                                                             **MUST**       System

  **NOT-008**   The system shall support email notification for defined categories.                                                                                                                                            **SHOULD**     System

  **NOT-009**   Users shall configure notification preferences per category and channel.                                                                                                                                       **SHOULD**     All

  **NOT-010**   A notification shall never contain data the recipient is not authorised to see.                                                                                                                                **MUST**       System

  **NOT-011**   Notification fan-out shall be scope- and relationship-aware.                                                                                                                                                   **MUST**       System

  **NOT-012**   Security notifications --- new device login, password change, MFA change, email change, recovery change, suspicious activity --- shall always be delivered regardless of preference.                           **MUST**       System

  **NOT-013**   Push and SMS notification are FUTURE and require native clients and consent handling.                                                                                                                          **FUTURE**     System

  **NOT-014**   Notification delivery failure shall be retried and shall never block or roll back the originating transaction.                                                                                                 **MUST**       System
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 28.1 --- Notification requirements.*

# 29. Calendar

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- -----------
  **CAL-001**   The system shall provide a calendar per role combining Teaching Sessions, activity deadlines, quizzes, exams and events within the user\'s authorised scope.   **MUST**       All

  **CAL-002**   Students shall see only their own entitled entries; Parents only their linked children\'s.                                                                     **MUST**       System

  **CAL-003**   Assistants shall see only entries within their assigned scope.                                                                                                 **MUST**       System

  **CAL-004**   Calendar entries shall reflect Session status changes (rescheduled, cancelled, postponed) without losing the original record.                                  **MUST**       System

  **CAL-005**   Calendar export or subscription, if provided, shall use authorised, revocable, per-user links and shall not expose unauthorised entries.                       **SHOULD**     System
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 29.1 --- Calendar requirements.*

# 30. Payments --- Early-Release Model

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **PAY-000 · CONFIRMED · THE EARLY-RELEASE PAYMENT MODEL**                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                            |
| For the early release, **payments are made directly between the Teacher or Assistant and the Student**. The platform does not process money in V1. The platform\'s role is to carry the **evidence**, the **approval** and the resulting **entitlement**, and to make all three auditable. |
|                                                                                                                                                                                                                                                                                            |
| *This is a deliberate, recorded business decision. It is NOT replaced by a payment provider in this version; §30.6 defines the seam that lets a provider be added later without redesign.*                                                                                                 |
+============================================================================================================================================================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

![](media/image21.png){width="6.7in" height="3.381114391951006in"}

*Figure 30.1 --- The early-release payment flow. Access follows approval, never upload.*

## 30.1 Confirmed business rules

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Rule**                                                                                                                                   **Status**
  ------------ ------------------------------------------------------------------------------------------------------------------------------------------ ---------------
  **BR-001**   All payments are made directly between the Teacher/Assistant and the Student.                                                              **CONFIRMED**

  **BR-002**   Payment evidence must be uploaded through the platform for every payment.                                                                  **CONFIRMED**

  **BR-003**   The Teacher or Assistant must review and approve the evidence before the Student receives access to what was paid for.                     **CONFIRMED**

  **BR-004**   Authorized Admins have access to payment evidence.                                                                                         **CONFIRMED**

  **BR-005**   Monthly payments grant access to the platform.                                                                                             **CONFIRMED**

  **BR-006**   Session payments grant access to sessions and their content.                                                                               **CONFIRMED**

  **BR-007**   Refunds are available for all payment types.                                                                                               **CONFIRMED**

  **BR-008**   Session payment refund: **100%**.                                                                                                          **CONFIRMED**

  **BR-009**   Monthly payment refund: **70%**.                                                                                                           **CONFIRMED**

  **BR-010**   A Teacher may convert the monthly payment model to payment-per-cycle, and may customise the price --- including free or any other price.   **CONFIRMED**

  **BR-011**   Miss Selvia receives 10%--15% of the monthly fees students pay to their teachers.                                                          **CONFIRMED**

  **BR-012**   Miss Selvia receives 100% from her own students.                                                                                           **CONFIRMED**

  **BR-013**   Moustafa Mahgoub receives 5,000 EGP plus 10% monthly from Miss Selvia.                                                                     **CONFIRMED**

  **BR-014**   Moustafa Mahgoub receives 6,500 EGP per month from any other teacher.                                                                      **CONFIRMED**
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 30.1 --- Early-release commercial rules, recorded verbatim as business rules. BR-011...014 are revenue-share arrangements, not platform-enforced payment flows --- see PAY-014.*

## 30.2 Requirements

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                 **Priority**   **Actor**
  ------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ---------------------
  **PAY-001**   The system shall record a Payment with payer, beneficiary, type, amount, currency, period and status.                                                                                           **MUST**       System

  **PAY-002**   The system shall support payment types: monthly (platform access), session (session and content access), and per-cycle where the Teacher configures it.                                         **MUST**       System

  **PAY-003**   A payer shall upload payment evidence against a Payment.                                                                                                                                        **MUST**       Student/Parent

  **PAY-004**   Payment evidence shall be stored as a private file subject to §14 validation, scanning and access control.                                                                                      **MUST**       System

  **PAY-005**   The receiving Teacher, or an Assistant explicitly permitted to do so, shall review evidence and approve or reject it with a reason.                                                             **MUST**       Teacher/Assistant ⚙

  **PAY-006**   Entitlement shall be granted only on approval --- never on upload.                                                                                                                              **MUST**       System

  **PAY-007**   Approval shall create an Entitlement scoped to exactly what was paid for, with a start and end.                                                                                                 **MUST**       System

  **PAY-008**   Rejection shall notify the payer with the reason and shall grant no access.                                                                                                                     **MUST**       System

  **PAY-009**   Authorized Admins shall access payment evidence; such access shall be audited.                                                                                                                  **MUST**       Admin

  **PAY-010**   The system shall support refund requests, approval and recording, applying the configured percentage per payment type (BR-008, BR-009).                                                         **MUST**       System

  **PAY-011**   A refund shall revoke or reduce the corresponding Entitlement according to the refund terms.                                                                                                    **MUST**       System

  **PAY-012**   Payment creation, evidence upload, approval, rejection, entitlement grant, refund and evidence access shall all be audited.                                                                     **MUST**       System

  **PAY-013**   A Teacher shall configure their own pricing model, including per-cycle and free.                                                                                                                **MUST**       Teacher

  **PAY-014**   Platform revenue-share arrangements (BR-011...014) shall be recorded as reportable figures for authorized Billing Admins; the platform shall not automatically execute these transfers in V1.   **MUST**       System

  **PAY-015**   The system shall never store raw card numbers or CVV.                                                                                                                                           **MUST**       System

  **PAY-016**   Assistants shall handle payment evidence only where explicitly permitted, and shall never manage subscriptions, plans, refunds policy or billing settings.                                      **MUST**       System
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 30.2 --- Payment requirements.*

## 30.3 Payment states

+-----------------------------------------------------------------------+
| **PAY-006 · Access follows approval, never upload**                   |
|                                                                       |
| AWAITING_EVIDENCE ─▶ EVIDENCE_SUBMITTED ─▶ UNDER_REVIEW               |
|                                                                       |
| │                                                                     |
|                                                                       |
| ┌─────────────────────┴──────────┐                                    |
|                                                                       |
| ▼ ▼                                                                   |
|                                                                       |
| APPROVED REJECTED                                                     |
|                                                                       |
| │ │                                                                   |
|                                                                       |
| ▼ (no entitlement,                                                    |
|                                                                       |
| ENTITLEMENT_ACTIVE payer notified)                                    |
|                                                                       |
| │                                                                     |
|                                                                       |
| ┌─────────────┼──────────────┐                                        |
|                                                                       |
| ▼ ▼ ▼                                                                 |
|                                                                       |
| EXPIRED REFUND_REQUESTED REVOKED                                      |
|                                                                       |
| │                                                                     |
|                                                                       |
| ▼                                                                     |
|                                                                       |
| REFUNDED (100% session · 70% monthly)                                 |
+=======================================================================+
+-----------------------------------------------------------------------+

# 31. Subscriptions, Entitlements & Billing Separation

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-020 · THE FOUR THINGS THAT MUST NOT BE CONFUSED**                                                                                                                                                                  |
|                                                                                                                                                                                                                          |
| **User Role ≠ Payer ≠ Subscription ≠ Entitlement.** A Teacher does not have to be the payer. A Parent may be the payer. An Organization may be the payer. **Payment status never redefines a user\'s educational role.** |
+==========================================================================================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 31.1 Billing capability matrix

⚙ = permitted only if that account is the designated payer or subscription owner.

  ---------------------------------------------------------------------------------------------------
  **Action**                     **Teacher**   **Assistant**   **Student**   **Parent**   **Admin**
  ------------------------------ ------------- --------------- ------------- ------------ -----------
  View own subscription          ⚙             ✖               ✖             ⚙            ⚙

  Make payment                   ⚙             ✖               ✖             ⚙            ✖

  Add / change payment method    ⚙             ✖               ✖             ⚙            ✖

  View invoices                  ⚙             ✖               ✖             ⚙            ⚙

  Cancel subscription            ⚙             ✖               ✖             ⚙            ⚙

  Request refund                 ⚙             ✖               ✖             ⚙            ---

  Approve refund                 ✖             ✖               ✖             ✖            ⚙

  Manage billing settings        ⚙             ✖               ✖             ⚙            ⚙

  Modify subscription plan       ⚙             ✖               ✖             ⚙            ⚙

  Review payment evidence        ✔             ⚙               ✖             ✖            ⚙

  View another user\'s billing   ✖             ✖               ✖             ✖            ⚙ audited
  ---------------------------------------------------------------------------------------------------

*Table 31.1 --- Billing capabilities. The Student is never a billing actor even when they are the one uploading evidence for their own payment --- that is a payment action, not a billing one.*

## 31.2 Requirements

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                              **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **BIL-001**   The system shall model Payer, Subscription and Entitlement as records separate from User Role.                                               **MUST**       System

  **BIL-002**   A user\'s educational role shall never change as a consequence of payment status.                                                            **MUST**       System

  **BIL-003**   A Subscription shall have a designated payer, which may be the user, a Parent, or an Organization.                                           **MUST**       System

  **BIL-004**   Only the designated payer or an authorized Billing Admin shall perform billing actions on a subscription.                                    **MUST**       System

  **BIL-005**   Entitlement shall be derived from payment, subscription or explicit grant, and shall carry its own validity period.                          **MUST**       System

  **BIL-006**   No educational user shall be able to manipulate their own or another user\'s entitlement.                                                    **MUST**       System

  **BIL-007**   Expiry of a subscription or entitlement shall deny new protected-content access while leaving academic history intact and accessible.        **MUST**       System

  **BIL-008**   Subscription state shall include at least: TRIAL · ACTIVE · PAST_DUE · GRACE · CANCELED · EXPIRED · SUSPENDED · REFUNDED.                    **MUST**       System

  **BIL-009**   Billing operations shall be auditable.                                                                                                       **MUST**       System

  **BIL-010**   The architecture shall allow a payment provider to be introduced later behind a payment interface, without changing the Entitlement model.   **MUST**       System
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 31.2 --- Subscription, entitlement and billing separation requirements.*

# 32. Privacy & Data Protection

EduCapsules processes children\'s educational records. Privacy is therefore enforced by architecture (GEN-023), not only by policy.

## 32.1 Data classification

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Level**   **Class**             **Examples**                                                                                                                               **Controls**
  ----------- --------------------- ------------------------------------------------------------------------------------------------------------------------------------------ -------------------------------------------------------------------------------------------
  **1**       Public                Public marketing content, explicitly public announcements                                                                                  Standard web serving

  **2**       Internal              General course information, non-sensitive educational resources                                                                            Authentication required

  **3**       Confidential          Grades · submissions · quiz results · progress · attendance · messages · achievement history · Teacher, Assistant and Parent information   Authorization + scope + relationship + object-level checks; audit on change

  **4**       Highly Confidential   Credentials · password hashes · tokens · payment-related tokens · security logs · recovery information · encryption keys                   Never returned by any API; encrypted; key management; access strictly limited and audited
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 32.1 --- Data classification. Everything a student produces is at minimum Level 3.*

## 32.2 Requirements

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                         **Priority**   **Actor**
  ------------- --------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **PRV-001**   The system shall collect only personal data required by a stated requirement.                                                           **MUST**       System

  **PRV-002**   APIs and interfaces shall return only the fields the requesting role needs.                                                             **MUST**       System

  **PRV-003**   A Student shall access only their own grades, submissions, progress, achievements and messages.                                         **MUST**       System

  **PRV-004**   A Parent shall access only their linked child\'s permitted information.                                                                 **MUST**       System

  **PRV-005**   A Teacher shall not access unrelated Teachers\' private data, students outside their scope, or another Teacher\'s Storage.              **MUST**       System

  **PRV-006**   An Assistant shall access only information within their delegated scope.                                                                **MUST**       System

  **PRV-007**   The system shall define and apply retention periods per data category.                                                                  **MUST**       System

  **PRV-008**   The system shall support data export for a user\'s own data, and for a guardian of a linked child, where legally applicable.            **SHOULD**     System

  **PRV-009**   Deletion shall follow documented policy; educational and audit records may be retained or de-identified rather than destroyed (§43).    **MUST**       System

  **PRV-010**   Real student data shall never be copied into development or staging environments.                                                       **MUST**       System

  **PRV-011**   The platform shall not sell students\' personal information.                                                                            **MUST**       System

  **PRV-012**   Children\'s data shall receive additional protection per the applicable child-privacy requirements, to be confirmed by counsel (§33).   **MUST**       System

  **PRV-013**   Every feature shall answer "who needs to see this data?" before implementation; defaults shall be restrictive (GEN-024).                **MUST**       System
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 32.2 --- Privacy requirements.*

## 32.3 Retention

Retention periods are jurisdiction-dependent and are deliberately marked TBD rather than invented; they are the first item for legal review (§33). **The single authoritative retention schedule is Table 44.3** (§44.3, Account Lifecycle, Retention & Deletion) --- it is not repeated here, so that a future retention decision is recorded once and cannot drift between two copies. *v1.1: this section previously carried its own partial retention table with different category boundaries than §44.3's; it is replaced by this pointer to remove the duplication (Appendix E).*

# 33. Legal & Policy Requirements

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **THIS SECTION SPECIFIES SYSTEM SUPPORT FOR LEGAL DOCUMENTS --- IT IS NOT LEGAL ADVICE**                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                               |
| The policy suite below must be drafted and reviewed by a qualified Egyptian lawyer against applicable Egyptian law, and against the law of every other market EduCapsules serves, before publication. This document specifies only what the **system** must do to support it. |
+===============================================================================================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 33.1 The policy suite

  ------------------------------------------------------------------------------------------------------------------------------------------
  **\#**   **Document**                **Purpose**               **\#**   **Document**                      **Purpose**
  -------- --------------------------- ------------------------- -------- --------------------------------- --------------------------------
  1        Terms of Service            Master agreement          8        Content Protection Policy         Anti-copying and circumvention

  2        Privacy Policy              Data handling             9        Community & Communication Rules   Messaging conduct

  3        Acceptable Use Policy       Prohibited behaviour      10       Child Safety Policy               Minor protection

  4        Student & Parent Terms      Minors and guardians      11       Copyright Reporting Policy        Infringement complaints

  5        Teacher / Assistant Terms   Staff and content         12       Security & Account Policy         Account security

  6        Content & IP Policy         Ownership and licensing   13       Cookie Policy                     If tracking is used

  7        Payment & Refund Policy     Billing and refunds                                                  
  ------------------------------------------------------------------------------------------------------------------------------------------

*Table 33.1 --- The thirteen-document policy suite. Documents cross-reference rather than repeat.*

## 33.2 Ownership positions --- CONFIRMED

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Asset**                           **Position**
  ----------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Teacher content**                 Ownership remains with the Teacher unless otherwise agreed. The Teacher grants EduCapsules the limited licence necessary to host, process, display, deliver to authorised students, back up and secure the content.

  **EduCapsules platform**            EduCapsules owns its software, source code, UI, branding, logos, designs, documentation, platform technology, proprietary systems, algorithms and security systems. Users receive a limited licence to use the platform, not ownership of it.

  **Student content**                 Homework answers, quiz responses, messages, comments and uploads receive a **narrow** platform licence sufficient to operate the service --- not broad ownership.

  **Uploaded third-party material**   The uploading Teacher warrants they hold the necessary rights. The platform provides copyright reporting and takedown (document 11).
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 33.2 --- Intellectual property positions to be reflected in documents 6 and 8.*

## 33.3 System requirements supporting the legal framework

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                                 **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **LEG-001**   The system shall record, for every account, the exact version of each legal document accepted, with user, document, version, timestamp and acceptance type.                                                                     **MUST**       System

  **LEG-002**   The system shall store historical versions of every legal document with effective dates.                                                                                                                                        **MUST**       System

  **LEG-003**   Material changes shall require renewed acceptance where legally required; the system shall support re-acceptance flows.                                                                                                         **MUST**       System

  **LEG-004**   Acceptance of unrelated policies shall not be bundled into a single checkbox where separate consent is required.                                                                                                                **MUST**       System

  **LEG-005**   The system shall prevent a Parent from accessing an unlinked Student (PAR-001).                                                                                                                                                 **MUST**       System

  **LEG-006**   The system shall record unauthorized protected-content access attempts.                                                                                                                                                         **MUST**       System

  **LEG-007**   The system shall support user reporting for abuse, harassment, bullying, inappropriate content, copyright violation, course theft, impersonation, fraud, security violation, spam, technical abuse and child-safety concerns.   **MUST**       System

  **LEG-008**   Each report shall carry id, reporter, target, category, description, evidence, status, assigned Admin, timestamps and resolution.                                                                                               **MUST**       System

  **LEG-009**   The system shall support moderation workflow: NEW → UNDER_REVIEW → INVESTIGATION → ACTION_REQUIRED → RESOLVED, with actions dismiss · warn · restrict · remove · suspend · escalate.                                            **MUST**       Admin

  **LEG-010**   The system shall support evidence preservation for suspected violations, subject to applicable privacy law.                                                                                                                     **MUST**       System

  **LEG-011**   The system shall support account suspension and termination, distinguishing temporary restriction from permanent termination.                                                                                                   **MUST**       Admin

  **LEG-012**   The system shall support an appeal mechanism for account actions.                                                                                                                                                               **SHOULD**     System

  **LEG-013**   The system shall provide a security-vulnerability reporting channel.                                                                                                                                                            **SHOULD**     System

  **LEG-014**   No system message, interface text or policy shall claim that data cannot be breached or that content cannot be copied.                                                                                                          **MUST**       System

  **LEG-015**   The system shall support recording of guardian consent where required for minors.                                                                                                                                               **MUST**       System
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 33.3 --- Legal-support requirements.*

## 33.4 Prohibited conduct the system must be able to detect or record

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Category**                 **Examples**                                                                                                                            **System support**
  ---------------------------- --------------------------------------------------------------------------------------------------------------------------------------- -------------------------------------------------
  **Content theft**            Downloading, copying, recording, redistributing or selling protected content; circumventing DRM, watermarks, viewers or access tokens   CNT-020...024, LEG-006, audit

  **Technical abuse**          Scraping, bots, bulk API requests, automated downloading, reverse-engineering APIs, circumventing rate limits                           CNT-019, CNT-020, SEC rate limiting

  **Security circumvention**   Bypassing authentication or authorization, token manipulation, privilege escalation, exploiting vulnerabilities                         §34 controls, SecurityEvent

  **Account abuse**            Credential sharing, impersonation, fraudulent accounts, subscription abuse                                                              AUTH-113, concurrent-session control, reporting

  **Academic abuse**           Cheating, impersonating another student, manipulating grades, submitting another\'s work                                                GRD-005, audit, reporting

  **Child safety**             Grooming, solicitation, harassment, bullying, threats, extortion, harmful content                                                       LEG-007...010, moderation workflow
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 34. Security Architecture

Security is a core system requirement, not a feature. The architecture uses defense in depth, least privilege, zero trust, RBAC, scope-based authorization and object-level authorization together --- no single mechanism is trusted on its own.

![](media/image22.png){width="6.2in" height="4.314068241469816in"}

*Figure 34.1 --- The security layers. Every request passes through all of them.*

## 34.1 Security objectives

  -------------------------------------------------------------------------------------------------------
  **Objective**         **Meaning in EduCapsules**
  --------------------- ---------------------------------------------------------------------------------
  **Confidentiality**   No user reaches data outside their role, scope, relationship and entitlement

  **Integrity**         Grades, submissions, attendance and audit records cannot be silently altered

  **Availability**      Legitimate users can teach and learn; abuse controls do not lock out real users

  **Authenticity**      Users and services are properly authenticated before any decision is made

  **Authorization**     Users perform only actions they are explicitly permitted to perform

  **Accountability**    Every consequential action is attributable to an actor and a time

  **Privacy**           Personal and educational information is exposed only when necessary

  **Resilience**        A security failure does not destroy educational data
  -------------------------------------------------------------------------------------------------------

## 34.2 Requirements

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                                                 **Priority**   **Actor**
  ------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **SEC-020**   Every scoped query shall be constrained by the caller\'s organization.                                                                                                                                                                          **MUST**       System

  **SEC-021**   All application traffic shall use HTTPS/TLS with modern configuration; HTTP shall redirect or be disabled.                                                                                                                                      **MUST**       System

  **SEC-022**   Sensitive data shall be encrypted at rest, including database storage, object storage and backups.                                                                                                                                              **MUST**       System

  **SEC-023**   Passwords shall be stored only as hashes using a modern memory-hard algorithm (Argon2id preferred; bcrypt acceptable) with unique salts and an appropriate work factor.                                                                         **MUST**       System

  **SEC-024**   Passwords shall never appear in logs or API responses.                                                                                                                                                                                          **MUST**       System

  **SEC-025**   All external input shall be validated for type, length, format, range, allowed values, relationships, file type and size before use.                                                                                                            **MUST**       System

  **SEC-026**   Database access shall use parameterised queries or a safe data-access layer; SQL shall never be constructed from raw user input.                                                                                                                **MUST**       System

  **SEC-027**   User-generated content shall be sanitised and safely encoded on output; the application shall apply a strong Content Security Policy.                                                                                                           **MUST**       System

  **SEC-028**   State-changing requests shall be protected against CSRF where cookie-based authentication is used.                                                                                                                                              **MUST**       System

  **SEC-029**   CORS shall permit only explicitly authorized origins; wildcard origins shall not be used for authenticated APIs.                                                                                                                                **MUST**       System

  **SEC-030**   The system shall defend against and be tested for broken access control, cryptographic failures, injection, insecure design, misconfiguration, vulnerable components, authentication failures, integrity failures, logging failures and SSRF.   **MUST**       System

  **SEC-031**   Rate limiting shall protect login, password reset, OTP, file upload, messaging, search, content delivery and public endpoints, without being so aggressive that legitimate users are easily locked out.                                         **MUST**       System

  **SEC-032**   The system shall defend against brute force and credential stuffing using rate limiting, progressive delays, MFA and suspicious-login detection.                                                                                                **MUST**       System

  **SEC-033**   Uploaded files shall be validated and malware-scanned in quarantine before becoming available to other users.                                                                                                                                   **MUST**       System

  **SEC-034**   Secrets shall never be committed to source control, embedded in client bundles, or stored in plaintext; a secrets/key-management system shall be used.                                                                                          **MUST**       System

  **SEC-035**   Encryption keys shall have controlled access, defined rotation and recovery procedures.                                                                                                                                                         **MUST**       System

  **SEC-036**   The database shall not be publicly accessible and shall accept connections only from authorized application infrastructure, using least-privilege accounts.                                                                                     **MUST**       System

  **SEC-037**   Production errors shall not expose queries, stack traces, internal paths, secrets or infrastructure details (§40).                                                                                                                              **MUST**       System

  **SEC-038**   The application shall set appropriate security headers, including HSTS, CSP, X-Content-Type-Options, Referrer-Policy and clickjacking protection.                                                                                               **MUST**       System

  **SEC-039**   Infrastructure shall provide DDoS protection and network segmentation; the database and backups shall not be directly exposed to the internet.                                                                                                  **MUST**       System

  **SEC-040**   Dependencies shall be version-controlled, regularly updated and vulnerability-scanned in CI.                                                                                                                                                    **MUST**       System

  **SEC-041**   Backups shall be encrypted, access-controlled, isolated, versioned and restore-tested.                                                                                                                                                          **MUST**       System

  **SEC-042**   Development and staging shall use synthetic or anonymised data and shall be isolated from production credentials.                                                                                                                               **MUST**       System

  **SEC-043**   The system shall support a documented incident response process: detect → contain → investigate → eradicate → recover → review → improve.                                                                                                       **MUST**       Admin

  **SEC-044**   On suspected account compromise the system shall support session revocation, credential reset, forced re-authentication, MFA enforcement and audit review.                                                                                      **MUST**       System

  **SEC-045**   Security testing shall include dependency scanning, static analysis, secret scanning, API security tests, and manual authorization, authentication, file-upload and multi-tenant isolation testing.                                             **MUST**       QA
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 34.1 --- Security architecture requirements.*

## 34.3 Threat model

  -------------------------------------------------------------------------------------------------------------------------------------------------
  **Threat**                     **Realistic form in EduCapsules**                                         **Countered by**
  ------------------------------ ------------------------------------------------------------------------- ----------------------------------------
  IDOR / BOLA                    A student changes an ID to read another student\'s grades or submission   GEN-025, SEC-005, SEC-009, TC-001

  Horizontal escalation          An Assistant reaches a class outside their assignment                     GEN-006, AST-002, TC-002

  Vertical escalation            An Assistant grants themselves permissions or becomes a Teacher           SEC-006, AST-004, TC-003

  Unauthorized parent access     Someone claims to be a child\'s parent, or a link code is forwarded       PAR-002, LEG-005, TC-004

  Answer-key disclosure          A student reads correct answers from a quiz API response                  GEN-026, QBN-039, TC-011

  Content theft                  Bulk downloading or scraping a paid course                                CNT-012...024, GEN-016, TC-008

  Storage enumeration            Guessing file identifiers or storage URLs                                 STR-015, CNT-012, TC-007

  Cross-tenant leakage           One Organization reads another\'s data                                    ORG-003, SEC-020, TC-005

  Session hijacking / fixation   Stolen or reused session credentials                                      AUTH-104, AUTH-110, AUTH-115, AUTH-119

  Credential attacks             Password reuse and stuffing against student accounts                      SEC-023, SEC-032, AUTH-111

  Grade tampering                A grade changed without trace                                             GRD-005, GRD-006, AUD-003

  Malware upload                 A malicious file distributed to a class                                   SEC-033, STR-007

  Insider access                 An Admin reads private records with no legitimate need                    ADM-025, ADM-027, AUD-007

  Data loss near a deadline      A submission lost during an outage                                        ACT-035, NFR-002
  -------------------------------------------------------------------------------------------------------------------------------------------------

*Table 34.2 --- The threats this specification is written against, and where each is addressed.*

## 34.4 Security risk priorities

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Priority**   **Areas**
  -------------- -------------------------------------------------------------------------------------------------------------------------------------------------------
  **Critical**   Authorization and access control · student privacy · parent--child relationships · authentication · database security · file access · grade integrity

  **High**       Encryption · backup security · audit logging · API security · account recovery · multi-tenant isolation · content protection

  **Medium**     DDoS protection · security analytics · advanced anomaly detection
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 35. Authentication & Login Sessions

A **Login Session** is a controlled, authenticated period during which a user is authorized to interact with EduCapsules. It is not a Teaching Session (§3.2). A session proves \*who\* is authenticated; it decides nothing about \*what\* they may do (SEC-003).

## 35.1 Session types

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Type**                        **For**                                     **Policy**
  ------------------------------- ------------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------
  Standard user session           Student · Parent · Teacher · Assistant      Normal idle and absolute timeouts

  Admin session                   All administrative roles                    Mandatory MFA, shorter timeouts, stronger monitoring, re-authentication for sensitive actions

  Elevated session                Any role performing a sensitive operation   Short-lived, requires re-authentication; used for password/MFA change, security settings, sensitive admin and billing operations

  Support impersonation session   Support Admin, if enabled                   Temporary, explicitly authorized, reason-required, visibly indicated, fully logged, sensitive actions restricted

  Content access session          Protected content delivery                  Short lifetime, scoped to resource, optionally device-bound, rate-limited, watermark identity, concurrent-playback limited
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 35.1 --- Session types. The content access session is deliberately separate from the account session --- this is what makes a stolen content URL useless.*

## 35.2 Requirements

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**         **Requirement**                                                                                                                                                                                                                        **Priority**   **Actor**
  -------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **AUTH-101**   The system shall create an authenticated session only after successful authentication.                                                                                                                                                 **MUST**       System

  **AUTH-102**   Session credentials shall be generated using cryptographically secure randomness.                                                                                                                                                      **MUST**       System

  **AUTH-103**   The system shall never store plaintext passwords or plaintext long-lived session credentials.                                                                                                                                          **MUST**       System

  **AUTH-104**   The system shall support session expiration with configurable idle and absolute timeouts per role.                                                                                                                                     **MUST**       System

  **AUTH-105**   The system shall support server-side session revocation.                                                                                                                                                                               **MUST**       System

  **AUTH-106**   The system shall support logout of the current session.                                                                                                                                                                                **MUST**       All

  **AUTH-107**   The system shall support revocation of all active sessions.                                                                                                                                                                            **MUST**       All

  **AUTH-108**   Users shall see their active sessions and devices with platform, last activity and approximate location.                                                                                                                               **MUST**       All

  **AUTH-109**   Users shall revoke individual sessions.                                                                                                                                                                                                **MUST**       All

  **AUTH-110**   The system shall rotate or invalidate session credentials after authentication events, and shall not reuse a pre-authentication session as an authenticated one.                                                                       **MUST**       System

  **AUTH-111**   Session credentials shall never appear in URLs or logs.                                                                                                                                                                                **MUST**       System

  **AUTH-112**   Authorization shall be enforced independently of session validity.                                                                                                                                                                     **MUST**       System

  **AUTH-113**   Administrative sessions shall apply stricter controls than ordinary sessions.                                                                                                                                                          **MUST**       System

  **AUTH-114**   The system shall record security-relevant session events (§36.2).                                                                                                                                                                      **MUST**       System

  **AUTH-115**   The system shall detect and respond to refresh-token or session-token reuse.                                                                                                                                                           **MUST**       System

  **AUTH-116**   The system shall support MFA for roles requiring elevated security, and shall require it for administrative accounts.                                                                                                                  **MUST**       System

  **AUTH-117**   Suspending an account shall terminate or restrict its sessions.                                                                                                                                                                        **MUST**       System

  **AUTH-118**   The system shall prevent cross-user and cross-tenant session access.                                                                                                                                                                   **MUST**       System

  **AUTH-119**   Changing a password shall revoke existing sessions and establish a new trusted session.                                                                                                                                                **MUST**       System

  **AUTH-120**   Protected content shall require additional authorization beyond a valid account session (§16).                                                                                                                                         **MUST**       System

  **AUTH-121**   The system shall support email/password authentication, verified email, secure password reset with short-lived single-use tokens, and account recovery.                                                                                **MUST**       System

  **AUTH-122**   Password reset and account-existence responses shall not reveal whether an email address is registered.                                                                                                                                **MUST**       System

  **AUTH-123**   The system shall support concurrent-session limits configurable per role, plan and protection level.                                                                                                                                   **SHOULD**     System

  **AUTH-124**   The system shall evaluate session risk signals --- new device, unusual location, impossible travel, abnormal request volume, rapid content extraction, repeated authorization failures, token reuse --- and respond proportionately.   **SHOULD**     System

  **AUTH-125**   Browser sessions shall use Secure, HttpOnly, SameSite cookies where the architecture permits.                                                                                                                                          **MUST**       System

  **AUTH-126**   Passkeys, hardware security keys and enterprise SSO are FUTURE.                                                                                                                                                                        **FUTURE**     System

  **AUTH-127**   Where MFA is enabled or required, the system shall provide a defined recovery path (single-use backup codes issued at enrolment, or admin-assisted reset after identity verification) so that a lost MFA factor cannot permanently lock a user out of their own account. Recovery-code use and admin-assisted MFA reset shall each raise a security-relevant audit event (§36) and a notification per NOT-012. **MUST**  System
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 35.2 --- Authentication and login-session requirements. These are the former SES-001...020 plus the additions required by §34; the mapping is in §51.2. AUTH-127 added in v1.1: AUTH-116 mandates MFA but v1.0 specified no recovery path for a lost factor (Appendix E).*

## 35.3 Session timeouts

  ------------------------------------------------------------------------------------------------
  **Role**                  **Idle timeout**          **Absolute timeout**      **Status**
  ------------------------- ------------------------- ------------------------- ------------------
  **Student · Parent**      Longer of the two bands   Longer of the two bands   TBD --- §50 D-14

  **Teacher · Assistant**   Medium                    Medium                    TBD

  **Admin**                 Shortest                  Shortest                  TBD
  ------------------------------------------------------------------------------------------------

*Table 35.3 --- Indicative bands from the source material were 30--60 min idle / 7--30 days absolute for students and 10--20 min / 8--12 hours for admins. Final values are set during security testing (§50, D-14) rather than fixed here.*

# 36. Audit, Logging & Monitoring

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-018 / GEN-021 · WHAT THE AUDIT TRAIL IS FOR**                                                                                                                                                                                          |
|                                                                                                                                                                                                                                              |
| The audit trail exists to answer, months later: **who did what, to whose record, when, and why.** It is separate from application logging --- application logs are for engineers and are disposable; audit records are evidence and are not. |
+==============================================================================================================================================================================================================================================+
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 36.1 Requirements

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                                                                              **Priority**   **Actor**
  ------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **AUD-001**   The system shall record an audit event for every security- or record-significant action.                                                                                                                                                                                     **MUST**       System

  **AUD-002**   An audit event shall capture actor, actor role, action, target type and identifier, organization and scope, outcome, timestamp, reason where applicable, before/after values where applicable, device/IP/session metadata where appropriate, and a correlation identifier.   **MUST**       System

  **AUD-003**   Grade changes shall record old value, new value, actor, time and reason.                                                                                                                                                                                                     **MUST**       System

  **AUD-004**   Audit records shall be append-only and tamper-resistant; no user, including any Admin, shall modify or delete them through any interface.                                                                                                                                    **MUST**       System

  **AUD-005**   Audit records shall remain attributable after an account is deactivated or deleted.                                                                                                                                                                                          **MUST**       System

  **AUD-006**   Authorized Admins shall query audit records by actor, target, action, scope and date range.                                                                                                                                                                                  **MUST**       Admin

  **AUD-007**   Exceptional access to private data shall raise a high-severity audit event.                                                                                                                                                                                                  **MUST**       System

  **AUD-008**   Users shall be able to see their own relevant security events (login history, device activity, security alerts).                                                                                                                                                             **SHOULD**     All

  **AUD-009**   Application logs shall never contain credentials, tokens, or complete personal records.                                                                                                                                                                                      **MUST**       System

  **AUD-010**   The system shall monitor repeated failed logins, unusual login patterns, excessive API requests, repeated authorization failures, suspicious uploads, unusual account activity and unexpected administrative actions.                                                        **MUST**       System
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 36.1 --- Audit and logging requirements.*

## 36.2 Audited events

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Domain**              **Events**
  ----------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Authentication**      LOGIN_SUCCESS · LOGIN_FAILED · LOGOUT · SESSION_CREATED · SESSION_REFRESHED · SESSION_REVOKED · SESSION_EXPIRED · ALL_SESSIONS_REVOKED · NEW_DEVICE_LOGIN · MFA_CHALLENGE · MFA_SUCCESS · MFA_FAILED · PASSWORD_CHANGED · SUSPICIOUS_SESSION · TOKEN_REUSE_DETECTED · ACCOUNT_LOCKED

  **Access control**      ROLE_GRANTED / REVOKED · PERMISSION_GRANTED / REVOKED · ASSISTANT_ASSIGNED / MODIFIED / EXPIRED / REVOKED · PARENT_LINK_REQUESTED / CONFIRMED / REVOKED

  **Academic**            GRADE_CREATED / UPDATED / RELEASED · ATTENDANCE_RECORDED / CHANGED · ACTIVITY_PUBLISHED / CLOSED / CANCELED · ACHIEVEMENT_AWARDED / REVOKED · POINTS_ADJUSTED · MEMBERSHIP_CHANGED

  **Content & storage**   FILE_UPLOADED / DOWNLOADED / DELETED / RESTORED / SHARED · CONTENT_PUBLISHED / UNPUBLISHED · CONTENT_ACCESSED · CONTENT_ABUSE_DETECTED · STORAGE_PERMISSION_CHANGED

  **Commercial**          PAYMENT_RECORDED · EVIDENCE_UPLOADED · EVIDENCE_APPROVED / REJECTED · ENTITLEMENT_GRANTED / REVOKED · REFUND_REQUESTED / APPROVED · SUBSCRIPTION_CHANGED

  **Administration**      USER_SUSPENDED / RESTORED · ADMIN_ACTION · IMPERSONATION_STARTED / ENDED · PRIVATE_DATA_ACCESSED · SYSTEM_CONFIG_CHANGED · REPORT_RESOLVED

  **Legal**               POLICY_ACCEPTED · CONSENT_RECORDED · DATA_EXPORTED · DELETION_REQUESTED / EXECUTED
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 36.2 --- The audited event catalogue, consolidated across all source specifications.*

# 37. Data Model & Database Requirements

This section defines the *logical* data model. It is normative for entity identity, relationships, ownership and invariants. Physical concerns --- index strategy, partitioning, engine-specific types --- are architecture decisions constrained by, but not fixed in, this SRS (**GEN-013**).

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **DB-000 --- MODELLING DISCIPLINE**                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                          |
| Not every concept in this document becomes a table. Where a normalised structure, a typed column, a JSON document column or a derived projection expresses the concept more cleanly, the implementation shall use it. What is normative here is: the *entity set*, the *relationships*, the *ownership boundaries* and the *invariants*. |
|                                                                                                                                                                                                                                                                                                                                          |
| *Status: CONFIRMED · Source: Master prompt, \'Do not blindly create every entity as a table\'*                                                                                                                                                                                                                                           |
+==========================================================================================================================================================================================================================================================================================================================================+
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 37.1 Data model principles

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**       **Principle**                                                       **Consequence**
  ------------ ------------------------------------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **DB-001**   Every scoped row carries organization_id                            Tenant isolation is enforced at the query layer and by database constraint, not by application convention alone. Composite FKs include organization_id so a cross-tenant reference is structurally impossible.

  **DB-002**   Surrogate primary keys, opaque and non-guessable externally         Internal keys may be integer or UUID. Any identifier exposed in a URL, an API response or a share link shall be non-sequential (UUIDv7 or ULID) so that resource enumeration is not possible.

  **DB-003**   Soft delete for user-visible academic and content records           deleted_at / deleted_by / deletion_reason. Hard delete is reserved for the erasure pipeline (§44) and for transient technical rows.

  **DB-004**   Immutable audit tables                                              AuditLog, GradeHistory, ContentAccessEvent, SecurityEvent, PaymentEvent are append-only. No UPDATE or DELETE grant is issued to the application role on these tables.

  **DB-005**   Historical academic facts are snapshotted, never recomputed         A released grade, an awarded achievement and a recorded attendance mark retain the values, scales and criteria that were in force when they were created (**GEN-018**).

  **DB-006**   Versioned content is copy-on-write                                  QuestionVersion, FileVersion and LessonVersion create a new row; the prior row is never mutated. Consumers pin a version id.

  **DB-007**   Portable types only                                                 No vendor-proprietary column types in the core schema. Timestamps are UTC with explicit timezone semantics; money is integer minor units plus an ISO-4217 currency code; text is UTF-8.

  **DB-008**   All timestamps are UTC; presentation timezone is a user attribute   created_at / updated_at on every mutable table. Academic due dates additionally store the organisation timezone in force so that a later timezone change does not retroactively move a past deadline.

  **DB-009**   Referential integrity is declared, not assumed                      Foreign keys are declared in the schema. Where the MVP platform has weaker FK support, the constraints are still declared and additionally enforced in the data-access layer, so the production schema is a superset, not a rewrite.

  **DB-010**   No business logic in database triggers                              Triggers are permitted only for audit capture and updated_at maintenance. Educational rules live in the application layer so they remain testable and portable (**GEN-013**).
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 37.1 --- Normative data-model principles.*

## 37.2 Consolidated entity--relationship model

Figure 37.1 shows the complete entity set grouped into six ownership bands. Cardinality is shown on the connectors; a solid connector is a mandatory relationship, a dashed connector is optional or conditional.

**Figure 37.1 --- Consolidated Entity--Relationship Model**

![](media/image23.png){width="8.026665573053368in" height="6.019998906386702in"}

*Figure 37.1 --- EduCapsules consolidated entity--relationship model. Six bands: identity & tenancy, academic structure, delivery & assessment, content & storage, engagement, and commercial & governance. Cross-band references always carry organization_id.*

## 37.3 Entity catalogue

Each entity is listed with its owner band, its identity rule and the invariant that the implementation must guarantee. *Key attributes* is indicative, not exhaustive.

### 37.3.1 Identity, tenancy and access control

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Entity**                **Key attributes**                                                                                                                       **Invariant**
  ------------------------- ---------------------------------------------------------------------------------------------------------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Organization**          id, name, slug, timezone, locale, academic_year_policy, status, plan_id                                                                  Root of every scope chain. Deleting an Organization is a lifecycle operation (§44), never a cascade delete.

  **User**                  id, organization_id, email, phone, password_hash, status, locale, timezone, mfa_enabled, created_at                                      email is unique per organization, not globally. A natural person with accounts in two organisations has two User rows and no shared credential.

  **UserProfile**           user_id, display_name, avatar_file_id, bio, contact_preferences                                                                          Separated from User so that authentication data and profile data have different access policies and different retention rules.

  **Role**                  id, organization_id (nullable for system roles), key, name, is_system                                                                    System roles (STUDENT, TEACHER, ASSISTANT, PARENT, ADMIN\*) are immutable. Custom roles are organisation-scoped.

  **Permission**            id, key, category, is_delegatable, description                                                                                           Global catalogue (§26). Rows are created by migration, never by end users.

  **RolePermission**        role_id, permission_id                                                                                                                   Defines the role\'s baseline. A grant here never exceeds the role\'s ceiling.

  **UserRoleAssignment**    id, organization_id, user_id, role_id, scope_type, scope_id, granted_by, valid_from, valid_until, status                                 A user holds a role *within a scope*. The same user may be TEACHER in one Subject and STUDENT in another. scope_type ∈ {ORG, CLASSROOM, GROUP, SUBJECT, COURSE}.

  **PermissionGrant**       id, organization_id, grantee_user_id, permission_id, scope_type, scope_id, granted_by, reason, valid_from, valid_until, revoked_at       Explicit fine-grained grant, chiefly used for assistant delegation. Cannot grant a permission the grantor does not itself hold in an equal-or-wider scope (**GEN-025**).

  **AssistantAssignment**   id, organization_id, assistant_user_id, teacher_user_id, scope_type, scope_id, permission_set, valid_from, valid_until, status           The delegation record. Expiry is enforced at authorisation time, not by a nightly job (**AST-007**).

  **ParentLink**            id, organization_id, parent_user_id, student_user_id, relationship, confirmed_at, confirmed_by, revoked_at, status                       A parent sees a student only through a CONFIRMED link. An unconfirmed link grants nothing (**PAR-002**).

  **LoginSession**          id, user_id, device_fingerprint, ip_hash, user_agent, session_type, issued_at, last_seen_at, expires_at, revoked_at, revocation_reason   Distinct from TeachingSession (§3.2). Revocation is immediate and server-side (**AUTH-118**).

  **MfaFactor**             id, user_id, type, secret_ref, verified_at, last_used_at, status                                                                         Secret material is stored in the secret manager; the table stores a reference, never the secret itself.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 37.2 --- Identity, tenancy and access-control entities.*

### 37.3.2 Academic structure

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Entity**           **Key attributes**                                                                                               **Invariant**
  -------------------- ---------------------------------------------------------------------------------------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **AcademicPeriod**   id, organization_id, name, starts_on, ends_on, status                                                            Enrolment, grading scales and leaderboard windows are bound to a period so historical data does not blend across years.

  **Classroom**        id, organization_id, name, grade_level, academic_period_id, homeroom_teacher_id, status                          The administrative unit a student belongs to. A student has exactly one active Classroom per AcademicPeriod (**BR-015**).

  **Group**            id, organization_id, classroom_id (not nullable), name, purpose, status                                          A subdivision of exactly one Classroom (GEN-008, GRP-001); classroom_id is mandatory. *v1.1: this row previously allowed a nullable classroom_id for an organisation-wide, cross-classroom Group, directly contradicting the confirmed golden rule GEN-008 and GRP-001. Corrected to match the confirmed rule rather than the reverse, since GEN-008 is an architectural invariant (§4) and no conflicting decision for it was ever recorded in §1.4 (Appendix E). A working set that must span multiple Classrooms is out of this model; §51 D-15-style scope extensions are the place to raise it if a real need appears.*

  **Membership**       id, organization_id, user_id, container_type, container_id, role_in_container, joined_at, left_at, status        Single polymorphic membership table for Classroom and Group. left_at is set rather than the row deleted, so historical attribution survives (**GEN-018**).

  **Subject**          id, organization_id, name, code, description, status                                                             The academic discipline (e.g. Mathematics). Subjects are organisation-level; they are not owned by an individual teacher.

  **Course**           id, organization_id, subject_id, title, description, owner_teacher_id, academic_period_id, visibility, status    A taught instance of a Subject, owned by one teacher. Co-teachers are modelled as UserRoleAssignment rows scoped to the Course, not as additional owner columns.

  **CourseAudience**   id, course_id, target_type, target_id                                                                            Which classrooms and groups the course serves. Replaces a single classroom_id so a course can serve several groups without duplication.

  **Cycle**            id, organization_id, course_id, title, sequence_no, starts_on, ends_on, status                                   An ordered teaching block within a Course. sequence_no is unique per course.

  **Topic**            id, organization_id, cycle_id, title, sequence_no, learning_objectives, status                                   The smallest planned academic unit. Activities and lesson content attach here.

  **Enrollment**       id, organization_id, student_user_id, course_id, academic_period_id, enrolled_at, withdrawn_at, status, source   Distinct from Membership: membership is structural, enrolment is academic. Withdrawal preserves the row and all grades earned (**BR-015**).
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 37.3 --- Academic structure entities.*

### 37.3.3 Delivery, assessment and results

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Entity**             **Key attributes**                                                                                                                                                                                                            **Invariant**
  ---------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  **TeachingSession**    id, organization_id, course_id, cycle_id, topic_id, title, scheduled_start, scheduled_end, mode, location, status, conducted_by                                                                                               A scheduled meeting. Cancelling a session does not delete attendance already recorded; the records are marked VOID with a reason (**SES-014**).

  **AttendanceRecord**   id, organization_id, teaching_session_id, student_user_id, state, recorded_by, recorded_at, note                                                                                                                              state ∈ {PRESENT, ABSENT, LATE, EXCUSED, VOID}. Any change writes an AttendanceHistory row; the current row always reflects the latest state.

  **Activity**           id, organization_id, course_id, cycle_id, topic_id, type, title, instructions, max_score, weight, opens_at, due_at, closes_at, late_policy, attempt_limit, time_limit_seconds, grading_mode, visibility, status, created_by   The single generic container. Homework, Quiz and Exam are *values of type*, not separate tables (**ACT-001**). Fields not meaningful for a given type are null.

  **ActivityTarget**     id, activity_id, target_type, target_id                                                                                                                                                                                       target_type ∈ {CLASSROOM, GROUP, STUDENT}. An activity with no target row is not assigned to anyone and cannot open (**ACT-009**).

  **ActivityQuestion**   id, activity_id, question_version_id, sequence_no, points, is_required                                                                                                                                                        Pins a *version*, not a question. Editing the bank question afterwards cannot alter a published assessment (**QBN-025**).

  **Question**           id, organization_id, subject_id, topic_tag, type, difficulty, owner_user_id, visibility, status                                                                                                                               The stable identity of a bank item. Carries no content; content lives in versions.

  **QuestionVersion**    id, question_id, version_no, stem, media_refs, options, answer_key, explanation, created_by, created_at, status                                                                                                               Immutable once referenced by a published activity. answer_key is never serialised to a student-facing response (**GEN-026**).

  **Submission**         id, organization_id, activity_id, student_user_id, attempt_no, started_at, submitted_at, is_late, state, autosave_ref                                                                                                         Unique on (activity_id, student_user_id, attempt_no). attempt_no ≤ Activity.attempt_limit.

  **SubmissionAnswer**   id, submission_id, activity_question_id, response, auto_score, manual_score, grader_comment, graded_by, graded_at                                                                                                             Auto and manual scores are stored separately so an override is visible, not destructive.

  **SubmissionFile**     id, submission_id, file_id, original_name, uploaded_at                                                                                                                                                                        References the file layer (§37.3.4); submission storage is not a separate storage system.

  **Grade**              id, organization_id, activity_id, student_user_id, submission_id, raw_score, max_score, scaled_score, grading_scale_snapshot, state, released_at, released_by                                                                 state ∈ {DRAFT, PENDING_REVIEW, RELEASED, VOID}. A student sees only RELEASED (**GRD-006**).

  **GradeHistory**       id, grade_id, previous_values, new_values, changed_by, changed_at, reason                                                                                                                                                     Append-only. Every change after first release requires a reason (**GRD-009**).

  **Feedback**           id, organization_id, target_type, target_id, author_user_id, body, visibility, created_at                                                                                                                                     Feedback can attach to a submission, an answer or a student-in-course, with independent visibility.

  **ProgressSnapshot**   id, organization_id, student_user_id, scope_type, scope_id, computed_at, completion_pct, components                                                                                                                           A derived projection, rebuildable from source rows. Never the system of record (**PRG-006**).
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 37.4 --- Delivery, assessment and results entities.*

### 37.3.4 Content, files and protection

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Entity**               **Key attributes**                                                                                                         **Invariant**
  ------------------------ -------------------------------------------------------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------
  **StorageObject**        id, sha256, byte_size, mime_type, storage_backend, storage_key, created_at, refcount                                       The physical blob, private and never publicly addressable. Deduplicated by sha256 *across tenants*, invisibly: the shared object carries no tenant identity itself, and every File row pointing at it keeps its own organization_id, owner and access rules (**STR-IMP-011, STR-IMP-012**). *v1.1: this row previously said cross-tenant deduplication was prohibited, directly contradicting the confirmed design in §14.4; corrected to match §14.4, which is the fuller and earlier-stated decision (Appendix E).*

  **File**                 id, organization_id, owner_user_id, folder_id, display_name, current_version_id, protection_level, status, deleted_at      The logical, user-visible file. Renaming or moving touches this row only.

  **FileVersion**          id, file_id, version_no, storage_object_id, created_by, created_at, note                                                   Copy-on-write. Restoring an old version creates a new version pointing at the old StorageObject (**STR-014**).

  **FileReference**        id, file_id, referrer_type, referrer_id, created_at                                                                        Every use of a file by a lesson, activity, submission or message. A File with live references cannot be hard-deleted (**STR-023**).

  **Folder**               id, organization_id, owner_user_id, parent_folder_id, name, path_cache, status                                             Teacher-private by default. Sharing is a permission grant, never a copy.

  **ContentItem**          id, organization_id, topic_id, type, title, body, file_id, sequence_no, protection_level, visibility, publish_at, status   Published learning material. protection_level ∈ {0,1,2,3} per §16.

  **ContentAccessGrant**   id, content_item_id, principal_type, principal_id, valid_from, valid_until                                                 Who may open the item, over and above the course audience. Evaluated by the Content Gateway on every request.

  **ContentAccessEvent**   id, organization_id, content_item_id, user_id, login_session_id, ip_hash, device_fingerprint, action, occurred_at          Append-only. Feeds anomaly detection (**CNT-026**). Retained per §32.

  **ContentAbuseSignal**   id, organization_id, user_id, content_item_id, signal_type, score, detected_at, resolution                                 Never an automatic punishment; it raises a case for human review (**CNT-029**).

  **Watermark**            id, content_access_event_id, payload_hash, issued_at                                                                       Lets a leaked artefact be traced back to a viewing event without embedding personal data in the artefact itself.
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 37.5 --- Content, file and protection entities.*

### 37.3.5 Engagement, communication and commerce

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Entity**                   **Key attributes**                                                                                                                                                               **Invariant**
  ---------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------
  **Achievement**              id, organization_id, key, name, description, icon_ref, category, criteria, points_value, scope_type, scope_id, created_by, status                                                criteria is a declarative rule document, not code. Editing criteria never retroactively revokes awards (**ACH-007**).

  **AchievementAward**         id, organization_id, achievement_id, student_user_id, awarded_at, awarded_by, criteria_snapshot, revoked_at, revocation_reason                                                   Append-and-revoke, never delete. The snapshot preserves why it was earned.

  **PointsLedger**             id, organization_id, student_user_id, delta, reason_type, reason_ref, scope_type, scope_id, created_by, created_at                                                               A student\'s balance is the *sum of the ledger*, never a stored mutable counter (**PTS-003**).

  **LeaderboardConfig**        id, organization_id, scope_type, scope_id, metric, window, visibility_mode, tie_rule, is_enabled, configured_by                                                                  Leaderboards are off unless explicitly enabled for a scope (**LDB-009**).

  **Conversation / Message**   id, organization_id, context_type, context_id, participants, body, attachments, sent_at, edited_at, deleted_at, moderation_state                                                 Every conversation exists inside an educational context. There is no open student-to-student direct messaging in V1 (**MSG-004**).

  **Notification**             id, organization_id, user_id, type, payload, channel, created_at, delivered_at, read_at, dismissed_at                                                                            A notification never contains data the recipient is not authorised to see; it carries a reference, and authorisation is re-checked on open (**NOT-011**).

  **NotificationPreference**   user_id, type, channel, is_enabled                                                                                                                                               Security and legal notifications cannot be disabled (**NOT-012**).

  **CalendarEvent**            id, organization_id, source_type, source_id, title, starts_at, ends_at, visibility_scope                                                                                         Mostly a projection of TeachingSession and Activity dates; standalone events are permitted.

  **PaymentRecord**            id, organization_id, payer_user_id, student_user_id, subject_ref, amount_minor, currency, method, reference_no, evidence_file_id, state, recorded_by, verified_by, verified_at   Records *that a payment happened*. EduCapsules stores no card number and no CVV (**PAY-011**).

  **Entitlement**              id, organization_id, holder_user_id, resource_type, resource_id, source, valid_from, valid_until, revoked_at, state                                                              The only thing the authorisation pipeline consults for paid access. Payment state and entitlement state are separate (**BIL-003**).

  **Subscription / Invoice**   id, organization_id, plan_id, period, amount_minor, currency, state, issued_at, settled_at                                                                                       Platform-to-organisation billing. Structurally separate from teacher-to-student payment (**BIL-001**).

  **AuditLog**                 id, organization_id, actor_user_id, actor_role, action, target_type, target_id, before_ref, after_ref, ip_hash, login_session_id, occurred_at, reason                            Append-only, no application UPDATE/DELETE grant (**AUD-002**).
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 37.6 --- Engagement, communication, commercial and governance entities.*

## 37.4 Critical relationships and cardinality

  ----------------------------------------------------------------------------------------------------------------------------------------------------------
  **Relationship**                 **Card.**                      **Rule**
  -------------------------------- ------------------------------ ------------------------------------------------------------------------------------------
  **Organization → User**          1..N                           Every user belongs to exactly one organisation.

  **User ↔ Role**                  M..N via UserRoleAssignment    Scoped. Multi-role is normal, not exceptional.

  **Classroom → Student**          1..N per period                One active classroom per student per AcademicPeriod.

  **Group ↔ Student**              M..N via Membership            A student may be in many groups simultaneously.

  **Subject → Course**             1..N                           A subject has many courses; a course has exactly one subject.

  **Course → Cycle → Topic**       1..N → 1..N                    Strictly ordered, strictly nested.

  **Course ↔ Audience**            M..N via CourseAudience        A course may serve several classrooms/groups.

  **Topic → Activity**             1..N                           An activity belongs to at most one topic; topic may be null for course-level activities.

  **Activity ↔ Target**            1..N via ActivityTarget        Mixed targets permitted; ≥1 required to open.

  **Activity ↔ QuestionVersion**   M..N via ActivityQuestion      Version-pinned.

  **Submission → Grade**           1..0..1                        A submission has at most one current Grade; history is unbounded.

  **File → FileVersion**           1..N                           current_version_id points to one of them.

  **File → StorageObject**         N..1 through versions          Many files may share one blob within a tenant.

  **Parent ↔ Student**             M..N via ParentLink            A parent may have several children; a student may have several linked guardians.

  **Teacher ↔ Assistant**          M..N via AssistantAssignment   Scoped and time-bounded.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 37.7 --- Cardinality rules that the schema must enforce structurally.*

## 37.5 Integrity, concurrency and consistency

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Requirement**                                                                                                                                                                                                                     **Priority**   **Actor**
  ------------ ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **DB-011**   Every scoped table shall declare a foreign key on organization_id and every cross-table foreign key within a tenant shall be composite on (organization_id, id).                                                                    **MUST**       Backend

  **DB-012**   Unique constraints shall be scoped by organization_id (e.g. UNIQUE(organization_id, email), UNIQUE(course_id, sequence_no)).                                                                                                        **MUST**       Backend

  **DB-013**   Submission creation shall be idempotent under retry: a client-supplied idempotency key prevents a duplicate attempt being created by a repeated request.                                                                            **MUST**       Backend

  **DB-014**   Grade writes shall use optimistic concurrency (version column). A conflicting concurrent edit shall be rejected with a 409, never silently overwritten.                                                                             **MUST**       Backend

  **DB-015**   Quiz auto-scoring, grade creation and points-ledger entry for one submission shall occur in a single transaction, or be made eventually consistent through a durable outbox with at-least-once delivery and idempotent consumers.   **MUST**       Backend

  **DB-016**   Points balance, progress percentage and leaderboard rank shall be computed or materialised from source rows and shall be fully rebuildable from them.                                                                               **MUST**       Backend

  **DB-017**   Every table with user-generated content shall carry created_at, updated_at, created_by and, where deletion is possible, deleted_at and deleted_by.                                                                                  **MUST**       Backend

  **DB-018**   Schema changes shall be delivered as forward-only, reviewed migrations under version control. Destructive migrations require an explicit approved change record.                                                                    **MUST**       DevOps

  **DB-019**   The schema shall avoid stored procedures and database-specific functions in business paths, so the same migrations can target the MVP and production engines.                                                                       **MUST**       Backend

  **DB-020**   Indexes shall exist for every foreign key used in a filter, and for the access patterns listed in Table 37.8. Index design beyond that is an implementation decision.                                                               **SHOULD**     Backend
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 37.8 --- Integrity and concurrency requirements.*

### 37.5.1 Primary access patterns the schema must serve efficiently

  ----------------------------------------------------------------------------------------------------------------------------------------------
  **\#**      **Access pattern**                                                                   **Driving screen**
  ----------- ------------------------------------------------------------------------------------ ---------------------------------------------
  **AP-1**    All open activities for one student across all enrolled courses, ordered by due_at   Student dashboard (S-02)

  **AP-2**    All submissions awaiting grading for one teacher across owned courses                Grading queue (S-07)

  **AP-3**    One student\'s full result history within one course and period                      Student progress (S-05), Parent view (S-16)

  **AP-4**    Attendance roll for one teaching session                                             Attendance (S-09)

  **AP-5**    Points ledger sum per student per scope per window                                   Leaderboard (S-13)

  **AP-6**    Folder listing with current version metadata for one teacher                         Storage (S-11)

  **AP-7**    Question bank search by subject, topic tag, type and difficulty                      Quiz builder (S-08)

  **AP-8**    Audit trail for one target object, newest first                                      Admin audit (S-19)

  **AP-9**    Unread notifications for one user                                                    All screens

  **AP-10**   Entitlement check for one user against one resource                                  Every protected request
  ----------------------------------------------------------------------------------------------------------------------------------------------

*Table 37.9 --- Access patterns that drive index and projection design.*

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **D-01 --- READ-MODEL STRATEGY**                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                           |
| Whether AP-2, AP-3 and AP-5 are served by direct queries, materialised views or a separate read store is deferred to architecture. The SRS requires only that the response-time targets in §43 be met and that every projection be rebuildable from source rows (DB-016). |
|                                                                                                                                                                                                                                                                           |
| *Decision required before: schema freeze*                                                                                                                                                                                                                                 |
+===========================================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 38. API Requirements

The API is the contract between every client and the platform. It is the *only* way a client reaches data: there is no client that talks to the database directly, and no business rule that exists only in a client (**GEN-011**).

## 38.1 API principles

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**        **Requirement**                                                                                                                                                **Note**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------------------------------------------
  **API-001**   The API shall be resource-oriented HTTP/JSON over TLS 1.2+ only.                                                                                               A GraphQL or RPC edge may be added later for a specific client; it must sit on the same service layer, not bypass it.

  **API-002**   The API shall be versioned in the path (/api/v1/\...). Breaking changes require a new version; additive changes do not.                                        Clients pin a major version. Two adjacent major versions run concurrently during migration.

  **API-003**   Every request shall be authenticated except a short, explicitly enumerated public allow-list (login, registration, password reset, health, legal documents).   The allow-list is a code-level constant, reviewed at each release.

  **API-004**   Authorisation shall be enforced server-side on every request through the §7 pipeline. Client-side checks are presentation only.                                **GEN-024** --- a hidden button is not a permission.

  **API-005**   Every list endpoint shall be paginated with a stable cursor and a bounded page size (default 25, maximum 100).                                                 Offset pagination is not permitted for datasets that change during traversal.

  **API-006**   Every mutating endpoint shall accept an Idempotency-Key header and shall return the original result for a repeated key within the retention window.            Protects submissions and payment records from double-submit on flaky networks.

  **API-007**   Responses shall never include fields the caller is not authorised to read; authorisation shall filter the projection, not just the row set.                    An answer key, another student\'s score and a private note are filtered at serialisation (**GEN-026**).

  **API-008**   The API shall return RFC 9457 problem-detail error objects with a stable machine-readable code, a human-readable message and a correlation id.                 See §40.

  **API-009**   All timestamps in requests and responses shall be RFC 3339 UTC with explicit offset.                                                                           Clients localise; the server never guesses a timezone.

  **API-010**   Money shall be transmitted as integer minor units plus an ISO-4217 currency code, never as a floating-point value.                                             Prevents rounding drift in payment records.

  **API-011**   The API shall be documented as a machine-readable OpenAPI 3.1 specification kept in the same repository and validated in CI against the implementation.        Documentation drift is a build failure, not a documentation task.

  **API-012**   File upload and download shall not stream through the application API; clients use short-lived, scoped, signed URLs issued by the API.                         Except for protection level 2--3 content, which is served through the Content Gateway (§16).

  **API-013**   The API shall not expose internal identifiers, stack traces, engine names, library versions or SQL fragments in any response.                                  See **ERR-006**.

  **API-014**   Bulk endpoints shall be provided for grading, attendance and enrolment so that common teacher workflows do not require N sequential requests.                  Partial success is reported per item, not as an all-or-nothing failure.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 38.1 --- Normative API requirements.*

## 38.2 Resource surface

The table below fixes the resource vocabulary and the principal operations. It is the *shape* of the API, not the full endpoint list; the OpenAPI specification (API-011) is authoritative for exact paths, parameters and schemas.

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Resource group**                               **Principal operations**                                                                                                         **Primary actors**
  ------------------------------------------------ -------------------------------------------------------------------------------------------------------------------------------- --------------------------------
  **/auth**                                        login · logout · refresh · mfa/challenge · mfa/verify · password/forgot · password/reset · sessions (list, revoke, revoke-all)   All

  **/me**                                          profile · preferences · notifications · devices · consents · data-export                                                         All

  **/organizations/{id}**                          read · settings · academic-periods · branding                                                                                    Admin

  **/users**                                       create · read · list · update · suspend · restore · roles · permissions                                                          Admin

  **/classrooms · /groups**                        CRUD · members (add, remove, list) · transfer                                                                                    Admin, Teacher

  **/subjects · /courses**                         CRUD · publish · archive · audience · co-teachers · enrolment                                                                    Teacher, Admin

  **/courses/{id}/cycles · /cycles/{id}/topics**   CRUD · reorder                                                                                                                   Teacher

  **/teaching-sessions**                           CRUD · start · complete · cancel · attendance (bulk)                                                                             Teacher, Assistant

  **/activities**                                  CRUD · publish · targets · questions · open · close · extend · submissions                                                       Teacher, Assistant

  **/activities/{id}/submissions**                 start · autosave · submit · list · grade (bulk) · return                                                                         Student, Teacher, Assistant

  **/questions**                                   CRUD · versions · search · import · export · share                                                                               Teacher

  **/grades**                                      read · update · release (bulk) · history · export                                                                                Teacher, Admin

  **/progress**                                    student · course · cycle · cohort                                                                                                Student, Teacher, Parent

  **/achievements · /points · /leaderboards**      CRUD · award · revoke · ledger · standings                                                                                       Teacher, Admin, Student (read)

  **/files · /folders**                            upload-url · commit · download-url · versions · move · rename · share · trash · restore                                          Teacher, Student

  **/content**                                     CRUD · publish · access-grants · gateway-ticket                                                                                  Teacher

  **/messages · /conversations**                   create · list · read · report                                                                                                    All

  **/notifications**                               list · mark-read · preferences                                                                                                   All

  **/calendar**                                    list · event CRUD                                                                                                                All

  **/payments**                                    record · evidence-upload · verify · reject · list                                                                                Teacher, Admin

  **/entitlements**                                list · grant · revoke · check                                                                                                    Admin, internal

  **/parents**                                     link-request · confirm · revoke · children · child-summary                                                                       Parent, Admin

  **/admin**                                       audit · reports · impersonation · system-config · moderation-queue                                                               Admin

  **/health · /ready**                             liveness · readiness                                                                                                             Infrastructure
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 38.2 --- API resource surface.*

## 38.3 Rate limiting and abuse control

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                             **Priority**   **Actor**
  ------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **API-015**   The API shall apply per-identity and per-IP rate limits, with separate, stricter budgets for authentication, password reset, file download and content-gateway endpoints.   **MUST**       Backend

  **API-016**   Exceeding a limit shall return 429 with a Retry-After header and shall not reveal whether the underlying resource exists.                                                   **MUST**       Backend

  **API-017**   Authentication endpoints shall additionally apply progressive delay and account lockout per §35, independently of the IP-based limit.                                       **MUST**       Backend

  **API-018**   Rate-limit events shall be recorded as SecurityEvent rows and shall feed the abuse detection pipeline.                                                                      **MUST**       Backend

  **API-019**   Bulk endpoints shall enforce a maximum batch size and shall count each item against the caller\'s budget.                                                                   **SHOULD**     Backend
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 38.3 --- Rate limiting requirements.*

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **D-02 --- CONCRETE RATE-LIMIT VALUES**                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                   |
| Exact request budgets (requests per minute per endpoint class) are marked TBD. They depend on the measured V1 load profile and shall be fixed during load testing (§43.1). Publishing invented numbers here would create untestable requirements. |
|                                                                                                                                                                                                                                                   |
| *Decision required before: load-test plan sign-off*                                                                                                                                                                                               |
+===================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 39. Backend & Application Architecture Requirements

This section states what the backend must *be true of*, not which framework builds it (**GEN-013**).

## 39.1 Layering

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Layer**              **Responsibility**                                                                                                                                        **May not**
  ---------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------
  **Edge**               TLS termination, WAF, DDoS mitigation, static asset delivery, caching of public assets, geographic routing.                                               Make authorisation decisions about educational data.

  **Transport / API**    Request parsing, schema validation, authentication, rate limiting, correlation-id assignment, serialisation, error mapping.                               Contain educational business rules.

  **Authorisation**      The §7 eleven-stage pipeline: identity → session → tenant → role → scope → relationship → permission → entitlement → object state → constraint → audit.   Be bypassed by any other layer, including background jobs.

  **Domain / Service**   Educational rules: enrolment, activity lifecycle, grading, progress, achievements, points, storage semantics, payment state.                              Depend on HTTP types, on the specific database engine, or on the client platform.

  **Persistence**        Repositories, transactions, migrations, query construction.                                                                                               Contain educational decisions or authorisation logic.

  **Integration**        Email/SMS/push delivery, object storage, payment evidence handling, video packaging, external identity providers.                                         Be called directly from the transport layer.

  **Background**         Queues, scheduled jobs, projections, notification fan-out, retention sweeps, anomaly scoring.                                                             Skip authorisation or audit because \'the system\' is the actor.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 39.1 --- Layer responsibilities and prohibitions.*

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Requirement**                                                                                                                                                                                                                                             **Priority**   **Actor**
  ------------ ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **BE-001**   Educational business rules shall exist in exactly one place --- the domain layer --- and shall be reachable identically from the API, from background jobs and from administrative tooling.                                                                 **MUST**       Backend

  **BE-002**   The domain layer shall have no compile-time dependency on the HTTP framework, the database driver or the hosting platform.                                                                                                                                  **MUST**       Backend

  **BE-003**   Background jobs shall execute under an explicit principal (a service principal or an impersonated user with recorded justification) and shall be audited like any other actor.                                                                              **MUST**       Backend

  **BE-004**   Every externally triggered side effect (email, push, payment evidence processing, video packaging) shall be idempotent and retry-safe.                                                                                                                      **MUST**       Backend

  **BE-005**   Long-running work (bulk import, export, video packaging, report generation) shall be asynchronous with an observable job status resource.                                                                                                                   **MUST**       Backend

  **BE-006**   The backend shall be stateless with respect to request handling; all session and workflow state shall live in the datastore or cache, so any instance can serve any request.                                                                                **MUST**       Backend

  **BE-007**   Configuration shall come from the environment, never from committed files. Secrets shall come from a secret manager and shall never appear in source, logs or error messages.                                                                               **MUST**       DevOps

  **BE-008**   The platform-abstraction boundary (object storage, queue, cache, mail, scheduler) shall be expressed as interfaces with at least two implementations exercised in CI, so the MVP → production migration (§41.5) is a configuration change, not a rewrite.   **MUST**       Backend

  **BE-009**   Every service shall expose a liveness endpoint, a readiness endpoint and structured metrics.                                                                                                                                                                **MUST**       DevOps

  **BE-010**   Feature flags shall gate incomplete or risky functionality so that deployment and release are separable.                                                                                                                                                    **SHOULD**     Backend
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 39.2 --- Backend architecture requirements.*

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-013 RESTATED FOR IMPLEMENTERS**                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                              |
| This SRS deliberately does not name a language, framework or ORM. What it does fix is the *portability contract* in BE-008: anything that touches a hosting-platform primitive sits behind an interface. A design that calls a platform SDK from a service class violates this requirement even if it works. |
|                                                                                                                                                                                                                                                                                                              |
| *Status: CONFIRMED*                                                                                                                                                                                                                                                                                          |
+==============================================================================================================================================================================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 40. Error Handling & System Behaviour

## 40.1 Error response contract

+-------------------------------------------------------------------------------+
| **Canonical error object (RFC 9457 problem detail, extended)**                |
|                                                                               |
| HTTP 4xx / 5xx                                                                |
|                                                                               |
| {                                                                             |
|                                                                               |
| \"type\": \"https://errors.educapsules.app/submission-window-closed\",        |
|                                                                               |
| \"title\": \"Submission window has closed\",                                  |
|                                                                               |
| \"status\": 409,                                                              |
|                                                                               |
| \"code\": \"ACT_WINDOW_CLOSED\", // stable, machine-readable                  |
|                                                                               |
| \"detail\": \"This homework closed on 12 May 2026 at 23:59 (Africa/Cairo).\", |
|                                                                               |
| \"instance\": \"/api/v1/activities/01H\.../submissions\",                     |
|                                                                               |
| \"correlationId\": \"01J8QK7Z\...\", // matches the server log entry          |
|                                                                               |
| \"errors\": \[ // field-level, validation only                                |
|                                                                               |
| { \"field\": \"answers\[3\].response\", \"code\": \"REQUIRED\" }              |
|                                                                               |
| \]                                                                            |
|                                                                               |
| }                                                                             |
+===============================================================================+
+-------------------------------------------------------------------------------+

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                                                                                                      **Priority**   **Actor**
  ------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **ERR-001**   Every error response shall carry a stable machine-readable code, a human-readable title safe to display, and a correlation id.                                                                                                                                                                       **MUST**       Backend

  **ERR-002**   Error messages shown to users shall state what happened, why it happened where the reason is safe to disclose, and what the user can do next.                                                                                                                                                        **MUST**       Frontend

  **ERR-003**   The correlation id shall be shown in the client\'s error surface so a user can quote it to support, and shall appear in the corresponding server log entry.                                                                                                                                          **MUST**       Full stack

  **ERR-004**   Validation errors shall be returned as a complete list, not one at a time.                                                                                                                                                                                                                           **MUST**       Backend

  **ERR-005**   Authorisation failures shall not disclose the existence of resources the caller cannot see: an unauthorised read of an existing object and a read of a non-existent object shall be indistinguishable (404), except where the caller is authorised to know the object exists but not to act (403).   **MUST**       Backend

  **ERR-006**   No response shall contain a stack trace, an internal path, an SQL fragment, a framework or engine name, a library version, or an internal hostname.                                                                                                                                                  **MUST**       Backend

  **ERR-007**   Authentication failures shall use a single generic message regardless of whether the identifier exists, the password is wrong or the account is locked; the distinction shall be recorded server-side only.                                                                                          **MUST**       Backend

  **ERR-008**   The client shall preserve unsaved user work across a transient error: quiz answers, grading entries, long-form content and messages shall survive a failed request and be re-submittable.                                                                                                            **MUST**       Frontend

  **ERR-009**   Transient failures shall be retried with exponential backoff and jitter, bounded by a total attempt budget; non-idempotent operations shall be retried only with an idempotency key.                                                                                                                 **MUST**       Full stack

  **ERR-010**   A dependency failure shall degrade the feature, not the platform: if notifications, leaderboards or analytics are unavailable, teaching, submission and grading shall continue.                                                                                                                      **MUST**       Backend

  **ERR-011**   Unhandled server errors shall return 500 with a correlation id and shall raise an alert; the rate of 500s is a monitored SLI (§43).                                                                                                                                                                  **MUST**       DevOps

  **ERR-012**   Scheduled maintenance shall present a maintenance state with an expected end time; unscheduled outage shall present a status page reference.                                                                                                                                                         **SHOULD**     DevOps
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 40.1 --- Error-handling requirements.*

## 40.2 Error class to response mapping

  ------------------------------------------------------------------------------------------------------------------------------------
  **Condition**                                                                **HTTP**   **Code family**   **User-visible?**
  ---------------------------------------------------------------------------- ---------- ----------------- --------------------------
  **Malformed request / schema violation**                                     400        REQ\_\*           Yes --- field-level

  **Missing, expired or revoked credential**                                   401        AUTH\_\*          Yes --- generic

  **MFA required or MFA challenge failed**                                     401        AUTH_MFA\_\*      Yes

  **Authenticated but not permitted, existence known to caller**               403        PERM\_\*          Yes

  **Not permitted and existence not known to caller**                          404        NOT_FOUND         Yes --- generic

  **Entitlement absent (unpaid / not granted)**                                403        ENT\_\*           Yes --- with next step

  **State conflict (window closed, already submitted, stale version)**         409        \*\_CONFLICT      Yes --- actionable

  **Business-rule violation (attempt limit, scope containment, self-grant)**   422        BR\_\*            Yes --- names the rule

  **Rate limit exceeded**                                                      429        RATE_LIMITED      Yes --- with Retry-After

  **Unhandled server fault**                                                   500        INTERNAL          Generic + correlation id

  **Dependency unavailable / degraded**                                        503        DEPENDENCY\_\*    Yes --- degraded state

  **Maintenance**                                                              503        MAINTENANCE       Yes --- with end time
  ------------------------------------------------------------------------------------------------------------------------------------

*Table 40.2 --- Canonical condition → response mapping.*

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **WHY 404 SOMETIMES REPLACES 403**                                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                             |
| If an unauthorised teacher probing /courses/{id} received 403 for real courses and 404 for imaginary ones, the API would leak the course inventory of every other teacher. ERR-005 removes that oracle. The rule is applied by *whether the caller is already inside the object\'s scope*: inside the scope, 403 is safe and more helpful; outside it, 404. |
+=============================================================================================================================================================================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 41. Frontend, Client Applications & Infrastructure

## 41.1 Client platform scope

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Client**                                                      **V1 status**                       **Notes**
  --------------------------------------------------------------- ----------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------
  **Responsive web application**                                  CONFIRMED --- V1                    The primary and only mandatory V1 client. Must be fully usable on a phone browser, since a large share of students will have no other device.

  **Installable PWA (offline shell, add-to-home-screen, push)**   PROPOSED --- V1 if effort permits   Delivers most of the perceived benefit of a mobile app at a fraction of the cost, and reuses the same codebase.

  **Native mobile applications (iOS, Android)**                   FUTURE                              Justified when a requirement genuinely needs native capability --- stronger content protection, true offline study, or platform DRM.

  **Desktop applications (Windows, macOS)**                       FUTURE                              No V1 requirement is unmet by the web client. Revisit only if a protected-content or proctoring requirement demands it.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 41.1 --- Client platform scope for V1.*

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **PLATFORM DECISION**                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                   |
| V1 ships one responsive web client. This is a deliberate scope decision, not an omission: shipping one excellent web client that works on a low-end Android phone serves the mission better than three half-finished clients. §49 records the native applications as a roadmap item with explicit entry criteria. |
|                                                                                                                                                                                                                                                                                                                   |
| *Status: CONFIRMED · Supersedes the multi-platform ambition in the original project context for the V1 timeframe only*                                                                                                                                                                                            |
+===================================================================================================================================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 41.2 Frontend requirements

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Requirement**                                                                                                                                                  **Priority**   **Actor**
  ------------ ---------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **FE-001**   The web client shall function on the two most recent major versions of Chrome, Edge, Firefox and Safari, and on Chrome and Safari on mobile.                     **MUST**       Frontend

  **FE-002**   The client shall never contain a business rule that is not also enforced by the server; client checks exist only to improve the experience.                      **MUST**       Frontend

  **FE-003**   The client shall never receive data the user is not authorised to see, including in hidden DOM, in a preloaded store, in a source map or in a bundled fixture.   **MUST**       Frontend

  **FE-004**   Protected course content shall never be embedded in JavaScript, in a bundle or in a durable client cache (**GEN-017**).                                          **MUST**       Frontend

  **FE-005**   Every destructive or irreversible action shall require explicit confirmation naming the object and the consequence.                                              **MUST**       Frontend

  **FE-006**   The client shall autosave long-form work (quiz attempts, grading, content authoring, messages) and shall recover it after a reload or a crash.                   **MUST**       Frontend

  **FE-007**   The client shall present explicit empty, loading, partial, error and offline states for every data-bearing view (§38 UI/UX).                                     **MUST**       Frontend

  **FE-008**   Time-limited assessments shall display a server-authoritative countdown; the client clock shall never determine expiry.                                          **MUST**       Frontend

  **FE-009**   The client shall be internationalisation-ready: no concatenated sentence fragments, externalised strings, and layout that tolerates a right-to-left direction.   **MUST**       Frontend

  **FE-010**   Initial interactive load on a mid-range mobile device over a 3G-class connection shall be a measured, budgeted target; the budget shall be enforced in CI.       **MUST**       Frontend

  **FE-011**   The client shall degrade usefully when a non-critical subsystem is unavailable: a failed leaderboard or notification feed shall not blank a dashboard.           **MUST**       Frontend

  **FE-012**   Client-side logging shall never include tokens, answer keys, grades of other students, or personal data beyond the acting user.                                  **MUST**       Frontend
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 41.2 --- Frontend requirements.*

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **D-03 --- ARABIC AND RIGHT-TO-LEFT SUPPORT**                                                                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                                                                       |
| The source material is written in English but the primary deployment context is Egypt. Whether V1 ships an Arabic locale, and whether the interface must support RTL layout at launch, is an OPEN decision with real architectural consequences (layout, typography, content authoring, PDF export). FE-009 makes the client *ready* for it either way; the launch locale set is TBD. |
|                                                                                                                                                                                                                                                                                                                                                                                       |
| *Decision required before: UI implementation begins*                                                                                                                                                                                                                                                                                                                                  |
+=======================================================================================================================================================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 41.3 MVP infrastructure --- Cloudflare

The MVP runs entirely on Cloudflare. Figure 41.1 shows the topology and the boundaries that the portability contract (BE-008) protects.

![](media/image24.png){width="6.5in" height="3.4966994750656166in"}

*Figure 41.1 --- MVP deployment topology on Cloudflare. Each platform primitive is reached only through the abstraction interfaces required by BE-008.*

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Concern**                   **MVP service**                               **Abstraction that protects portability**
  ----------------------------- --------------------------------------------- -----------------------------------------------------------------------------------------------
  **Static client delivery**    Pages                                         Build output is a plain static bundle; no platform-specific runtime in the client.

  **Application runtime**       Workers                                       Domain layer is framework-agnostic (BE-002); the Worker is a thin transport adapter.

  **Relational data**           D1                                            Repository interfaces + portable SQL (DB-019). No engine-specific types or stored procedures.

  **Object storage**            R2                                            ObjectStore interface: put, get, signed-url, delete, copy, head.

  **Asynchronous work**         Queues                                        JobQueue interface: enqueue, consume, retry, dead-letter.

  **Cache / ephemeral state**   KV / Durable Objects where genuinely needed   Cache interface; no business state may live only here.

  **Edge security**             WAF, DDoS, bot management, TLS                Retained in production (§41.4).

  **DNS**                       Cloudflare DNS                                Retained in production.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 41.3 --- MVP service mapping and the abstraction that keeps each one replaceable.*

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **R-01 --- PLATFORM-PRIMITIVE LEAKAGE**                                                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                            |
| The single greatest threat to the migration is a service class that calls a Cloudflare SDK directly. It works, it ships, and it silently welds the product to the platform. Mitigation: BE-008 requires two implementations of each abstraction exercised in CI from the first sprint --- not added later. |
|                                                                                                                                                                                                                                                                                                            |
| *Severity: High · Likelihood: High without discipline · Owner: Software Engineer*                                                                                                                                                                                                                          |
+============================================================================================================================================================================================================================================================================================================+
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 41.4 Production infrastructure --- InterServer VPS

![](media/image25.png){width="6.5in" height="3.9257425634295715in"}

*Figure 41.2 --- Target production topology on an InterServer Linux VPS, with Cloudflare retained in front for DNS, CDN, TLS, WAF and DDoS mitigation.*

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Concern**           **Production approach**                                                       **Requirement**
  --------------------- ----------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------------
  **Compute**           Linux VPS, containerised services behind a reverse proxy                      INF-001 --- Every service shall run as an immutable, versioned container image.

  **Relational data**   PostgreSQL                                                                    INF-002 --- Migrations shall be the same forward-only set used on the MVP engine.

  **Cache / queue**     Redis (cache, ephemeral state) and a durable queue                            INF-003 --- Same JobQueue and Cache interfaces as the MVP.

  **Object storage**    S3-compatible storage or local volume with off-site replication               INF-004 --- Same ObjectStore interface; signed URLs remain short-lived and scoped.

  **Edge**              Cloudflare retained for DNS, CDN, TLS, WAF, DDoS                              INF-005 --- Origin shall accept traffic only from the edge; direct origin access is blocked.

  **Observability**     Structured logs, metrics, traces, alerting                                    INF-006 --- Correlation id shall propagate across every hop.

  **Backup**            Automated encrypted backups with off-site copies                              INF-007 --- Backups shall be restore-tested on a defined cadence; an untested backup is not a backup.

  **Secrets**           Secret manager, no secrets in images or environment files in the repository   INF-008 --- Secret rotation shall not require a code change.
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 41.4 --- Production infrastructure requirements.*

## 41.5 Migration path

![](media/image26.png){width="6.5in" height="3.073482064741907in"}

*Figure 41.3 --- MVP → production migration path. The application code does not change; the bindings behind the abstraction interfaces do.*

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                    **Priority**   **Actor**
  ------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **INF-010**   The migration shall be executable as: provision production → run the same migrations → export and import data → repoint bindings → cut over DNS → verify → retain rollback for a defined window.   **MUST**       DevOps

  **INF-011**   A full migration rehearsal shall be performed against a copy of production-shaped data before the real cutover.                                                                                    **MUST**       DevOps

  **INF-012**   Data export shall be engine-neutral and shall include object-storage contents with checksum verification of every object.                                                                          **MUST**       DevOps

  **INF-013**   Cutover shall have a documented rollback with a defined maximum data-loss window; the window shall be agreed before cutover, not discovered during it.                                             **MUST**       DevOps

  **INF-014**   Users shall be notified of the maintenance window in advance, and no assessment shall be scheduled to open, close or run within it.                                                                **MUST**       PM

  **INF-015**   Deployment shall be automated and repeatable from a clean environment; no manual server configuration step shall be required to reproduce production.                                              **MUST**       DevOps
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 41.5 --- Migration requirements.*

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **R-02 --- MIGRATING DURING AN ACADEMIC PERIOD**                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                              |
| A cutover in the middle of a term risks losing or duplicating submissions and grades --- the two data classes the product cannot afford to damage. Mitigation: schedule the cutover between academic periods where possible, and enforce INF-014 absolutely where it is not. |
|                                                                                                                                                                                                                                                                              |
| *Severity: High · Owner: Project Manager*                                                                                                                                                                                                                                    |
+==============================================================================================================================================================================================================================================================================+
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 42. UI/UX Design Language & Interface Requirements

This section defines the design *system* --- the rules a designer and a frontend engineer apply to produce screens that belong to the same product. The reference screens in §25 are instantiations of these rules, not a substitute for them.

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **SCOPE OF THE VISUAL SPECIFICATION**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| The supplied material fixes the EduCapsules colour identity --- *light blue, red, black, on white* --- and that identity is carried through this document and through every reference screen. It does not fix a full brand token set (type scale, elevation, motion, dark-mode palette, logo usage). Those are recorded as **D-04** and are to be produced by design, not invented here. What follows specifies structure, behaviour and the semantics each colour carries, which is what engineering needs and what a later brand refinement will not invalidate. |
+====================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 42.1 Design principles

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**       **Principle**                                      **What it means in practice**
  ------------ -------------------------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **UX-P1**    Clarity over density                               A teacher deciding a grade and a student reading a deadline must find the answer without hunting. Screens show the decision first and the detail second.

  **UX-P2**    The interface tells the truth about permissions    If an action is unavailable, the interface says *why* (scope, entitlement, window, delegation) rather than silently hiding it --- except where disclosing existence would itself leak information (**ERR-005**).

  **UX-P3**    Consequences are stated before they happen         Releasing grades, awarding points, revoking an assistant and deleting content all show what will change, to whom, and whether it can be undone.

  **UX-P4**    Every state is designed                            Empty, loading, partial, error, offline, permission-denied, expired and success are designed states with real copy --- not an afterthought.

  **UX-P5**    Mobile is the primary case, not the fallback       The student experience is designed at 360 px first. If a workflow only works on a desktop, it is not finished.

  **UX-P6**    Motivation without exposure                        Gamification celebrates the individual. It never publishes a ranking that identifies a struggling student (**LDB-005**).

  **UX-P7**    The user is never lost                             Persistent breadcrumb of Course → Cycle → Topic → Activity. The user can always tell which role and which scope they are acting in.

  **UX-P8**    Nothing is silently lost                           Autosave, recoverable drafts, explicit confirmation on destructive actions, and an undo window where the operation permits one.

  **UX-P9**    Accessibility is a requirement, not a preference   Colour never carries meaning alone; keyboard reaches everything; contrast is measured.

  **UX-P10**   Consistency is enforced by components              A table, a form field, a status pill and a confirmation dialog have exactly one implementation. A one-off variant is a defect.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.1 --- Design principles, each testable against a real screen.*

## 42.2 Colour semantics

Colour in EduCapsules carries *meaning*, and the meaning is fixed even if the exact hex values are refined by brand work. The mapping below is normative; the values are the current working reference.

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Role**                                **Working value**   **Meaning --- normative**                                                                                                        **Never used for**
  --------------------------------------- ------------------- -------------------------------------------------------------------------------------------------------------------------------- ----------------------------------------------------
  **Primary --- light blue**              #1E7FC2             Structure, navigation, primary action, informational emphasis, links, selected state.                                            Errors, destructive actions, warnings.

  **Accent --- red**                      #C8332C             Attention that requires a decision: destructive actions, validation errors, overdue items, security notices, required markers.   Decoration, ordinary emphasis, achievement colour.

  **Foreground --- black / near-black**   #111418             Body text, headings, data.                                                                                                       Backgrounds of interactive surfaces in light mode.

  **Surface --- white**                   #FFFFFF             Page and card background; the default canvas.                                                                                    Text in light mode.

  **Neutral scale**                       grey 100 → 700      Borders, dividers, disabled state, secondary text, table zebra striping.                                                         Status meaning.

  **Status --- success**                  green (TBD)         Completed, submitted on time, verified payment, present.                                                                         Primary actions.

  **Status --- caution**                  amber (TBD)         Due soon, pending verification, partial completion, late but accepted.                                                           Errors.

  **Status --- danger**                   red family          Overdue, failed, rejected, revoked, suspended.                                                                                   Neutral information.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.2 --- Normative colour semantics with current working values.*

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Requirement**                                                                                                                                                 **Priority**   **Actor**
  ------------ --------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------------
  **UI-001**   Colour shall never be the sole carrier of meaning. Every status expressed by colour shall also carry a text label and, where space permits, an icon.            **MUST**       Frontend, Design

  **UI-002**   Text and interactive elements shall meet WCAG 2.1 AA contrast (4.5:1 body, 3:1 large text and UI boundaries) in every supported theme.                          **MUST**       Frontend, Design

  **UI-003**   Red shall be reserved for destructive, erroneous, overdue or security-relevant meaning. A red element that is merely decorative is a defect.                    **MUST**       Design

  **UI-004**   Colour tokens shall be defined once, referenced by semantic name (surface, text-primary, action-primary, status-danger), and never hard-coded in a component.   **MUST**       Frontend
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.3 --- Colour requirements.*

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **D-04 --- FULL BRAND TOKEN SET**                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                       |
| Type scale, font family, elevation/shadow scale, corner radius scale, spacing scale, motion durations, icon set, logo lockups and the dark-mode palette are TBD. UI-004 requires them to be expressed as semantic tokens, so a later brand definition changes values without touching component code. |
|                                                                                                                                                                                                                                                                                                       |
| *Decision required before: component library implementation · Owner: Design*                                                                                                                                                                                                                          |
+=======================================================================================================================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 42.3 Layout and navigation model

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Region**               **Contents**                                                                                                   **Behaviour**
  ------------------------ -------------------------------------------------------------------------------------------------------------- ------------------------------------------------------------------------------------------------------
  **Global header**        Product mark · global search · notifications · role/scope indicator · account menu                             Persistent. On mobile it collapses to mark, search icon, notification icon and avatar.

  **Primary navigation**   Role-appropriate destinations only (§24 screen inventory)                                                      Sidebar on ≥1024 px; bottom tab bar on mobile with at most five destinations.

  **Context bar**          Breadcrumb: Organisation → Course → Cycle → Topic → Activity, plus the active scope                            Every level is a link. Truncates from the left on narrow viewports, never hides the leaf.

  **Content region**       One primary object per screen                                                                                  A screen answers one question. Secondary detail goes in a panel or a drawer, not a competing column.

  **Contextual panel**     Properties, targeting, scope checks, help                                                                      Right-side drawer on desktop; full-screen sheet on mobile.

  **Action zone**          Primary action right-aligned; destructive actions separated and never adjacent to the primary                  Sticky on long forms so the user never scrolls to find Save.

  **System messaging**     Toasts for transient confirmation; inline banners for persistent state; modals only for decisions that block   A modal that can be dismissed without a decision should have been a drawer.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.4 --- Layout regions and their behaviour.*

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Requirement**                                                                                                                                                   **Priority**   **Actor**
  ------------ ----------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **UI-005**   Primary navigation shall show only destinations the user is authorised to reach in at least one scope; it shall not show disabled entries for other roles.        **MUST**       Frontend

  **UI-006**   The active role and scope shall be visible at all times for any user who holds more than one role, and switching scope shall be an explicit, reversible action.   **MUST**       Frontend

  **UI-007**   Breadcrumbs shall reflect the true academic hierarchy and shall never skip a level that exists.                                                                   **MUST**       Frontend

  **UI-008**   Navigation depth to any routine task shall be at most three levels from the role\'s dashboard.                                                                    **SHOULD**     Design
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.5 --- Navigation requirements.*

## 42.4 Core component specification

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Component**             **Required behaviour**
  ------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Data table**            Sticky header · sortable columns marked as such · server-side pagination with the total or a clear \'more\' affordance · per-row actions in a consistent position · bulk selection with a persistent action bar showing the selected count · a designed empty state · horizontal scroll on mobile with the identity column pinned.

  **Form**                  Label above field · required marked in text as well as colour · inline validation on blur, full validation on submit · error text below the field naming the fix · unsaved-change guard on navigation · disabled submit only while a request is in flight, never as a substitute for validation messaging.

  **Card**                  One object, one decision. Title, status pill, at most three metadata items, one primary action. If a card needs a fourth metadata row it should be a table row.

  **Status pill**           Text + colour + optional icon. The vocabulary is fixed per domain (§45 state machines) so \'Closed\' means the same thing everywhere.

  **Modal**                 Title states the decision · body states the consequence · primary action is a verb naming the outcome (\'Release 24 grades\'), never \'OK\' · destructive primary is red and requires the object name to be visible · Escape and the backdrop cancel, never confirm.

  **Drawer / panel**        Non-blocking. Retains its scroll position. Closing never discards unsaved work without a guard.

  **Toast**                 Transient confirmation only. Never the sole channel for an error the user must act on. Auto-dismiss, with a manual dismiss and a pause on hover.

  **Banner**                Persistent state: degraded subsystem, unverified payment, expiring assistant assignment, pending consent. Dismissible only when the state is informational.

  **Timer (assessment)**    Server-authoritative remaining time · visible at all times during an attempt · escalating emphasis at defined thresholds · states the auto-submit behaviour before it happens (**FE-008**).

  **File uploader**         Accepted types and size limit stated before selection · per-file progress · per-file failure with retry · virus/type rejection message that names the reason · resumable for large files.

  **Content viewer**        Renders protected content through the gateway path only (§16) · never exposes a direct object URL · shows the protection level and the applicable rules to the viewer.

  **Notification centre**   Grouped by type · unread state · deep link that re-checks authorisation on open (**NOT-011**) · preference entry point.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.6 --- Core component behavioural specification.*

## 42.5 Screen states

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **State**                           **Requirement**                                                                                         **Example copy pattern**
  ----------------------------------- ------------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------------------
  **Empty --- never had data**        Explain what would appear here and offer the action that creates it.                                    "No activities yet. Create homework or a quiz for this topic."

  **Empty --- filtered to nothing**   Distinguish from the above and offer to clear filters.                                                  "No submissions match these filters. Clear filters."

  **Loading --- first load**          Skeleton matching the final layout, not a spinner over a blank page.                                    ---

  **Loading --- refresh**             Keep existing content visible; show a subtle progress indicator.                                        ---

  **Partial**                         Render what loaded; mark the failed region and offer a retry for that region only.                      "Leaderboard unavailable. Retry."

  **Error --- recoverable**           State what failed, what is preserved, and the next action. Include the correlation id.                  "Your answers are saved. We couldn't submit --- retry. Ref: 01J8QK7Z."

  **Error --- permission**            State that access is not available and who can grant it, without revealing what exists (**ERR-005**).   "You don't have access to this course. Ask the course teacher."

  **Offline**                         State offline status, what still works, and that work is preserved locally.                             "You're offline. Your answers are saved on this device."

  **Expired / closed**                State the deadline that passed and whether late submission is permitted.                                "This closed on 12 May at 23:59. Late submission isn't accepted."

  **Success**                         Confirm the outcome and its scope, and offer undo where the operation supports it.                      "24 grades released to students in 10-B. Undo (2 min)."

  **Destructive confirmation**        Name the object, the consequence and the reversibility.                                                 "Delete 'Trigonometry Set 3'? 18 submissions are attached. This can be restored for 30 days."
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.7 --- Required screen states with copy patterns.*

## 42.6 Accessibility and responsiveness

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Requirement**                                                                                                                     **Priority**   **Actor**
  ------------ ----------------------------------------------------------------------------------------------------------------------------------- -------------- -------------------
  **UI-010**   The web client shall conform to WCAG 2.1 Level AA.                                                                                  **MUST**       Frontend, Design

  **UI-011**   Every interactive element shall be reachable and operable by keyboard, in a logical order, with a visible focus indicator.          **MUST**       Frontend

  **UI-012**   All non-decorative images, icons and charts shall have text alternatives; data visualisations shall also be available as a table.   **MUST**       Frontend

  **UI-013**   Form fields shall have programmatically associated labels; errors shall be announced to assistive technology.                       **MUST**       Frontend

  **UI-014**   Modals and drawers shall trap focus while open and restore focus on close.                                                          **MUST**       Frontend

  **UI-015**   The interface shall support browser zoom to 200% and OS text scaling without loss of content or function.                           **MUST**       Frontend

  **UI-016**   Motion shall respect prefers-reduced-motion; no essential information shall be conveyed by animation alone.                         **MUST**       Frontend

  **UI-017**   Layout shall be responsive across the defined breakpoints, with the student experience verified on a 360 px viewport.               **MUST**       Frontend

  **UI-018**   Touch targets shall be at least 44 × 44 CSS pixels.                                                                                 **MUST**       Frontend

  **UI-019**   Time-limited assessments shall provide an accommodation mechanism (extended time per student) that is recorded and auditable.       **MUST**       Backend, Frontend

  **UI-020**   Dark mode shall be supported as a theme built from the same semantic tokens.                                                        **SHOULD**     Frontend, Design
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.8 --- Accessibility and responsiveness requirements.*

  -----------------------------------------------------------------------------------------------------------------------------------------------------------
  **Breakpoint**   **Range**         **Layout**
  ---------------- ----------------- ------------------------------------------------------------------------------------------------------------------------
  **Compact**      \< 640 px         Single column · bottom tab navigation · panels become full-screen sheets · tables scroll with a pinned identity column

  **Medium**       640 -- 1023 px    Single or dual column · collapsible sidebar · drawers overlay

  **Expanded**     1024 -- 1439 px   Persistent sidebar · content + contextual panel

  **Wide**         ≥ 1440 px         Content width capped for readability; extra space is margin, not additional columns
  -----------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.9 --- Responsive breakpoints.*

## 42.7 Role-specific interface behaviour

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Role**        **The dashboard answers**                                        **Deliberate interface constraint**
  --------------- ---------------------------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------
  **Student**     "What do I have to do, by when, and how am I doing?"             No aggregate comparison against named peers. No access to any answer key or unreleased grade.

  **Teacher**     "What needs my attention across everything I teach?"             Every bulk action states its blast radius before it commits.

  **Assistant**   "What has been delegated to me, in which scope, until when?"     The scope and expiry of the delegation are visible on every screen; actions outside it are explained, not hidden (**UX-P2**).

  **Parent**      "How is my child doing, and what is coming up?"                  Read-only by construction. The screen states its own boundary --- what a parent can and cannot see (**PAR-006**).

  **Admin**       "What is the state of the platform and what needs a decision?"   Exceptional access (impersonation, private-data view) requires a stated reason in the interface and is visibly audited (**ADM-021**).
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.10 --- Role-specific dashboard focus and constraints.*

## 42.8 Security-sensitive interface patterns

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Situation**                           **Required pattern**
  --------------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Displaying protected content**        Rendered through the gateway viewer with the applicable protection level stated. No direct URL, no download control at level 2--3, dynamic watermark where configured. The interface shall not claim screenshots are prevented (**GEN-022**).

  **Answer keys and unreleased grades**   Never present in any client payload for a user without the permission --- not hidden, *absent* (**FE-003**).

  **Delegation**                          Granting an assistant permission shows exactly which permissions, which scope, which expiry, and that the grant cannot exceed the grantor's own (**GEN-025**).

  **Impersonation**                       A persistent, unmissable banner naming the impersonated user and the reason, with a one-click exit. Every action taken is audited under both identities.

  **Payment evidence**                    Upload states that the image is reviewed by a human and stored as evidence. The interface shall not request a card number or CVV under any circumstances (**PAY-011**).

  **Session management**                  The user can see every active login session with device and last-seen information, and can revoke any or all of them; revocation takes effect immediately (**AUTH-118**).

  **Consent and policy**                  Version-stamped, with the change summarised. Continued use is not treated as consent where explicit consent is required.

  **Data export and deletion**            The user can see what will be exported or deleted, and the retention obligations that prevent immediate erasure of certain records (§44).
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 42.11 --- Security-sensitive interface patterns.*

# 43. Non-Functional Requirements

Every requirement in this section is measurable or it is not a requirement (**GEN-027**). Where a realistic target cannot yet be derived from a measured load profile, the requirement states the *metric and its measurement method* and marks the threshold TBD rather than inventing a number.

## 43.1 Performance

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**         **Metric**                                                                 **Target**                      **Method**
  -------------- -------------------------------------------------------------------------- ------------------------------- -------------------------------------------------
  **PERF-001**   API read latency, p95, standard authenticated request under V1 load        TBD --- fixed at load test      Server-side histogram, excluding client network

  **PERF-002**   API read latency, p99                                                      TBD                             As above

  **PERF-003**   API write latency, p95 (submission, grade, attendance)                     TBD                             As above

  **PERF-004**   Time to interactive, student dashboard, mid-range Android, 3G-class link   TBD --- budget enforced in CI   Synthetic lab measurement + field RUM

  **PERF-005**   Client JavaScript bundle, initial route, compressed                        TBD --- budget in CI            Build-time budget check

  **PERF-006**   Quiz answer autosave round trip, p95                                       TBD                             Server histogram

  **PERF-007**   Bulk grade release, 200 students                                           TBD                             Job completion timing

  **PERF-008**   File upload throughput, 50 MB, typical link                                TBD                             Signed-URL transfer timing

  **PERF-009**   Protected video start time, p95                                            TBD                             Player telemetry

  **PERF-010**   Search result latency, question bank, p95                                  TBD                             Server histogram
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 43.1 --- Performance metrics. Thresholds are deliberately TBD until measured ({red}D-05{}).*

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **D-05 --- PERFORMANCE THRESHOLDS**                                                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                                                  |
| Publishing "95% of requests under 300 ms" before any load measurement produces a number that is either trivially met or impossible, and in both cases untestable. The metrics, measurement points and instrumentation are fixed now; the thresholds are set from the first load test against production-shaped data and then become contractual. |
|                                                                                                                                                                                                                                                                                                                                                  |
| *Decision required before: V1 launch readiness review · Owner: Software Engineer + QA*                                                                                                                                                                                                                                                           |
+==================================================================================================================================================================================================================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 43.2 Capacity and scalability

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**         **Requirement**
  -------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **PERF-020**   The V1 capacity model shall be stated as concurrent active users, peak simultaneous assessment attempts, submissions per hour and storage growth per month. Initial values are TBD pending the first cohort size from the project owner.

  **PERF-021**   The system shall scale horizontally at the application tier without code change; no request handling shall depend on instance-local state (**BE-006**).

  **PERF-022**   The dominant load event is a simultaneous timed assessment for a full cohort. Capacity planning and load testing shall use this as the primary scenario, not an average-traffic model.

  **PERF-023**   Read-heavy projections (dashboards, progress, leaderboards) shall be cacheable with an explicit, documented staleness bound; grades and submissions shall never be served stale.

  **PERF-024**   File and video delivery shall not consume application compute; it shall be served from object storage or the edge via signed URLs or the content gateway.

  **PERF-025**   The system shall degrade predictably under overload --- queue and shed non-essential work (analytics, leaderboards, digests) before affecting assessment and grading.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 43.2 --- Capacity and scalability requirements.*

## 43.3 Availability, reliability and recovery

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                               **Target**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------- --------------------------------------------------------------
  **NFR-001**   Monthly availability of core educational functions (authentication, content access, submission, grading)                                                      TBD --- MVP and production targets set separately

  **NFR-002**   Planned maintenance shall occur in an announced window and never overlap a scheduled assessment (**INF-014**)                                                 Absolute

  **NFR-003**   Recovery Point Objective --- maximum tolerable data loss                                                                                                      TBD; assessment and grade data target is the strictest class

  **NFR-004**   Recovery Time Objective --- maximum tolerable restoration time                                                                                                TBD

  **NFR-005**   Backups shall be automated, encrypted, off-site and restore-tested on a defined cadence (**INF-007**)                                                         Restore test ≥ quarterly

  **NFR-006**   No single point of failure shall exist in the production topology for the core educational path                                                               Design review gate

  **NFR-007**   A submission accepted by the system shall be durably persisted before the acknowledgement is returned to the student                                          Absolute --- no buffered-write acknowledgement

  **NFR-008**   Data corruption shall be detectable: checksums on stored objects, referential verification jobs, and reconciliation of ledger sums against derived balances   Scheduled verification
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 43.3 --- Availability and recovery requirements.*

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **NFR-007 IS NOT NEGOTIABLE**                                                                                                                                                                            |
|                                                                                                                                                                                                          |
| A student who sees "submitted" and later finds no submission has lost work that may not be reproducible, at a moment that may not recur. Every other performance target may be traded; this one may not. |
|                                                                                                                                                                                                          |
| *Status: CONFIRMED*                                                                                                                                                                                      |
+==========================================================================================================================================================================================================+
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 43.4 Maintainability, observability and quality attributes

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**
  ------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **NFR-010**   All source shall be version-controlled with reviewed changes; no direct commit to the release branch.

  **NFR-011**   Automated tests shall gate every merge. Coverage thresholds are defined in §47; authorisation, grading and payment paths carry the strictest requirements.

  **NFR-012**   Every request shall carry a correlation id propagated across services, jobs and logs (**INF-006**).

  **NFR-013**   Logs shall be structured, queryable, and free of secrets, tokens, answer keys and unnecessary personal data (**FE-012**, §32).

  **NFR-014**   Golden-signal metrics (rate, errors, duration, saturation) shall exist for every service, with alerting on defined SLIs.

  **NFR-015**   Runbooks shall exist for the defined operational scenarios (§47.5) before launch.

  **NFR-016**   Dependencies shall be pinned, inventoried (SBOM) and scanned for known vulnerabilities in CI.

  **NFR-017**   Documentation --- OpenAPI specification, schema migrations, architecture decision records and this SRS --- shall be updated in the same change that alters behaviour.

  **NFR-018**   The codebase shall enforce a single formatting and linting standard automatically.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 43.4 --- Maintainability and observability requirements.*

## 43.5 Usability, compatibility and localisation

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                       **Verification**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------------------
  **NFR-020**   A first-time teacher shall complete the create-course → add-cycle → add-topic → publish-homework path without written instructions.   Moderated usability test, ≥ 5 participants

  **NFR-021**   A first-time student shall locate and submit an assigned homework on a phone without assistance.                                      Moderated usability test on a 360 px device

  **NFR-022**   Browser support per **FE-001**.                                                                                                       Cross-browser test matrix in CI

  **NFR-023**   The client shall function on a mid-range Android device released within the last four years.                                          Device-lab verification

  **NFR-024**   All user-facing strings shall be externalised and free of concatenated grammar.                                                       Lint rule + pseudo-localisation build

  **NFR-025**   Date, time, number and currency formatting shall follow the user's locale; stored values remain canonical.                            Automated test per locale

  **NFR-026**   The launch locale set and RTL support are TBD (**D-03**); the implementation shall not preclude either.                               Architecture review
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 43.5 --- Usability, compatibility and localisation requirements.*

# 44. Account Lifecycle, Retention & Deletion

Educational records, audit records and personal data have different lifetimes and different legal weight. Treating them as one thing produces either unlawful retention or destroyed academic history. This section separates them.

## 44.1 Account states

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **State**         **Meaning**                                                                     **Can sign in?**        **Data visible to others?**
  ----------------- ------------------------------------------------------------------------------- ----------------------- -------------------------------------------------------
  **PENDING**       Created, not yet verified or activated                                          No                      Minimal --- name only where required

  **ACTIVE**        Normal operation                                                                Yes                     Per authorisation rules

  **SUSPENDED**     Administratively blocked (policy, conduct, non-payment at organisation level)   No                      Yes --- historical records remain attributed

  **LOCKED**        Security lock after failed authentication or a detected compromise              No --- until recovery   Yes

  **DEACTIVATED**   User-initiated or end-of-relationship; account dormant                          No                      Historical records remain

  **ANONYMISED**    Erasure executed; identity severed from retained academic and audit records     No                      Records remain, attributed to a non-identifying token

  **PURGED**        All data removed where no retention obligation applies                          No                      No
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 44.1 --- Account states.*

## 44.2 Deletion and erasure requirements

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                                                                                 **Priority**   **Actor**
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ---------------
  **LIF-001**   A user shall be able to request account deletion from within the product, and the request shall be acknowledged, recorded and auditable.                                                                                        **MUST**       All users

  **LIF-002**   Deletion shall be a defined pipeline --- request → verify identity → grace period → anonymise → purge-where-permitted --- not an immediate destructive operation.                                                               **MUST**       Backend

  **LIF-003**   The system shall distinguish *personal data* (erasable) from *academic records* and *audit records* (retained under obligation). Erasure shall sever the link to the person without destroying the academic and audit record.   **MUST**       Backend

  **LIF-004**   Before deletion executes, the user shall be shown exactly what will be erased, what will be retained, why, and for how long.                                                                                                    **MUST**       Frontend

  **LIF-005**   A grace period shall apply during which the user can cancel the request; its length is TBD (**D-06**).                                                                                                                          **MUST**       Backend

  **LIF-006**   Deleting a teacher account shall not delete the courses, content, grades or assessment history of their students. Ownership shall transfer to a designated successor or to the organisation (**BR-021**).                       **MUST**       Admin

  **LIF-007**   Deleting a student account shall not delete another user\'s records that reference it (e.g. a class average, a teacher\'s grade history); references shall be anonymised.                                                       **MUST**       Backend

  **LIF-008**   A user shall be able to export their own data in a portable, machine-readable format, delivered through an authenticated, time-limited download.                                                                                **MUST**       All users

  **LIF-009**   For a minor\'s account, deletion and export shall be exercisable by a confirmed guardian, and the exercise shall be audited.                                                                                                    **MUST**       Parent, Admin

  **LIF-010**   Deletion shall propagate to backups by policy: backups expire on their normal schedule and are not selectively edited; the policy and the maximum residual window shall be documented and disclosed.                            **MUST**       DevOps

  **LIF-011**   Orphaned StorageObjects whose refcount reaches zero shall be garbage-collected after a defined delay, with the delay chosen so that an accidental deletion is still recoverable.                                                **MUST**       Backend

  **LIF-012**   Every step of the deletion pipeline shall be audited, including the decision not to erase a record and the retention basis relied on.                                                                                           **MUST**       Backend
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 44.2 --- Account lifecycle and erasure requirements.*

> **BR-021 · PROPOSED · OWNERSHIP TRANSFER ON TEACHER DELETION** *(added in v1.1 --- cited by LIF-006 since v1.0 but never separately stated; see Appendix E)*
>
> When a Teacher account is deleted or permanently deactivated, ownership of that Teacher's Courses, Cycles, Topics, Activities, Question Bank items and Teacher Storage transfers to an Admin-designated successor Teacher within the same Organization, or --- where none is designated --- to the Organization itself pending reassignment. Transfer never deletes or alters existing grades, submissions, attendance or audit records, and every such transfer is itself audited (AUD-002) and notified to affected co-teachers where CRS-009 applies. *Rejected: leaving orphaned courses without an owner, which would leave grading, content-update and student-support authority for live students unreachable.*

## 44.3 Retention schedule

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Data class**                                                                    **Retention basis**             **Period**
  --------------------------------------------------------------------------------- ------------------------------- ---------------------------------------------------------------------------
  **Authentication credentials and MFA factors**                                    Operational                     Until account deletion, then immediate purge

  **Login session records**                                                         Security                        TBD --- short (weeks)

  **Academic records: enrolment, grades, grade history, attendance, submissions**   Educational record obligation   TBD --- long (years); set by the project owner against local requirements

  **Submitted files**                                                               Educational record              TBD --- aligned with academic records

  **Teacher-authored content and storage**                                          Ownership (§33)                 Until owner deletes or ownership transfers

  **Trashed files pending purge (STR-012, LIF-011)**                                Recoverability window            TBD --- short; long enough that an accidental deletion is recoverable, short enough to bound storage growth

  **Content access events**                                                         Security / abuse detection      TBD --- medium (months)

  **Audit log**                                                                     Governance                      TBD --- long; minimum bound set by legal review

  **Payment records and evidence**                                                  Financial record obligation     TBD --- set by local financial record rules

  **Messages**                                                                      Operational + safeguarding      TBD --- medium

  **Notifications**                                                                 Operational                     TBD --- short

  **Analytics aggregates (non-identifying)**                                        Product                         Indefinite once non-identifying

  **Backups**                                                                       Recovery                        TBD --- per backup rotation policy (LIF-010)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 44.3 --- Retention schedule. Periods are TBD pending legal review ({red}D-06{}).*

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **D-06 --- RETENTION PERIODS AND APPLICABLE LAW**                                                                                                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                                                                                                       |
| Retention periods are legal determinations, not engineering preferences. The primary deployment jurisdiction, the applicable data-protection regime, the treatment of minors\' data and the financial record-keeping obligation must be confirmed by qualified legal advice before these values are fixed. This document does not provide legal advice and does not state a period it cannot justify. |
|                                                                                                                                                                                                                                                                                                                                                                                                       |
| *Decision required before: production launch · Owner: Project Owner + external counsel*                                                                                                                                                                                                                                                                                                               |
+=======================================================================================================================================================================================================================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 45. State Machines

These state machines are normative. Any transition not listed is invalid and shall be rejected with a 409 or 422 (**ERR-005**, Table 40.2). Every transition writes an audit entry.

## 45.1 Activity lifecycle

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **From**        **Event**                  **To**                          **Guard**
  --------------- -------------------------- ------------------------------- --------------------------------------------------------------------------------------------------
  **DRAFT**       publish                    SCHEDULED                       ≥1 ActivityTarget · max_score set · questions attached if type requires · opens_at in the future

  **DRAFT**       publish (opens_at ≤ now)   OPEN                            As above

  **DRAFT**       delete                     ---                             No submissions exist

  **SCHEDULED**   opens_at reached           OPEN                            Automatic

  **SCHEDULED**   edit                       DRAFT                           Teacher/owner or delegated permission

  **SCHEDULED**   cancel                     CANCELED                        Reason required · targets notified

  **OPEN**        due_at reached             OPEN_LATE                       Only if late policy permits; otherwise → CLOSED

  **OPEN**        closes_at reached          CLOSED                          Automatic · in-flight attempts auto-submitted

  **OPEN**        close now                  CLOSED                          Teacher action · states the effect on in-flight attempts

  **OPEN_LATE**   closes_at reached          CLOSED                          Automatic

  **CLOSED**      reopen                     OPEN                            Reason required · audited · notifies affected students

  **CLOSED**      extend for student         CLOSED (+ per-student window)   Accommodation (**UI-019**) · audited

  **CLOSED**      all graded and released    COMPLETED                       Automatic

  **Any**         archive                    ARCHIVED                        Read-only; grades and submissions preserved (**GEN-018**)
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 45.1 --- Activity state machine.*

## 45.2 Submission lifecycle

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------
  **From**                      **Event**              **To**                      **Guard**
  ----------------------------- ---------------------- --------------------------- -------------------------------------------------------------------------------
  **---**                       start attempt          IN_PROGRESS                 Activity OPEN or OPEN_LATE · attempt_no ≤ attempt_limit · entitlement present

  **IN_PROGRESS**               autosave               IN_PROGRESS                 Server timestamps every save

  **IN_PROGRESS**               submit                 SUBMITTED                   Required answers present · window open

  **IN_PROGRESS**               time limit reached     SUBMITTED                   Auto-submit · flagged as auto

  **IN_PROGRESS**               window closes          SUBMITTED                   Auto-submit · is_late set per policy

  **IN_PROGRESS**               abandon                ABANDONED                   Only if policy permits; otherwise auto-submitted

  **SUBMITTED**                 auto-score             AUTO_GRADED                 Objective question types only

  **SUBMITTED / AUTO_GRADED**   grade                  GRADED                      Grader holds GRADE permission in scope

  **AUTO_GRADED**               manual override        GRADED                      Reason recorded · GradeHistory written

  **GRADED**                    release                RETURNED                    Grade state → RELEASED · student notified · points posted

  **RETURNED**                  request resubmission   IN_PROGRESS (new attempt)   Policy permits · new attempt_no

  **RETURNED**                  regrade                GRADED                      Reason required · GradeHistory written · student notified

  **Any**                       void                   VOID                        Admin/teacher with reason · original preserved
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 45.2 --- Submission state machine.*

## 45.3 Other lifecycles

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Object**                **States**                                                                                            **Notable rules**
  ------------------------- ----------------------------------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------------------------
  **Grade**                 DRAFT → PENDING_REVIEW → RELEASED → (VOID)                                                            Student sees RELEASED only. Any post-release change requires a reason and writes GradeHistory (**GRD-009**).

  **Enrollment**            REQUESTED → ACTIVE → (WITHDRAWN \| COMPLETED \| TRANSFERRED)                                          Withdrawal and transfer preserve all grades earned (**BR-015**).

  **Course**                DRAFT → PUBLISHED → (ARCHIVED)                                                                        Archiving is read-only, never destructive. Unpublishing hides future content but does not revoke released grades.

  **TeachingSession**       SCHEDULED → IN_PROGRESS → COMPLETED \| CANCELED                                                       Cancelling voids attendance with a reason rather than deleting it (**SES-014**).

  **AssistantAssignment**   PENDING → ACTIVE → (EXPIRED \| REVOKED \| SUSPENDED)                                                  Expiry is evaluated at authorisation time (**AST-007**); revocation is immediate.

  **ParentLink**            REQUESTED → CONFIRMED → (REVOKED)                                                                     REQUESTED grants nothing (**PAR-002**).

  **PaymentRecord**         RECORDED → EVIDENCE_SUBMITTED → UNDER_REVIEW → VERIFIED \| REJECTED → (REFUND_REQUESTED → REFUNDED)   Verification is a human decision. Entitlement is granted on VERIFIED, and is a separate object (**BIL-003**).

  **Entitlement**           PENDING → ACTIVE → (EXPIRED \| REVOKED)                                                               The authorisation pipeline consults this, never the payment state.

  **File**                  DRAFT → ACTIVE → TRASHED → (RESTORED \| PURGED)                                                       Purge is blocked while any FileReference is live (**STR-023**).

  **ContentItem**           DRAFT → SCHEDULED → PUBLISHED → (UNPUBLISHED \| ARCHIVED)                                             Unpublishing removes future access; it does not retract already-granted offline copies at protection level 0--1.

  **User account**          PENDING → ACTIVE → (SUSPENDED \| LOCKED \| DEACTIVATED) → ANONYMISED → PURGED                         See §44.

  **LoginSession**          ACTIVE → (EXPIRED \| REVOKED)                                                                         Revocation is server-side and immediate (**AUTH-118**).

  **AchievementAward**      AWARDED → (REVOKED)                                                                                   Criteria changes never retroactively revoke (**ACH-007**).
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 45.3 --- Remaining object lifecycles.*

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **GEN-028 RESTATED**                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                      |
| State is authoritative on the server. A client may render a state, predict a transition or optimistically show a result, but the transition happens only when the server has applied the guard, written the audit entry and persisted the new state. |
|                                                                                                                                                                                                                                                      |
| *Status: CONFIRMED*                                                                                                                                                                                                                                  |
+======================================================================================================================================================================================================================================================+
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 46. Use Cases

Twenty-two use cases cover the paths that define the product. Each is traceable to requirements (§48) and to test cases (§47). Four are given in full worked form because they carry the highest risk of being implemented incorrectly; the remainder are specified in compact form, which carries the same normative weight.

## 46.1 Use-case index

  ------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Name**                                                        **Primary actor**   **Risk if wrong**
  ------------ --------------------------------------------------------------- ------------------- -----------------------------------------
  **UC-001**   Sign in with MFA challenge                                      Any user            Account takeover

  **UC-002**   Recover a forgotten password                                    Any user            Account takeover via reset flow

  **UC-003**   Administrator provisions a user and assigns a scoped role       Admin               Over-privileged account

  **UC-004**   Teacher creates a course, cycle and topic structure             Teacher             Structural rework

  **UC-005**   Teacher enrols a classroom into a course                        Teacher             Wrong audience sees content

  **UC-006**   Teacher authors a question and publishes a quiz                 Teacher             Answer-key exposure

  **UC-007**   Student attempts a timed quiz and submits                       Student             Lost work; unfair timing

  **UC-008**   System auto-scores objective questions                          System              Wrong grades at scale

  **UC-009**   Teacher grades free-response work and releases grades           Teacher             Premature disclosure

  **UC-010**   Student submits homework with file attachments                  Student             Lost submission

  **UC-011**   Assistant grades within a delegated scope                       Assistant           Privilege escalation

  **UC-012**   Teacher delegates and later revokes assistant permissions       Teacher             Stale delegation

  **UC-013**   Parent requests and confirms a link to a student                Parent              Unauthorised child data

  **UC-014**   Parent reviews a child\'s progress                              Parent              Over-disclosure

  **UC-015**   Teacher records attendance for a teaching session               Teacher             Record integrity

  **UC-016**   Teacher uploads protected content and publishes it              Teacher             Content leakage

  **UC-017**   Student views protected content through the gateway             Student             Content leakage

  **UC-018**   Student earns points and an achievement                         System              Unfair or duplicated awards

  **UC-019**   Teacher records a payment and an admin verifies it              Teacher, Admin      Wrong entitlement

  **UC-020**   Student is transferred between classrooms mid-period            Admin               Lost academic history

  **UC-021**   Administrator uses exceptional access to investigate a report   Admin               Unaudited privacy breach

  **UC-022**   User requests account deletion and data export                  Any user            Unlawful retention or destroyed records
  ------------------------------------------------------------------------------------------------------------------------------------------

*Table 46.1 --- Use-case index.*

## 46.2 Worked use cases

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **UC-007 --- Student attempts a timed quiz and submits**   
  ---------------------------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Priority**                                               **MUST**

  **Actor**                                                  Student

  **Description**                                            A student opens a published, currently open quiz activity, answers questions within a time limit, and submits --- or is auto-submitted when time expires.

  **Preconditions**                                          Student is authenticated · is a member of a targeted Classroom, Group or is individually targeted · holds an active Entitlement for the course if one is required · Activity is OPEN or OPEN_LATE · attempts used \< attempt_limit.

  **Main behaviour**                                         1\. Student opens the activity. 2. System re-evaluates the §7 authorisation pipeline. 3. System creates a Submission (IN_PROGRESS) with attempt_no = used + 1 and a server-recorded started_at. 4. System returns the pinned QuestionVersions *without answer keys* (GEN-026). 5. Client renders a server-authoritative countdown (FE-008). 6. Client autosaves each answer; each save is server-timestamped. 7. Student submits. 8. System validates the window and required answers, sets submitted_at, transitions to SUBMITTED, and computes is_late. 9. System auto-scores objective items (UC-008). 10. System writes the audit entry and notifies the teacher\'s grading queue.

  **Alternative behaviour**                                  · Time limit expires → auto-submit with whatever is saved, flagged as auto (Table 45.2). · Window closes during the attempt → auto-submit, is_late set per policy. · Network loss → answers persist locally and are re-sent on reconnect (ERR-008); duplicate submits are absorbed by the idempotency key (API-006). · Attempt limit already reached → 422 BR_ATTEMPT_LIMIT, stating attempts used and remaining. · Entitlement missing → 403 ENT_REQUIRED with the next step (§40).

  **Postconditions**                                         A Submission exists in SUBMITTED or AUTO_GRADED. The student sees a confirmation with a server timestamp. No grade is visible until released (GRD-006).

  **Acceptance criteria**                                    · A submission acknowledged to the student is durably persisted (NFR-007). · No response in the attempt contains an answer key or another student\'s data. · A client clock changed by the student does not extend the attempt. · Two concurrent submits produce exactly one Submission. · An auto-submitted attempt is distinguishable from a manual one in the record.

  **Traces to**                                              ACT-009 · QBN-025 · GEN-026 · FE-008 · API-006 · DB-013 · NFR-007 · Table 45.2 · TC-007-\*
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **UC-011 --- Assistant grades within a delegated scope**   
  ---------------------------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Priority**                                               **MUST**

  **Actor**                                                  Assistant

  **Description**                                            An assistant grades submissions for activities inside the scope a teacher delegated to them, and cannot act outside it.

  **Preconditions**                                          Assistant is authenticated · holds an ACTIVE AssistantAssignment whose scope contains the activity · the assignment includes the GRADE permission · valid_until has not passed · the delegating teacher still holds GRADE in an equal-or-wider scope.

  **Main behaviour**                                         1\. Assistant opens the grading queue; the queue is filtered by the delegated scope, not by the teacher\'s full scope. 2. System evaluates the pipeline including the delegation stage and the no-amplification check (GEN-025). 3. Assistant enters a score and feedback. 4. System writes the Grade in DRAFT or PENDING_REVIEW according to the teacher\'s configuration. 5. System writes an audit entry naming the assistant as actor and the delegating teacher as the authority. 6. If the teacher requires review, the teacher is notified; otherwise the assistant may release if the delegation includes RELEASE.

  **Alternative behaviour**                                  · Assignment expired → 403 PERM_DELEGATION_EXPIRED, evaluated at request time, not by a nightly job (AST-007). · Activity outside the delegated scope → 404 (ERR-005) since the assistant is not inside that scope. · Teacher\'s own permission was revoked → the derived delegation fails immediately (GEN-025). · Delegation excludes RELEASE → grade is saved but the release action is unavailable and the interface states why (UX-P2).

  **Postconditions**                                         A Grade exists attributed to the assistant, with the delegation recorded. The student sees nothing until the grade is RELEASED.

  **Acceptance criteria**                                    · An assistant cannot grade one submission outside the delegated scope, through any endpoint. · Revoking the delegation takes effect on the next request, with no cached permission. · An assistant can never hold a permission the delegating teacher does not hold. · Every assistant action names both identities in the audit log.

  **Traces to**                                              AST-007 · SEC-014 · GEN-025 · ERR-005 · AUD-004 · Table 45.3 · TC-011-\*
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **UC-017 --- Student views protected content through the gateway**   
  -------------------------------------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Priority**                                                         **MUST**

  **Actor**                                                            Student

  **Description**                                                      A student opens course content at protection level 2 or 3; the platform serves it through the Content Gateway rather than exposing an object URL.

  **Preconditions**                                                    Student is authenticated · is in the content\'s audience or holds a ContentAccessGrant · holds any required Entitlement · the ContentItem is PUBLISHED.

  **Main behaviour**                                                   1\. Student requests the item. 2. API evaluates the pipeline and issues a short-lived, single-use gateway ticket bound to the user, the item and the login session. 3. Client requests the stream or render from the gateway with the ticket. 4. Gateway re-validates the ticket and the authorisation independently of the API. 5. Gateway applies the protection level: dynamic watermark, no-download rendering, segmented delivery. 6. Gateway writes a ContentAccessEvent. 7. Anomaly scoring evaluates the event asynchronously (CNT-026).

  **Alternative behaviour**                                            · Ticket expired or replayed → 403; a new ticket must be requested. · Entitlement absent → 403 ENT_REQUIRED. · Abnormal access pattern → a ContentAbuseSignal is raised for human review; access is not automatically terminated (CNT-029). · Gateway unavailable → the failure is scoped to content viewing; submission and grading continue (ERR-010).

  **Postconditions**                                                   The student has viewed the content. A ContentAccessEvent exists, with a watermark payload hash where watermarking applies. No durable object URL was exposed.

  **Acceptance criteria**                                              · No response at any layer contains a direct storage URL for level 2--3 content. · A ticket cannot be replayed, shared, or used from a different login session. · The content is not present in the client bundle or in a durable client cache (FE-004). · The platform nowhere claims that screenshots are prevented (GEN-022).

  **Traces to**                                                        CNT-018 · CNT-026 · CNT-029 · GEN-017 · GEN-022 · FE-004 · API-012 · TC-017-\*
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **UC-020 --- Student is transferred between classrooms mid-period**   
  --------------------------------------------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Priority**                                                          **MUST**

  **Actor**                                                             Administrator

  **Description**                                                       A student moves from one classroom to another during an academic period without losing any academic history.

  **Preconditions**                                                     Administrator holds the membership-management permission at organisation scope · both classrooms exist in the same AcademicPeriod · the student has an ACTIVE membership in the source classroom.

  **Main behaviour**                                                    1\. Admin selects the student and the destination classroom. 2. System shows the consequences: which courses the student will gain and lose, which activities are already targeted, which grades exist, and which will remain visible. 3. Admin confirms. 4. System sets left_at on the source Membership rather than deleting it (GEN-018). 5. System creates the destination Membership. 6. System evaluates Enrollments: enrolments driven by the source classroom are marked TRANSFERRED, not withdrawn; enrolments driven by the destination classroom are created. 7. All existing Grades, Submissions, AttendanceRecords and AchievementAwards are retained unchanged. 8. Progress projections are recomputed. 9. Points earned remain in the ledger; leaderboard standings are recomputed for both scopes. 10. Audit entries are written for every affected object.

  **Alternative behaviour**                                             · An activity is open and targeted at the source classroom → the student retains access to complete it unless the admin explicitly chooses otherwise; the choice is recorded. · Destination classroom is in a different AcademicPeriod → rejected (422 BR_PERIOD_MISMATCH); this is a new enrolment, not a transfer. · Student has an in-progress timed attempt → the transfer is blocked until it completes or is voided, with the reason stated.

  **Postconditions**                                                    The student is a member of the destination classroom. Every grade, submission, attendance mark and achievement earned before the transfer is intact and still attributable.

  **Acceptance criteria**                                               · No grade, submission or attendance record is deleted or altered by a transfer. · Historical records remain attributed to the classroom in which they were earned. · The student\'s points balance is unchanged. · The admin saw the full consequence list before confirming (UX-P3).

  **Traces to**                                                         BR-015 · GEN-018 · PTS-003 · PRG-006 · AUD-003 · Table 45.3 · TC-020-\*
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 46.3 Compact use-case specifications

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Trigger → main flow**                                                                                                                  **Critical guard / exception**
  ------------ ---------------------------------------------------------------------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------
  **UC-001**   Credentials submitted → validate → MFA challenge if enabled → create LoginSession → issue tokens → land on role dashboard                Generic failure message regardless of cause (ERR-007) · progressive delay and lockout (AUTH-1xx) · new-device notification

  **UC-002**   Reset requested → always respond identically → send single-use, short-lived, bound token → verify → set password → revoke all sessions   No account-existence disclosure · token single-use · all existing sessions revoked on success

  **UC-003**   Admin creates user → assigns role *within a scope* → invitation sent → user activates and sets credentials                               Scope is mandatory; an unscoped educational role is rejected · admin cannot grant beyond own authority (GEN-025) · fully audited

  **UC-004**   Teacher creates Course under a Subject → adds Cycles in sequence → adds Topics                                                           sequence_no unique per parent · publishing requires at least one Cycle and one Topic

  **UC-005**   Teacher adds a Classroom or Group to CourseAudience → members gain access                                                                Audience change never retroactively grants access to already-closed assessments · notifies affected students

  **UC-006**   Teacher authors Question → creates QuestionVersion → builds Activity → pins versions via ActivityQuestion → publishes                    Publishing freezes the pinned versions (QBN-025) · answer key never serialised to a student response (GEN-026)

  **UC-008**   Submission enters SUBMITTED → objective items scored against the pinned QuestionVersion → AUTO_GRADED → Grade created in DRAFT           Scoring uses the pinned version, never the current bank version · auto and manual scores stored separately · idempotent under retry

  **UC-009**   Teacher opens grading queue → enters scores and feedback → bulk-releases                                                                 Release is explicit (GRD-006) · post-release change writes GradeHistory with a reason (GRD-009) · blast radius shown before commit

  **UC-010**   Student opens homework → uploads files via signed URL → commits → submits                                                                Type, size and content validation server-side · late flag per policy · files become SubmissionFiles referencing the file layer

  **UC-012**   Teacher creates AssistantAssignment with scope, permission set and expiry → later revokes                                                Cannot exceed the teacher\'s own authority · expiry evaluated at request time · revocation immediate · both actions audited and notified

  **UC-013**   Parent requests link → student or admin confirms → link becomes CONFIRMED                                                                REQUESTED grants nothing (PAR-002) · confirmation is auditable · either side can revoke

  **UC-014**   Parent opens child summary → sees released grades, attendance, progress, upcoming work                                                   Read-only · no submission content, no unreleased grades, no other students, no leaderboard positions of others

  **UC-015**   Teacher opens session roll → marks states in bulk → saves                                                                                Any change writes AttendanceHistory · cancelling a session voids marks with a reason rather than deleting them (SES-014)

  **UC-016**   Teacher uploads to storage → sets protection level → attaches as ContentItem → publishes                                                 FileReference created; the file can no longer be hard-deleted (STR-023) · protection level determines the delivery path

  **UC-018**   Qualifying event occurs → criteria evaluated → PointsLedger entry and AchievementAward written → student notified                        Balance is the ledger sum, never a counter (PTS-003) · idempotent: one event cannot award twice · later criteria changes never revoke past awards (ACH-007)

  **UC-019**   Teacher records payment → uploads evidence → admin reviews → VERIFIED → Entitlement granted                                              No card number or CVV is ever collected (PAY-011) · verification is a human decision · entitlement is a separate object from the payment (BIL-003)

  **UC-021**   Admin states a reason → exceptional access granted → banner shown throughout → access ends                                               Reason mandatory · every action audited under both identities · the affected user\'s record shows that exceptional access occurred (ADM-021)

  **UC-022**   User requests deletion/export → identity verified → consequences shown → grace period → anonymise → purge where permitted                Academic and audit records are retained and de-identified, not destroyed (LIF-003) · guardian may exercise for a minor (LIF-009) · every step audited
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 46.2 --- Compact use-case specifications. These carry the same normative weight as the worked cases.*

# 47. Testing & Quality Assurance

## 47.1 Test strategy

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Level**                **Scope**                                                                                                                                    **Gate**
  ------------------------ -------------------------------------------------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------
  **Unit**                 Domain rules in isolation: grading arithmetic, scope containment, points calculation, state-machine guards, late policy, attempt limits.     Runs on every commit. A failing unit test blocks merge.

  **Integration**          Service + persistence + authorisation together, against a real database engine, not a mock.                                                  Runs on every pull request.

  **Contract**             Every endpoint validated against the OpenAPI specification in both directions.                                                               A drift between specification and implementation fails the build (API-011).

  **End-to-end**           The 22 use cases of §46 driven through the real client.                                                                                      Runs before every release.

  **Security**             Authorisation matrix tests, IDOR probes, injection, XSS, CSRF, SSRF, upload abuse, rate-limit behaviour, token replay, session revocation.   Runs on every pull request; full sweep before release.

  **Performance / load**   The full-cohort simultaneous assessment scenario (PERF-022), plus the AP-1...AP-10 access patterns.                                          Before launch and before any release that changes an assessment path.

  **Accessibility**        Automated axe-class checks on every screen plus manual keyboard and screen-reader passes on the core flows.                                  Automated on every pull request; manual before release.

  **Migration**            Full MVP → production rehearsal against production-shaped data (INF-011).                                                                    Before cutover, and after any schema change that touches an academic table.

  **Usability**            Moderated tests for NFR-020 and NFR-021.                                                                                                     Before launch.

  **Disaster recovery**    Restore from backup into a clean environment and verify integrity (INF-007).                                                                 Quarterly and before launch.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 47.1 --- Test levels and gates.*

## 47.2 Coverage requirements

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Area**                      **Requirement**
  ----------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Authorisation pipeline**    Every stage of the §7 pipeline shall have negative tests. Every role × scope × permission combination in the §26 matrix shall have an automated allow and deny test.

  **Grading and points**        Every grading mode, scale, override, release and regrade path shall be covered, including the GradeHistory write.

  **Assessment integrity**      Timer expiry, window closure, attempt limits, concurrent submit, network loss and answer-key exclusion shall each have a dedicated test.

  **State machines**            Every transition in §45 shall have a positive test, and every *invalid* transition shall have a rejection test.

  **Payment and entitlement**   Every state in the PaymentRecord machine, and the separation of payment state from entitlement state (BIL-003).

  **Data lifecycle**            Deletion, anonymisation, export and retention-hold behaviour (§44).

  **Multi-tenancy**             A cross-tenant read or write attempt shall be tested for every scoped resource group.

  **Portability**               Both implementations of each abstraction in BE-008 shall be exercised by the integration suite.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 47.2 --- Mandatory coverage areas.*

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **COVERAGE PERCENTAGE IS NOT THE TARGET**                                                                                                                                                                                                                                       |
|                                                                                                                                                                                                                                                                                 |
| A line-coverage number can be met without testing a single authorisation denial. The requirement is the *matrix* in Table 47.2: every deny path, every invalid transition, every cross-tenant attempt. A release that meets a coverage percentage but lacks these is not ready. |
|                                                                                                                                                                                                                                                                                 |
| *Status: CONFIRMED · Owner: QA*                                                                                                                                                                                                                                                 |
+=================================================================================================================================================================================================================================================================================+
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 47.3 Defect classification

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Severity**          **Definition**                                                                                                                       **Release rule**
  --------------------- ------------------------------------------------------------------------------------------------------------------------------------ ---------------------------------------------------------------------------------
  **S1 --- Critical**   Data loss, incorrect grade, unauthorised access, payment or entitlement error, assessment integrity failure, platform unavailable.   Blocks release. No exceptions.

  **S2 --- Major**      A core workflow cannot be completed; a significant role is blocked; a security control is degraded but not bypassed.                 Blocks release unless a documented workaround is accepted by the project owner.

  **S3 --- Moderate**   A workflow is completable but impaired; incorrect non-academic display; accessibility barrier on a non-core path.                    May ship with an agreed fix date.

  **S4 --- Minor**      Cosmetic, copy, or low-impact inconsistency.                                                                                         May ship.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 47.3 --- Defect severity and release rules.*

## 47.4 Test data and environments

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**       **Requirement**                                                                                                                                                                                                                           **Priority**   **Actor**
  ------------ ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **QA-001**   Test environments shall never contain real student personal data. Test data shall be synthetic or irreversibly anonymised.                                                                                                                **MUST**       QA, DevOps

  **QA-002**   A reproducible seed dataset shall exist covering: multiple organisations, all roles, multi-role users, delegated assistants, confirmed and unconfirmed parent links, all activity types, all protection levels, and every state in §45.   **MUST**       QA

  **QA-003**   Environments shall be: local, CI, staging (production-shaped), production. Staging shall run the same images and migrations as production.                                                                                                **MUST**       DevOps

  **QA-004**   No test shall depend on a real payment, a real email delivery to a real address, or a real third-party account.                                                                                                                           **MUST**       QA

  **QA-005**   Every S1 defect shall gain a regression test before its fix is merged.                                                                                                                                                                    **MUST**       QA
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 47.4 --- Test data and environment requirements.*

## 47.5 Operational readiness

  ------------------------------------------------------------------------------------------------------------------------------------------------
  **Runbook**                                     **Must exist before launch**
  ----------------------------------------------- ------------------------------------------------------------------------------------------------
  **Assessment in progress during an incident**   How to extend windows fairly, and how the extension is recorded and communicated.

  **Suspected content leak**                      How to investigate ContentAccessEvents, what may and may not be concluded, and who decides.

  **Suspected account compromise**                Session revocation, credential reset, audit review, notification.

  **Grade correction at scale**                   How a systematic scoring error is corrected with GradeHistory intact and students informed.

  **Restore from backup**                         Full restore, verification, and the decision on what to do about work done in the lost window.

  **Migration cutover and rollback**              The INF-010 sequence, the verification checklist and the rollback decision point.

  **Data subject request**                        Export and deletion handling, retention holds, guardian requests.
  ------------------------------------------------------------------------------------------------------------------------------------------------

*Table 47.5 --- Required operational runbooks (NFR-015).*

# 48. Acceptance Criteria & Traceability

## 48.1 V1 acceptance gate

V1 is accepted when *every* statement below is demonstrably true. These are not aspirations; each maps to an automated or witnessed test.

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**      **Acceptance statement**                                                                                                                     **Evidence**
  ----------- -------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------------------------------------
  **AC-01**   A teacher can create a course with cycles and topics, publish homework and a quiz, grade both, and release grades --- end to end, unaided.   E2E UC-004...UC-009 + NFR-020 usability session

  **AC-02**   A student can find, complete and submit assigned work on a 360 px phone, and see the grade only after release.                               E2E UC-007, UC-010 + NFR-021 usability session

  **AC-03**   No user can read or write any data outside their authorised scope through any endpoint, including by identifier manipulation.                Full §26 permission-matrix test suite + IDOR sweep

  **AC-04**   An answer key is never present in any client-bound payload for a user without the permission.                                                Automated payload inspection across every assessment endpoint

  **AC-05**   An assistant cannot exceed the delegating teacher\'s authority, and revocation takes effect immediately.                                     E2E UC-011, UC-012 + negative matrix

  **AC-06**   A parent sees only what §22 permits, and only through a confirmed link.                                                                      E2E UC-013, UC-014 + negative matrix

  **AC-07**   A submission acknowledged to a student is durably persisted and recoverable.                                                                 NFR-007 durability test + kill-during-write test

  **AC-08**   A classroom transfer loses no grade, submission, attendance mark or achievement.                                                             E2E UC-020 with before/after record comparison

  **AC-09**   Level 2--3 content is never delivered by a direct object URL and never appears in a client bundle or durable cache.                          Network and bundle inspection + E2E UC-017

  **AC-10**   No card number or CVV is collected, transmitted or stored anywhere in the system.                                                            Code and schema audit + payment E2E

  **AC-11**   Every entry in the §36 audited-event catalogue is written, immutable, and queryable by target object.                                        Audit completeness suite

  **AC-12**   A cross-tenant read or write is impossible for every scoped resource group.                                                                  Multi-tenancy negative suite

  **AC-13**   The full-cohort simultaneous assessment scenario meets the thresholds fixed under D-05.                                                      Load test report

  **AC-14**   The client meets WCAG 2.1 AA on every core screen.                                                                                           Automated + manual accessibility audit

  **AC-15**   A full MVP → production migration rehearsal completes with byte-level object verification and zero academic-record loss.                     Rehearsal report (INF-011)

  **AC-16**   A restore from backup into a clean environment succeeds and the restored data passes integrity verification.                                 DR test report (INF-007)

  **AC-17**   Account deletion and data export behave per §44, with retained records correctly de-identified.                                              E2E UC-022 + record inspection

  **AC-18**   Every runbook in Table 47.5 exists and has been walked through by its owner.                                                                 Readiness review sign-off

  **AC-19**   No S1 or unwaived S2 defect is open.                                                                                                         Defect register

  **AC-20**   Every OPEN decision in §51 marked \'required before launch\' is closed.                                                                      Decision register
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 48.1 --- V1 acceptance gate.*

## 48.2 Traceability model

Traceability is maintained as a live artefact, not a document appendix. The chain is:

+------------------------------------------------------------------------------------------------+
| **The traceability chain**                                                                     |
|                                                                                                |
| Business rule (BR) → Requirement (§7--§45) → Use case (UC) → Test case (TC) → Acceptance (AC)  |
|                                                                                                |
| Every requirement must reach at least one TC. A requirement with no test is not a requirement. |
|                                                                                                |
| Every TC must reach at least one requirement. A test with no requirement is scope creep.       |
|                                                                                                |
| Every AC must be satisfiable by named TCs. An AC with no evidence is an opinion.               |
+================================================================================================+
+------------------------------------------------------------------------------------------------+

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**        **Requirement**                                                                                                                                                       **Priority**   **Actor**
  ------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- ------------
  **TRC-001**   A traceability matrix shall be maintained in a machine-readable form in the repository, linking requirement ID → use case ID → test case ID → acceptance criterion.   **MUST**       QA, PM

  **TRC-002**   CI shall fail if a requirement marked MUST has no linked test case.                                                                                                   **MUST**       QA

  **TRC-003**   A change to a requirement shall require review of every linked use case, test case and business rule before merge (§1.5 change control).                              **MUST**       PM

  **TRC-004**   Requirement status (Pending · In design · In development · In test · Accepted) shall be visible per requirement.                                                      **SHOULD**     PM
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 48.2 --- Traceability requirements.*

## 48.3 Traceability matrix --- representative extract

  ------------------------------------------------------------------------------------------------------------------------------------------
  **Business rule**                             **Requirement**                     **Use case**     **Test case**          **Acceptance**
  --------------------------------------------- ----------------------------------- ---------------- ---------------------- ----------------
  **BR-015 · Class change preserves history**   CLS-009, CLS-010, GEN-018, PTS-003  UC-020           TC-020-01...07         AC-08

  **Answer keys never leave the server**        GEN-026, QBN-039, API-007, FE-003   UC-006, UC-007   TC-006-04, TC-007-09   AC-04

  **Assistants never exceed teachers**          GEN-025, AST-007, SEC-014           UC-011, UC-012   TC-011-01...12         AC-05

  **Grades are released explicitly**            GRD-004, GRD-006, GRD-009           UC-009           TC-009-01...08         AC-01, AC-11

  **Parents see only confirmed children**       PAR-002, PAR-006, SEC-012           UC-013, UC-014   TC-013-01...05         AC-06

  **Protected content is gateway-only**         CNT-018, GEN-017, API-012, FE-004   UC-016, UC-017   TC-017-01...09         AC-09

  **No card data is stored**                    PAY-011, PRV-008                    UC-019           TC-019-03              AC-10

  **Payment ≠ entitlement**                     BIL-003, PAY-014                    UC-019           TC-019-05...08         AC-10

  **Every privileged action is audited**        AUD-002, AUD-004, ADM-021           UC-021           TC-021-01...06         AC-11

  **Tenant isolation**                          DB-001, DB-011, SEC-004             All              TC-MT-01...20          AC-12

  **A submission is never lost**                NFR-007, DB-013, ERR-008            UC-007, UC-010   TC-007-11, TC-010-06   AC-07
  ------------------------------------------------------------------------------------------------------------------------------------------

*Table 48.3 --- Representative traceability extract. The complete matrix is maintained per TRC-001.*

# 49. V1 Scope & Roadmap

## 49.1 V1 scope --- MoSCoW

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Capability**                                                       **V1**   **Note**
  -------------------------------------------------------------------- -------- ---------------------------------------------------------------------------------
  **Authentication, MFA, session management, password recovery**       MUST     §35

  **Users, scoped roles, permission matrix, admin management**         MUST     §8, §26

  **Classroom, Group, Subject, Course, Cycle, Topic, Enrolment**       MUST     §9, §10

  **Teaching sessions and attendance**                                 MUST     §11

  **Activities: homework, quiz, exam; targeting; windows; attempts**   MUST     §12

  **Question bank with version pinning**                               MUST     §13

  **Teacher storage, file versioning, references**                     MUST     §14

  **Content publishing, protection levels 0--2**                       MUST     §15, §16

  **Grading, feedback, explicit release, grade history**               MUST     §17

  **Progress tracking**                                                MUST     §17

  **Assistant delegation with scope and expiry**                       MUST     §21

  **Parent linking and read-only child view**                          MUST     §22

  **Notifications (in-app + email)**                                   MUST     §28

  **Audit log**                                                        MUST     §36

  **Payment recording with evidence and manual verification**          MUST     §30

  **Entitlements**                                                     MUST     §31

  **Achievements and points**                                          SHOULD   §18 --- core motivational value; low technical risk

  **Leaderboards**                                                     SHOULD   §18 --- ships disabled by default (LDB-009)

  **Contextual messaging**                                             SHOULD   §27

  **Calendar view**                                                    SHOULD   §29

  **Content protection level 3 (DRM, hardened streaming)**             COULD    Significant cost; justified only by a demonstrated leak problem

  **Math Knowledge Hub as a structured content library**               COULD    Deliverable as protected content in V1; the interactive hub is a later product

  **Analytics beyond per-course reporting**                            COULD    §25

  **Installable PWA**                                                  COULD    §41.1

  **Native mobile applications**                                       WON\'T   §49.2

  **Desktop applications**                                             WON\'T   §49.2

  **Online payment gateway integration**                               WON\'T   V1 records payments; it does not process them

  **AI-assisted content, grading or tutoring**                         WON\'T   §49.2 --- requires its own requirements, privacy analysis and evaluation regime

  **Public course marketplace**                                        WON\'T   Out of product scope for V1

  **Open student-to-student direct messaging**                         WON\'T   Safeguarding (MSG-004)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 49.1 --- V1 scope classification.*

## 49.2 Roadmap with entry criteria

A roadmap item is not a promise; it is a decision with a stated trigger. Each item below states what must be true *before* it is worth building.

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Horizon**       **Item**                                            **Entry criteria**
  ----------------- --------------------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Next**          Installable PWA with offline study                  V1 stable · measured evidence that students lose work or access to connectivity

  **Next**          Online payment gateway integration                  Transaction volume makes manual verification the bottleneck · a compliant processor selected · EduCapsules still stores no card data

  **Next**          Richer analytics and cohort reporting               Teachers ask a question the current reports cannot answer · the underlying events are already captured

  **Later**         Native mobile applications                          A requirement exists that the web client provably cannot meet --- hardened content protection, true offline, or platform DRM

  **Later**         Content protection level 3 / DRM                    A demonstrated, measured leakage problem that level 2 does not contain · licensing cost accepted

  **Later**         Interactive Math Knowledge Hub                      The content library exists and is used · a specific pedagogical model is defined, not just a topic tree

  **Later**         Multi-organisation / district administration        More than one organisation is live and shares governance needs

  **Exploratory**   AI-assisted authoring, feedback and study support   Its own SRS section · a privacy analysis of what student data is processed and where · a defined evaluation method for output quality · a stated position on the use of student work as training data (§33)

  **Exploratory**   Desktop applications                                A requirement no web or native mobile client can meet
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 49.2 --- Roadmap with explicit entry criteria.*

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **SCOPE DISCIPLINE**                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                              |
| Every item in Table 49.2 is currently excluded. Moving one into scope requires a recorded change per §1.5: the trigger that fired, the requirements affected, the schedule impact, and the project owner\'s approval. Silent scope growth is the most likely way this project fails to ship. |
|                                                                                                                                                                                                                                                                                              |
| *Status: CONFIRMED · Owner: Project Manager*                                                                                                                                                                                                                                                 |
+==============================================================================================================================================================================================================================================================================================+
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 50. Risks & Constraints

## 50.1 Constraints

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**       **Constraint**                                                                    **Consequence for design**
  ------------ --------------------------------------------------------------------------------- ------------------------------------------------------------------------------------------------------------------------------------
  **CON-01**   The MVP runs on Cloudflare only (project decision).                               Every platform primitive sits behind an abstraction (BE-008); no Cloudflare SDK call from a service class.

  **CON-02**   Production is an InterServer Linux VPS.                                           Single-region, self-managed. Availability targets and DR must be honest about what one VPS provides (§43.3).

  **CON-03**   The delivery team is small --- one owner, one engineer, one tester.               Scope discipline (§49) is a survival requirement, not a preference. Automation over manual process everywhere.

  **CON-04**   Payments are recorded manually with evidence; no gateway in V1.                   Verification is a human workflow with an SLA, and the interface must set that expectation.

  **CON-05**   Students are expected to use low-end mobile devices on constrained connections.   Performance budgets and offline tolerance are functional requirements, not polish.

  **CON-06**   Some users are minors.                                                            Guardian consent, safeguarding constraints on messaging, and retention rules for minors\' data are non-negotiable (§32, §33, §44).

  **CON-07**   The product\'s commercial value rests on protected teaching content.              Content protection is a core requirement, and the platform must be honest about its limits (GEN-022).
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 50.1 --- Project constraints.*

## 50.2 Risk register

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**     **Risk**                                                                         **Sev.**   **Mitigation**                                                                                                                                             **Owner**
  ---------- -------------------------------------------------------------------------------- ---------- ---------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------
  **R-01**   Platform-primitive leakage welds the product to Cloudflare (§41.3).              High       BE-008 two implementations in CI from sprint one; architecture review gate.                                                                                Engineer

  **R-02**   Migration during an academic period damages assessment or grade data.            High       INF-011 rehearsal; INF-014 window rules; schedule between periods.                                                                                         PM

  **R-03**   Scope creep exhausts a three-person team before launch.                          High       §49 MoSCoW is contractual; §1.5 change control; roadmap entry criteria.                                                                                    PM

  **R-04**   Authorisation defect exposes student data or answer keys.                        Critical   §7 single pipeline; full negative permission matrix in CI (Table 47.2); AC-03, AC-04.                                                                      Engineer + QA

  **R-05**   Content leaks despite protection, damaging teacher trust.                        High       Levels 0--3, gateway-only delivery, watermarking, anomaly detection --- and honest communication that no web platform prevents screen capture (GEN-022).   Engineer

  **R-06**   Simultaneous cohort assessment overwhelms the MVP platform.                      High       PERF-022 is the primary load scenario; thresholds fixed by measurement (D-05) before launch.                                                               Engineer + QA

  **R-07**   Manual payment verification becomes the operational bottleneck.                  Medium     Bulk verification tooling; measured queue time; roadmap trigger for gateway integration.                                                                   Owner

  **R-08**   Retention and minors\' data handling is set without qualified legal advice.      High       D-06 blocks production launch; periods are TBD until counsel confirms.                                                                                     Owner

  **R-09**   Assessment integrity is compromised (shared answers, proxy attempts).            Medium     Question randomisation, version pinning, attempt limits, anomaly signals --- and an explicit statement that V1 does not proctor.                           Engineer

  **R-10**   Leaderboards cause reputational or wellbeing harm.                               Medium     Off by default (LDB-009); visibility modes; no identification of low performers (LDB-005).                                                                 Owner

  **R-11**   Single-VPS production creates an availability ceiling.                           Medium     Honest NFR-001 target; Cloudflare edge in front; tested restore (INF-007); documented upgrade path.                                                        Engineer

  **R-12**   Requirements drift as the document ages and code diverges from it.               Medium     NFR-017 --- the SRS changes in the same change that alters behaviour; TRC-003 review gate.                                                                 PM

  **R-13**   Two source specifications were referenced but not supplied (§1.4, Appendix D).   Medium     Assistant and classroom requirements were reconstructed from the surrounding material and are marked for confirmation.                                     Owner
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 50.2 --- Risk register.*

# 51. Open Decisions Register

Every item below is a decision this document deliberately did *not* make, because making it would have required inventing a fact. Each states who decides, and what it blocks.

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**     **Decision required**                                                                        **Blocks**                                     **Owner**
  ---------- -------------------------------------------------------------------------------------------- ---------------------------------------------- -----------------
  **D-01**   Read-model strategy for dashboards, progress and leaderboards (§37.5.1).                     Schema freeze                                  Engineer

  **D-02**   Concrete rate-limit budgets per endpoint class (§38.3).                                      Load-test plan                                 Engineer

  **D-03**   Launch locale set and whether right-to-left layout ships in V1 (§41.2).                      UI implementation                              Owner

  **D-04**   Full brand token set: type scale, spacing, elevation, motion, icons, dark palette (§42.2).   Component library                              Design

  **D-05**   Performance thresholds, set from measurement rather than assertion (§43.1).                  Launch readiness                               Engineer + QA

  **D-06**   Retention periods, applicable data-protection regime, and minors\' data rules (§44.3).       Production launch                              Owner + counsel

  **D-07**   V1 capacity model: cohort size, peak concurrent assessment, storage growth (§43.2).          Capacity planning                              Owner

  **D-08**   Grade scale definition: numeric, letter, or configurable per organisation (§17).             Grading implementation                         Owner

  **D-09**   Whether achievements and leaderboards ship in V1 or immediately after (Table 49.1).          Sprint plan                                    Owner

  **D-10**   Assistant permission defaults: which permissions are delegatable out of the box (§26).       Permission catalogue freeze                    Owner

  **D-11**   Whether the Math Knowledge Hub is content in V1 or a distinct product surface (§20).         Content model                                  Owner

  **D-12**   Payment verification SLA and who performs it at volume (§30).                                Operational readiness                          Owner

  **D-13**   Whether teacher content ownership permits platform reuse, and on what terms (§33).           Terms of service                               Owner + counsel

  **D-14**   Session and token lifetimes per session type (§35).                                          Auth implementation                            Engineer

  **D-15**   Whether V1 supports more than one organisation in production (§8).                           Tenancy testing scope                          Owner

  **D-16**   Confirmation of the two source specifications not supplied with this package (Appendix D).   Assistant and classroom requirement sign-off   Owner

  **D-17**   Progress weighting formula per Activity type for the overall completion figure (§17.2).      Progress computation implementation            Owner

  **D-18**   Leaderboard ranking source, tie rule and reset period (§18.2); default visibility mode is fixed by LDB-009 (disabled until enabled).        Enabling any leaderboard                       Owner
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 51.1 --- Open decisions register. Items D-03, D-05, D-06, D-07, D-08 and D-17 are required before launch (AC-20). D-18 blocks only the act of enabling a leaderboard, which is off by default (LDB-009) and is not itself launch-blocking. v1.1 added D-17 and D-18 to close two decisions that §17.2 and §18.2 already referenced as OPEN but that were not previously recorded in this register (Appendix E).*

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **HOW AN OPEN DECISION CLOSES**                                                                                                                                                                       |
|                                                                                                                                                                                                       |
| It closes by being *recorded*: the decision, its rationale, its date, its owner, and the sections updated as a result (§1.5). A decision made in conversation and not written here has not been made. |
|                                                                                                                                                                                                       |
| *Status: CONFIRMED*                                                                                                                                                                                   |
+=======================================================================================================================================================================================================+
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 52. Appendices

## 52.1 Appendix A --- Requirement prefix registry

  -------------------------------------------------------------------------------------------------------------------------
  **Prefix**                  **Area**                               **Prefix**     **Area**
  --------------------------- -------------------------------------- -------------- ---------------------------------------
  **GEN**                     Architectural golden rules (§4)        MSG            Communication (§27)

  **SEC**                     Security & authorisation (§7, §34)     NOT            Notifications (§28)

  **ORG / PER**                Organisation & tenancy, academic periods (§8)   CAL            Calendar (§29)

  **CLS / GRP**               Classroom & group (§9)                 PAY            Payments (§30)

  **SUB / CRS / CYC / TOP**   Academic structure (§10)               BIL            Billing & entitlement (§31)

  **SES**                     Teaching sessions & attendance (§11)   PRV            Privacy (§32)

  **ACT**                     Activities (§12)                       LEG            Legal (§33)

  **QBN**                     Question bank (§13)                    AUTH           Authentication & login sessions (§35)

  **STR**                     Teacher storage (§14)                  AUD            Audit (§36)

  **CNT**                     Content & protection (§15, §16)        DB             Data model (§37)

  **GRD**                     Grading (§17)                          API            API (§38)

  **PRG**                     Progress (§17)                         BE             Backend architecture (§39)

  **ACH / PTS / LDB**         Gamification (§18)                     ERR            Error handling (§40)

  **TCH**                     Teacher experience (§19)               FE / INF       Frontend / infrastructure (§41)

  **STU**                     Student experience (§20)               UI / UX-P      Interface & design (§42)

  **AST**                     Assistant experience (§21)             PERF / NFR     Non-functional (§43)

  **PAR**                     Parent experience (§22)                LIF            Lifecycle & deletion (§44)

  **ADM**                     Administration (§23)                   QA / TRC       Quality & traceability (§47, §48)

  **BR**                      Business rules                         UC / TC / AC   Use cases, test cases, acceptance

  **D**                       Open decisions (§51)                   R / CON        Risks and constraints (§50)
  -------------------------------------------------------------------------------------------------------------------------

*Table 52.1 --- Requirement prefix registry. PER added in v1.1 (§8.1); the Gamification and Organisation/tenancy area citations corrected (Appendix E).*

## 52.2 Appendix B --- Requirement ID reconciliation

Consolidating sixteen source specifications produced collisions where two documents used the same prefix for different things. The mapping below is normative: implementers and testers should use the *this document* column, and the *source* column exists so a reader holding an original specification can locate the corresponding requirement.

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Source usage**                        **This document**                                             **Reason**
  --------------------------------------- ------------------------------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **SES-001...020 (login sessions)**      AUTH-101...126                                                \'Session\' meant two different things. Teaching sessions keep SES; login sessions move to AUTH (§3.2).

  **SES-001...017 (teaching sessions)**   SES-001...017 (unchanged)                                     Retained as the academic meaning.

  **QB-001...042**                        QBN-001...042                                                 QB collided with an abbreviation used for question *banks* and question *blocks* in two documents.

  **FILE-\***                             STR-\* (storage) and CNT-\* (published content)               The source used one prefix for private teacher storage and for published learning content; these have different permissions, lifecycles and protection rules (§14 vs §15).

  **ACH-\* covering points**              ACH-\* (achievements) and PTS-\* (points)                     Points and achievements are separate mechanisms with separate ledgers (§18).

  **PAY-\* covering subscriptions**       PAY-\* (teacher↔student) and BIL-\* (platform↔organisation)   Two different commercial relationships (§30 vs §31).

  **Assorted \'SYS-\*\'**                 Distributed to BE-\*, INF-\*, ERR-\*, NFR-\*                  A catch-all prefix is untraceable; each requirement moved to the area that owns it.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 52.2 --- Requirement ID reconciliation map.*

## 52.3 Appendix C --- Glossary

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Term**                                 **Definition in EduCapsules**
  ---------------------------------------- -------------------------------------------------------------------------------------------------------------------------------
  **Activity**                             The single generic container for assigned work. Homework, quiz and exam are *types* of activity, not separate entities (§12).

  **Assistant**                            Educational staff acting under a teacher\'s delegated, scoped, time-bounded authority. Never a junior teacher (§21).

  **Classroom**                            The administrative unit a student belongs to for an academic period. Structural.

  **Group**                                A flexible teaching or working set. A student may belong to many. Structural.

  **Course**                               A taught instance of a Subject, owned by one teacher, serving one or more classrooms or groups.

  **Cycle**                                An ordered teaching block within a Course.

  **Topic**                                The smallest planned academic unit within a Cycle. Content and activities attach here.

  **Teaching Session**                     A scheduled meeting where teaching happens and attendance is recorded (§11). Prefix SES.

  **Login Session**                        An authenticated client session with tokens, devices and revocation (§35). Prefix AUTH.

  **Enrolment**                            A student\'s academic relationship with a Course. Distinct from Membership, which is structural.

  **Entitlement**                          The only object the authorisation pipeline consults for paid access. Separate from payment state (§31).

  **Scope**                                The container within which a role or permission applies: organisation, classroom, group, subject or course.

  **Delegation**                           A teacher granting a subset of their own authority, within a subset of their own scope, for a bounded time (§21).

  **Protection level**                     0--3, describing how strongly a content item is defended in delivery (§16).

  **Content Gateway**                      The independent authorisation and delivery path for protected content. Never returns a durable object URL.

  **StorageObject / File / FileVersion**   Physical blob / logical user-visible file / immutable revision (§14).

  **Question / QuestionVersion**           Stable bank identity / immutable content revision pinned by an activity (§13).

  **Released grade**                       A grade whose state is RELEASED. It is the only grade state a student can see (§17).

  **Points ledger**                        The append-only record whose sum *is* a student\'s balance. There is no stored counter (§18).

  **Organisation**                         The tenancy root. Every scoped row carries its identifier (§8).
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 52.3 --- Glossary of EduCapsules-specific terms.*

## 52.4 Appendix D --- Source material and reconciliation

This SRS consolidates the specification package supplied by the project owner. It is a reconstruction and formalisation of that material, not a summary of it: conflicts were resolved (§1.4), gaps were completed and marked, and every completion is labelled CONFIRMED, PROPOSED, OPEN or FUTURE.

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Item**                                                     **Status**
  ------------------------------------------------------------ ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Sixteen specification documents supplied and extracted**   Consolidated into this document

  **assistant_acc --- assistant account specification**        REFERENCED BUT NOT SUPPLIED. Assistant requirements in §21 were reconstructed from the delegation rules stated across the other documents. Requires confirmation (D-16, R-13).

  **classroom_details --- classroom specification**            REFERENCED BUT NOT SUPPLIED. Classroom requirements in §9 were reconstructed from the academic hierarchy and membership rules stated elsewhere. Requires confirmation (D-16, R-13).

  **Six substantive conflicts between source documents**       Resolved and recorded as C-1...C-6 (§1.4)

  **Prior EduCapsules SRS v1.0**                               Superseded by this document. Concepts present there but absent from the supplied package (notably CourseOffering) were not reintroduced, in line with the instruction to preserve the decisions in the supplied material.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 52.4 --- Source material status.*

## 52.5 Appendix E --- Document change log

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Version**   **Date**     **Author**     **Summary**
  ------------- ------------ -------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **0.1**       ---          Project team   Initial draft specification.

  **0.2**       ---          M. Mahgoub     Consolidated SRS with diagrams, mockups and worked requirements; project team and approval recorded.

  **1.0**       8 Sep 2026   M. Mahgoub     Master SRS. Full reconstruction from the sixteen supplied specifications: conflict resolution (§1.4), 28 architectural golden rules (§4), consolidated data model (§37), API, backend, error, infrastructure, UI/UX, NFR, lifecycle, state machine, use case, QA, traceability, scope, risk and open-decision sections. Requirement IDs reconciled per Appendix B.

  **1.1**       11 Sep 2026   Audit pass    Systematic audit of v1.0 against its own decisions, data model and traceability chain. No CONFIRMED decision reversed. **Contradictions resolved:** Group/Classroom cardinality corrected in §37.3.2 to match the confirmed GEN-008/GRP-001 (a nullable, cross-classroom Group was removed); cross-tenant storage deduplication corrected in §37.3.4 to match the confirmed §14.4 design (STR-IMP-011/012), not the reverse; duplicate ID BR-014 split --- the classroom/group-change rule renumbered to **BR-015** (§9.2, §37.3.2/3, §45.3, §46.2, §48.3), the payment revenue-share rule keeps BR-014 (§30.1). **Broken cross-references repaired:** §3 terminology citation, §17.2 and §18.2 open-decision citations (now D-17/D-18, newly registered in §51), §35.3 open-decision citation (D-14), QBN-018→QBN-025 (version pinning, three sites), GEN-021→GEN-017 (protected-content caching, three sites), LDB-002→LDB-009 (default-off, three sites), STR-016→STR-023 (referenced-file purge, three sites), SEC-012→SEC-014 where it meant assistant delegation, §24.4 illustration count, §49.1/§52.1 section and area citations. **New requirements closing gaps the document's own structure already implied:** GEN-029 (terminology discipline, testable), SEC-012...015 (relationship re-verification, previously cited via Table 7.2 but never stated), ACT-009 (no-target activities cannot open), STR-023 (referenced-file purge block), LDB-009 (leaderboard default-off), AUTH-127 (MFA recovery path), ORG-009/010 (Organization closure lifecycle and authorization), §8.1 PER-001...006 (Academic Period, load-bearing in §37.3.2 but previously unspecified), CRS-009/010 (co-teacher grant and audit), BR-021 (teacher-deletion ownership transfer, previously cited by LIF-006 but never defined). **Editorial:** §32.3's retention table, which duplicated §44.3 with different category boundaries, replaced with a pointer to the single authoritative schedule (§44.3), which gained a row for trashed-file purge retention. D-17 added to the launch-blocking list in Table 51.1 (progress-weighting formula; Progress is MUST for V1). Full rationale for every item is inline at its location, marked "v1.1" or "added in v1.1".
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

*Table 52.5 --- Document change log.*

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **END OF SPECIFICATION**                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                      |
| This document is the single source of truth for EduCapsules. Where it is silent, it is silent deliberately --- an open decision (§51) or an implementation choice (GEN-013). Where behaviour changes, this document changes in the same change (NFR-017). A decision taken in conversation and not recorded here has not been taken. |
+======================================================================================================================================================================================================================================================================================================================================+
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
