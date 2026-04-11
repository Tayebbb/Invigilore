# Exam System Database Schema - Normalization Summary

## Goal
Build a production-ready, normalized, DB-driven schema for the exam system and sync it with backend models/controllers/APIs.

## What Was Added
### New normalization migration
- `database/migrations/2026_04_12_001100_normalize_exam_core_schema.php`

This migration performs safe, incremental normalization for:
- Exams
- Questions
- Attempts
- Answers
- Results

## Final Core Schema (Normalized)
### Exams
- id
- title
- description
- start_time
- end_time
- duration
- status
- created_by
- (existing workflow fields preserved for compatibility)

### Questions
- id
- exam_id (FK -> exams.id)
- question_text
- type (mcq, descriptive)
- marks

### Attempts
- id
- exam_id (FK -> exams.id)
- user_id (FK -> users.id)
- start_time
- end_time
- status

### Answers (attempt_answers)
- id
- attempt_id (FK -> exam_attempts.id)
- question_id (FK -> questions.id)
- selected_option
- answer_text

### Results
- id
- attempt_id (FK -> exam_attempts.id)
- score
- total_marks
- evaluated_at

## Constraints and Indexing
### Foreign keys and cascades
- exam_attempts.exam_id -> exams.id (cascade)
- exam_attempts.user_id -> users.id (cascade)
- attempt_answers.attempt_id -> exam_attempts.id (cascade)
- attempt_answers.question_id -> questions.id (cascade)
- results.attempt_id -> exam_attempts.id (cascade)

### Uniqueness
- attempts: unique(exam_id, user_id) added only if no duplicates exist
- results: unique(attempt_id) added only if no duplicates exist

### Indexes
- exams: status, (start_time,end_time), created_by
- questions: (exam_id,type), marks
- exam_attempts: (exam_id,user_id), status, (start_time,end_time)
- attempt_answers: (attempt_id,question_id)
- results: evaluated_at, attempt_id

## Backward-Compatible Data Migration
- status backfilled from existing exam_status
- created_by backfilled from teacher_id/controller_id
- selected_answer migrated to selected_option
- evaluated_at backfilled from created_at
- legacy-compatible accessor remains in model for selected_answer reads/writes

## Backend Sync Completed
### Models updated
- `backend/app/Models/Exam.php`
- `backend/app/Models/AttemptAnswer.php`
- `backend/app/Models/Result.php`

### Controller updates
- `backend/app/Http/Controllers/ExamController.php`
  - supports status + created_by
- `backend/app/Http/Controllers/ExamWorkflowController.php`
  - updates both status and exam_status on activation
- `backend/app/Http/Controllers/ModeratorReviewController.php`
  - updates both status and exam_status on approval
- `backend/app/Http/Controllers/StudentExamController.php`
  - supports selected_option input and sets evaluated_at
- `backend/app/Http/Controllers/ExamAttemptController.php`
  - supports selected_option input/output and normalized persistence

## Hardcoded Value Cleanup
- Removed DB-level dependence on only selected_answer storage by normalizing answer fields.
- Added canonical status and creator ownership fields to exams.

## Pagination and Query Readiness
- Existing paginated endpoints remain compatible.
- Added indexes for common filtering/sorting paths to improve relational query performance.

## Testing Checklist
1. Run migrations: `php artisan migrate`
2. Insert exam and validate FK/default constraints
3. Insert questions with valid exam_id only
4. Create attempt with valid exam_id + user_id only
5. Insert answers linked to valid attempt + question
6. Generate/store result with valid attempt_id and evaluated_at
7. Delete exam and verify cascade deletion of child records
8. Verify exam + questions + attempts query performance
9. Verify API endpoints return relationally consistent data

## Operational Note
A live migration test command was prepared, but execution was skipped in the environment; run the checklist above in your target environment to finalize runtime verification.
