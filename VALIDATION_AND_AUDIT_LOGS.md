# Validation and Audit Logging Summary

## 1. Overview

This change adds input validation and audit logging for the Exam Attempt and Result flow without changing the database schema. The implementation keeps the existing API responses and controller structure intact while adding stricter request validation and audit events for the core actions.

## 2. Validation Rules Added

### Start Attempt

- `exam_id`: required, integer, `exists:exams,id`
- Non-student users are rejected with `403`
- Private exam access is still enforced through the existing assignment check

### Save Answer

- `question_id`: required, integer, `exists:questions,id`
- `selected_answer`: required, string, max length `1000`
- `selected_answer` is trimmed before persistence
- The question must belong to the attempt's exam
- The attempt must belong to the authenticated user
- The attempt must still be in progress

### Submit Exam

- `attempt_id` is validated against `exam_attempts,id`
- The attempt must belong to the authenticated user
- Duplicate submissions are rejected with `409`
- Only in-progress attempts can be submitted

### General Validation Behavior

- Invalid payloads return `422`
- Ownership checks still return `403`
- Existing response payloads are unchanged for successful requests

## 3. Audit Logging Implementation

A small controller helper was added to write audit events through the existing `AuditLog` model.

### Helper Used

```php
private function logAudit(Request $request, string $action, array $payload = []): void
```

### Logged Actions

- `attempt_started`
- `answer_saved`
- `exam_submitted`
- `result_calculated`

### Logging Fields

Each log entry uses the current `audit_logs` schema:

- `user_id`
- `event_type` as the action name
- `description` as JSON-encoded metadata
- `ip_address`
- `user_agent`
- `created_at` handled automatically

Because the table does not have `attempt_id`, `exam_id`, or `metadata` columns, those values are stored inside the existing `description` field as JSON.

## 4. Existing `audit_logs` Table Usage

Current schema in use:

- `id`
- `user_id`
- `event_type`
- `description`
- `ip_address`
- `user_agent`
- `created_at`

No tables were created or renamed. No columns were modified.

## 5. Files Modified

- `backend/app/Http/Controllers/ExamAttemptController.php`
  - Added validation for start, save answer, and submit flows
  - Added `logAudit()` helper
  - Logged attempt lifecycle events after successful operations
  - Kept existing responses unchanged

## 6. Security Enhancements

- Enforced request validation before persistence
- Trimmed answer input before saving
- Verified that the authenticated user owns the attempt
- Verified that the question belongs to the current exam
- Preserved duplicate submission protection
- Preserved the existing "no save after submission" rule
- Kept audit logging non-blocking so logging failures do not break the API

## 7. Sample Log Entry (JSON)

Stored in `description` for the `audit_logs` row:

```json
{
  "attempt_id": 42,
  "exam_id": 5,
  "metadata": {
    "score": 18,
    "total_marks": 20
  }
}
```

Example row values:

```json
{
  "user_id": 7,
  "event_type": "result_calculated",
  "description": "{\"attempt_id\":42,\"exam_id\":5,\"metadata\":{\"score\":18,\"total_marks\":20}}",
  "ip_address": "203.0.113.10",
  "user_agent": "Mozilla/5.0 ...",
  "created_at": "2026-04-10T10:15:30Z"
}
```

## 8. Notes

- The implementation reuses the existing `AuditLog` model and the current `audit_logs` schema.
- Logging is intentionally wrapped in `try/catch` so it cannot interrupt exam submission or answer saving.
- Metadata is preserved in JSON form inside `description` because the table does not provide a dedicated metadata column.
- The change is minimal and keeps the current controller contract stable.
