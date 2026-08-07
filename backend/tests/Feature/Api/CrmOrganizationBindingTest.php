<?php

use App\Models\Lead;
use App\Support\OrganizationContext;
use Database\Seeders\WorkflowDefaultsSeeder;
use Laravel\Sanctum\Sanctum;

/**
 * Production requests start with a clear OrganizationContext. Tests that pre-set
 * context via apiUser() can hide a middleware-order bug where SubstituteBindings
 * runs before SetCurrentOrganization and org-scoped models always 404.
 */
it('resolves lead bindings from the organization header without a pre-set context', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    $orgId = (int) $admin->current_organization_id;
    $location = testLocationIds();

    $lead = Lead::create([
        'first_name' => 'Binding',
        'last_name' => 'Check',
        'email' => 'binding.check@lead.test',
        'status' => 'new',
        'priority' => 'medium',
        'created_by' => $admin->id,
        'source_type' => 'manual',
        ...$location,
    ]);

    // Simulate a fresh HTTP request (no leftover request-scoped org context).
    app(OrganizationContext::class)->clear();
    app(OrganizationContext::class)->bypassScope(false);

    Sanctum::actingAs($admin);

    $this->withHeader('X-Organization-Id', (string) $orgId)
        ->getJson("/api/v1/crm/leads/{$lead->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $lead->id);

    $this->withHeader('X-Organization-Id', (string) $orgId)
        ->patchJson("/api/v1/crm/leads/{$lead->id}", [
            'notes' => 'Updated after binding fix',
        ])
        ->assertOk()
        ->assertJsonPath('data.notes', 'Updated after binding fix');

    $this->withHeader('X-Organization-Id', (string) $orgId)
        ->postJson("/api/v1/crm/leads/{$lead->id}/activities", [
            'type' => 'note',
            'title' => 'Binding activity',
            'is_completed' => true,
        ])
        ->assertCreated();

    $this->withHeader('X-Organization-Id', (string) $orgId)
        ->postJson("/api/v1/crm/leads/{$lead->id}/followups", [
            'title' => 'Follow-up after binding fix',
            'content' => [
                'title' => 'Follow-up after binding fix',
                'description' => 'Should succeed once org middleware precedes bindings.',
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('success', true);

    $this->withHeader('X-Organization-Id', (string) $orgId)
        ->getJson("/api/v1/crm/leads/{$lead->id}/followups")
        ->assertOk()
        ->assertJsonPath('meta.pagination.total', 1);
});

it('lets staff read lead statuses for the CRM board', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $staff = apiUser('staff');
    $orgId = (string) $staff->current_organization_id;

    app(OrganizationContext::class)->clear();
    app(OrganizationContext::class)->bypassScope(false);

    Sanctum::actingAs($staff);

    $this->withHeader('X-Organization-Id', $orgId)
        ->getJson('/api/v1/crm/statuses?per_page=100')
        ->assertOk()
        ->assertJsonPath('success', true);
});
