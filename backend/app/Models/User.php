<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'suspended_at', 'first_logged_in_at', 'appearance', 'is_super_admin', 'current_organization_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected string $guard_name = 'web';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'suspended_at' => 'datetime',
            'first_logged_in_at' => 'datetime',
            'is_super_admin' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('suspended_at');
    }

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    public function currentOrganization(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_user')
            ->withPivot(['status', 'invited_by', 'joined_at'])
            ->withTimestamps();
    }

    public function organizationMemberships(): HasMany
    {
        return $this->hasMany(OrganizationUser::class);
    }

    /**
     * Organizations the user can actively use, with role for each.
     *
     * @return list<array{id: int, name: string, slug: string, role: string|null, status: string}>
     */
    public function organizationSummaries(): array
    {
        $memberships = OrganizationUser::query()
            ->with('organization:id,name,slug,status')
            ->where('user_id', $this->id)
            ->where('status', 'active')
            ->get();

        $items = [];

        foreach ($memberships as $membership) {
            $org = $membership->organization;
            if (! $org || $org->isSuspended()) {
                continue;
            }

            setPermissionsTeamId($org->id);
            $this->unsetRelation('roles');

            $items[] = [
                'id' => $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
                'role' => $this->getRoleNames()->first(),
                'status' => $org->status,
            ];
        }

        if ($this->current_organization_id) {
            setPermissionsTeamId($this->current_organization_id);
            $this->unsetRelation('roles');
        }

        return $items;
    }

    /**
     * Send the password reset notification using FastLink's branded email
     * instead of Laravel's default notification.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }

    public function createdLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'created_by');
    }

    public function importedLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'imported_by');
    }

    public function assignedLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'assigned_to');
    }

    public function createdProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class)
            ->withPivot('assigned_by')
            ->withTimestamps();
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function supervisedLeaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'supervisor_id');
    }

    public function createdSpreadsheets(): HasMany
    {
        return $this->hasMany(Spreadsheet::class, 'created_by');
    }

    public function editedSpreadsheets(): HasMany
    {
        return $this->hasMany(Spreadsheet::class, 'last_edited_by');
    }

    public function leadFollowups(): HasMany
    {
        return $this->hasMany(LeadFollowup::class, 'created_by');
    }

    public function requestedLeadFollowupUpdates(): HasMany
    {
        return $this->hasMany(LeadFollowupUpdateRequest::class, 'requested_by');
    }

    public function approvedLeadFollowupUpdates(): HasMany
    {
        return $this->hasMany(LeadFollowupUpdateRequest::class, 'approver_id');
    }

    public function leadFollowupUploads(): HasMany
    {
        return $this->hasMany(LeadFollowupAttachment::class, 'uploaded_by');
    }

    public function organizedMeetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'organizer_id');
    }

    public function createdMeetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'created_by');
    }

    public function meetingInvitations(): BelongsToMany
    {
        return $this->belongsToMany(Meeting::class, 'meeting_attendees')
            ->withPivot(['response_status', 'responded_at'])
            ->withTimestamps();
    }

    public function googleCalendarAccount(): HasOne
    {
        return $this->hasOne(\App\Models\GoogleCalendarAccount::class);
    }
}
