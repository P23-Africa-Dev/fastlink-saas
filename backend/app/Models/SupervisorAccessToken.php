<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupervisorAccessToken extends Model
{
    protected $fillable = [
        'supervisor_id',
        'passcode_id',
        'token_hash',
        'type',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function passcode(): BelongsTo
    {
        return $this->belongsTo(SupervisorPasscode::class, 'passcode_id');
    }

    // ─── Domain helpers ───────────────────────────────────────────────────────

    /**
     * Token is valid when it has not expired AND its parent passcode is still
     * usable (not revoked, not expired).
     */
    public function isValid(): bool
    {
        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return false;
        }

        return $this->passcode->isUsable();
    }
}
