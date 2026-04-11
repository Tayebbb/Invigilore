<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'signup_verification_code')) {
                $table->string('signup_verification_code')->nullable()->after('password');
            }

            if (! Schema::hasColumn('users', 'signup_verification_code_expires_at')) {
                $table->timestamp('signup_verification_code_expires_at')->nullable()->after('signup_verification_code');
            }
        });

        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'signup_verification_code')) {
                $table->dropColumn('signup_verification_code');
            }

            if (Schema::hasColumn('users', 'signup_verification_code_expires_at')) {
                $table->dropColumn('signup_verification_code_expires_at');
            }

            if (Schema::hasColumn('users', 'email_verified_at')) {
                $table->dropColumn('email_verified_at');
            }
        });
    }
};
