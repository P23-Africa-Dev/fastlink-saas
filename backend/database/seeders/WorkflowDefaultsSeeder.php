<?php

namespace Database\Seeders;

use App\Models\LeadDrive;
use App\Models\LeadStatus;
use Illuminate\Database\Seeder;

class WorkflowDefaultsSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $drives = [
            ['name' => 'Inbound', 'slug' => 'inbound', 'description' => 'Inbound leads pipeline', 'color' => '#2563eb', 'position' => 1, 'is_default' => true],
            ['name' => 'Outbound', 'slug' => 'outbound', 'description' => 'Outbound prospecting pipeline', 'color' => '#0891b2', 'position' => 2, 'is_default' => false],
        ];

        foreach ($drives as $drive) {
            LeadDrive::query()->updateOrCreate(['slug' => $drive['slug']], $drive);
        }

        $statuses = [
            ['name' => 'New', 'slug' => 'new', 'color' => '#64748b', 'position' => 1, 'is_default' => true, 'is_won' => false, 'is_lost' => false],
            ['name' => 'Contacted', 'slug' => 'contacted', 'color' => '#0284c7', 'position' => 2, 'is_default' => false, 'is_won' => false, 'is_lost' => false],
            ['name' => 'Qualified', 'slug' => 'qualified', 'color' => '#7c3aed', 'position' => 3, 'is_default' => false, 'is_won' => false, 'is_lost' => false],
            ['name' => 'Proposal', 'slug' => 'proposal', 'color' => '#d97706', 'position' => 4, 'is_default' => false, 'is_won' => false, 'is_lost' => false],
            ['name' => 'Won', 'slug' => 'won', 'color' => '#16a34a', 'position' => 5, 'is_default' => false, 'is_won' => true, 'is_lost' => false],
            ['name' => 'Lost', 'slug' => 'lost', 'color' => '#dc2626', 'position' => 6, 'is_default' => false, 'is_won' => false, 'is_lost' => true],
        ];

        foreach ($statuses as $status) {
            LeadStatus::query()->updateOrCreate(['slug' => $status['slug']], $status);
        }
    }
}
