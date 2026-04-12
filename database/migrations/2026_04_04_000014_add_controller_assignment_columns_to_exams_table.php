<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'teacher_id')) {
                $table->foreignId('teacher_id')->nullable()->after('title')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('exams', 'controller_id')) {
                $table->foreignId('controller_id')->nullable()->after('teacher_id')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('exams', 'question_setter_id')) {
                $table->foreignId('question_setter_id')->nullable()->after('controller_id')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('exams', 'moderator_id')) {
                $table->foreignId('moderator_id')->nullable()->after('question_setter_id')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('exams', 'invigilator_id')) {
                $table->foreignId('invigilator_id')->nullable()->after('moderator_id')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (Schema::hasColumn('exams', 'invigilator_id')) {
                $table->dropForeign(['invigilator_id']);
                $table->dropColumn('invigilator_id');
            }

            if (Schema::hasColumn('exams', 'moderator_id')) {
                $table->dropForeign(['moderator_id']);
                $table->dropColumn('moderator_id');
            }

            if (Schema::hasColumn('exams', 'question_setter_id')) {
                $table->dropForeign(['question_setter_id']);
                $table->dropColumn('question_setter_id');
            }

            if (Schema::hasColumn('exams', 'controller_id')) {
                $table->dropForeign(['controller_id']);
                $table->dropColumn('controller_id');
            }

            if (Schema::hasColumn('exams', 'teacher_id')) {
                $table->dropForeign(['teacher_id']);
                $table->dropColumn('teacher_id');
            }
        });
    }
};
