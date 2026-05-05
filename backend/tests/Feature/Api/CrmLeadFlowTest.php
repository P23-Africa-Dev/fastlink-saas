<?php

use App\Enums\Industry;
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

it('returns canonical industry list endpoint', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/industries');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.0', Industry::TECHNOLOGY_SOFTWARE->value);
});

it('enforces strict industry values on manual lead creation but allows empty', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $valid = $this->postJson('/api/v1/crm/leads', [
        'first_name' => 'Industry',
        'email' => 'industry.valid@lead.test',
        'industry' => 'technology / software',
    ]);

    $valid->assertCreated()
        ->assertJsonPath('data.industry', Industry::TECHNOLOGY_SOFTWARE->value);

    $empty = $this->postJson('/api/v1/crm/leads', [
        'first_name' => 'NoIndustry',
        'email' => 'industry.empty@lead.test',
    ]);

    $empty->assertCreated()->assertJsonPath('data.industry', null);

    $invalid = $this->postJson('/api/v1/crm/leads', [
        'first_name' => 'BadIndustry',
        'email' => 'industry.invalid@lead.test',
        'industry' => 'Space Mining',
    ]);

    $invalid->assertStatus(422)->assertJsonPath('success', false);
});

it('normalizes and safely defaults industry during import', function () {
    $this->seed(WorkflowDefaultsSeeder::class);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $csv = "first_name,last_name,email,company,industry\n"
        . "Alice,Smith,industry.alice@lead.test,Globex, technology / software \n"
        . "Bob,Lee,industry.bob@lead.test,Initech,Unknown Vertical\n"
        . "Cara,Jones,industry.cara@lead.test,Initrode,\n";

    $response = $this->postJson('/api/v1/crm/leads/import', [
        'file' => UploadedFile::fake()->createWithContent('industry-import.csv', $csv),
    ]);

    $response->assertOk()->assertJsonPath('data.imported', 3);

    expect(Lead::query()->where('email', 'industry.alice@lead.test')->value('industry'))
        ->toBe(Industry::TECHNOLOGY_SOFTWARE->value);

    expect(Lead::query()->where('email', 'industry.bob@lead.test')->value('industry'))
        ->toBe(Industry::NOT_SPECIFIED->value);

    expect(Lead::query()->where('email', 'industry.cara@lead.test')->value('industry'))
        ->toBeNull();
});
