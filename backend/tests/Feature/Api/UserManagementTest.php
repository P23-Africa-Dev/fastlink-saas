<?php

use App\Models\User;
use App\Notifications\UserAccountCreatedNotification;
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
