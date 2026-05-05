<?php

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Notification;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

it('creates admin in-app notification when a new lead is created', function () {
    $admin = apiUser('admin', ['email' => 'notif-admin-lead@test.test']);
    $staff = apiUser('staff', ['email' => 'notif-staff-lead@test.test']);

    Sanctum::actingAs($staff);

    $this->postJson('/api/v1/crm/leads', [
        'first_name' => 'Liam',
        'last_name' => 'Lead',
        'email' => 'liam.lead@test.test',
    ])->assertCreated();

    expect(Notification::query()->where('user_id', $admin->id)->where('type', 'crm.lead_created')->exists())
        ->toBeTrue();
});

it('notifies admin and assigned user when lead is assigned', function () {
    $admin = apiUser('admin', ['email' => 'notif-admin-assign@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'notif-supervisor-assign@test.test']);
    $staff = apiUser('staff', ['email' => 'notif-target-staff@test.test']);

    Sanctum::actingAs($supervisor);

    $response = $this->postJson('/api/v1/crm/leads', [
        'first_name' => 'Assigned',
        'last_name' => 'Lead',
        'assigned_to' => $staff->id,
    ]);

    $response->assertCreated();

    expect(Notification::query()->where('user_id', $admin->id)->where('type', 'crm.lead_assigned')->exists())
        ->toBeTrue();
    expect(Notification::query()->where('user_id', $staff->id)->where('type', 'crm.lead_assigned')->exists())
        ->toBeTrue();
});

it('notifies admins when supervisor creates a user', function () {
    $admin = apiUser('admin', ['email' => 'notif-admin-user@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'notif-supervisor-user@test.test']);

    Sanctum::actingAs($supervisor);

    $this->postJson('/api/v1/users', [
        'name' => 'Created By Sup',
        'email' => 'created-by-sup@test.test',
        'role' => 'staff',
    ])->assertCreated();

    expect(Notification::query()->where('user_id', $admin->id)->where('type', 'user.created_by_supervisor')->exists())
        ->toBeTrue();
});

it('notifies admin on valuable project creation', function () {
    $admin = apiUser('admin', ['email' => 'notif-admin-project@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'notif-supervisor-project@test.test']);

    Sanctum::actingAs($supervisor);

    $this->postJson('/api/v1/projects', [
        'name' => 'VIP Project',
        'is_valuable' => true,
    ])->assertCreated();

    expect(Notification::query()->where('user_id', $admin->id)->where('type', 'project.valuable_created')->exists())
        ->toBeTrue();
});

it('notifies admins and supervisors on clock in and clock out', function () {
    $admin = apiUser('admin', ['email' => 'notif-admin-att@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'notif-supervisor-att@test.test']);
    $staff = apiUser('staff', ['email' => 'notif-staff-att@test.test']);

    Sanctum::actingAs($staff);

    $this->postJson('/api/v1/attendance/sign-in', [])->assertOk();
    $this->postJson('/api/v1/attendance/sign-out', [])->assertOk();

    expect(Notification::query()->where('user_id', $admin->id)->where('type', 'attendance.clock_in')->exists())
        ->toBeTrue();
    expect(Notification::query()->where('user_id', $admin->id)->where('type', 'attendance.clock_out')->exists())
        ->toBeTrue();
    expect(Notification::query()->where('user_id', $supervisor->id)->where('type', 'attendance.clock_in')->exists())
        ->toBeTrue();
});

it('notifies admins and supervisors for new leave request and requester on status update', function () {
    $admin = apiUser('admin', ['email' => 'notif-admin-leave@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'notif-supervisor-leave@test.test']);
    $staff = apiUser('staff', ['email' => 'notif-staff-leave@test.test']);

    Sanctum::actingAs($staff);

    $create = $this->postJson('/api/v1/leave-requests', [
        'type' => 'annual',
        'start_date' => now()->addDays(1)->toDateString(),
        'end_date' => now()->addDays(2)->toDateString(),
        'supervisor_id' => $supervisor->id,
    ]);
    $create->assertCreated();

    expect(Notification::query()->where('user_id', $admin->id)->where('type', 'leave.request_created')->exists())
        ->toBeTrue();
    expect(Notification::query()->where('user_id', $supervisor->id)->where('type', 'leave.request_created')->exists())
        ->toBeTrue();

    $leaveId = (int) $create->json('data.id');

    Sanctum::actingAs($supervisor);

    $this->postJson("/api/v1/leave-requests/{$leaveId}/decide", [
        'status' => 'approved',
    ])->assertOk();

    expect(Notification::query()->where('user_id', $staff->id)->where('type', 'leave.status_updated')->exists())
        ->toBeTrue();
});

it('supports notification APIs for polling and read lifecycle', function () {
    $staff = apiUser('staff', ['email' => 'notif-api-staff@test.test']);

    Notification::query()->create([
        'user_id' => $staff->id,
        'type' => 'test.sample',
        'title' => 'Sample',
        'message' => 'Sample message',
        'metadata' => ['x' => 1],
        'priority' => 'low',
        'is_read' => false,
        'created_at' => now(),
    ]);

    Sanctum::actingAs($staff);

    $list = $this->getJson('/api/v1/notifications');
    $list->assertOk()->assertJsonPath('success', true);

    $id = (int) $list->json('data.0.id');

    $this->getJson('/api/v1/notifications/unread-count')
        ->assertOk()
        ->assertJsonPath('data.unread_count', 1);

    $this->postJson('/api/v1/notifications/mark-as-read', [
        'ids' => [$id],
    ])->assertOk();

    $this->postJson('/api/v1/notifications/mark-all-read')->assertOk();

    $this->deleteJson('/api/v1/notifications/' . $id)->assertOk();
});

it('creates tag creation notification for admins and supervisors and assignment notification for staff only', function () {
    $admin = apiUser('admin', ['email' => 'notif-admin-tag@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'notif-supervisor-tag@test.test']);
    $staff = apiUser('staff', ['email' => 'notif-staff-tag@test.test']);

    Sanctum::actingAs($admin);

    $create = $this->postJson('/api/v1/projects/tags', [
        'name' => 'Urgent Follow-up',
        'color' => '#FF0000',
    ]);

    $create->assertCreated();
    $tagId = (int) $create->json('data.id');

    expect(Notification::query()->where('user_id', $admin->id)->where('type', 'project.tag_created')->exists())
        ->toBeTrue();
    expect(Notification::query()->where('user_id', $supervisor->id)->where('type', 'project.tag_created')->exists())
        ->toBeTrue();

    Sanctum::actingAs($supervisor);

    $this->postJson("/api/v1/projects/tags/{$tagId}/assign", [
        'user_id' => $staff->id,
    ])->assertOk();

    expect(Notification::query()->where('user_id', $staff->id)->where('type', 'project.tag_assigned')->exists())
        ->toBeTrue();
});
