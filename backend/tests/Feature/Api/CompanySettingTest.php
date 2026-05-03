<?php

use App\Models\CompanySetting;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// ─── GET /v1/settings/company ─────────────────────────────────────────────────

it('returns company settings for all roles', function (string $role) {
    $user = apiUser($role, ['email' => "company-get-{$role}@test.test"]);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/settings/company');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure(['data' => ['opening_time', 'closing_time', 'working_days']]);
})->with(['admin', 'supervisor', 'staff']);

it('rejects unauthenticated company settings requests', function () {
    $this->getJson('/api/v1/settings/company')->assertUnauthorized();
});

// ─── PATCH /v1/settings/company — admin access ───────────────────────────────

it('allows admin to update company settings without any extra headers', function () {
    $admin = apiUser('admin', ['email' => 'admin-company@test.test']);
    Sanctum::actingAs($admin);

    $response = $this->patchJson('/api/v1/settings/company', [
        'company_name' => 'FastLink Corp',
        'opening_time' => '08:00',
        'closing_time' => '17:00',
        'working_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.company_name', 'FastLink Corp')
        ->assertJsonPath('data.opening_time', '08:00:00')
        ->assertJsonPath('data.closing_time', '17:00:00');

    $settings = CompanySetting::first();
    expect($settings->company_name)->toBe('FastLink Corp')
        ->and($settings->closing_time)->toBe('17:00:00')
        ->and($settings->updated_by)->toBe($admin->id);
});

it('rejects company settings update from staff', function () {
    $staff = apiUser('staff', ['email' => 'staff-company@test.test']);
    Sanctum::actingAs($staff);

    $this->patchJson('/api/v1/settings/company', [
        'company_name' => 'Hacked Corp',
    ])->assertForbidden();
});

it('validates closing_time is after opening_time', function () {
    $admin = apiUser('admin', ['email' => 'admin-timeval@test.test']);
    Sanctum::actingAs($admin);

    $this->patchJson('/api/v1/settings/company', [
        'opening_time' => '17:00',
        'closing_time' => '09:00',
    ])->assertUnprocessable()
        ->assertJsonPath('errors.closing_time.0', 'The closing time must be after the opening time.');
});

it('rejects invalid working_days values', function () {
    $admin = apiUser('admin', ['email' => 'admin-days@test.test']);
    Sanctum::actingAs($admin);

    $this->patchJson('/api/v1/settings/company', [
        'working_days' => ['monday', 'funday'],
    ])->assertUnprocessable();
});

it('rejects empty working_days array', function () {
    $admin = apiUser('admin', ['email' => 'admin-empty-days@test.test']);
    Sanctum::actingAs($admin);

    $this->patchJson('/api/v1/settings/company', [
        'working_days' => [],
    ])->assertUnprocessable();
});

// ─── PATCH /v1/settings/company — supervisor must use access token ────────────

it('blocks supervisor from updating company settings without a token', function () {
    $supervisor = apiUser('supervisor', ['email' => 'sup-no-token@test.test']);
    Sanctum::actingAs($supervisor);

    $this->patchJson('/api/v1/settings/company', [
        'company_name' => 'Supervisor Change',
    ])->assertForbidden();
});

it('allows supervisor to update company settings with a valid session token', function () {
    $admin      = apiUser('admin', ['email' => 'admin-session@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-session@test.test']);

    // Admin generates a passcode for the supervisor
    Sanctum::actingAs($admin);
    $generateResponse = $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ]);
    $generateResponse->assertCreated();
    $plainPasscode = $generateResponse->json('data.plain_text');

    // Supervisor verifies passcode and obtains session token
    Sanctum::actingAs($supervisor);
    $verifyResponse = $this->postJson('/api/v1/settings/company/verify-passcode', [
        'passcode' => $plainPasscode,
    ]);
    $verifyResponse->assertOk();
    $sessionToken = $verifyResponse->json('data.session_token');

    // Supervisor updates company settings with session token header
    $updateResponse = $this->patchJson(
        '/api/v1/settings/company',
        ['company_name' => 'Supervisor Approved Co'],
        ['X-Supervisor-Session-Token' => $sessionToken],
    );

    $updateResponse->assertOk()
        ->assertJsonPath('data.company_name', 'Supervisor Approved Co');
});

it('allows supervisor to use a device token for repeated access without re-entering passcode', function () {
    $admin      = apiUser('admin', ['email' => 'admin-device@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-device@test.test']);

    // Admin generates passcode
    Sanctum::actingAs($admin);
    $plain = $this->postJson('/api/v1/settings/company/passcodes', [
        'supervisor_id' => $supervisor->id,
    ])->json('data.plain_text');

    // Supervisor verifies with remember_device = true
    Sanctum::actingAs($supervisor);
    $verifyResponse = $this->postJson('/api/v1/settings/company/verify-passcode', [
        'passcode'       => $plain,
        'remember_device' => true,
    ]);
    $verifyResponse->assertOk();
    $deviceToken = $verifyResponse->json('data.device_token');
    expect($deviceToken)->not->toBeNull();

    // Supervisor validates the device token
    $validateResponse = $this->postJson('/api/v1/settings/company/validate-device-token', [
        'device_token' => $deviceToken,
    ]);
    $validateResponse->assertOk()
        ->assertJsonPath('data.valid', true);

    // Supervisor uses device token to update settings
    $updateResponse = $this->patchJson(
        '/api/v1/settings/company',
        ['company_name' => 'Device-Token Co'],
        ['X-Supervisor-Device-Token' => $deviceToken],
    );
    $updateResponse->assertOk()
        ->assertJsonPath('data.company_name', 'Device-Token Co');
});

it('returns 403 when supervisor sends invalid session token', function () {
    $supervisor = apiUser('supervisor', ['email' => 'sup-bad-token@test.test']);
    Sanctum::actingAs($supervisor);

    $this->patchJson(
        '/api/v1/settings/company',
        ['company_name' => 'Bad Token Corp'],
        ['X-Supervisor-Session-Token' => 'totally-fake-token'],
    )->assertForbidden();
});
