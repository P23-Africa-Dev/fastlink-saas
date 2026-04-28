<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'company',
        'employee_count',
        'year_founded',
        'industry',
        'job_title',
        'website',
        'company_linkedin_profile',
        'ceo_linkedin_profile',
        'country',
        'city',
        'address',
        'status',
        'source',
        'priority',
        'estimated_value',
        'currency',
        'interested_services',
        'requirements',
        'notes',
        'assigned_to',
        'drive_id',
        'status_id',
        'created_by',
        'last_contacted_at',
        'next_follow_up',
        'converted_at',
        'lost_reason',
        'source_type',
        'source_id',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
        'employee_count' => 'integer',
        'year_founded' => 'integer',
        'interested_services' => 'array',
        'last_contacted_at' => 'datetime',
        'next_follow_up' => 'datetime',
        'converted_at' => 'datetime',
    ];

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function drive(): BelongsTo
    {
        return $this->belongsTo(LeadDrive::class, 'drive_id');
    }

    public function statusDefinition(): BelongsTo
    {
        return $this->belongsTo(LeadStatus::class, 'status_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class)->latest();
    }
}
