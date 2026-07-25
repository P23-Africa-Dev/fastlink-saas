<?php

use App\Models\Lead;
use App\Models\LeadDrive;
use App\Models\Organization;
use App\Models\User;
use App\Support\OrganizationContext;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

it('isolates drives and leads between organizations', function () {
    $orgA = ensureTestOrganization('org-a', 'Org A');
    $orgB = ensureTestOrganization('org-b', 'Org B');

    $adminA = apiUser('admin', ['email' => 'admin-a@test.test'], $orgA);
    $adminB = apiUser('admin', ['email' => 'admin-b@test.test'], $orgB);

    Sanctum::actingAs($adminA);
    app(OrganizationContext::class)->set($orgA);
    setPermissionsTeamId($orgA->id);

    $driveA = $this->withHeader('X-Organization-Id', (string) $orgA->id)
        ->postJson('/api/v1/crm/drives', [
            'name' => 'Secret A',
            'slug' => 'secret-a',
            'is_private' => false,
        ])->assertCreated()->json('data');

    Lead::withoutOrganizationScope()->create([
        'organization_id' => $orgA->id,
        'first_name' => 'Only',
        'last_name' => 'InA',
        'email' => 'only-a@test.test',
        'status' => 'new',
        'drive_id' => $driveA['id'],
        'created_by' => $adminA->id,
        'source_type' => 'manual',
    ]);

    Sanctum::actingAs($adminB);
    $ids = collect(
        $this->withHeader('X-Organization-Id', (string) $orgB->id)
            ->getJson('/api/v1/crm/drives')
            ->assertOk()
            ->json('data')
    )->pluck('id');

    expect($ids)->not->toContain($driveA['id']);

    $leadIds = collect(
        $this->withHeader('X-Organization-Id', (string) $orgB->id)
            ->getJson('/api/v1/crm/leads')
            ->assertOk()
            ->json('data')
    )->pluck('email');

    expect($leadIds)->not->toContain('only-a@test.test');
});

it('allows the same user different roles across organizations', function () {
    $orgA = ensureTestOrganization('role-a', 'Role A');
    $orgB = ensureTestOrganization('role-b', 'Role B');

    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create([
        'email' => 'multi-role@test.test',
        'password' => Hash::make('password123'),
        'current_organization_id' => $orgA->id,
    ]);

    app(\App\Services\OrganizationProvisioner::class)->addMembership($orgA, $user, 'admin');
    app(\App\Services\OrganizationProvisioner::class)->addMembership($orgB, $user, 'staff');

    setPermissionsTeamId($orgA->id);
    $user->unsetRelation('roles');
    expect($user->hasRole('admin'))->toBeTrue();
    expect($user->hasRole('staff'))->toBeFalse();

    setPermissionsTeamId($orgB->id);
    $user->unsetRelation('roles');
    expect($user->hasRole('staff'))->toBeTrue();
    expect($user->hasRole('admin'))->toBeFalse();
});

it('switches organization context via API', function () {
    $orgA = ensureTestOrganization('switch-a', 'Switch A');
    $orgB = ensureTestOrganization('switch-b', 'Switch B');

    $user = apiUser('admin', ['email' => 'switcher@test.test'], $orgA);
    app(\App\Services\OrganizationProvisioner::class)->addMembership($orgB, $user, 'supervisor');

    Sanctum::actingAs($user);

    $this->withHeader('X-Organization-Id', (string) $orgA->id)
        ->postJson('/api/v1/auth/organizations/' . $orgB->id . '/switch')
        ->assertOk()
        ->assertJsonPath('data.current_organization_id', $orgB->id)
        ->assertJsonPath('data.current_organization.role', 'supervisor');

    expect($user->fresh()->current_organization_id)->toBe($orgB->id);
});

it('restricts platform org creation to super admins', function () {
    $org = ensureTestOrganization();
    $admin = apiUser('admin', ['email' => 'org-admin-not-super@test.test'], $org);
    $admin->forceFill(['is_super_admin' => false])->save();

    Sanctum::actingAs($admin);
    $this->withHeader('X-Organization-Id', (string) $org->id)
        ->postJson('/api/v1/platform/organizations', [
            'name' => 'Blocked Org',
            'admin_email' => 'blocked-admin@test.test',
        ])->assertForbidden();

    $super = apiUser('admin', ['email' => 'super@test.test'], $org);
    $super->forceFill(['is_super_admin' => true])->save();

    Sanctum::actingAs($super);
    $this->withHeader('X-Organization-Id', (string) $org->id)
        ->postJson('/api/v1/platform/organizations', [
            'name' => 'New Customer Org',
            'slug' => 'new-customer-org',
            'admin_email' => 'customer-admin@test.test',
            'admin_name' => 'Customer Admin',
        ])->assertCreated()
        ->assertJsonPath('data.organization.slug', 'new-customer-org');

    expect(Organization::query()->where('slug', 'new-customer-org')->exists())->toBeTrue();
    expect(LeadDrive::withoutOrganizationScope()->where('organization_id', Organization::query()->where('slug', 'new-customer-org')->value('id'))->count())->toBeGreaterThan(0);
});

it('isolates dashboard lead stats between organizations', function () {
    $orgA = ensureTestOrganization('dash-a', 'Dash A');
    $orgB = ensureTestOrganization('dash-b', 'Dash B');

    $adminA = apiUser('admin', ['email' => 'dash-admin-a@test.test'], $orgA);
    $adminB = apiUser('admin', ['email' => 'dash-admin-b@test.test'], $orgB);

    app(OrganizationContext::class)->set($orgA);
    Lead::withoutOrganizationScope()->create([
        'organization_id' => $orgA->id,
        'first_name' => 'Only',
        'last_name' => 'InA',
        'email' => 'dash-lead-a@test.test',
        'status' => 'new',
        'created_by' => $adminA->id,
        'source_type' => 'manual',
    ]);
    Lead::withoutOrganizationScope()->create([
        'organization_id' => $orgA->id,
        'first_name' => 'Second',
        'last_name' => 'InA',
        'email' => 'dash-lead-a2@test.test',
        'status' => 'new',
        'created_by' => $adminA->id,
        'source_type' => 'manual',
    ]);

    Sanctum::actingAs($adminB);
    $statsB = $this->withHeader('X-Organization-Id', (string) $orgB->id)
        ->getJson('/api/v1/dashboard/stats')
        ->assertOk()
        ->json('data.overview');

    expect($statsB['leads_total'])->toBe(0);

    Sanctum::actingAs($adminA);
    $statsA = $this->withHeader('X-Organization-Id', (string) $orgA->id)
        ->getJson('/api/v1/dashboard/stats')
        ->assertOk()
        ->json('data.overview');

    expect($statsA['leads_total'])->toBe(2);
});

it('accepts invitations for new users', function () {
    Notification::fake();

    $org = ensureTestOrganization('invite-org', 'Invite Org');
    $admin = apiUser('admin', ['email' => 'invite-admin@test.test'], $org);

    Sanctum::actingAs($admin);
    $invite = $this->withHeader('X-Organization-Id', (string) $org->id)
        ->postJson('/api/v1/organizations/invitations', [
            'email' => 'newbie@test.test',
            'role' => 'staff',
        ])->assertCreated()->json('data');

    Notification::assertSentOnDemand(\App\Notifications\OrganizationInvitationNotification::class);

    $this->postJson('/api/v1/invitations/accept', [
        'token' => $invite['token'],
        'name' => 'Newbie',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertOk()
        ->assertJsonPath('data.user.email', 'newbie@test.test');

    $newbie = User::query()->where('email', 'newbie@test.test')->first();
    expect($newbie)->not->toBeNull();
    expect($newbie->current_organization_id)->toBe($org->id);

    setPermissionsTeamId($org->id);
    expect($newbie->hasRole('staff'))->toBeTrue();
});
