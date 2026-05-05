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
        $rows = $ids->map(function (int $userId) use ($type, $title, $message, $metadata, $priority, $dedupeKey, $now) {
            return [
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
        return User::query()
            ->role($roles)
            ->pluck('id');
    }
}
