<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\MarkAsReadRequest;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = max(1, min(50, (int) $request->integer('per_page', 20)));
        $unreadOnly = $request->boolean('unread_only', false);

        $notifications = $this->notificationService->listForUser($user, $perPage, $unreadOnly);

        return $this->paginated($notifications, $notifications->items(), 'Notifications fetched.');
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return $this->success([
            'unread_count' => $this->notificationService->unreadCount($request->user()),
        ], 'Unread count fetched.');
    }

    public function markAsRead(MarkAsReadRequest $request): JsonResponse
    {
        $updated = $this->notificationService->markAsRead(
            $request->user(),
            $request->validated('ids'),
        );

        return $this->success([
            'updated' => $updated,
        ], 'Notifications marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $updated = $this->notificationService->markAllAsRead($request->user());

        return $this->success([
            'updated' => $updated,
        ], 'All notifications marked as read.');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $deleted = $this->notificationService->deleteForUser($request->user(), $id);

        if ($deleted === 0) {
            return $this->error('Notification not found.', 404);
        }

        return $this->success(null, 'Notification deleted.');
    }
}
