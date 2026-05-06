<?php

use App\Models\State;
use Database\Seeders\LocationSeeder;
use Database\Seeders\WorkflowDefaultsSeeder;
use Laravel\Sanctum\Sanctum;

it('returns canonical states list without duplicate names', function () {
    $this->seed([WorkflowDefaultsSeeder::class, LocationSeeder::class]);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $nigeriaId = \App\Models\Country::query()->where('code', 'NG')->value('id');
    expect($nigeriaId)->not()->toBeNull();

    // Create an intentional duplicate state row.
    State::create([
        'country_id' => (int) $nigeriaId,
        'name' => 'Lagos',
    ]);

    $response = $this->getJson('/api/v1/states?country_id=' . (int) $nigeriaId);

    $response->assertOk()->assertJsonPath('success', true);

    $names = collect($response->json('data'))->pluck('name');
    expect($names->filter(fn(string $name) => $name === 'Lagos')->count())->toBe(1);
});

it('returns LGAs for duplicate state ids and accepts camelCase stateId', function () {
    $this->seed([WorkflowDefaultsSeeder::class, LocationSeeder::class]);

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $lagos = State::query()->where('name', 'Lagos')->firstOrFail();

    // Duplicate Lagos without copying LGAs to simulate real production mismatch.
    $duplicate = State::create([
        'country_id' => $lagos->country_id,
        'name' => $lagos->name,
    ]);

    $snakeCase = $this->getJson('/api/v1/lgas?state_id=' . $duplicate->id);
    $snakeCase->assertOk()->assertJsonPath('success', true);
    expect(collect($snakeCase->json('data'))->count())->toBeGreaterThan(0);

    $camelCase = $this->getJson('/api/v1/lgas?stateId=' . $duplicate->id);
    $camelCase->assertOk()->assertJsonPath('success', true);
    expect(collect($camelCase->json('data'))->count())->toBeGreaterThan(0);
});
