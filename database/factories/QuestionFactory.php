<?php

namespace Database\Factories;

use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        $options = [
            'A' => $this->faker->sentence(4),
            'B' => $this->faker->sentence(4),
            'C' => $this->faker->sentence(4),
            'D' => $this->faker->sentence(4),
        ];

        return [
            'exam_id' => null,
            'question_text' => $this->faker->sentence(12) . '?',
            'type' => 'mcq',
            'options' => $options,
            'correct_answer' => $this->faker->randomElement(array_keys($options)),
            'marks' => $this->faker->numberBetween(1, 5),
        ];
    }
}