# CRM UI Implementation Plan
**Goal:** Close every gap between the current CRM frontend and the backend API so all endpoints in §7 can be integrated without further UI work.

---

## Brand Rules (applied throughout)
- **Primary:** `#33084E` (accent-purple)
- **Background:** `#f8f8fc`, cards `#ffffff`
- **Borders:** `#f0f0f5`
- **Text primary:** `#1a1a2e`, muted: `#9ca3af`
- **Shadow:** `0 4px 14px rgba(51,8,78,0.25)` (buttons), `shadow-sm` (cards)
- **No gradients — solid fills only**
- **Padding via `style={}` (not Tailwind px/py classes) — see globals.css reset**
- **Rounded corners:** `rounded-xl` (inputs, buttons), `rounded-2xl` (cards/modals)
- **Reuse `<ModalButton>` for all modal footers**

---

## File Structure After Implementation

```
app/(dashboard)/crm/
├── page.tsx                          ← updated (toolbar + filter bar)
├── components/
│   ├── ModalButton.tsx               ← ✅ done
│   ├── NewLeadModal.tsx              ← updated (missing fields added)
│   ├── ImportLeadsModal.tsx          ← updated (extra fields + result screen)
│   ├── LeadDetailDrawer.tsx          ← 🆕 right-side slide-over
│   ├── EditLeadModal.tsx             ← 🆕
│   ├── DeleteLeadModal.tsx           ← 🆕 confirmation dialog
│   ├── ActivityFeed.tsx              ← 🆕 inside drawer
│   ├── LogActivityModal.tsx          ← 🆕
│   ├── EditActivityModal.tsx         ← 🆕
│   ├── ManagePipelinesModal.tsx      ← 🆕 drives CRUD
│   ├── ManageStatusesModal.tsx       ← 🆕 statuses CRUD
│   └── FilterBar.tsx                 ← 🆕 priority / assigned_to / per_page
```

---

## Phase 1 — Fix Existing Modals

### 1A. `NewLeadModal.tsx` — Add Missing Fields

**Missing fields vs `POST /crm/leads`:**

| Field | Control |
|---|---|
| `phone` | Text input (type=tel) |
| `drive_id` | Select (populated from drives list) |
| `priority` | 3-button pill toggle: Low / Normal / High |
| `assigned_to` | Select (populated from users/team list) |
| `currency` | Select: USD / EUR / GBP / NGN |

**Layout:** Keep the existing 2-column grid. Add phone in row 2 (next to email). Add drive_id + priority in a new row. Add assigned_to + currency in the last row before Notes.

**APIs enabled:** `POST /crm/leads` (full payload)

---

### 1B. `ImportLeadsModal.tsx` — Add Optional Fields + Result Screen

**Two-step modal (step indicator in header):**

**Step 1 — Upload (current UI, add fields):**
- File drop zone (already done)
- Add optional fields below the pipeline selector:
  - `status` — Select
  - `priority` — pill toggle (Low / Normal / High)
  - `currency` — Select
  - `assigned_to` — Select
  - `status_id` — Select

**Step 2 — Result Screen (after API responds):**
- Header: "Import Complete"
- Three stat cards in a row:
  - ✅ Imported: `24` (green background `#f0fdf4`, text `#074616`)
  - ⏭ Skipped: `2` (amber background `#fffbeb`, text `#AF580B`)
  - ❌ Errors: `1` (red background `#fef2f2`, text `#ef4444`)
- If `errors[]` array is non-empty: collapsible list of error strings below the cards
- Footer: single "Done" primary button

**APIs enabled:** `POST /crm/leads/import` (full payload + result display)

---

## Phase 2 — Lead Detail Drawer

### `LeadDetailDrawer.tsx`

**Trigger:** Click any lead card (kanban) or any table row (list view).

**Layout:** Fixed right-side panel, `w-[520px]`, full viewport height, `z-40`, slides in from the right. Background overlay (`bg-black/30`) on the left covers the board.

**Panel sections (top to bottom):**

#### 2.1 Header Bar
- Lead avatar circle (initials, status color background) — `48px`
- Full name (bold, `18px`)
- Company name + email in muted text below
- Top-right: Edit icon button (opens `EditLeadModal`) + Trash icon button (opens `DeleteLeadModal`) + X close button
- Bottom of header: status badge pill + priority badge + estimated value chip

#### 2.2 Info Grid (2-column)
- Phone, Drive/Pipeline, Assigned To, Currency, Created date
- Each item: label in muted `11px` uppercase, value in `13px` bold
- Separated by a `border-b border-[#f0f0f5]` divider

#### 2.3 Notes Section
- Label "Notes" with a small edit icon
- Read-only display of notes text (muted if empty: "No notes added.")

#### 2.4 Activity Feed (`ActivityFeed.tsx`)
- Section header: "Activity" + "Log Activity" button (primary, small) on the right
- Vertical timeline list:
  - Each item: colored dot (by activity type) on a vertical line, `type` icon, `title`, `description` in muted, `scheduled_at` date, completed badge
  - Types: `call` (phone icon), `email` (mail icon), `meeting` (calendar icon), `note` (file icon)
- Empty state: centered icon + "No activities logged yet."

**APIs enabled:** `GET /crm/leads/{id}`, `GET /crm/leads/{id}/activities`

---

## Phase 3 — Lead CRUD Modals

### 3A. `EditLeadModal.tsx`

Identical form layout to `NewLeadModal` but:
- Title: "Edit Lead"
- All fields pre-populated with existing lead data
- Footer: Cancel + "Save Changes" (primary)

**APIs enabled:** `PATCH /crm/leads/{id}`

---

### 3B. `DeleteLeadModal.tsx`

Small confirmation dialog (`max-w-sm`):
- Warning icon (red, `#ef4444`) centered at top
- Title: "Delete Lead?"
- Body: "This will permanently delete **[First Last]** and all associated activities. This cannot be undone."
- Footer: Cancel (secondary) + "Delete Lead" (primary with red background `#ef4444`, white text — **only place in CRM using red for a button**)

**APIs enabled:** `DELETE /crm/leads/{id}`

---

### 3C. `LogActivityModal.tsx`

**Trigger:** "Log Activity" button inside the drawer's activity section.

**Form fields:**
| Field | Control |
|---|---|
| `type` | 4-button icon+label pill row: Call / Email / Meeting / Note |
| `title` | Text input |
| `description` | Textarea (3 rows) |
| `scheduled_at` | DateTime input |
| `is_completed` | Toggle switch (label: "Mark as completed") |

**Footer:** Cancel + "Log Activity" (primary)

**APIs enabled:** `POST /crm/leads/{id}/activities`

---

### 3D. `EditActivityModal.tsx`

Same form as `LogActivityModal`, pre-populated. Title: "Edit Activity". Footer: Cancel + "Save Activity".

**APIs enabled:** `PATCH /crm/activities/{activityId}`

---

## Phase 4 — Pipeline & Status Management

### 4A. `ManagePipelinesModal.tsx`

**Trigger:** A "Manage Pipelines" option — add a small gear icon button next to the pipeline selector dropdown in the filter bar.

**Layout:** Modal `max-w-lg`

**Content:**
- List of all pipelines (from `GET /crm/drives`):
  - Each row: color dot + name + "Default" badge (if `is_default`) + Edit pencil icon + Trash icon
  - Rows are reorderable (drag handle on left) — updates `position` on drop
- Below list: "+ Add Pipeline" text button (expands an inline form row)

**Inline add/edit row fields:**
| Field | Control |
|---|---|
| `name` | Text input |
| `slug` | Text input (auto-generated from name, editable) |
| `description` | Text input |
| `color` | Color swatch picker (7 preset solid colors matching brand palette) |
| `is_default` | Checkbox |

- Save inline row → `POST /crm/drives` or `PATCH /crm/drives/{id}`
- Trash icon → `DELETE /crm/drives/{id}` (inline confirmation: row turns red with "Confirm delete?" Yes/No)

**APIs enabled:** Full CRUD on `GET/POST/PATCH/DELETE /crm/drives`

---

### 4B. `ManageStatusesModal.tsx`

**Trigger:** A "Manage Columns" gear icon at the top right of the kanban board (appears only in kanban view).

**Layout:** Modal `max-w-lg` — same pattern as pipelines modal.

**Content:**
- List of all statuses (from `GET /crm/statuses`), one per row:
  - Color dot + name + position number + Won/Lost badges + Edit + Trash
- "+ Add Status" inline form row

**Inline add/edit row fields:**
| Field | Control |
|---|---|
| `name` | Text input |
| `slug` | Text input |
| `color` | Color swatch picker (7 preset colors) |
| `position` | Number input |
| `is_won` | Checkbox (label: "Won stage") |
| `is_lost` | Checkbox (label: "Lost stage") |
| `is_default` | Checkbox |

**APIs enabled:** Full CRUD on `GET/POST/PATCH/DELETE /crm/statuses`

---

## Phase 5 — Filter Bar Enhancement

### `FilterBar.tsx` (replaces the current inline filter row in `page.tsx`)

Add three new controls to the existing filter row:

| New control | API param |
|---|---|
| Priority filter dropdown (All / Low / Normal / High) | `priority` |
| Assigned To dropdown (All / team members) | `assigned_to` |
| Per-page selector (10 / 25 / 50 / 100) | `per_page` |

Also add **pagination** below the main content area:
- Previous / page numbers / Next — simple row, muted text, active page highlighted with accent-purple background
- Only shown when total results exceed per_page

**APIs enabled:** All query filters on `GET /crm/leads`

---

## Component States (all components)

Every data-fetching component must handle:
- **Loading:** skeleton loaders (grey `#f0f0f5` animated pulse bars) — no spinners
- **Empty:** centered icon + short message
- **Error:** inline red banner with retry button

---

## Implementation Order

| # | Task | Unlocks APIs |
|---|---|---|
| 1 | Fix `NewLeadModal` (add 5 missing fields) | `POST /crm/leads` full payload |
| 2 | Fix `ImportLeadsModal` (optional fields + result screen) | `POST /crm/leads/import` full |
| 3 | Build `LeadDetailDrawer` + `ActivityFeed` | `GET /crm/leads/{id}`, `GET activities` |
| 4 | Build `EditLeadModal` + `DeleteLeadModal` | `PATCH`, `DELETE /crm/leads/{id}` |
| 5 | Build `LogActivityModal` + `EditActivityModal` | `POST`, `PATCH activities` |
| 6 | Build `ManagePipelinesModal` | Full CRUD `/crm/drives` |
| 7 | Build `ManageStatusesModal` | Full CRUD `/crm/statuses` |
| 8 | Build `FilterBar` + pagination | All `GET /crm/leads` filters |

---

## What This Achieves

After implementation, **every API endpoint in §7** will have a corresponding UI surface with no gaps:

| Section | Before | After |
|---|---|---|
| 7.1 Drives | 1/5 (read-only, mock) | 5/5 |
| 7.2 Statuses | 1/5 (read-only, mock) | 5/5 |
| 7.3 Leads | 3/9 (no detail, no edit/delete, partial create, 1 filter) | 9/9 |
| 7.4 Activities | 0/3 | 3/3 |
| 7.5 Import | 2/7 (file + drive only) | 7/7 |
