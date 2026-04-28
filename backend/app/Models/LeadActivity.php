<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class LeadActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'user_id',
        'type',
        'title',
        'description',
        'old_value',
        'new_value',
        'scheduled_at',
        'completed_at',
        'is_completed',
        'metadata',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
        'is_completed' => 'boolean',
        'metadata' => 'array',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
