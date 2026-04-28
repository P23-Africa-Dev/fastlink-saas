<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class LeadDrive extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'position',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'drive_id');
    }
}
