# Subtask API — Frontend Integration Guide

## Overview

Every task response now includes a `subtasks` array and a `subtask_progress` summary.  
Tasks without subtasks simply return empty arrays — **no breaking changes** to existing UI.

---

## Updated Task Response Shape

```jsonc
{
  "id": 1,
  "title": "Send leads for processing",
  "status": "in_progress",          // automated by subtask completion
  "priority": "medium",
  "description": null,
  "project_id": 3,
  "subtasks": [
    {
      "id": 1,
      "task_id": 1,
      "title": "Batch 1 — Monday",
      "is_completed": true,
      "completed_at": "2026-05-05T10:00:00.000000Z",
      "position": 0,
      "created_at": "2026-05-05T09:00:00.000000Z",
      "updated_at": "2026-05-05T10:00:00.000000Z"
    },
    {
      "id": 2,
      "task_id": 1,
      "title": "Batch 2 — Tuesday",
      "is_completed": false,
      "completed_at": null,
      "position": 1,
      "created_at": "2026-05-05T09:00:00.000000Z",
      "updated_at": "2026-05-05T09:00:00.000000Z"
    }
  ],
  "subtask_progress": {
    "total": 3,
    "completed": 1,
    "percentage": 33        // integer 0–100
  },
  // ... standard task fields (assignees, project, comments_count, etc.)
}
```

Tasks with **no subtasks**:

```jsonc
{
  "subtasks": [],
  "subtask_progress": { "total": 0, "completed": 0, "percentage": 0 }
}
```

---

## Endpoints

All endpoints require `Authorization: Bearer <token>`.

### Base prefix: `/api/v1`

---

### 1. Create Task (with optional subtasks)

**POST** `/api/v1/tasks`

#### Single task (no change to existing behaviour)

```json
{
  "title": "Send leads",
  "description": "Process leads this week",
  "project_id": 3,
  "priority": "high"
}
```

#### Task with subtasks ("For multiple tasks, click here")

```json
{
  "title": "Send leads for processing",
  "project_id": 3,
  "priority": "high",
  "subtasks": [
    "Batch 1 — Monday",
    "Batch 2 — Tuesday",
    "Batch 3 — Wednesday"
  ]
}
```

> Rules:
> - `subtasks` is **optional**. Omit it for a normal task.
> - Each entry is a plain string (max 255 chars).
> - Empty strings and duplicates are silently filtered out.
> - Max 100 subtasks per request.

**Response `201`:** Full task object (see shape above) with `subtasks` populated.

---

### 2. List Subtasks for a Task

**GET** `/api/v1/tasks/{task_id}/subtasks`

**Response `200`:**

```json
[
  { "id": 1, "title": "Batch 1 — Monday", "is_completed": true, ... },
  { "id": 2, "title": "Batch 2 — Tuesday", "is_completed": false, ... }
]
```

---

### 3. Add Subtasks to an Existing Task

**POST** `/api/v1/tasks/{task_id}/subtasks`

#### Single subtask

```json
{ "title": "Batch 4 — Thursday" }
```

#### Multiple subtasks at once

```json
{
  "titles": [
    "Batch 4 — Thursday",
    "Batch 5 — Friday"
  ]
}
```

**Response `201`:** Full refreshed subtask list for that task.

---

### 4. Update / Toggle a Subtask

**PUT** `/api/v1/subtasks/{subtask_id}`

#### Toggle completion (most common — checkbox click)

```json
{ "is_completed": true }
```

#### Rename only

```json
{ "title": "Batch 1 revised" }
```

#### Both at once

```json
{ "is_completed": true, "title": "Batch 1 — Done" }
```

**Response `200`:** The updated subtask object.

> **Status automation** runs automatically when `is_completed` is in the payload:
> | Condition | Parent task `status` |
> |---|---|
> | All subtasks checked | `completed` |
> | At least one checked | `in_progress` |
> | None checked (unchecking) | unchanged (no regression) |

---

### 5. Delete a Subtask

**DELETE** `/api/v1/subtasks/{subtask_id}`

**Response `200`:** `{ "data": null, "message": "Subtask deleted." }`

> Parent task status is re-synced after deletion.

---

## Status Automation Rules

| Action | Effect on parent |
|---|---|
| Create first subtask | No change (still `todo`) |
| Check first subtask | → `in_progress` |
| Check all subtasks | → `completed` |
| Uncheck any subtask (not all) | → `in_progress` |
| Uncheck all subtasks | No change (status stays as-is) |
| Manual status update via `PATCH /tasks/{id}` | Always respected — no override |

---

## Rendering Guidelines (No Frontend Changes Needed)

The subtask fields are **additive** — existing task cards/lists already receive `subtasks: []`
and `subtask_progress: { total: 0, ... }`, so no null-check is needed on existing renders.

When the frontend's "For multiple tasks, click here" feature sends multiple descriptions,
pass them as the `subtasks` array instead of separate task payloads:

```typescript
// frontend call — example only (do not modify existing code)
await api.post('/tasks', {
  title: parentTitle,
  project_id: projectId,
  subtasks: descriptions,   // string[]
});
```

---

## Error Responses

| Status | Cause |
|---|---|
| `422` | Validation failed (e.g. missing title, invalid project_id) |
| `404` | Task or subtask not found / soft-deleted |
| `403` | Role not permitted (staff cannot create/delete) |

Standard error envelope:

```json
{
  "success": false,
  "message": "The title field is required.",
  "errors": { "title": ["The title field is required."] }
}
```
