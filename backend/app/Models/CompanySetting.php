<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Support\OrganizationContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Per-organization company settings (one row per organization).
 */
class CompanySetting extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'company_name',
        'opening_time',
        'closing_time',
        'working_days',
        'timezone',
        'pipeline_privacy',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'working_days' => 'array',
            'pipeline_privacy' => 'array',
        ];
    }

    public function getOpeningTimeAttribute($value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return strlen((string) $value) === 5 ? $value . ':00' : (string) $value;
    }

    public function getClosingTimeAttribute($value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return strlen((string) $value) === 5 ? $value . ':00' : (string) $value;
    }

    /**
     * @return array{
     *     enabled: bool,
     *     staff_can_create_pipelines: bool,
     *     staff_can_create_open_pipelines: bool,
     *     default_visibility: string,
     *     higher_roles_can_unlock: bool
     * }
     */
    public static function defaultPipelinePrivacy(): array
    {
        return [
            'enabled' => true,
            'staff_can_create_pipelines' => true,
            'staff_can_create_open_pipelines' => false,
            'default_visibility' => 'open',
            'higher_roles_can_unlock' => true,
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Return settings for the current organization context.
     */
    public static function forCurrentOrganization(): self
    {
        return static::forOrganization(app(OrganizationContext::class)->id());
    }

    /**
     * Return (or create) the settings row for a specific organization.
     * A null organization id keeps the pre-tenancy fallback row usable.
     */
    public static function forOrganization(?int $organizationId): self
    {
        return static::withoutOrganizationScope()->firstOrCreate(
            ['organization_id' => $organizationId],
            [
                'opening_time' => '09:00:00',
                'closing_time' => '18:00:00',
                'working_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                'timezone' => config('app.timezone', 'UTC'),
                'pipeline_privacy' => static::defaultPipelinePrivacy(),
            ]
        );
    }

    /**
     * @deprecated Use forCurrentOrganization()
     */
    public static function singleton(): self
    {
        return static::forCurrentOrganization();
    }
}
