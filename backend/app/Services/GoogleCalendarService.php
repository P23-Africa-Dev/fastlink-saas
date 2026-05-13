<?php

namespace App\Services;

use App\Models\User;
use App\Services\Contracts\GoogleCalendarClient;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

class GoogleCalendarService implements GoogleCalendarClient
{
    public function __construct(
        private readonly \App\Services\GoogleOAuthService $googleOAuthService,
    ) {}

    public function createMeetingEvent(User $organizer, array $payload, array $attendeeEmails): array
    {
        if (!$this->isEnabled()) {
            return $this->emptyEventResponse();
        }

        $client = $this->googleOAuthService->authorizedClientFor($organizer);
        if ($client === null) {
            return $this->emptyEventResponse();
        }

        $calendarClass = 'Google\\Service\\Calendar';
        $eventClass = 'Google\\Service\\Calendar\\Event';
        $calendarService = new $calendarClass($client);

        $timezone = (string) ($payload['timezone'] ?? config('google.calendar.timezone', 'Africa/Lagos'));
        $requestId = 'fastlink-meeting-' . str_replace('.', '', uniqid('', true));

        $event = new $eventClass([
            'summary' => (string) ($payload['title'] ?? 'Meeting'),
            'description' => (string) ($payload['description'] ?? ''),
            'start' => [
                'dateTime' => Carbon::parse((string) $payload['start_at'])->toIso8601String(),
                'timeZone' => $timezone,
            ],
            'end' => [
                'dateTime' => Carbon::parse((string) $payload['end_at'])->toIso8601String(),
                'timeZone' => $timezone,
            ],
            'attendees' => array_map(fn(string $email): array => ['email' => $email], $attendeeEmails),
            'conferenceData' => [
                'createRequest' => [
                    'requestId' => $requestId,
                    'conferenceSolutionKey' => [
                        'type' => 'hangoutsMeet',
                    ],
                ],
            ],
        ]);

        $calendarId = $this->googleOAuthService->calendarIdFor($organizer);
        try {
            $created = $calendarService->events->insert($calendarId, $event, [
                'conferenceDataVersion' => 1,
                'sendUpdates' => 'all',
            ]);
        } catch (Throwable $exception) {
            Log::error('Google Calendar create event failed. Continuing without Google sync.', [
                'organizer_id' => $organizer->id,
                'calendar_id' => $calendarId,
                'error' => $exception->getMessage(),
            ]);

            return $this->emptyEventResponse();
        }

        return [
            'event_id' => $created->id,
            'meet_link' => $created->hangoutLink,
            'calendar_link' => $created->htmlLink,
            'calendar_id' => $calendarId,
        ];
    }

    public function updateMeetingEvent(User $organizer, string $eventId, array $payload, array $attendeeEmails): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $client = $this->googleOAuthService->authorizedClientFor($organizer);
        if ($client === null) {
            return;
        }

        $calendarClass = 'Google\\Service\\Calendar';
        $eventDateTimeClass = 'Google\\Service\\Calendar\\EventDateTime';
        $calendarService = new $calendarClass($client);
        $calendarId = $this->googleOAuthService->calendarIdFor($organizer);

        try {
            $event = $calendarService->events->get($calendarId, $eventId);
        } catch (Throwable $exception) {
            Log::error('Google Calendar get event for update failed. Skipping Google sync update.', [
                'organizer_id' => $organizer->id,
                'calendar_id' => $calendarId,
                'event_id' => $eventId,
                'error' => $exception->getMessage(),
            ]);

            return;
        }
        $timezone = (string) ($payload['timezone'] ?? config('google.calendar.timezone', 'Africa/Lagos'));

        if (array_key_exists('title', $payload)) {
            $event->setSummary((string) $payload['title']);
        }

        if (array_key_exists('description', $payload)) {
            $event->setDescription((string) ($payload['description'] ?? ''));
        }

        if (array_key_exists('start_at', $payload)) {
            $event->setStart(new $eventDateTimeClass([
                'dateTime' => Carbon::parse((string) $payload['start_at'])->toIso8601String(),
                'timeZone' => $timezone,
            ]));
        }

        if (array_key_exists('end_at', $payload)) {
            $event->setEnd(new $eventDateTimeClass([
                'dateTime' => Carbon::parse((string) $payload['end_at'])->toIso8601String(),
                'timeZone' => $timezone,
            ]));
        }

        $event->setAttendees(array_map(fn(string $email): array => ['email' => $email], $attendeeEmails));

        try {
            $calendarService->events->update($calendarId, $eventId, $event, [
                'sendUpdates' => 'all',
            ]);
        } catch (Throwable $exception) {
            Log::error('Google Calendar update event failed. Skipping Google sync update.', [
                'organizer_id' => $organizer->id,
                'calendar_id' => $calendarId,
                'event_id' => $eventId,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function deleteMeetingEvent(User $organizer, string $eventId): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $client = $this->googleOAuthService->authorizedClientFor($organizer);
        if ($client === null) {
            return;
        }

        $calendarClass = 'Google\\Service\\Calendar';
        $calendarService = new $calendarClass($client);
        $calendarId = $this->googleOAuthService->calendarIdFor($organizer);

        try {
            $calendarService->events->delete($calendarId, $eventId, [
                'sendUpdates' => 'all',
            ]);
        } catch (Throwable $exception) {
            Log::error('Google Calendar delete event failed. Skipping Google sync delete.', [
                'organizer_id' => $organizer->id,
                'calendar_id' => $calendarId,
                'event_id' => $eventId,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function isEnabled(): bool
    {
        return (bool) config('google.enabled', false);
    }

    /**
     * @return array{event_id:string|null, meet_link:string|null, calendar_link:string|null, calendar_id:string|null}
     */
    private function emptyEventResponse(): array
    {
        return [
            'event_id' => null,
            'meet_link' => null,
            'calendar_link' => null,
            'calendar_id' => null,
        ];
    }
}
