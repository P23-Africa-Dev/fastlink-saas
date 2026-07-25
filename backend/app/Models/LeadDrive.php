<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;

use App\Services\Crm\LeadDriveVisibility;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class LeadDrive extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'slug',
        'description',
        'color',
        'position',
        'is_default',
        'created_by',
        'is_private',
        'privacy_locked_by_role',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_private' => 'boolean',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'drive_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @param  Builder<LeadDrive>  $query
     * @return Builder<LeadDrive>
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return app(LeadDriveVisibility::class)->applyVisibleTo($query, $user);
    }
}
