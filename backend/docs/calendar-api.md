# Calendar System - Frontend Integration Guide

## Overview

The Calendar System is a **unified, read-write aggregation layer** that centralizes events across multiple modules (Attendance, Leave Requests, Projects, and Tasks) into a single calendar interface.

---

## Event Types

The calendar system supports four event types:

| Type | Description | Source | Date Handling |
|------|-------------|--------|---|
| `attendance` | Clock in/out records | Attendance table | Single-day events |
| `leave` | Leave request periods | LeaveRequest table | Multi-day spans |
| `project` | Project timelines | Project table | Start → Due Date range |
| `task` | Task assignments | Task table | Start → Due Date range |

---

## Unified Event Model

All events follow a standardized response structure:

```json
{
  "id": "event_type_resource_id",
  "type": "task",
  "title": "Follow up leads",
  "start_date": "2026-06-01",
  "end_date": "2026-06-03",
  "status": "in_progress",
  "meta": {
    "task_id": 45,
    "project_id": 12,
    "description": "Make follow-up calls",
    "priority": "high",
    "completed_at": null
  }
}
```

### Event Fields

- **`id`** — Unique identifier combining event type + resource ID
- **`type`** — Event category: `attendance`, `leave`, `project`, or `task`
- **`title`** — Display name (project name, task title, leave type, etc.)
- **`start_date`** — Start date in `YYYY-MM-DD` format
- **`end_date`** — End date in `YYYY-MM-DD` format (may equal `start_date` for single-day events)
- **`status`** — Event status (`completed`, `approved`, `pending`, `in_progress`, `todo`, etc.)
- **`meta`** — Event-specific metadata (varies by type)

---

## API Endpoints

### 1. Fetch Calendar Events

**GET** `/api/v1/calendar/events`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|---|
| `start_date` | string | ✅ | Start date in `YYYY-MM-DD` format |
| `end_date` | string | ✅ | End date in `YYYY-MM-DD` format |
| `type` | string | ❌ | Optional filter: `attendance`, `leave`, `project`, or `task` |

#### Request Example

```bash
GET /api/v1/calendar/events?start_date=2026-06-01&end_date=2026-06-30
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "task_45",
      "type": "task",
      "title": "Follow up leads",
      "start_date": "2026-06-01",
      "end_date": "2026-06-03",
      "status": "in_progress",
      "meta": {
        "task_id": 45,
        "project_id": 12,
        "description": "Make follow-up calls",
        "priority": "high",
        "completed_at": null
      }
    },
    {
      "id": "leave_23",
      "type": "leave",
      "title": "Annual Leave",
      "start_date": "2026-06-10",
      "end_date": "2026-06-15",
      "status": "approved",
      "meta": {
        "leave_id": 23,
        "type": "annual",
        "reason": "Vacation",
        "duration_days": 6
      }
    },
    {
      "id": "project_8",
      "type": "project",
      "title": "Website Redesign",
      "start_date": "2026-06-01",
      "end_date": "2026-06-30",
      "status": "in_progress",
      "meta": {
        "project_id": 8,
        "description": "Redesign company website",
        "priority": "high",
        "is_valuable": true
      }
    },
    {
      "id": "attendance_156",
      "type": "attendance",
      "title": "Clock In/Out",
      "start_date": "2026-06-05",
      "end_date": "2026-06-05",
      "status": "completed",
      "meta": {
        "attendance_id": 156,
        "signed_in_at": "09:30:00",
        "signed_out_at": "17:45:00"
      }
    }
  ],
  "message": "Calendar events fetched."
}
```

#### Filter by Type Example

```bash
GET /api/v1/calendar/events?start_date=2026-06-01&end_date=2026-06-30&type=task
```

Returns only task events within the specified range.

---

### 2. Create Task from Calendar

**POST** `/api/v1/calendar/tasks`

#### Authorization

- **Role Required:** `admin` or `supervisor`
- **Why:** Prevents staff from bypassing task creation workflows

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|---|
| `title` | string | ✅ | Task title (max 255 chars) |
| `start_date` | string | ✅ | Start date in `YYYY-MM-DD` format |
| `due_date` | string | ✅ | Due date in `YYYY-MM-DD` format |
| `description` | string | ❌ | Task description |
| `project_id` | integer | ❌ | Link to existing project (must exist) |
| `status` | string | ❌ | Initial status: `todo`, `in_progress`, `review`, `completed` (default: `todo`) |
| `priority` | string | ❌ | Priority: `low`, `medium`, `high`, `urgent` (default: `medium`) |
| `assigned_to` | integer | ❌ | Assign task to user ID (must exist) |

#### Request Example

```json
POST /api/v1/calendar/tasks

{
  "title": "Call client",
  "start_date": "2026-06-01",
  "due_date": "2026-06-01",
  "description": "Follow up on proposal",
  "project_id": 5,
  "priority": "high",
  "assigned_to": 12
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 45,
    "title": "Call client",
    "description": "Follow up on proposal",
    "start_date": "2026-06-01",
    "due_date": "2026-06-01",
    "status": "todo",
    "priority": "high",
    "project": {
      "id": 5,
      "name": "CRM Outreach"
    },
    "assignees": [
      {
        "id": 12,
        "name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "subtasks": [],
    "completed_at": null,
    "subtask_progress": {
      "completed": 0,
      "total": 0
    }
  },
  "message": "Task created from calendar.",
  "code": 201
}
```

---

## Frontend UI Implementation Guide

### Calendar Date Click → Task Creation Flow

```
User Interaction:
1. User clicks a date in the calendar view
2. Modal opens: "Create Task"
3. Modal pre-fills `start_date` with selected date
4. User enters title, due_date, description, etc.
5. User clicks "Save"
6. Frontend sends POST /api/v1/calendar/tasks
7. Backend returns created task (201 Created)
8. Frontend shows task in calendar view
9. Modal closes
```

### Implementation Pattern

```typescript
// Step 1: Handle date click
onDateClick(date: string) {
  // Set selected date in modal
  const selectedDate = date; // YYYY-MM-DD
  this.showTaskModal = true;
  this.formData.start_date = selectedDate;
  this.formData.due_date = selectedDate;
}

// Step 2: Submit form
async submitTask(formData) {
  try {
    const response = await fetch('/api/v1/calendar/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.status === 201) {
      const { data: newTask } = await response.json();
      // Add task to calendar view
      this.events.push({
        id: `task_${newTask.id}`,
        type: 'task',
        title: newTask.title,
        start_date: newTask.start_date,
        end_date: newTask.due_date,
        status: newTask.status,
        meta: { task_id: newTask.id }
      });

      // Close modal and refresh
      this.showTaskModal = false;
      this.refreshCalendar();
    }
  } catch (error) {
    console.error('Task creation failed:', error);
  }
}
```

---

## Event Type Details

### Attendance Events

**Mapping:**
- `signed_in_at` → Event time
- `signed_out_at` → Clock out time
- Single-day event

**Example Response:**
```json
{
  "id": "attendance_156",
  "type": "attendance",
  "title": "Clocked In",
  "start_date": "2026-06-05",
  "end_date": "2026-06-05",
  "status": "completed",
  "meta": {
    "attendance_id": 156,
    "signed_in_at": "09:30:00",
    "signed_out_at": "17:45:00"
  }
}
```

### Leave Events

**Mapping:**
- `start_date` → Leave start
- `end_date` → Leave end
- Multi-day span support

**Example Response:**
```json
{
  "id": "leave_23",
  "type": "leave",
  "title": "Annual Leave Request",
  "start_date": "2026-06-10",
  "end_date": "2026-06-15",
  "status": "approved",
  "meta": {
    "leave_id": 23,
    "type": "annual",
    "reason": "Vacation",
    "duration_days": 6
  }
}
```

**Status Values:** `pending`, `approved`, `rejected`

### Project Events

**Mapping:**
- `start_date` → Project start date
- `due_date` → Project end/deadline
- Can span multiple days

**Example Response:**
```json
{
  "id": "project_8",
  "type": "project",
  "title": "Website Redesign",
  "start_date": "2026-06-01",
  "end_date": "2026-06-30",
  "status": "in_progress",
  "meta": {
    "project_id": 8,
    "description": "Redesign company website",
    "priority": "high",
    "is_valuable": true
  }
}
```

**Status Values:** `planning`, `in_progress`, `on_hold`, `completed`

### Task Events

**Mapping:**
- `start_date` → Task start date
- `due_date` → Task deadline
- Can span multiple days

**Example Response:**
```json
{
  "id": "task_45",
  "type": "task",
  "title": "Follow up leads",
  "start_date": "2026-06-01",
  "end_date": "2026-06-03",
  "status": "in_progress",
  "meta": {
    "task_id": 45,
    "project_id": 12,
    "description": "Make follow-up calls",
    "priority": "high",
    "completed_at": null
  }
}
```

**Status Values:** `todo`, `in_progress`, `review`, `completed`

---

## Error Handling

### Invalid Date Range (422 Unprocessable Entity)

```json
{
  "success": false,
  "errors": {
    "end_date": ["End date must be after or equal to start date."]
  },
  "message": "Validation failed."
}
```

### Missing Required Fields (422 Unprocessable Entity)

```json
{
  "success": false,
  "errors": {
    "title": ["Task title is required."],
    "start_date": ["Start date is required."]
  },
  "message": "Validation failed."
}
```

### Insufficient Permissions (403 Forbidden)

```json
{
  "success": false,
  "message": "This action is unauthorized.",
  "code": 403
}
```

### Resource Not Found (404 Not Found)

```json
{
  "success": false,
  "errors": {
    "project_id": ["The selected project does not exist."]
  },
  "message": "Validation failed."
}
```

---

## Performance Optimization

### Query Efficiency

The calendar service uses:
- **Indexed date columns** (`start_date`, `due_date`)
- **Selective eager loading** to fetch only needed relationships
- **Range filtering** to limit results to requested date range

### Frontend Optimization

**Recommended patterns:**

```typescript
// 1. Cache events by month
const eventCache = new Map();

async fetchMonthEvents(month: string, year: number) {
  const cacheKey = `${year}-${month}`;
  
  if (eventCache.has(cacheKey)) {
    return eventCache.get(cacheKey);
  }

  const startDate = `${year}-${month}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  const response = await fetch(
    `/api/v1/calendar/events?start_date=${startDate}&end_date=${endDate}`
  );
  
  const data = await response.json();
  eventCache.set(cacheKey, data.data);
  return data.data;
}

// 2. Implement virtual scrolling for large datasets (100+ events)
// 3. Lazy-load events when user scrolls between months
// 4. Batch update operations (avoid individual API calls per task)
```

---

## Security Considerations

- **Authentication Required:** All endpoints require valid Sanctum token
- **Role-Based Access:**
  - `GET /api/v1/calendar/events` — `admin`, `supervisor`, `staff`
  - `POST /api/v1/calendar/tasks` — `admin`, `supervisor` only
- **Data Isolation:** Users see only their own attendance/leave; assigned tasks/projects
- **Validation:** All date inputs validated server-side (YYYY-MM-DD format)

---

## Examples

### React Example (Fetch & Render)

```typescript
import { useQuery } from '@tanstack/react-query';

export function CalendarView() {
  const [dateRange, setDateRange] = useState({
    start: '2026-06-01',
    end: '2026-06-30'
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['calendar', dateRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/calendar/events?start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      return response.json();
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.data.map(event => (
        <div key={event.id} className={`event event-${event.type}`}>
          <h3>{event.title}</h3>
          <p>{event.start_date} to {event.end_date}</p>
          <span className={`status-${event.status}`}>{event.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### Task Creation Example

```typescript
async function createTaskFromCalendar(selectedDate: string) {
  const response = await fetch('/api/v1/calendar/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'New Task',
      start_date: selectedDate,
      due_date: selectedDate,
      priority: 'medium'
    })
  });

  if (response.ok) {
    const { data: newTask } = await response.json();
    console.log('Task created:', newTask);
    // Refresh calendar or add to UI
  }
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|---|
| Empty response | Date range has no events | Expand date range or check event creation |
| 422 Validation Error | Invalid date format | Use `YYYY-MM-DD` format exactly |
| 403 Forbidden on task creation | User role is `staff` | Only `admin` / `supervisor` can create tasks |
| Events not appearing | Wrong event type filter | Remove `type` param or verify event exists |

---

## Summary

The Calendar System provides a unified, performant API for:
1. **Reading** aggregated events from multiple sources
2. **Creating** tasks directly from calendar interactions
3. **Filtering** by event type and date range
4. **Rendering** standardized event data in any UI framework

Use the endpoints above to build a seamless calendar experience across your platform.
