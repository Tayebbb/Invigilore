<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->enum('status', ['draft', 'submitted', 'reviewed', 'approved'])->default('submitted')->after('marks');
            $table->text('review_comment')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->dropColumn('review_comment');
        });
    }
};
