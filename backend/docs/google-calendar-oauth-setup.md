# Google Calendar OAuth Setup for RSVP Invitations

## Why RSVP Invitations Failed

The previous implementation used a Google service account. That works for creating calendar events and Meet links, but it does not work for sending official Google RSVP invitations to attendees on a personal Gmail account.

Google blocks attendee invitations from service accounts unless Domain-Wide Delegation is configured in a Google Workspace domain. Personal Gmail accounts do not support that model.

For FastLink on personal Gmail, the correct architecture is organizer OAuth:

- Organizer connects a real Google account
- FastLink creates the event in that organizer's calendar
- Google sends the official invitation email with RSVP actions

## Required Google Cloud Setup

1. Create or reuse a Google Cloud project.
2. Enable Google Calendar API.
3. Configure OAuth consent screen.
4. Create an OAuth Client ID for a web application.
5. Add the backend callback URL as an authorized redirect URI.

Example redirect URI:

```text
https://your-domain.com/api/v1/google/calendar/callback
```

## Required Environment Variables

```env
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-domain.com/api/v1/google/calendar/callback
GOOGLE_OAUTH_SUCCESS_REDIRECT_URL=https://your-frontend.com/settings/integrations/google
GOOGLE_OAUTH_FAILURE_REDIRECT_URL=https://your-frontend.com/settings/integrations/google
GOOGLE_CALENDAR_ID=primary
GOOGLE_CALENDAR_TIMEZONE=Africa/Lagos
GOOGLE_API_TIMEOUT=30
GOOGLE_API_MAX_RETRIES=2
```

## Organizer Connection Flow

1. Authenticated frontend calls `GET /api/v1/google/calendar/connect`.
2. Backend returns `authorization_url`.
3. Frontend redirects organizer to Google consent.
4. Google redirects back to `GOOGLE_REDIRECT_URI`.
5. Backend stores encrypted access and refresh tokens in `google_calendar_accounts`.
6. Backend redirects to the configured success or failure frontend URL.

## API Endpoints

- `GET /api/v1/google/calendar/status`
- `GET /api/v1/google/calendar/connect`
- `GET /api/v1/google/calendar/callback`
- `DELETE /api/v1/google/calendar/disconnect`

## Meeting Creation Behavior

When the organizer is connected:

- event is created in organizer calendar
- `conferenceDataVersion=1` is used for Meet generation
- `sendUpdates=all` is used so Google sends invitation emails
- attendees receive official Google Calendar invitations with RSVP options

When the organizer is not connected:

- backend cannot create a Google-owned RSVP invitation event
- frontend should prompt the organizer to connect Google Calendar first

## Token Handling

- Access tokens are encrypted at rest
- Refresh tokens are encrypted at rest
- Tokens are refreshed automatically before expiry
- Missing or revoked refresh tokens require organizer reconnection

## Personal Gmail Notes

- `GOOGLE_CALENDAR_ID=primary` is correct for personal Gmail organizer calendars
- Do not use service accounts for attendee RSVP delivery on personal Gmail
- Do not configure Domain-Wide Delegation unless you are on Google Workspace and intentionally using delegated admin auth

## Troubleshooting

### Attendees still do not receive RSVP invitations

Check:

1. Organizer is connected via OAuth, not service account.
2. Event creation returns a non-null `google_event_id`.
3. Organizer token is still valid and refreshable.
4. `sendUpdates=all` is present during insert and update.
5. Google account has not revoked FastLink app access.

### Google reconnect required

If `last_error` on the connection status mentions refresh token issues, disconnect and reconnect the organizer account.