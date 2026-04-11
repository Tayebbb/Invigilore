# RBAC for Exam Module - Implementation Summary

## Overview
This update implements strict, DB-driven RBAC for the Exam Module across backend and frontend.

Core goals completed:
- Added database-level permissions and role-permission mapping.
- Enforced authorization at route level and controller level.
- Replaced hardcoded role checks with permission checks.
- Synced frontend route/UI access control with backend permissions.
- Preserved exam-assignment workflow restrictions (exam.role) while layering permission checks.

## Roles and Effective Permission Model
Target roles and key capabilities:

- Admin
  - Manage users and role assignment.
  - View all exams/attempts/results.
  - View audit logs.
  - Full exam workflow capabilities.

- Question Setter
  - Create exams.
  - Add/edit questions.
  - Cannot publish exams unless explicitly granted publish permission.

- Moderator
  - Review questions.
  - Approve/reject exam workflow.
  - Publish exams.

- Student
  - View assigned exams only.
  - Attempt exams.
  - Submit answers.
  - View own results only.

## Database Changes
### New migration
- `database/migrations/2026_04_12_000200_create_permissions_tables.php`
  - Creates `permissions` table.
  - Creates `permission_role` pivot table.

### Seeder updates
- `database/seeders/RoleSeeder.php`
  - Seeds RBAC permissions.
  - Maps permissions to roles with `role->permissions()->sync(...)`.

## Backend RBAC Changes
### New middleware
- `backend/app/Http/Middleware/CheckPermission.php`
  - Middleware alias: `permission`.
  - Enforces permission presence; returns `401` for unauthenticated and `403` for unauthorized.

### Middleware registration
- `backend/bootstrap/app.php`
  - Added middleware alias: `permission`.

### New model
- `backend/app/Models/Permission.php`

### Model relations and helpers
- `backend/app/Models/Role.php`
  - Added `permissions()` many-to-many relation.

- `backend/app/Models/User.php`
  - Added helper methods:
    - `hasPermission(string $permission)`
    - `hasAnyPermission(array $permissions)`
    - `permissionKeys()`

### Route-level enforcement
- `backend/routes/api.php`
  - Added permission middleware to exam routes, question routes, workflow routes, student attempt/result routes, admin/audit routes.
  - Replaced role-only guards on critical paths with permission guards.

### Controller-level enforcement
Updated controllers now enforce permissions as defense-in-depth:
- `backend/app/Http/Controllers/ExamController.php`
- `backend/app/Http/Controllers/QuestionController.php`
- `backend/app/Http/Controllers/ExamWorkflowController.php`
- `backend/app/Http/Controllers/SubmissionController.php`
- `backend/app/Http/Controllers/ModeratorReviewController.php`

### Request authorization refactor
Hardcoded role authorization replaced in FormRequests:
- `backend/app/Http/Requests/Question/StoreQuestionRequest.php`
- `backend/app/Http/Requests/Question/UpdateQuestionRequest.php`
- `backend/app/Http/Requests/Question/GenerateQuestionsRequest.php`
- `backend/app/Http/Requests/StoreAdminUserRequest.php`
- `backend/app/Http/Requests/UpdateAdminUserRequest.php`
- `backend/app/Http/Requests/UpdateAdminUserStatusRequest.php`

### Auth payload updates
- `backend/app/Http/Controllers/AuthController.php`
  - Login/register/me/profile responses now load `role.permissions` to supply frontend with current permission state.

## Frontend RBAC Changes
### Permission utility
- `frontend/src/app/utils/permissions.ts`
  - Normalization and permission evaluation helpers.

### Auth user persistence
- `frontend/src/app/utils/authUser.ts`
  - Extended stored user shape to include `permissions`.

### Login hydration
- `frontend/src/app/pages/Login.tsx`
  - Extracts and stores permissions from backend auth response.

### Current user hook
- `frontend/src/app/hooks/useCurrentUser.ts`
  - Loads permissions from stored user and `/me` payload.

### Protected route upgrades
- `frontend/src/app/auth/ProtectedRoute.tsx`
  - Added `allowedPermissions` support.
  - Keeps role guard + adds permission guard.

### Route/UI-level authorization
- `frontend/src/app/routes.tsx`
  - Added permission requirements to protected exam/admin/student routes.

- `frontend/src/app/pages/teacher/CreateExam.tsx`
  - Replaced role-only UI capability checks with permission-driven checks.
  - Hides/disables actions according to effective permissions.

## Hardcoded Role Check Removal Status
Within targeted backend authz surfaces (controllers + requests for exam/admin paths), hardcoded `role?->name` checks were removed and replaced by permission-based logic.

## Security Outcomes
- Unauthorized access returns proper `403` responses at middleware and controller levels.
- Permission checks are DB-driven; role/permission changes in DB can take effect without code changes.
- Exam assignment constraints remain enforced (exam role middleware + exam ownership checks), reducing privilege escalation risk.

## Operational Steps Required
1. Run migrations:

```bash
php artisan migrate
```

2. Seed/update role-permission mappings:

```bash
php artisan db:seed --class=RoleSeeder
```

3. Re-login users so frontend receives fresh permission payload.

## Testing Sequence (Recommended)
1. Login as Admin
- Verify access to user management, audit logs, all exams/results.

2. Login as Question Setter
- Verify can create exam and manage questions.
- Verify cannot publish unless publish permission is explicitly granted.

3. Login as Moderator
- Verify review + approve/reject + publish flows.
- Verify cannot create exam unless granted create permission.

4. Login as Student
- Verify only assigned exams are visible.
- Verify attempt/submit and own-results endpoints only.
- Verify admin routes blocked.

5. API manual checks (Postman)
- Hit restricted routes with insufficient permissions and confirm `403`.

6. DB role/permission change test
- Modify role permissions in DB.
- Verify behavior changes without deployment/code edits.

7. UI verification
- Ensure unauthorized actions/buttons are hidden or inaccessible.

## Notes
- The system now supports strict RBAC with role-permission mapping and exam-assignment constraints.
- You can further harden by adding automated feature tests specifically for each permission key and critical route.
