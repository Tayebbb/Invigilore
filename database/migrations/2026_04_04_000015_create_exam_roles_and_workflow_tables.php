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
        if (Schema::hasTable('exam_roles')) {
            Schema::drop('exam_roles');
        }
    }
};
