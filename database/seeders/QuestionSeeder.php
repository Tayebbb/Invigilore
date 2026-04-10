<?php

namespace Database\Seeders;

use App\Models\Question;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    public function run(): void
    {
        // Create a subject and an exam for seeding questions
        $subject = \App\Models\Subject::factory()->create();
        $exam = \App\Models\Exam::factory()->create(['subject_id' => $subject->id]);

        foreach (['easy' => 10, 'medium' => 10, 'hard' => 10] as $difficulty => $count) {
            Question::factory()
                ->count($count)
                ->create([
                    'difficulty' => $difficulty,
                    'exam_id' => $exam->id,
                ]);
        }
    }
}