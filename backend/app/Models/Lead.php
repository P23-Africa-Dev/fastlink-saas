<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;

use App\Services\Crm\LeadDriveVisibility;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use BelongsToOrganization, HasFactory, SoftDeletes;

    protected $fillable = [
        'organization_id',
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
        'country_id',
        'state_id',
        'lga_id',
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
        'imported_by',
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

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }

    public function drive(): BelongsTo
    {
        return $this->belongsTo(LeadDrive::class, 'drive_id');
    }

    /**
     * Leads without a drive remain visible; otherwise inherit drive privacy.
     *
     * @param  Builder<Lead>  $query
     * @return Builder<Lead>
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        $visibility = app(LeadDriveVisibility::class);

        if (! $visibility->isPrivacyEnabled()) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($user) {
            $q->whereNull('drive_id')
                ->orWhereHas('drive', fn (Builder $driveQuery) => $driveQuery->visibleTo($user));
        });
    }

    public function statusDefinition(): BelongsTo
    {
        return $this->belongsTo(LeadStatus::class, 'status_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class)->latest();
    }

    public function followups(): HasMany
    {
        return $this->hasMany(LeadFollowup::class)->latest();
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class, 'state_id');
    }

    public function lga(): BelongsTo
    {
        return $this->belongsTo(Lga::class, 'lga_id');
    }
}
