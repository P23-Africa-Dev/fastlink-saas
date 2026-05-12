<?php

namespace App\Services\Contracts;

interface GoogleCalendarClient
{
    /**
     * @param array<int, string> $attendeeEmails
     * @return array{event_id:string|null, meet_link:string|null, calendar_link:string|null, calendar_id:string|null}
     */
    public function createMeetingEvent(array $payload, array $attendeeEmails): array;

    /**
     * @param array<int, string> $attendeeEmails
     */
    public function updateMeetingEvent(string $eventId, array $payload, array $attendeeEmails): void;

    public function deleteMeetingEvent(string $eventId): void;
}
