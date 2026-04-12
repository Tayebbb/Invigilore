# VIVA MASTER DOCUMENT - INVIGILORE FULL FEATURE MAPPING

## Scan Scope and Coverage
This document maps the full repository structure and runtime feature flow across frontend, backend, routes, models, services, middleware, migrations, CI/CD, and infrastructure.

Scanned top-level directories:
- .github
- backend
- database
- docker
- frontend
- root docs and infra files

Also detected and categorized (external/third-party):
- backend/vendor (framework and third-party packages)
- frontend build artifacts/dependencies (not primary business logic)

Note:
- External dependency directories are part of runtime behavior but not first-party feature source.
- First-party business logic is concentrated in backend/app, backend/routes, frontend/src/app, and database/migrations.

---

## FEATURE: Authentication and User Identity

### Description
Handles signup, verification code flow, login, profile fetch/update, and logout. Uses token-based auth in frontend and Sanctum-protected API routes.

### FRONTEND
File:
- frontend/src/app/pages/Login.tsx
- frontend/src/app/pages/Signup.tsx
- frontend/src/app/pages/ForgotPassword.tsx
- frontend/src/app/pages/ResetPassword.tsx
- frontend/src/app/api.ts
- frontend/src/app/context/AuthUserContext.tsx
- frontend/src/app/utils/authToken.ts
- frontend/src/app/utils/authUser.ts

Key Code:
- handleLogin
- signup submit handlers
- Axios interceptor in api.ts attaching Bearer token

Flow:
User Action -> Form Submit -> api.post(/login or /register...) -> token persistence -> /me sync -> role/permission-gated UI

### API LAYER
File:
- frontend/src/app/api.ts

Endpoint:
- POST /register
- POST /register/verify-code
- POST /register/resend-code
- POST /login
- GET /me
- PUT /me
- POST /logout

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- Route::post('/register', [AuthController::class, 'register'])
- Route::post('/register/verify-code', ...)
- Route::post('/register/resend-code', ...)
- Route::post('/login', ...)
- Route::middleware('auth:sanctum')->group(...) with /me and /logout

#### Controller
File:
- backend/app/Http/Controllers/AuthController.php

Function:
- register
- verifyRegistrationCode
- resendRegistrationCode
- login
- me
- updateProfile
- logout

Logic:
- Validation and uniqueness checks
- Password hashing
- Pending registration verification
- Token issuance and session context

### MODEL
File:
- backend/app/Models/User.php
- backend/app/Models/PendingUserRegistration.php
- backend/app/Models/Role.php

Purpose:
- User identity and relationships
- Registration pre-verification storage
- Role binding

### DATABASE
Migration:
- database/migrations/0001_01_01_000000_create_users_table.php
- database/migrations/2026_03_08_000002_add_role_id_to_users_table.php
- database/migrations/2026_04_10_000110_create_pending_user_registrations_table.php
- database/migrations/2026_04_10_000100_add_signup_verification_fields_to_users_table.php
- database/migrations/2026_03_07_175302_create_personal_access_tokens_table.php

Tables involved:
- users
- pending_user_registrations
- personal_access_tokens
- roles

### COMPLETE FLOW
Frontend form -> axios request -> api route -> AuthController -> User/PendingUserRegistration -> DB -> token/response -> frontend context update

### EXACT TRACE
- File: backend/routes/api.php
- File: backend/app/Http/Controllers/AuthController.php
- File: frontend/src/app/pages/Login.tsx
- File: frontend/src/app/api.ts

---

## FEATURE: Role-Based Access Control (RBAC) and Permission Middleware

### Description
Database-driven permission checks plus role middleware to guard admin/teacher/student/exam-scoped operations.

### FRONTEND
File:
- frontend/src/app/auth/ProtectedRoute.tsx
- frontend/src/app/context/AuthUserContext.tsx

Key Code:
- ProtectedRoute role and permission gate

Flow:
Route access -> ProtectedRoute checks role/permission from stored auth user -> render or redirect

### API LAYER
File:
- backend/routes/api.php

Endpoint:
- All permission/role guarded groups in api.php

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- Route::middleware('permission:...') groups
- Route::middleware('role:...') groups
- exam.role and exam.paper_status middleware chains

#### Controller
Files:
- multiple controllers behind RBAC routes

Function:
- controller functions execute only when middleware allows

Logic:
- check user role_id and permissions relation
- exam-scoped role checks for moderator/invigilator/controller

### MODEL
File:
- backend/app/Models/User.php
- backend/app/Models/Role.php
- backend/app/Models/Permission.php

Purpose:
- hasPermission / hasAnyPermission methods
- role-permission mapping

### DATABASE
Migration:
- database/migrations/2026_04_12_000200_create_permissions_tables.php
- database/migrations/2026_03_08_000001_create_roles_table.php
- database/migrations/2026_03_08_000002_add_role_id_to_users_table.php

Tables involved:
- roles
- permissions
- permission_role
- users.role_id

### COMPLETE FLOW
Frontend protected route -> API call -> middleware permission/role check -> controller -> model lookup -> response/403

### EXACT TRACE
- File: backend/app/Http/Middleware/CheckPermission.php
- File: backend/app/Http/Middleware/CheckRole.php
- File: backend/app/Http/Middleware/EnsureExamRole.php
- File: frontend/src/app/auth/ProtectedRoute.tsx

---

## FEATURE: Exam CRUD and Teacher Portal

### Description
Create/update/delete exams, teacher portal listing, activation, ending, and result browsing.

### FRONTEND
File:
- frontend/src/app/pages/teacher/MyExamsDashboard.tsx
- frontend/src/app/pages/teacher/CreateExam.tsx
- frontend/src/app/pages/teacher/TeacherResultsPage.tsx
- frontend/src/app/pages/teacher/TeacherDashboardNew.tsx

Key Code:
- exam create/edit handlers
- publish/activate interactions

Flow:
Teacher action -> CreateExam handlers -> api endpoints -> backend exam services/controllers -> UI refresh

### API LAYER
File:
- frontend/src/app/api.ts

Endpoint:
- GET /exams
- POST /exams
- GET /exams/{exam}
- PUT /exams/{exam}
- DELETE /exams/{exam}
- /teacher/portal/* endpoints

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- exam module group and teacher/portal prefix group

#### Controller
File:
- backend/app/Http/Controllers/ExamController.php
- backend/app/Http/Controllers/TeacherPortalController.php

Function:
- index, store, show, update, destroy
- tests, testInfo, activate, end, resultsDatabase, resultDetails, respondents

Logic:
- validation, role/permission checks
- exam state and assignment handling

### MODEL
File:
- backend/app/Models/Exam.php
- backend/app/Models/ExamRole.php

Purpose:
- exam entity and role assignment metadata

### DATABASE
Migration:
- database/migrations/2024_03_08_000001_create_exams_table.php
- database/migrations/2026_04_04_000015_create_exam_roles_and_workflow_tables.php
- workflow/status related exam migrations (2026_04_04_000150, 2026_04_05_000017, etc.)

Tables involved:
- exams
- exam_roles

### COMPLETE FLOW
CreateExam UI -> POST/PUT /exams -> route middleware -> ExamController -> Exam model -> exams table -> API response -> dashboard update

### EXACT TRACE
- File: frontend/src/app/pages/teacher/CreateExam.tsx
- File: backend/app/Http/Controllers/ExamController.php
- File: backend/app/Http/Controllers/TeacherPortalController.php

---

## FEATURE: Question Management (Manual)

### Description
Question CRUD globally and exam-scoped question operations for setters/moderators/teachers.

### FRONTEND
File:
- frontend/src/app/pages/teacher/CreateExam.tsx

Key Code:
- add/edit/remove question handlers

Flow:
Question form interaction -> API call -> backend validation/store -> response list refresh

### API LAYER
Endpoint:
- GET/POST/PUT/DELETE /questions
- GET/POST/PUT/DELETE /exams/{exam}/questions
- GET /exams/{exam}/generate-questions

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- permission:questions.manage group
- exam-scoped question routes

#### Controller
File:
- backend/app/Http/Controllers/QuestionController.php

Function:
- index, show, store, update, destroy
- examQuestions, storeExamQuestion, updateExamQuestion, destroyExamQuestion
- generateQuestions

Logic:
- permission gates
- normalization for options A/B/C/D
- exam ownership/role checks

### MODEL
File:
- backend/app/Models/Question.php

Purpose:
- question persistence and exam relationship

### DATABASE
Migration:
- database/migrations/2026_04_03_000010_create_questions_table.php
- database/migrations/2026_04_11_000000_update_questions_table_structure.php
- database/migrations/2026_04_12_001100_normalize_exam_core_schema.php

Tables involved:
- questions

### COMPLETE FLOW
Question UI -> API -> route -> QuestionController -> QuestionService/Question model -> questions table -> response

### EXACT TRACE
- File: backend/app/Http/Controllers/QuestionController.php
- File: backend/app/Models/Question.php
- File: frontend/src/app/pages/teacher/CreateExam.tsx

---

## FEATURE: AI Question Generation

### Description
Generates exam questions from prompt via OpenRouter model integration, then persists generated questions to exam.

### FRONTEND
File:
- frontend/src/app/pages/teacher/CreateExam.tsx

Key Code:
- handleAiGenerate

Flow:
Teacher enters prompt -> handleAiGenerate -> POST /exams/{exam}/ai-generate -> generated questions saved -> refreshed list shown

### API LAYER
Endpoint:
- POST /exams/{exam}/ai-generate

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- Route::post('/exams/{exam}/ai-generate', [AiQuestionController::class, 'generate'])

#### Controller
File:
- backend/app/Http/Controllers/AiQuestionController.php

Function:
- generate

Logic:
- input validation (prompt/count/difficulty)
- calls AiService.generateQuestions
- normalizes supported types and options
- persists via Question model
- logging on failure

### MODEL
File:
- backend/app/Models/Question.php

Purpose:
- store generated questions

### DATABASE
Migration:
- question and schema migrations listed above

Tables involved:
- questions

### COMPLETE FLOW
AI modal submit -> /ai-generate endpoint -> AiQuestionController -> AiService(OpenRouter) -> Question model create -> DB -> response -> UI success/error

### EXACT TRACE
- File: frontend/src/app/pages/teacher/CreateExam.tsx (handleAiGenerate)
- File: backend/app/Http/Controllers/AiQuestionController.php (generate)
- File: backend/app/Services/AiService.php (generateQuestions)

---

## FEATURE: Student Exam Access and Attempts

### Description
Students can view assigned exams, start attempts, save answers, and submit attempts with timing controls and anti-duplicate rules.

### FRONTEND
File:
- frontend/src/app/pages/student/StudentDashboard.tsx
- frontend/src/app/pages/student/StudentExamAttemptPage.tsx

Key Code:
- start attempt
- answer autosave/save
- submit attempt

Flow:
Student starts exam -> fetch attempt/questions -> save answers -> submit -> result availability

### API LAYER
Endpoint:
- GET /student/exams
- POST /student/exams/{exam}/start
- GET /student/attempts/{attempt}
- POST /student/attempts/{attempt}/answers
- POST /student/attempts/{attempt}/submit
- POST /student/attempts/{attempt}/telemetry
- legacy attempt endpoints in /attempts and /answers

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- student prefix routes with permission middleware
- legacy role-based attempt routes

#### Controller
File:
- backend/app/Http/Controllers/StudentExamController.php
- backend/app/Http/Controllers/ExamAttemptController.php

Function:
- start, showAttempt, saveAnswer, submit, telemetry
- store/start/show/saveAnswer/submit/saveAnswerFromPayload

Logic:
- attempt ownership checks
- status and timeout auto-submit
- answer upsert semantics
- duplicate submission conflict handling

### MODEL
File:
- backend/app/Models/ExamAttempt.php
- backend/app/Models/AttemptAnswer.php
- backend/app/Models/Question.php

Purpose:
- attempt lifecycle and answer persistence

### DATABASE
Migration:
- database/migrations/2026_03_08_000006_create_exam_attempts_table.php
- database/migrations/2026_04_04_000140_create_attempt_answers_table.php
- database/migrations/2026_04_11_095902_add_ai_evaluation_to_attempt_answers_table.php

Tables involved:
- exam_attempts
- attempt_answers
- answers (legacy compatibility)

### COMPLETE FLOW
Student UI -> API -> route/middleware -> StudentExamController or ExamAttemptController -> ExamAttempt/AttemptAnswer -> DB -> response -> timer/result UI

### EXACT TRACE
- File: backend/app/Http/Controllers/StudentExamController.php
- File: backend/app/Http/Controllers/ExamAttemptController.php
- File: frontend/src/app/pages/student/StudentExamAttemptPage.tsx

---

## FEATURE: Results and Submission Evaluation

### Description
Submissions are evaluated and results are published/retrieved for student and teacher views.

### FRONTEND
File:
- frontend/src/app/pages/student/StudentResultsPage.tsx
- frontend/src/app/pages/student/StudentSubmissionHistoryPage.tsx
- frontend/src/app/pages/teacher/TeacherResultsPage.tsx

Key Code:
- results table render and detail fetch

Flow:
Submit exam -> backend score computation -> results endpoints -> dashboards/history views

### API LAYER
Endpoint:
- POST /submissions
- GET /submissions/{submission}
- GET /users/{user}/results
- GET /exams/{exam}/results
- GET /student/results
- GET /student/submissions

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- submission and results routes under auth groups

#### Controller
File:
- backend/app/Http/Controllers/SubmissionController.php
- backend/app/Http/Controllers/StudentResultController.php

Function:
- store, show, userResults, examResults
- index, show, summary

Logic:
- own vs all result visibility checks
- score and publication behavior

### MODEL
File:
- backend/app/Models/Submission.php
- backend/app/Models/SubmissionAnswer.php
- backend/app/Models/Result.php

Purpose:
- response capture and result persistence

### DATABASE
Migration:
- database/migrations/2026_04_05_000021_create_submissions_tables.php
- database/migrations/2026_04_05_000023_create_submission_answers_table.php
- database/migrations/2026_03_08_000008_create_results_table.php
- database/migrations/2026_04_04_000120_add_publication_fields_to_results.php

Tables involved:
- submissions
- submission_answers
- results

### COMPLETE FLOW
Submit from student page -> SubmissionController -> evaluation service/model writes -> results table -> student/teacher query endpoints -> UI rendering

### EXACT TRACE
- File: backend/app/Http/Controllers/SubmissionController.php
- File: backend/app/Services/SubmissionEvaluationService.php
- File: frontend/src/app/pages/student/StudentResultsPage.tsx

---

## FEATURE: Exam Access Control (Public and Private)

### Description
Supports public exam links and private participant assignment by email validation.

### FRONTEND
File:
- frontend/src/app/pages/teacher/CreateExam.tsx
- frontend/src/app/pages/student/PublicExamLandingPage.tsx

Key Code:
- generate public link
- assign private users/emails

Flow:
Teacher configures access -> backend stores token and user-email constraints -> public verify/start flow

### API LAYER
Endpoint:
- GET /test/{exam}
- POST /test/{exam}/start
- GET /exams/{exam}/access
- POST /exams/{exam}/access/public
- POST /exams/{exam}/access/private

### BACKEND
#### Route
File: backend/routes/api.php

#### Controller
File:
- backend/app/Http/Controllers/ExamAccessController.php

Function:
- verify
- generatePublic
- generatePrivate
- show

Logic:
- access mode and token management
- normalized email validation and dedup

### MODEL
File:
- backend/app/Models/ExamAccess.php
- backend/app/Models/ExamAccessUser.php

Purpose:
- access metadata and assignee list

### DATABASE
Migration:
- database/migrations/2026_04_05_000018_create_exam_access_tables.php
- database/migrations/2026_04_05_000022_create_exam_access_users_table.php

Tables involved:
- exam_access
- exam_access_users

### COMPLETE FLOW
CreateExam access tab -> backend access APIs -> DB persist -> student/public verify/start -> controlled attempt creation

### EXACT TRACE
- File: backend/app/Http/Controllers/ExamAccessController.php
- File: frontend/src/app/pages/student/PublicExamLandingPage.tsx

---

## FEATURE: Workflow Roles (Setter, Moderator, Invigilator, Controller)

### Description
Implements exam paper progression and exam-day permissions by exam-scoped roles and status checks.

### FRONTEND
File:
- frontend/src/app/pages/teacher/ExamRolePanel.tsx
- frontend/src/app/pages/teacher/ModeratorReview.tsx
- frontend/src/app/auth/ExamRoleAccessRoute.tsx
- frontend/src/app/auth/ExamQuestionSetterRoute.tsx

Key Code:
- exam role-based route access wrappers

Flow:
Role-specific page access -> guarded route -> role middleware-protected backend endpoint

### API LAYER
Endpoint:
- /exam/{exam}/paper
- /exam/{exam}/review
- /exam/{exam}/approve
- /exam/{exam}/instructions
- /exam/{exam}/live
- /exam/{exam}/invigilator
- /exam/{exam}/settings
- /exam/{exam}/activate

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- permission + exam.role + exam.paper_status + exam.live_window chained middleware

#### Controller
File:
- backend/app/Http/Controllers/ExamWorkflowController.php
- backend/app/Http/Controllers/ModeratorReviewController.php

Function:
- paper, review, approve, instructions, live, report, invigilator, settings, updateSettings, activate
- moderator helper methods

Logic:
- workflow state transitions
- role-check enforcement per exam

### MODEL
File:
- backend/app/Models/ExamRole.php
- backend/app/Models/ExamReview.php
- backend/app/Models/ExamIncidentReport.php

Purpose:
- store role assignments and workflow artifacts

### DATABASE
Migration:
- database/migrations/2026_04_04_000015_create_exam_roles_and_workflow_tables.php
- database/migrations/2026_04_04_000151_create_exam_reviews_table.php
- database/migrations/2026_04_04_000152_create_exam_incident_reports_table.php

Tables involved:
- exam_roles
- exam_reviews
- exam_incident_reports

### COMPLETE FLOW
Role-specific UI -> guarded frontend route -> protected backend route group -> workflow controller -> models -> DB -> response

### EXACT TRACE
- File: backend/app/Http/Middleware/EnsureExamRole.php
- File: backend/app/Http/Middleware/EnsureExamPaperStatus.php
- File: backend/app/Http/Middleware/EnsureExamLiveWindow.php

---

## FEATURE: Notifications

### Description
In-app notification retrieval, mark as read, clear all, and teacher notification page.

### FRONTEND
File:
- frontend/src/app/components/layout/NotificationDropdown.tsx
- frontend/src/app/pages/teacher/TeacherNotificationsPage.tsx

Key Code:
- unread polling and read actions

Flow:
UI load -> GET notifications -> read/clear actions -> backend notification updates -> UI count refresh

### API LAYER
Endpoint:
- GET /notifications
- PATCH /notifications/read-all
- PATCH /notifications/{id}/read
- DELETE /notifications
- DELETE /notifications/{id}

### BACKEND
#### Route
File: backend/routes/api.php

#### Controller
File:
- backend/app/Http/Controllers/NotificationController.php

Function:
- index
- markAllAsRead
- markAsRead
- clearAll
- destroy

Logic:
- per-user notification management

### MODEL
File:
- Uses Laravel database notification storage + exam notification class
- backend/app/Notifications/ExamNotification.php

### DATABASE
Migration:
- database/migrations/2026_04_11_102600_create_notifications_table.php

Tables involved:
- notifications

### COMPLETE FLOW
Notification UI -> notification API -> controller -> notifications table -> refreshed UI/unread count

### EXACT TRACE
- File: backend/app/Http/Controllers/NotificationController.php
- File: backend/app/Notifications/ExamNotification.php

---

## FEATURE: Student Account Settings and Profile

### Description
Student profile details, password change, and preference update endpoints with corresponding UI pages.

### FRONTEND
File:
- frontend/src/app/pages/student/StudentProfilePage.tsx
- frontend/src/app/pages/student/StudentAccountSettingsPage.tsx

Key Code:
- profile form handlers
- password/preferences sections

Flow:
User edits settings -> PUT endpoints -> backend validations -> DB update -> UI success state

### API LAYER
Endpoint:
- GET /student/account-settings
- PUT /student/account-settings/profile
- PUT /student/account-settings/password
- PUT /student/account-settings/preferences

### BACKEND
#### Route
File: backend/routes/api.php

#### Controller
File:
- backend/app/Http/Controllers/StudentAccountSettingsController.php

Function:
- show
- updateProfile
- changePassword
- updatePreferences

Logic:
- own-account validation and persistence

### MODEL
File:
- backend/app/Models/User.php
- backend/app/Models/UserPreference.php

Purpose:
- account and preferences

### DATABASE
Migration:
- database/migrations/2026_04_04_000130_add_student_account_columns.php

Tables involved:
- users
- user_preferences or JSON preference fields depending on implementation path

### COMPLETE FLOW
Student settings UI -> settings API -> controller -> user/preferences model -> DB -> response -> updated UI

### EXACT TRACE
- File: backend/app/Http/Controllers/StudentAccountSettingsController.php
- File: frontend/src/app/pages/student/StudentAccountSettingsPage.tsx

---

## FEATURE: Support Tickets

### Description
Student can create and list support tickets from dashboard/settings area.

### FRONTEND
File:
- frontend/src/app/pages/student/StudentHelpSupportPage.tsx

Key Code:
- ticket submit/list handlers

Flow:
Student opens support page -> POST ticket / GET tickets -> backend store/list -> UI render

### API LAYER
Endpoint:
- GET /student/support-tickets
- POST /student/support-tickets

### BACKEND
#### Route
File: backend/routes/api.php

#### Controller
File:
- backend/app/Http/Controllers/SupportTicketController.php

Function:
- index
- store

Logic:
- user-bound ticket retrieval and creation

### MODEL
File:
- backend/app/Models/SupportTicket.php

### DATABASE
Migration:
- database/migrations/2026_04_04_000131_create_support_tickets_table.php

Tables involved:
- support_tickets

### COMPLETE FLOW
Support page -> API -> SupportTicketController -> SupportTicket model -> support_tickets table -> response list

### EXACT TRACE
- File: backend/app/Http/Controllers/SupportTicketController.php

---

## FEATURE: Subject Management

### Description
Subject read for authenticated users and write for admin/controller roles.

### FRONTEND
File:
- integrated in exam creation pages

### API LAYER
Endpoint:
- GET /subjects
- GET /subjects/{subject}
- POST /subjects
- PUT/PATCH /subjects/{subject}
- DELETE /subjects/{subject}

### BACKEND
#### Route
File: backend/routes/api.php

#### Controller
File:
- backend/app/Http/Controllers/SubjectController.php

Function:
- index, show, store, update, destroy

Logic:
- role-gated mutating operations

### MODEL
File:
- backend/app/Models/Subject.php

### DATABASE
Migration:
- database/migrations/2024_03_08_000000_create_subjects_table.php
- database/migrations/2026_04_04_000101_enhance_subjects_for_crud.php

Tables involved:
- subjects

### COMPLETE FLOW
Exam setup UI needs subjects -> API -> SubjectController -> Subject model -> DB -> UI selection

### EXACT TRACE
- File: backend/app/Http/Controllers/SubjectController.php

---

## FEATURE: Admin User Management and Dashboard

### Description
Admin routes for user CRUD, status toggle, and dashboard metrics.

### FRONTEND
File:
- frontend/src/app/pages/admin/AdminDashboard.tsx
- frontend/src/app/pages/admin/UserManagement.tsx

Key Code:
- admin user CRUD forms/tables

Flow:
Admin action -> /admin endpoints -> backend permission check -> user updates -> UI refresh

### API LAYER
Endpoint:
- GET /admin/dashboard
- GET /admin/users
- GET /admin/users/{user}
- POST /admin/users
- PUT/PATCH /admin/users/{user}
- PATCH /admin/users/{user}/status
- DELETE /admin/users/{user}

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- permission:users.manage group + throttle:admin-actions for mutating actions

#### Controller
File:
- backend/app/Http/Controllers/AdminDashboardController.php
- backend/app/Http/Controllers/UserController.php

Function:
- index (dashboard)
- user CRUD methods

Logic:
- permission-gated administration
- status toggling and role assignment

### MODEL
File:
- backend/app/Models/User.php
- backend/app/Models/Role.php

### DATABASE
Migration:
- users/roles/permissions related migrations

Tables involved:
- users
- roles
- permissions

### COMPLETE FLOW
Admin UI -> API -> middleware -> controller -> model updates -> DB -> UI feedback

### EXACT TRACE
- File: backend/app/Http/Controllers/UserController.php
- File: backend/app/Http/Controllers/AdminDashboardController.php

---

## FEATURE: Audit Logs and Monitoring

### Description
Audit trail records significant actions and can be queried via restricted routes.

### FRONTEND
File:
- frontend/src/app/pages/admin/AuditLogs.tsx (detected page)

Key Code:
- audit display (if routed)

Flow:
Admin audit view -> GET /audit-logs -> controller -> audit table

### API LAYER
Endpoint:
- GET /audit-logs

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- middleware permission:audit_logs.view -> /audit-logs

#### Controller
File:
- backend/app/Http/Controllers/AuditLogController.php

Function:
- index

Logic:
- filtered access to logs

### MODEL
File:
- backend/app/Models/AuditLog.php

### DATABASE
Migration:
- database/migrations/2026_03_08_000009_create_audit_logs_table.php
- database/migrations/2026_04_04_000012_align_audit_logs_table_for_event_based_logging.php

Tables involved:
- audit_logs

### COMPLETE FLOW
Admin audit page -> /audit-logs -> AuditLogController -> AuditLog model -> audit_logs table -> response

### EXACT TRACE
- File: backend/app/Models/AuditLog.php
- File: backend/app/Services/AuditService.php

---

## FEATURE: Proctoring (Detected but Unused/Stub)

### Description
Proctoring endpoint exists but returns placeholder response and has TODO marker.

### FRONTEND
File:
- No active routed frontend page currently tied in main routes for this endpoint

Key Code:
- N/A

Flow:
Potential admin/teacher request -> /proctoring -> stub JSON

### API LAYER
Endpoint:
- GET /proctoring

### BACKEND
#### Route
File: backend/routes/api.php
Route definition:
- Route::middleware('role:admin,teacher')->group(... '/proctoring')

#### Controller
File:
- backend/app/Http/Controllers/ProctoringController.php

Function:
- index

Logic:
- returns static placeholder payload

### MODEL
File:
- None directly used

### DATABASE
Migration:
- None directly tied

Tables involved:
- None directly tied

### COMPLETE FLOW
Request -> route -> ProctoringController.index -> static response

### EXACT TRACE
- File: backend/app/Http/Controllers/ProctoringController.php
- Function: index
- Approx line: 10-15

---

## GLOBAL ANALYSIS

## DETECTED FEATURES (AUTO DISCOVERED)
- Authentication and verification flow
- RBAC with db-backed permissions
- Exam CRUD and teacher portal operations
- Question CRUD and exam-scoped management
- AI question generation via OpenRouter
- Student secure exam attempt lifecycle
- Results/submission evaluation and visibility controls
- Public/private exam access controls
- Multi-role exam workflow (setter/moderator/invigilator/controller)
- Notification center and unread handling
- Student profile/account settings/preferences
- Subject management
- Support ticket workflow
- Audit log pipeline
- Health/time utility endpoints
- CI/CD auto merge and deployment workflow automation

## EXTRA FEATURES (NOT INITIALLY EXPECTED)
- Legacy/compatibility attempt endpoints alongside student module endpoints
- API-level GET response caching in frontend axios interceptor
- Dual style auth traces (Sanctum-centric with some JWT references)
- Teacher profile/notification/account pages beyond base dashboard
- Auto-merge rebase conflict automation in GitHub workflow

## INCOMPLETE / BROKEN FEATURES
- Proctoring endpoint is stub only (TODO)
- Several admin pages exist but are not wired in frontend routes:
  - frontend/src/app/pages/admin/SystemBackups.tsx
  - frontend/src/app/pages/admin/SystemIncidents.tsx
  - frontend/src/app/pages/admin/SystemSettings.tsx
  - frontend/src/app/pages/admin/SecurityPolicies.tsx
  - frontend/src/app/pages/admin/ExamMonitoring.tsx
  - frontend/src/app/pages/admin/AuditLogs.tsx (route absent in routes.tsx)
- Unused import in frontend routes:
  - frontend/src/app/routes.tsx imports RoleDashboardPlaceholder but does not register a route
- Duplicate migration locations detected for some files under backend/database/migrations and database/migrations (possible maintenance risk)

## DUPLICATE / REDUNDANT LOGIC
- Attempt and answer endpoints duplicated:
  - /student/attempts/*
  - /attempts/* and /answers
- User creation endpoints duplicated:
  - /admin/users and /users
- Potential overlap in result/evaluation responsibility between controllers and services

## SECURITY ANALYSIS
- Strong points:
  - Auth middleware and permission middleware widely used
  - role and exam-scoped middleware layering
  - input validation in controllers
  - token-based auth and centralized axios auth header
- Risks / recommendations:
  - Ensure auth endpoint throttling on register/login/reset routes
  - OPENROUTER_VERIFY_SSL should remain true in production with valid CA bundle
  - Review duplicate route surfaces to reduce accidental bypass patterns

## PERFORMANCE NOTES
- Positive:
  - indexes added by normalization migrations
  - frontend GET caching interceptor reduces repetitive reads
  - route-level grouping and selective endpoints
- Potential issues:
  - multiple overlapping attempt endpoints can duplicate workload and complexity
  - large all-in-one pages (CreateExam.tsx) can become heavy for maintainability/perf
  - audit logs can grow without retention strategy

---

## FULL SYSTEM FLOW (GLOBAL)
User Action
-> Frontend React page/component
-> API layer (frontend/src/app/api.ts)
-> HTTP request with bearer token
-> Laravel route (backend/routes/api.php)
-> Middleware chain (auth/permission/role/exam role/status/time)
-> Controller method
-> Service (if used)
-> Eloquent model
-> Database table/migration schema
-> JSON response
-> Frontend state update and UI rendering

---

## VIVA QUICK ANSWER FORMAT
For any feature answer in this order:
1. Frontend file/component
2. API call endpoint
3. Laravel route in backend/routes/api.php
4. Controller method
5. Model
6. Migration/table

Template:
- Frontend: <path>
- API: <method route>
- Route: backend/routes/api.php
- Controller: <Controller>@<method>
- Model: <Model>
- Database: <migration/table>

Example:
Signup is implemented in:
- Frontend: frontend/src/app/pages/Signup.tsx
- API: POST /register, POST /register/verify-code
- Route: backend/routes/api.php
- Controller: AuthController@register, AuthController@verifyRegistrationCode
- Model: User, PendingUserRegistration
- Database: users, pending_user_registrations tables

---

## FILE INDEX REFERENCE (FAST LOOKUP)

Frontend core:
- frontend/src/app/routes.tsx
- frontend/src/app/api.ts
- frontend/src/app/auth/ProtectedRoute.tsx
- frontend/src/app/pages/teacher/CreateExam.tsx
- frontend/src/app/pages/student/StudentExamAttemptPage.tsx
- frontend/src/app/pages/student/StudentResultsPage.tsx
- frontend/src/app/pages/admin/UserManagement.tsx

Backend core:
- backend/routes/api.php
- backend/app/Http/Controllers/AuthController.php
- backend/app/Http/Controllers/ExamController.php
- backend/app/Http/Controllers/QuestionController.php
- backend/app/Http/Controllers/AiQuestionController.php
- backend/app/Http/Controllers/StudentExamController.php
- backend/app/Http/Controllers/ExamAttemptController.php
- backend/app/Http/Controllers/SubmissionController.php
- backend/app/Http/Controllers/ExamAccessController.php
- backend/app/Http/Controllers/ExamWorkflowController.php
- backend/app/Services/AiService.php
- backend/app/Services/SubmissionEvaluationService.php

Data layer:
- backend/app/Models/*.php
- database/migrations/*.php

Infra and CI/CD:
- .github/workflows/copilot-review-automerge.yml
- docker-compose.yml
- Dockerfile
- backend/Dockerfile
- frontend/Dockerfile

---

## FINAL VIVA PREP NOTES
- The strongest end-to-end feature for demo is: Exam creation -> question management (manual/AI) -> student attempt -> submission -> result view.
- Mention that some monitoring/admin pages are detected but not fully routed yet.
- If asked about security, highlight middleware layering and db-permission model first.
- If asked about system gaps, mention proctoring stub and duplicate endpoint surfaces.
