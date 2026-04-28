<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Spreadsheet extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'original_filename',
        'stored_filename',
        'mime_type',
        'disk',
        'file_path',
        'file_size',
        'extension',
        'created_by',
        'last_edited_by',
        'last_edited_at',
        'sheet_data',
    ];

    protected $casts = [
        'last_edited_at' => 'datetime',
        'sheet_data' => 'array',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_edited_by');
    }
}
