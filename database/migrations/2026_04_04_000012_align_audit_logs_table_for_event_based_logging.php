<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('audit_logs')) {
            return;
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('audit_logs', 'event_type')) {
                $table->string('event_type')->nullable()->after('user_id');
            }

            if (! Schema::hasColumn('audit_logs', 'user_agent')) {
                $table->text('user_agent')->nullable()->after('ip_address');
            }

            if (! Schema::hasColumn('audit_logs', 'created_at')) {
                $table->timestamp('created_at')->nullable()->useCurrent()->after('user_agent');
            }
        });

        if (Schema::hasColumn('audit_logs', 'action')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->string('event_type')->nullable()->change();
            });

            \Illuminate\Support\Facades\DB::table('audit_logs')
                ->whereNull('event_type')
                ->update(['event_type' => \Illuminate\Support\Facades\DB::raw('action')]);

            Schema::table('audit_logs', function (Blueprint $table) {
                $table->dropColumn('action');
                $table->string('event_type')->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('audit_logs')) {
            return;
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('audit_logs', 'action')) {
                $table->string('action')->nullable()->after('user_id');
            }
        });

        if (Schema::hasColumn('audit_logs', 'event_type')) {
            \Illuminate\Support\Facades\DB::table('audit_logs')
                ->whereNull('action')
                ->update(['action' => \Illuminate\Support\Facades\DB::raw('event_type')]);

            Schema::table('audit_logs', function (Blueprint $table) {
                $table->dropColumn('event_type');
            });
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            if (Schema::hasColumn('audit_logs', 'user_agent')) {
                $table->dropColumn('user_agent');
            }
        });
    }
};
