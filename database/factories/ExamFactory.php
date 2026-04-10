<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExamFactory extends Factory
{
    protected $model = Exam::class;

    public function definition(): array
    {
        $startTime = now()->addHour();

        return [
            'subject_id' => Subject::factory(),
            'title' => $this->faker->sentence(4),
            'duration' => $this->faker->numberBetween(30, 120),
            'total_marks' => 100,
            'start_time' => $startTime,
            'end_time' => (clone $startTime)->addHours(2),
        ];
    }
}
