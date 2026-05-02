<?php

use App\Models\User;
use App\Notifications\UserAccountCreatedNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

it('allows admin to create and manage users with roles', function () {
    $admin = apiUser('admin');
    Sanctum::actingAs($admin);
    Notification::fake();

    $create = $this->postJson('/api/v1/users', [
        'name' => 'Team Staff',
        'email' => 'staff@fastlink.test',
        'role' => 'staff',
    ]);

    $create->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.email', 'staff@fastlink.test');

    $userId = $create->json('data.id');

    expect(User::find($userId)?->hasRole('staff'))->toBeTrue();

    Notification::assertSentTo(User::findOrFail($userId), UserAccountCreatedNotification::class);

    $update = $this->patchJson("/api/v1/users/{$userId}", [
        'role' => 'supervisor',
        'suspended' => true,
    ]);

    $update->assertOk()
        ->assertJsonPath('data.suspended_at', fn($value) => $value !== null);

    expect(User::find($userId)?->hasRole('supervisor'))->toBeTrue();
});

it('blocks staff from user management endpoints', function () {
    $staff = apiUser('staff');
    Sanctum::actingAs($staff);

    $response = $this->postJson('/api/v1/users', [
        'name' => 'Illegal User',
        'email' => 'illegal@fastlink.test',
        'password' => 'password123',
        'role' => 'staff',
    ]);

    $response->assertStatus(403);
});

it('allows staff to view users list but not modify users', function () {
    $staff = apiUser('staff', ['email' => 'staff-view-users@fastlink.test']);
    $admin = apiUser('admin', ['email' => 'admin-view-users@fastlink.test']);

    Sanctum::actingAs($staff);

    $this->getJson('/api/v1/users')
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->patchJson('/api/v1/users/' . $admin->id, [
        'name' => 'Should Not Update',
    ])->assertStatus(403);

    $this->deleteJson('/api/v1/users/' . $admin->id)
        ->assertStatus(403);
});

it('allows supervisor to create staff users and sends account email', function () {
    $supervisor = apiUser('supervisor');
    Sanctum::actingAs($supervisor);
    Notification::fake();

    $create = $this->postJson('/api/v1/users', [
        'name' => 'Support Staff',
        'email' => 'support-staff@fastlink.test',
        'role' => 'staff',
    ]);

    $create->assertCreated()
        ->assertJsonPath('data.email', 'support-staff@fastlink.test');

    $user = User::where('email', 'support-staff@fastlink.test')->firstOrFail();

    expect($user->hasRole('staff'))->toBeTrue();
    Notification::assertSentTo($user, UserAccountCreatedNotification::class);
});

it('blocks supervisor from creating admin users', function () {
    $supervisor = apiUser('supervisor');
    Sanctum::actingAs($supervisor);

    $create = $this->postJson('/api/v1/users', [
        'name' => 'Would Be Admin',
        'email' => 'would-be-admin@fastlink.test',
        'role' => 'admin',
    ]);

    $create->assertStatus(403)
        ->assertJsonPath('success', false);
});

it('allows supervisor to create supervisor users', function () {
    $supervisor = apiUser('supervisor', ['email' => 'sup-create-supervisor@fastlink.test']);
    Sanctum::actingAs($supervisor);

    $create = $this->postJson('/api/v1/users', [
        'name' => 'Would Be Supervisor',
        'email' => 'would-be-supervisor@fastlink.test',
        'role' => 'supervisor',
    ]);

    $create->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.email', 'would-be-supervisor@fastlink.test');
});

it('blocks supervisor from editing or deleting admin accounts', function () {
    $supervisor = apiUser('supervisor', ['email' => 'sup-manage-rules@fastlink.test']);
    $admin = apiUser('admin', ['email' => 'admin-manage-rules@fastlink.test']);

    Sanctum::actingAs($supervisor);

    $this->patchJson('/api/v1/users/' . $admin->id, [
        'suspended' => true,
    ])->assertStatus(403);

    $this->deleteJson('/api/v1/users/' . $admin->id)
        ->assertStatus(403);

    // Supervisors can still manage other supervisors
    $otherSupervisor = apiUser('supervisor', ['email' => 'other-sup-manage-rules@fastlink.test']);

    $this->patchJson('/api/v1/users/' . $otherSupervisor->id, [
        'name' => 'Updated Name',
        'role' => 'supervisor',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Updated Name');

    $this->deleteJson('/api/v1/users/' . $otherSupervisor->id)
        ->assertOk();
});

it('allows supervisor to edit, suspend, and delete staff accounts', function () {
    $supervisor = apiUser('supervisor', ['email' => 'sup-manage-staff@fastlink.test']);
    $staff = apiUser('staff', ['email' => 'staff-manage-staff@fastlink.test']);

    Sanctum::actingAs($supervisor);

    $this->patchJson('/api/v1/users/' . $staff->id, [
        'name' => 'Managed Staff',
        'suspended' => true,
        'role' => 'staff',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Managed Staff')
        ->assertJsonPath('data.suspended_at', fn($value) => $value !== null);

    $this->deleteJson('/api/v1/users/' . $staff->id)
        ->assertOk();
});

it('allows staff to fetch supervisors list for leave forms', function () {
    $staff = apiUser('staff', ['email' => 'staff-leave-list@fastlink.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-leave-list@fastlink.test']);
    $admin = apiUser('admin', ['email' => 'admin-leave-list@fastlink.test']);

    Sanctum::actingAs($staff);

    $response = $this->getJson('/api/v1/users/supervisors?exclude_self=1');

    $response->assertOk()
        ->assertJsonPath('success', true);

    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toContain($supervisor->id);
    expect($ids)->toContain($admin->id);
    expect($ids)->not->toContain($staff->id);
});

it('allows supervisor to fetch approvers list while excluding self', function () {
    $supervisor = apiUser('supervisor', ['email' => 'supervisor-self-filter@fastlink.test']);
    $otherSupervisor = apiUser('supervisor', ['email' => 'supervisor-peer@fastlink.test']);
    $admin = apiUser('admin', ['email' => 'admin-peer@fastlink.test']);

    Sanctum::actingAs($supervisor);

    $response = $this->getJson('/api/v1/users/supervisors?exclude_self=1');

    $response->assertOk()
        ->assertJsonPath('success', true);

    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toContain($otherSupervisor->id);
    expect($ids)->toContain($admin->id);
    expect($ids)->not->toContain($supervisor->id);
});

it('restores a soft-deleted user when creating with the same email', function () {
    $admin = apiUser('admin');
    Sanctum::actingAs($admin);
    Notification::fake();

    $first = $this->postJson('/api/v1/users', [
        'name' => 'Reusable Email',
        'email' => 'reusable@fastlink.test',
        'role' => 'staff',
    ])->assertCreated()->json('data');

    $firstId = $first['id'];

    $this->deleteJson("/api/v1/users/{$firstId}")
        ->assertOk();

    expect(User::withTrashed()->find($firstId)?->trashed())->toBeTrue();

    $recreate = $this->postJson('/api/v1/users', [
        'name' => 'Recreated User',
        'email' => 'reusable@fastlink.test',
        'role' => 'supervisor',
    ]);

    $recreate->assertCreated()
        ->assertJsonPath('data.id', $firstId)
        ->assertJsonPath('data.name', 'Recreated User');

    $restored = User::findOrFail($firstId);

    expect($restored->trashed())->toBeFalse();
    expect($restored->hasRole('supervisor'))->toBeTrue();

    Notification::assertSentTo($restored, UserAccountCreatedNotification::class);
});

it('marks newly created users as pending until first login', function () {
    $admin = apiUser('admin', ['email' => 'admin-pending-user@fastlink.test']);
    Sanctum::actingAs($admin);

    $create = $this->postJson('/api/v1/users', [
        'name' => 'Pending User',
        'email' => 'pending-user@fastlink.test',
        'role' => 'staff',
    ])->assertCreated();

    $createdId = $create->json('data.id');

    $user = User::findOrFail($createdId);
    expect($user->first_logged_in_at)->toBeNull();

    $user->forceFill([
        'password' => Hash::make('password123'),
    ])->save();

    $this->postJson('/api/v1/auth/login', [
        'email' => 'pending-user@fastlink.test',
        'password' => 'password123',
        'device_name' => 'pest-test',
    ])->assertOk();

    expect($user->fresh()->first_logged_in_at)->not->toBeNull();
});
