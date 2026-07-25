<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OrganizationInvitation;
use App\Services\OrganizationInvitationService;
use App\Support\OrganizationContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrganizationInvitationController extends Controller
{
    public function __construct(
        private readonly OrganizationInvitationService $invitationService,
        private readonly OrganizationContext $organizationContext,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $org = $this->organizationContext->check();

        $invites = OrganizationInvitation::query()
            ->where('organization_id', $org->id)
            ->whereNull('accepted_at')
            ->orderByDesc('id')
            ->get();

        return $this->success($invites, 'Invitations fetched.');
    }

    public function store(Request $request): JsonResponse
    {
        $org = $this->organizationContext->check();

        if (! $request->user()->hasRole('admin')) {
            return $this->error('Only organization admins can send invitations.', 403);
        }

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', 'string', Rule::in(['admin', 'supervisor', 'staff'])],
        ]);

        $invitation = $this->invitationService->invite(
            $org,
            $data['email'],
            $data['role'],
            $request->user()
        );

        return $this->success($invitation, 'Invitation sent.', 201);
    }

    public function destroy(Request $request, OrganizationInvitation $invitation): JsonResponse
    {
        $org = $this->organizationContext->check();

        if ((int) $invitation->organization_id !== (int) $org->id) {
            return $this->error('Invitation not found.', 404);
        }

        if (! $request->user()->hasRole('admin')) {
            return $this->error('Only organization admins can revoke invitations.', 403);
        }

        $invitation->delete();

        return $this->success(null, 'Invitation revoked.');
    }

    public function showPublic(Request $request): JsonResponse
    {
        $token = (string) $request->query('token', '');
        $invitation = OrganizationInvitation::query()
            ->with('organization:id,name,slug')
            ->where('token', $token)
            ->first();

        if (! $invitation || $invitation->isAccepted() || $invitation->isExpired()) {
            return $this->error('This invitation is invalid or has expired.', 422);
        }

        return $this->success([
            'email' => $invitation->email,
            'role' => $invitation->role,
            'organization' => $invitation->organization,
            'expires_at' => $invitation->expires_at,
            'user_exists' => \App\Models\User::query()->where('email', $invitation->email)->exists(),
        ], 'Invitation fetched.');
    }

    public function accept(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $result = $this->invitationService->accept($data['token'], $data);

        setPermissionsTeamId($result['organization']->id);
        $this->organizationContext->set($result['organization']);

        $token = $result['user']->createToken('invite-accept');

        $user = $result['user']->fresh();
        $organizations = $user->organizationSummaries();

        return $this->success([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => array_merge($user->load('roles:id,name')->toArray(), [
                'organizations' => $organizations,
                'current_organization_id' => $user->current_organization_id,
                'is_super_admin' => (bool) $user->is_super_admin,
                'current_organization' => collect($organizations)->firstWhere('id', $user->current_organization_id),
            ]),
        ], 'Invitation accepted.');
    }
}
