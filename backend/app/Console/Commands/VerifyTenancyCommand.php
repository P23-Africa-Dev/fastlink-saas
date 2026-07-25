<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VerifyTenancyCommand extends Command
{
    protected $signature = 'tenancy:verify
                            {--org-slug=fastlink : Organization slug to verify}';

    protected $description = 'Verify FastLink (or given org) backfill: organization_id coverage, memberships, and super admin.';

    public function handle(): int
    {
        if (! Schema::hasTable('organizations')) {
            $this->error('organizations table missing. Run migrations first.');

            return self::FAILURE;
        }

        $slug = (string) $this->option('org-slug');
        $org = Organization::query()->where('slug', $slug)->first();

        if (! $org) {
            $this->error("Organization slug '{$slug}' not found. Run: php artisan tenancy:migrate-existing");

            return self::FAILURE;
        }

        $this->info("Organization: id={$org->id} name={$org->name} slug={$org->slug} status={$org->status}");

        $tables = [
            'leads',
            'projects',
            'tasks',
            'lead_drives',
            'lead_statuses',
            'notifications',
            'meetings',
            'attendances',
        ];

        $ok = true;
        $this->line('');
        $this->line('Null organization_id checks (expect 0):');

        foreach ($tables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'organization_id')) {
                continue;
            }

            $nulls = (int) DB::table($table)->whereNull('organization_id')->count();
            $total = (int) DB::table($table)->count();
            $scoped = (int) DB::table($table)->where('organization_id', $org->id)->count();
            $mark = $nulls === 0 ? 'OK' : 'FAIL';
            if ($nulls !== 0) {
                $ok = false;
            }
            $this->line("  [{$mark}] {$table}: null={$nulls} org={$scoped} total={$total}");
        }

        $members = (int) DB::table('organization_user')->where('organization_id', $org->id)->count();
        $users = (int) User::withTrashed()->count();
        $this->line('');
        $this->line("Memberships: {$members} for org (users including trashed: {$users})");

        $supers = User::query()->where('is_super_admin', true)->get(['id', 'email', 'current_organization_id']);
        if ($supers->isEmpty()) {
            $this->error('No super admin found (users.is_super_admin = 1).');
            $ok = false;
        } else {
            $this->info('Super admin(s):');
            foreach ($supers as $super) {
                $this->line("  - {$super->email} (id={$super->id}, current_org={$super->current_organization_id})");
            }
        }

        if (Schema::hasColumn('model_has_roles', 'team_id')) {
            $team0 = (int) DB::table('model_has_roles')->where('team_id', 0)->count();
            $teamOrg = (int) DB::table('model_has_roles')->where('team_id', $org->id)->count();
            $this->line("Spatie roles: team_id=0 leftover={$team0}, team_id={$org->id}={$teamOrg}");
            if ($team0 > 0) {
                $this->warn('Some role pivots still have team_id=0. Re-run: php artisan tenancy:migrate-existing');
                $ok = false;
            }
        } else {
            $this->error('model_has_roles.team_id missing — Spatie teams migration not applied.');
            $ok = false;
        }

        $this->line('');
        if ($ok) {
            $this->info('Tenancy verification PASSED. Log in as a super admin and open /platform.');

            return self::SUCCESS;
        }

        $this->error('Tenancy verification FAILED. Fix the items above, then re-run.');

        return self::FAILURE;
    }
}
