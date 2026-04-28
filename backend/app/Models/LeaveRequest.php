<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'supervisor_id',
        'type',
        'reason',
        'start_date',
        'end_date',
        'duration_days',
        'status',
        'supervisor_note',
        'modified_start_date',
        'modified_end_date',
        'modified_duration_days',
        'sender_response_note',
        'sender_responded_at',
        'decided_at',
        'decision_note',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'modified_start_date' => 'date',
        'modified_end_date' => 'date',
        'sender_responded_at' => 'datetime',
        'decided_at' => 'datetime',
        'duration_days' => 'decimal:2',
        'modified_duration_days' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}
