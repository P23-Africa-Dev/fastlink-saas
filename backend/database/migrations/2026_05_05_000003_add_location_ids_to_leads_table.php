<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Structured location FKs (optional, alongside the existing free-text `country` column)
            $table->foreignId('country_id')->nullable()->after('country')->constrained('countries')->nullOnDelete();
            $table->foreignId('state_id')->nullable()->after('country_id')->constrained('states')->nullOnDelete();
            $table->foreignId('lga_id')->nullable()->after('state_id')->constrained('lgas')->nullOnDelete();

            $table->index('country_id');
            $table->index('state_id');
            $table->index('lga_id');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropForeign(['state_id']);
            $table->dropForeign(['lga_id']);
            $table->dropIndex(['country_id']);
            $table->dropIndex(['state_id']);
            $table->dropIndex(['lga_id']);
            $table->dropColumn(['country_id', 'state_id', 'lga_id']);
        });
    }
};
