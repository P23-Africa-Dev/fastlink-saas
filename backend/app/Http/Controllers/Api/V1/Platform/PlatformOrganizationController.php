<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Notifications\UserAccountCreatedNotification;
use App\Services\OrganizationProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PlatformOrganizationController extends Controller
{
    public function __construct(
        private readonly OrganizationProvisioner $provisioner,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $orgs = Organization::query()
            ->withCount('memberships')
            ->when($request->string('q')->toString(), function ($q, $term) {
                $q->where(function ($inner) use ($term) {
                    $inner->where('name', 'like', "%{$term}%")
                        ->orWhere('slug', 'like', "%{$term}%");
                });
            })
            ->orderByDesc('id')
            ->paginate((int) $request->integer('per_page', 20));

        return $this->paginated($orgs, $orgs->items(), 'Organizations fetched.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('organizations', 'slug')],
            'timezone' => ['nullable', 'string', 'timezone:all'],
            'admin_name' => ['nullable', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
        ]);

        $result = $this->provisioner->provision($data, $request->user());

        if ($result['temporary_password']) {
            $result['admin']->notify(new UserAccountCreatedNotification($result['temporary_password']));
        }

        return $this->success([
            'organization' => $result['organization']->loadCount('memberships'),
            'admin' => [
                'id' => $result['admin']->id,
                'name' => $result['admin']->name,
                'email' => $result['admin']->email,
            ],
        ], 'Organization created.', 201);
    }

    public function show(Organization $organization): JsonResponse
    {
        $organization->loadCount('memberships');

        return $this->success($organization, 'Organization fetched.');
    }

    public function update(Request $request, Organization $organization): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash', Rule::unique('organizations', 'slug')->ignore($organization->id)],
            'status' => ['sometimes', 'string', Rule::in(['active', 'suspended'])],
            'timezone' => ['nullable', 'string', 'timezone:all'],
        ]);

        $organization->update($data);

        return $this->success($organization->fresh()->loadCount('memberships'), 'Organization updated.');
    }

    public function members(Organization $organization): JsonResponse
    {
        $members = OrganizationUser::query()
            ->with('user:id,name,email,suspended_at')
            ->where('organization_id', $organization->id)
            ->orderByDesc('id')
            ->get()
            ->map(function (OrganizationUser $membership) use ($organization) {
                setPermissionsTeamId($organization->id);
                $user = $membership->user;
                $role = $user?->getRoleNames()->first();

                return [
                    'id' => $membership->id,
                    'status' => $membership->status,
                    'joined_at' => $membership->joined_at,
                    'role' => $role,
                    'user' => $user ? [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'suspended_at' => $user->suspended_at,
                    ] : null,
                ];
            });

        return $this->success($members, 'Organization members fetched.');
    }
}
