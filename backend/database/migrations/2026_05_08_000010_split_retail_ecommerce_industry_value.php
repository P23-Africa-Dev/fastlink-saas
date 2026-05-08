<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('leads')
            ->where('industry', 'Retail / E-commerce')
            ->update(['industry' => 'Retail']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('leads')
            ->where('industry', 'Retail')
            ->update(['industry' => 'Retail / E-commerce']);
    }
};
