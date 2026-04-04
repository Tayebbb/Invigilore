# Exam Attempt Flow API

## Overview

This feature adds a focused API flow for exam attempts in the Laravel backend.

It supports:

- Starting an exam attempt with randomized questions
- Tracking attempt timer using `start_time` and `duration`
- Saving and updating answers during the attempt
- Auto-submitting the attempt when the timer expires

Security and behavior rules:

- Correct answers are never exposed in API responses.
- Users can only access their own attempts.
- Duplicate submissions are blocked.

## Endpoints

All endpoints are under authenticated API routes.

### `POST /api/attempts/start`

Starts a new attempt for an exam.

Request body:

```json
{
  "exam_id": 1
}
```

Behavior:

- Creates an `exam_attempts` row with:
  - `start_time = now`
  - `duration = exam.duration`
  - `status = in_progress`
- Returns randomized exam questions (`inRandomOrder()`)
- Excludes `correct_answer`

### `GET /api/attempts/{id}`

Returns attempt info, questions, saved answers, and remaining time.

Behavior:

- Calculates `remaining_time` in seconds
- If time has expired (`remaining_time <= 0`), auto-submits and marks `status = timeout`
- Returns question data with `selected_answer` (if saved)

### `POST /api/attempts/{id}/answer`

Saves or updates an answer for a question.

Request body:

```json
{
  "question_id": 10,
  "selected_answer": "B"
}
```

Behavior:

- Upserts answer in `attempt_answers`
- Rejects if attempt is already submitted/finalized
- Runs auto-submit check first; if expired, finalizes as `timeout`

### `POST /api/attempts/{id}/submit`

Submits an attempt manually.

Behavior:

- Prevents duplicate submission
- Sets `end_time` and `status = submitted`
- Calculates score by comparing selected answer vs `questions.correct_answer`
- Stores correctness in `attempt_answers.is_correct`
- Returns result summary

## Timer Logic

Remaining time is computed as:

- `remaining_seconds = duration * 60 - seconds_since(start_time)`
- Clamped to zero when negative

The flow treats an attempt as expired when `remaining_seconds <= 0`.

## Auto-Submit Logic

Auto-submit is enforced in:

- `GET /api/attempts/{id}`
- `POST /api/attempts/{id}/answer`

When expired:

- Attempt is finalized immediately
- `status` becomes `timeout`
- `end_time` is set
- Answers are evaluated and summary can be derived
