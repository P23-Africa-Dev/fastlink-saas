<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogService
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function log(?User $actor, string $action, string $description, array $metadata = []): ActivityLog
    {
        return ActivityLog::query()->create([
            'user_id' => $actor?->id,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
