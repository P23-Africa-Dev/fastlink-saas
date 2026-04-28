<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

describe('GET /api/v1/health', function () {

    it('returns 200 with ok status when database is reachable', function () {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'timestamp',
                'version',
                'checks' => [
                    'database' => ['status', 'driver'],
                    'app'      => ['status', 'name', 'env', 'debug'],
                ],
            ])
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.database.status', 'ok');
    });

    it('returns the correct app name in health response', function () {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJsonPath('checks.app.name', config('app.name'));
    });

    it('returns a valid ISO 8601 timestamp', function () {
        $response = $this->getJson('/api/v1/health');

        $timestamp = $response->json('timestamp');

        expect($timestamp)->toBeString()->not->toBeEmpty();
        expect(strtotime($timestamp))->not->toBeFalse();
    });

    it('returns correct content-type header', function () {
        $response = $this->getJson('/api/v1/health');

        $response->assertHeader('Content-Type', 'application/json');
    });

    it('returns 503 when database is unreachable', function () {
        // Simulate DB failure by using an invalid connection
        config(['database.connections.sqlite.database' => '/nonexistent/path/db.sqlite']);
        config(['database.default' => 'sqlite']);

        // Force fresh PDO connection attempt
        DB::purge('sqlite');

        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(503)
            ->assertJsonPath('status', 'degraded')
            ->assertJsonPath('checks.database.status', 'error');

        // Restore connection for other tests
        DB::purge('sqlite');
        config(['database.connections.sqlite.database' => database_path('database.sqlite')]);
    });

});
