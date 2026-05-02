<?php

use App\Models\Attendance;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Laravel\Sanctum\Sanctum;

it('allows staff to sign in and sign out with nullable notes', function () {
    $staff = apiUser('staff', ['email' => 'att-staff@fastlink.test']);
    Sanctum::actingAs($staff);

    $signIn = $this->postJson('/api/v1/attendance/sign-in', []);
    $signIn->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user_id', $staff->id)
        ->assertJsonPath('data.note', null);

    $signOut = $this->postJson('/api/v1/attendance/sign-out', []);
    $signOut->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user_id', $staff->id)
        ->assertJsonPath('data.note', null);

    $attendance = Attendance::query()->where('user_id', $staff->id)->firstOrFail();
    expect($attendance->signed_in_at)->not->toBeNull();
    expect($attendance->signed_out_at)->not->toBeNull();
});

it('prevents duplicate sign in on the same day', function () {
    $staff = apiUser('staff', ['email' => 'att-dup-signin@fastlink.test']);
    Sanctum::actingAs($staff);

    $this->postJson('/api/v1/attendance/sign-in', [
        'note' => 'Starting shift',
    ])->assertOk();

    $this->postJson('/api/v1/attendance/sign-in', [
        'note' => 'Trying again',
    ])->assertStatus(422)
        ->assertJsonPath('success', false);
});

it('requires sign in before sign out and prevents duplicate sign out', function () {
    $staff = apiUser('staff', ['email' => 'att-signout-rules@fastlink.test']);
    Sanctum::actingAs($staff);

    $this->postJson('/api/v1/attendance/sign-out', [
        'note' => 'Trying to sign out without sign in',
    ])->assertStatus(422)
        ->assertJsonPath('success', false);

    $this->postJson('/api/v1/attendance/sign-in', [
        'note' => 'Starting shift',
    ])->assertOk();

    $this->postJson('/api/v1/attendance/sign-out', [
        'note' => 'Finished shift',
    ])->assertOk();

    $this->postJson('/api/v1/attendance/sign-out', [
        'note' => 'Trying duplicate sign out',
    ])->assertStatus(422)
        ->assertJsonPath('success', false);
});

it('preserves sign in note when sign out note is omitted', function () {
    $staff = apiUser('staff', ['email' => 'att-note-preserve@fastlink.test']);
    Sanctum::actingAs($staff);

    $this->postJson('/api/v1/attendance/sign-in', [
        'note' => 'Onsite morning shift',
    ])->assertOk();

    $signOut = $this->postJson('/api/v1/attendance/sign-out', []);
    $signOut->assertOk()
        ->assertJsonPath('data.note', 'Onsite morning shift');
});

it('automatically clocks out open attendance by 6pm', function () {
    $staff = apiUser('staff', ['email' => 'att-auto-clockout@fastlink.test']);
    Sanctum::actingAs($staff);

    Carbon::setTestNow('2026-05-02 09:10:00');

    $this->postJson('/api/v1/attendance/sign-in', [
        'note' => 'Morning shift',
    ])->assertOk();

    Carbon::setTestNow('2026-05-02 18:05:00');
    Artisan::call('attendance:auto-clock-out');

    $attendance = Attendance::query()->where('user_id', $staff->id)->firstOrFail();

    expect($attendance->signed_out_at)->not->toBeNull();
    expect($attendance->signed_out_at?->format('H:i:s'))->toBe('18:00:00');

    Carbon::setTestNow();
});

it('includes leave and task dates in attendance calendar payload', function () {
    $staff = apiUser('staff', ['email' => 'att-calendar-data@fastlink.test']);
    Sanctum::actingAs($staff);

    Carbon::setTestNow('2026-05-02 09:00:00');

    $this->postJson('/api/v1/attendance/sign-in', [])->assertOk();
    $this->postJson('/api/v1/attendance/sign-out', [])->assertOk();

    $project = Project::create([
        'name' => 'Calendar Rollup',
        'status' => 'planning',
        'priority' => 'normal',
        'created_by' => $staff->id,
    ]);

    Task::create([
        'title' => 'Hook task dates',
        'project_id' => $project->id,
        'status' => 'todo',
        'priority' => 'normal',
        'start_date' => '2026-05-03',
        'due_date' => '2026-05-06',
        'created_by' => $staff->id,
    ]);

    $this->postJson('/api/v1/leave-requests', [
        'type' => 'annual',
        'reason' => 'Family event',
        'start_date' => '2026-05-07',
        'end_date' => '2026-05-08',
        'supervisor_id' => apiUser('supervisor', ['email' => 'att-calendar-supervisor@fastlink.test'])->id,
    ])->assertCreated();

    $calendar = $this->getJson('/api/v1/attendance/calendar?month=2026-05');
    $calendar->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.month', '2026-05');

    expect($calendar->json('data.attendances'))->not->toBeEmpty();
    expect($calendar->json('data.leave_requests'))->not->toBeEmpty();
    expect($calendar->json('data.tasks'))->not->toBeEmpty();

    Carbon::setTestNow();
});
