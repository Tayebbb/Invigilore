# Audit Logging System

## What Was Implemented

- Added an `audit_logs` persistence layer for core security-sensitive events.
- Added reusable `AuditService` to log events without changing existing business logic.
- Integrated audit logging for:
  - User login
  - Exam start
  - Exam submit
- Added optional test endpoint: `GET /api/audit-logs` (admin-only).

## Table Structure

Table: `audit_logs`

Columns:

- `id` (primary key)
- `user_id` (nullable foreign key to `users.id`)
- `event_type` (`login`, `exam_start`, `exam_submit`)
- `description` (nullable text)
- `ip_address` (string)
- `user_agent` (nullable text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Where Logging Is Triggered

- Login: in auth login success flow.
- Exam Start: when a new exam attempt is created.
- Exam Submit: when an attempt is finalized as submitted.

All logging calls are wrapped in safe execution so logging failure does not break existing API behavior.

## Example Log Entries

```json
{
  "id": 101,
  "user_id": 7,
  "event_type": "login",
  "description": "User logged in successfully",
  "ip_address": "203.0.113.10",
  "user_agent": "Mozilla/5.0 ...",
  "created_at": "2026-04-04T12:30:00Z"
}
```

```json
{
  "id": 102,
  "user_id": 7,
  "event_type": "exam_start",
  "description": "Exam attempt started. attempt_id=55, exam_id=3",
  "ip_address": "203.0.113.10",
  "user_agent": "Mozilla/5.0 ...",
  "created_at": "2026-04-04T12:32:10Z"
}
```

```json
{
  "id": 103,
  "user_id": 7,
  "event_type": "exam_submit",
  "description": "Exam attempt submitted. attempt_id=55, exam_id=3",
  "ip_address": "203.0.113.10",
  "user_agent": "Mozilla/5.0 ...",
  "created_at": "2026-04-04T13:01:40Z"
}
```

## How To Extend

- Add new event type constants in a central enum/value object if needed.
- Reuse `AuditService::log(eventType, description)` from other controllers/services.
- Keep logging calls isolated and wrapped safely to avoid side effects.
