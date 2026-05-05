<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'metadata',
        'is_read',
        'priority',
        'dedupe_key',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_read' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
