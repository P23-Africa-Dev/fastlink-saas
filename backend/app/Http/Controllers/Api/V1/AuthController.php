<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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

        $token = $user->createToken($payload['device_name'] ?? $request->userAgent() ?? 'api-client');

        return $this->success([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user->load('roles:id,name'),
        ], 'Login successful.');
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
