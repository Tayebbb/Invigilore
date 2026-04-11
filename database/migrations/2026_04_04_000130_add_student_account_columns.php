<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        // Some production databases drifted from migration history.
        // Add each column independently so reruns stay safe.
        if (! Schema::hasColumn('users', 'profile_picture')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('profile_picture')->nullable()->after('email');
                });
            } catch (QueryException $exception) {
                if (! Schema::hasColumn('users', 'profile_picture')) {
                    throw $exception;
                }
            }
        }

        if (! Schema::hasColumn('users', 'restrict_login_to_one_device')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->boolean('restrict_login_to_one_device')->default(false)->after('profile_picture');
                });
            } catch (QueryException $exception) {
                if (! Schema::hasColumn('users', 'restrict_login_to_one_device')) {
                    throw $exception;
                }
            }
        }

        if (! Schema::hasColumn('users', 'preferences')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->json('preferences')->nullable()->after('restrict_login_to_one_device');
                });
            } catch (QueryException $exception) {
                if (! Schema::hasColumn('users', 'preferences')) {
                    throw $exception;
                }
            }
        }
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
