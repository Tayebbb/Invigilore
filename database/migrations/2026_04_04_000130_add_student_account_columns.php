<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'profile_picture')) {
                $table->string('profile_picture')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'restrict_login_to_one_device')) {
                $table->boolean('restrict_login_to_one_device')->default(false)->after('profile_picture');
            }

            if (! Schema::hasColumn('users', 'preferences')) {
                $table->json('preferences')->nullable()->after('restrict_login_to_one_device');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['preferences', 'restrict_login_to_one_device', 'profile_picture'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
