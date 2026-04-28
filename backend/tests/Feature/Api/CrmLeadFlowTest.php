<?php

use App\Models\Lead;
use Database\Seeders\WorkflowDefaultsSeeder;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;

it('supports lead CRUD, activity tracking, and import flow', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $drive = $this->postJson('/api/v1/crm/drives', [
        'name' => 'Enterprise',
        'slug' => 'enterprise',
        'color' => '#1d4ed8',
        'position' => 3,
    ])->assertCreated()->json('data');

    $status = $this->postJson('/api/v1/crm/statuses', [
        'name' => 'Contacted+',
        'slug' => 'contacted-plus',
        'color' => '#0ea5e9',
        'position' => 7,
    ])->assertCreated()->json('data');

    $leadResponse = $this->postJson('/api/v1/crm/leads', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john.doe@lead.test',
        'company' => 'Acme',
        'status' => 'new',
        'priority' => 'high',
        'drive_id' => $drive['id'],
        'status_id' => $status['id'],
    ]);

    $leadResponse->assertCreated()->assertJsonPath('success', true);
    $leadId = $leadResponse->json('data.id');

    $activity = $this->postJson("/api/v1/crm/leads/{$leadId}/activities", [
        'type' => 'call',
        'title' => 'Discovery Call',
        'description' => 'Initial discovery call completed',
        'is_completed' => true,
    ]);

    $activity->assertCreated()->assertJsonPath('success', true);

    $csv = "first_name,last_name,email,company,status,priority\nAlice,Smith,alice@lead.test,Globex,new,medium\nBob,Lee,bob@lead.test,Initech,contacted,high\n";

    $importResponse = $this->postJson('/api/v1/crm/leads/import', [
        'file' => UploadedFile::fake()->createWithContent('leads.csv', $csv),
        'drive_id' => $drive['id'],
        'status_id' => $status['id'],
    ]);

    $importResponse->assertOk()
        ->assertJsonPath('data.imported', 2)
        ->assertJsonPath('success', true);

    expect(Lead::count())->toBeGreaterThanOrEqual(3);

    $list = $this->getJson('/api/v1/crm/leads?per_page=10');
    $list->assertOk()->assertJsonPath('success', true);
});
