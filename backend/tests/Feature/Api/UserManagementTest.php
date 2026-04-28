<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('allows admin to create and manage users with roles', function () {
    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $create = $this->postJson('/api/v1/users', [
        'name' => 'Team Staff',
        'email' => 'staff@fastlink.test',
        'password' => 'password123',
        'role' => 'staff',
    ]);

    $create->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.email', 'staff@fastlink.test');

    $userId = $create->json('data.id');

    expect(User::find($userId)?->hasRole('staff'))->toBeTrue();

    $update = $this->patchJson("/api/v1/users/{$userId}", [
        'role' => 'supervisor',
        'suspended' => true,
    ]);

    $update->assertOk()
        ->assertJsonPath('data.suspended_at', fn ($value) => $value !== null);

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
