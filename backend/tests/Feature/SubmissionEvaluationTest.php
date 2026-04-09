<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\Question;
use App\Models\Role;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubmissionEvaluationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_submission_is_evaluated_and_saved_with_breakdown(): void
    {
        $studentRole = Role::where('name', 'student')->first();
        $adminRole = Role::where('name', 'admin')->first();

        $student = User::factory()->create([
            'role_id' => $studentRole->id,
            'is_active' => true,
        ]);

        $exam = Exam::factory()->create();

        $mcq = Question::factory()->for($exam)->create([
            'type' => 'mcq',
            'correct_answer' => 'A',
            'marks' => 5,
        ]);

        $shortAnswer = Question::factory()->for($exam)->create([
            'type' => 'descriptive',
            'correct_answer' => 'newton second law',
            'marks' => 10,
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson('/api/submissions', [
            'exam_id' => $exam->id,
            'answers' => [
                ['question_id' => $mcq->id, 'submitted_answer' => 'a'],
                ['question_id' => $shortAnswer->id, 'submitted_answer' => 'Newton second law'],
            ],
            'scoring_rules' => [
                'partial_credit' => true,
                'similarity_threshold' => 80,
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.exam_id', $exam->id)
            ->assertJsonPath('data.total_questions', 2)
            ->assertJsonPath('data.answers.0.question_id', $mcq->id)
            ->assertJsonPath('data.answers.0.is_correct', true);

        $submissionId = $response->json('data.id');

        $this->assertDatabaseHas('submissions', [
            'id' => $submissionId,
            'user_id' => $student->id,
            'exam_id' => $exam->id,
            'status' => 'evaluated',
        ]);

        $showResponse = $this->getJson('/api/submissions/' . $submissionId);

        $showResponse->assertOk()
            ->assertJsonPath('data.id', $submissionId)
            ->assertJsonPath('data.answers.0.submitted_answer', 'a');
    }

    public function test_users_cannot_view_other_users_results(): void
    {
        $studentRole = Role::where('name', 'student')->first();
        $adminRole = Role::where('name', 'admin')->first();

        $studentA = User::factory()->create(['role_id' => $studentRole->id, 'is_active' => true]);
        $studentB = User::factory()->create(['role_id' => $studentRole->id, 'is_active' => true]);
        $exam = Exam::factory()->create();

        Submission::create([
            'user_id' => $studentB->id,
            'exam_id' => $exam->id,
            'payload_hash' => hash('sha256', 'sample'),
            'answers_payload' => [],
            'scoring_rules' => [],
            'total_questions' => 0,
            'total_marks' => 0,
            'score' => 0,
            'percentage' => 0,
            'status' => 'evaluated',
            'evaluated_at' => now(),
        ]);

        Sanctum::actingAs($studentA);

        $this->getJson('/api/users/' . $studentB->id . '/results')->assertForbidden();
    }

    public function test_admin_can_view_exam_results_aggregate(): void
    {
        $studentRole = Role::where('name', 'student')->first();
        $adminRole = Role::where('name', 'admin')->first();

        $admin = User::factory()->create(['role_id' => $adminRole->id, 'is_active' => true]);
        $student = User::factory()->create(['role_id' => $studentRole->id, 'is_active' => true]);
        $exam = Exam::factory()->create();

        Submission::create([
            'user_id' => $student->id,
            'exam_id' => $exam->id,
            'payload_hash' => hash('sha256', 'sample-admin'),
            'answers_payload' => [],
            'scoring_rules' => [],
            'total_questions' => 0,
            'total_marks' => 0,
            'score' => 7,
            'percentage' => 70,
            'status' => 'evaluated',
            'evaluated_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/exams/' . $exam->id . '/results')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.submission_count', 1);
    }
}