<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\OrganizationUser;
use App\Models\User;
use App\Notifications\UserAccountCreatedNotification;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use App\Services\OrganizationProvisioner;
use App\Support\OrganizationContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class UserController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly ActivityLogService $activityLogService,
        private readonly OrganizationContext $organizationContext,
        private readonly OrganizationProvisioner $organizationProvisioner,
    ) {}

    public function supervisors(Request $request): JsonResponse
    {
        $orgId = $this->organizationContext->id();

        $query = User::query()
            ->select(['id', 'name', 'email'])
            ->with('roles:id,name')
            ->whereNull('suspended_at')
            ->when($orgId, fn ($q) => $q->whereHas('organizationMemberships', fn ($m) => $m->where('organization_id', $orgId)->where('status', 'active')))
            ->whereHas('roles', function ($builder) {
                $builder->whereIn('name', ['admin', 'supervisor']);
            })
            ->orderBy('name');

        if ($request->boolean('exclude_self', true)) {
            $query->where('id', '!=', $request->user()->id);
        }

        return $this->success($query->get(), 'Supervisors fetched.');
    }

    public function index(Request $request): JsonResponse
    {
        $orgId = $this->organizationContext->id();

        if ($request->boolean('assignable')) {
            $users = User::query()
                ->select(['id', 'name', 'email'])
                ->whereNull('suspended_at')
                ->when($orgId, fn ($q) => $q->whereHas('organizationMemberships', fn ($m) => $m->where('organization_id', $orgId)->where('status', 'active')))
                ->orderBy('name')
                ->get();

            return $this->success($users, 'Users fetched.');
        }

        $query = User::query()
            ->with('roles:id,name')
            ->when($orgId, fn ($q) => $q->whereHas('organizationMemberships', fn ($m) => $m->where('organization_id', $orgId)->where('status', 'active')))
            ->when($request->string('q')->toString(), function ($builder, $q) {
                $builder->where(function ($inner) use ($q) {
                    $inner->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                });
            })
            ->when($request->string('role')->toString(), function ($builder, $role) {
                $builder->role($role);
            })
            ->orderByDesc('id');

        $users = $query->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($users, $users->items(), 'Users fetched.');
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $org = $this->organizationContext->check();

        if ($request->user()?->hasRole('supervisor') && $payload['role'] === 'admin') {
            return $this->error('Supervisors cannot create admin accounts.', 403);
        }

        $temporaryPassword = Str::password(12, letters: true, numbers: true, symbols: false);

        /** @var User $user */
        $user = DB::transaction(function () use ($payload, $temporaryPassword, $org, $request) {
            $existing = User::withTrashed()->where('email', $payload['email'])->first();

            if ($existing && $existing->trashed()) {
                $existing->restore();
                $existing->update([
                    'name' => $payload['name'],
                    'password' => $temporaryPassword,
                    'suspended_at' => null,
                ]);

                $this->organizationProvisioner->addMembership($org, $existing, $payload['role'], $request->user());

                return $existing;
            }

            if ($existing) {
                // Existing global user — attach to this org
                $this->organizationProvisioner->addMembership($org, $existing, $payload['role'], $request->user());

                return $existing;
            }

            $created = User::create([
                'name' => $payload['name'],
                'email' => $payload['email'],
                'password' => $temporaryPassword,
                'current_organization_id' => $org->id,
            ]);

            $this->organizationProvisioner->addMembership($org, $created, $payload['role'], $request->user());

            return $created;
        });

        try {
            // Only email credentials when we generated a new password for a new/restored user
            if ($temporaryPassword) {
                $user->notify(new UserAccountCreatedNotification($temporaryPassword));
            }
        } catch (Throwable $e) {
            report($e);
        }

        if ($request->user()->hasRole('supervisor')) {
            $adminIds = $this->notificationService->roleUserIds('admin')
                ->filter(fn ($id) => (int) $id !== (int) $request->user()->id);

            $this->notificationService->notifyUsers(
                $adminIds,
                'user.created_by_supervisor',
                'User created by supervisor',
                "{$request->user()->name} created user {$user->name} ({$user->email}).",
                ['user_id' => $user->id, 'created_role' => $payload['role']],
                'high',
                'user.created_by_supervisor:' . $user->id
            );
        }

        $this->activityLogService->log(
            $request->user(),
            'user.created',
            "User {$user->email} created",
            ['user_id' => $user->id, 'role' => $payload['role']]
        );

        return $this->success($user->load('roles:id,name'), 'User created.', 201);
    }

    public function show(User $user): JsonResponse
    {
        $orgId = $this->organizationContext->id();
        if ($orgId && ! OrganizationUser::query()
            ->where('organization_id', $orgId)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists()) {
            return $this->error('User not found.', 404);
        }

        return $this->success($user->load('roles:id,name'), 'User fetched.');
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $orgId = $this->organizationContext->id();
        if ($orgId && ! OrganizationUser::query()
            ->where('organization_id', $orgId)
            ->where('user_id', $user->id)
            ->exists()) {
            return $this->error('User not found.', 404);
        }

        if ($request->user()?->hasRole('supervisor')) {
            if ($user->hasRole('admin')) {
                return $this->error('Supervisors cannot manage admin accounts.', 403);
            }
        }

        $payload = $request->validated();

        if ($request->user()?->hasRole('supervisor') && array_key_exists('role', $payload) && $payload['role'] === 'admin') {
            return $this->error('Supervisors cannot assign the admin role.', 403);
        }

        if (array_key_exists('suspended', $payload)) {
            $payload['suspended_at'] = $payload['suspended'] ? now() : null;
            unset($payload['suspended']);
        }

        $role = $payload['role'] ?? null;
        unset($payload['role']);

        $user->update($payload);

        if ($role && $orgId) {
            setPermissionsTeamId($orgId);
            $user->syncRoles([$role]);
        }

        return $this->success($user->fresh()->load('roles:id,name'), 'User updated.');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ((int) $user->id === (int) $request->user()->id) {
            return $this->error('You cannot delete your own account.', 422);
        }

        $org = $this->organizationContext->check();

        if ($request->user()?->hasRole('supervisor') && $user->hasRole('admin')) {
            return $this->error('Supervisors cannot delete admin accounts.', 403);
        }

        // Remove from current org only (don't soft-delete global identity if multi-org)
        OrganizationUser::query()
            ->where('organization_id', $org->id)
            ->where('user_id', $user->id)
            ->delete();

        setPermissionsTeamId($org->id);
        $user->syncRoles([]);

        $remaining = OrganizationUser::query()->where('user_id', $user->id)->where('status', 'active')->exists();
        if (! $remaining) {
            $user->tokens()->delete();
            $user->delete();
        } elseif ((int) $user->current_organization_id === (int) $org->id) {
            $next = OrganizationUser::query()->where('user_id', $user->id)->where('status', 'active')->value('organization_id');
            $user->forceFill(['current_organization_id' => $next])->save();
        }

        return $this->success(null, 'User removed from organization.');
    }

    public function assignable(Request $request): JsonResponse
    {
        $orgId = $this->organizationContext->id();

        $users = User::query()
            ->select(['id', 'name', 'email'])
            ->whereNull('suspended_at')
            ->when($orgId, fn ($q) => $q->whereHas('organizationMemberships', fn ($m) => $m->where('organization_id', $orgId)->where('status', 'active')))
            ->orderBy('name')
            ->get();

        return $this->success($users, 'Assignable users fetched.');
    }
}
