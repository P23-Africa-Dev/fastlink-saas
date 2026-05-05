# Notification & Activity Log API Guide

## Overview

This backend implementation is optimized for shared hosting:

- No queue workers
- No WebSockets
- No background daemons
- Synchronous write path only
- Polling-based frontend update strategy

All in-app notifications are written directly to the database during the request lifecycle.

## Data Model

### notifications

- `id`
- `user_id`
- `type`
- `title`
- `message`
- `metadata` (JSON)
- `is_read` (boolean)
- `priority` (`low|medium|high`)
- `dedupe_key` (nullable, used for duplicate suppression)
- `created_at`

Indexes:

- `(user_id, is_read)`
- `(user_id, created_at)`
- unique `(user_id, dedupe_key)`

### activity_logs

- `id`
- `user_id` (nullable)
- `action`
- `description`
- `metadata` (JSON)
- `created_at`

Indexes:

- `(action, created_at)`
- `(user_id, created_at)`

## Notification APIs

Base: `/api/v1`

### GET `/notifications`

Query params:

- `per_page` (default 20, max 50)
- `unread_only` (`true|false`)

Response: paginated notifications for authenticated user.

### GET `/notifications/unread-count`

Response:

```json
{ "success": true, "data": { "unread_count": 4 } }
```

### POST `/notifications/mark-as-read`

Request:

```json
{ "ids": [1, 2, 3] }
```

### POST `/notifications/mark-all-read`

No payload.

### DELETE `/notifications/{id}`

Deletes one notification owned by authenticated user.

## Activity Log API

### GET `/activity-logs`

Admin-only.

Query params:

- `per_page` (default 25)
- `action` (optional exact filter)

## Trigger Matrix Implemented

### CRM

- `crm.lead_created`: admin
- `crm.lead_assigned`: admin + assigned user
- `crm.lead_imported`: admin (`priority=high`, includes `metadata.device_recommended=true`)

### Project

- `project.valuable_created`: admin when `is_valuable=true`
- `project.tag_created`: admin + supervisor
- `project.tag_assigned`: assigned staff only

### Attendance

- `attendance.clock_in`: admin + supervisor
- `attendance.clock_out`: admin + supervisor

### Leave

- `leave.request_created`: admin + supervisor
- `leave.status_updated`: requester/staff

### User Management

- `user.created_by_supervisor`: admin

## Polling Strategy (Frontend)

Use lightweight polling every 5-15 seconds.

```ts
setInterval(async () => {
  await Promise.all([
    api.get('/api/v1/notifications/unread-count'),
    api.get('/api/v1/notifications?per_page=15')
  ]);
}, 10000);
```

Recommended pattern:

1. Poll unread count frequently (5-10s)
2. Poll full list at a slightly lower frequency (10-15s)
3. Stop polling when tab is hidden if desired

## Device Notification Strategy (Optional)

No server push pipeline is used.

Instead:

1. Frontend polling receives notifications.
2. If notification has:

- `priority = high`, or
- `metadata.device_recommended = true`

frontend can trigger browser/device notification locally.

This keeps backend synchronous and shared-hosting compatible.

## Performance Notes

- Batch write via `insertOrIgnore` in notification service
- Deduping through unique `(user_id, dedupe_key)`
- No queue overhead
- Paginated APIs only
- Notification scope limited to important events

## Migration Notes

New migrations:

- `2026_05_05_090000_create_notifications_table.php`
- `2026_05_05_090100_create_activity_logs_table.php`
- `2026_05_05_090200_add_is_valuable_to_projects_table.php`
- `2026_05_05_090300_create_project_tags_table.php`
- `2026_05_05_090400_create_project_tag_user_table.php`

Run:

```bash
php artisan migrate
```
