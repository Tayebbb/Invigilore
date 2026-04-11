<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('answers')) {
            return;
        }

        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->cascadeOnDelete();
            $table->unsignedBigInteger('question_id');
            $table->text('answer');
            $table->timestamps();

            $table->index('question_id');
        });

        if (Schema::hasTable('questions')) {
            try {
                Schema::table('answers', function (Blueprint $table) {
                    $table->foreign('question_id')->references('id')->on('questions')->cascadeOnDelete();
                });
            } catch (\Throwable) {
                // Ignore duplicate/unsupported FK state; later migrations may handle it.
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('answers');
    }
};
