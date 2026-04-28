# FastLink SaaS Backend API Reference

Version: v1
Base URL: `/api/v1`
Auth: Laravel Sanctum Bearer Token

## 1) Authentication

### Login
- Method: `POST`
- URL: `/auth/login`
- Auth required: No

Request body:
```json
{
  "email": "admin@fastlink.test",
  "password": "password123",
  "device_name": "frontend-web"
}
```

Success response:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "1|long-token",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "Fastlink Admin",
      "email": "admin@fastlink.test",
      "roles": [
        {"id": 1, "name": "admin"}
      ]
    }
  },
  "meta": {}
}
```

### Current User
- Method: `GET`
- URL: `/auth/me`
- Auth required: Yes

### Logout
- Method: `POST`
- URL: `/auth/logout`
- Auth required: Yes

---

## 2) Health

### API Health Check
- Method: `GET`
- URL: `/health`
- Auth required: No

Success response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T12:00:00+00:00",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "ok",
      "driver": "sqlite"
    },
    "app": {
      "status": "ok",
      "name": "FastLink SaaS",
      "env": "local",
      "debug": true
    }
  }
}
```

---

## 3) Response Format

### Success Envelope
```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```

### Error Envelope
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

### Common HTTP Status Codes
- `200` OK
- `201` Created
- `401` Unauthenticated
- `403` Forbidden
- `404` Resource not found
- `422` Validation failed
- `500` Server error

---

## 4) Role Access Matrix

- `admin`: Full access to all modules
- `supervisor`: Access to operational modules and approvals
- `staff`: Access to own operations and shared business modules

High-level route protection:
- User management: `admin`
- CRM drives/statuses: `admin|supervisor`
- CRM leads: `admin|supervisor|staff` (delete/import restricted)
- Projects/Tasks: mixed (create/delete typically `admin|supervisor`)
- Attendance/Leave: all roles (decisions restricted)
- Spreadsheet: all roles (delete restricted)

---

## 5) Dashboard Module

### Get Dashboard Stats
- Method: `GET`
- URL: `/dashboard/stats`
- Auth required: Yes
- Roles: `admin|supervisor|staff`

Response includes:
- `overview` (users/leads/projects/tasks/attendance/leaves/spreadsheets)
- `crm` (new/won/lost/pipeline value/conversion)
- `projects` (active/completed/pending)
- `monthly` (new leads/completed tasks)

---

## 6) User Management Module

### List Users
- Method: `GET`
- URL: `/users`
- Roles: `admin`
- Query:
  - `q` (string, optional)
  - `role` (`admin|supervisor|staff`, optional)
  - `per_page` (int, optional)

### Create User
- Method: `POST`
- URL: `/users`
- Roles: `admin`

Request body:
```json
{
  "name": "John Supervisor",
  "email": "john@fastlink.test",
  "password": "password123",
  "role": "supervisor"
}
```

### Show User
- Method: `GET`
- URL: `/users/{id}`
- Roles: `admin`

### Update User
- Method: `PATCH`
- URL: `/users/{id}`
- Roles: `admin`

Request body example:
```json
{
  "name": "John Updated",
  "role": "staff",
  "suspended": false
}
```

### Delete User
- Method: `DELETE`
- URL: `/users/{id}`
- Roles: `admin`

---

## 7) CRM Module

### 7.1 Lead Drives (Pipeline)

- `GET /crm/drives`
- `POST /crm/drives`
- `GET /crm/drives/{id}`
- `PATCH /crm/drives/{id}`
- `DELETE /crm/drives/{id}`

Create body:
```json
{
  "name": "Enterprise",
  "slug": "enterprise",
  "description": "Enterprise pipeline",
  "color": "#1d4ed8",
  "position": 2,
  "is_default": false
}
```

### 7.2 Lead Statuses

- `GET /crm/statuses`
- `POST /crm/statuses`
- `GET /crm/statuses/{id}`
- `PATCH /crm/statuses/{id}`
- `DELETE /crm/statuses/{id}`

Create body:
```json
{
  "name": "Qualified",
  "slug": "qualified",
  "color": "#7c3aed",
  "position": 3,
  "is_default": false,
  "is_won": false,
  "is_lost": false
}
```

### 7.3 Leads

- `GET /crm/leads`
- `POST /crm/leads`
- `GET /crm/leads/{id}`
- `PATCH /crm/leads/{id}`
- `DELETE /crm/leads/{id}`

Query filters for list:
- `q`, `status`, `priority`, `drive_id`, `assigned_to`, `per_page`

Create body sample:
```json
{
  "first_name": "Alice",
  "last_name": "Smith",
  "email": "alice@lead.test",
  "phone": "+1234567",
  "company": "Globex",
  "status": "new",
  "priority": "high",
  "drive_id": 1,
  "status_id": 1,
  "assigned_to": 2,
  "estimated_value": 15000,
  "currency": "USD",
  "notes": "Warm lead from referral"
}
```

### 7.4 Lead Activities

- `GET /crm/leads/{id}/activities`
- `POST /crm/leads/{id}/activities`
- `PATCH /crm/activities/{activityId}`

Create activity body:
```json
{
  "type": "call",
  "title": "Discovery Call",
  "description": "Discussed requirements",
  "scheduled_at": "2026-05-01 10:00:00",
  "is_completed": true,
  "metadata": {"duration_minutes": 30}
}
```

### 7.5 Lead Import

- Method: `POST`
- URL: `/crm/leads/import`
- Content-Type: `multipart/form-data`
- Roles: `admin|supervisor`

Form fields:
- `file` (required): csv, txt, xlsx, xls
- `status` (optional)
- `priority` (optional)
- `currency` (optional)
- `drive_id` (optional)
- `status_id` (optional)
- `assigned_to` (optional)

Import response sample:
```json
{
  "success": true,
  "message": "Lead import completed.",
  "data": {
    "imported": 24,
    "skipped": 2,
    "errors": [
      "Row 5: missing one of first_name/company/email."
    ]
  },
  "meta": {}
}
```

---

## 8) Spreadsheet Module

### List
- `GET /spreadsheets`

### Upload
- `POST /spreadsheets`
- multipart/form-data fields:
  - `name` (required)
  - `description` (optional)
  - `file` (required: xlsx,xls,csv,pdf,doc,docx,txt)

### Show
- `GET /spreadsheets/{id}`

### Download
- `GET /spreadsheets/{id}/download`

### Update
- `PATCH /spreadsheets/{id}`

Body:
```json
{
  "name": "Updated Sheet",
  "description": "Updated description",
  "sheet_data": {
    "version": 1,
    "rows": []
  }
}
```

### Delete
- `DELETE /spreadsheets/{id}`

---

## 9) Project Management Module

### 9.1 Projects

- `GET /projects`
- `POST /projects`
- `GET /projects/{id}`
- `PATCH /projects/{id}`
- `DELETE /projects/{id}`

Create body sample:
```json
{
  "name": "Mobile App Build",
  "description": "Core product initiative",
  "status": "in_progress",
  "priority": "high",
  "start_date": "2026-05-01",
  "due_date": "2026-08-01"
}
```

### 9.2 Tasks

- `GET /tasks`
- `POST /tasks`
- `GET /tasks/{id}`
- `PATCH /tasks/{id}`
- `DELETE /tasks/{id}`

Create body sample:
```json
{
  "title": "Implement auth module",
  "description": "Sanctum + role middleware",
  "project_id": 1,
  "status": "todo",
  "priority": "high",
  "start_date": "2026-05-01",
  "due_date": "2026-05-07",
  "assignee_ids": [2, 3]
}
```

### 9.3 Kanban
- Method: `GET`
- URL: `/tasks/kanban`
- Query: `project_id` (optional)

Response groups tasks by statuses:
- `todo`
- `in_progress`
- `review`
- `completed`

### 9.4 Task Reorder / Move
- Method: `PATCH`
- URL: `/tasks/{id}/reorder`

Body:
```json
{
  "status": "in_progress",
  "order": 4
}
```

### 9.5 Task Comments
- Method: `POST`
- URL: `/tasks/{id}/comments`

Body:
```json
{
  "comment": "Please verify acceptance criteria",
  "attachments": []
}
```

### 9.6 Task Assignees
- Method: `POST`
- URL: `/tasks/{id}/assign`

Body:
```json
{
  "assignee_ids": [2, 4]
}
```

### 9.7 Gantt
- Method: `GET`
- URL: `/projects/gantt`
- Query: `from` (optional), `to` (optional)

---

## 10) Attendance Module

### List Attendance Logs
- Method: `GET`
- URL: `/attendance`
- Query:
  - `from` (optional, date)
  - `to` (optional, date)
  - `user_id` (optional, ignored for staff)

### Sign In
- Method: `POST`
- URL: `/attendance/sign-in`

Body:
```json
{
  "note": "Starting work"
}
```

### Sign Out
- Method: `POST`
- URL: `/attendance/sign-out`

Body:
```json
{
  "note": "Done for today"
}
```

### Calendar View
- Method: `GET`
- URL: `/attendance/calendar`
- Query:
  - `month` (format `YYYY-MM`, optional)
  - `user_id` (optional for admin/supervisor)

---

## 11) Leave Request Module

### List Leave Requests
- Method: `GET`
- URL: `/leave-requests`
- Query: `status`, `from`, `to`, `user_id`, `per_page`

### Create Leave Request
- Method: `POST`
- URL: `/leave-requests`

Body:
```json
{
  "type": "annual",
  "reason": "Family event",
  "start_date": "2026-06-10",
  "end_date": "2026-06-12",
  "supervisor_id": 2
}
```

### Show Leave Request
- Method: `GET`
- URL: `/leave-requests/{id}`

### Supervisor/Admin Decision
- Method: `POST`
- URL: `/leave-requests/{id}/decide`

Body (approve/reject):
```json
{
  "status": "approved",
  "decision_note": "Approved"
}
```

Body (modify):
```json
{
  "status": "modified",
  "supervisor_note": "Can you shift dates?",
  "modified_start_date": "2026-06-11",
  "modified_end_date": "2026-06-12"
}
```

### Staff Response to Modified Request
- Method: `POST`
- URL: `/leave-requests/{id}/respond`

Body:
```json
{
  "accept": true,
  "sender_response_note": "Accepted"
}
```

### Leave Calendar
- Method: `GET`
- URL: `/leave-requests/calendar`
- Query: `month=YYYY-MM`

---

## 12) Pagination

Any paginated endpoint returns pagination metadata in `meta.pagination`:

```json
{
  "meta": {
    "pagination": {
      "total": 125,
      "per_page": 15,
      "current_page": 1,
      "last_page": 9
    }
  }
}
```

---

## 13) MySQL Production Switch (Planned)

Current development uses SQLite. For production MySQL:

1. Update `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fastlink_saas
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

2. Run migrations:
```bash
php artisan migrate --force
```

3. Seed defaults:
```bash
php artisan db:seed --force
```

No organization/multi-tenant fields are required in this backend.
