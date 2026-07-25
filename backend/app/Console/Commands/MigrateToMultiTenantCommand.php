<?php

namespace App\Console\Commands;

use App\Models\CompanySetting;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use App\Services\OrganizationProvisioner;
use App\Support\OrganizationContext;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

class MigrateToMultiTenantCommand extends Command
{
    protected $signature = 'tenancy:migrate-existing
                            {--org-name=FastLink : Name for the first organization}
                            {--org-slug=fastlink : Slug for the first organization}
                            {--super-admin-email= : Email to mark as super admin (defaults to FASTLINK_ADMIN_EMAIL)}';

    protected $description = 'Idempotently migrate existing single-tenant data into organization #1 (FastLink).';

    public function handle(OrganizationProvisioner $provisioner, OrganizationContext $context): int
    {
        if (! Schema::hasTable('organizations')) {
            $this->error('organizations table missing. Run migrations first.');

            return self::FAILURE;
        }

        $name = (string) $this->option('org-name');
        $slug = (string) $this->option('org-slug');
        $superEmail = $this->option('super-admin-email')
            ?: env('FASTLINK_ADMIN_EMAIL', 'admin@fastlink.test');

        $this->info("Ensuring organization '{$name}' ({$slug})...");

        $organization = Organization::query()->firstOrCreate(
            ['slug' => $slug],
            [
                'name' => $name,
                'status' => 'active',
                'timezone' => config('app.timezone', 'UTC'),
            ]
        );

        $orgId = $organization->id;
        $this->info("Organization id={$orgId}");

        $tenantTables = [
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

        foreach ($tenantTables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'organization_id')) {
                continue;
            }

            $updated = DB::table($table)->whereNull('organization_id')->update(['organization_id' => $orgId]);
            $this->line("  {$table}: backfilled {$updated} rows");
        }

        // Ensure company settings row exists for org
        $context->set($organization);
        $context->bypassScope(false);
        setPermissionsTeamId($orgId);

        CompanySetting::withoutOrganizationScope()->updateOrCreate(
            ['organization_id' => $orgId],
            [
                'company_name' => CompanySetting::withoutOrganizationScope()->where('organization_id', $orgId)->value('company_name') ?? $name,
                'opening_time' => '09:00:00',
                'closing_time' => '18:00:00',
                'working_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                'timezone' => config('app.timezone', 'UTC'),
                'pipeline_privacy' => CompanySetting::defaultPipelinePrivacy(),
            ]
        );

        // If no drives yet for org, seed defaults
        if (DB::table('lead_drives')->where('organization_id', $orgId)->count() === 0) {
            $provisioner->seedWorkflowDefaults($orgId);
            $this->info('Seeded default drives/statuses for organization.');
        }

        // Memberships + remap Spatie roles to team_id
        $users = User::withTrashed()->get();
        $this->info('Attaching ' . $users->count() . ' users to organization...');

        foreach ($users as $user) {
            OrganizationUser::query()->updateOrCreate(
                [
                    'organization_id' => $orgId,
                    'user_id' => $user->id,
                ],
                [
                    'status' => 'active',
                    'joined_at' => $user->created_at ?? now(),
                ]
            );

            if (! $user->current_organization_id) {
                $user->forceFill(['current_organization_id' => $orgId])->save();
            }

            // Remap existing role pivots that have team_id = 0 to this org
            // (requires Spatie teams migration 2026_07_24_100200 to have completed)
            if (Schema::hasColumn('model_has_roles', 'team_id')) {
                DB::table('model_has_roles')
                    ->where('model_type', User::class)
                    ->where('model_id', $user->id)
                    ->where('team_id', 0)
                    ->update(['team_id' => $orgId]);
            }
        }

        if (! Schema::hasColumn('model_has_roles', 'team_id')) {
            $this->warn('model_has_roles.team_id missing — run migrations (enable_spatie_teams) then re-run this command.');
        }

        // Mark super admin
        $super = User::query()->whereRaw('LOWER(TRIM(email)) = ?', [Str::lower(trim($superEmail))])->first();
        if (! $super) {
            $super = User::query()->whereHas('roles', fn ($q) => $q->where('name', 'admin'))->orderBy('id')->first();
        }
        if ($super) {
            $super->forceFill(['is_super_admin' => true, 'current_organization_id' => $orgId])->save();
            setPermissionsTeamId($orgId);
            if (! $super->hasRole('admin')) {
                $super->syncRoles(['admin']);
            }
            $this->info("Marked {$super->email} as super admin.");
        } else {
            $this->warn("No admin user found to mark as super admin.");
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->info('Multi-tenant migration complete.');

        return self::SUCCESS;
    }
}
