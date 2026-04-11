<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Exam;
use App\Models\Subject;
use App\Models\ExamAttempt;
use App\Models\AttemptAnswer;
use App\Models\Question;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_smoke_test_sequence()
    {
        // Create roles
        $studentRole = Role::query()->firstOrCreate(['name' => 'student']);

        // Create student user
        $student = User::factory()->create([
            'role_id' => $studentRole->id,
        ]);

        // Create subject and exam
        $subject = Subject::factory()->create();
        $exam = Exam::factory()->create(['subject_id' => $subject->id]);

        // Create questions for exam
        $question = Question::factory()->create([
            'exam_id' => $exam->id,
            'correct_answer' => 'A',
            'marks' => 5,
        ]);

        // Create exam attempt
        $attempt = ExamAttempt::create([
            'exam_id' => $exam->id,
            'user_id' => $student->id,
            'start_time' => now()->subMinutes(15),
            'started_at' => now()->subMinutes(15),
            'end_time' => now(),
            'submitted_at' => now(),
            'duration' => 30,
            'status' => 'submitted',
        ]);

        // Create attempt answer (correct answer)
        AttemptAnswer::create([
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_answer' => 'A',
            'is_correct' => true,
        ]);

        // Test 1: Login
        echo "\n\n";
        echo str_repeat("=", 80) . PHP_EOL;
        echo "TEST 1: LOGIN (POST /api/login)" . PHP_EOL;
        echo str_repeat("=", 80) . PHP_EOL;
        
        echo "\nEXPECTED REQUEST:" . PHP_EOL;
        echo json_encode([
            'email' => 'student@example.com',
            'password' => 'password'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        
        $loginResp = $this->postJson('/api/login', [
            'email' => $student->email,
            'password' => 'password'
        ]);
        
        echo "\nEXPECTED RESPONSE STRUCTURE:" . PHP_EOL;
        echo '{
  "data": {
    "user": { "id": <int>, "email": <string>, ... },
    "token": <string>
  }
}' . PHP_EOL;
        
        echo "\nACTUAL RESPONSE (HTTP " . $loginResp->status() . "):" . PHP_EOL;
        echo json_encode($loginResp->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        
        $this->assertEquals(200, $loginResp->status());
        $this->assertArrayHasKey('token', $loginResp->json());
        $token = $loginResp->json()['token'];
        echo "\n✓ Authentication successful - Token: " . substr($token, 0, 20) . "..." . PHP_EOL;

        // Test 2: Get Attempts
        echo "\n\n";
        echo str_repeat("=", 80) . PHP_EOL;
        echo "TEST 2: GET STUDENT ATTEMPTS (GET /api/student/attempts)" . PHP_EOL;
        echo str_repeat("=", 80) . PHP_EOL;
        
        Sanctum::actingAs($student);
        
        echo "\nEXPECTED REQUEST:" . PHP_EOL;
        echo "Authorization: Bearer <token>" . PHP_EOL;
        
        echo "\nEXPECTED RESPONSE STRUCTURE:" . PHP_EOL;
        echo '{
  "data": [
    {
      "attempt_id": <int>,
      "exam_id": <int>,
      "start_time": "2026-04-04T...",
      "end_time": "2026-04-04T...",
      "status": "submitted"
    }
  ]
}' . PHP_EOL;
        
        $attemptsResp = $this->getJson('/api/student/attempts');
        echo "\nACTUAL RESPONSE (HTTP " . $attemptsResp->status() . "):" . PHP_EOL;
        echo json_encode($attemptsResp->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        
        $this->assertEquals(200, $attemptsResp->status());
        $this->assertIsArray($attemptsResp['data']);
        $attemptCount = count($attemptsResp['data']);
        echo "\n✓ Attempts retrieved: $attemptCount attempt(s)" . PHP_EOL;

        // Test 3: Get Attempt Detail
        if (!empty($attemptsResp['data'])) {
            echo "\n\n";
            echo str_repeat("=", 80) . PHP_EOL;
            echo "TEST 3: GET ATTEMPT DETAIL (GET /api/student/attempts/{id})" . PHP_EOL;
            echo str_repeat("=", 80) . PHP_EOL;
            
            $attemptId = $attemptsResp['data'][0]['attempt_id'];
            
            echo "\nEXPECTED REQUEST:" . PHP_EOL;
            echo "GET /api/student/attempts/$attemptId" . PHP_EOL;
            echo "Authorization: Bearer <token>" . PHP_EOL;
            
            echo "\nEXPECTED RESPONSE STRUCTURE:" . PHP_EOL;
            echo '{
  "data": {
    "attempt_id": <int>,
    "exam_id": <int>,
    "total_questions": <int>,
    "total_marks": <int>,
    "obtained_marks": <int>,
    "percentage": <float>
  }
}' . PHP_EOL;
            
            $detailResp = $this->getJson("/api/student/attempts/{$attemptId}");
            echo "\nACTUAL RESPONSE (HTTP " . $detailResp->status() . "):" . PHP_EOL;
            echo json_encode($detailResp->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
            
            $this->assertEquals(200, $detailResp->status());
            $this->assertArrayHasKey('attempt_id', $detailResp['data']);
            $this->assertArrayHasKey('percentage', $detailResp['data']);
            $percentage = $detailResp['data']['percentage'];
            echo "\n✓ Attempt detail retrieved with score: $percentage%" . PHP_EOL;
        }

        // Test 4: Get Summary
        echo "\n\n";
        echo str_repeat("=", 80) . PHP_EOL;
        echo "TEST 4: GET RESULTS SUMMARY (GET /api/student/results/summary)" . PHP_EOL;
        echo str_repeat("=", 80) . PHP_EOL;
        
        echo "\nEXPECTED REQUEST:" . PHP_EOL;
        echo "GET /api/student/results/summary" . PHP_EOL;
        echo "Authorization: Bearer <token>" . PHP_EOL;
        
        echo "\nEXPECTED RESPONSE STRUCTURE:" . PHP_EOL;
        echo '{
  "data": {
    "total_attempts": <int>,
    "completed_attempts": <int>,
    "average_score": <float>,
    "highest_score": <float>,
    "lowest_score": <float>
  }
}' . PHP_EOL;
        
        $summaryResp = $this->getJson('/api/student/results/summary');
        echo "\nACTUAL RESPONSE (HTTP " . $summaryResp->status() . "):" . PHP_EOL;
        echo json_encode($summaryResp->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        
        $this->assertEquals(200, $summaryResp->status());
        $this->assertArrayHasKey('total_attempts', $summaryResp['data']);
        $this->assertArrayHasKey('average_score', $summaryResp['data']);
        $totalAttempts = $summaryResp['data']['total_attempts'];
        $avgScore = $summaryResp['data']['average_score'];
        echo "\n✓ Summary stats retrieved: $totalAttempts total attempts, average: " . $avgScore . "%" . PHP_EOL;

        echo "\n\n";
        echo str_repeat("=", 80) . PHP_EOL;
        echo "✓ SMOKE TEST COMPLETE - ALL ENDPOINTS PASSED" . PHP_EOL;
        echo str_repeat("=", 80) . PHP_EOL;
    }
}
?>
