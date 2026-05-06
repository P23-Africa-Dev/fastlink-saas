<?php

use App\Models\Lead;
use App\Models\LeadFollowup;
use App\Models\LeadFollowupUpdateRequest;
use App\Models\Notification as InAppNotification;
use App\Notifications\LeadFollowupApprovalRequestedNotification;
use Database\Seeders\WorkflowDefaultsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

function createLeadForFollowup(int $creatorId, ?int $assignedTo = null): Lead
{
    return Lead::create([
        'first_name' => 'John',
        'last_name' => 'Joshua',
        'email' => 'john.joshua@example.test',
        'status' => 'new',
        'priority' => 'medium',
        'created_by' => $creatorId,
        'assigned_to' => $assignedTo,
    ]);
}

it('creates followup and supports timeline with multiple followups', function () {
    $this->seed(WorkflowDefaultsSeeder::class);
    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $lead = createLeadForFollowup($admin->id);

    $this->postJson("/api/v1/crm/leads/{$lead->id}/followups", [
        'title' => 'Email Sent',
        'content' => [
            'title' => 'Email Sent',
            'description' => 'Pricing proposal emailed to client.',
        ],
        'form_schema' => [
            'fields' => [
                ['label' => 'Title', 'type' => 'text', 'required' => true],
                ['label' => 'Description', 'type' => 'textarea', 'required' => true],
            ],
        ],
    ])->assertCreated();

    $this->postJson("/api/v1/crm/leads/{$lead->id}/followups", [
        'title' => 'Client Replied',
        'content' => [
            'title' => 'Client Replied',
            'description' => 'Client asked for discount options.',
        ],
    ])->assertCreated();

    $response = $this->getJson("/api/v1/crm/leads/{$lead->id}/followups?per_page=50");
    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('meta.pagination.total', 2)
        ->assertJsonCount(2, 'data');
});

it('updates followup directly when approval is not required (same creator)', function () {
    $this->seed(WorkflowDefaultsSeeder::class);
    $staff = apiUser('staff');
    Sanctum::actingAs($staff);

    $lead = createLeadForFollowup($staff->id);
    $followup = LeadFollowup::create([
        'lead_id' => $lead->id,
        'created_by' => $staff->id,
        'title' => 'Call Done',
        'content' => ['description' => 'Initial call'],
    ]);

    $response = $this->putJson("/api/v1/crm/followups/{$followup->id}", [
        'title' => 'Call Done Updated',
        'content' => ['description' => 'Updated by owner'],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.mode', 'updated')
        ->assertJsonPath('data.followup.title', 'Call Done Updated');

    expect(LeadFollowupUpdateRequest::count())->toBe(0);
});

it('submits pending update request when approval is required and sends email plus in-app/device notifications', function () {
    $this->seed(WorkflowDefaultsSeeder::class);
    Notification::fake();

    $creatorAdmin = apiUser('admin', ['email' => 'creator-admin@fastlink.test']);
    $staff = apiUser('staff', ['email' => 'modifier-staff@fastlink.test']);
    Sanctum::actingAs($staff);

    $lead = createLeadForFollowup($creatorAdmin->id, $staff->id);
    $followup = LeadFollowup::create([
        'lead_id' => $lead->id,
        'created_by' => $creatorAdmin->id,
        'title' => 'Proposal Shared',
        'content' => ['description' => 'Proposal v1 sent'],
    ]);

    $response = $this->putJson("/api/v1/crm/followups/{$followup->id}", [
        'title' => 'Proposal Shared - Updated',
        'content' => ['description' => 'Requesting edits'],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.mode', 'approval_required');

    $request = LeadFollowupUpdateRequest::query()->first();
    expect($request)->not->toBeNull();
    expect($request->status)->toBe(LeadFollowupUpdateRequest::STATUS_PENDING);

    Notification::assertSentTo($creatorAdmin, LeadFollowupApprovalRequestedNotification::class);

    $dbNotif = InAppNotification::query()
        ->where('type', 'crm.followup.approval_requested')
        ->latest('id')
        ->first();

    expect($dbNotif)->not->toBeNull();
    expect((bool) ($dbNotif->metadata['device_recommended'] ?? false))->toBeTrue();
});

it('approves a pending followup update and applies proposed changes', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $creatorAdmin = apiUser('admin', ['email' => 'approver-admin@fastlink.test']);
    $supervisor = apiUser('supervisor', ['email' => 'modifier-supervisor@fastlink.test']);

    $lead = createLeadForFollowup($creatorAdmin->id);
    $followup = LeadFollowup::create([
        'lead_id' => $lead->id,
        'created_by' => $creatorAdmin->id,
        'title' => 'Meeting Done',
        'content' => ['description' => 'Meeting summary'],
    ]);

    Sanctum::actingAs($supervisor);
    $this->putJson("/api/v1/crm/followups/{$followup->id}", [
        'title' => 'Meeting Done Edited',
    ])->assertOk()->assertJsonPath('data.mode', 'approval_required');

    Sanctum::actingAs($creatorAdmin);
    $approve = $this->postJson("/api/v1/crm/followups/{$followup->id}/approve", [
        'reason' => 'Looks good',
    ]);

    $approve->assertOk()->assertJsonPath('data.title', 'Meeting Done Edited');

    $pending = LeadFollowupUpdateRequest::first();
    expect($pending->status)->toBe(LeadFollowupUpdateRequest::STATUS_APPROVED);
});

it('rejects a pending followup update and preserves original data', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $creatorAdmin = apiUser('admin', ['email' => 'reject-admin@fastlink.test']);
    $staff = apiUser('staff', ['email' => 'reject-staff@fastlink.test']);

    $lead = createLeadForFollowup($creatorAdmin->id);
    $followup = LeadFollowup::create([
        'lead_id' => $lead->id,
        'created_by' => $creatorAdmin->id,
        'title' => 'Original Title',
        'content' => ['description' => 'Original'],
    ]);

    Sanctum::actingAs($staff);
    $this->putJson("/api/v1/crm/followups/{$followup->id}", [
        'title' => 'Changed Title',
    ])->assertOk()->assertJsonPath('data.mode', 'approval_required');

    Sanctum::actingAs($creatorAdmin);
    $reject = $this->postJson("/api/v1/crm/followups/{$followup->id}/reject", [
        'reason' => 'Not accurate',
    ]);

    $reject->assertOk()->assertJsonPath('data.title', 'Original Title');

    $pending = LeadFollowupUpdateRequest::first();
    expect($pending->status)->toBe(LeadFollowupUpdateRequest::STATUS_REJECTED);
});

it('prevents unauthorized approval and duplicate/concurrent pending updates', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $creatorAdmin = apiUser('admin', ['email' => 'con-admin@fastlink.test']);
    $staffA = apiUser('staff', ['email' => 'con-staffa@fastlink.test']);
    $staffB = apiUser('staff', ['email' => 'con-staffb@fastlink.test']);

    $lead = createLeadForFollowup($creatorAdmin->id);
    $followup = LeadFollowup::create([
        'lead_id' => $lead->id,
        'created_by' => $creatorAdmin->id,
        'title' => 'Concurrent Check',
        'content' => ['description' => 'Base'],
    ]);

    Sanctum::actingAs($staffA);
    $this->putJson("/api/v1/crm/followups/{$followup->id}", [
        'title' => 'Pending Change A',
    ])->assertOk()->assertJsonPath('data.mode', 'approval_required');

    Sanctum::actingAs($staffB);
    $second = $this->putJson("/api/v1/crm/followups/{$followup->id}", [
        'title' => 'Pending Change B',
    ]);
    $second->assertStatus(422);

    $unauthorizedApprove = $this->postJson("/api/v1/crm/followups/{$followup->id}/approve", []);
    $unauthorizedApprove->assertStatus(422);
});

it('validates schema and supports attachment upload with authenticated download', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin', ['email' => 'attach-admin@fastlink.test']);
    Sanctum::actingAs($admin);

    $lead = createLeadForFollowup($admin->id);

    $invalid = $this->postJson("/api/v1/crm/leads/{$lead->id}/followups", [
        'title' => 'Invalid Schema',
        'content' => ['description' => 'x'],
        'form_schema' => [
            'fields' => [
                ['label' => 'Bad field', 'type' => 'unsupported'],
            ],
        ],
    ]);
    $invalid->assertStatus(422);

    $create = $this->postJson("/api/v1/crm/leads/{$lead->id}/followups", [
        'title' => 'With Attachment',
        'content' => ['description' => 'Attachment included'],
        'attachments' => [UploadedFile::fake()->create('notes.pdf', 120, 'application/pdf')],
    ]);

    $create->assertCreated();
    $followupId = $create->json('data.id');
    $attachmentId = $create->json('data.attachments.0.id');

    $download = $this->get("/api/v1/crm/followups/{$followupId}/attachments/{$attachmentId}/download");
    $download->assertOk();
});
