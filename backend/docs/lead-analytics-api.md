# CRM Lead Activity Analytics API

## Overview

This module provides backend analytics for lead creation/import activity across users.

Access policy:

- Admin: allowed
- Supervisor: allowed
- Staff: denied

Base URL prefix: `/api/v1`

---

## 1. Get Lead Analytics Summary

### Endpoint

```http
GET /api/v1/crm/lead-analytics
Authorization: Bearer <token>
```

### Supported Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `user_id` | integer | No | Filter by user (uploaded by) |
| `type` | string | No | `manual`, `imported`, `both` (default: `both`) |
| `period` | string | No | `today`, `week`, `month`, `custom` |
| `start_date` | date (`Y-m-d`) | No | Required when `period=custom` |
| `end_date` | date (`Y-m-d`) | No | Required when `period=custom` |
| `drive_id` | integer | No | Filter by CRM drive |
| `country_id` | integer | No | Filter by country |
| `state_id` | integer | No | Filter by state |
| `lga_id` | integer | No | Filter by LGA / province |

### Example

```http
GET /api/v1/crm/lead-analytics?user_id=5&type=imported&period=custom&start_date=2026-05-01&end_date=2026-05-31&drive_id=1&state_id=25
```

### Response Shape

```json
{
  "success": true,
  "message": "Lead analytics fetched.",
  "data": {
    "summary": {
      "manual_leads": 120,
      "imported_leads": 340,
      "total_leads": 460,
      "last_activity": "2026-05-08 12:30:00",
      "unattributed": {
        "manual": 0,
        "imported": 2
      }
    },
    "filters": {
      "user_id": 5,
      "type": "both",
      "period": "custom",
      "start_date": "2026-05-01",
      "end_date": "2026-05-31",
      "drive_id": 1,
      "country_id": null,
      "state_id": 25,
      "lga_id": null
    },
    "user_stats": [
      {
        "user": {
          "id": 5,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "manual_leads": 120,
        "imported_leads": 340,
        "total_leads": 460,
        "last_activity": "2026-05-08 12:30:00"
      }
    ],
    "top_uploaders": [
      {
        "user": {
          "id": 5,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "manual_leads": 120,
        "imported_leads": 340,
        "total_leads": 460,
        "last_activity": "2026-05-08 12:30:00"
      }
    ],
    "trend": {
      "granularity": "day",
      "points": [
        {
          "date": "2026-05-07",
          "manual_leads": 12,
          "imported_leads": 30,
          "total_leads": 42
        }
      ]
    },
    "period_summaries": {
      "today": 120,
      "this_week": 410,
      "this_month": 980
    }
  },
  "meta": {}
}
```

---

## 2. Get Lead Activity Timeline

### Endpoint

```http
GET /api/v1/crm/lead-analytics/timeline
Authorization: Bearer <token>
```

### Extra Query Parameter

| Parameter | Type | Required | Description |
|---|---|---|---|
| `per_page` | integer | No | Pagination size, min `1`, max `200`, default `20` |

Timeline supports all filters listed for `/crm/lead-analytics`.

### Example

```http
GET /api/v1/crm/lead-analytics/timeline?type=imported&per_page=20&period=today
```

### Response Shape

```json
{
  "success": true,
  "message": "Lead activity timeline fetched.",
  "data": [
    {
      "lead_id": 201,
      "user": {
        "id": 5,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action_type": "imported",
      "action": "Imported lead Alice Johnson",
      "timestamp": "2026-05-08 10:00:00",
      "drive": {
        "id": 1,
        "name": "Inbound",
        "color": "#2563eb",
        "slug": "inbound"
      },
      "location": {
        "country_id": 1,
        "country": "Nigeria",
        "state_id": 25,
        "state": "Lagos",
        "lga_id": 18,
        "lga": "Ikeja"
      }
    }
  ],
  "meta": {
    "pagination": {
      "total": 55,
      "per_page": 20,
      "current_page": 1,
      "last_page": 3
    }
  }
}
```

---

## 3. Get Top Uploaders

### Endpoint

```http
GET /api/v1/crm/lead-analytics/top-uploaders
Authorization: Bearer <token>
```

### Extra Query Parameter

| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | integer | No | Max rows to return, min `1`, max `50`, default `10` |

Top uploaders supports all filters listed for `/crm/lead-analytics`.

### Example

```http
GET /api/v1/crm/lead-analytics/top-uploaders?period=month&limit=5&type=both
```

### Response Shape

```json
{
  "success": true,
  "message": "Top uploaders fetched.",
  "data": {
    "filters": {
      "user_id": null,
      "type": "both",
      "period": "month",
      "start_date": "2026-05-01",
      "end_date": "2026-05-31",
      "drive_id": null,
      "country_id": null,
      "state_id": null,
      "lga_id": null
    },
    "items": [
      {
        "user": {
          "id": 5,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "manual_leads": 20,
        "imported_leads": 40,
        "total_leads": 60,
        "last_activity": "2026-05-08 12:30:00"
      }
    ],
    "total_uploaded_today": 120
  },
  "meta": {}
}
```

---

## 4. Frontend Integration Notes

Use these endpoints to build CRM oversight UI components:

- KPI cards:
  - Manual leads
  - Imported leads
  - Total leads
  - Last activity
- Leaderboard:
  - Top uploaders (`/top-uploaders`)
- Trend charts:
  - `trend.points` from `/lead-analytics`
- Timeline feed:
  - Paginated activity from `/timeline`

Suggested UI composition:

- Summary cards at the top
- Filter bar (`user_id`, `type`, date range, drive, location)
- Trends chart in the middle
- Top uploaders table + timeline panel beneath

---

## 5. Attribution Rules

Activity classification rules used by backend:

- Imported lead:
  - `imported_by` is not null, or
  - `source_type = import`, or
  - `source = import`
- Manual lead:
  - not imported by the above rules

Ownership resolution for imported leads:

- Owner is `imported_by` when present
- Fallback owner is `created_by`
- If both are null, lead is counted as `unattributed.imported`

This preserves historical data compatibility while supporting explicit import attribution going forward.
