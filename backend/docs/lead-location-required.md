# Lead Location — Required Fields & Filter Behavior

## Overview

As of this update, **location is required** when creating or importing a lead. The system no longer accepts or displays leads with unknown/missing location in aggregation views.

---

## 1. Required Fields

### Lead Creation (`POST /api/v1/crm/leads`)

Both `country_id` and `state_id` are **required** fields. The request will be rejected with `422 Unprocessable Entity` if either is missing or invalid.

| Field | Required | Validation |
|-------|----------|------------|
| `country_id` | ✅ Yes | Must exist in `countries` table |
| `state_id` | ✅ Yes | Must exist in `states` table |

**Example valid payload:**

```json
{
  "first_name": "Alice",
  "country_id": 1,
  "state_id": 14,
  "priority": "medium",
  "drive_id": 1,
  "status_id": 1
}
```

**Validation error response:**

```json
{
  "message": "The country id field is required. (and 1 more error)",
  "errors": {
    "country_id": ["The country id field is required."],
    "state_id": ["The state id field is required."]
  }
}
```

---

### Lead Import (`POST /api/v1/crm/leads/import`)

CSV/Excel rows must include resolvable `country` and `state` columns.

**Required columns:**

| CSV Column | Description |
|-----------|-------------|
| `country` | Country name (matched against `countries` table) |
| `state` or `state_province` | State/province name (matched against `states` table) |

**Rows missing or with unresolvable location are skipped** and reported in the `errors` array of the response:

```json
{
  "imported": 8,
  "skipped": 2,
  "errors": [
    "Row 3: country and state are required but were not provided.",
    "Row 9: country \"XYZ\" or state \"Atlantis\" could not be matched in the system."
  ]
}
```

---

## 2. Filter Behavior

### CRM Pipeline Filters

Location filters (`country_id`, `state_id`) use direct FK matching, so leads with `NULL` location fields will never be returned when those filters are active. No special handling is required — the SQL `WHERE country_id = ?` naturally excludes `NULL` rows.

### Dashboard Location Analytics

The `GET /api/v1/dashboard/pipeline-stats` endpoint now excludes leads without valid location data from:

- **Top States** list
- **Top Entries** list (recently created leads shown in dashboard)

The `total_leads` count still includes all leads (for pipeline overview accuracy).

**No "Unknown" values will appear** in the API response or frontend dashboard.

---

## 3. Frontend Behavior

### NewLeadModal

- `State` field is now marked required (`*`)
- Save button is disabled until a state is selected
- Inline error shown if user attempts to bypass via keyboard/programmatic submission

### EditLeadModal

- `State` field is now marked required (`*`)
- Save button is disabled when no state is set
- Inline error shown if validation is triggered

### ImportLeadsModal

- No frontend changes required — location validation happens server-side
- Row-level errors from the server are displayed in the import result UI

### Dashboard — Top Locations

- Leads without a resolved state are skipped when computing the "Top Locations" chart
- This eliminates all "Unknown" entries from the location view

---

## 4. Existing Leads Without Location

Leads that existed before this requirement was enforced:

- ✅ **Remain visible** in CRM listing pages
- ✅ **Can be viewed** in the Lead Detail Drawer
- ❌ **Do not appear** in location filter results
- ❌ **Do not appear** in Top Locations or dashboard location analytics
- ❌ **Do not appear** in Top Entries (dashboard) since that list is location-gated

To identify leads without location for manual cleanup, run:

```sql
SELECT id, first_name, last_name, company
FROM leads
WHERE country_id IS NULL OR state_id IS NULL
AND deleted_at IS NULL;
```

---

## 5. Error Reference

| Scenario | HTTP Status | Error |
|----------|------------|-------|
| Create lead without country_id | 422 | `country_id` field is required |
| Create lead without state_id | 422 | `state_id` field is required |
| Create lead with invalid country_id | 422 | `country_id` must exist in countries |
| Create lead with invalid state_id | 422 | `state_id` must exist in states |
| Import row missing country | Skipped | Row N: country is required but was not provided |
| Import row missing state | Skipped | Row N: state is required but was not provided |
| Import row with unresolvable location | Skipped | Row N: country "X" or state "Y" could not be matched |
