# Dashboard Pipeline Stats API

## Endpoint

GET /api/v1/dashboard/pipeline-stats

Authentication required (Sanctum).

## Purpose

Returns CRM pipeline dashboard metrics with optional filtering by Nigerian state and lead pipeline status.

- Backward compatible: this is a new endpoint; existing /dashboard/stats is unchanged.
- Optimized for dashboard use: aggregate counts + top 3 data slices.

## Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| state_id | number | No | Nigerian state ID (must exist in states table). |
| status | string | No | Lead pipeline status text (case-insensitive). |

## Example Requests

GET /api/v1/dashboard/pipeline-stats
GET /api/v1/dashboard/pipeline-stats?state_id=25
GET /api/v1/dashboard/pipeline-stats?status=New
GET /api/v1/dashboard/pipeline-stats?state_id=25&status=New

## Response Shape

{
  "success": true,
  "data": {
    "total_leads": 1200,
    "filters": {
      "state_id": 25,
      "status": "New",
      "resolved_status": {
        "type": "status",
        "value": "new"
      }
    },
    "top_states": [
      { "state_id": 25, "state": "Lagos", "lead_count": 300 },
      { "state_id": 28, "state": "Ogun", "lead_count": 200 },
      { "state_id": 31, "state": "Oyo", "lead_count": 150 }
    ],
    "top_entries": [
      {
        "id": 101,
        "name": "Lead A",
        "status": "new",
        "state": "Lagos",
        "created_at": "2026-05-06T08:30:00.000000Z"
      },
      {
        "id": 102,
        "name": "Lead B",
        "status": "new",
        "state": "Lagos",
        "created_at": "2026-05-06T08:10:00.000000Z"
      },
      {
        "id": 103,
        "name": "Lead C",
        "status": "new",
        "state": "Ogun",
        "created_at": "2026-05-06T07:45:00.000000Z"
      }
    ]
  },
  "message": "Dashboard pipeline stats fetched."
}

## Business Rules

- Filters are optional and combinable.
- Top lists always return at most 3 records.
- top_states is ranked by lead_count DESC.
- top_entries is the 3 most recent leads in current filter scope.
- Unknown status does not fail; it returns empty/zero metrics.
- Invalid state_id fails validation with 422.

## Frontend Integration Notes

- Use top_states for cards/charts in the CRM pipelines section.
- Use top_entries for list preview under current filters.
- Re-fetch endpoint whenever filter controls change.
- For empty results, display zero state gracefully:
  - total_leads = 0
  - top_states = []
  - top_entries = []

## Performance Notes

- Query uses conditional filtering and grouped aggregates.
- Existing indexed columns on leads (state_id and status) are leveraged.
- Results are limited to top 3 for minimal payload and fast rendering.
