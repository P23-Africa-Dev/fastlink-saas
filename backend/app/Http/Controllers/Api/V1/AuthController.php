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
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $payload = $request->validated();

        /** @var User|null $user */
        $user = User::query()->where('email', $payload['email'])->first();

        if (!$user || !Hash::check($payload['password'], $user->password)) {
            return $this->error('Invalid credentials.', 422);
        }

        if ($user->isSuspended()) {
            return $this->error('Account suspended. Contact administrator.', 423);
        }

        if ($user->first_logged_in_at === null) {
            $user->forceFill([
                'first_logged_in_at' => now(),
            ])->save();
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
        Password::sendResetLink($request->only('email'));

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
                $user->forceFill([
                    'password' => Hash::make($password),
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
