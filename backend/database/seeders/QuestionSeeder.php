<?php

namespace Database\Seeders;

use App\Models\Question;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['easy' => 10, 'medium' => 10, 'hard' => 10] as $difficulty => $count) {
            Question::factory()
                ->count($count)
                ->create([
                    'difficulty' => $difficulty,
                    'exam_id' => null,
                ]);
        }
    }
}