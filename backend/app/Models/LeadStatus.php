<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class LeadStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'color',
        'position',
        'is_default',
        'is_won',
        'is_lost',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_won' => 'boolean',
        'is_lost' => 'boolean',
    ];

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('position')->orderBy('id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'status_id');
    }
}
