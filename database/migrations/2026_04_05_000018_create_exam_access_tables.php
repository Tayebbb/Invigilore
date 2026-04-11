<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('exam_access')) {
            Schema::create('exam_access', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
                $table->string('channel', 20)->default('web');
                $table->string('access_type', 20)->default('public');
                $table->string('access_token', 128)->nullable();
                $table->boolean('require_email')->default(false);
                $table->timestamps();

                $table->unique('exam_id');
                $table->index('access_token');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('exam_access')) {
            Schema::drop('exam_access');
        }
    }
};
