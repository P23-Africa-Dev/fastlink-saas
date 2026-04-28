<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'signed_in_at',
        'signed_out_at',
        'sign_in_ip',
        'sign_out_ip',
        'note',
    ];

    protected $casts = [
        'date' => 'date',
        'signed_in_at' => 'datetime',
        'signed_out_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
