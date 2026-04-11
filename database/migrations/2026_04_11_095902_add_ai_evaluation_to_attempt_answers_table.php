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
        Schema::table('attempt_answers', function (Blueprint $table) {
            $table->decimal('score_awarded', 8, 2)->default(0)->after('is_correct');
            $table->text('feedback')->nullable()->after('score_awarded');
            $table->boolean('is_ai_evaluated')->default(false)->after('feedback');
        });
    }

    public function down(): void
    {
        Schema::table('attempt_answers', function (Blueprint $table) {
            $table->dropColumn(['score_awarded', 'feedback', 'is_ai_evaluated']);
        });
    }
};
