<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class ClearLeadsData extends Command
{
    protected $signature = 'crm:clear-leads
                            {--with-statuses : Also delete all lead statuses}
                            {--with-drives : Also delete all lead drives/pipelines}
                            {--all : Delete leads, activities, statuses, AND drives}
                            {--force : Skip confirmation prompt}';

    protected $description = 'Delete all leads and their related data so a fresh import can be run.';

    public function handle(): int
    {
        $withStatuses = $this->option('with-statuses') || $this->option('all');
        $withDrives   = $this->option('with-drives')   || $this->option('all');

        $this->warn('This will permanently delete:');
        $this->line('  • All leads (including soft-deleted)');
        $this->line('  • All lead activities');
        $this->line('  • All lead follow-up records (followups, update requests, activities, attachments)');
        if ($withStatuses) {
            $this->line('  • All lead statuses');
        }
        if ($withDrives) {
            $this->line('  • All lead drives / pipelines');
        }
        $this->newLine();

        if (!$this->option('force') && !$this->confirm('Are you sure you want to continue? This cannot be undone.')) {
            $this->info('Aborted.');
            return self::SUCCESS;
        }

        try {
            DB::beginTransaction();

            // Disable FK checks for the duration so truncate works cleanly.
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            $deleted = [];

            // Follow-up sub-tables first (child → parent order)
            DB::table('lead_followup_attachments')->delete();
            DB::table('lead_followup_activities')->delete();
            DB::table('lead_followup_update_requests')->delete();
            DB::table('lead_followups')->delete();
            $deleted[] = 'lead_followups (+ sub-tables)';

            // Activities
            $actCount = DB::table('lead_activities')->count();
            DB::table('lead_activities')->delete();
            $deleted[] = "lead_activities ({$actCount} rows)";

            // Leads (hard-delete including soft-deleted rows)
            $leadCount = DB::table('leads')->count();
            DB::table('leads')->delete();
            $deleted[] = "leads ({$leadCount} rows)";

            if ($withStatuses) {
                $statusCount = DB::table('lead_statuses')->count();
                DB::table('lead_statuses')->delete();
                $deleted[] = "lead_statuses ({$statusCount} rows)";
            }

            if ($withDrives) {
                $driveCount = DB::table('lead_drives')->count();
                DB::table('lead_drives')->delete();
                $deleted[] = "lead_drives ({$driveCount} rows)";
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            DB::commit();

            $this->info('Done. Deleted:');
            foreach ($deleted as $item) {
                $this->line("  ✓ {$item}");
            }

            $this->newLine();
            $this->info('You can now run:');
            $this->line('  php artisan crm:import-leads <path-to-json>');
        } catch (Throwable $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            $this->error('Failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
