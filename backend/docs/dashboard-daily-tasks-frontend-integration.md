# Dashboard Daily Tasks API - Frontend Integration Guide

## Overview
This API provides dashboard-ready tasks for a selected day with role-based visibility handled on the backend.

- Admin and Supervisor: see all matching tasks
- Staff: see only tasks assigned to them or created by them

## Endpoint
`GET /api/v1/dashboard/daily-tasks`

## Auth
- Requires Bearer token (Sanctum)
- Roles allowed: admin, supervisor, staff

## Query Parameters
- `date` (optional): `YYYY-MM-DD`
  - Default: today in app timezone
- `status` (optional): one of `todo`, `in_progress`, `review`, `completed`
- `limit` (optional): integer `1` to `200`, default `50`

## Daily Task Logic
A task is included when:

- `start_date <= date`
- `due_date >= date`

This includes:
- Tasks that start on the date
- Tasks that span multiple days
- Tasks that end on the date

## Request Examples
### Default (today)
```http
GET /api/v1/dashboard/daily-tasks
```

### Specific date
```http
GET /api/v1/dashboard/daily-tasks?date=2026-06-01
```

### Date with status filter
```http
GET /api/v1/dashboard/daily-tasks?date=2026-06-01&status=in_progress
```

## Response Shape
```json
{
  "success": true,
  "message": "Dashboard daily tasks fetched.",
  "data": {
    "date": "2026-06-01",
    "total_tasks": 8,
    "tasks": [
      {
        "id": 101,
        "title": "Follow up leads",
        "status": "in_progress",
        "start_date": "2026-06-01",
        "due_date": "2026-06-02",
        "assigned_to": {
          "id": 5,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "created_by": {
          "id": 2,
          "name": "Admin",
          "email": "admin@example.com"
        }
      }
    ]
  },
  "meta": {}
}
```

## Field Usage
- `data.tasks`: render daily task list
- `data.total_tasks`: render count chip/header
- `data.date`: render selected day context

## UI Notes
- Default dashboard load should call endpoint without `date`
- Use `date` query parameter for date switching
- Use optional `status` for focused views (e.g., in-progress only)
- If `tasks` is empty, show a friendly empty state

## Error Handling
- Invalid date format returns `422`
- Invalid status returns `422`
- Unauthenticated returns `401`
- Forbidden role returns `403`

## Performance Notes
- Backend query uses date-window filtering and role-scoped access in SQL
- Recommended indexes are included for:
  - `tasks.start_date`
  - `tasks.due_date`
  - `tasks.created_by`
  - `task_user(user_id, task_id)`

## Compatibility
This endpoint is additive and does not change existing `/tasks` contract.
