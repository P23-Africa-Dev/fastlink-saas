<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::query()
            ->with('user:id,name,email')
            ->when($request->filled('action'), fn($q) => $q->where('action', $request->string('action')))
            ->orderByDesc('id');

        $logs = $query->paginate((int) $request->integer('per_page', 25));

        return $this->paginated($logs, $logs->items(), 'Activity logs fetched.');
    }
}
