<?php

use App\Models\CompanySetting;
use App\Models\Lead;
use Database\Seeders\WorkflowDefaultsSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->seed(WorkflowDefaultsSeeder::class);
    CompanySetting::singleton()->update([
        'pipeline_privacy' => CompanySetting::defaultPipelinePrivacy(),
    ]);
});

it('allows staff to create private pipelines and hides them from other staff', function () {
    $staffA = apiUser('staff', ['email' => 'staff-a-privacy@test.test']);
    $staffB = apiUser('staff', ['email' => 'staff-b-privacy@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-privacy@test.test']);
    $admin = apiUser('admin', ['email' => 'admin-privacy@test.test']);

    Sanctum::actingAs($staffA);
    $drive = $this->postJson('/api/v1/crm/drives', [
        'name' => 'Staff Private',
        'slug' => 'staff-private-' . uniqid(),
        'is_private' => true,
    ])->assertCreated()->json('data');

    expect($drive['is_private'])->toBeTrue()
        ->and($drive['privacy_locked_by_role'])->toBe('staff')
        ->and($drive['created_by'])->toBe($staffA->id);

    Sanctum::actingAs($staffA);
    $this->getJson('/api/v1/crm/drives')->assertOk()
        ->assertJsonFragment(['id' => $drive['id']]);

    Sanctum::actingAs($staffB);
    $ids = collect($this->getJson('/api/v1/crm/drives')->assertOk()->json('data'))->pluck('id');
    expect($ids)->not->toContain($drive['id']);

    Sanctum::actingAs($supervisor);
    $this->getJson('/api/v1/crm/drives')->assertOk()
        ->assertJsonFragment(['id' => $drive['id']]);

    Sanctum::actingAs($admin);
    $this->getJson('/api/v1/crm/drives')->assertOk()
        ->assertJsonFragment(['id' => $drive['id']]);
});

it('hides supervisor-private pipelines from other supervisors and staff', function () {
    $supervisorA = apiUser('supervisor', ['email' => 'sup-a-privacy@test.test']);
    $supervisorB = apiUser('supervisor', ['email' => 'sup-b-privacy@test.test']);
    $staff = apiUser('staff', ['email' => 'staff-sup-privacy@test.test']);
    $admin = apiUser('admin', ['email' => 'admin-sup-privacy@test.test']);

    Sanctum::actingAs($supervisorA);
    $drive = $this->postJson('/api/v1/crm/drives', [
        'name' => 'Supervisor Private',
        'slug' => 'sup-private-' . uniqid(),
        'is_private' => true,
    ])->assertCreated()->json('data');

    expect($drive['privacy_locked_by_role'])->toBe('supervisor');

    Sanctum::actingAs($supervisorB);
    $ids = collect($this->getJson('/api/v1/crm/drives')->assertOk()->json('data'))->pluck('id');
    expect($ids)->not->toContain($drive['id']);

    Sanctum::actingAs($staff);
    $ids = collect($this->getJson('/api/v1/crm/drives')->assertOk()->json('data'))->pluck('id');
    expect($ids)->not->toContain($drive['id']);

    Sanctum::actingAs($admin);
    $this->getJson('/api/v1/crm/drives')->assertOk()
        ->assertJsonFragment(['id' => $drive['id']]);
});

it('hides admin-private pipelines from staff and supervisors', function () {
    $admin = apiUser('admin', ['email' => 'admin-only-privacy@test.test']);
    $supervisor = apiUser('supervisor', ['email' => 'sup-admin-privacy@test.test']);
    $staff = apiUser('staff', ['email' => 'staff-admin-privacy@test.test']);

    Sanctum::actingAs($admin);
    $drive = $this->postJson('/api/v1/crm/drives', [
        'name' => 'Admin Private',
        'slug' => 'admin-private-' . uniqid(),
        'is_private' => true,
    ])->assertCreated()->json('data');

    Sanctum::actingAs($supervisor);
    $ids = collect($this->getJson('/api/v1/crm/drives')->assertOk()->json('data'))->pluck('id');
    expect($ids)->not->toContain($drive['id']);

    Sanctum::actingAs($staff);
    $ids = collect($this->getJson('/api/v1/crm/drives')->assertOk()->json('data'))->pluck('id');
    expect($ids)->not->toContain($drive['id']);
});

it('scopes leads by pipeline privacy', function () {
    $staffA = apiUser('staff', ['email' => 'staff-lead-a@test.test']);
    $staffB = apiUser('staff', ['email' => 'staff-lead-b@test.test']);

    Sanctum::actingAs($staffA);
    $drive = $this->postJson('/api/v1/crm/drives', [
        'name' => 'Lead Privacy Drive',
        'slug' => 'lead-privacy-' . uniqid(),
        'is_private' => true,
    ])->assertCreated()->json('data');

    $lead = Lead::create([
        'first_name' => 'Hidden',
        'last_name' => 'Lead',
        'email' => 'hidden-lead-' . uniqid() . '@test.test',
        'status' => 'new',
        'drive_id' => $drive['id'],
        'created_by' => $staffA->id,
        'source_type' => 'manual',
    ]);

    Sanctum::actingAs($staffA);
    $this->getJson('/api/v1/crm/leads')->assertOk()
        ->assertJsonFragment(['id' => $lead->id]);

    Sanctum::actingAs($staffB);
    $ids = collect($this->getJson('/api/v1/crm/leads')->assertOk()->json('data'))->pluck('id');
    expect($ids)->not->toContain($lead->id);

    $this->getJson('/api/v1/crm/leads/' . $lead->id)->assertNotFound();
});

it('forces staff pipelines private when open creation is disabled', function () {
    CompanySetting::singleton()->update([
        'pipeline_privacy' => array_merge(CompanySetting::defaultPipelinePrivacy(), [
            'staff_can_create_open_pipelines' => false,
        ]),
    ]);

    $staff = apiUser('staff', ['email' => 'staff-force-private@test.test']);
    Sanctum::actingAs($staff);

    $drive = $this->postJson('/api/v1/crm/drives', [
        'name' => 'Forced Private',
        'slug' => 'forced-private-' . uniqid(),
        'is_private' => false,
    ])->assertCreated()->json('data');

    expect($drive['is_private'])->toBeTrue()
        ->and($drive['privacy_locked_by_role'])->toBe('staff');
});

it('updates company pipeline privacy settings', function () {
    $admin = apiUser('admin', ['email' => 'admin-pipeline-settings@test.test']);
    Sanctum::actingAs($admin);

    $this->patchJson('/api/v1/settings/company', [
        'pipeline_privacy' => [
            'enabled' => true,
            'staff_can_create_pipelines' => false,
            'staff_can_create_open_pipelines' => false,
            'default_visibility' => 'private',
            'higher_roles_can_unlock' => true,
        ],
    ])->assertOk()
        ->assertJsonPath('data.pipeline_privacy.staff_can_create_pipelines', false)
        ->assertJsonPath('data.pipeline_privacy.default_visibility', 'private');

    $staff = apiUser('staff', ['email' => 'staff-blocked-create@test.test']);
    Sanctum::actingAs($staff);
    $this->postJson('/api/v1/crm/drives', [
        'name' => 'Blocked',
        'slug' => 'blocked-' . uniqid(),
    ])->assertForbidden();
});

it('rejects private pipelines as company default', function () {
    $admin = apiUser('admin', ['email' => 'admin-default-private@test.test']);
    Sanctum::actingAs($admin);

    $this->postJson('/api/v1/crm/drives', [
        'name' => 'Private Default',
        'slug' => 'private-default-' . uniqid(),
        'is_private' => true,
        'is_default' => true,
    ])->assertStatus(422);
});
