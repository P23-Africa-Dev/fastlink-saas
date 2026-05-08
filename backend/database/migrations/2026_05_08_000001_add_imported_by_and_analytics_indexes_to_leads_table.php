<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('imported_by')
                ->nullable()
                ->after('created_by')
                ->constrained('users')
                ->nullOnDelete();

            $table->index('created_at', 'leads_created_at_idx');
            $table->index(['created_by', 'created_at'], 'leads_created_by_created_at_idx');
            $table->index(['imported_by', 'created_at'], 'leads_imported_by_created_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex('leads_created_at_idx');
            $table->dropIndex('leads_created_by_created_at_idx');
            $table->dropIndex('leads_imported_by_created_at_idx');
            $table->dropForeign(['imported_by']);
            $table->dropColumn('imported_by');
        });
    }
};
