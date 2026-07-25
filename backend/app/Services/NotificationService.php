<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * @param  iterable<int>  $userIds
     * @param  array<string, mixed>  $metadata
     */
    public function notifyUsers(
        iterable $userIds,
        string $type,
        string $title,
        string $message,
        array $metadata = [],
        string $priority = Notification::PRIORITY_MEDIUM,
        ?string $dedupeKey = null,
    ): int {
        $ids = collect($userIds)
            ->filter(fn($id) => $id !== null)
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return 0;
        }

        $now = now();
        $orgId = app(\App\Support\OrganizationContext::class)->id();

        $rows = $ids->map(function (int $userId) use ($type, $title, $message, $metadata, $priority, $dedupeKey, $now, $orgId) {
            return [
                'organization_id' => $orgId ?? User::query()->whereKey($userId)->value('current_organization_id'),
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'metadata' => json_encode($metadata),
                'is_read' => false,
                'priority' => $priority,
                'dedupe_key' => $dedupeKey ? $dedupeKey . ':' . $userId : null,
                'created_at' => $now,
            ];
        })->all();

        // insertOrIgnore keeps the system lightweight and idempotent.
        return DB::table('notifications')->insertOrIgnore($rows);
    }

    public function listForUser(User $user, int $perPage = 20, bool $unreadOnly = false): LengthAwarePaginator
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->when($unreadOnly, fn($q) => $q->where('is_read', false))
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function unreadCount(User $user): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->where('is_read', false)
            ->count();
    }

    /**
     * @param  iterable<int>  $ids
     */
    public function markAsRead(User $user, iterable $ids): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->whereIn('id', collect($ids)->map(fn($id) => (int) $id)->all())
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    public function markAllAsRead(User $user): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    public function deleteForUser(User $user, int $notificationId): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->where('id', $notificationId)
            ->delete();
    }

    /**
     * @return Collection<int>
     */
    public function roleUserIds(string ...$roles): Collection
    {
        $orgId = app(\App\Support\OrganizationContext::class)->id();

        $query = User::query()->role($roles);

        if ($orgId) {
            $query->whereHas('organizationMemberships', function ($builder) use ($orgId) {
                $builder->where('organization_id', $orgId)->where('status', 'active');
            });
        }

        return $query->pluck('id');
    }
}
