# Meeting Scheduling + Google Meet Frontend Integration

## Overview
This guide explains how frontend clients integrate with the backend meeting scheduling APIs.

MVP scope:
- One-time meetings are fully supported.
- Recurring RRULE/series behavior is deferred to v2 and should not be assumed by frontend flows.
- Google RSVP invitations require the organizer to connect a real Google account via OAuth before meeting creation.

- Base API prefix: `/api/v1`
- Auth: Bearer token (Sanctum)
- Allowed roles to create/update/cancel: `admin`, `supervisor`, `staff`
- Timezone baseline: `Africa/Lagos` (GMT+1)

## Endpoints

- `POST /meetings` create meeting
- `GET /meetings` list meetings visible to current user
- `GET /meetings/{meeting}` get one meeting
- `PUT /meetings/{meeting}` update/reschedule meeting
- `DELETE /meetings/{meeting}` cancel meeting
- `GET /calendar/meetings` list meetings for calendar rendering
- `GET /calendar/events?type=meeting` unified calendar feed including meeting events
- `GET /google/calendar/status` check organizer Google connection
- `GET /google/calendar/connect` start organizer OAuth flow
- `DELETE /google/calendar/disconnect` disconnect organizer Google account

Absolute API paths:
- Versioned primary: `/api/v1/...`
- Backward-compatible aliases for required integration routes:
  - `POST /api/meetings`
  - `PUT /api/meetings/{meeting}`
  - `DELETE /api/meetings/{meeting}`
  - `GET /api/calendar/meetings`

## Meeting Creation Payload

```json
{
  "title": "Sales Strategy Meeting",
  "description": "Monthly sales review",
  "start_at": "2026-05-12 10:00:00",
  "end_at": "2026-05-12 11:00:00",
  "timezone": "Africa/Lagos",
  "guest_ids": [2, 5, 8],
  "guest_emails": ["external.guest@example.com"],
  "reminder_minutes": [15, 60],
  "project_id": 12,
  "task_id": 47,
  "share_meeting_link": true,
  "share_calendar_link": false,
  "is_recurring": false,
  "auto_record": false,
  "approval_required": false
}
```

Notes:
- `guest_ids` is for internal users.
- `guest_emails` allows external guests.
- `reminder_minutes` drives cron-based reminder sending.
- `timezone` defaults to `Africa/Lagos` if omitted.
- If Google Calendar integration is enabled, organizer must connect Google first or meeting creation will be rejected.

## Calendar Response Structure

`GET /calendar/meetings` and `GET /calendar/events?type=meeting` return meeting data including organizer, guest details, and links.

Example meeting object:

```json
{
  "id": 101,
  "title": "Sales Strategy Meeting",
  "description": "Monthly sales review",
  "organizer_id": 1,
  "start_at": "2026-05-12T09:00:00.000000Z",
  "end_at": "2026-05-12T10:00:00.000000Z",
  "timezone": "Africa/Lagos",
  "status": "scheduled",
  "meet_link": "https://meet.google.com/abc-defg-hij",
  "calendar_link": "https://calendar.google.com/event?eid=...",
  "external_guest_emails": ["external.guest@example.com"],
  "organizer": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "attendees": [
    {
      "id": 2,
      "name": "Staff A",
      "email": "staff.a@example.com",
      "pivot": {
        "response_status": "pending",
        "responded_at": null
      }
    }
  ]
}
```

Example unified calendar event object (`/calendar/events?type=meeting`):

```json
{
  "id": "meeting_101",
  "type": "meeting",
  "title": "Sales Strategy Meeting",
  "start_date": "2026-05-12",
  "end_date": "2026-05-12",
  "status": "scheduled",
  "meta": {
    "meeting_id": 101,
    "organizer": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "guest_count": 2,
    "meet_link": "https://meet.google.com/abc-defg-hij",
    "calendar_link": "https://calendar.google.com/event?eid=...",
    "timezone": "Africa/Lagos",
    "start_at": "2026-05-12T09:00:00+00:00",
    "end_at": "2026-05-12T10:00:00+00:00"
  }
}
```

## Frontend Calendar Requirements

1. Render meetings only for the current user visibility scope:
   - organizer can view
   - invited users can view
   - others cannot view
2. Show core cards with:
   - title
   - organizer
   - start/end time (formatted to `Africa/Lagos` by default)
   - attendee count
3. Show CTAs:
   - `Join Meet` if `meet_link` exists
   - `Open Calendar` if `calendar_link` exists and sharing enabled
4. Support reschedule/update through `PUT /meetings/{meeting}`.
5. Support cancellation through `DELETE /meetings/{meeting}`.

## Suggested Frontend Fetch Flow

```ts
const list = await api.get('/meetings', {
  params: {
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    per_page: 50,
  },
});

const calendarFeed = await api.get('/calendar/events', {
  params: {
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    type: 'meeting',
  },
});

const googleStatus = await api.get('/google/calendar/status');

if (!googleStatus.data.data.connected) {
  const connect = await api.get('/google/calendar/connect');
  window.location.href = connect.data.data.authorization_url;
}
```

## Exact OAuth Popup + Guard Sequence

Use this sequence in the calendar or meeting scheduling UI:

1. On page load, call `GET /google/calendar/status` for users who can schedule meetings.
2. If `connected === true`, allow the normal meeting modal flow.
3. If `connected === false`, intercept the `Schedule Meeting` action and show a Google connection prompt instead of the meeting modal.
4. When the user clicks `Connect Google Calendar`, call `GET /google/calendar/connect`.
5. Open `authorization_url` in a popup window.
6. While the popup is open, poll `GET /google/calendar/status` every 1-2 seconds.
7. When status becomes connected:
   - close the popup
   - close the connection prompt
   - restore the user intent
   - open the meeting modal automatically
8. If the popup closes before the status changes, keep the meeting modal blocked and show a retry action.

Recommended frontend behavior:

- Keep a `pendingMeetingDate` or similar state so the user does not lose the original action.
- Surface `last_error` from `GET /google/calendar/status` near the connect CTA.
- On meeting create `422` with `google_calendar` validation error, show the backend message directly rather than a generic toast.

Pseudo-flow:

```ts
const status = await api.get('/google/calendar/status');

if (status.data.data.connected) {
  openMeetingModal();
  return;
}

showGoogleConnectPrompt();

const { data } = await api.get('/google/calendar/connect');
const popup = window.open(data.data.authorization_url, 'google-calendar-connect', 'popup=yes,width=560,height=720');

const timer = window.setInterval(async () => {
  const refreshed = await api.get('/google/calendar/status');
  if (refreshed.data.data.connected) {
    window.clearInterval(timer);
    popup?.close();
    hideGoogleConnectPrompt();
    openMeetingModal();
  }

  if (popup?.closed) {
    window.clearInterval(timer);
  }
}, 1500);
```

## Error Handling

Common statuses:
- `401` unauthenticated
- `403` forbidden by role or visibility rules
- `404` meeting not found
- `422` validation failed

Sample `422`:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "end_at": ["The end at field must be a date after start at."]
  }
}
```

## Cron Requirement (No Queue Worker)

This deployment uses synchronous API processing and cron-based reminders.

Cron command:

```bash
php artisan meetings:send-reminders
```

Recommended crontab:

```bash
* * * * * cd /home/username/fastlink/backend && php artisan schedule:run >> /dev/null 2>&1
```

This triggers:
- `meetings:send-reminders` every minute
- `attendance:auto-clock-out` every minute

## Google Integration Setup Checklist

- Set `GOOGLE_CALENDAR_ENABLED=true`
- Set `GOOGLE_CLIENT_ID`
- Set `GOOGLE_CLIENT_SECRET`
- Set `GOOGLE_REDIRECT_URI`
- Set success/failure frontend redirect URLs
- Set `GOOGLE_CALENDAR_ID=primary` for personal Gmail organizers
- Keep `GOOGLE_CALENDAR_TIMEZONE=Africa/Lagos`
- Review [backend/docs/google-calendar-oauth-setup.md](backend/docs/google-calendar-oauth-setup.md)
