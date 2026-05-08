<?php

use App\Models\Country;
use App\Models\Lead;
use App\Models\LeadDrive;
use App\Models\Lga;
use App\Models\State;
use Carbon\Carbon;
use Database\Seeders\WorkflowDefaultsSeeder;
use Laravel\Sanctum\Sanctum;

function setupTestLocationData(): array
{
    $country = Country::firstOrCreate(['code' => 'NG'], ['name' => 'Nigeria']);
    $state = State::firstOrCreate(
        ['country_id' => $country->id, 'name' => 'Lagos'],
        ['country_id' => $country->id]
    );
    $lga = Lga::firstOrCreate(
        ['state_id' => $state->id, 'name' => 'Ikeja'],
        ['state_id' => $state->id]
    );

    return ['country' => $country, 'state' => $state, 'lga' => $lga];
}

function createAnalyticsLead(array $overrides = []): Lead
{
    static $n = 0;
    $n++;

    return Lead::create(array_merge([
        'first_name' => 'Lead',
        'last_name' => 'User ' . $n,
        'email' => "lead.analytics.{$n}@example.test",
        'source' => 'manual',
        'source_type' => 'manual',
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ], $overrides));
}

it('restricts lead analytics endpoints to admin and supervisor', function () {
    $this->seed([WorkflowDefaultsSeeder::class]);
    setupTestLocationData();

    $admin = apiUser('admin');
    $supervisor = apiUser('supervisor');
    $staff = apiUser('staff');

    Sanctum::actingAs($admin);
    $this->getJson('/api/v1/crm/lead-analytics')->assertOk();
    $this->getJson('/api/v1/crm/lead-analytics/timeline')->assertOk();
    $this->getJson('/api/v1/crm/lead-analytics/top-uploaders')->assertOk();

    Sanctum::actingAs($supervisor);
    $this->getJson('/api/v1/crm/lead-analytics')->assertOk();
    $this->getJson('/api/v1/crm/lead-analytics/timeline')->assertOk();
    $this->getJson('/api/v1/crm/lead-analytics/top-uploaders')->assertOk();

    Sanctum::actingAs($staff);
    $this->getJson('/api/v1/crm/lead-analytics')->assertForbidden();
    $this->getJson('/api/v1/crm/lead-analytics/timeline')->assertForbidden();
    $this->getJson('/api/v1/crm/lead-analytics/top-uploaders')->assertForbidden();
});

it('returns filtered user lead analytics with manual and import attribution', function () {
    Carbon::setTestNow('2026-05-08 12:00:00');

    $this->seed([WorkflowDefaultsSeeder::class]);
    $locations = setupTestLocationData();
    $country = $locations['country'];
    $state = $locations['state'];
    $lga = $locations['lga'];

    $admin = apiUser('admin');
    $john = apiUser('staff', ['name' => 'John Doe']);
    $mary = apiUser('staff', ['name' => 'Mary Stone']);

    $inbound = LeadDrive::query()->where('slug', 'inbound')->firstOrFail();
    $outbound = LeadDrive::query()->where('slug', 'outbound')->firstOrFail();

    createAnalyticsLead([
        'created_by' => $john->id,
        'drive_id' => $inbound->id,
        'country_id' => $country->id,
        'state_id' => $state->id,
        'lga_id' => $lga->id,
        'created_at' => Carbon::parse('2026-05-08 09:00:00'),
    ]);

    createAnalyticsLead([
        'created_by' => $john->id,
        'drive_id' => $inbound->id,
        'country_id' => $country->id,
        'state_id' => $state->id,
        'lga_id' => $lga->id,
        'created_at' => Carbon::parse('2026-04-24 09:00:00'),
    ]);

    createAnalyticsLead([
        'created_by' => $mary->id,
        'imported_by' => $mary->id,
        'source' => 'import',
        'source_type' => 'import',
        'drive_id' => $inbound->id,
        'country_id' => $country->id,
        'state_id' => $state->id,
        'lga_id' => $lga->id,
        'created_at' => Carbon::parse('2026-05-08 10:30:00'),
    ]);

    createAnalyticsLead([
        'created_by' => null,
        'imported_by' => null,
        'source' => 'import',
        'source_type' => 'import',
        'drive_id' => $inbound->id,
        'country_id' => $country->id,
        'state_id' => $state->id,
        'lga_id' => $lga->id,
        'created_at' => Carbon::parse('2026-05-08 11:00:00'),
    ]);

    createAnalyticsLead([
        'created_by' => $mary->id,
        'imported_by' => null,
        'source' => 'import',
        'source_type' => null,
        'drive_id' => $outbound->id,
        'country_id' => $country->id,
        'state_id' => $state->id,
        'lga_id' => $lga->id,
        'created_at' => Carbon::parse('2026-05-07 14:00:00'),
    ]);

    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/crm/lead-analytics?type=both&period=custom&start_date=2026-05-01&end_date=2026-05-31&drive_id=' . $inbound->id . '&country_id=' . $country->id . '&state_id=' . $state->id . '&lga_id=' . $lga->id);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.summary.manual_leads', 1)
        ->assertJsonPath('data.summary.imported_leads', 2)
        ->assertJsonPath('data.summary.total_leads', 3)
        ->assertJsonPath('data.summary.unattributed.imported', 1)
        ->assertJsonPath('data.filters.drive_id', $inbound->id)
        ->assertJsonPath('data.filters.type', 'both')
        ->assertJsonPath('data.top_uploaders.0.user.name', 'John Doe');

    Carbon::setTestNow();
});

it('supports user and upload type filters including legacy imports', function () {
    Carbon::setTestNow('2026-05-08 12:00:00');

    $this->seed([WorkflowDefaultsSeeder::class]);
    setupTestLocationData();

    $admin = apiUser('admin');
    $mary = apiUser('staff', ['name' => 'Mary Stone']);

    createAnalyticsLead([
        'created_by' => $mary->id,
        'source' => 'import',
        'source_type' => null,
        'imported_by' => null,
        'created_at' => Carbon::parse('2026-05-08 08:10:00'),
    ]);

    createAnalyticsLead([
        'created_by' => $mary->id,
        'source' => 'import',
        'source_type' => 'import',
        'imported_by' => $mary->id,
        'created_at' => Carbon::parse('2026-05-08 09:10:00'),
    ]);

    createAnalyticsLead([
        'created_by' => $mary->id,
        'source' => 'manual',
        'source_type' => 'manual',
        'imported_by' => null,
        'created_at' => Carbon::parse('2026-05-08 09:40:00'),
    ]);

    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/crm/lead-analytics?user_id=' . $mary->id . '&type=imported');

    $response->assertOk()
        ->assertJsonPath('data.summary.manual_leads', 0)
        ->assertJsonPath('data.summary.imported_leads', 2)
        ->assertJsonPath('data.summary.total_leads', 2)
        ->assertJsonPath('data.user_stats.0.user.id', $mary->id)
        ->assertJsonPath('data.user_stats.0.imported_leads', 2)
        ->assertJsonPath('data.user_stats.0.manual_leads', 0);

    Carbon::setTestNow();
});

it('returns timeline entries and pagination for activity feed', function () {
    Carbon::setTestNow('2026-05-08 12:00:00');

    $this->seed([WorkflowDefaultsSeeder::class]);
    setupTestLocationData();

    $admin = apiUser('admin');
    $importer = apiUser('staff', ['name' => 'Importer']);

    createAnalyticsLead([
        'created_by' => $importer->id,
        'imported_by' => $importer->id,
        'source' => 'import',
        'source_type' => 'import',
        'created_at' => Carbon::parse('2026-05-08 11:30:00'),
    ]);

    createAnalyticsLead([
        'created_by' => $importer->id,
        'imported_by' => null,
        'source' => 'import',
        'source_type' => 'import',
        'created_at' => Carbon::parse('2026-05-08 11:00:00'),
    ]);

    createAnalyticsLead([
        'created_by' => $importer->id,
        'imported_by' => null,
        'source' => 'manual',
        'source_type' => 'manual',
        'created_at' => Carbon::parse('2026-05-08 10:00:00'),
    ]);

    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/crm/lead-analytics/timeline?type=imported&per_page=2');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.action_type', 'imported')
        ->assertJsonPath('meta.pagination.per_page', 2);

    Carbon::setTestNow();
});

it('returns top uploaders and daily aggregate metric', function () {
    Carbon::setTestNow('2026-05-08 12:00:00');

    $this->seed([WorkflowDefaultsSeeder::class]);
    setupTestLocationData();

    $admin = apiUser('admin');
    $a = apiUser('staff', ['name' => 'A']);
    $b = apiUser('staff', ['name' => 'B']);

    createAnalyticsLead(['created_by' => $a->id, 'source_type' => 'manual', 'source' => 'manual']);
    createAnalyticsLead(['created_by' => $a->id, 'source_type' => 'manual', 'source' => 'manual']);
    createAnalyticsLead(['created_by' => $b->id, 'imported_by' => $b->id, 'source_type' => 'import', 'source' => 'import']);

    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/crm/lead-analytics/top-uploaders?limit=1');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.user.name', 'A')
        ->assertJsonPath('data.total_uploaded_today', 3);

    Carbon::setTestNow();
});

it('returns zeroed stats when requested user has no uploads', function () {
    $this->seed([WorkflowDefaultsSeeder::class]);
    setupTestLocationData();

    $admin = apiUser('admin');
    $idle = apiUser('staff', ['name' => 'Idle User']);

    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/v1/crm/lead-analytics?user_id=' . $idle->id . '&type=both');

    $response->assertOk()
        ->assertJsonPath('data.summary.total_leads', 0)
        ->assertJsonPath('data.user_stats.0.user.id', $idle->id)
        ->assertJsonPath('data.user_stats.0.total_leads', 0);
});
