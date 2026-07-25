<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use App\Support\OrganizationContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $email = Str::lower(trim((string) $payload['email']));

        /** @var User|null $user */
        $user = User::query()
            ->whereRaw('LOWER(TRIM(email)) = ?', [$email])
            ->first();

        if (! $user) {
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

        if ($user->email !== $email) {
            $user->forceFill(['email' => $email])->save();
        }

        $organizations = $user->organizationSummaries();

        // Ensure current org is valid membership
        $orgIds = collect($organizations)->pluck('id');
        if ($user->current_organization_id && ! $orgIds->contains($user->current_organization_id)) {
            $user->forceFill([
                'current_organization_id' => $orgIds->first(),
            ])->save();
        } elseif (! $user->current_organization_id && $orgIds->isNotEmpty()) {
            $user->forceFill([
                'current_organization_id' => $orgIds->first(),
            ])->save();
        }

        if ($user->current_organization_id) {
            setPermissionsTeamId($user->current_organization_id);
            $this->organizationContext->set(Organization::query()->find($user->current_organization_id));
        }

        $token = $user->createToken($payload['device_name'] ?? $request->userAgent() ?? 'api-client');

        return $this->success([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $this->presentUser($user->fresh()),
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
            if ($user->email !== $email) {
                $user->forceFill(['email' => $email])->save();
            }

            Password::sendResetLink(['email' => $email]);
        }

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
                    'password' => $password,
                ])->save();

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
        return $this->success($this->presentUser($request->user()), 'Current user fetched.');
    }

    public function switchOrganization(Request $request, Organization $organization): JsonResponse
    {
        $user = $request->user();

        $membership = OrganizationUser::query()
            ->where('organization_id', $organization->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (! $membership || $organization->isSuspended()) {
            return $this->error('You are not a member of this organization.', 403);
        }

        $user->forceFill(['current_organization_id' => $organization->id])->save();
        setPermissionsTeamId($organization->id);
        $this->organizationContext->set($organization);

        return $this->success($this->presentUser($user->fresh()), 'Organization switched.');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->success(null, 'Logged out successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function presentUser(User $user): array
    {
        $organizations = $user->organizationSummaries();

        if ($user->current_organization_id) {
            setPermissionsTeamId($user->current_organization_id);
            $user->unsetRelation('roles');
        }

        $data = $user->load('roles:id,name')->toArray();
        $data['organizations'] = $organizations;
        $data['current_organization_id'] = $user->current_organization_id;
        $data['is_super_admin'] = (bool) $user->is_super_admin;

        $current = collect($organizations)->firstWhere('id', $user->current_organization_id);
        $data['current_organization'] = $current;

        return $data;
    }
}
