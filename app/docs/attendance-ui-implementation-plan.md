# Attendance Module — UI Implementation Plan

---

## Overview

The Attendance module covers 4 API endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /attendance` | GET | List attendance logs with date/user filters |
| `POST /attendance/sign-in` | POST | Clock in for the day |
| `POST /attendance/sign-out` | POST | Clock out for the day |
| `GET /attendance/calendar` | GET | Calendar view of attendance for a month |

The page will be a **single-page experience** with two primary views — **Calendar** and **Log List** — switchable via tab pills, plus a persistent **Today Status Hero** card at the top that handles Sign In / Sign Out.

---

## Layout & View Structure

```
┌─────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                │
│  "Attendance"  [View: Calendar | Log]   [Filter Bar]        │
├─────────────────────────────────────────────────────────────┤
│  TODAY HERO CARD  (always visible)                          │
│  Clock icon · Status badge · Clock-In time · Clock-Out time │
│  [Sign In button] or [Sign Out button]                      │
├─────────────────────────────────────────────────────────────┤
│  SUMMARY STRIP (4 stat cards)                               │
│  Days Present · Days Absent · Late Arrivals · Avg Hours     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CALENDAR VIEW  (default)                           │   │
│  │  Month nav ◄  May 2026  ►                           │   │
│  │  Day grid — each cell colored by status             │   │
│  │  Legend: Present / Absent / Late / Half-Day / Today │   │
│  └─────────────────────────────────────────────────────┘   │
│  OR                                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LOG LIST VIEW                                      │   │
│  │  Date-range filter (From / To) + User picker (admin)│   │
│  │  Table: Date · User · Clock-In · Clock-Out · Hours  │   │
│  │        Status badge · Note                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Components to Build

### 1. `components/types.ts`
Central type definitions and config maps.

```ts
export type AttendanceStatus = "present" | "absent" | "late" | "half_day";

export interface AttendanceLog {
  id: number;
  user_id: number;
  user_name: string;
  user_initials: string;
  date: string;           // "YYYY-MM-DD"
  sign_in: string | null; // ISO datetime
  sign_out: string | null;
  hours: number | null;
  status: AttendanceStatus;
  note: string;
}

export interface CalendarDay {
  date: string;           // "YYYY-MM-DD"
  status: AttendanceStatus | null; // null = no record (future / weekend)
  sign_in: string | null;
  sign_out: string | null;
  hours: number | null;
  is_today: boolean;
  is_weekend: boolean;
}

export const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; dot: string }> = {
  present:  { label: "Present",  color: "#074616", bg: "#dcfce7", dot: "#16a34a" },
  absent:   { label: "Absent",   color: "#991b1b", bg: "#fee2e2", dot: "#dc2626" },
  late:     { label: "Late",     color: "#AF580B", bg: "#fef3c7", dot: "#d97706" },
  half_day: { label: "Half Day", color: "#1d4ed8", bg: "#dbeafe", dot: "#2563eb" },
};
```

---

### 2. `components/TodayHeroCard.tsx`
**Always-visible status card** at the top of the page.

- Shows: current day label, current time (live clock ticking every second via `setInterval`)
- Status badge: "Not Signed In" / "Signed In" / "Signed Out"
- Clock-in time (if signed in), clock-out time (if signed out)
- Hours worked so far (live running count while signed in)
- **Sign In button** (primary, purple) — opens `SignInModal`
- **Sign Out button** (amber/danger tone) — opens `SignOutModal`
- State transitions: `idle → signed_in → signed_out`
- Background: white card with subtle left accent border in brand purple

---

### 3. `components/SignInModal.tsx`
Small centered modal:
- Title: "Sign In"
- Textarea: "Note (optional)" placeholder: "e.g. Starting work from office…"
- Buttons: Cancel (secondary) · Sign In (primary)
- On confirm: calls `POST /attendance/sign-in` with `{ note }`

---

### 4. `components/SignOutModal.tsx`
Same structure as SignInModal:
- Title: "Sign Out"
- Textarea: "Note (optional)"
- Shows hours worked since sign-in as a read-only info row
- Buttons: Cancel · Sign Out (amber primary)
- On confirm: calls `POST /attendance/sign-out`

---

### 5. `components/SummaryStrip.tsx`
Four stat cards in a responsive grid row:

| Card | Value | Icon | Color accent |
|---|---|---|---|
| Days Present | count | `CheckCircle2` | Green |
| Days Absent | count | `XCircle` | Red |
| Late Arrivals | count | `Clock` | Amber |
| Avg Hours/Day | `X.X hrs` | `Timer` | Purple |

Each card: white bg, rounded-2xl, border, icon in colored soft circle, bold number, muted label.

---

### 6. `components/CalendarView.tsx`
Full month calendar grid — primary view.

- **Month navigation**: `◄ April 2026 ►` — calls `GET /attendance/calendar?month=YYYY-MM`
- **Day grid**: 7 columns (Sun–Sat), 5–6 rows
  - Each cell shows: day number, colored status dot, clock-in time (small)
  - Color fills: `present` → soft green bg, `absent` → soft red bg, `late` → soft amber bg, `half_day` → soft blue bg
  - Today: purple ring border
  - Future days: muted, no dot
  - Weekends: slightly greyed bg
  - Clicking a day with a record → opens `DayDetailDrawer`
- **Legend row** below the grid

---

### 7. `components/DayDetailDrawer.tsx`
Right slide-over panel (400px) — opens on calendar day click.

- Day header: "Wednesday, April 30"
- Status badge (large)
- Clock-in time row with icon
- Clock-out time row with icon  
- Hours worked (calculated)
- Note (if any)
- Close button

---

### 8. `components/LogListView.tsx`
Tabular view of attendance logs.

- **Filter bar**:
  - Date range: `From [date] To [date]` inputs
  - User picker (admin only, dropdown of team members)
  - Apply / Reset buttons
- **Table** columns: Date · Status · Clock In · Clock Out · Hours · Note
  - Status: colored badge pill
  - Hours: bold, right-aligned
  - Note: truncated, show full on hover tooltip
  - Empty state: centered icon + "No attendance records found"
- Responsive: horizontal scroll on small screens

---

### 9. `page.tsx` (master page)
Wires everything together.

**State:**
```ts
activeView: "calendar" | "log"
todayStatus: "idle" | "signed_in" | "signed_out"
signInTime: string | null
signOutTime: string | null
calendarMonth: string            // "YYYY-MM"
calendarDays: CalendarDay[]
logs: AttendanceLog[]
logFilters: { from: string; to: string; user_id?: number }
selectedDay: CalendarDay | null
showSignInModal: boolean
showSignOutModal: boolean
summaryStats: { present: number; absent: number; late: number; avgHours: number }
```

**Layout:**
1. Page header row (title + view tabs + filter controls)
2. `<TodayHeroCard>` — always rendered
3. `<SummaryStrip>` — always rendered
4. Conditional: `<CalendarView>` or `<LogListView>`
5. `<DayDetailDrawer>` when `selectedDay !== null`
6. `<SignInModal>` / `<SignOutModal>` portaled above

---

## File Structure

```
app/(dashboard)/attendance/
├── page.tsx
└── components/
    ├── types.ts
    ├── TodayHeroCard.tsx
    ├── SignInModal.tsx
    ├── SignOutModal.tsx
    ├── SummaryStrip.tsx
    ├── CalendarView.tsx
    ├── DayDetailDrawer.tsx
    └── LogListView.tsx
```

> `ModalButton` will be imported from `../../crm/components/ModalButton` (already exists, reused across modules).

---

## Color / Style Conventions

- Brand primary: `#33084E`
- Present green: `#074616` / bg `#dcfce7`
- Absent red: `#991b1b` / bg `#fee2e2`
- Late amber: `#AF580B` / bg `#fef3c7`
- Half-day blue: `#1d4ed8` / bg `#dbeafe`
- Card borders: `#f0f0f5`
- Muted text: `#9ca3af`
- All padding via `style={{ padding: "..." }}` — never Tailwind `p-x` classes (globals.css reset)

---

## Implementation Order

1. `components/types.ts` — types + config maps + mock data
2. `components/SignInModal.tsx` + `SignOutModal.tsx`
3. `components/TodayHeroCard.tsx`
4. `components/SummaryStrip.tsx`
5. `components/DayDetailDrawer.tsx`
6. `components/CalendarView.tsx`
7. `components/LogListView.tsx`
8. `page.tsx` — master wiring

---

## Mock Data Strategy

Since no real backend is connected, all data will be seeded as `const` arrays at the top of `page.tsx`:

- `initialLogs`: 20 records spanning the last 30 days, mix of all 4 statuses
- `calendarData`: generated from `initialLogs` mapped to `CalendarDay[]` for the current month
- `todayLog`: derived from `initialLogs` for today's date to pre-populate hero card state

This allows every UI state (signed in, signed out, absent, etc.) to be demonstrated interactively.
