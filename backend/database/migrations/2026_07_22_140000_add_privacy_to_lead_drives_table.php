<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_drives', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('is_default')->constrained('users')->nullOnDelete();
            $table->boolean('is_private')->default(false)->after('created_by');
            $table->string('privacy_locked_by_role', 20)->nullable()->after('is_private');
            $table->index(['is_private', 'created_by']);
        });
    }

    public function down(): void
    {
        Schema::table('lead_drives', function (Blueprint $table) {
            $table->dropIndex(['is_private', 'created_by']);
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['is_private', 'privacy_locked_by_role']);
        });
    }
};
