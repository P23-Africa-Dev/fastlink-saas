<?php

namespace Database\Seeders;

use App\Models\LeadDrive;
use App\Models\LeadStatus;
use App\Support\OrganizationContext;
use Illuminate\Database\Seeder;

class WorkflowDefaultsSeeder extends Seeder
{
    /**
     * Seed default CRM drives/statuses for the current organization context.
     * If no org context is set, seeds for organization_id = 1 when it exists.
     */
    public function run(): void
    {
        $orgId = app(OrganizationContext::class)->id();

        if (! $orgId) {
            $orgId = \App\Models\Organization::query()->where('slug', 'fastlink')->value('id')
                ?? \App\Models\Organization::query()->value('id');
        }

        if (! $orgId) {
            $this->command?->warn('WorkflowDefaultsSeeder: no organization found — skipped.');

            return;
        }

        app(\App\Services\OrganizationProvisioner::class)->seedWorkflowDefaults((int) $orgId);
    }
}
