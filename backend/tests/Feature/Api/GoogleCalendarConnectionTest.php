<?php

use Laravel\Sanctum\Sanctum;
use Mockery;

it('returns google calendar connection status for the authenticated user', function () {
    $user = apiUser('admin', ['email' => 'organizer@fastlink.test']);

    \App\Models\GoogleCalendarAccount::query()->create([
        'user_id' => $user->id,
        'google_email' => 'organizer@gmail.com',
        'calendar_id' => 'primary',
        'access_token' => 'access-token',
        'refresh_token' => 'refresh-token',
        'token_expires_at' => now()->addHour(),
        'connected_at' => now(),
    ]);

    Sanctum::actingAs($user);

    $this->getJson('/api/v1/google/calendar/status')
        ->assertOk()
        ->assertJsonPath('data.connected', true)
        ->assertJsonPath('data.google_email', 'organizer@gmail.com')
        ->assertJsonPath('data.calendar_id', 'primary');
});

it('returns an authorization url for google calendar connection', function () {
    $user = apiUser('admin');
    Sanctum::actingAs($user);

    $mock = Mockery::mock(\App\Services\GoogleOAuthService::class);
    $mock->shouldReceive('authorizationUrlFor')
        ->once()
        ->andReturn([
            'authorization_url' => 'https://accounts.google.com/o/oauth2/v2/auth?state=test',
            'expires_in' => 600,
        ]);
    app()->instance(\App\Services\GoogleOAuthService::class, $mock);

    $this->getJson('/api/v1/google/calendar/connect')
        ->assertOk()
        ->assertJsonPath('data.authorization_url', 'https://accounts.google.com/o/oauth2/v2/auth?state=test');
});

it('redirects to the configured frontend url after successful callback', function () {
    config()->set('google.oauth.success_redirect', 'https://frontend.example.com/settings/google');

    $user = apiUser('admin');
    $account = new \App\Models\GoogleCalendarAccount([
        'user_id' => $user->id,
        'google_email' => 'organizer@gmail.com',
        'calendar_id' => 'primary',
        'access_token' => 'access-token',
    ]);

    $mock = Mockery::mock(\App\Services\GoogleOAuthService::class);
    $mock->shouldReceive('handleCallback')
        ->once()
        ->with('state-123', 'code-456')
        ->andReturn($account);
    app()->instance(\App\Services\GoogleOAuthService::class, $mock);

    $this->get('/api/v1/google/calendar/callback?state=state-123&code=code-456')
        ->assertRedirect('https://frontend.example.com/settings/google?provider=google_calendar&status=connected&email=organizer%40gmail.com');
});

it('disconnects the authenticated user from google calendar', function () {
    $user = apiUser('admin');
    Sanctum::actingAs($user);

    $mock = Mockery::mock(\App\Services\GoogleOAuthService::class);
    $mock->shouldReceive('disconnect')->once()->withArgs(fn($arg): bool => $arg->is($user));
    app()->instance(\App\Services\GoogleOAuthService::class, $mock);

    $this->deleteJson('/api/v1/google/calendar/disconnect')
        ->assertOk()
        ->assertJsonPath('message', 'Google Calendar disconnected.');
});
