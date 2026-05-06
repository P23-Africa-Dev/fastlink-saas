<?php

use App\Models\Lead;
use App\Models\State;
use Database\Seeders\LocationSeeder;
use Database\Seeders\WorkflowDefaultsSeeder;
use Laravel\Sanctum\Sanctum;

function createLeadsForStateAndStatus(int $count, int $stateId, string $status, int $userId): void
{
    for ($i = 0; $i < $count; $i++) {
        Lead::create([
            'first_name' => 'Lead ' . $status . ' ' . $stateId . ' ' . $i,
            'status' => $status,
            'state_id' => $stateId,
            'created_by' => $userId,
        ]);
    }
}

it('returns default pipeline stats without filters', function () {
    $this->seed([WorkflowDefaultsSeeder::class, LocationSeeder::class]);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $lagos = State::query()->where('name', 'Lagos')->firstOrFail();
    $ogun = State::query()->where('name', 'Ogun')->firstOrFail();

    createLeadsForStateAndStatus(4, $lagos->id, 'new', $admin->id);
    createLeadsForStateAndStatus(2, $ogun->id, 'contacted', $admin->id);

    $response = $this->getJson('/api/v1/dashboard/pipeline-stats');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_leads', 6)
        ->assertJsonCount(2, 'data.top_states');
});

it('filters pipeline stats by state only', function () {
    $this->seed([WorkflowDefaultsSeeder::class, LocationSeeder::class]);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $lagos = State::query()->where('name', 'Lagos')->firstOrFail();
    $oyo = State::query()->where('name', 'Oyo')->firstOrFail();

    createLeadsForStateAndStatus(3, $lagos->id, 'new', $admin->id);
    createLeadsForStateAndStatus(5, $oyo->id, 'new', $admin->id);

    $response = $this->getJson('/api/v1/dashboard/pipeline-stats?state_id=' . $lagos->id);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_leads', 3)
        ->assertJsonPath('data.filters.state_id', $lagos->id);
});

it('filters pipeline stats by status only', function () {
    $this->seed([WorkflowDefaultsSeeder::class, LocationSeeder::class]);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $lagos = State::query()->where('name', 'Lagos')->firstOrFail();
    createLeadsForStateAndStatus(2, $lagos->id, 'new', $admin->id);
    createLeadsForStateAndStatus(4, $lagos->id, 'qualified', $admin->id);

    $response = $this->getJson('/api/v1/dashboard/pipeline-stats?status=Qualified');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_leads', 4)
        ->assertJsonPath('data.filters.status', 'Qualified');
});

it('supports combined pipeline stats filters', function () {
    $this->seed([WorkflowDefaultsSeeder::class, LocationSeeder::class]);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $lagos = State::query()->where('name', 'Lagos')->firstOrFail();
    $ogun = State::query()->where('name', 'Ogun')->firstOrFail();

    createLeadsForStateAndStatus(2, $lagos->id, 'new', $admin->id);
    createLeadsForStateAndStatus(3, $lagos->id, 'won', $admin->id);
    createLeadsForStateAndStatus(4, $ogun->id, 'new', $admin->id);

    $response = $this->getJson('/api/v1/dashboard/pipeline-stats?state_id=' . $lagos->id . '&status=New');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_leads', 2)
        ->assertJsonPath('data.filters.state_id', $lagos->id)
        ->assertJsonPath('data.filters.status', 'New');
});

it('returns validation error for invalid state filter and handles unknown status gracefully', function () {
    $this->seed([WorkflowDefaultsSeeder::class, LocationSeeder::class]);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $invalidState = $this->getJson('/api/v1/dashboard/pipeline-stats?state_id=9999999');
    $invalidState->assertStatus(422);

    $unknownStatus = $this->getJson('/api/v1/dashboard/pipeline-stats?status=Unknown-Status');
    $unknownStatus->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_leads', 0)
        ->assertJsonCount(0, 'data.top_states')
        ->assertJsonCount(0, 'data.top_entries');
});
