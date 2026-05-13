<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\GoogleOAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Throwable;

class GoogleCalendarConnectionController extends Controller
{
    public function __construct(
        private readonly GoogleOAuthService $googleOAuthService,
    ) {}

    public function status(Request $request): JsonResponse
    {
        $account = $request->user()->googleCalendarAccount;

        return $this->success([
            'connected' => $account !== null,
            'google_email' => $account?->google_email,
            'calendar_id' => $account?->calendar_id,
            'token_expires_at' => $account?->token_expires_at?->toIso8601String(),
            'last_error' => $account?->last_error,
        ], 'Google Calendar status fetched.');
    }

    public function connect(Request $request): JsonResponse
    {
        $payload = $this->googleOAuthService->authorizationUrlFor($request->user());

        return $this->success($payload, 'Google Calendar authorization URL generated.');
    }

    public function callback(Request $request): JsonResponse|RedirectResponse
    {
        $error = $request->query('error');
        if (is_string($error) && $error !== '') {
            return $this->oauthFailureRedirect($error);
        }

        try {
            $account = $this->googleOAuthService->handleCallback(
                (string) $request->query('state', ''),
                (string) $request->query('code', '')
            );
        } catch (Throwable $exception) {
            return $this->oauthFailureRedirect($exception->getMessage());
        }

        return $this->oauthSuccessRedirect($account->google_email);
    }

    public function disconnect(Request $request): JsonResponse
    {
        $this->googleOAuthService->disconnect($request->user());

        return $this->success(null, 'Google Calendar disconnected.');
    }

    private function oauthSuccessRedirect(?string $email): JsonResponse|RedirectResponse
    {
        $redirect = (string) config('google.oauth.success_redirect', '');
        if ($redirect !== '') {
            return redirect()->away($this->appendQuery($redirect, [
                'provider' => 'google_calendar',
                'status' => 'connected',
                'email' => $email,
            ]));
        }

        return response()->json([
            'success' => true,
            'message' => 'Google Calendar connected successfully.',
            'data' => [
                'provider' => 'google_calendar',
                'status' => 'connected',
                'email' => $email,
            ],
        ]);
    }

    private function oauthFailureRedirect(string $message): JsonResponse|RedirectResponse
    {
        $redirect = (string) config('google.oauth.failure_redirect', '');
        if ($redirect !== '') {
            return redirect()->away($this->appendQuery($redirect, [
                'provider' => 'google_calendar',
                'status' => 'failed',
                'message' => $message,
            ]));
        }

        return response()->json([
            'success' => false,
            'message' => $message,
        ], 422);
    }

    private function appendQuery(string $url, array $params): string
    {
        $separator = str_contains($url, '?') ? '&' : '?';

        return $url . $separator . http_build_query(Arr::where($params, fn(mixed $value): bool => $value !== null && $value !== ''));
    }
}
