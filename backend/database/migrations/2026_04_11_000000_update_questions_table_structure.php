<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            // Add JSON options if it doesn't exist
            if (!Schema::hasColumn('questions', 'options')) {
                $table->json('options')->nullable()->after('question_text');
            }

            // Change type to string to be more flexible
            if (Schema::hasColumn('questions', 'type')) {
                $table->string('type')->change();
            } else {
                $table->string('type')->default('mcq')->after('options');
            }

            // Change correct_answer to string to support multiple values and True/False
            if (Schema::hasColumn('questions', 'correct_answer')) {
                $table->string('correct_answer')->nullable()->change();
            }

            // Make old columns nullable if they exist
            if (Schema::hasColumn('questions', 'option_a')) $table->string('option_a')->nullable()->change();
            if (Schema::hasColumn('questions', 'option_b')) $table->string('option_b')->nullable()->change();
            if (Schema::hasColumn('questions', 'option_c')) $table->string('option_c')->nullable()->change();
            if (Schema::hasColumn('questions', 'option_d')) $table->string('option_d')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            // Revert changes if necessary, but usually we keep it flexible
        });
    }
};
