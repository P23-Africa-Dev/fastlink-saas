<?php

namespace App\Services;

use App\Models\Meeting;
use App\Models\MeetingReminder;
use App\Models\User;
use App\Services\Contracts\GoogleCalendarClient;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MeetingService
{
    public function __construct(
        private readonly GoogleCalendarClient $googleCalendarClient,
        private readonly \App\Services\GoogleOAuthService $googleOAuthService,
        private readonly MeetingNotificationService $meetingNotificationService,
    ) {}

    public function create(User $actor, array $payload): Meeting
    {
        return DB::transaction(function () use ($actor, $payload): Meeting {
            $this->assertOrganizerConnected($actor);

            $timezone = (string) ($payload['timezone'] ?? 'Africa/Lagos');
            $guestIds = collect($payload['guest_ids'] ?? [])->map(fn($id): int => (int) $id)->unique()->values();
            $guestEmails = $this->normalizeExternalGuestEmails($payload['guest_emails'] ?? []);

            if (!$guestIds->contains($actor->id)) {
                $guestIds->push($actor->id);
            }

            $internalGuestEmails = User::query()
                ->whereIn('id', $guestIds->all())
                ->pluck('email')
                ->map(fn($email): string => strtolower((string) $email));

            $allGuestEmails = $internalGuestEmails
                ->merge($guestEmails)
                ->filter(fn($email): bool => $email !== '')
                ->unique()
                ->values();

            $googleEvent = $this->googleCalendarClient->createMeetingEvent($actor, [
                'title' => $payload['title'],
                'description' => $payload['description'] ?? null,
                'start_at' => $payload['start_at'],
                'end_at' => $payload['end_at'],
                'timezone' => $timezone,
            ], $allGuestEmails->all());

            if ($this->googleOAuthService->isEnabled() && empty($googleEvent['event_id'])) {
                throw ValidationException::withMessages([
                    'google_calendar' => ['Google Calendar event creation failed. Reconnect the organizer Google account and try again.'],
                ]);
            }

            $meeting = Meeting::query()->create([
                'title' => $payload['title'],
                'description' => $payload['description'] ?? null,
                'organizer_id' => $actor->id,
                'project_id' => $payload['project_id'] ?? null,
                'task_id' => $payload['task_id'] ?? null,
                'start_at' => Carbon::parse((string) $payload['start_at']),
                'end_at' => Carbon::parse((string) $payload['end_at']),
                'timezone' => $timezone,
                'status' => Meeting::STATUS_SCHEDULED,
                'approval_status' => ($payload['approval_required'] ?? false) ? 'pending' : 'approved',
                'google_event_id' => $googleEvent['event_id'],
                'google_calendar_id' => $googleEvent['calendar_id'],
                'meet_link' => $googleEvent['meet_link'],
                'calendar_link' => $googleEvent['calendar_link'],
                'external_guest_emails' => $guestEmails->all(),
                'share_meeting_link' => (bool) ($payload['share_meeting_link'] ?? true),
                'share_calendar_link' => (bool) ($payload['share_calendar_link'] ?? false),
                'is_recurring' => (bool) ($payload['is_recurring'] ?? false),
                'auto_record' => (bool) ($payload['auto_record'] ?? false),
                'created_by' => $actor->id,
                'updated_by' => $actor->id,
            ]);

            $meeting->attendees()->sync($guestIds->all());

            $this->syncReminders($meeting, $payload['reminder_minutes'] ?? [15]);
            $meeting->load(['organizer:id,name,email', 'attendees:id,name,email']);

            $this->meetingNotificationService->sendInvitations($meeting, $guestEmails);

            return $meeting;
        });
    }

    public function update(Meeting $meeting, User $actor, array $payload): Meeting
    {
        $this->assertCanManage($meeting, $actor);

        return DB::transaction(function () use ($meeting, $actor, $payload): Meeting {
            $meeting->loadMissing('organizer');

            $currentAttendeeEmails = $meeting->attendees()->pluck('users.email')->map(fn($email): string => strtolower((string) $email));
            $incomingGuestIds = collect($payload['guest_ids'] ?? $meeting->attendees()->pluck('users.id')->all())
                ->map(fn($id): int => (int) $id)
                ->unique()
                ->values();

            if (!$incomingGuestIds->contains($meeting->organizer_id)) {
                $incomingGuestIds->push((int) $meeting->organizer_id);
            }

            $incomingExternalEmails = array_key_exists('guest_emails', $payload)
                ? $this->normalizeExternalGuestEmails($payload['guest_emails'])
                : collect($meeting->external_guest_emails ?? []);

            $internalEmails = User::query()
                ->whereIn('id', $incomingGuestIds->all())
                ->pluck('email')
                ->map(fn($email): string => strtolower((string) $email));

            $allGuestEmails = $internalEmails->merge($incomingExternalEmails)->unique()->values();

            $fields = [
                'title',
                'description',
                'project_id',
                'task_id',
                'share_meeting_link',
                'share_calendar_link',
                'is_recurring',
                'auto_record',
                'status',
                'timezone',
            ];

            foreach ($fields as $field) {
                if (array_key_exists($field, $payload)) {
                    $meeting->{$field} = $payload[$field];
                }
            }

            if (array_key_exists('start_at', $payload)) {
                $meeting->start_at = Carbon::parse((string) $payload['start_at']);
            }
            if (array_key_exists('end_at', $payload)) {
                $meeting->end_at = Carbon::parse((string) $payload['end_at']);
            }

            $meeting->external_guest_emails = $incomingExternalEmails->all();
            $meeting->updated_by = $actor->id;
            $meeting->save();

            $meeting->attendees()->sync($incomingGuestIds->all());

            if (array_key_exists('reminder_minutes', $payload)) {
                $this->syncReminders($meeting, $payload['reminder_minutes'] ?? [15]);
            }

            if (!empty($meeting->google_event_id)) {
                if ($meeting->organizer instanceof User) {
                    $this->assertOrganizerConnected($meeting->organizer);
                }

                $this->googleCalendarClient->updateMeetingEvent($meeting->organizer, (string) $meeting->google_event_id, [
                    'title' => $meeting->title,
                    'description' => $meeting->description,
                    'start_at' => $meeting->start_at?->toDateTimeString(),
                    'end_at' => $meeting->end_at?->toDateTimeString(),
                    'timezone' => $meeting->timezone,
                ], $allGuestEmails->all());
            }

            $meeting->load(['organizer:id,name,email', 'attendees:id,name,email']);
            $this->meetingNotificationService->sendUpdate($meeting);

            $newExternal = $incomingExternalEmails->diff($currentAttendeeEmails)->values();
            if ($newExternal->isNotEmpty()) {
                $this->meetingNotificationService->sendInvitations($meeting, $newExternal);
            }

            return $meeting;
        });
    }

    public function cancel(Meeting $meeting, User $actor, ?string $reason = null): Meeting
    {
        $this->assertCanManage($meeting, $actor);

        return DB::transaction(function () use ($meeting, $actor, $reason): Meeting {
            $meeting->loadMissing('organizer');
            $meeting->status = Meeting::STATUS_CANCELLED;
            $meeting->updated_by = $actor->id;
            $meeting->save();

            if (!empty($meeting->google_event_id)) {
                if ($meeting->organizer instanceof User) {
                    $this->assertOrganizerConnected($meeting->organizer);
                    $this->googleCalendarClient->deleteMeetingEvent($meeting->organizer, (string) $meeting->google_event_id);
                }
            }

            $meeting->load(['organizer:id,name,email', 'attendees:id,name,email']);
            $this->meetingNotificationService->sendCancellation($meeting, $reason);

            return $meeting;
        });
    }

    public function listForUser(User $user, array $filters)
    {
        $perPage = (int) ($filters['per_page'] ?? 20);
        $startDate = isset($filters['start_date']) ? Carbon::parse((string) $filters['start_date'])->startOfDay() : null;
        $endDate = isset($filters['end_date']) ? Carbon::parse((string) $filters['end_date'])->endOfDay() : null;

        return Meeting::query()
            ->with(['organizer:id,name,email', 'attendees:id,name,email'])
            ->where(function (Builder $query) use ($user): void {
                $query->where('organizer_id', $user->id)
                    ->orWhereHas('attendees', function (Builder $attendeeQuery) use ($user): void {
                        $attendeeQuery->where('users.id', $user->id);
                    });
            })
            ->when(!empty($filters['status']), fn(Builder $q): Builder => $q->where('status', $filters['status']))
            ->when($startDate !== null, fn(Builder $q): Builder => $q->where('end_at', '>=', $startDate))
            ->when($endDate !== null, fn(Builder $q): Builder => $q->where('start_at', '<=', $endDate))
            ->orderBy('start_at')
            ->paginate($perPage);
    }

    public function dueReminders(Carbon $now): Collection
    {
        return MeetingReminder::query()
            ->with('meeting.attendees')
            ->where('status', 'pending')
            ->where('scheduled_for', '<=', $now)
            ->get();
    }

    public function processDueReminders(Carbon $now): int
    {
        $sent = 0;
        $due = $this->dueReminders($now);

        foreach ($due as $reminder) {
            try {
                $meeting = $reminder->meeting;
                if (!$meeting || $meeting->status === Meeting::STATUS_CANCELLED) {
                    $reminder->status = 'skipped';
                    $reminder->sent_at = $now;
                    $reminder->save();
                    continue;
                }

                $this->meetingNotificationService->sendReminder($meeting);
                $reminder->status = 'sent';
                $reminder->sent_at = $now;
                $reminder->error_message = null;
                $reminder->save();
                $sent++;
            } catch (\Throwable $e) {
                $reminder->status = 'failed';
                $reminder->error_message = $e->getMessage();
                $reminder->save();
            }
        }

        return $sent;
    }

    public function assertCanView(Meeting $meeting, User $actor): void
    {
        if ($meeting->organizer_id === $actor->id) {
            return;
        }

        $isAttendee = $meeting->attendees()->where('users.id', $actor->id)->exists();
        if ($isAttendee) {
            return;
        }

        abort(403, 'You are not allowed to view this meeting.');
    }

    public function assertCanManage(Meeting $meeting, User $actor): void
    {
        if ($meeting->organizer_id === $actor->id || $actor->hasRole('admin')) {
            return;
        }

        abort(403, 'Only organizer or admin can manage this meeting.');
    }

    /**
     * @param array<int, mixed> $emails
     * @return Collection<int, string>
     */
    private function normalizeExternalGuestEmails(array $emails): Collection
    {
        return collect($emails)
            ->map(fn($email): string => strtolower(trim((string) $email)))
            ->filter(fn(string $email): bool => $email !== '')
            ->unique()
            ->values();
    }

    /**
     * @param array<int, mixed> $reminderMinutes
     */
    private function syncReminders(Meeting $meeting, array $reminderMinutes): void
    {
        $minutes = collect($reminderMinutes)
            ->map(fn($value): int => max(5, (int) $value))
            ->unique()
            ->values();

        $meeting->reminders()->delete();

        foreach ($minutes as $minute) {
            $meeting->reminders()->create([
                'minutes_before' => $minute,
                'scheduled_for' => $meeting->start_at?->copy()->subMinutes($minute),
                'status' => 'pending',
            ]);
        }
    }

    private function assertOrganizerConnected(User $organizer): void
    {
        if (!$this->googleOAuthService->isEnabled()) {
            return;
        }

        if ($this->googleOAuthService->hasConnectedAccount($organizer)) {
            return;
        }

        throw ValidationException::withMessages([
            'google_calendar' => ['Connect the organizer Google account before creating or syncing meetings so Google can send RSVP invitations.'],
        ]);
    }
}
