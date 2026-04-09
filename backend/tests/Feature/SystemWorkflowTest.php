<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Models\User;
use App\Models\Exam;
use App\Models\Subject;

class SystemWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected $adminToken;
    protected $subject;
    protected $setterEmail = 'setter@example.com';
    protected $moderatorEmail = 'moderator@example.com';
    protected $invigilatorEmail = 'invigilator@example.com';

    protected function setUp(): void
    {
        parent::setUp();
        // Seed database and create users/roles as needed
        $this->artisan('db:seed');
        $this->subject = Subject::first();
        $adminRoleId = \App\Models\Role::where('name', 'admin')->value('id');
        $admin = User::where('role_id', $adminRoleId)->first();
        $this->adminToken = $admin ? $admin->createToken('admin-token')->plainTextToken : null;
    }

    public function test_final_output_reporting()
    {
        $success = true;
        $errors = [];
        try {
            $this->test_exam_creation_by_admin();
            $this->test_exam_roles_assignment();
            $this->test_question_creation_by_setter();
            $this->test_exam_attempt_by_student();
            $this->test_access_control_enforcement();
            $this->test_exam_timing_and_security();
            $this->test_data_consistency();
            $this->test_edge_cases();
        } catch (\Throwable $e) {
            $success = false;
            $errors[] = $e->getMessage();
        }
        $this->assertTrue($success, 'Errors: ' . implode('; ', $errors));
        if ($success) {
            fwrite(STDERR, "System lifecycle fully validated and complete\n");
        }
    }

    public function test_edge_cases()
    {
                            // Create exam and question
                            $payload = [
                                'title' => 'Edge Case Exam',
                                'subject_id' => $this->subject->id,
                                'duration' => 60,
                                'total_marks' => 10,
                                'start_time' => now()->addHour()->toDateTimeString(),
                                'end_time' => now()->addHours(2)->toDateTimeString(),
                                'question_setter_email' => $this->setterEmail,
                                'moderator_email' => $this->moderatorEmail,
                                'invigilator_email' => $this->invigilatorEmail,
                            ];
                            $examResponse = $this->withToken($this->adminToken)
                                ->postJson('/api/exams', $payload);
                            $examResponse->assertStatus(201);
                            $examId = $examResponse->json('id') ?? Exam::where('title', 'Edge Case Exam')->value('id');

                            $setter = User::where('email', $this->setterEmail)->first();
                            $setterToken = $setter ? $setter->createToken('setter-token')->plainTextToken : null;
                            $questionPayload = [
                                'exam_id' => $examId,
                                'question_text' => 'Edge Q?',
                                'option_a' => 'Edge case',
                                'option_b' => 'Normal case',
                                'option_c' => 'No case',
                                'option_d' => 'All cases',
                                'correct_answer' => 'A',
                                'difficulty' => 'hard',
                                'marks' => 2,
                            ];
                            $questionResponse = $this->withToken($setterToken)
                                ->postJson('/api/questions', $questionPayload);
                            $questionResponse->assertStatus(201);
                            $questionId = $questionResponse->json('id');

                            $student = User::whereHas('role', function($q){ $q->where('name', 'student'); })->first();
                            $studentToken = $student ? $student->createToken('student-token')->plainTextToken : null;

                            // Duplicate attempts
                            $attemptPayload = [ 'exam_id' => $examId ];
                            $attemptResponse = $this->withToken($studentToken)
                                ->postJson('/api/attempts', $attemptPayload);
                            $attemptResponse->assertStatus(201);
                            $secondAttemptResponse = $this->withToken($studentToken)
                                ->postJson('/api/attempts', $attemptPayload);
                            $secondAttemptResponse->assertStatus(409);

                            // Invalid exam_id/question_id
                            $invalidAttempt = $this->withToken($studentToken)
                                ->postJson('/api/attempts', ['exam_id' => 999999]);
                            $invalidAttempt->assertStatus(404);
                            $invalidAnswer = $this->withToken($studentToken)
                                ->postJson('/api/answers', [
                                    'attempt_id' => 999999,
                                    'question_id' => 999999,
                                    'answer' => 'X',
                                ]);
                            $invalidAnswer->assertStatus(404);

                            // Concurrent submissions (simulate by submitting twice)
                            $attemptId = $attemptResponse->json('id');
                            $submit1 = $this->withToken($studentToken)
                                ->postJson('/api/attempts/' . $attemptId . '/submit');
                            $submit1->assertStatus(200);
                            $submit2 = $this->withToken($studentToken)
                                ->postJson('/api/attempts/' . $attemptId . '/submit');
                            $submit2->assertStatus(409);

                            // Deleting exam with attempts should fail (foreign key constraint)
                            $deleteResponse = $this->withToken($this->adminToken)
                                ->deleteJson('/api/exams/' . $examId);
                            $deleteResponse->assertStatus(409);
                        }
                    public function test_data_consistency()
                    {
                        // Create exam, question, and attempt as in previous tests
                        $payload = [
                            'title' => 'Consistency Exam',
                            'subject_id' => $this->subject->id,
                            'duration' => 60,
                            'total_marks' => 10,
                            'start_time' => now()->addHour()->toDateTimeString(),
                            'end_time' => now()->addHours(2)->toDateTimeString(),
                            'question_setter_email' => $this->setterEmail,
                            'moderator_email' => $this->moderatorEmail,
                            'invigilator_email' => $this->invigilatorEmail,
                        ];
                        $examResponse = $this->withToken($this->adminToken)
                            ->postJson('/api/exams', $payload);
                        $examResponse->assertStatus(201);
                        $examId = $examResponse->json('id') ?? Exam::where('title', 'Consistency Exam')->value('id');

                        $setter = User::where('email', $this->setterEmail)->first();
                        $setterToken = $setter ? $setter->createToken('setter-token')->plainTextToken : null;
                        $questionPayload = [
                            'exam_id' => $examId,
                            'question_text' => 'Consistency Q?',
                            'option_a' => 'Consistent data',
                            'option_b' => 'Random data',
                            'option_c' => 'No data',
                            'option_d' => 'All of the above',
                            'correct_answer' => 'A',
                            'difficulty' => 'easy',
                            'marks' => 2,
                        ];
                        $questionResponse = $this->withToken($setterToken)
                            ->postJson('/api/questions', $questionPayload);
                        $questionResponse->assertStatus(201);
                        $questionId = $questionResponse->json('id');

                        $student = User::whereHas('role', function($q){ $q->where('name', 'student'); })->first();
                        $studentToken = $student ? $student->createToken('student-token')->plainTextToken : null;
                        $attemptPayload = [ 'exam_id' => $examId ];
                        $attemptResponse = $this->withToken($studentToken)
                            ->postJson('/api/attempts', $attemptPayload);
                        $attemptResponse->assertStatus(201);
                        $attemptId = $attemptResponse->json('id');

                        $answerPayload = [
                            'attempt_id' => $attemptId,
                            'question_id' => $questionId,
                            'answer' => 'A',
                        ];
                        $answerResponse = $this->withToken($studentToken)
                            ->postJson('/api/answers', $answerPayload);
                        $answerResponse->assertStatus(201);

                        $submitResponse = $this->withToken($studentToken)
                            ->postJson('/api/attempts/' . $attemptId . '/submit');
                        $submitResponse->assertStatus(200);

                        // Validate links
                        $this->assertDatabaseHas('answers', [
                            'attempt_id' => $attemptId,
                            'question_id' => $questionId,
                        ]);
                        $this->assertDatabaseHas('exam_attempts', [
                            'id' => $attemptId,
                            'exam_id' => $examId,
                            'user_id' => $student->id,
                        ]);
                        $this->assertDatabaseHas('results', [
                            'attempt_id' => $attemptId,
                        ]);
                        // exam_roles match assignments
                        $this->assertDatabaseHas('exam_roles', [
                            'exam_id' => $examId,
                            'role' => 'question_setter',
                        ]);
                        $this->assertDatabaseHas('exam_roles', [
                            'exam_id' => $examId,
                            'role' => 'moderator',
                        ]);
                        $this->assertDatabaseHas('exam_roles', [
                            'exam_id' => $examId,
                            'role' => 'invigilator',
                        ]);
                    }
                public function test_exam_timing_and_security()
                {
                    // Create exam
                    $payload = [
                        'title' => 'Timing Security Exam',
                        'subject_id' => $this->subject->id,
                        'duration' => 1, // 1 minute for quick test
                        'total_marks' => 10,
                        'start_time' => now()->addMinute()->toDateTimeString(),
                        'end_time' => now()->addMinutes(2)->toDateTimeString(),
                        'question_setter_email' => $this->setterEmail,
                        'moderator_email' => $this->moderatorEmail,
                        'invigilator_email' => $this->invigilatorEmail,
                    ];
                    $examResponse = $this->withToken($this->adminToken)
                        ->postJson('/api/exams', $payload);
                    $examResponse->assertStatus(201);
                    $examId = $examResponse->json('id') ?? Exam::where('title', 'Timing Security Exam')->value('id');

                    // Authenticate as student
                    $student = User::whereHas('role', function($q){ $q->where('name', 'student'); })->first();
                    $studentToken = $student ? $student->createToken('student-token')->plainTextToken : null;

                    // Start first attempt
                    $attemptPayload = [ 'exam_id' => $examId ];
                    $attemptResponse = $this->withToken($studentToken)
                        ->postJson('/api/attempts', $attemptPayload);
                    $attemptResponse->assertStatus(201);
                    $attemptId = $attemptResponse->json('id');

                    // Try to start another attempt (should fail)
                    $secondAttemptResponse = $this->withToken($studentToken)
                        ->postJson('/api/attempts', $attemptPayload);
                    $secondAttemptResponse->assertStatus(409); // Conflict: already active attempt

                    // Simulate submission after timeout (manipulate DB to set attempt start time in the past)
                    \DB::table('exam_attempts')->where('id', $attemptId)->update([
                        'started_at' => now()->subMinutes(10),
                    ]);
                    $submitResponse = $this->withToken($studentToken)
                        ->postJson('/api/attempts/' . $attemptId . '/submit');
                    $submitResponse->assertStatus(403); // Forbidden: timeout
                }
            public function test_access_control_enforcement()
            {
                // Authenticate as student
                $student = User::whereHas('role', function($q){ $q->where('name', 'student'); })->first();
                $studentToken = $student ? $student->createToken('student-token')->plainTextToken : null;
                // Students cannot create exams
                $examPayload = [
                    'title' => 'Unauthorized Exam',
                    'subject_id' => $this->subject->id,
                    'duration' => 60,
                    'total_marks' => 50,
                    'start_time' => now()->addHour()->toDateTimeString(),
                    'end_time' => now()->addHours(2)->toDateTimeString(),
                ];
                $response = $this->withToken($studentToken)
                    ->postJson('/api/exams', $examPayload);
                $response->assertStatus(403);

                // Students cannot create questions
                $questionPayload = [
                    'exam_id' => 1,
                    'question_text' => 'Should fail',
                    'option_a' => 'A',
                    'option_b' => 'B',
                    'option_c' => 'C',
                    'option_d' => 'D',
                    'correct_answer' => 'A',
                    'difficulty' => 'easy',
                    'marks' => 1,
                ];
                $response = $this->withToken($studentToken)
                    ->postJson('/api/questions', $questionPayload);
                $response->assertStatus(403);

                // Setters cannot manage users
                $setter = User::where('email', $this->setterEmail)->first();
                $setterToken = $setter ? $setter->createToken('setter-token')->plainTextToken : null;
                $userPayload = [
                    'name' => 'Unauthorized',
                    'email' => 'unauth@example.com',
                    'password' => 'password',
                    'role_id' => 1,
                ];
                $response = $this->withToken($setterToken)
                    ->postJson('/api/users', $userPayload);
                $response->assertStatus(403);

                // Moderators and invigilators limited to their scope (example: cannot create exams)
                $moderator = User::where('email', $this->moderatorEmail)->first();
                $moderatorToken = $moderator ? $moderator->createToken('moderator-token')->plainTextToken : null;
                $response = $this->withToken($moderatorToken)
                    ->postJson('/api/exams', $examPayload);
                $response->assertStatus(403);
            }
        public function test_exam_attempt_by_student()
        {
            // Create exam and question
            $payload = [
                'title' => 'Student Attempt Exam',
                'subject_id' => $this->subject->id,
                'duration' => 60,
                'total_marks' => 50,
                'start_time' => now()->addHour()->toDateTimeString(),
                'end_time' => now()->addHours(2)->toDateTimeString(),
                'question_setter_email' => $this->setterEmail,
                'moderator_email' => $this->moderatorEmail,
                'invigilator_email' => $this->invigilatorEmail,
            ];
            $examResponse = $this->withToken($this->adminToken)
                ->postJson('/api/exams', $payload);
            $examResponse->assertStatus(201);
            $examId = $examResponse->json('id') ?? Exam::where('title', 'Student Attempt Exam')->value('id');

            // Create question as setter
            $setter = User::where('email', $this->setterEmail)->first();
            $setterToken = $setter ? $setter->createToken('setter-token')->plainTextToken : null;
            $questionPayload = [
                'exam_id' => $examId,
                'question_text' => 'Define validation.',
                'option_a' => 'Checking correctness',
                'option_b' => 'Ignoring errors',
                'option_c' => 'Deleting data',
                'option_d' => 'None of the above',
                'correct_answer' => 'A',
                'difficulty' => 'easy',
                'marks' => 2,
            ];
            $questionResponse = $this->withToken($setterToken)
                ->postJson('/api/questions', $questionPayload);
            $questionResponse->assertStatus(201);
            $questionId = $questionResponse->json('id');

            // Authenticate as student
            $student = User::whereHas('role', function($q){ $q->where('name', 'student'); })->first();
            $studentToken = $student ? $student->createToken('student-token')->plainTextToken : null;

            // Start exam attempt
            $attemptPayload = [ 'exam_id' => $examId ];
            $attemptResponse = $this->withToken($studentToken)
                ->postJson('/api/attempts', $attemptPayload);
            $attemptResponse->assertStatus(201);
            $attemptId = $attemptResponse->json('id');

            // Save answer
            $answerPayload = [
                'attempt_id' => $attemptId,
                'question_id' => $questionId,
                'answer' => 'Validation is contract enforcement.',
            ];
            $answerResponse = $this->withToken($studentToken)
                ->postJson('/api/answers', $answerPayload);
            $answerResponse->assertStatus(201);
            $this->assertDatabaseHas('answers', [
                'attempt_id' => $attemptId,
                'question_id' => $questionId,
            ]);

            // Submit exam
            $submitResponse = $this->withToken($studentToken)
                ->postJson('/api/attempts/' . $attemptId . '/submit');
            $submitResponse->assertStatus(200);

            // Validate attempt, answers, and status
            $this->assertDatabaseHas('exam_attempts', [
                'id' => $attemptId,
                'exam_id' => $examId,
                'user_id' => $student->id,
                'status' => 'submitted',
            ]);
            $this->assertDatabaseHas('results', [
                'attempt_id' => $attemptId,
            ]);
        }
    public function test_question_creation_by_setter()
    {
        // Create exam and assign setter
        $payload = [
            'title' => 'Setter Question Exam',
            'subject_id' => $this->subject->id,
            'duration' => 60,
            'total_marks' => 50,
            'start_time' => now()->addHour()->toDateTimeString(),
            'end_time' => now()->addHours(2)->toDateTimeString(),
            'question_setter_email' => $this->setterEmail,
            'moderator_email' => $this->moderatorEmail,
            'invigilator_email' => $this->invigilatorEmail,
        ];
        $examResponse = $this->withToken($this->adminToken)
            ->postJson('/api/exams', $payload);
        $examResponse->assertStatus(201);
        $examId = $examResponse->json('id') ?? Exam::where('title', 'Setter Question Exam')->value('id');

        // Authenticate as setter
        $setter = User::where('email', $this->setterEmail)->first();
        $setterToken = $setter ? $setter->createToken('setter-token')->plainTextToken : null;
        $questionPayload = [
            'exam_id' => $examId,
            'question_text' => 'What is contract testing?',
            'option_a' => 'A contract between services',
            'option_b' => 'A type of database',
            'option_c' => 'A frontend test',
            'option_d' => 'A deployment script',
            'correct_answer' => 'A',
            'difficulty' => 'medium',
            'marks' => 5,
        ];
        $response = $this->withToken($setterToken)
            ->postJson('/api/questions', $questionPayload);
        $response->assertStatus(201);
        $this->assertDatabaseHas('questions', [
            'exam_id' => $examId,
            'question_text' => 'What is contract testing?',
            'difficulty' => 'medium',
        ]);
    }


    public function test_exam_creation_by_admin()
    {
        $payload = [
            'title' => 'Contract Test Exam',
            'subject_id' => $this->subject->id,
            'duration' => 90,
            'total_marks' => 100,
            'start_time' => now()->addHour()->toDateTimeString(),
            'end_time' => now()->addHours(2)->toDateTimeString(),
            'question_setter_email' => $this->setterEmail,
            'moderator_email' => $this->moderatorEmail,
            'invigilator_email' => $this->invigilatorEmail,
        ];

        $response = $this->withToken($this->adminToken)
            ->postJson('/api/exams', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('exams', [
            'title' => 'Contract Test Exam',
            'subject_id' => $this->subject->id,
        ]);
    }

    public function test_exam_roles_assignment()
    {
        // First, create the exam as admin
        $payload = [
            'title' => 'Role Assignment Exam',
            'subject_id' => $this->subject->id,
            'duration' => 60,
            'total_marks' => 50,
            'start_time' => now()->addHour()->toDateTimeString(),
            'end_time' => now()->addHours(2)->toDateTimeString(),
            'question_setter_email' => $this->setterEmail,
            'moderator_email' => $this->moderatorEmail,
            'invigilator_email' => $this->invigilatorEmail,
        ];

        $response = $this->withToken($this->adminToken)
            ->postJson('/api/exams', $payload);
        $response->assertStatus(201);
        $examId = $response->json('id') ?? Exam::where('title', 'Role Assignment Exam')->value('id');

        // Check exam_roles table for correct links
        $this->assertDatabaseHas('exam_roles', [
            'exam_id' => $examId,
            'role' => 'question_setter',
        ]);
        $this->assertDatabaseHas('exam_roles', [
            'exam_id' => $examId,
            'role' => 'moderator',
        ]);
        $this->assertDatabaseHas('exam_roles', [
            'exam_id' => $examId,
            'role' => 'invigilator',
        ]);

        // Validate foreign key integrity
        $roles = \App\Models\ExamRole::where('exam_id', $examId)->get();
        foreach ($roles as $role) {
            $this->assertNotNull($role->user);
            $this->assertNotNull($role->exam);
        }
    }
}
