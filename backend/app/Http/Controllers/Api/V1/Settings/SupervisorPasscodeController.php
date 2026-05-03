<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\GenerateSupervisorPasscodeRequest;
use App\Http\Requests\Settings\VerifyPasscodeRequest;
use App\Models\SupervisorPasscode;
use App\Models\User;
use App\Services\SupervisorPasscodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupervisorPasscodeController extends Controller
{
    public function __construct(
        private readonly SupervisorPasscodeService $service,
    ) {}

    // ─── Admin endpoints ──────────────────────────────────────────────────────

    /**
     * GET /v1/settings/company/passcodes
     *
     * List all supervisor passcodes (admin only).
     * Optionally filter by ?supervisor_id=N.
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->filled('supervisor_id')) {
            $list = $this->service->listForSupervisor((int) $request->integer('supervisor_id'));
        } else {
            $list = $this->service->listAll();
        }

        return $this->success($list, 'Passcodes fetched.');
    }

    /**
     * POST /v1/settings/company/passcodes
     *
     * Generate a passcode for a supervisor (admin only).
     *
     * The plain-text passcode is returned ONCE. The admin must share it with
     * the supervisor through a secure channel (e.g. the built-in notifications
     * or email).
     */
    public function generate(GenerateSupervisorPasscodeRequest $request): JsonResponse
    {
        $supervisor = User::findOrFail($request->integer('supervisor_id'));

        if (! $supervisor->hasRole('supervisor')) {
            return $this->error('The selected user does not have the supervisor role.', 422);
        }

        $expiresAt = $request->filled('expires_at')
            ? \Carbon\Carbon::parse($request->string('expires_at'))
            : null;

        ['passcode' => $passcode, 'plain' => $plain] = $this->service->generate(
            supervisor: $supervisor,
            generatedBy: $request->user(),
            expiresAt: $expiresAt,
        );

        return $this->success([
            'passcode'    => $passcode->load(['supervisor:id,name,email', 'generatedBy:id,name,email']),
            'plain_text'  => $plain,
            'notice'      => 'This is the only time the passcode is displayed. Share it with the supervisor securely.',
        ], 'Passcode generated.', 201);
    }

    /**
     * DELETE /v1/settings/company/passcodes/{passcode}
     *
     * Revoke a passcode and all its associated access tokens (admin only).
     */
    public function revoke(Request $request, SupervisorPasscode $passcode): JsonResponse
    {
        $this->service->revoke($passcode);

        return $this->success(null, 'Passcode revoked and all related access tokens deleted.');
    }

    // ─── Supervisor endpoints ─────────────────────────────────────────────────

    /**
     * POST /v1/settings/company/verify-passcode
     *
     * Supervisor submits their passcode. On success receives:
     *   - session_token (2-hour window to call PATCH /settings/company)
     *   - device_token  (only when remember_device=true; tied to passcode expiry)
     */
    public function verifyPasscode(VerifyPasscodeRequest $request): JsonResponse
    {
        try {
            $result = $this->service->verify(
                supervisor: $request->user(),
                plain: $request->string('passcode')->toString(),
                rememberDevice: $request->boolean('remember_device', false),
            );
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 403);
        }

        return $this->success([
            'session_token' => $result['session_token'],
            'device_token'  => $result['device_token'],
            'session_expires_in_seconds' => 7200,
        ], 'Passcode verified. Use the session_token as X-Supervisor-Session-Token header when updating company settings.');
    }

    /**
     * POST /v1/settings/company/validate-device-token
     *
     * Supervisor sends their device token to check if it's still valid before
     * rendering the settings page (avoids showing the form then redirecting to
     * passcode). Returns 200 when valid, 403 when not.
     */
    public function validateDeviceToken(Request $request): JsonResponse
    {
        $request->validate([
            'device_token' => ['required', 'string'],
        ]);

        $token = $this->service->validateToken(
            $request->user(),
            $request->string('device_token')->toString(),
        );

        if (! $token || $token->type !== 'device') {
            return $this->error('Device token is invalid or expired.', 403);
        }

        return $this->success(['valid' => true], 'Device token is valid.');
    }
}
