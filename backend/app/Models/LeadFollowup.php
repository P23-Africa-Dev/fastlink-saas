<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadFollowup extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $fillable = [
        'organization_id',
        'lead_id',
        'created_by',
        'title',
        'content',
        'form_schema',
    ];

    protected $casts = [
        'content' => 'array',
        'form_schema' => 'array',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updateRequests(): HasMany
    {
        return $this->hasMany(LeadFollowupUpdateRequest::class, 'followup_id')->latest();
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadFollowupActivity::class, 'followup_id')->latest();
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(LeadFollowupAttachment::class, 'followup_id')->latest();
    }
}
