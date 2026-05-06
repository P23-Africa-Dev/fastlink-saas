<?php

use App\Models\Task;
use App\Models\User;
use Database\Seeders\WorkflowDefaultsSeeder;
use Laravel\Sanctum\Sanctum;

function createDashboardTask(array $overrides = []): Task
{
    return Task::create(array_merge([
        'title' => 'Daily Task',
        'status' => 'todo',
        'priority' => 'medium',
        'start_date' => now()->toDateString(),
        'due_date' => now()->toDateString(),
    ], $overrides));
}

it('returns daily tasks for admin with default today date filter', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    createDashboardTask([
        'title' => 'Today Task',
        'created_by' => $admin->id,
        'start_date' => now()->subDay()->toDateString(),
        'due_date' => now()->addDay()->toDateString(),
    ]);

    createDashboardTask([
        'title' => 'Past Task',
        'created_by' => $admin->id,
        'start_date' => now()->subDays(10)->toDateString(),
        'due_date' => now()->subDays(5)->toDateString(),
    ]);

    $response = $this->getJson('/api/v1/dashboard/daily-tasks');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_tasks', 1)
        ->assertJsonPath('data.tasks.0.title', 'Today Task');
});

it('returns all daily tasks for supervisor', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $supervisor = apiUser('supervisor');
    $staffA = apiUser('staff', ['email' => 'staffa@fastlink.test']);
    $staffB = apiUser('staff', ['email' => 'staffb@fastlink.test']);
    Sanctum::actingAs($supervisor);

    createDashboardTask([
        'title' => 'Supervisor Visible A',
        'created_by' => $staffA->id,
        'start_date' => now()->toDateString(),
        'due_date' => now()->addDay()->toDateString(),
    ]);

    createDashboardTask([
        'title' => 'Supervisor Visible B',
        'created_by' => $staffB->id,
        'start_date' => now()->subDay()->toDateString(),
        'due_date' => now()->toDateString(),
    ]);

    $response = $this->getJson('/api/v1/dashboard/daily-tasks');

    $response->assertOk()
        ->assertJsonPath('data.total_tasks', 2);
});

it('limits staff visibility to tasks assigned to them or created by them', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $staff = apiUser('staff');
    $other = apiUser('staff', ['email' => 'otherstaff@fastlink.test']);
    Sanctum::actingAs($staff);

    $createdByStaff = createDashboardTask([
        'title' => 'Created By Staff',
        'created_by' => $staff->id,
        'start_date' => now()->toDateString(),
        'due_date' => now()->toDateString(),
    ]);

    $assignedToStaff = createDashboardTask([
        'title' => 'Assigned To Staff',
        'created_by' => $other->id,
        'start_date' => now()->toDateString(),
        'due_date' => now()->toDateString(),
    ]);
    $assignedToStaff->assignees()->sync([$staff->id => ['assigned_by' => $other->id]]);

    createDashboardTask([
        'title' => 'Hidden From Staff',
        'created_by' => $other->id,
        'start_date' => now()->toDateString(),
        'due_date' => now()->toDateString(),
    ]);

    $response = $this->getJson('/api/v1/dashboard/daily-tasks');

    $response->assertOk()
        ->assertJsonPath('data.total_tasks', 2)
        ->assertJsonFragment(['title' => 'Created By Staff'])
        ->assertJsonFragment(['title' => 'Assigned To Staff'])
        ->assertJsonMissing(['title' => 'Hidden From Staff']);

    expect($createdByStaff->id)->toBeInt();
});

it('supports explicit date and status filters', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    createDashboardTask([
        'title' => 'Matched Task',
        'status' => 'in_progress',
        'created_by' => $admin->id,
        'start_date' => '2026-06-01',
        'due_date' => '2026-06-03',
    ]);

    createDashboardTask([
        'title' => 'Different Status',
        'status' => 'todo',
        'created_by' => $admin->id,
        'start_date' => '2026-06-01',
        'due_date' => '2026-06-03',
    ]);

    $response = $this->getJson('/api/v1/dashboard/daily-tasks?date=2026-06-02&status=in_progress');

    $response->assertOk()
        ->assertJsonPath('data.date', '2026-06-02')
        ->assertJsonPath('data.total_tasks', 1)
        ->assertJsonPath('data.tasks.0.title', 'Matched Task');
});

it('includes tasks spanning multiple days and tasks starting or ending on the selected date', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    createDashboardTask([
        'title' => 'Spanning Task',
        'created_by' => $admin->id,
        'start_date' => '2026-05-31',
        'due_date' => '2026-06-03',
    ]);

    createDashboardTask([
        'title' => 'Starts Today',
        'created_by' => $admin->id,
        'start_date' => '2026-06-01',
        'due_date' => '2026-06-05',
    ]);

    createDashboardTask([
        'title' => 'Ends Today',
        'created_by' => $admin->id,
        'start_date' => '2026-05-29',
        'due_date' => '2026-06-01',
    ]);

    $response = $this->getJson('/api/v1/dashboard/daily-tasks?date=2026-06-01');

    $response->assertOk()
        ->assertJsonPath('data.total_tasks', 3)
        ->assertJsonFragment(['title' => 'Spanning Task'])
        ->assertJsonFragment(['title' => 'Starts Today'])
        ->assertJsonFragment(['title' => 'Ends Today']);
});

it('returns empty task list when no tasks match the selected day', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/dashboard/daily-tasks?date=2026-06-01');

    $response->assertOk()
        ->assertJsonPath('data.total_tasks', 0)
        ->assertJsonCount(0, 'data.tasks');
});

it('returns 422 for invalid date input', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/dashboard/daily-tasks?date=06-01-2026');

    $response->assertStatus(422)
        ->assertJsonPath('success', false);
});

it('includes tasks without assignees', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    createDashboardTask([
        'title' => 'Unassigned Task',
        'created_by' => $admin->id,
        'start_date' => now()->toDateString(),
        'due_date' => now()->toDateString(),
    ]);

    $response = $this->getJson('/api/v1/dashboard/daily-tasks');

    $response->assertOk()
        ->assertJsonPath('data.total_tasks', 1)
        ->assertJsonPath('data.tasks.0.assigned_to', null)
        ->assertJsonPath('data.tasks.0.created_by.id', $admin->id);
});
