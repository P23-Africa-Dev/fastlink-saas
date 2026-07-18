<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $email = Str::lower(trim((string) $payload['email']));

        /** @var User|null $user */
        // TRIM + LOWER so trailing spaces / mixed case in the DB cannot
        // block a legitimate login (MySQL CI collation alone is not enough
        // when the stored value itself contains whitespace).
        $user = User::query()
            ->whereRaw('LOWER(TRIM(email)) = ?', [$email])
            ->first();

        if (! $user) {
            // Soft-deleted accounts look identical to "not found" under the
            // SoftDeletes global scope — surface a clear message instead of
            // the misleading "invalid credentials".
            $deleted = User::onlyTrashed()
                ->whereRaw('LOWER(TRIM(email)) = ?', [$email])
                ->first();

            if ($deleted) {
                Log::warning('login.failed', ['email' => $email, 'reason' => 'soft_deleted']);

                return $this->error(
                    'This account has been deactivated. Contact your administrator.',
                    403
                );
            }

            Log::warning('login.failed', ['email' => $email, 'reason' => 'user_not_found']);

            return $this->error('Invalid credentials.', 422);
        }

        if (! Hash::check($payload['password'], (string) $user->password)) {
            Log::warning('login.failed', [
                'email' => $email,
                'reason' => 'bad_password',
                'user_id' => $user->id,
            ]);

            return $this->error('Invalid credentials.', 422);
        }

        if ($user->isSuspended()) {
            Log::warning('login.failed', [
                'email' => $email,
                'reason' => 'suspended',
                'user_id' => $user->id,
            ]);

            return $this->error('Account suspended. Contact administrator.', 423);
        }

        if ($user->first_logged_in_at === null) {
            $user->forceFill([
                'first_logged_in_at' => now(),
            ])->save();
        }

        // Repair any historically messy stored email while we're here.
        if ($user->email !== $email) {
            $user->forceFill(['email' => $email])->save();
        }

        $token = $user->createToken($payload['device_name'] ?? $request->userAgent() ?? 'api-client');

        return $this->success([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user->load('roles:id,name'),
        ], 'Login successful.');
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = Str::lower(trim((string) $request->validated('email')));

        /** @var User|null $user */
        $user = User::query()
            ->whereRaw('LOWER(TRIM(email)) = ?', [$email])
            ->first();

        if ($user) {
            // Keep the stored email in sync with the normalized form so the
            // password_reset_tokens row matches the later reset request.
            if ($user->email !== $email) {
                $user->forceFill(['email' => $email])->save();
            }

            Password::sendResetLink(['email' => $email]);
        }

        // Always return a generic response to avoid leaking which emails exist.
        return $this->success(
            null,
            'If an account exists for that email, a password reset link has been sent.'
        );
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                // Assign the plain password — the User model's `hashed` cast
                // hashes it exactly once. Do NOT Hash::make() here or you
                // risk double-hashing if the cast behaviour ever changes.
                $user->forceFill([
                    'password' => $password,
                ])->save();

                // Invalidate any existing sessions after a password change.
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PasswordReset) {
            return $this->success(null, 'Password reset successfully. You can now sign in.');
        }

        return $this->error('This password reset link is invalid or has expired.', 422);
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success($request->user()->load('roles:id,name'), 'Current user fetched.');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->success(null, 'Logged out successfully.');
    }
}
