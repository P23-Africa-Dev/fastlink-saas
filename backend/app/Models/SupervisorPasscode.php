<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupervisorPasscode extends Model
{
    protected $fillable = [
        'supervisor_id',
        'passcode_hash',
        'expires_at',
        'is_active',
        'generated_by',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_active'  => 'boolean',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function accessTokens(): HasMany
    {
        return $this->hasMany(SupervisorAccessToken::class, 'passcode_id');
    }

    // ─── Domain helpers ───────────────────────────────────────────────────────

    /**
     * A passcode is "usable" when it is active AND not past its expiry date.
     */
    public function isUsable(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}
