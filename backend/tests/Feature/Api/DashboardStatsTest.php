<?php

use App\Models\Lead;
use App\Models\Project;
use App\Models\Task;
use Database\Seeders\WorkflowDefaultsSeeder;
use Laravel\Sanctum\Sanctum;

it('returns aggregated dashboard statistics payload', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $project = Project::create([
        'name' => 'Demo Project',
        'status' => 'in_progress',
        'priority' => 'high',
        'created_by' => $admin->id,
    ]);

    Task::create([
        'title' => 'Completed Task',
        'project_id' => $project->id,
        'status' => 'completed',
        'priority' => 'medium',
        'created_by' => $admin->id,
    ]);

    Lead::create([
        'first_name' => 'Metrics Lead',
        'status' => 'new',
        'priority' => 'high',
        'created_by' => $admin->id,
    ]);

    $response = $this->getJson('/api/v1/dashboard/stats');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'data' => [
                'overview',
                'crm',
                'projects',
                'monthly',
            ],
        ]);
});
