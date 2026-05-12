<?php

namespace App\Services;

use App\Services\Contracts\GoogleCalendarClient;
use Carbon\Carbon;
use RuntimeException;

class GoogleCalendarService implements GoogleCalendarClient
{
    public function createMeetingEvent(array $payload, array $attendeeEmails): array
    {
        if (!$this->isEnabled()) {
            return [
                'event_id' => null,
                'meet_link' => null,
                'calendar_link' => null,
                'calendar_id' => null,
            ];
        }

        $client = $this->buildClient();
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

        $calendarId = (string) config('google.calendar.id', 'primary');
        $created = $calendarService->events->insert($calendarId, $event, [
            'conferenceDataVersion' => 1,
            'sendUpdates' => 'all',
        ]);

        return [
            'event_id' => $created->id,
            'meet_link' => $created->hangoutLink,
            'calendar_link' => $created->htmlLink,
            'calendar_id' => $calendarId,
        ];
    }

    public function updateMeetingEvent(string $eventId, array $payload, array $attendeeEmails): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $client = $this->buildClient();
        $calendarClass = 'Google\\Service\\Calendar';
        $eventDateTimeClass = 'Google\\Service\\Calendar\\EventDateTime';
        $calendarService = new $calendarClass($client);
        $calendarId = (string) config('google.calendar.id', 'primary');

        $event = $calendarService->events->get($calendarId, $eventId);
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

        $calendarService->events->update($calendarId, $eventId, $event, [
            'sendUpdates' => 'all',
        ]);
    }

    public function deleteMeetingEvent(string $eventId): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $client = $this->buildClient();
        $calendarClass = 'Google\\Service\\Calendar';
        $calendarService = new $calendarClass($client);
        $calendarService->events->delete((string) config('google.calendar.id', 'primary'), $eventId, [
            'sendUpdates' => 'all',
        ]);
    }

    private function isEnabled(): bool
    {
        return (bool) config('google.enabled', false);
    }

    private function buildClient(): object
    {
        $clientClass = 'Google\\Client';
        if (!class_exists($clientClass)) {
            throw new RuntimeException('google/apiclient is not installed. Run composer require google/apiclient:^2.18.');
        }

        $keyPath = (string) config('google.service_account.key_path');
        if ($keyPath === '' || !is_file($keyPath)) {
            throw new RuntimeException('Google service account key file was not found.');
        }

        $client = new $clientClass();
        $client->setAuthConfig($keyPath);
        $client->setApplicationName(config('app.name', 'FastLink SaaS') . ' Meetings');
        $calendarClass = 'Google\\Service\\Calendar';
        $client->setScopes([
            $calendarClass::CALENDAR,
            $calendarClass::CALENDAR_EVENTS,
        ]);
        $client->setAccessType('offline');

        return $client;
    }
}
