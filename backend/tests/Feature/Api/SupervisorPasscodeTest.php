<?php

use App\Models\SupervisorPasscode;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// ─── POST /v1/settings/company/passcodes — Generate ──────────────────────────

it('admin can generate a passcode for a supervisor', function () {
    $admin      = apiUser('admin', ['email' => 'admin-gen@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-gen@test.test']);
    Sanctum::actingAs($admin);

    $response = $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'data' => [
                'passcode' => ['id', 'supervisor_id', 'expires_at', 'is_active'],
                'plain_text',
                'notice',
            ],
        ]);

    // Plain text should match format XXXX-XXXX
    $plain = $response->json('data.plain_text');
    expect($plain)->toMatch('/^[A-Z2-9]{4}-[A-Z2-9]{4}$/');

    // DB should have the hashed version
    expect(SupervisorPasscode::where('supervisor_id', $supervisor->id)->count())->toBe(1);
});

it('admin can generate a passcode with a future expiry date', function () {
    $admin      = apiUser('admin', ['email' => 'admin-expiry@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-expiry@test.test']);
    Sanctum::actingAs($admin);

    $expiresAt = now()->addDays(30)->toDateString();

    $response = $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
        'expires_at'    => $expiresAt,
    ]);

    $response->assertCreated();

    $passcode = SupervisorPasscode::where('supervisor_id', $supervisor->id)->first();
    expect($passcode->expires_at->toDateString())->toBe($expiresAt);
});

it('generating a new passcode revokes any existing active passcode for that supervisor', function () {
    $admin      = apiUser('admin', ['email' => 'admin-revoke-old@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-revoke-old@test.test']);
    Sanctum::actingAs($admin);

    // Generate first passcode
    $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ])->assertCreated();

    expect(SupervisorPasscode::where('supervisor_id', $supervisor->id)->count())->toBe(1);

    // Generate second passcode — should delete the first
    $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ])->assertCreated();

    // Only the new one should remain
    expect(SupervisorPasscode::where('supervisor_id', $supervisor->id)->count())->toBe(1);
});

it('rejects passcode generation for a non-supervisor user', function () {
    $admin = apiUser('admin', ['email' => 'admin-bad-role@test.test']);
    $staff = apiUser('staff', ['email' => 'staff-bad-role@test.test']);
    Sanctum::actingAs($admin);

    $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $staff->id,
    ])->assertUnprocessable();
});

it('rejects passcode generation for a past expiry date', function () {
    $admin      = apiUser('admin', ['email' => 'admin-past-exp@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-past-exp@test.test']);
    Sanctum::actingAs($admin);

    $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
        'expires_at'    => now()->subDay()->toDateString(),
    ])->assertUnprocessable();
});

it('blocks supervisor and staff from generating passcodes', function (string $role) {
    $user = apiUser($role, ['email' => "blocked-generate-{$role}@test.test"]);
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $user->id,
    ])->assertForbidden();
})->with(['supervisor', 'staff']);

// ─── GET /v1/settings/company/passcodes — List ───────────────────────────────

it('admin can list all supervisor passcodes', function () {
    $admin      = apiUser('admin', ['email' => 'admin-list@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-list@test.test']);
    Sanctum::actingAs($admin);

    $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ]);

    $response = $this->getJson('/api/v1/settings/company/passcodes');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('admin can filter passcodes by supervisor_id', function () {
    $admin = apiUser('admin', ['email' => 'admin-filter@test.test']);
    $sup1  = apiUser('supervisor', ['email' => 'sup1-filter@test.test']);
    $sup2  = apiUser('supervisor', ['email' => 'sup2-filter@test.test']);
    Sanctum::actingAs($admin);

    $this->postJson('/api/v1/settings/company/passcodes', ['supervisor_id' => $sup1->id]);
    $this->postJson('/api/v1/settings/company/passcodes', ['supervisor_id' => $sup2->id]);

    $response = $this->getJson('/api/v1/settings/company/passcodes?supervisor_id=' . $sup1->id);
    $response->assertOk()->assertJsonCount(1, 'data');
});

// ─── DELETE /v1/settings/company/passcodes/{passcode} — Revoke ───────────────

it('admin can revoke a passcode', function () {
    $admin      = apiUser('admin', ['email' => 'admin-revoke@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-revoke@test.test']);
    Sanctum::actingAs($admin);

    $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ])->assertCreated();

    $passcode = SupervisorPasscode::where('supervisor_id', $supervisor->id)->firstOrFail();

    $this->deleteJson('/api/v1/settings/company/passcodes/' . $passcode->id)
        ->assertOk()
        ->assertJsonPath('message', 'Passcode revoked and all related access tokens deleted.');

    expect(SupervisorPasscode::find($passcode->id))->toBeNull();
});

// ─── POST /v1/settings/company/verify-passcode ───────────────────────────────

it('supervisor can verify a correct passcode and receive session token', function () {
    $admin      = apiUser('admin', ['email' => 'admin-vfy@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-vfy@test.test']);

    Sanctum::actingAs($admin);
    $plain = $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ])->json('data.plain_text');

    Sanctum::actingAs($supervisor);
    $response = $this->postJson('/api/v1/settings/company/verify-passcode', [
        'passcode' => $plain,
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure(['data' => ['session_token', 'device_token', 'session_expires_in_seconds']]);

    $sessionToken = $response->json('data.session_token');
    expect($sessionToken)->not->toBeNull();
    expect($response->json('data.device_token'))->toBeNull();
    expect($response->json('data.session_expires_in_seconds'))->toBe(7200);
});

it('supervisor receives null device_token when remember_device is false', function () {
    $admin      = apiUser('admin', ['email' => 'admin-nodev@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-nodev@test.test']);

    Sanctum::actingAs($admin);
    $plain = $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ])->json('data.plain_text');

    Sanctum::actingAs($supervisor);
    $response = $this->postJson('/api/v1/settings/company/verify-passcode', [
        'passcode'        => $plain,
        'remember_device' => false,
    ]);

    $response->assertOk();
    expect($response->json('data.device_token'))->toBeNull();
});

it('supervisor gets 403 when providing a wrong passcode', function () {
    $admin      = apiUser('admin', ['email' => 'admin-wrong@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-wrong@test.test']);

    Sanctum::actingAs($admin);
    $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ]);

    Sanctum::actingAs($supervisor);
    $this->postJson('/api/v1/settings/company/verify-passcode', [
        'passcode' => 'WXYZ-ABCD', // wrong
    ])->assertForbidden();
});

it('supervisor gets 403 when no active passcode exists for them', function () {
    $supervisor = apiUser('supervisor', ['email' => 'sup-nopasscode@test.test']);
    Sanctum::actingAs($supervisor);

    $this->postJson('/api/v1/settings/company/verify-passcode', [
        'passcode' => 'XXXX-XXXX',
    ])->assertForbidden();
});

it('blocks admin from calling verify-passcode endpoint (supervisor-only)', function () {
    $admin = apiUser('admin', ['email' => 'admin-vfy-block@test.test']);
    Sanctum::actingAs($admin);

    $this->postJson('/api/v1/settings/company/verify-passcode', [
        'passcode' => 'XXXX-XXXX',
    ])->assertForbidden();
});

// ─── POST /v1/settings/company/validate-device-token ─────────────────────────

it('supervisor can validate a valid device token', function () {
    $admin      = apiUser('admin', ['email' => 'admin-devval@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-devval@test.test']);

    Sanctum::actingAs($admin);
    $plain = $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ])->json('data.plain_text');

    Sanctum::actingAs($supervisor);
    $deviceToken = $this->postJson('/api/v1/settings/company/verify-passcode', [
        'passcode'        => $plain,
        'remember_device' => true,
    ])->json('data.device_token');

    $this->postJson('/api/v1/settings/company/validate-device-token', [
        'device_token' => $deviceToken,
    ])->assertOk()->assertJsonPath('data.valid', true);
});

it('returns 403 when device token is invalid or does not exist', function () {
    $supervisor = apiUser('supervisor', ['email' => 'sup-baddev@test.test']);
    Sanctum::actingAs($supervisor);

    $this->postJson('/api/v1/settings/company/validate-device-token', [
        'device_token' => 'totally-fake-device-token',
    ])->assertForbidden();
});

it('revoked passcode invalidates the associated device token', function () {
    $admin      = apiUser('admin', ['email' => 'admin-rev-dev@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-rev-dev@test.test']);

    Sanctum::actingAs($admin);
    $plain = $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ])->json('data.plain_text');
    $passcode = SupervisorPasscode::where('supervisor_id', $supervisor->id)->firstOrFail();

    Sanctum::actingAs($supervisor);
    $deviceToken = $this->postJson('/api/v1/settings/company/verify-passcode', [
        'passcode'        => $plain,
        'remember_device' => true,
    ])->json('data.device_token');

    // Admin revokes the passcode
    Sanctum::actingAs($admin);
    $this->deleteJson('/api/v1/settings/company/passcodes/' . $passcode->id)
        ->assertOk();

    // Device token should no longer be valid
    Sanctum::actingAs($supervisor);
    $this->postJson('/api/v1/settings/company/validate-device-token', [
        'device_token' => $deviceToken,
    ])->assertForbidden();
});
