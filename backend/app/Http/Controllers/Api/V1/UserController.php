<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Notifications\UserAccountCreatedNotification;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Throwable;

class UserController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function supervisors(Request $request): JsonResponse
    {
        $query = User::query()
            ->select(['id', 'name', 'email'])
            ->with('roles:id,name')
            ->whereNull('suspended_at')
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
        $query = User::query()
            ->with('roles:id,name')
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

        if ($request->user()?->hasRole('supervisor') && $payload['role'] === 'admin') {
            return $this->error('Supervisors cannot create admin accounts.', 403);
        }

        $temporaryPassword = Str::password(12, letters: true, numbers: true, symbols: false);

        /** @var User $user */
        $user = DB::transaction(function () use ($payload, $temporaryPassword) {
            $existing = User::withTrashed()->where('email', $payload['email'])->first();

            if ($existing && $existing->trashed()) {
                $existing->restore();
                $existing->update([
                    'name' => $payload['name'],
                    'password' => Hash::make($temporaryPassword),
                    'suspended_at' => null,
                ]);

                $existing->syncRoles([$payload['role']]);

                return $existing;
            }

            $created = User::create([
                'name' => $payload['name'],
                'email' => $payload['email'],
                'password' => Hash::make($temporaryPassword),
            ]);

            $created->syncRoles([$payload['role']]);

            return $created;
        });

        try {
            $user->notify(new UserAccountCreatedNotification($temporaryPassword));
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
        return $this->success($user->load('roles:id,name'), 'User fetched.');
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        if ($request->user()?->hasRole('supervisor')) {
            if ($user->hasRole('admin')) {
                return $this->error('Supervisors cannot manage admin accounts.', 403);
            }
        }

        $payload = $request->validated();

        if ($request->user()?->hasRole('supervisor') && array_key_exists('role', $payload) && $payload['role'] === 'admin') {
            return $this->error('Supervisors cannot assign the admin role.', 403);
        }

        if (array_key_exists('password', $payload)) {
            $payload['password'] = Hash::make($payload['password']);
        }

        if (array_key_exists('suspended', $payload)) {
            $payload['suspended_at'] = $payload['suspended'] ? now() : null;
            unset($payload['suspended']);
        }

        $role = $payload['role'] ?? null;
        unset($payload['role']);

        $user->update($payload);

        if ($role) {
            $user->syncRoles([$role]);
        }

        return $this->success($user->fresh()->load('roles:id,name'), 'User updated.');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ((int) $user->id === (int) $request->user()->id) {
            return $this->error('You cannot delete your own account.', 422);
        }

        if ($request->user()?->hasRole('supervisor') && $user->hasRole('admin')) {
            return $this->error('Supervisors cannot delete admin accounts.', 403);
        }

        $user->tokens()->delete();
        $user->delete();

        return $this->success(null, 'User deleted.');
    }
}
