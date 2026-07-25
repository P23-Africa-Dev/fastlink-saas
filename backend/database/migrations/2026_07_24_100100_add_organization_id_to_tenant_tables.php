<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tenant-owned tables that get organization_id.
     * Added nullable first; backfill migration/command will enforce NOT NULL.
     *
     * @var list<string>
     */
    private array $tables = [
        'company_settings',
        'lead_drives',
        'lead_statuses',
        'leads',
        'lead_activities',
        'lead_followups',
        'lead_followup_update_requests',
        'lead_followup_activities',
        'lead_followup_attachments',
        'projects',
        'project_tags',
        'tasks',
        'subtasks',
        'task_comments',
        'attendances',
        'leave_requests',
        'spreadsheets',
        'meetings',
        'meeting_attendees',
        'meeting_reminders',
        'notifications',
        'activity_logs',
        'supervisor_passcodes',
        'supervisor_access_tokens',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            if (Schema::hasColumn($tableName, 'organization_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('organization_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('organizations')
                    ->cascadeOnDelete();
                $table->index('organization_id');
            });
        }

        // Composite uniqueness: drop global unique, add (organization_id, slug|name)
        if (Schema::hasTable('lead_drives')) {
            Schema::table('lead_drives', function (Blueprint $table) {
                $table->dropUnique(['slug']);
                $table->unique(['organization_id', 'slug']);
            });
        }

        if (Schema::hasTable('lead_statuses')) {
            Schema::table('lead_statuses', function (Blueprint $table) {
                $table->dropUnique(['slug']);
                $table->unique(['organization_id', 'slug']);
            });
        }

        if (Schema::hasTable('project_tags')) {
            Schema::table('project_tags', function (Blueprint $table) {
                $table->dropUnique(['name']);
                $table->unique(['organization_id', 'name']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('lead_drives') && Schema::hasColumn('lead_drives', 'organization_id')) {
            Schema::table('lead_drives', function (Blueprint $table) {
                $table->dropUnique(['organization_id', 'slug']);
                $table->unique('slug');
            });
        }

        if (Schema::hasTable('lead_statuses') && Schema::hasColumn('lead_statuses', 'organization_id')) {
            Schema::table('lead_statuses', function (Blueprint $table) {
                $table->dropUnique(['organization_id', 'slug']);
                $table->unique('slug');
            });
        }

        if (Schema::hasTable('project_tags') && Schema::hasColumn('project_tags', 'organization_id')) {
            Schema::table('project_tags', function (Blueprint $table) {
                $table->dropUnique(['organization_id', 'name']);
                $table->unique('name');
            });
        }

        foreach (array_reverse($this->tables) as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'organization_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('organization_id');
            });
        }
    }
};
