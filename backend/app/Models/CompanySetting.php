<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Singleton model — there is always exactly one row (id = 1).
 * Use CompanySetting::sole() or CompanySetting::first() to retrieve it.
 */
class CompanySetting extends Model
{
    protected $fillable = [
        'company_name',
        'opening_time',
        'closing_time',
        'working_days',
        'timezone',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'working_days' => 'array',
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Return the singleton row, creating a default one if somehow absent.
     */
    public static function singleton(): self
    {
        return static::firstOrCreate([], [
            'opening_time' => '09:00:00',
            'closing_time' => '18:00:00',
            'working_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            'timezone'     => config('app.timezone', 'UTC'),
        ]);
    }
}
