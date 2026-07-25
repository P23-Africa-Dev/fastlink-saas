<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadFollowupUpdateRequest extends Model
{
    use BelongsToOrganization, HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'organization_id',
        'followup_id',
        'requested_by',
        'approver_id',
        'original_data',
        'proposed_changes',
        'status',
        'rejection_reason',
        'reviewed_at',
    ];

    protected $casts = [
        'original_data' => 'array',
        'proposed_changes' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function followup(): BelongsTo
    {
        return $this->belongsTo(LeadFollowup::class, 'followup_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
