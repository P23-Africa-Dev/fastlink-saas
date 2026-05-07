<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\LeadDrive;
use App\Models\LeadStatus;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Throwable;

class ImportLeadsMigration extends Command
{
    protected $signature = 'crm:import-leads
                            {file : Path to the JSON migration file}
                            {--dry-run : Preview what would be imported without writing to the DB}
                            {--skip-users : Do not create missing users; leave assigned_to/created_by as null}
                            {--force : Update existing leads instead of skipping them}';

    protected $description = 'Import a FastLink CRM leads migration JSON export into the local database.';

    /** @var array<int, int> source_status_id → local_id */
    private array $statusMap = [];

    /** @var array<int, int> source_drive_id → local_id */
    private array $driveMap = [];

    /** @var array<int, int> source_user_id → local_id */
    private array $userMap = [];

    private bool $dryRun  = false;
    private bool $force   = false;
    private bool $skipUsers = false;

    private int $leadsCreated   = 0;
    private int $leadsUpdated   = 0;
    private int $leadsSkipped   = 0;
    private int $activitiesCreated = 0;
    private int $usersCreated   = 0;

    public function handle(): int
    {
        $this->dryRun   = (bool) $this->option('dry-run');
        $this->force    = (bool) $this->option('force');
        $this->skipUsers = (bool) $this->option('skip-users');

        $path = $this->argument('file');
        if (!file_exists($path)) {
            // Try relative to cwd
            $path = getcwd() . '/' . ltrim($path, '/\\');
        }

        if (!file_exists($path)) {
            $this->error("File not found: {$path}");
            return self::FAILURE;
        }

        $this->info("Reading {$path} ...");
        $raw = file_get_contents($path);
        $data = json_decode($raw, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error('Invalid JSON: ' . json_last_error_msg());
            return self::FAILURE;
        }

        $schemaVersion = $data['schema_version'] ?? 'unknown';
        if (!str_starts_with($schemaVersion, 'crm-leads-migration')) {
            $this->warn("Unexpected schema_version: {$schemaVersion} — proceeding anyway.");
        }

        $this->info("Schema: {$schemaVersion} | Exported: " . ($data['exported_at'] ?? '?'));
        $this->info("Leads: " . ($data['metadata']['lead_count'] ?? '?') . ' | Activities: ' . ($data['metadata']['activity_count'] ?? '?'));

        if ($this->dryRun) {
            $this->warn('DRY RUN — no changes will be written.');
        }

        try {
            DB::beginTransaction();

            $this->importStatuses($data['mappings']['statuses'] ?? []);
            $this->importDrives($data['leads'] ?? []);
            $this->importUsers($data['mappings']['users'] ?? []);
            $this->importLeads($data['leads'] ?? []);

            if ($this->dryRun) {
                DB::rollBack();
                $this->info('DRY RUN complete — transaction rolled back.');
            } else {
                DB::commit();
                $this->info('Transaction committed.');
            }
        } catch (Throwable $e) {
            DB::rollBack();
            $this->error('Import failed: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
            return self::FAILURE;
        }

        $this->table(
            ['Metric', 'Count'],
            [
                ['Leads created',     $this->leadsCreated],
                ['Leads updated',     $this->leadsUpdated],
                ['Leads skipped',     $this->leadsSkipped],
                ['Activities created', $this->activitiesCreated],
                ['Users created',     $this->usersCreated],
            ]
        );

        return self::SUCCESS;
    }

    // -------------------------------------------------------------------------
    // Statuses
    // -------------------------------------------------------------------------

    /** @param array<int, array<string, mixed>> $statuses */
    private function importStatuses(array $statuses): void
    {
        $this->info('Importing statuses...');

        foreach ($statuses as $s) {
            $local = LeadStatus::query()->where('slug', $s['slug'])->first();

            if (!$local) {
                $attrs = [
                    'name'       => $s['name'],
                    'slug'       => $s['slug'],
                    'color'      => $s['color'] ?? '#64748b',
                    'position'   => (int) ($s['position'] ?? 0),
                    'is_default' => (bool) ($s['is_default'] ?? false),
                    'is_won'     => (bool) ($s['is_won'] ?? false),
                    'is_lost'    => (bool) ($s['is_lost'] ?? false),
                ];

                if (!$this->dryRun) {
                    $local = LeadStatus::create($attrs);
                    $this->line("  [status] Created: {$s['name']}");
                } else {
                    $this->line("  [DRY] Would create status: {$s['name']}");
                    // Use a placeholder ID for dry-run mapping
                    $this->statusMap[(int) $s['id']] = -(int) $s['id'];
                    continue;
                }
            } else {
                $this->line("  [status] Exists: {$s['name']} (slug={$s['slug']})");
            }

            $this->statusMap[(int) $s['id']] = (int) $local->id;
        }
    }

    // -------------------------------------------------------------------------
    // Drives (pipelines)
    // -------------------------------------------------------------------------

    /** @param array<int, array<string, mixed>> $leads */
    private function importDrives(array $leads): void
    {
        $this->info('Importing drives/pipelines...');

        // Collect all unique pipeline objects from lead entries — more complete
        // than mappings.drives which may omit the default pipeline.
        $pipelines = [];
        foreach ($leads as $entry) {
            $p = $entry['pipeline'] ?? null;
            if (!$p || !isset($p['id'])) {
                continue;
            }
            $pipelines[$p['id']] = $p;
        }

        foreach ($pipelines as $p) {
            $local = LeadDrive::query()->where('slug', $p['slug'])->first();

            if (!$local) {
                $attrs = [
                    'name'       => $p['name'],
                    'slug'       => $p['slug'],
                    'description' => $p['description'] ?? null,
                    'color'      => $p['color'] ?? '#64748b',
                    'is_default' => (bool) ($p['is_default'] ?? false),
                ];

                if (!$this->dryRun) {
                    $local = LeadDrive::create($attrs);
                    $this->line("  [drive] Created: {$p['name']}");
                } else {
                    $this->line("  [DRY] Would create drive: {$p['name']}");
                    $this->driveMap[(int) $p['id']] = -(int) $p['id'];
                    continue;
                }
            } else {
                $this->line("  [drive] Exists: {$p['name']} (slug={$p['slug']})");
            }

            $this->driveMap[(int) $p['id']] = (int) $local->id;
        }
    }

    // -------------------------------------------------------------------------
    // Users
    // -------------------------------------------------------------------------

    /** @param array<int, array<string, mixed>> $users */
    private function importUsers(array $users): void
    {
        $this->info('Importing users...');

        foreach ($users as $u) {
            $local = User::query()->where('email', $u['email'])->first();

            if (!$local) {
                if ($this->skipUsers) {
                    $this->line("  [user] Skip (--skip-users): {$u['email']}");
                    // Map to null — leads will have null assigned_to/created_by for this user.
                    continue;
                }

                $name = $u['name'] ?? ($u['email']);
                $attrs = [
                    'name'     => $name,
                    'email'    => $u['email'],
                    'password' => Hash::make(Str::random(32)),
                    'email_verified_at' => now(),
                ];

                if (!$this->dryRun) {
                    $local = User::create($attrs);

                    // Assign roles using Spatie
                    $roles = $u['roles'] ?? [];
                    foreach ($roles as $roleName) {
                        $role = Role::query()->where('name', $roleName)->first();
                        if ($role) {
                            $local->assignRole($role);
                        }
                    }

                    $this->line("  [user] Created: {$name} <{$u['email']}> roles=[" . implode(',', $roles) . ']');
                    $this->usersCreated++;
                } else {
                    $this->line("  [DRY] Would create user: {$name} <{$u['email']}>");
                    $this->usersCreated++;
                    $this->userMap[(int) $u['id']] = -(int) $u['id'];
                    continue;
                }
            } else {
                $this->line("  [user] Matched by email: {$u['email']} → local ID {$local->id}");
            }

            $this->userMap[(int) $u['id']] = (int) $local->id;
        }
    }

    // -------------------------------------------------------------------------
    // Leads + activities
    // -------------------------------------------------------------------------

    /** @param array<int, array<string, mixed>> $entries */
    private function importLeads(array $entries): void
    {
        $this->info('Importing leads...');
        $bar = $this->output->createProgressBar(count($entries));
        $bar->start();

        foreach ($entries as $entry) {
            $this->importSingleLead($entry);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /** @param array<string, mixed> $entry */
    private function importSingleLead(array $entry): void
    {
        $l = $entry['lead'];

        // --- Foreign key remapping ---
        $driveId    = $this->remapDrive($entry);
        $statusId   = $this->remapStatus($entry);
        $assignedTo = $this->remapUser((int) ($l['assigned_to'] ?? 0));
        $createdBy  = $this->remapUser((int) ($l['created_by'] ?? 0));

        // --- Duplicate detection ---
        $existing = $this->findExistingLead($l);

        if ($existing && !$this->force) {
            $this->leadsSkipped++;
            return;
        }

        // --- Build attributes ---
        $attrs = [
            'first_name'              => $l['first_name'] ?? '',
            'last_name'               => $l['last_name'] ?? null,
            'email'                   => $l['email'] ?? null,
            'phone'                   => $l['phone'] ?? null,
            'company'                 => $l['company'] ?? null,
            'employee_count'          => isset($l['employee_count']) ? (int) $l['employee_count'] : null,
            'year_founded'            => isset($l['year_founded']) ? (int) $l['year_founded'] : null,
            'industry'                => $l['industry'] ?? null,
            'job_title'               => $l['job_title'] ?? null,
            'website'                 => $l['website'] ?? null,
            'company_linkedin_profile' => $l['company_linkedin_profile'] ?? null,
            'ceo_linkedin_profile'    => $l['ceo_linkedin_profile'] ?? null,
            'country'                 => $l['country'] ?? null,
            'city'                    => $l['city'] ?? null,
            'address'                 => $l['address'] ?? null,
            'status'                  => $l['status'] ?? 'new',
            'source'                  => $l['source'] ?? null,
            'priority'                => $l['priority'] ?? 'medium',
            'estimated_value'         => $l['estimated_value'] ?? null,
            'currency'                => $l['currency'] ?? 'USD',
            'interested_services'     => is_array($l['interested_services'] ?? null)
                ? $l['interested_services']
                : null,
            'requirements'            => $l['requirements'] ?? null,
            'notes'                   => $l['notes'] ?? null,
            'lost_reason'             => $l['lost_reason'] ?? null,
            'source_type'             => $l['source_type'] ?? null,
            'source_id'               => $l['source_id'] ?? null,
            'assigned_to'             => $assignedTo,
            'drive_id'                => $driveId,
            'status_id'               => $statusId,
            'created_by'              => $createdBy,
            'last_contacted_at'       => $l['last_contacted_at'] ?? null,
            'next_follow_up'          => $l['next_follow_up'] ?? null,
            'converted_at'            => $l['converted_at'] ?? null,
        ];

        if ($this->dryRun) {
            $this->leadsCreated++;
            $this->activitiesCreated += count($entry['activities'] ?? []);
            return;
        }

        if ($existing && $this->force) {
            // Update preserving timestamps
            $existing->forceFill($attrs);
            $existing->updated_at = $l['updated_at'] ?? now();
            $existing->save();
            $this->leadsUpdated++;
            $lead = $existing;
        } else {
            $lead = new Lead();
            $lead->forceFill($attrs);
            $lead->created_at = $l['created_at'] ?? now();
            $lead->updated_at = $l['updated_at'] ?? now();

            // Preserve soft-delete if present
            if (!empty($l['deleted_at'])) {
                $lead->deleted_at = $l['deleted_at'];
            }

            $lead->save();
            $this->leadsCreated++;
        }

        $this->importActivities($lead, $entry['activities'] ?? []);
    }

    /**
     * @param  array<string, mixed>  $activities
     */
    private function importActivities(Lead $lead, array $activities): void
    {
        // Collect activity IDs already in DB for this lead to avoid duplication
        // when --force is used on a re-run.
        $existingMetaIds = LeadActivity::query()
            ->where('lead_id', $lead->id)
            ->whereNotNull('metadata->source_activity_id')
            ->pluck('metadata->source_activity_id')
            ->map(fn($v) => (int) $v)
            ->flip();

        foreach ($activities as $a) {
            $sourceId = (int) ($a['id'] ?? 0);

            if ($existingMetaIds->has($sourceId)) {
                continue; // already imported
            }

            $userId = $this->remapUser((int) ($a['user_id'] ?? 0));

            $metadata = $a['metadata'] ?? null;
            if (is_array($metadata) && empty($metadata)) {
                $metadata = null;
            }
            if (is_array($metadata)) {
                $metadata['source_activity_id'] = $sourceId;
            } else {
                $metadata = ['source_activity_id' => $sourceId];
            }

            $activity = new LeadActivity();
            $activity->forceFill([
                'lead_id'      => $lead->id,
                'user_id'      => $userId,
                'type'         => $a['type'] ?? 'note',
                'title'        => $a['title'] ?? '',
                'description'  => $a['description'] ?? null,
                'old_value'    => $a['old_value'] ?? null,
                'new_value'    => $a['new_value'] ?? null,
                'scheduled_at' => $a['scheduled_at'] ?? null,
                'completed_at' => $a['completed_at'] ?? null,
                'is_completed' => (bool) ($a['is_completed'] ?? false),
                'metadata'     => $metadata,
            ]);
            $activity->created_at = $a['created_at'] ?? now();
            $activity->updated_at = $a['updated_at'] ?? now();
            $activity->save();

            $this->activitiesCreated++;
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** @param array<string, mixed> $entry */
    private function remapDrive(array $entry): ?int
    {
        $sourceId = (int) ($entry['lead']['drive_id'] ?? ($entry['pipeline']['id'] ?? 0));
        if (!$sourceId) {
            return null;
        }
        return $this->driveMap[$sourceId] > 0 ? $this->driveMap[$sourceId] : null;
    }

    /** @param array<string, mixed> $entry */
    private function remapStatus(array $entry): ?int
    {
        $sourceId = (int) ($entry['status']['id'] ?? 0);
        if (!$sourceId) {
            return null;
        }
        return isset($this->statusMap[$sourceId]) && $this->statusMap[$sourceId] > 0
            ? $this->statusMap[$sourceId]
            : null;
    }

    private function remapUser(int $sourceId): ?int
    {
        if (!$sourceId) {
            return null;
        }
        $mapped = $this->userMap[$sourceId] ?? null;
        return ($mapped && $mapped > 0) ? $mapped : null;
    }

    /**
     * @param  array<string, mixed>  $l
     */
    private function findExistingLead(array $l): ?Lead
    {
        $email = $l['email'] ?? null;
        $phone = $l['phone'] ?? null;
        $firstName = $l['first_name'] ?? null;
        $lastName  = $l['last_name'] ?? null;

        if ($email) {
            $found = Lead::query()->withTrashed()->where('email', $email)->first();
            if ($found) {
                return $found;
            }
        }

        if ($phone && $firstName) {
            $found = Lead::query()
                ->withTrashed()
                ->where('phone', $phone)
                ->where('first_name', $firstName)
                ->where('last_name', $lastName)
                ->first();
            if ($found) {
                return $found;
            }
        }

        return null;
    }
}
