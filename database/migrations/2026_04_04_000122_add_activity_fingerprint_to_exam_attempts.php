<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            if (! Schema::hasColumn('exam_attempts', 'last_ip')) {
                $table->string('last_ip', 45)->nullable()->after('status');
            }

            if (! Schema::hasColumn('exam_attempts', 'last_user_agent')) {
                $table->text('last_user_agent')->nullable()->after('last_ip');
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            foreach (['last_user_agent', 'last_ip'] as $column) {
                if (Schema::hasColumn('exam_attempts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
