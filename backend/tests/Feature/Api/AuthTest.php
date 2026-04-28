<?php

use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

it('logs in and returns a bearer token', function () {
    $user = apiUser('admin', ['email' => 'admin@fastlink.test', 'password' => Hash::make('password123')]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password123',
        'device_name' => 'pest-suite',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => ['token', 'token_type', 'user'],
        ]);
});

it('rejects invalid credentials', function () {
    $user = apiUser('admin', ['email' => 'admin@fastlink.test', 'password' => Hash::make('password123')]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false);
});

it('returns current user profile for authenticated token', function () {
    $user = apiUser('supervisor');
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/auth/me');

    $response->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('success', true);
});
