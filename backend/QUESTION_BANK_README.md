# Invigilore Question Bank System

## Overview

The Question Bank module is a comprehensive system for managing examination questions in Invigilore, a secure digital examination platform built with Laravel 12 and MySQL. This module provides complete CRUD (Create, Read, Update, Delete) operations for managing questions, supports both global and exam-specific questions, and implements intelligent random question generation with difficulty distribution support.

The system is designed with security and scalability in mind, featuring role-based access control (admin-only operations), service layer architecture for clean code separation, and optimized database queries using indexes on frequently filtered columns.

---

## Features

- **CRUD Operations**: Complete Create, Read, Update, Delete functionality for question management
- **Flexible Question Assignments**: Questions can be assigned to specific exams or kept in a global question bank
- **Filtering & Pagination**: Retrieve questions filtered by exam ID, difficulty level, or topic with configurable pagination
- **Random Question Generation**: Intelligent endpoint for generating randomized question sets for exams
- **Difficulty Distribution**: Control exact distribution of easy, medium, and hard questions in generated sets
- **Fallback Logic**: Automatic fallback to other difficulties if requested difficulty has insufficient questions
- **Security**: Admin-only access with `role:admin` middleware protection
- **Dual Response Resources**:
    - `QuestionAdminResource`: Includes correct answers for admin use
    - `QuestionResource`: Excludes correct answers for student-facing APIs
- **Service Layer Architecture**: Business logic isolated in `QuestionService` for maintainability
- **Form Request Validation**: Type-safe request validation with dedicated request classes
- **Eloquent Models**: Proper ORM relationships and model configuration
- **Database Indexing**: Performance optimizations on frequently queried columns

---

## Database Structure

### Questions Table Schema

The `questions` table is created by the migration `2026_04_03_000010_create_questions_table.php` with the following structure:

| Column           | Type                         | Constraints            | Notes                                                |
| ---------------- | ---------------------------- | ---------------------- | ---------------------------------------------------- |
| `id`             | bigint unsigned              | Primary key            | Auto-incrementing                                    |
| `exam_id`        | bigint unsigned              | Foreign key (nullable) | References `exams.id`, nullable for global questions |
| `question_text`  | text                         | Required               | Full question body/stem                              |
| `option_a`       | string(255)                  | Required               | First multiple choice option                         |
| `option_b`       | string(255)                  | Required               | Second multiple choice option                        |
| `option_c`       | string(255)                  | Required               | Third multiple choice option                         |
| `option_d`       | string(255)                  | Required               | Fourth multiple choice option                        |
| `correct_answer` | enum('A','B','C','D')        | Required               | Key of the correct option                            |
| `difficulty`     | enum('easy','medium','hard') | Required, Indexed      | Question difficulty level                            |
| `topic`          | string(255)                  | Nullable, Indexed      | Optional topic categorization                        |
| `marks`          | unsigned integer             | Default: 1             | Points awarded for correct answer                    |
| `created_at`     | timestamp                    | Auto                   | Record creation timestamp                            |
| `updated_at`     | timestamp                    | Auto                   | Record update timestamp                              |

### Indexes

- `exam_id`: Supports filtering by exam
- `difficulty`: Optimizes difficulty-based queries
- `topic`: Enables topic-based filtering

---

## API Endpoints

All endpoints are protected by `auth:sanctum` middleware and require a valid Laravel Sanctum bearer token. Admin routes additionally require `role:admin` middleware.

### 1. List Questions

**Method**: `GET`

**URL**: `/api/questions?exam_id=1&difficulty=easy&topic=Arithmetic&per_page=15`

**Authentication**: Required (admin)

**Parameters**:

- `exam_id` (optional): Filter by exam ID
- `difficulty` (optional): Filter by difficulty (easy, medium, hard)
- `topic` (optional): Filter by topic name
- `per_page` (optional): Items per page, default 15, max 100

**Response Example**:

```json
{
    "data": [
        {
            "id": 1,
            "exam_id": 1,
            "question_text": "What is the output of 2 + 2?",
            "options": {
                "A": "3",
                "B": "4",
                "C": "5",
                "D": "6"
            },
            "correct_answer": "B",
            "difficulty": "easy",
            "topic": "Arithmetic",
            "marks": 1,
            "created_at": "2026-04-03T12:00:00.000000Z",
            "updated_at": "2026-04-03T12:00:00.000000Z"
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/questions?page=1",
        "last": "http://localhost:8000/api/questions?page=1",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 15,
        "total": 1
    }
}
```

---

### 2. Get Single Question

**Method**: `GET`

**URL**: `/api/questions/{id}`

**Authentication**: Required (admin)

**Response Example**:

```json
{
    "id": 1,
    "exam_id": 1,
    "question_text": "What is the output of 2 + 2?",
    "options": {
        "A": "3",
        "B": "4",
        "C": "5",
        "D": "6"
    },
    "correct_answer": "B",
    "difficulty": "easy",
    "topic": "Arithmetic",
    "marks": 1,
    "created_at": "2026-04-03T12:00:00.000000Z",
    "updated_at": "2026-04-03T12:00:00.000000Z"
}
```

---

### 3. Create Question

**Method**: `POST`

**URL**: `/api/questions`

**Authentication**: Required (admin)

**Request Body Example**:

```json
{
    "exam_id": 1,
    "question_text": "What is the primary purpose of a database index?",
    "option_a": "To store data permanently",
    "option_b": "To speed up query execution",
    "option_c": "To encrypt sensitive data",
    "option_d": "To backup the database",
    "correct_answer": "B",
    "difficulty": "medium",
    "topic": "Databases",
    "marks": 2
}
```

**Validation Rules**:

- `exam_id`: nullable, integer, must exist in exams table
- `question_text`: required, string
- `option_a`: required, string, max 255 characters
- `option_b`: required, string, max 255 characters
- `option_c`: required, string, max 255 characters
- `option_d`: required, string, max 255 characters
- `correct_answer`: required, must be A, B, C, or D
- `difficulty`: required, must be easy, medium, or hard
- `topic`: nullable, string, max 255 characters
- `marks`: nullable, integer, min 1

**Response Example** (201 Created):

```json
{
    "id": 5,
    "exam_id": 1,
    "question_text": "What is the primary purpose of a database index?",
    "options": {
        "A": "To store data permanently",
        "B": "To speed up query execution",
        "C": "To encrypt sensitive data",
        "D": "To backup the database"
    },
    "correct_answer": "B",
    "difficulty": "medium",
    "topic": "Databases",
    "marks": 2,
    "created_at": "2026-04-03T14:30:00.000000Z",
    "updated_at": "2026-04-03T14:30:00.000000Z"
}
```

---

### 4. Update Question

**Method**: `PUT`

**URL**: `/api/questions/{id}`

**Authentication**: Required (admin)

**Request Body Example** (partial update):

```json
{
    "difficulty": "hard",
    "marks": 3,
    "topic": "Database Optimization"
}
```

**Validation Rules**: All fields are optional but follow same rules as create endpoint

**Response Example**:

```json
{
    "id": 5,
    "exam_id": 1,
    "question_text": "What is the primary purpose of a database index?",
    "options": {
        "A": "To store data permanently",
        "B": "To speed up query execution",
        "C": "To encrypt sensitive data",
        "D": "To backup the database"
    },
    "correct_answer": "B",
    "difficulty": "hard",
    "topic": "Database Optimization",
    "marks": 3,
    "created_at": "2026-04-03T14:30:00.000000Z",
    "updated_at": "2026-04-03T14:45:00.000000Z"
}
```

---

### 5. Delete Question

**Method**: `DELETE`

**URL**: `/api/questions/{id}`

**Authentication**: Required (admin)

**Response Example** (200 OK):

```json
{
    "message": "Question deleted successfully"
}
```

---

### 6. Generate Random Questions

**Method**: `GET`

**URL**: `/api/exams/{exam_id}/generate-questions?total_questions=10&easy=5&medium=3&hard=2`

**Authentication**: Required (admin)

**Parameters**:

- `total_questions` (required): Total number of questions to generate
- `easy` (optional): Number of easy questions requested
- `medium` (optional): Number of medium questions requested
- `hard` (optional): Number of hard questions requested

**Notes**:

- If difficulty distribution doesn't sum to `total_questions`, remaining slots are filled from any difficulty
- If insufficient questions exist for all requested difficulties, the system returns available questions
- Questions are selected randomly within each difficulty category
- No duplicate questions are returned

**Request Example**:

```
GET /api/exams/1/generate-questions?total_questions=10&easy=5&medium=3&hard=2
Authorization: Bearer TOKEN
```

**Response Example** (200 OK):

```json
{
    "data": [
        {
            "id": 4,
            "exam_id": null,
            "question_text": "Which SQL clause filters rows based on conditions?",
            "options": {
                "A": "WHERE",
                "B": "ORDER BY",
                "C": "GROUP BY",
                "D": "HAVING"
            },
            "difficulty": "easy",
            "topic": "Databases",
            "marks": 1,
            "created_at": "2026-04-03T12:00:00.000000Z",
            "updated_at": "2026-04-03T12:00:00.000000Z"
        },
        {
            "id": 15,
            "exam_id": null,
            "question_text": "What is the time complexity of binary search?",
            "options": {
                "A": "O(n)",
                "B": "O(log n)",
                "C": "O(n²)",
                "D": "O(1)"
            },
            "difficulty": "medium",
            "topic": "Algorithms",
            "marks": 2,
            "created_at": "2026-04-03T13:15:00.000000Z",
            "updated_at": "2026-04-03T13:15:00.000000Z"
        }
    ]
}
```

---

## Randomization Logic

The random question generation is handled by the `QuestionService::generateForExam()` method with the following algorithm:

### Selection Process

1. **Pool Building**: Creates an eligible question pool containing:
    - Questions assigned to the specific exam (`exam_id = {exam_id}`)
    - Global questions with no exam assignment (`exam_id IS NULL`)

2. **Difficulty-Based Selection**: Iterates through difficulty levels (easy → medium → hard):
    - For each difficulty, calculates remaining slots needed
    - Requests the specified count for that difficulty (capped by remaining slots)
    - Uses `inRandomOrder()` to select random questions without duplicates
    - Excludes already-selected question IDs from subsequent queries

3. **Fallback Mechanism**: If total selected < requested total:
    - Fills remaining slots from any remaining difficulty
    - Continues random selection without duplicates
    - Returns all available questions if bank is undersized

### Key Features

- **No Duplicates**: Uses `whereNotIn('id', $selectedIds)` to prevent duplicate selection
- **Random Order**: Each selection pass uses `inRandomOrder()` for true randomization
- **Graceful Degradation**: Returns fewer questions if bank cannot fulfill request
- **Predictable Distribution**: Honors difficulty quotas as long as questions are available

### Example Scenario

Request: 10 questions (easy=5, medium=3, hard=2)

- Available: 4 easy, 5 medium, 8 hard

Process:

1. Select 4 easy (only 4 available, not 5)
2. Select 3 medium (as requested)
3. Select 2 hard (as requested, 1 slot remains)
4. Fallback: Select 1 hard from remaining (to reach 10 total)
5. Return: 4 easy + 3 medium + 3 hard = 10 questions

---

## Project Structure

### Models (`app/Models/`)

- **`Question.php`**: Eloquent model for questions
    - Fillable fields: exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic, marks
    - Relationship: `belongsTo(Exam::class)`

- **`Exam.php`**: Eloquent model for exams
    - Fillable fields: subject_id, title, duration, total_marks, start_time, end_time
    - Relationships: `belongsTo(Subject::class)`, `hasMany(Question::class)`
    - Date casting for timestamps

- **`Subject.php`**: Eloquent model for subjects
    - Fillable fields: name, description
    - Relationship: `hasMany(Exam::class)`

### Controllers (`app/Http/Controllers/`)

- **`QuestionController.php`**: API endpoint handler
    - Constructor injection of `QuestionService`
    - Methods: `index()`, `show()`, `store()`, `update()`, `destroy()`, `generateQuestions()`
    - Uses dedicated form request classes for validation
    - Returns appropriate API resources

### Services (`app/Services/`)

- **`QuestionService.php`**: Business logic layer
    - `paginate()`: Filtered and paginated question retrieval
    - `create()`: Question creation with relationship loading
    - `update()`: Question modification
    - `delete()`: Question removal
    - `generateForExam()`: Random question selection with difficulty distribution

### Form Requests (`app/Http/Requests/Question/`)

- **`StoreQuestionRequest.php`**: Validates question creation
    - Checks admin authorization
    - Validates all required and optional fields

- **`UpdateQuestionRequest.php`**: Validates question updates
    - Checks admin authorization
    - Allows partial updates (all fields optional)

- **`GenerateQuestionsRequest.php`**: Validates generation requests
    - Checks admin authorization
    - Requires `total_questions` parameter

### API Resources (`app/Http/Resources/`)

- **`QuestionAdminResource.php`**: Admin-facing response format
    - Includes: id, exam_id, question_text, options, **correct_answer**, difficulty, topic, marks, timestamps
    - Used by CRUD endpoints

- **`QuestionResource.php`**: Student-facing response format
    - Excludes: correct_answer
    - Used by generation endpoint and student-accessible APIs

### Database (`database/`)

- **Migrations**:
    - `2026_04_03_000010_create_questions_table.php`: Creates questions table with indexes

- **Factories**:
    - `QuestionFactory.php`: Generates fake question data for testing
        - Random options, correct answers, difficulties, and topics
        - Default 1-5 mark values

- **Seeders**:
    - `QuestionSeeder.php`: Seeds 30 dummy questions (10 easy, 10 medium, 10 hard)
    - `DatabaseSeeder.php`: Updated to call QuestionSeeder

### Routes (`routes/`)

- **`api.php`**: API route definitions
    - CRUD routes: GET/POST /questions, GET/PUT/DELETE /questions/{question}
    - Generation route: GET /exams/{exam}/generate-questions
    - Protected by `auth:sanctum` middleware
    - Admin-only routes protected by `role:admin` middleware

---

## Setup Instructions

### Prerequisites

- PHP 8.2+
- Laravel 12
- MySQL 8.0+
- Composer and npm installed

### Installation Steps

#### 1. Run Database Migration

This creates the `questions` table with proper schema and indexes:

```bash
php artisan migrate
```

#### 2. Seed Sample Questions

Populates the database with 30 sample questions across difficulty levels:

```bash
php artisan db:seed
```

Or seed only questions:

```bash
php artisan db:seed --class=QuestionSeeder
```

#### 3. Verify Installation

Check that migrations ran successfully:

```bash
php artisan migrate:status
```

Query the database to verify questions were seeded:

```bash
php artisan tinker
>>> App\Models\Question::count()
=> 30
```

### Configuration

No additional configuration required. The system uses Laravel's default settings for:

- Database connection (configured in `.env`)
- Authentication (Laravel Sanctum bearer token)
- API versioning (handled by routes)

---

## Testing the API

### Prerequisites

Obtain a valid Sanctum token by authenticating:

```bash
curl -X POST "http://localhost:8000/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

Response will include a `token` field.

### 1. Retrieve All Questions

```bash
curl -X GET "http://localhost:8000/api/questions?per_page=15" \
    -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Accept: application/json"
```

### 2. Create a Question

```bash
curl -X POST "http://localhost:8000/api/questions" \
    -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exam_id": 1,
    "question_text": "What is OOP?",
    "option_a": "Object-Oriented Programming",
    "option_b": "Object-Oriented Protocol",
    "option_c": "Online Operating Platform",
    "option_d": "Open Object Protocol",
    "correct_answer": "A",
    "difficulty": "easy",
    "topic": "Programming Concepts",
    "marks": 1
  }'
```

### 3. Generate Random Questions

```bash
curl -X GET "http://localhost:8000/api/exams/1/generate-questions?total_questions=10&easy=5&medium=3&hard=2" \
    -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Accept: application/json"
```

### 4. Update Question

```bash
curl -X PUT "http://localhost:8000/api/questions/1" \
    -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marks": 2,
    "difficulty": "medium"
  }'
```

### 5. Delete Question

```bash
curl -X DELETE "http://localhost:8000/api/questions/1" \
    -H "Authorization: Bearer YOUR_SANCTUM_TOKEN"
```

---

## Changes Made

This section provides a comprehensive record of all modifications made to the Invigilore codebase to implement the Question Bank system.

### Files Created

#### Models

- **`app/Models/Question.php`**:
    - Eloquent model with 10 fillable properties (exam_id, question_text, option_a/b/c/d, correct_answer, difficulty, topic, marks)
    - Relationship: belongsTo Exam model
    - Uses HasFactory trait for testing

- **`app/Models/Exam.php`**:
    - Eloquent model for examination records
    - Fillable: subject_id, title, duration, total_marks, start_time, end_time
    - Relationships: belongsTo Subject, hasMany Question
    - Date casting for start_time and end_time

- **`app/Models/Subject.php`**:
    - Eloquent model for course subjects
    - Fillable: name, description
    - Relationship: hasMany Exam

#### Services

- **`app/Services/QuestionService.php`**:
    - Core business logic layer with 5 public methods
    - `paginate()`: Retrieves filtered questions with pagination (exam_id, difficulty, topic filters)
    - `create()`: Creates new question and eager-loads exam relationship
    - `update()`: Updates existing question and returns fresh model
    - `delete()`: Soft/hard delete handler
    - `generateForExam()`: Complex random selection with difficulty distribution and fallback logic

#### Controllers

- **`app/Http/Controllers/QuestionController.php`** (refactored):
    - Constructor injection of QuestionService
    - Method `index()`: Lists questions with filters and pagination
    - Method `show()`: Returns single question with admin resource
    - Method `store()`: Creates question via validated request
    - Method `update()`: Updates question via validated request
    - Method `destroy()`: Deletes question
    - Method `generateQuestions()`: Generates randomized question sets for exams
    - Replaced inline validation with dedicated form request classes

#### Form Requests

- **`app/Http/Requests/Question/StoreQuestionRequest.php`**:
    - Validates question creation with 10 rules
    - Checks admin role authorization
    - Validates exam_id existence, correct_answer options, difficulty enum

- **`app/Http/Requests/Question/UpdateQuestionRequest.php`**:
    - Validates partial question updates (all fields with 'sometimes' rule)
    - Checks admin role authorization
    - Same validation rules as store but with optional flags

- **`app/Http/Requests/Question/GenerateQuestionsRequest.php`**:
    - Validates generation endpoint parameters
    - Requires total_questions (min 1)
    - Allows optional difficulty parameters (easy, medium, hard)
    - Checks admin authorization

#### API Resources

- **`app/Http/Resources/QuestionAdminResource.php`**:
    - Admin-facing response with complete information
    - Includes correct_answer field
    - Condenses option_a/b/c/d into options array format
    - Used by CRUD endpoints

- **`app/Http/Resources/QuestionResource.php`**:
    - Student-facing response without correct_answer
    - Identical format to admin resource but excludes sensitive answer data
    - Used by generation endpoint

#### Database

- **`database/migrations/2026_04_03_000010_create_questions_table.php`**:
    - Creates questions table with id, exam_id (FK, nullable), question_text, option_a/b/c/d, correct_answer (enum), difficulty (enum), topic, marks (default 1)
    - Creates indexes on exam_id, difficulty, topic for query performance
    - Includes cascading delete on exam_id foreign key
    - Nullable on delete for exam_id (nullOnDelete)

- **`database/factories/QuestionFactory.php`**:
    - Factory for generating fake question data
    - Uses Faker to create realistic question text and options
    - Random correct answer selection from A-D
    - Random difficulty selection from easy/medium/hard
    - Random topic from predefined list (Mathematics, Programming, Databases, Networking, Security)
    - Random marks between 1-5

- **`database/seeders/QuestionSeeder.php`**:
    - Seeds 30 sample questions into database
    - 10 easy, 10 medium, 10 hard difficulty distribution
    - All with exam_id = null (global question bank)
    - Uses QuestionFactory for data generation

### Files Modified

#### Routes

- **`routes/api.php`**:
    - Reorganized question routes from `role:admin,teacher` to `role:admin` only (tightened security)
    - Added new route: `GET /api/exams/{exam}/generate-questions` → `QuestionController@generateQuestions`
    - Removed inline question routes from admin,teacher group
    - Created dedicated admin-only question bank routes group

#### Database

- **`database/seeders/DatabaseSeeder.php`**:
    - Added call to `QuestionSeeder::class` in run() method
    - Now automatically executes QuestionSeeder when running `php artisan db:seed`
    - Executes after RoleSeeder to ensure seed order

---

## Architecture & Design Patterns

### Service Layer Architecture

Business logic is isolated in `QuestionService` rather than in the controller, providing:

- Easier testing of business logic
- Reusability across multiple controllers
- Clear separation of concerns
- Maintainability and readability

### Repository Pattern Alternative

While not implementing a dedicated repository interface, the service class follows repository pattern principles by providing a single point for data access.

### Form Request Validation

Validation logic is moved from controllers to dedicated `FormRequest` classes:

- `StoreQuestionRequest` for create operations
- `UpdateQuestionRequest` for update operations
- `GenerateQuestionsRequest` for generation operations

This provides:

- Centralized validation rules
- Authorization checks before validation
- Type hints and IDE support
- Reusability and consistency

### API Resource Formatting

Two separate resources control output format:

- `QuestionAdminResource`: Full data with answers (admin use)
- `QuestionResource`: Publicly-safe format without answers (student use)

Allows same model to be formatted differently based on access level.

### Intelligent Random Selection

The `generateForExam()` method implements:

- Difficulty-based bucketing and selection
- Fallback logic when requested distribution unavailable
- No-duplicate enforcement via excluded IDs tracking
- Proper Eloquent query cloning to avoid side effects

---

## Security Considerations

1. **Role-Based Access Control**: All question endpoints require `role:admin` middleware
2. **Correct Answer Hiding**: Student-facing API uses `QuestionResource` without correct_answer field
3. **Input Validation**: All inputs validated via form requests with strict rules
4. **Mass Assignment Protection**: Fillable array prevents unintended property assignment
5. **SQL Injection Protection**: Eloquent ORM with parameterized queries
6. **Authorization**: Form request authorize() method checks user role before processing

---

## Performance Optimization

1. **Database Indexes**: Indexes on exam_id, difficulty, topic speed up filtering queries
2. **Eager Loading**: Relationships loaded via with() to prevent N+1 queries
3. **Pagination**: Default 15 items per page, max 100 to prevent memory issues
4. **Random Selection**: Uses database-level randomization instead of PHP-level
5. **Query Cloning**: Prevents query builder state errors in loops

---

## Future Enhancements

Potential improvements for future iterations:

1. **Bulk Operations**: Endpoint to create/update/delete multiple questions at once
2. **Question Categories**: Hierarchical topic organization
3. **Question Versioning**: Track question history and changes
4. **Analytics**: Track question usage, difficulty metrics, student performance
5. **Bulk Import**: CSV/Excel upload for question bank population
6. **Question Duplication**: Quick copy existing questions
7. **Time Limits**: Add estimated time per question
8. **Question Tags**: Multiple tags per question instead of single topic
9. **Question Images**: Support for image-based questions
10. **Question Explanations**: Add explanation text for each option

---

## Troubleshooting

### Questions Table Not Found

**Problem**: Migration status shows pending

**Solution**:

```bash
php artisan migrate
```

### Authorization Errors (403)

**Problem**: Getting "Forbidden. Insufficient permissions" responses

**Solution**: Ensure user has `admin` role:

```bash
php artisan tinker
>>> $user = App\Models\User::first();
>>> $user->role_id = App\Models\Role::where('name', 'admin')->first()->id;
>>> $user->save();
```

### No Questions in Database

**Problem**: Generation endpoint returns empty results

**Solution**: Run the seeder:

```bash
php artisan db:seed --class=QuestionSeeder
```

### Duplicate Questions Selected

**Problem**: Random generation returns duplicate IDs

**Solution**: This shouldn't occur. Report issue if observed—verify query builder cloning in service.

---

## Support & Documentation

For more information:

- Laravel ORM Documentation: https://laravel.com/docs/eloquent
- API Resource Documentation: https://laravel.com/docs/eloquent-resources
- Form Request Documentation: https://laravel.com/docs/validation#form-request-validation
