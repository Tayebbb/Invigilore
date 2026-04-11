# Exam Assignment Email Validation

## 1. Overview

This update adds strict email validation for private exam assignment without changing routes, database schema, controller names, or core business logic.

Scope:

- Backend: validation, normalization, duplicate-prevention in existing private access endpoint
- Frontend: minimal input validation and error display for assignment emails

## 2. Backend Validation Rules

In the existing private assignment endpoint (`ExamAccessController::generatePrivate`):

- `channel`: required, `in:web,teams`
- `emails`: required, array, min 1
- `emails.*`: required, string, `email:rfc`, max 255

Behavior:

- Invalid emails return `422 Unprocessable Entity`
- Validation still uses Laravel validation flow

## 3. Email Normalization (trim + lowercase)

Before validation and persistence:

- Whitespace is trimmed
- Email is converted to lowercase

Normalization is applied to every item in `emails` so values are cleaned consistently.

## 4. Duplicate Prevention Logic

Duplicate handling now includes:

1. Input-level deduplication:

- Normalized emails are reduced to unique values before assignment

2. Database-level duplicate check (case-insensitive):

- Existing assignments for the same exam are checked using `LOWER(email)`
- If one or more already exist, API returns `409 Conflict`

Conflict response shape:

- `message`: "Email already assigned"
- `duplicate_emails`: list of conflicting normalized emails

This prevents duplicate inserts while preserving existing endpoint behavior for valid, non-duplicate emails.

## 5. Frontend Error Handling

In the existing exam access UI (`CreateExam.tsx`, private access section):

- Added minimal client-side parsing/validation before API call
- Added inline field-level error text near the email textarea
- Captures backend errors:
  - `422` -> shows invalid email guidance
  - `409` -> shows "Email already assigned"
- Keeps existing page layout and flow unchanged

Messages handled:

- "Invalid email format"
- "Email already assigned"

## 6. Files Modified

- `backend/app/Http/Controllers/ExamAccessController.php`
- `frontend/src/app/pages/teacher/CreateExam.tsx`

## 7. Example Valid / Invalid Emails

Valid:

- `student1@gmail.com`
- `user.name+tag@university.edu`
- `abc_123@dept.example.org`

Invalid:

- `student.gmail.com`
- `student@`
- `@example.com`
- `student@@example.com`
- `student <script>@example.com`

## 8. Notes

- No schema changes were made.
- Existing routes, controllers, and API contracts remain intact.
- Backend remains the source of truth for validation.
- Frontend validation is intentionally minimal and supportive.
