<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadFollowupAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'followup_id',
        'uploaded_by',
        'disk',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
    ];

    protected $appends = ['file_url', 'preview_url', 'download_url'];

    public function followup(): BelongsTo
    {
        return $this->belongsTo(LeadFollowup::class, 'followup_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFileUrlAttribute(): string
    {
        return "/api/v1/crm/followups/attachments/{$this->id}/view";
    }

    public function getPreviewUrlAttribute(): string
    {
        return $this->getFileUrlAttribute();
    }

    public function getDownloadUrlAttribute(): string
    {
        return "/api/v1/crm/followups/attachments/{$this->id}/download";
    }
}
