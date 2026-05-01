<?php

use App\Models\User;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

it('supports project, task, kanban, gantt, assignee, and comment flows', function () {
    $admin = apiUser('admin');
    $staff = apiUser('staff', ['email' => 'staff1@fastlink.test']);
    Sanctum::actingAs($admin);
    Notification::fake();

    $project = $this->postJson('/api/v1/projects', [
        'name' => 'Website Revamp',
        'status' => 'in_progress',
        'priority' => 'high',
        'start_date' => now()->toDateString(),
        'due_date' => now()->addDays(20)->toDateString(),
    ])->assertCreated()->json('data');

    $task = $this->postJson('/api/v1/tasks', [
        'title' => 'Prepare wireframes',
        'project_id' => $project['id'],
        'status' => 'todo',
        'priority' => 'medium',
        'start_date' => now()->toDateString(),
        'due_date' => now()->addDays(5)->toDateString(),
        'assignee_ids' => [$staff->id],
    ])->assertCreated()->json('data');

    Notification::assertSentTo($staff, TaskAssignedNotification::class);

    $taskId = $task['id'];

    $this->patchJson("/api/v1/tasks/{$taskId}/reorder", [
        'status' => 'in_progress',
        'order' => 1,
    ])->assertOk();

    $this->postJson("/api/v1/tasks/{$taskId}/comments", [
        'comment' => 'Started task execution.',
    ])->assertCreated();

    $this->postJson("/api/v1/tasks/{$taskId}/assign", [
        'assignee_ids' => [$staff->id, $admin->id],
    ])->assertOk();

    $kanban = $this->getJson('/api/v1/tasks/kanban');
    $kanban->assertOk()->assertJsonPath('success', true);

    $gantt = $this->getJson('/api/v1/projects/gantt');
    $gantt->assertOk()->assertJsonPath('success', true);

    expect(User::find($staff->id))->not->toBeNull();
});
