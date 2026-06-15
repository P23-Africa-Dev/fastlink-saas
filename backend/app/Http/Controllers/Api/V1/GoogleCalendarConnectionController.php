<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\GoogleOAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
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

    public function callback(Request $request): Response
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

    private function oauthSuccessRedirect(?string $email): Response
    {
        return response(
            $this->oauthPopupHtml(
                true,
                'Google Calendar connected',
                'Connection completed. This window will close automatically.',
                [
                    'provider' => 'google_calendar',
                    'status' => 'connected',
                    'email' => $email,
                ]
            ),
            200,
            ['Content-Type' => 'text/html; charset=UTF-8']
        );
    }

    private function oauthFailureRedirect(string $message): Response
    {
        return response(
            $this->oauthPopupHtml(
                false,
                'Google Calendar connection failed',
                $message,
                [
                    'provider' => 'google_calendar',
                    'status' => 'failed',
                    'message' => $message,
                ]
            ),
            422,
            ['Content-Type' => 'text/html; charset=UTF-8']
        );
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function oauthPopupHtml(bool $success, string $title, string $message, array $payload): string
    {
        $safeTitle = e($title);
        $safeMessage = e($message);
        $safePayload = json_encode(Arr::where($payload, fn(mixed $value): bool => $value !== null && $value !== ''), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $accent = $success ? '#166534' : '#b91c1c';
        $background = $success ? '#ecfdf5' : '#fef2f2';

        return <<<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{$safeTitle}</title>
    <style>
      body { margin:0; font-family: Arial, sans-serif; background:#f8fafc; color:#0f172a; }
      .wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
      .card { width:100%; max-width:460px; border-radius:16px; padding:22px; background:#fff; box-shadow:0 10px 30px rgba(15,23,42,.08); border:1px solid #e2e8f0; }
      .badge { display:inline-block; border-radius:999px; padding:6px 10px; font-size:12px; font-weight:700; color:{$accent}; background:{$background}; margin-bottom:10px; }
      h1 { margin:0 0 8px; font-size:20px; line-height:1.2; }
      p { margin:0; font-size:14px; line-height:1.6; color:#334155; }
      .small { margin-top:10px; font-size:12px; color:#64748b; }
      button { margin-top:14px; border:1px solid #cbd5e1; border-radius:10px; background:#fff; color:#0f172a; font-size:12px; font-weight:700; padding:8px 12px; cursor:pointer; }
      button:hover { background:#f8fafc; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="badge">{$safeTitle}</div>
        <h1>{$safeTitle}</h1>
        <p>{$safeMessage}</p>
        <p class="small">You can close this window if it does not close automatically.</p>
        <button type="button" onclick="window.close()">Close window</button>
      </div>
    </div>
    <script>
      (function () {
        var payload = {$safePayload};
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'google-calendar-oauth', payload: payload }, '*');
          }
        } catch (e) {}
        setTimeout(function () { window.close(); }, 350);
      })();
    </script>
  </body>
</html>
HTML;
    }
}
