<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('results', function (Blueprint $table) {
            if (! Schema::hasColumn('results', 'grade')) {
                $table->string('grade', 10)->nullable()->after('total_marks');
            }

            if (! Schema::hasColumn('results', 'feedback')) {
                $table->text('feedback')->nullable()->after('grade');
            }

            if (! Schema::hasColumn('results', 'is_published')) {
                $table->boolean('is_published')->default(false)->after('feedback');
            }

            if (! Schema::hasColumn('results', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('is_published');
            }
        });
    }

    public function down(): void
    {
        Schema::table('results', function (Blueprint $table) {
            foreach (['published_at', 'is_published', 'feedback', 'grade'] as $column) {
                if (Schema::hasColumn('results', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
