<?php

use App\Models\Meeting;
use App\Models\User;
use App\Notifications\MeetingInvitationNotification;
use App\Services\Contracts\GoogleCalendarClient;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

class FakeGoogleCalendarClient implements GoogleCalendarClient
{
    public array $created = [];
    public array $updated = [];
    public array $deleted = [];

    public function createMeetingEvent(User $organizer, array $payload, array $attendeeEmails): array
    {
        $this->created[] = ['organizer_id' => $organizer->id, 'payload' => $payload, 'emails' => $attendeeEmails];

        return [
            'event_id' => 'evt_test_123',
            'meet_link' => 'https://meet.google.com/test-link',
            'calendar_link' => 'https://calendar.google.com/event?eid=test',
            'calendar_id' => 'primary',
        ];
    }

    public function updateMeetingEvent(User $organizer, string $eventId, array $payload, array $attendeeEmails): void
    {
        $this->updated[] = ['organizer_id' => $organizer->id, 'event_id' => $eventId, 'payload' => $payload, 'emails' => $attendeeEmails];
    }

    public function deleteMeetingEvent(User $organizer, string $eventId): void
    {
        $this->deleted[] = ['organizer_id' => $organizer->id, 'event_id' => $eventId];
    }
}

it('creates a meeting and generates meet link with guests', function () {
    Notification::fake();

    $fakeGoogle = new FakeGoogleCalendarClient();
    app()->instance(GoogleCalendarClient::class, $fakeGoogle);

    $organizer = apiUser('admin', ['email' => 'organizer@fastlink.test']);
    $internalGuest = apiUser('staff', ['email' => 'staff.guest@fastlink.test']);
    Sanctum::actingAs($organizer);

    $response = $this->postJson('/api/v1/meetings', [
        'title' => 'Sales Strategy Meeting',
        'description' => 'Monthly sales review',
        'start_at' => now()->addDay()->setHour(10)->setMinute(0)->toDateTimeString(),
        'end_at' => now()->addDay()->setHour(11)->setMinute(0)->toDateTimeString(),
        'timezone' => 'Africa/Lagos',
        'guest_ids' => [$internalGuest->id],
        'guest_emails' => ['external.guest@example.com'],
        'reminder_minutes' => [15, 60],
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.title', 'Sales Strategy Meeting')
        ->assertJsonPath('data.meet_link', 'https://meet.google.com/test-link');

    expect($fakeGoogle->created)->toHaveCount(1);
    expect($fakeGoogle->created[0]['organizer_id'])->toBe($organizer->id);

    Notification::assertSentTo($internalGuest, MeetingInvitationNotification::class);

    $meetingId = $response->json('data.id');
    $meeting = Meeting::findOrFail($meetingId);
    expect($meeting->attendees()->where('users.id', $internalGuest->id)->exists())->toBeTrue();
    expect($meeting->external_guest_emails)->toContain('external.guest@example.com');
    expect($meeting->reminders()->count())->toBe(2);
});

it('updates and cancels a meeting with google sync', function () {
    Notification::fake();

    $fakeGoogle = new FakeGoogleCalendarClient();
    app()->instance(GoogleCalendarClient::class, $fakeGoogle);

    $organizer = apiUser('supervisor', ['email' => 'supervisor@fastlink.test']);
    Sanctum::actingAs($organizer);

    $create = $this->postJson('/api/v1/meetings', [
        'title' => 'Pipeline Review',
        'start_at' => now()->addDays(2)->setHour(14)->setMinute(0)->toDateTimeString(),
        'end_at' => now()->addDays(2)->setHour(15)->setMinute(0)->toDateTimeString(),
        'timezone' => 'Africa/Lagos',
    ])->assertCreated();

    $meetingId = $create->json('data.id');

    $update = $this->putJson('/api/v1/meetings/' . $meetingId, [
        'title' => 'Pipeline Review Updated',
        'start_at' => now()->addDays(2)->setHour(16)->setMinute(0)->toDateTimeString(),
        'end_at' => now()->addDays(2)->setHour(17)->setMinute(0)->toDateTimeString(),
    ]);

    $update->assertOk()->assertJsonPath('data.title', 'Pipeline Review Updated');
    expect($fakeGoogle->updated)->toHaveCount(1);
    expect($fakeGoogle->updated[0]['organizer_id'])->toBe($organizer->id);

    $cancel = $this->deleteJson('/api/v1/meetings/' . $meetingId, ['reason' => 'Rescheduling']);
    $cancel->assertOk()->assertJsonPath('data.status', 'cancelled');
    expect($fakeGoogle->deleted[0]['event_id'])->toBe('evt_test_123');
});

it('enforces meeting visibility and management access rules', function () {
    $fakeGoogle = new FakeGoogleCalendarClient();
    app()->instance(GoogleCalendarClient::class, $fakeGoogle);

    $organizer = apiUser('staff', ['email' => 'owner@fastlink.test']);
    $guest = apiUser('staff', ['email' => 'guest@fastlink.test']);
    $other = apiUser('staff', ['email' => 'other@fastlink.test']);

    Sanctum::actingAs($organizer);
    $create = $this->postJson('/api/v1/meetings', [
        'title' => 'Private Meeting',
        'start_at' => now()->addDay()->setHour(9)->setMinute(0)->toDateTimeString(),
        'end_at' => now()->addDay()->setHour(10)->setMinute(0)->toDateTimeString(),
        'timezone' => 'Africa/Lagos',
        'guest_ids' => [$guest->id],
    ])->assertCreated();

    $meetingId = $create->json('data.id');

    Sanctum::actingAs($guest);
    $this->getJson('/api/v1/meetings/' . $meetingId)->assertOk();
    $this->putJson('/api/v1/meetings/' . $meetingId, ['title' => 'Guest Edit'])->assertForbidden();

    Sanctum::actingAs($other);
    $this->getJson('/api/v1/meetings/' . $meetingId)->assertForbidden();
});

it('shows meetings in calendar events feed for invited users', function () {
    $fakeGoogle = new FakeGoogleCalendarClient();
    app()->instance(GoogleCalendarClient::class, $fakeGoogle);

    $organizer = apiUser('admin');
    $guest = apiUser('staff');

    Sanctum::actingAs($organizer);
    $this->postJson('/api/v1/meetings', [
        'title' => 'Calendar Visibility Meeting',
        'start_at' => now()->addDays(3)->setHour(10)->setMinute(0)->toDateTimeString(),
        'end_at' => now()->addDays(3)->setHour(11)->setMinute(0)->toDateTimeString(),
        'timezone' => 'Africa/Lagos',
        'guest_ids' => [$guest->id],
    ])->assertCreated();

    Sanctum::actingAs($guest);
    $events = $this->getJson('/api/v1/calendar/events?start_date=' . now()->addDays(2)->toDateString() . '&end_date=' . now()->addDays(4)->toDateString() . '&type=meeting');

    $events->assertOk()->assertJsonPath('success', true);
    $data = $events->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['type'])->toBe('meeting');
});

it('blocks users without allowed role from creating meetings', function () {
    $fakeGoogle = new FakeGoogleCalendarClient();
    app()->instance(GoogleCalendarClient::class, $fakeGoogle);

    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/meetings', [
        'title' => 'Unauthorized Meeting',
        'start_at' => now()->addDay()->setHour(10)->setMinute(0)->toDateTimeString(),
        'end_at' => now()->addDay()->setHour(11)->setMinute(0)->toDateTimeString(),
    ])->assertForbidden();
});
