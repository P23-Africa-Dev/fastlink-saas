<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->char('code', 3)->unique();   // ISO 3166-1 alpha-2 or alpha-3
            $table->timestamps();

            $table->index('name');
        });

        Schema::create('states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->cascadeOnDelete();
            $table->string('name', 100);
            $table->timestamps();

            $table->index(['country_id', 'name']);
        });

        Schema::create('lgas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('state_id')->constrained('states')->cascadeOnDelete();
            $table->string('name', 100);
            $table->timestamps();

            $table->index(['state_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lgas');
        Schema::dropIfExists('states');
        Schema::dropIfExists('countries');
    }
};
