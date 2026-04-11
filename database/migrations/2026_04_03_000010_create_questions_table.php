<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('questions')) {
            return;
        }

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->nullable()->constrained('exams')->nullOnDelete();
            $table->text('question_text');
            $table->string('option_a');
            $table->string('option_b');
            $table->string('option_c');
            $table->string('option_d');
            $table->enum('correct_answer', ['A', 'B', 'C', 'D']);
            $table->enum('difficulty', ['easy', 'medium', 'hard']);
            $table->string('topic')->nullable();
            $table->unsignedInteger('marks')->default(1);
            $table->timestamps();

            $table->index('exam_id');
            $table->index('difficulty');
            $table->index('topic');
        });

        if (Schema::hasTable('answers')) {
            try {
                Schema::table('answers', function (Blueprint $table) {
                    $table->foreign('question_id')->references('id')->on('questions')->cascadeOnDelete();
                });
            } catch (\Throwable) {
                // Ignore duplicate/unsupported FK state.
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};