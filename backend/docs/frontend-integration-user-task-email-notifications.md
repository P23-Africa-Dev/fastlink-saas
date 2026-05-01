# Frontend Integration Notes: User Creation + Task Assignment Emails

## Summary
Backend now sends email notifications for:

1. New user accounts created by Admin or Supervisor.
2. Task creation events for all assigned users.

This document explains what frontend needs to do (and what changed on API behavior).

## 1) User Creation Email Flow

### Endpoint
- `POST /api/v1/users`

### Access Control
- Allowed roles: `admin`, `supervisor`.
- Restriction: supervisor **cannot** create `admin` users (returns `403`).

### Request Payload Changes
- `password` is no longer required for account creation.
- Backend generates a temporary password automatically and emails it to the new user.
- If frontend still sends `password`, backend ignores it for account provisioning.

Recommended payload:
```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "role": "staff"
}
```

### Email Content Sent to New User
- Login page URL (from backend env `FRONTEND_LOGIN_URL`)
- Login email
- Generated temporary password

### Frontend Action Items
1. Remove required password input from “Create User” UI.
2. Show success copy like: “User created. A temporary password was emailed.”
3. Handle `403` response specifically when a supervisor tries to create an admin user.

## 2) Task Assignment Email on Task Creation

### Endpoint
- `POST /api/v1/tasks`

### Behavior
- If `assignee_ids` is provided during task creation, backend emails every assigned user.
- No frontend change required for trigger; existing payload usage already works.

Example payload:
```json
{
  "title": "Prepare wireframes",
  "project_id": 10,
  "status": "todo",
  "priority": "medium",
  "assignee_ids": [4, 8, 11]
}
```

### Frontend Action Items
1. Keep `assignee_ids` populated during create flow to trigger notifications.
2. Optionally show UX text: “Assigned users will receive an email notification.”

## 3) Environment Coordination

Backend env variable used for login URL in emails:
- `FRONTEND_LOGIN_URL`

Examples:
- Production: `FRONTEND_LOGIN_URL=https://fastlink.p23africa.com`
- Local: `FRONTEND_LOGIN_URL=http://localhost:3000`

## 4) Error Handling Expectations

- User create with supervisor role + target role `admin` => `403`
- Other validation errors => `422`
- Success => `201`

No API response includes plaintext temporary password (security by email delivery only).
