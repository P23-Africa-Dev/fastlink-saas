<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Meeting extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'title',
        'description',
        'organizer_id',
        'project_id',
        'task_id',
        'start_at',
        'end_at',
        'timezone',
        'status',
        'approval_status',
        'google_event_id',
        'google_calendar_id',
        'meet_link',
        'calendar_link',
        'external_guest_emails',
        'share_meeting_link',
        'share_calendar_link',
        'is_recurring',
        'auto_record',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'external_guest_emails' => 'array',
            'share_meeting_link' => 'boolean',
            'share_calendar_link' => 'boolean',
            'is_recurring' => 'boolean',
            'auto_record' => 'boolean',
        ];
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function attendees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'meeting_attendees')
            ->withPivot(['response_status', 'responded_at'])
            ->withTimestamps();
    }

    public function attendeeRecords(): HasMany
    {
        return $this->hasMany(MeetingAttendee::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(MeetingReminder::class);
    }
}
