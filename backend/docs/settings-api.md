# Settings API — Frontend Developer Guide

> **Last Updated**: May 3, 2026  
> **Base URL**: `https://<your-domain>/api/v1`  
> **Auth**: All endpoints require `Authorization: Bearer <token>` unless noted as "Public".

---

## Table of Contents

1. [Overview](#overview)
2. [User Profile](#1-user-profile)
3. [Appearance Preference](#2-appearance-preference)
4. [Company / Organisation Setup](#3-company--organisation-setup)
5. [Supervisor Passcode System](#4-supervisor-passcode-system)
6. [Frontend Implementation Guide](#5-frontend-implementation-guide)
7. [Token & Header Reference](#6-token--header-reference)
8. [Error Reference](#7-error-reference)
9. [Database Migration Checklist](#8-database-migration-checklist)

---

## Overview

The Settings module exposes three logical sections:

| Section | Who can read | Who can write |
|---|---|---|
| User Profile | Own data (all roles) | Own data (all roles) |
| Appearance | Own data (all roles) | Own data (all roles) |
| Company Setup | All roles (read) | Admin freely; Supervisor with passcode |

### Company Setup Passcode Flow (Summary)

```
Admin                     Supervisor                    Backend
  │                           │                             │
  │─ POST /company/passcodes ─▶─────────────────────────────▶
  │◀─ { plain_text: "ABCD-EFGH" } ─────────────────────────-│
  │                           │                             │
  │  (Admin shares code       │                             │
  │   out-of-band)            │                             │
  │                           │                             │
  │                           │─ POST /verify-passcode ─────▶
  │                           │  { passcode: "ABCD-EFGH",   │
  │                           │    remember_device: true }  │
  │                           │◀─ { session_token,          │
  │                           │     device_token } ─────────│
  │                           │                             │
  │                           │─ PATCH /company ────────────▶
  │                           │  Header: X-Supervisor-      │
  │                           │    Session-Token OR         │
  │                           │    X-Supervisor-Device-Token│
  │                           │◀─ 200 OK ───────────────────│
```

---

## 1. User Profile

### `GET /v1/settings/profile`

Return the authenticated user's own profile, including their current role and appearance preference.

**Auth**: Required (all roles)

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Profile fetched.",
  "data": {
    "id": 5,
    "name": "Alice Johnson",
    "email": "alice@company.com",
    "appearance": "dark",
    "suspended_at": null,
    "first_logged_in_at": "2026-04-30T09:12:00.000000Z",
    "created_at": "2026-04-28T10:00:00.000000Z",
    "updated_at": "2026-05-01T08:00:00.000000Z",
    "roles": [{ "id": 2, "name": "supervisor" }]
  },
  "meta": {}
}
```

---

### `PATCH /v1/settings/profile`

Update the authenticated user's own profile fields. All fields are optional — only send what you want to change.

**Auth**: Required (all roles)

**Request Body** (all fields optional):
```json
{
  "name": "Alice Smith",
  "email": "alice.smith@company.com",
  "current_password": "OldPass123",
  "password": "NewPass456",
  "password_confirmation": "NewPass456"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | No | Max 255 chars |
| `email` | string | No | Must be unique. Email format. |
| `current_password` | string | Required if changing password | Used to verify identity before setting new password |
| `password` | string | No | Min 8 chars. Requires `current_password` and `password_confirmation`. |
| `password_confirmation` | string | No | Must match `password`. |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Profile updated.",
  "data": { /* same shape as GET /settings/profile */ }
}
```

**Error Cases**:
- `422` — Email already taken by another user
- `422` — `current_password` is incorrect: `errors.current_password = ["The current password is incorrect."]`
- `422` — Password confirmation mismatch
- `422` — `closing_time` is not after `opening_time`

---

## 2. Appearance Preference

### `PATCH /v1/settings/appearance`

Save the user's preferred colour scheme. The backend stores the preference so it persists across devices and browsers.

**Auth**: Required (all roles)

**Request Body**:
```json
{
  "appearance": "dark"
}
```

| Value | Meaning |
|---|---|
| `"light"` | Always light mode |
| `"dark"` | Always dark mode |
| `"system"` | Follow operating system preference (default) |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Appearance preference saved.",
  "data": { "appearance": "dark" },
  "meta": {}
}
```

**Frontend Implementation Notes**:
- On app load, call `GET /v1/settings/profile` to retrieve `data.appearance` and apply the theme before first paint (prevents flash of wrong theme).
- When the user changes theme in UI, call `PATCH /v1/settings/appearance` immediately.
- The currently integrated dark/light/system toggle already works client-side. Wrap it so it also calls this endpoint to persist the choice.
- Offline fallback: store the value in `localStorage` as `fastlink_appearance`. Use it when network is unavailable.

---

## 3. Company / Organisation Setup

### `GET /v1/settings/company`

Returns company-wide settings. **All roles can read.**

**Auth**: Required (all roles)

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Company settings fetched.",
  "data": {
    "id": 1,
    "company_name": "FastLink Corp",
    "opening_time": "09:00:00",
    "closing_time": "17:30:00",
    "working_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "timezone": "Africa/Lagos",
    "updated_by": 1,
    "created_at": "2026-05-03T10:00:00.000000Z",
    "updated_at": "2026-05-03T12:00:00.000000Z"
  },
  "meta": {}
}
```

**Note on `working_days`**: The array contains lowercase English day names. Use these to build UI checkboxes and to determine which days count as "working days" in the attendance calendar (for absent/present markers).

---

### `PATCH /v1/settings/company`

Update company settings.

**Auth**: 
- **Admin** — No extra headers needed.
- **Supervisor** — Must include one of:
  - `X-Supervisor-Session-Token: <session_token>` — obtained by verifying passcode (valid for 2 hours)
  - `X-Supervisor-Device-Token: <device_token>` — obtained with `remember_device: true` (long-lived)

**Request Body** (all fields optional — send only what changed):
```json
{
  "company_name": "FastLink Corp",
  "opening_time": "08:30",
  "closing_time": "17:30",
  "working_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "timezone": "Africa/Lagos"
}
```

| Field | Type | Notes |
|---|---|---|
| `company_name` | string\|null | Nullable. Max 255 chars. |
| `opening_time` | string | Format `HH:MM` (24-hour). |
| `closing_time` | string | Format `HH:MM`. Must be after `opening_time`. |
| `working_days` | array of strings | At least 1 day. Each must be a valid lowercase day name. |
| `timezone` | string | Valid PHP timezone string (e.g. `"Africa/Lagos"`, `"UTC"`). |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Company settings updated.",
  "data": { /* same shape as GET /settings/company */ }
}
```

**Error Cases**:
- `403` — Staff trying to update (forbidden)
- `403` — Supervisor missing or invalid token header
- `422` — Validation failure (wrong time format, empty working_days, etc.)

---

## 4. Supervisor Passcode System

This system allows supervisors to gain temporary write-access to company settings. The admin generates a passcode and shares it with the supervisor. The passcode is hashed and never stored in plain text after generation.

### Role Summary

| Action | Admin | Supervisor | Staff |
|---|---|---|---|
| Generate passcode for supervisor | ✅ | ❌ | ❌ |
| View all passcodes | ✅ | ❌ | ❌ |
| Revoke passcode | ✅ | ❌ | ❌ |
| Verify passcode | ❌ | ✅ | ❌ |
| Validate device token | ❌ | ✅ | ❌ |

---

### `GET /v1/settings/company/passcodes`

List all supervisor passcodes. Optionally filter by supervisor.

**Auth**: Admin only

**Query Parameters**:
| Param | Type | Default | Notes |
|---|---|---|---|
| `supervisor_id` | integer | — | Filter to one supervisor's passcodes |

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "supervisor_id": 7,
      "expires_at": "2026-06-01T00:00:00.000000Z",
      "is_active": true,
      "generated_by": 1,
      "created_at": "2026-05-03T10:00:00.000000Z",
      "supervisor": { "id": 7, "name": "Bob Supervisor", "email": "bob@co.com" },
      "generated_by_user": { "id": 1, "name": "Admin User", "email": "admin@co.com" }
    }
  ]
}
```

Note: `passcode_hash` is **never** returned in API responses.

---

### `POST /v1/settings/company/passcodes`

Generate a new passcode for a supervisor. **This replaces any existing passcode for that supervisor** (only one active passcode per supervisor at a time).

**Auth**: Admin only

**Request Body**:
```json
{
  "supervisor_id": 7,
  "expires_at": "2026-06-01"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `supervisor_id` | integer | Yes | Must be a user with the `supervisor` role |
| `expires_at` | date | No | `YYYY-MM-DD` format. Omit for a passcode that never expires. Must be in the future. |

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Passcode generated.",
  "data": {
    "passcode": {
      "id": 3,
      "supervisor_id": 7,
      "expires_at": "2026-06-01T00:00:00.000000Z",
      "is_active": true,
      "generated_by": 1,
      "supervisor": { "id": 7, "name": "Bob", "email": "bob@co.com" },
      "generated_by_user": { "id": 1, "name": "Admin", "email": "admin@co.com" }
    },
    "plain_text": "ABCD-EFGH",
    "notice": "This is the only time the passcode is displayed. Share it with the supervisor securely."
  }
}
```

> **Important**: `plain_text` is shown **only once**. The admin must copy it and send it to the supervisor (via chat, email, etc.). The backend only stores the bcrypt hash.

---

### `DELETE /v1/settings/company/passcodes/{passcode}`

Revoke a passcode immediately. All associated session and device tokens are also deleted.

**Auth**: Admin only

**Path Parameter**: `{passcode}` — the passcode `id` (integer)

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Passcode revoked and all related access tokens deleted.",
  "data": null
}
```

---

### `POST /v1/settings/company/verify-passcode`

Supervisor submits their passcode. Returns access tokens usable as headers on `PATCH /settings/company`.

**Auth**: Supervisor only

**Request Body**:
```json
{
  "passcode": "ABCD-EFGH",
  "remember_device": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `passcode` | string | Yes | The plain-text passcode received from admin |
| `remember_device` | boolean | No | Default `false`. When `true`, a long-lived device token is returned |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Passcode verified. Use the session_token as X-Supervisor-Session-Token header when updating company settings.",
  "data": {
    "session_token": "aB3xK7mNqP2...",
    "device_token": "xZ9yV4wQ1r...",
    "session_expires_in_seconds": 7200
  }
}
```

- `session_token` — Always returned. Valid for **2 hours**. Use as `X-Supervisor-Session-Token` header.
- `device_token` — Only returned when `remember_device: true`. Long-lived (expires when passcode expires, or never if passcode has no expiry). Use as `X-Supervisor-Device-Token` header.

**Error Cases**:
- `403` — Wrong passcode
- `403` — No active passcode exists for this supervisor
- `403` — Admin calling this endpoint (supervisor-only)

---

### `POST /v1/settings/company/validate-device-token`

Check whether a stored device token is still valid before rendering the company settings page. Call this when the supervisor visits the page and you have a device token in storage (to skip the passcode entry screen if still valid).

**Auth**: Supervisor only

**Request Body**:
```json
{
  "device_token": "xZ9yV4wQ1r..."
}
```

**Response** `200 OK` (token is valid):
```json
{
  "success": true,
  "message": "Device token is valid.",
  "data": { "valid": true }
}
```

**Response** `403 Forbidden` (token invalid or expired):
```json
{
  "success": false,
  "message": "Device token is invalid or expired.",
  "errors": {}
}
```

---

## 5. Frontend Implementation Guide

### 5.1 Profile Settings Page

```tsx
// Pseudocode — adapt to your actual hooks/state management

const ProfileSettingsPage = () => {
  const { data: profile } = useQuery('profile', () =>
    api.get('/settings/profile')
  );

  const updateProfile = useMutation((data) =>
    api.patch('/settings/profile', data)
  );

  // Form with name, email, password fields
  // Only include password fields if user wants to change password
  // Show current_password field only when new password field has a value
};
```

**UX Guidelines**:
- Show a success toast after saving.
- For password change: only show `current_password` input when the user starts typing in the new password field.
- Show character counter on `name` field (max 255).

---

### 5.2 Appearance Settings

```tsx
const AppearanceSetting = () => {
  const { data: profile } = useQuery('profile', () =>
    api.get('/settings/profile')
  );

  const setAppearance = async (value: 'light' | 'dark' | 'system') => {
    // Apply immediately for instant feedback
    applyTheme(value);
    // Persist to backend
    await api.patch('/settings/appearance', { appearance: value });
    // Save to localStorage as offline fallback
    localStorage.setItem('fastlink_appearance', value);
  };

  return (
    <ThemeSelector
      value={profile?.appearance ?? 'system'}
      onChange={setAppearance}
    />
  );
};
```

**On App Init** (in your root layout):
```tsx
// Apply appearance before first render to avoid FOUC
const savedAppearance = localStorage.getItem('fastlink_appearance') ?? 'system';
applyTheme(savedAppearance); // call your existing theme applier

// After login, fetch profile and update if different
const { data: profile } = useProfile();
useEffect(() => {
  if (profile?.appearance) {
    applyTheme(profile.appearance);
    localStorage.setItem('fastlink_appearance', profile.appearance);
  }
}, [profile?.appearance]);
```

---

### 5.3 Company Settings Page (Admin)

Admin has no extra access steps. Fetch and update directly:

```tsx
const CompanySettingsAdmin = () => {
  const { data: settings } = useQuery('company-settings', () =>
    api.get('/settings/company')
  );

  const updateSettings = useMutation((data) =>
    api.patch('/settings/company', data)
  );

  // Form with: company_name, opening_time, closing_time,
  //            working_days (checkboxes), timezone (select)
};
```

---

### 5.4 Company Settings Page (Supervisor — Full Flow)

The supervisor flow requires a passcode check. Below is the recommended UX state machine:

```
[Enter page]
      │
      ▼
[Has device token in localStorage?]
      │
   YES├────────▶ POST /validate-device-token
      │                   │
      │              VALID├────────▶ [Show settings form]
      │                   │              │
      │            INVALID│          [Save with X-Supervisor-Device-Token header]
      │                   ▼
      NO          [Show passcode entry screen]
      │
      ▼
[Show passcode entry screen]
      │
[User enters passcode + optionally checks "Remember this device"]
      │
      ▼
POST /verify-passcode
      │
   SUCCESS────▶ Store session_token in memory (React state, not localStorage)
      │         If remember_device: also store device_token in localStorage
      │
      ▼
[Show settings form]
      │
[Save with X-Supervisor-Session-Token OR X-Supervisor-Device-Token]
```

**Important security notes for storage**:
- `session_token` — Store in **React state / memory only**. Never in `localStorage` or `sessionStorage`. It expires in 2 hours and should not outlive the browser tab session.
- `device_token` — Store in **`localStorage`** keyed as `fastlink_company_device_token`. Clear it on logout.
- When the PATCH call returns `403` with message about token expiry, clear the device token from localStorage and redirect the supervisor to the passcode entry screen.

**Example supervisor component outline**:
```tsx
const CompanySettingsSupervisor = () => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [screen, setScreen] = useState<'checking' | 'passcode' | 'settings'>('checking');

  // On mount: check device token
  useEffect(() => {
    const deviceToken = localStorage.getItem('fastlink_company_device_token');
    if (!deviceToken) {
      setScreen('passcode');
      return;
    }

    api.post('/settings/company/validate-device-token', { device_token: deviceToken })
      .then(() => setScreen('settings'))
      .catch(() => {
        localStorage.removeItem('fastlink_company_device_token');
        setScreen('passcode');
      });
  }, []);

  const handlePasscodeSubmit = async (passcode: string, rememberDevice: boolean) => {
    try {
      const res = await api.post('/settings/company/verify-passcode', {
        passcode,
        remember_device: rememberDevice,
      });
      setSessionToken(res.data.session_token);
      if (rememberDevice && res.data.device_token) {
        localStorage.setItem('fastlink_company_device_token', res.data.device_token);
      }
      setScreen('settings');
    } catch (err) {
      setPasscodeError('Incorrect passcode. Please try again.');
    }
  };

  const handleSave = async (formData: CompanySettingsForm) => {
    const deviceToken = localStorage.getItem('fastlink_company_device_token');
    const headers: Record<string, string> = {};

    if (sessionToken) {
      headers['X-Supervisor-Session-Token'] = sessionToken;
    } else if (deviceToken) {
      headers['X-Supervisor-Device-Token'] = deviceToken;
    }

    try {
      await api.patch('/settings/company', formData, { headers });
    } catch (err) {
      if (err.response?.status === 403) {
        // Token expired — force re-authentication
        localStorage.removeItem('fastlink_company_device_token');
        setSessionToken(null);
        setScreen('passcode');
      }
    }
  };

  if (screen === 'checking') return <Spinner />;
  if (screen === 'passcode') return (
    <PasscodeEntryForm onSubmit={handlePasscodeSubmit} error={passcodeError} />
  );
  return <CompanySettingsForm onSave={handleSave} />;
};
```

---

### 5.5 Admin: Generating a Passcode for a Supervisor

Add a "Passcode Management" sub-section in the admin's company settings view:

```tsx
const PasscodeManager = () => {
  const [selectedSupervisor, setSelectedSupervisor] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>(''); // empty = never expires
  const [generatedPasscode, setGeneratedPasscode] = useState<string | null>(null);

  const generatePasscode = async () => {
    const payload: Record<string, unknown> = { supervisor_id: selectedSupervisor };
    if (expiresAt) payload.expires_at = expiresAt;

    const res = await api.post('/settings/company/passcodes', payload);
    setGeneratedPasscode(res.data.plain_text);
    // Show in a modal — it will NOT be retrievable again
  };

  // Also: list existing passcodes from GET /settings/company/passcodes
  // Allow admin to click "Revoke" → DELETE /settings/company/passcodes/{id}
};
```

**UX Requirement**: When showing the generated passcode:
- Display it in a modal with a "Copy" button.
- Add a warning: _"This code will only be shown once. Share it with the supervisor directly."_
- The modal must require the admin to click a "Done, I've shared it" button before dismissing.

---

### 5.6 Working Days UI

The `working_days` field returns an array like `["monday", "tuesday", "wednesday", "thursday", "friday"]`. Render these as checkboxes:

```tsx
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const WorkingDaysSelector = ({ value, onChange }) => (
  <div className="flex gap-2">
    {DAYS.map((day) => (
      <label key={day} className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={value.includes(day)}
          onChange={(e) => {
            if (e.target.checked) onChange([...value, day]);
            else onChange(value.filter((d) => d !== day));
          }}
        />
        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
      </label>
    ))}
  </div>
);
```

Send the updated array directly:
```json
{ "working_days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] }
```

---

### 5.7 Using Company Settings in the Attendance Calendar

The `GET /v1/attendance/calendar` response now includes two extra fields:

```json
{
  "month": "2026-05",
  "working_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "closing_time": "17:30",
  "attendances": [...],
  "leave_requests": [...],
  "tasks": [...]
}
```

Use `working_days` to decide which days to mark as "expected to work" (and therefore can be marked as absent). Previously this was hardcoded to Mon–Fri in the frontend — now replace the hardcoded list with the value from the API response.

Use `closing_time` to display the correct end-of-shift time in the attendance UI.

---

## 6. Token & Header Reference

### Authentication Header (All Requests)
```
Authorization: Bearer <sanctum_token>
```

### Supervisor Write-Access Headers (Company Settings PATCH only)

Send exactly one of these — not both:

| Header | When to Use | How to Get It |
|---|---|---|
| `X-Supervisor-Session-Token` | Fresh session (2 hours) | From `POST /verify-passcode` response |
| `X-Supervisor-Device-Token` | Remembered device (long-lived) | From `POST /verify-passcode` with `remember_device: true` |

---

## 7. Error Reference

All error responses follow this shape:
```json
{
  "success": false,
  "message": "Human-readable description.",
  "errors": { "field_name": ["Specific validation message."] }
}
```

| HTTP Status | Meaning | Common Triggers |
|---|---|---|
| `400` | Bad Request | Malformed request body |
| `401` | Unauthenticated | Missing or expired Bearer token |
| `403` | Forbidden | Wrong role; missing/invalid supervisor token; wrong passcode |
| `404` | Not Found | Resource ID does not exist |
| `422` | Validation Failed | See `errors` object for field-level messages |
| `500` | Server Error | Unexpected backend failure |

### Common 422 Error Messages

| Field | Message | Cause |
|---|---|---|
| `closing_time` | "The closing time must be after the opening time." | `closing_time ≤ opening_time` |
| `working_days` | "Each working day must be a valid lowercase day name" | Invalid day name in array |
| `working_days` | "The working days field must have at least 1 items." | Empty array |
| `current_password` | "The current password is incorrect." | Password verification failed |
| `supervisor_id` | "The selected user does not have the supervisor role." | Wrong role for passcode target |
| `expires_at` | "The expiry date must be in the future." | Past date provided |

---

## 8. Database Migration Checklist

When deploying this feature, run migrations **in this order**:

```bash
php artisan migrate
```

Migrations that will be applied (in timestamp order):

1. `2026_05_03_100000_create_company_settings_table` — Creates `company_settings` table and inserts default row
2. `2026_05_03_100100_create_supervisor_passcodes_table` — Creates `supervisor_passcodes` table
3. `2026_05_03_100200_create_supervisor_access_tokens_table` — Creates `supervisor_access_tokens` table
4. `2026_05_03_100300_add_appearance_to_users_table` — Adds `appearance` column to `users` table

> **Safe to run**: All migrations are backward-compatible. No existing data is modified. The `company_settings` singleton row is seeded automatically.

---

## Quick Reference

```
GET    /v1/settings/profile                        → Read own profile (all roles)
PATCH  /v1/settings/profile                        → Update own profile (all roles)
PATCH  /v1/settings/appearance                     → Set appearance (all roles)

GET    /v1/settings/company                        → Read company settings (all roles)
PATCH  /v1/settings/company                        → Update company settings
                                                     Admin: no extra header
                                                     Supervisor: X-Supervisor-Session-Token
                                                                 OR X-Supervisor-Device-Token

GET    /v1/settings/company/passcodes              → List passcodes (admin only)
POST   /v1/settings/company/passcodes              → Generate passcode for supervisor (admin only)
DELETE /v1/settings/company/passcodes/{id}         → Revoke passcode (admin only)

POST   /v1/settings/company/verify-passcode        → Verify passcode → get tokens (supervisor only)
POST   /v1/settings/company/validate-device-token  → Check device token validity (supervisor only)
```
