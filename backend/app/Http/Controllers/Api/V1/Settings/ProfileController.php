<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAppearanceRequest;
use App\Http\Requests\Settings\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * GET /v1/settings/profile
     *
     * Return the authenticated user's own profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles:id,name');

        return $this->success($user, 'Profile fetched.');
    }

    /**
     * PATCH /v1/settings/profile
     *
     * Update name, email, and/or password for the authenticated user.
     * Password changes require the current password to be confirmed.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user    = $request->user();
        $payload = $request->validated();

        // ── Password change flow ────────────────────────────────────────────
        if (isset($payload['password'])) {
            // Verify the current password before allowing a change.
            if (! Hash::check($payload['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password is incorrect.'],
                ]);
            }

            $payload['password'] = Hash::make($payload['password']);
        }

        // Strip fields not present on the users table.
        unset($payload['current_password'], $payload['password_confirmation']);

        $user->update($payload);

        return $this->success($user->fresh()->load('roles:id,name'), 'Profile updated.');
    }

    /**
     * PATCH /v1/settings/appearance
     *
     * Persist the user's preferred colour scheme (light | dark | system).
     */
    public function updateAppearance(UpdateAppearanceRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['appearance' => $request->validated('appearance')]);

        return $this->success(
            ['appearance' => $user->appearance],
            'Appearance preference saved.',
        );
    }
}
