<?php

use App\Models\Lead;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function platformSuperAdmin(?Organization $org = null): User
{
    $org ??= ensureTestOrganization();
    $super = apiUser('admin', ['email' => 'platform-super@test.test'], $org);
    $super->forceFill(['is_super_admin' => true])->save();

    return $super->fresh();
}

it('allows super admin to view organization detail with stats and members', function () {
    $org = ensureTestOrganization('show-org', 'Show Org');
    $super = platformSuperAdmin();

    Lead::withoutOrganizationScope()->create([
        'organization_id' => $org->id,
        'first_name' => 'Test',
        'last_name' => 'Lead',
        'email' => 'show-lead@test.test',
        'status' => 'new',
        'created_by' => $super->id,
        'source_type' => 'manual',
    ]);

    Sanctum::actingAs($super);

    $this->withHeader('X-Organization-Id', (string) $org->id)
        ->getJson('/api/v1/platform/organizations/' . $org->id)
        ->assertOk()
        ->assertJsonPath('data.organization.slug', 'show-org')
        ->assertJsonPath('data.stats.leads', 1)
        ->assertJsonStructure([
            'data' => [
                'organization' => ['id', 'name', 'slug', 'status', 'timezone', 'created_at', 'memberships_count'],
                'creator',
                'stats' => ['members', 'leads', 'projects', 'tasks', 'meetings'],
            ],
        ]);

    $this->withHeader('X-Organization-Id', (string) $org->id)
        ->getJson('/api/v1/platform/organizations/' . $org->id . '/members')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'status', 'joined_at', 'role', 'user' => ['id', 'name', 'email']],
            ],
        ]);
});

it('allows super admin to patch organization name and timezone', function () {
    $org = ensureTestOrganization('patch-org', 'Patch Org');
    $super = platformSuperAdmin();

    Sanctum::actingAs($super);

    $this->withHeader('X-Organization-Id', (string) $org->id)
        ->patchJson('/api/v1/platform/organizations/' . $org->id, [
            'name' => 'Renamed Org',
            'timezone' => 'Africa/Lagos',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed Org')
        ->assertJsonPath('data.timezone', 'Africa/Lagos');

    expect($org->fresh()->name)->toBe('Renamed Org');
});

it('allows super admin to delete an organization with confirm_slug', function () {
    $parentOrg = ensureTestOrganization();
    $super = platformSuperAdmin($parentOrg);

    Sanctum::actingAs($super);
    $created = $this->withHeader('X-Organization-Id', (string) $parentOrg->id)
        ->postJson('/api/v1/platform/organizations', [
            'name' => 'Disposable Org',
            'slug' => 'disposable-org',
            'admin_email' => 'disposable-admin@test.test',
        ])
        ->assertCreated()
        ->json('data.organization');

    $targetId = $created['id'];
    $adminEmail = 'disposable-admin@test.test';
    $admin = User::query()->where('email', $adminEmail)->first();
    expect($admin->current_organization_id)->toBe($targetId);

    $this->withHeader('X-Organization-Id', (string) $parentOrg->id)
        ->deleteJson('/api/v1/platform/organizations/' . $targetId, [
            'confirm_slug' => 'disposable-org',
        ])
        ->assertOk();

    expect(Organization::query()->find($targetId))->toBeNull();
    expect(OrganizationUser::query()->where('organization_id', $targetId)->count())->toBe(0);
    expect($admin->fresh()->current_organization_id)->not->toBe($targetId);
});

it('blocks deleting the fastlink organization', function () {
    $fastlink = ensureTestOrganization('fastlink', 'FastLink');
    $super = platformSuperAdmin($fastlink);

    Sanctum::actingAs($super);

    $this->withHeader('X-Organization-Id', (string) $fastlink->id)
        ->deleteJson('/api/v1/platform/organizations/' . $fastlink->id, [
            'confirm_slug' => 'fastlink',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['organization']);

    expect(Organization::query()->where('slug', 'fastlink')->exists())->toBeTrue();
});

it('blocks deleting an organization with wrong confirm_slug', function () {
    $parentOrg = ensureTestOrganization('guard-parent', 'Guard Parent');
    $target = ensureTestOrganization('guard-target', 'Guard Target');
    $super = platformSuperAdmin($parentOrg);

    Sanctum::actingAs($super);

    $this->withHeader('X-Organization-Id', (string) $parentOrg->id)
        ->deleteJson('/api/v1/platform/organizations/' . $target->id, [
            'confirm_slug' => 'wrong-slug',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['confirm_slug']);

    expect(Organization::query()->find($target->id))->not->toBeNull();
});

it('restricts platform organization management to super admins', function () {
    $org = ensureTestOrganization('restrict-org', 'Restrict Org');
    $admin = apiUser('admin', ['email' => 'restrict-admin@test.test'], $org);
    $admin->forceFill(['is_super_admin' => false])->save();

    Sanctum::actingAs($admin);

    $this->withHeader('X-Organization-Id', (string) $org->id)
        ->getJson('/api/v1/platform/organizations/' . $org->id)
        ->assertForbidden();

    $this->withHeader('X-Organization-Id', (string) $org->id)
        ->patchJson('/api/v1/platform/organizations/' . $org->id, ['name' => 'Hacked'])
        ->assertForbidden();

    $this->withHeader('X-Organization-Id', (string) $org->id)
        ->deleteJson('/api/v1/platform/organizations/' . $org->id, ['confirm_slug' => 'restrict-org'])
        ->assertForbidden();

    $this->withHeader('X-Organization-Id', (string) $org->id)
        ->getJson('/api/v1/platform/organizations/' . $org->id . '/members')
        ->assertForbidden();
});
