<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('subject_id', 20)->nullable()->after('id')->unique();
            $table->string('subject_code', 30)->nullable()->after('name')->unique();
            $table->string('department', 100)->nullable()->after('subject_code');
            $table->unsignedTinyInteger('credit_hours')->nullable()->after('department');
            $table->softDeletes();
        });

        $subjects = DB::table('subjects')->select('id')->orderBy('id')->get();

        foreach ($subjects as $subject) {
            $id = (int) $subject->id;

            DB::table('subjects')
                ->where('id', $id)
                ->update([
                    'subject_id' => sprintf('SUBJ-%06d', $id),
                    'subject_code' => sprintf('SUBJ%03d', $id),
                    'department' => 'General',
                    'credit_hours' => 3,
                ]);
        }

        // Keep columns nullable at schema level to avoid brittle change() calls across DB drivers.
        // API validation enforces required values for all newly created/updated subjects.
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropUnique(['subject_id']);
            $table->dropUnique(['subject_code']);
            $table->dropColumn(['subject_id', 'subject_code', 'department', 'credit_hours']);
        });
    }
};
