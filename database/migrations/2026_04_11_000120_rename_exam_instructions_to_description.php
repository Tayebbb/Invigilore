<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('exams')) {
            return;
        }

        $hasInstructions = Schema::hasColumn('exams', 'instructions');
        $hasDescription = Schema::hasColumn('exams', 'description');

        if ($hasInstructions && ! $hasDescription) {
            DB::statement('ALTER TABLE exams CHANGE instructions description TEXT NULL');

            return;
        }

        if ($hasInstructions && $hasDescription) {
            DB::statement('UPDATE exams SET description = instructions WHERE description IS NULL');
            DB::statement('ALTER TABLE exams DROP COLUMN instructions');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('exams')) {
            return;
        }

        $hasInstructions = Schema::hasColumn('exams', 'instructions');
        $hasDescription = Schema::hasColumn('exams', 'description');

        if ($hasDescription && ! $hasInstructions) {
            DB::statement('ALTER TABLE exams CHANGE description instructions TEXT NULL');

            return;
        }

        if ($hasDescription && $hasInstructions) {
            DB::statement('UPDATE exams SET instructions = description WHERE instructions IS NULL');
            DB::statement('ALTER TABLE exams DROP COLUMN description');
        }
    }
};