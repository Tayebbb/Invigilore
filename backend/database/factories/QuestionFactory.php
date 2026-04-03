<?php

namespace Database\Factories;

use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        $correctAnswer = $this->faker->randomElement(['A', 'B', 'C', 'D']);

        return [
            'exam_id' => null,
            'question_text' => $this->faker->sentence(12) . '?',
            'option_a' => $this->faker->sentence(4),
            'option_b' => $this->faker->sentence(4),
            'option_c' => $this->faker->sentence(4),
            'option_d' => $this->faker->sentence(4),
            'correct_answer' => $correctAnswer,
            'difficulty' => $this->faker->randomElement(['easy', 'medium', 'hard']),
            'topic' => $this->faker->randomElement([
                'Mathematics',
                'Programming',
                'Databases',
                'Networking',
                'Security',
            ]),
            'marks' => $this->faker->numberBetween(1, 5),
        ];
    }
}