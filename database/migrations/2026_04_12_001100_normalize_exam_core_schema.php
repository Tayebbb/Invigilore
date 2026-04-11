<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->normalizeExams();
        $this->normalizeQuestions();
        $this->normalizeAttempts();
        $this->normalizeAnswers();
        $this->normalizeResults();
    }

    public function down(): void
    {
        if (Schema::hasTable('results')) {
            Schema::table('results', function (Blueprint $table) {
                if (Schema::hasColumn('results', 'evaluated_at')) {
                    $table->dropColumn('evaluated_at');
                }
            });
        }

        if (Schema::hasTable('attempt_answers')) {
            Schema::table('attempt_answers', function (Blueprint $table) {
                if (Schema::hasColumn('attempt_answers', 'answer_text')) {
                    $table->dropColumn('answer_text');
                }
                if (Schema::hasColumn('attempt_answers', 'selected_option')) {
                    $table->dropColumn('selected_option');
                }
            });
        }

        if (Schema::hasTable('questions')) {
            Schema::table('questions', function (Blueprint $table) {
                if (Schema::hasColumn('questions', 'type')) {
                    $table->string('type')->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('exams')) {
            Schema::table('exams', function (Blueprint $table) {
                if (Schema::hasColumn('exams', 'created_by')) {
                    $table->dropForeign(['created_by']);
                    $table->dropColumn('created_by');
                }
                if (Schema::hasColumn('exams', 'status')) {
                    $table->dropColumn('status');
                }
            });
        }
    }

    private function normalizeExams(): void
    {
        if (! Schema::hasTable('exams')) {
            return;
        }

        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'status')) {
                $table->string('status', 32)->default('draft')->after('duration');
            }

            if (! Schema::hasColumn('exams', 'created_by')) {
                $table->foreignId('created_by')
                    ->nullable()
                    ->after('status')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });

        if (Schema::hasColumn('exams', 'exam_status')) {
            DB::table('exams')->whereNull('status')->orWhere('status', '')->update([
                'status' => DB::raw("COALESCE(NULLIF(exam_status, ''), 'draft')"),
            ]);

            DB::table('exams')->where('status', 'draft')->whereNotNull('exam_status')->update([
                'status' => DB::raw("COALESCE(NULLIF(exam_status, ''), 'draft')"),
            ]);
        }

        if (Schema::hasColumn('exams', 'teacher_id')) {
            DB::table('exams')->whereNull('created_by')->update([
                'created_by' => DB::raw('teacher_id'),
            ]);
        }

        if (Schema::hasColumn('exams', 'controller_id')) {
            DB::table('exams')->whereNull('created_by')->update([
                'created_by' => DB::raw('controller_id'),
            ]);
        }

        Schema::table('exams', function (Blueprint $table) {
            $table->index('status', 'exams_status_idx');
            $table->index(['start_time', 'end_time'], 'exams_time_window_idx');
            $table->index('created_by', 'exams_created_by_idx');
        });
    }

    private function normalizeQuestions(): void
    {
        if (! Schema::hasTable('questions')) {
            return;
        }

        if (Schema::hasColumn('questions', 'exam_id')) {
            DB::table('questions')->whereNull('exam_id')->delete();
        }

        DB::table('questions')
            ->where('type', '!=', 'descriptive')
            ->update(['type' => 'mcq']);

        Schema::table('questions', function (Blueprint $table) {
            if (Schema::hasColumn('questions', 'exam_id')) {
                $table->foreignId('exam_id')->nullable(false)->change();
            }

            if (Schema::hasColumn('questions', 'type')) {
                $table->enum('type', ['mcq', 'descriptive'])->default('mcq')->change();
            }

            $table->index(['exam_id', 'type'], 'questions_exam_type_idx');
            $table->index('marks', 'questions_marks_idx');
        });
    }

    private function normalizeAttempts(): void
    {
        if (! Schema::hasTable('exam_attempts')) {
            return;
        }

        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->index(['exam_id', 'user_id'], 'exam_attempts_exam_user_idx');
            $table->index('status', 'exam_attempts_status_idx');
            $table->index(['start_time', 'end_time'], 'exam_attempts_time_idx');
        });

        $duplicateAttempts = DB::table('exam_attempts')
            ->select('exam_id', 'user_id', DB::raw('COUNT(*) as c'))
            ->groupBy('exam_id', 'user_id')
            ->having('c', '>', 1)
            ->exists();

        if (! $duplicateAttempts) {
            Schema::table('exam_attempts', function (Blueprint $table) {
                $table->unique(['exam_id', 'user_id'], 'exam_attempts_exam_user_unique');
            });
        }
    }

    private function normalizeAnswers(): void
    {
        if (! Schema::hasTable('attempt_answers')) {
            return;
        }

        Schema::table('attempt_answers', function (Blueprint $table) {
            if (! Schema::hasColumn('attempt_answers', 'selected_option')) {
                $table->string('selected_option')->nullable()->after('question_id');
            }

            if (! Schema::hasColumn('attempt_answers', 'answer_text')) {
                $table->text('answer_text')->nullable()->after('selected_option');
            }
        });

        if (Schema::hasColumn('attempt_answers', 'selected_answer')) {
            DB::table('attempt_answers')->whereNull('selected_option')->update([
                'selected_option' => DB::raw('selected_answer'),
            ]);

            Schema::table('attempt_answers', function (Blueprint $table) {
                $table->dropColumn('selected_answer');
            });
        }

        Schema::table('attempt_answers', function (Blueprint $table) {
            $table->index(['attempt_id', 'question_id'], 'attempt_answers_attempt_question_idx');
        });
    }

    private function normalizeResults(): void
    {
        if (! Schema::hasTable('results')) {
            return;
        }

        Schema::table('results', function (Blueprint $table) {
            if (! Schema::hasColumn('results', 'evaluated_at')) {
                $table->timestamp('evaluated_at')->nullable()->after('total_marks');
            }
        });

        DB::table('results')->whereNull('evaluated_at')->update([
            'evaluated_at' => DB::raw('created_at'),
        ]);

        Schema::table('results', function (Blueprint $table) {
            $table->index('evaluated_at', 'results_evaluated_at_idx');
            $table->index('attempt_id', 'results_attempt_id_idx');
        });

        $duplicateResults = DB::table('results')
            ->select('attempt_id', DB::raw('COUNT(*) as c'))
            ->groupBy('attempt_id')
            ->having('c', '>', 1)
            ->exists();

        if (! $duplicateResults) {
            Schema::table('results', function (Blueprint $table) {
                $table->unique('attempt_id', 'results_attempt_unique');
            });
        }
    }
};
