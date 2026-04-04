# Student Results API

## Overview

This document describes student-facing result APIs added to Invigilore. The implementation does not modify database schema or existing controllers.

All endpoints require authentication and are scoped to the authenticated student.

## Endpoints

### 1) GET `/api/student/attempts`

Returns authenticated student attempt history.

Response example:

```json
{
  "data": [
    {
      "attempt_id": 12,
      "exam_id": 3,
      "start_time": "2026-04-04T10:00:00.000000Z",
      "end_time": "2026-04-04T10:45:00.000000Z",
      "status": "submitted"
    }
  ]
}
```

### 2) GET `/api/student/attempts/{id}`

Returns detailed score breakdown for one attempt.

Response example:

```json
{
  "data": {
    "attempt_id": 12,
    "exam_id": 3,
    "total_questions": 20,
    "total_marks": 40,
    "obtained_marks": 31,
    "percentage": 77.5
  }
}
```

### 3) GET `/api/student/results/summary`

Returns overall performance summary for the authenticated student.

Response example:

```json
{
  "data": {
    "total_attempts": 5,
    "completed_attempts": 4,
    "average_score": 68.25,
    "highest_score": 90,
    "lowest_score": 42.5
  }
}
```

## Scoring Logic

For a given attempt:

1. Load all questions belonging to the attempt's exam.
2. Load all answers for that attempt.
3. Compare each `selected_answer` to `questions.correct_answer`.
4. If correct, add `questions.marks` to obtained marks.
5. Compute:
   - `total_questions` = count of exam questions
   - `total_marks` = sum of exam question marks
   - `obtained_marks` = sum of correctly answered question marks
   - `percentage` = `(obtained_marks / total_marks) * 100`

## Edge Cases Handled

- Attempt not found: returns `404` with message.
- Unauthorized access to another student's attempt: returns `403`.
- No answers submitted: `obtained_marks = 0`.
- Division by zero when total marks is zero: `percentage = 0`.
- Supports either `attempt_answers` or `answers` table for answer lookup.

## Assumptions

- Authentication middleware is already configured.
- User role middleware is active and identifies `student` role.
- Existing tables include `exam_attempts`, `questions`, and one answer table (`attempt_answers` or `answers`).
