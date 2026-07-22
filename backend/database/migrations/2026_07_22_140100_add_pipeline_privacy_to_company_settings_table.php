<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->json('pipeline_privacy')->nullable()->after('timezone');
        });

        $defaults = json_encode([
            'enabled' => true,
            'staff_can_create_pipelines' => true,
            'staff_can_create_open_pipelines' => false,
            'default_visibility' => 'open',
            'higher_roles_can_unlock' => true,
        ]);

        DB::table('company_settings')->update(['pipeline_privacy' => $defaults]);
    }

    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn('pipeline_privacy');
        });
    }
};
