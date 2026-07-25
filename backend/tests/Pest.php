<?php

use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use App\Support\OrganizationContext;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()->beforeEach(function () {
    // Keep attendance auto-clock-out deterministic across Feature tests.
    Carbon::setTestNow(Carbon::parse('2026-05-08 12:00:00', config('app.timezone')));
    app(OrganizationContext::class)->clear();
    app(OrganizationContext::class)->bypassScope(false);
    setPermissionsTeamId(null);
})->in('Feature');

pest()->afterEach(function () {
    Carbon::setTestNow();
    app(OrganizationContext::class)->clear();
    setPermissionsTeamId(null);
})->in('Feature');

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/**
 * Create a user with an organization membership and set request org context.
 */
function apiUser(string $role = 'admin', array $attributes = [], ?Organization $organization = null): User
{
    /** @var TestCase $test */
    $test = test();
    $test->seed(RolePermissionSeeder::class);

    $organization ??= ensureTestOrganization();

    $user = User::factory()->create(array_merge([
        'password' => Hash::make('password123'),
        'current_organization_id' => $organization->id,
    ], $attributes));

    OrganizationUser::query()->updateOrCreate(
        [
            'organization_id' => $organization->id,
            'user_id' => $user->id,
        ],
        [
            'status' => 'active',
            'joined_at' => now(),
        ]
    );

    setPermissionsTeamId($organization->id);
    $user->syncRoles([$role]);

    app(OrganizationContext::class)->set($organization);
    app(OrganizationContext::class)->bypassScope(false);

    return $user->fresh();
}

function ensureTestOrganization(string $slug = 'fastlink', string $name = 'FastLink'): Organization
{
    $org = Organization::query()->firstOrCreate(
        ['slug' => $slug],
        [
            'name' => $name,
            'status' => 'active',
            'timezone' => 'UTC',
        ]
    );

    // Ensure company settings + default workflows exist for the org
    app(\App\Services\OrganizationProvisioner::class)->bootstrapOrganization($org);

    app(OrganizationContext::class)->set($org);
    app(OrganizationContext::class)->bypassScope(false);
    setPermissionsTeamId($org->id);

    return $org;
}

/**
 * Minimal country/state/lga fixture for lead create requests.
 *
 * @return array{country_id: int, state_id: int, lga_id: int}
 */
function testLocationIds(): array
{
    \Illuminate\Support\Facades\DB::table('countries')->updateOrInsert(
        ['code' => 'NG'],
        ['name' => 'Nigeria', 'created_at' => now(), 'updated_at' => now()]
    );
    $countryId = (int) \Illuminate\Support\Facades\DB::table('countries')->where('code', 'NG')->value('id');

    \Illuminate\Support\Facades\DB::table('states')->updateOrInsert(
        ['country_id' => $countryId, 'name' => 'Lagos'],
        ['created_at' => now(), 'updated_at' => now()]
    );
    $stateId = (int) \Illuminate\Support\Facades\DB::table('states')
        ->where('country_id', $countryId)
        ->where('name', 'Lagos')
        ->value('id');

    \Illuminate\Support\Facades\DB::table('lgas')->updateOrInsert(
        ['state_id' => $stateId, 'name' => 'Ikeja'],
        ['created_at' => now(), 'updated_at' => now()]
    );
    $lgaId = (int) \Illuminate\Support\Facades\DB::table('lgas')
        ->where('state_id', $stateId)
        ->where('name', 'Ikeja')
        ->value('id');

    return [
        'country_id' => $countryId,
        'state_id' => $stateId,
        'lga_id' => $lgaId,
    ];
}

/**
 * Act as a user with the X-Organization-Id header set.
 */
function actingAsOrgUser(User $user, ?Organization $organization = null)
{
    $organization ??= Organization::query()->find($user->current_organization_id) ?? ensureTestOrganization();

    app(OrganizationContext::class)->set($organization);
    app(OrganizationContext::class)->bypassScope(false);
    setPermissionsTeamId($organization->id);

    return test()->withHeader('X-Organization-Id', (string) $organization->id)
        ->actingAs($user, 'sanctum');
}

function connectTestGoogleCalendar(User $user, string $email = 'organizer@gmail.com'): \App\Models\GoogleCalendarAccount
{
    return \App\Models\GoogleCalendarAccount::query()->updateOrCreate(
        ['user_id' => $user->id],
        [
            'google_email' => $email,
            'calendar_id' => 'primary',
            'access_token' => 'access-token',
            'refresh_token' => 'refresh-token',
            'token_expires_at' => now()->addHour(),
            'connected_at' => now(),
        ]
    );
}
