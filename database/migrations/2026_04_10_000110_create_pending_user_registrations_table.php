<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pending_user_registrations')) {
            return;
        }

        Schema::create('pending_user_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('name');
            $table->string('password_hash');
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->string('verification_code_hash');
            $table->timestamp('verification_code_expires_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_user_registrations');
    }
};
