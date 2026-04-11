<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'paper_status')) {
                $table->string('paper_status', 20)->default('submitted')->after('end_time');
            }

            if (! Schema::hasColumn('exams', 'description')) {
                $table->text('description')->nullable()->after('paper_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (Schema::hasColumn('exams', 'description')) {
                $table->dropColumn('description');
            }

            if (Schema::hasColumn('exams', 'paper_status')) {
                $table->dropColumn('paper_status');
            }
        });
    }
};
