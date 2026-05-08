# Dashboard Pipeline — Drive-Based Filter

## Overview

The CRM Pipeline section on the dashboard now supports filtering by **Lead Drive** (pipeline group) instead of — or in addition to — lead status. This enables the UI to present drive-specific analytics without touching the location filter.

---

## 1. Fetching Available Drives

Use the existing CRM drives endpoint to populate the drive filter dropdown. This keeps the list always in sync with drives created in the CRM.

```
GET /api/v1/crm/drives
Authorization: Bearer <token>
```

**Response shape (relevant fields):**

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Facebook Campaign Leads", "color": "#33084E", "slug": "facebook-campaign-leads" },
    { "id": 2, "name": "Enterprise Prospects",    "color": "#AF580B", "slug": "enterprise-prospects" },
    { "id": 3, "name": "Cold Outreach Batch 01",  "color": "#074616", "slug": "cold-outreach-batch-01" }
  ]
}
```

Newly created drives appear automatically — no hardcoding required.

---

## 2. Pipeline Stats — Query Parameters

```
GET /api/v1/dashboard/pipeline-stats
Authorization: Bearer <token>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `drive_id` | integer | No | Filter by a specific CRM drive |
| `state_id` | integer | No | Filter by state (location filter) |
| `status`   | string  | No | _(Legacy, still accepted but not used by the drive UI)_ |

### Filter by drive only

```
GET /api/v1/dashboard/pipeline-stats?drive_id=1
```

### Combined drive + location filter

```
GET /api/v1/dashboard/pipeline-stats?drive_id=1&state_id=5
```

---

## 3. Response Structure

```json
{
  "success": true,
  "message": "Dashboard pipeline stats fetched.",
  "data": {
    "total_leads": 320,
    "drive": {
      "id": 1,
      "name": "Facebook Campaign Leads",
      "color": "#33084E",
      "slug": "facebook-campaign-leads"
    },
    "filters": {
      "drive_id": 1,
      "state_id": null,
      "status": null,
      "resolved_status": { "type": null, "value": null }
    },
    "top_states": [
      { "state_id": 12, "state": "Lagos",   "lead_count": 120 },
      { "state_id": 8,  "state": "Abuja",   "lead_count": 85 },
      { "state_id": 21, "state": "Kano",    "lead_count": 40 }
    ],
    "top_entries": [
      {
        "id": 201,
        "name": "Alice Johnson",
        "status": "new",
        "state": "Lagos",
        "created_at": "2026-05-07T10:23:00.000Z"
      }
    ]
  }
}
```

When no `drive_id` is supplied, `"drive"` is `null` and all leads are included (existing behaviour).

---

## 4. Empty Drive Handling

If the selected drive has no leads, the response still succeeds:

```json
{
  "data": {
    "total_leads": 0,
    "drive": { "id": 3, "name": "Cold Outreach Batch 01", ... },
    "top_states":  [],
    "top_entries": []
  }
}
```

---

## 5. Deprecated: Status-Based Pipeline Filter

The `status` query parameter is still accepted for backwards compatibility but is **no longer used** as the primary pipeline filter. The recommended approach is:

| Before | After |
|--------|-------|
| `?status=New` | `?drive_id=1` |
| `?status=Qualified` | `?drive_id=2` |

The drive filter is dynamic (reads from the database) and requires no code changes when new drives are created.

---

## 6. Frontend Integration Steps

### Step 1 — Load drives on mount

```ts
const { data: drivesData } = useQuery({
  queryKey: ['dashboard', 'drives'],
  queryFn: () => api.get('/crm/drives').then(r => r.data.data),
});
const drives = drivesData ?? [];
```

### Step 2 — Track selected drive

```ts
const [selectedDriveId, setSelectedDriveId] = useState<number | null>(null);
```

### Step 3 — Pass drive_id to pipeline stats hook

```ts
const { data: pipelineStats } = useDashboardPipelineStats({
  drive_id: selectedDriveId ?? undefined,
  state_id: selectedStateId ?? undefined,
});
```

Ensure `useDashboardPipelineStats` (in `hooks/useDashboard.ts`) forwards `drive_id` as a query param.

### Step 4 — Render drive filter buttons

```tsx
<button onClick={() => setSelectedDriveId(null)}>All Drives</button>
{drives.map(drive => (
  <button
    key={drive.id}
    onClick={() => setSelectedDriveId(drive.id)}
    style={{ borderColor: selectedDriveId === drive.id ? drive.color : undefined }}
  >
    {drive.name}
  </button>
))}
```

### Step 5 — Read active drive from response

Use `pipelineStats?.drive` to display the currently active drive name/colour in the section header.

```tsx
const activeDriveName = pipelineStats?.drive?.name ?? 'All Pipelines';
```
