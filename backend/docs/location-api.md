# Location System API — Frontend Integration Guide

## Overview

Leads now support a **three-level structured location**: Country → State → LGA.  
All location fields are **optional** — existing leads without location data are unaffected.  
Default country: **Nigeria** (pre-selected on UI load).

---

## New Fields on Every Lead Response

```jsonc
{
  "id": 42,
  "first_name": "John",
  // ... existing lead fields ...

  // Free-text (existing, unchanged)
  "country": "Nigeria",
  "city": "Lagos",
  "address": "5 Broad Street",

  // Structured FK IDs (new)
  "country_id": 1,
  "state_id": 7,
  "lga_id": 83,

  // Eager-loaded objects (new)
  "country": { "id": 1, "name": "Nigeria", "code": "NG" },
  "state":   { "id": 7, "name": "Lagos" },
  "lga":     { "id": 83, "name": "Ikeja" }
}
```

> **Note:** The `country` string field and the `country` relation share the same key in JSON.  
> Treat `country` as an object when it has an `id` property, otherwise as a plain string.  
> The safe approach is to always read `country_id`, `state_id`, `lga_id` for FK values.

---

## Location Endpoints

All require `Authorization: Bearer <token>`.

### GET `/api/v1/countries`

Returns all countries. Nigeria is first and marked `is_default: true`.

```jsonc
// Response
{
  "success": true,
  "data": [
    { "id": 1, "name": "Nigeria", "code": "NG", "is_default": true },
    { "id": 2, "name": "Australia", "code": "AU", "is_default": false },
    // ...
  ],
  "message": "Countries fetched."
}
```

---

### GET `/api/v1/states?country_id={id}`

Returns all states for a country, alphabetically sorted.  
If `country_id` is omitted, returns Nigeria's states automatically.

```
GET /api/v1/states?country_id=1
```

```jsonc
{
  "success": true,
  "data": [
    { "id": 1,  "country_id": 1, "name": "Abia" },
    { "id": 25, "country_id": 1, "name": "Lagos" },
    // ...
  ]
}
```

---

### GET `/api/v1/lgas?state_id={id}`

Returns all LGAs for a state, alphabetically sorted. `state_id` is required.

```
GET /api/v1/lgas?state_id=25
```

```jsonc
{
  "success": true,
  "data": [
    { "id": 80, "state_id": 25, "name": "Agege" },
    { "id": 90, "state_id": 25, "name": "Ikeja" },
    // ...
  ]
}
```

---

## UI Flow (Dependent Dropdowns)

```
1. On page load:
   → GET /api/v1/countries
   → Pre-select Nigeria (is_default: true)
   → GET /api/v1/states (no country_id needed, defaults to Nigeria)

2. User selects a different country:
   → GET /api/v1/states?country_id={selectedCountryId}
   → Clear state and LGA selections

3. User selects a state:
   → GET /api/v1/lgas?state_id={selectedStateId}
   → Clear LGA selection

4. User selects an LGA:
   → Store lga_id locally, ready for form submit
```

### Example (TypeScript / fetch)

```typescript
// Load countries on mount
const res = await fetch('/api/v1/countries', { headers: { Authorization: `Bearer ${token}` } });
const { data: countries } = await res.json();
const defaultCountry = countries.find((c: Country) => c.is_default);

// Load states when country changes
async function loadStates(countryId: number) {
  const res = await fetch(`/api/v1/states?country_id=${countryId}`, { headers: { Authorization: `Bearer ${token}` } });
  const { data: states } = await res.json();
  return states;
}

// Load LGAs when state changes
async function loadLgas(stateId: number) {
  const res = await fetch(`/api/v1/lgas?state_id=${stateId}`, { headers: { Authorization: `Bearer ${token}` } });
  const { data: lgas } = await res.json();
  return lgas;
}
```

---

## Lead Creation — Request Format

### Single Lead (no location)

```json
{
  "first_name": "Jane",
  "email": "jane@example.com"
}
```

### Lead with Full Location

```json
{
  "first_name": "John",
  "email": "john@example.com",
  "country_id": 1,
  "state_id": 25,
  "lga_id": 90
}
```

### Lead with Partial Location (country only)

```json
{
  "first_name": "Ada",
  "country_id": 1
}
```

> All location IDs are independently optional. No hierarchy enforcement is done server-side on creation — the client should enforce that `state_id` belongs to `country_id` and `lga_id` belongs to `state_id` (guaranteed by using the dependent dropdown flow).

**Endpoint:** `POST /api/v1/leads`

---

## Lead Update — Request Format

Send only the fields that changed. To clear a location field, send `null`.

```json
{
  "state_id": 10,
  "lga_id": null
}
```

**Endpoint:** `PATCH /api/v1/leads/{id}`

---

## Lead Filtering by Location

Combine with existing filters freely. All filters are optional and stack with `AND`.

```
GET /api/v1/leads?country_id=1
GET /api/v1/leads?state_id=25
GET /api/v1/leads?lga_id=90
GET /api/v1/leads?country_id=1&state_id=25&priority=high
GET /api/v1/leads?state_id=25&drive_id=2&q=john
```

---

## CSV / Excel Import Format

Add location columns to existing import files:

| first_name | email | country | state | lga |
|---|---|---|---|---|
| John Doe | john@example.com | Nigeria | Lagos | Ikeja |
| Jane Foo | jane@example.com | Nigeria | Kano | Kano Municipal |
| No Loc | no@example.com | | | |

### Rules

- Column names are **case-insensitive** and support aliases:
  - `state` or `state_province`
  - `lga` or `province` or `local_government`
- Matching is **case-insensitive and trimmed** (e.g. `LAGOS` = `Lagos`)
- If a country/state/LGA is not found in the database, the field is silently set to `null` — **the row is NOT skipped**
- All three columns are optional; rows with no location import successfully

### Minimal CSV (location columns optional)

```csv
first_name,email,country,state,lga
John Doe,john@example.com,Nigeria,Lagos,Ikeja
Jane Smith,jane@example.com,Nigeria,Rivers,Port Harcourt
Unknown,unknown@example.com,Mars,Nowhere,Anywhere
```

Result: rows 1 and 2 get full location IDs; row 3 gets `null` for all location fields — no error.

---

## Response Shape (Lead with Location)

```jsonc
{
  "success": true,
  "data": {
    "id": 42,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "country_id": 1,
    "state_id": 25,
    "lga_id": 90,
    "country": { "id": 1, "name": "Nigeria", "code": "NG" },
    "state":   { "id": 25, "name": "Lagos" },
    "lga":     { "id": 90, "name": "Ikeja" },
    // ... other fields
  }
}
```

---

## TypeScript Interfaces

```typescript
interface LocationCountry {
  id: number;
  name: string;
  code: string;
  is_default?: boolean;
}

interface LocationState {
  id: number;
  country_id: number;
  name: string;
}

interface LocationLga {
  id: number;
  state_id: number;
  name: string;
}

// Extended Lead type (add to existing Lead interface)
interface Lead {
  // ... existing fields
  country_id: number | null;
  state_id:   number | null;
  lga_id:     number | null;
  country:    LocationCountry | null;
  state:      LocationState   | null;
  lga:        LocationLga     | null;
}
```

---

## Error Responses

| Status | Cause |
|---|---|
| `422` | `state_id` provided does not exist in `states` table |
| `422` | `lga_id` provided does not exist in `lgas` table |
| `403` | Role not permitted |
| `401` | Not authenticated |

---

## Seeded Data

Run `php artisan db:seed --class=LocationSeeder` (or full `php artisan db:seed`) to populate:

- **10 countries** including Nigeria, Ghana, Kenya, South Africa, US, UK, Canada, India, Australia, Germany
- **All 37 Nigerian states** (including FCT - Abuja)
- **LGAs for** Lagos (20), FCT (6), Kano (44), Rivers (23), Ogun (20), Oyo (33), Anambra (21), Delta (25), Enugu (17), Imo (27), Kaduna (23), Cross River (18), Edo (18), Abia (17), Benue (23), Plateau (17), and more
