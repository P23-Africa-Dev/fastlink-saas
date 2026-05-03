<?php

use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

// ─── GET /v1/settings/profile ─────────────────────────────────────────────────

it('returns the authenticated user profile for any role', function (string $role) {
    $user = apiUser($role, ['email' => "profile-get-{$role}@test.test"]);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/settings/profile');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.email', $user->email);
})->with(['admin', 'supervisor', 'staff']);

it('rejects unauthenticated profile requests', function () {
    $this->getJson('/api/v1/settings/profile')->assertUnauthorized();
});

// ─── PATCH /v1/settings/profile ──────────────────────────────────────────────

it('allows any role to update their name', function (string $role) {
    $user = apiUser($role, ['email' => "profile-name-{$role}@test.test"]);
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/v1/settings/profile', [
        'name' => 'Updated Name',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Updated Name');

    expect($user->fresh()->name)->toBe('Updated Name');
})->with(['admin', 'supervisor', 'staff']);

it('allows any role to update their email when unique', function () {
    $user = apiUser('staff', ['email' => 'old-email@test.test']);
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/v1/settings/profile', [
        'email' => 'new-email@test.test',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.email', 'new-email@test.test');
});

it('rejects email update when email is taken by another user', function () {
    $other = apiUser('staff', ['email' => 'taken@test.test']);
    $user  = apiUser('staff', ['email' => 'mine@test.test']);
    Sanctum::actingAs($user);

    $this->patchJson('/api/v1/settings/profile', [
        'email' => 'taken@test.test',
    ])->assertUnprocessable();
});

it('allows password change when current password is correct', function () {
    $user = apiUser('staff', [
        'email'    => 'pwchange@test.test',
        'password' => Hash::make('OldPass123'),
    ]);
    Sanctum::actingAs($user);

    $response = $this->patchJson('/api/v1/settings/profile', [
        'current_password'      => 'OldPass123',
        'password'              => 'NewPass456',
        'password_confirmation' => 'NewPass456',
    ]);

    $response->assertOk();
    expect(Hash::check('NewPass456', $user->fresh()->password))->toBeTrue();
});

it('rejects password change when current password is wrong', function () {
    $user = apiUser('staff', [
        'email'    => 'pwwrong@test.test',
        'password' => Hash::make('RealPassword'),
    ]);
    Sanctum::actingAs($user);

    $this->patchJson('/api/v1/settings/profile', [
        'current_password'      => 'WrongPassword',
        'password'              => 'NewPass456',
        'password_confirmation' => 'NewPass456',
    ])->assertUnprocessable()
        ->assertJsonPath('errors.current_password.0', 'The current password is incorrect.');
});

it('rejects password change when confirmation does not match', function () {
    $user = apiUser('staff', [
        'email'    => 'pwconfirm@test.test',
        'password' => Hash::make('RealPassword'),
    ]);
    Sanctum::actingAs($user);

    $this->patchJson('/api/v1/settings/profile', [
        'current_password'      => 'RealPassword',
        'password'              => 'NewPass456',
        'password_confirmation' => 'MismatchedPass',
    ])->assertUnprocessable();
});

// ─── PATCH /v1/settings/appearance ───────────────────────────────────────────

it('allows any role to update appearance preference', function (string $role) {
    $user = apiUser($role, ['email' => "appearance-{$role}@test.test"]);
    Sanctum::actingAs($user);

    foreach (['light', 'dark', 'system'] as $theme) {
        $response = $this->patchJson('/api/v1/settings/appearance', [
            'appearance' => $theme,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.appearance', $theme);

        expect($user->fresh()->appearance)->toBe($theme);
    }
})->with(['admin', 'supervisor', 'staff']);

it('rejects invalid appearance value', function () {
    $user = apiUser('staff', ['email' => 'bad-appearance@test.test']);
    Sanctum::actingAs($user);

    $this->patchJson('/api/v1/settings/appearance', [
        'appearance' => 'neon',
    ])->assertUnprocessable();
});

// ─── Profile data in /auth/me ─────────────────────────────────────────────────

it('includes appearance field in user profile response', function () {
    $user = apiUser('staff', ['email' => 'appearance-me@test.test']);
    $user->update(['appearance' => 'dark']);
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/settings/profile')
        ->assertOk()
        ->assertJsonPath('data.appearance', 'dark');
});
