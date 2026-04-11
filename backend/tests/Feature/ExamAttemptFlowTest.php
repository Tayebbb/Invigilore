<?php

namespace Tests\Feature;

use App\Models\AttemptAnswer;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExamAttemptFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_start_attempt_returns_randomized_questions_without_correct_answers(): void
    {
        $userA = $this->createAuthenticatedUser();
        $userB = $this->createAuthenticatedUser();

        $exam = Exam::factory()->create(['duration' => 30]);
        $questions = Question::factory()
            ->count(6)
            ->for($exam)
            ->create();

        Sanctum::actingAs($userA);
        $responseA = $this->postJson('/api/attempts/start', [
            'exam_id' => $exam->id,
        ]);

        $responseA->assertCreated()
            ->assertJsonStructure([
                'attempt' => ['id', 'exam_id', 'start_time', 'duration', 'status'],
                'questions' => [['id', 'exam_id', 'question_text', 'type', 'options', 'marks']],
            ]);

        $payloadA = $responseA->json('questions');
        foreach ($payloadA as $question) {
            $this->assertArrayNotHasKey('correct_answer', $question);
        }

        Sanctum::actingAs($userB);
        $responseB = $this->postJson('/api/attempts/start', [
            'exam_id' => $exam->id,
        ]);
        $responseB->assertCreated();

        $orderA = collect($responseA->json('questions'))->pluck('id')->values()->all();
        $orderB = collect($responseB->json('questions'))->pluck('id')->values()->all();

        $this->assertEqualsCanonicalizing($questions->pluck('id')->all(), $orderA);
        $this->assertEqualsCanonicalizing($questions->pluck('id')->all(), $orderB);
        $this->assertNotSame($orderA, $orderB, 'Question order should be randomized between attempts.');
    }

    public function test_cannot_start_multiple_active_attempts_for_same_exam(): void
    {
        $user = $this->createAuthenticatedUser();
        $exam = Exam::factory()->create(['duration' => 30]);
        Question::factory()->count(3)->for($exam)->create();

        Sanctum::actingAs($user);
        $this->postJson('/api/attempts/start', [
            'exam_id' => $exam->id,
        ])->assertCreated();

        Sanctum::actingAs($user);
        $this->postJson('/api/attempts/start', [
            'exam_id' => $exam->id,
        ])->assertStatus(409);
    }

    public function test_save_answer_upserts_without_duplicate_rows(): void
    {
        $user = $this->createAuthenticatedUser();
        $exam = Exam::factory()->create(['duration' => 30]);
        $question = Question::factory()->for($exam)->create();

        $attempt = ExamAttempt::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'start_time' => now(),
            'started_at' => now(),
            'duration' => 30,
            'status' => 'in_progress',
        ]);

        Sanctum::actingAs($user);
        $this->postJson("/api/attempts/{$attempt->id}/answer", [
            'question_id' => $question->id,
            'selected_answer' => 'A',
        ])->assertOk();

        Sanctum::actingAs($user);
        $this->postJson("/api/attempts/{$attempt->id}/answer", [
            'question_id' => $question->id,
            'selected_answer' => 'B',
        ])->assertOk();

        $this->assertDatabaseCount('attempt_answers', 1);
        $this->assertDatabaseHas('attempt_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_answer' => 'B',
        ]);
    }

    public function test_get_attempt_returns_saved_answers_and_remaining_time(): void
    {
        Carbon::setTestNow('2026-04-04 10:00:00');

        $user = $this->createAuthenticatedUser();
        $exam = Exam::factory()->create(['duration' => 20]);
        $question = Question::factory()->for($exam)->create();

        $attempt = ExamAttempt::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'start_time' => now()->subMinutes(5),
            'started_at' => now()->subMinutes(5),
            'duration' => 20,
            'status' => 'in_progress',
        ]);

        AttemptAnswer::create([
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_answer' => 'C',
        ]);

        Sanctum::actingAs($user);
        $response = $this->getJson("/api/attempts/{$attempt->id}");

        $response->assertOk()
            ->assertJsonPath('attempt.id', $attempt->id)
            ->assertJsonPath('questions.0.id', $question->id)
            ->assertJsonPath('questions.0.selected_answer', 'C');

        $remaining = $response->json('remaining_time');
        $this->assertIsInt($remaining);
        $this->assertGreaterThan(0, $remaining);
        $this->assertLessThanOrEqual(20 * 60, $remaining);
    }

    public function test_auto_submit_when_time_expires(): void
    {
        Carbon::setTestNow('2026-04-04 10:00:00');

        $user = $this->createAuthenticatedUser();
        $exam = Exam::factory()->create(['duration' => 1]);
        Question::factory()->for($exam)->create();

        $attempt = ExamAttempt::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'start_time' => now(),
            'started_at' => now(),
            'duration' => 1,
            'status' => 'in_progress',
        ]);

        Carbon::setTestNow(now()->addSeconds(61));

        Sanctum::actingAs($user);
        $this->getJson("/api/attempts/{$attempt->id}")
            ->assertOk()
            ->assertJsonPath('attempt.status', 'timeout')
            ->assertJsonPath('remaining_time', 0);

        $this->assertDatabaseHas('exam_attempts', [
            'id' => $attempt->id,
            'status' => 'timeout',
        ]);

        $this->assertNotNull(ExamAttempt::findOrFail($attempt->id)->end_time);
    }

    public function test_submit_calculates_score_correctly(): void
    {
        $user = $this->createAuthenticatedUser();
        $exam = Exam::factory()->create(['duration' => 30]);

        $q1 = Question::factory()->for($exam)->create([
            'correct_answer' => 'A',
            'marks' => 2,
        ]);
        $q2 = Question::factory()->for($exam)->create([
            'correct_answer' => 'B',
            'marks' => 3,
        ]);

        $attempt = ExamAttempt::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'start_time' => now(),
            'started_at' => now(),
            'duration' => 30,
            'status' => 'in_progress',
        ]);

        AttemptAnswer::create([
            'attempt_id' => $attempt->id,
            'question_id' => $q1->id,
            'selected_answer' => 'A',
        ]);
        AttemptAnswer::create([
            'attempt_id' => $attempt->id,
            'question_id' => $q2->id,
            'selected_answer' => 'D',
        ]);

        Sanctum::actingAs($user);
        $this->postJson("/api/attempts/{$attempt->id}/submit")
            ->assertOk()
            ->assertJsonPath('status', 'submitted')
            ->assertJsonPath('result.score', 2)
            ->assertJsonPath('result.correct_answers', 1)
            ->assertJsonPath('result.answered_questions', 2)
            ->assertJsonPath('result.total_questions', 2)
            ->assertJsonPath('result.total_marks', 5);

        $this->assertDatabaseHas('attempt_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $q1->id,
            'is_correct' => 1,
        ]);
        $this->assertDatabaseHas('attempt_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $q2->id,
            'is_correct' => 0,
        ]);

        $this->assertDatabaseHas('results', [
            'attempt_id' => $attempt->id,
            'score' => 2,
            'total_marks' => 5,
        ]);
    }

    public function test_prevent_duplicate_submissions(): void
    {
        $user = $this->createAuthenticatedUser();
        $exam = Exam::factory()->create(['duration' => 30]);
        Question::factory()->for($exam)->create();

        $attempt = ExamAttempt::create([
            'user_id' => $user->id,
            'exam_id' => $exam->id,
            'start_time' => now(),
            'started_at' => now(),
            'duration' => 30,
            'status' => 'in_progress',
        ]);

        Sanctum::actingAs($user);
        $this->postJson("/api/attempts/{$attempt->id}/submit")
            ->assertOk();

        Sanctum::actingAs($user);
        $this->postJson("/api/attempts/{$attempt->id}/submit")
            ->assertStatus(409);
    }

    public function test_enforce_user_ownership(): void
    {
        $owner = $this->createAuthenticatedUser();
        $otherUser = $this->createAuthenticatedUser();

        $exam = Exam::factory()->create(['duration' => 30]);
        $question = Question::factory()->for($exam)->create();

        $attempt = ExamAttempt::create([
            'user_id' => $owner->id,
            'exam_id' => $exam->id,
            'start_time' => now(),
            'started_at' => now(),
            'duration' => 30,
            'status' => 'in_progress',
        ]);

        Sanctum::actingAs($otherUser);
        $this->getJson("/api/attempts/{$attempt->id}")
            ->assertStatus(403);

        Sanctum::actingAs($otherUser);
        $this->postJson("/api/attempts/{$attempt->id}/answer", [
            'question_id' => $question->id,
            'selected_answer' => 'A',
        ])->assertStatus(403);

        Sanctum::actingAs($otherUser);
        $this->postJson("/api/attempts/{$attempt->id}/submit")
            ->assertStatus(403);
    }

    private function createAuthenticatedUser(string $roleName = 'student'): User
    {
        $role = Role::query()->firstOrCreate(
            ['name' => $roleName],
            ['description' => ucfirst($roleName) . ' role']
        );

        return User::factory()->create([
            'role_id' => $role->id,
        ]);
    }
}
