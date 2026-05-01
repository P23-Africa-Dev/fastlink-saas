<?php

use App\Models\Attendance;
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
