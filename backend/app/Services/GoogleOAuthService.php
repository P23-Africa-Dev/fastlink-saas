<?php

namespace App\Services;

use App\Models\GoogleCalendarAccount;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class GoogleOAuthService
{
    public function authorizationUrlFor(User $user): array
    {
        $client = $this->makeClient();
        $state = (string) Str::uuid();

        Cache::put($this->stateCacheKey($state), [
            'user_id' => $user->id,
        ], now()->addMinutes((int) config('google.oauth.state_ttl_minutes', 10)));

        $client->setState($state);

        return [
            'authorization_url' => $client->createAuthUrl(),
            'expires_in' => (int) config('google.oauth.state_ttl_minutes', 10) * 60,
        ];
    }

    public function handleCallback(string $state, string $code): GoogleCalendarAccount
    {
        $pending = Cache::pull($this->stateCacheKey($state));
        if (!is_array($pending) || empty($pending['user_id'])) {
            throw new RuntimeException('Google authorization state is invalid or expired.');
        }

        $user = User::query()->findOrFail((int) $pending['user_id']);
        $client = $this->makeClient();

        $token = $client->fetchAccessTokenWithAuthCode($code);
        if (!empty($token['error']) || empty($token['access_token'])) {
            throw new RuntimeException((string) ($token['error_description'] ?? $token['error'] ?? 'Failed to fetch Google access token.'));
        }

        $client->setAccessToken($token);

        $oauthServiceClass = 'Google\\Service\\Oauth2';
        if (!class_exists($oauthServiceClass)) {
            throw new RuntimeException('google/apiclient-services is not installed correctly for Google OAuth user info lookups.');
        }

        $oauthService = new $oauthServiceClass($client);
        $googleUser = $oauthService->userinfo->get();

        $existing = $user->googleCalendarAccount()->first();
        $refreshToken = (string) ($token['refresh_token'] ?? $existing?->refresh_token ?? '');

        $account = GoogleCalendarAccount::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'google_email' => (string) ($googleUser->email ?? $user->email),
                'google_account_id' => (string) ($googleUser->id ?? ''),
                'calendar_id' => (string) config('google.calendar.id', 'primary'),
                'access_token' => (string) $token['access_token'],
                'refresh_token' => $refreshToken !== '' ? $refreshToken : null,
                'scopes' => $this->extractScopes($token['scope'] ?? null),
                'token_expires_at' => Carbon::now()->addSeconds((int) ($token['expires_in'] ?? 3600)),
                'connected_at' => Carbon::now(),
                'last_error' => null,
            ]
        );

        return $account;
    }

    public function authorizedClientFor(User $user): ?object
    {
        if (!$this->isEnabled() || !$this->isConfigured()) {
            return null;
        }

        $account = $user->relationLoaded('googleCalendarAccount')
            ? $user->googleCalendarAccount
            : $user->googleCalendarAccount()->first();

        if (!$account || empty($account->access_token)) {
            return null;
        }

        // Reject tokens that were stored without the Calendar scope.
        // This forces reconnection instead of attempting an API call that will 403.
        if (!$this->accountHasCalendarScope($account)) {
            $account->last_error = 'Google account is missing Calendar permission. Please reconnect.';
            $account->save();

            Log::warning('Google Calendar scope missing for organizer. Reconnection required.', [
                'user_id' => $user->id,
                'stored_scopes' => $account->scopes,
            ]);

            return null;
        }

        try {
            $client = $this->makeClient();
        } catch (Throwable $exception) {
            Log::warning('Google OAuth client could not be initialized.', [
                'user_id' => $user->id,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }

        if ($this->shouldRefresh($account)) {
            if (empty($account->refresh_token)) {
                $account->last_error = 'Google refresh token is missing. Reconnect Google Calendar.';
                $account->save();

                Log::warning('Google refresh token missing for organizer. Reconnection required.', [
                    'user_id' => $user->id,
                ]);

                return null;
            }

            try {
                $refreshedToken = $client->fetchAccessTokenWithRefreshToken((string) $account->refresh_token);
                if (!empty($refreshedToken['error']) || empty($refreshedToken['access_token'])) {
                    $account->last_error = (string) ($refreshedToken['error_description'] ?? $refreshedToken['error'] ?? 'Google token refresh failed.');
                    $account->save();

                    Log::warning('Google token refresh failed for organizer.', [
                        'user_id' => $user->id,
                        'error' => $account->last_error,
                    ]);

                    return null;
                }

                $account->access_token = (string) $refreshedToken['access_token'];
                if (!empty($refreshedToken['refresh_token'])) {
                    $account->refresh_token = (string) $refreshedToken['refresh_token'];
                }
                if (!empty($refreshedToken['scope'])) {
                    $account->scopes = $this->extractScopes($refreshedToken['scope']);
                }
                $account->token_expires_at = Carbon::now()->addSeconds((int) ($refreshedToken['expires_in'] ?? 3600));
                $account->last_error = null;
                $account->save();
            } catch (Throwable $exception) {
                $account->last_error = $exception->getMessage();
                $account->save();

                Log::warning('Google token refresh threw an exception for organizer.', [
                    'user_id' => $user->id,
                    'error' => $exception->getMessage(),
                ]);

                return null;
            }
        }

        $client->setAccessToken([
            'access_token' => (string) $account->access_token,
            'refresh_token' => (string) ($account->refresh_token ?? ''),
            'expires_in' => max(0, Carbon::now()->diffInSeconds($account->token_expires_at ?? Carbon::now(), false)),
            'created' => Carbon::now()->timestamp,
        ]);

        return $client;
    }

    public function hasConnectedAccount(User $user): bool
    {
        $account = $user->relationLoaded('googleCalendarAccount')
            ? $user->googleCalendarAccount
            : $user->googleCalendarAccount()->first();

        return $account !== null && !empty($account->access_token);
    }

    public function calendarIdFor(User $user): string
    {
        $account = $user->relationLoaded('googleCalendarAccount')
            ? $user->googleCalendarAccount
            : $user->googleCalendarAccount()->first();

        return (string) ($account?->calendar_id ?: config('google.calendar.id', 'primary'));
    }

    public function disconnect(User $user): void
    {
        $account = $user->googleCalendarAccount()->first();
        if (!$account) {
            return;
        }

        try {
            $client = $this->makeClient();
            if (!empty($account->access_token)) {
                $client->revokeToken((string) $account->access_token);
            }
        } catch (Throwable $exception) {
            Log::warning('Google OAuth token revoke failed during disconnect.', [
                'user_id' => $user->id,
                'error' => $exception->getMessage(),
            ]);
        }

        $account->delete();
    }

    public function isEnabled(): bool
    {
        return (bool) config('google.enabled', false);
    }

    public function isConfigured(): bool
    {
        return (string) config('google.oauth.client_id', '') !== ''
            && (string) config('google.oauth.client_secret', '') !== ''
            && (string) config('google.oauth.redirect_uri', '') !== '';
    }

    private function makeClient(): object
    {
        if (!$this->isEnabled()) {
            throw new RuntimeException('Google Calendar integration is disabled.');
        }

        if (!$this->isConfigured()) {
            throw new RuntimeException('Google OAuth credentials are not configured.');
        }

        $clientClass = 'Google\\Client';
        if (!class_exists($clientClass)) {
            throw new RuntimeException('google/apiclient is not installed.');
        }

        $client = new $clientClass();
        $client->setApplicationName(config('app.name', 'FastLink SaaS') . ' Meetings');
        $client->setClientId((string) config('google.oauth.client_id'));
        $client->setClientSecret((string) config('google.oauth.client_secret'));
        $client->setRedirectUri((string) config('google.oauth.redirect_uri'));
        $client->setAccessType('offline');
        $client->setPrompt('consent select_account');
        $client->setScopes(config('google.oauth.scopes', []));

        return $client;
    }

    private function accountHasCalendarScope(GoogleCalendarAccount $account): bool
    {
        $scopes = (array) ($account->scopes ?? []);
        foreach ($scopes as $scope) {
            if (str_contains((string) $scope, 'calendar')) {
                return true;
            }
        }

        // If scopes were never stored (legacy row), don't block — let the API call fail naturally.
        return empty($scopes);
    }

    private function shouldRefresh(GoogleCalendarAccount $account): bool
    {
        return $account->token_expires_at === null || $account->token_expires_at->lessThanOrEqualTo(Carbon::now()->addMinutes(2));
    }

    /**
     * @return array<int, string>
     */
    private function extractScopes(mixed $scopeValue): array
    {
        if (!is_string($scopeValue) || trim($scopeValue) === '') {
            return [];
        }

        return collect(explode(' ', $scopeValue))
            ->map(fn(string $scope): string => trim($scope))
            ->filter(fn(string $scope): bool => $scope !== '')
            ->values()
            ->all();
    }

    private function stateCacheKey(string $state): string
    {
        return 'google-oauth-state:' . $state;
    }
}
