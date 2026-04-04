<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('exam_roles')) {
            Schema::create('exam_roles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('role', 50);
                $table->timestamps();

                $table->unique(['exam_id', 'user_id', 'role']);
            });
        }

        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'paper_status')) {
                $table->string('paper_status', 20)->default('submitted')->after('end_time');
            }

            if (! Schema::hasColumn('exams', 'instructions')) {
                $table->text('instructions')->nullable()->after('paper_status');
            }
        });

        if (! Schema::hasTable('exam_reviews')) {
            Schema::create('exam_reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
                $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
                $table->string('from_status', 20);
                $table->string('to_status', 20);
                $table->text('comments');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('exam_incident_reports')) {
            Schema::create('exam_incident_reports', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
                $table->foreignId('invigilator_id')->constrained('users')->cascadeOnDelete();
                $table->text('message');
                $table->string('severity', 20)->default('medium');
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('exam_roles')) {
            $seedRows = DB::table('exams')
                ->select(['id', 'controller_id', 'question_setter_id', 'moderator_id', 'invigilator_id'])
                ->get();

            foreach ($seedRows as $row) {
                $mappings = [
                    'controller' => $row->controller_id,
                    'question_setter' => $row->question_setter_id,
                    'moderator' => $row->moderator_id,
                    'invigilator' => $row->invigilator_id,
                ];

                foreach ($mappings as $role => $userId) {
                    if (! $userId) {
                        continue;
                    }

                    DB::table('exam_roles')->updateOrInsert(
                        [
                            'exam_id' => $row->id,
                            'user_id' => $userId,
                            'role' => $role,
                        ],
                        [
                            'created_at' => now(),
                            'updated_at' => now(),
                        ],
                    );
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('exam_incident_reports')) {
            Schema::drop('exam_incident_reports');
        }

        if (Schema::hasTable('exam_reviews')) {
            Schema::drop('exam_reviews');
        }

        Schema::table('exams', function (Blueprint $table) {
            if (Schema::hasColumn('exams', 'instructions')) {
                $table->dropColumn('instructions');
            }
            if (Schema::hasColumn('exams', 'paper_status')) {
                $table->dropColumn('paper_status');
            }
        });

        if (Schema::hasTable('exam_roles')) {
            Schema::drop('exam_roles');
        }
    }
};
