<?php

use App\Models\LeaveRequest;
use App\Notifications\LeaveRequestWorkflowNotification;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

it('supports attendance and leave workflows with supervisor decisions', function () {
    $staff = apiUser('staff', ['email' => 'attendance-staff@fastlink.test']);
    $supervisor = apiUser('supervisor', ['email' => 'attendance-supervisor@fastlink.test']);
    Notification::fake();

    Sanctum::actingAs($staff);

    $this->postJson('/api/v1/attendance/sign-in', [
        'note' => 'Starting shift',
    ])->assertOk()->assertJsonPath('success', true);

    $this->postJson('/api/v1/attendance/sign-out', [
        'note' => 'Finished shift',
    ])->assertOk()->assertJsonPath('success', true);

    $leave = $this->postJson('/api/v1/leave-requests', [
        'type' => 'annual',
        'reason' => 'Family event',
        'start_date' => now()->addDays(10)->toDateString(),
        'end_date' => now()->addDays(12)->toDateString(),
        'supervisor_id' => $supervisor->id,
    ])->assertCreated()->json('data');

    Sanctum::actingAs($supervisor);

    $this->postJson('/api/v1/leave-requests/' . $leave['id'] . '/decide', [
        'status' => 'modified',
        'supervisor_note' => 'Please shift by one day',
        'modified_start_date' => now()->addDays(11)->toDateString(),
        'modified_end_date' => now()->addDays(12)->toDateString(),
    ])->assertOk();

    Sanctum::actingAs($staff);

    $this->postJson('/api/v1/leave-requests/' . $leave['id'] . '/respond', [
        'accept' => true,
        'sender_response_note' => 'Accepted',
    ])->assertOk()->assertJsonPath('data.status', 'sender_okay');

    $calendar = $this->getJson('/api/v1/attendance/calendar?month=' . now()->format('Y-m'));
    $calendar->assertOk()->assertJsonPath('success', true);

    expect(LeaveRequest::count())->toBe(1);
});

it('notifies all admins and only the targeted supervisor through leave workflow steps', function () {
    $staff = apiUser('staff', ['email' => 'leave-staff@fastlink.test']);
    $targetSupervisor = apiUser('supervisor', ['email' => 'target-supervisor@fastlink.test']);
    $otherSupervisor = apiUser('supervisor', ['email' => 'other-supervisor@fastlink.test']);
    $adminA = apiUser('admin', ['email' => 'admin-a@fastlink.test']);
    $adminB = apiUser('admin', ['email' => 'admin-b@fastlink.test']);

    Notification::fake();
    Sanctum::actingAs($staff);

    $leave = $this->postJson('/api/v1/leave-requests', [
        'type' => 'annual',
        'reason' => 'Family travel',
        'start_date' => now()->addDays(6)->toDateString(),
        'end_date' => now()->addDays(8)->toDateString(),
        'supervisor_id' => $targetSupervisor->id,
    ])->assertCreated()->json('data');

    Notification::assertSentTo([$adminA, $adminB, $targetSupervisor], LeaveRequestWorkflowNotification::class);
    Notification::assertNotSentTo($otherSupervisor, LeaveRequestWorkflowNotification::class);

    // Requester updates leave details: admins + targeted supervisor notified.
    $this->patchJson('/api/v1/leave-requests/' . $leave['id'], [
        'reason' => 'Family travel (updated)',
    ])->assertOk();

    Notification::assertSentTo([$adminA, $adminB, $targetSupervisor], LeaveRequestWorkflowNotification::class);
    Notification::assertNotSentTo($otherSupervisor, LeaveRequestWorkflowNotification::class);

    Sanctum::actingAs($targetSupervisor);

    // Supervisor modifies request: requester + admins notified. Non-target supervisor remains excluded.
    $this->postJson('/api/v1/leave-requests/' . $leave['id'] . '/decide', [
        'status' => 'modified',
        'supervisor_note' => 'Please shift by one day',
        'modified_start_date' => now()->addDays(7)->toDateString(),
        'modified_end_date' => now()->addDays(8)->toDateString(),
    ])->assertOk();

    Notification::assertSentTo([$adminA, $adminB, $staff], LeaveRequestWorkflowNotification::class);
    Notification::assertNotSentTo($otherSupervisor, LeaveRequestWorkflowNotification::class);

    Sanctum::actingAs($staff);

    // Requester responds (accept): admins + targeted supervisor notified.
    $this->postJson('/api/v1/leave-requests/' . $leave['id'] . '/respond', [
        'accept' => true,
        'sender_response_note' => 'Accepted',
    ])->assertOk();

    Notification::assertSentTo([$adminA, $adminB, $targetSupervisor], LeaveRequestWorkflowNotification::class);
    Notification::assertNotSentTo($otherSupervisor, LeaveRequestWorkflowNotification::class);

    // Separate request for cancel flow.
    $cancelLeave = $this->postJson('/api/v1/leave-requests', [
        'type' => 'personal',
        'reason' => 'Need flexibility',
        'start_date' => now()->addDays(15)->toDateString(),
        'end_date' => now()->addDays(16)->toDateString(),
        'supervisor_id' => $targetSupervisor->id,
    ])->assertCreated()->json('data');

    $this->postJson('/api/v1/leave-requests/' . $cancelLeave['id'] . '/cancel', [
        'reason' => 'No longer needed',
    ])->assertOk()->assertJsonPath('data.status', 'cancelled');

    Notification::assertSentTo([$adminA, $adminB, $targetSupervisor], LeaveRequestWorkflowNotification::class);
    Notification::assertNotSentTo($otherSupervisor, LeaveRequestWorkflowNotification::class);
});
