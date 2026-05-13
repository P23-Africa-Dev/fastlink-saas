<?php

namespace App\Services\Contracts;

use App\Models\User;

interface GoogleCalendarClient
{
    /**
     * @param array<int, string> $attendeeEmails
     * @return array{event_id:string|null, meet_link:string|null, calendar_link:string|null, calendar_id:string|null}
     */
    public function createMeetingEvent(User $organizer, array $payload, array $attendeeEmails): array;

    /**
     * @param array<int, string> $attendeeEmails
     */
    public function updateMeetingEvent(User $organizer, string $eventId, array $payload, array $attendeeEmails): void;

    public function deleteMeetingEvent(User $organizer, string $eventId): void;
}
