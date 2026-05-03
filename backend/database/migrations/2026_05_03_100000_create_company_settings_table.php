<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name', 255)->nullable();
            $table->time('opening_time')->default('09:00:00');
            $table->time('closing_time')->default('18:00:00');
            // JSON array of lowercase day names: ["monday","tuesday",...]
            $table->json('working_days');
            $table->string('timezone', 100)->default('UTC');
            // Tracks which admin last updated the settings
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Seed the single row on migration — the table is always a singleton.
        DB::table('company_settings')->insert([
            'company_name'  => null,
            'opening_time'  => '09:00:00',
            'closing_time'  => '18:00:00',
            'working_days'  => json_encode(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
            'timezone'      => config('app.timezone', 'UTC'),
            'updated_by'    => null,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
