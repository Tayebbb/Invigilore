<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('exam_attempts')) {
            Schema::create('exam_attempts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
                $table->timestamp('start_time');
                $table->timestamp('end_time')->nullable();
                $table->unsignedInteger('duration');
                $table->enum('status', ['in_progress', 'submitted', 'timeout'])->default('in_progress');
                $table->timestamps();
            });
        } else {
            Schema::table('exam_attempts', function (Blueprint $table) {
                if (! Schema::hasColumn('exam_attempts', 'start_time')) {
                    $table->timestamp('start_time')->nullable()->after('exam_id');
                }

                if (! Schema::hasColumn('exam_attempts', 'end_time')) {
                    $table->timestamp('end_time')->nullable()->after('start_time');
                }

                if (! Schema::hasColumn('exam_attempts', 'duration')) {
                    $table->unsignedInteger('duration')->default(0)->after('end_time');
                }

                if (! Schema::hasColumn('exam_attempts', 'status')) {
                    $table->enum('status', ['in_progress', 'submitted', 'timeout'])
                        ->default('in_progress')
                        ->after('duration');
                }
            });
        }

        if (! Schema::hasTable('attempt_answers')) {
            Schema::create('attempt_answers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('attempt_id')->constrained('exam_attempts')->cascadeOnDelete();
                $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
                $table->string('selected_answer');
                $table->boolean('is_correct')->nullable();
                $table->timestamps();

                $table->unique(['attempt_id', 'question_id']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('attempt_answers')) {
            Schema::dropIfExists('attempt_answers');
        }

        if (Schema::hasTable('exam_attempts')) {
            Schema::table('exam_attempts', function (Blueprint $table) {
                if (Schema::hasColumn('exam_attempts', 'status')) {
                    $table->dropColumn('status');
                }

                if (Schema::hasColumn('exam_attempts', 'duration')) {
                    $table->dropColumn('duration');
                }

                if (Schema::hasColumn('exam_attempts', 'end_time')) {
                    $table->dropColumn('end_time');
                }

                if (Schema::hasColumn('exam_attempts', 'start_time')) {
                    $table->dropColumn('start_time');
                }
            });
        }
    }
};
