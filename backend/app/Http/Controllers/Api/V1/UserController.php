<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
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

        $user = User::create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
        ]);

        $user->syncRoles([$payload['role']]);

        return $this->success($user->load('roles:id,name'), 'User created.', 201);
    }

    public function show(User $user): JsonResponse
    {
        return $this->success($user->load('roles:id,name'), 'User fetched.');
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $payload = $request->validated();

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

        $user->tokens()->delete();
        $user->delete();

        return $this->success(null, 'User deleted.');
    }
}
