# Project Management UI — Implementation Plan

**Goal:** Build a complete, beautiful, API-ready Project Management page covering all seven API groups (§9.1–9.7) with zero gaps. Same brand rules as CRM — solid colours only, `style={}` for padding, reuse `ModalButton` pattern.

---

## Brand Rules (same as CRM)
| Token | Value |
|---|---|
| Primary / accent | `#33084E` |
| Warm accent | `#AF580B` |
| Green (success/done) | `#074616` |
| Blue (review) | `#1d4ed8` |
| Background | `#f8f8fc` |
| Card / modal | `#ffffff` |
| Border | `#f0f0f5` |
| Text primary | `#1a1a2e` |
| Text muted | `#9ca3af` |
| Shadow (buttons) | `0 4px 14px rgba(51,8,78,0.25)` |
| Padding | Always `style={{ padding: "…" }}` — never `px-*/py-*` classes |

---

## Status Colour Map

### Project statuses
| Status | Label | Colour |
|---|---|---|
| `planning` | Planning | `#33084E` |
| `in_progress` | In Progress | `#AF580B` |
| `completed` | Completed | `#074616` |
| `on_hold` | On Hold | `#9ca3af` |

### Task statuses (kanban columns)
| Status | Label | Colour |
|---|---|---|
| `todo` | To Do | `#6b7280` |
| `in_progress` | In Progress | `#AF580B` |
| `review` | In Review | `#1d4ed8` |
| `completed` | Completed | `#074616` |

---

## Page Layout — Three Views

The page has a **top header** (always visible) and a **view switcher** (three tabs):

```
┌─────────────────────────────────────────────────────┐
│  Project Management       [+ New Project]            │
│  Sub-title                                           │
├──────────────────────────────────────────────────────│
│  [Projects] [Kanban] [Gantt]    [Project selector ▾] │
├──────────────────────────────────────────────────────│
│                                                      │
│   (active view renders here)                         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

- **Projects tab** — default view; shows a project card grid
- **Kanban tab** — task board with 4 columns, filtered by selected project
- **Gantt tab** — horizontal timeline of all projects and their tasks

---

## File Structure

```
app/(dashboard)/project/
├── page.tsx                          ← master page; view router + all state
└── components/
    ├── ModalButton.tsx               ← copy of CRM's ModalButton (same logic)
    │
    │── ── Projects View ────────────────────────
    ├── ProjectCard.tsx               ← individual project card (grid)
    ├── NewProjectModal.tsx           ← POST /projects
    ├── EditProjectModal.tsx          ← PATCH /projects/{id}
    ├── DeleteProjectModal.tsx        ← DELETE /projects/{id}
    │
    │── ── Kanban View ──────────────────────────
    ├── KanbanBoard.tsx               ← GET /tasks/kanban + PATCH /tasks/{id}/reorder
    ├── TaskCard.tsx                  ← single draggable task card
    ├── TaskDetailDrawer.tsx          ← GET /tasks/{id}, slide-over panel
    ├── NewTaskModal.tsx              ← POST /tasks
    ├── EditTaskModal.tsx             ← PATCH /tasks/{id}
    ├── DeleteTaskModal.tsx           ← DELETE /tasks/{id}
    ├── CommentSection.tsx            ← POST /tasks/{id}/comments (inside drawer)
    ├── AssigneePicker.tsx            ← POST /tasks/{id}/assign (inside drawer)
    │
    │── ── Gantt View ───────────────────────────
    └── GanttChart.tsx                ← GET /projects/gantt (pure CSS/SVG, no lib)
```

---

## Phase 1 — Projects View (Cards Grid)

### `ProjectCard.tsx`

A rich card component. Each project renders as:

```
┌─────────────────────────────────┐
│ ████ [priority badge] [⋮ menu]  │  ← 4px left border in status colour
│                                 │
│  Mobile App Build               │  ← name, bold 16px
│  Core product initiative…       │  ← description, muted, 2-line clamp
│                                 │
│  ● In Progress    ▲ High        │  ← status + priority badges
│                                 │
│  ████████░░░░ 62%               │  ← progress bar (tasks done / total)
│                                 │
│  📅 May 1 → Aug 1   👥 3 tasks  │  ← dates + task count
└─────────────────────────────────┘
```

- Left border: 4px solid, colour = project status colour
- Click anywhere on card (except ⋮) → switches to Kanban tab filtered for that project
- ⋮ button → fixed-position dropdown (same pattern as CRM): Edit / Delete

**Grid layout:** `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` with `gap-6`

**APIs enabled:** `GET /projects` (list), click-through to project kanban

---

### `NewProjectModal.tsx`

Fields:
| Field | Control |
|---|---|
| `name` | Text input (required) |
| `description` | Textarea (3 rows) |
| `status` | Pill toggle: Planning / In Progress / Completed / On Hold |
| `priority` | Pill toggle: Low / Normal / High (same style as CRM) |
| `start_date` | Date input |
| `due_date` | Date input |

Footer: Cancel (secondary) + Create Project (primary)

**APIs enabled:** `POST /projects`

---

### `EditProjectModal.tsx`

Identical form to `NewProjectModal`, pre-populated. Title: "Edit Project". Footer: Cancel + Save Changes.

**APIs enabled:** `PATCH /projects/{id}`

---

### `DeleteProjectModal.tsx`

Same small confirmation dialog as `DeleteLeadModal` in CRM. Warning icon, project name in bold, danger button.

**APIs enabled:** `DELETE /projects/{id}`

---

## Phase 2 — Kanban Board

### `KanbanBoard.tsx`

Four fixed columns: **To Do → In Progress → In Review → Completed**

- Uses `@dnd-kit/core` (already installed) — same sensor config as CRM
- Each column shows task count badge in header
- `PATCH /tasks/{id}/reorder` is called on drag-end with new `status` and `order`
- Project filter select at the top of the board (filters which project's tasks show)

Column header design:
```
◉ In Progress  [3]          [+ Add Task]
─────────────────────────────────────────
│ Task card                             │
│ Task card                             │
│  Drop zone (dashed when empty)        │
```

Each column gets a `+` Add Task button in its header that opens `NewTaskModal` pre-set to that column's status.

---

### `TaskCard.tsx`

```
┌───────────────────────────────┐
│  [project tag]          [⋮]   │
│                               │
│  Implement auth module        │  ← title, bold
│  Sanctum + role middleware    │  ← description, 1-line muted (optional)
│                               │
│  ▲ High    📅 May 7           │  ← priority badge + due date
│                               │
│  [A][B]   💬 3               │  ← assignee initials + comment count
└───────────────────────────────┘
```

- Assignee circles: up to 3 small (24px) circles showing initials, + overflow count
- Click card (not ⋮) → opens `TaskDetailDrawer`
- ⋮ → fixed dropdown: Edit / Delete (same pattern as CRM)
- Drag handle: entire card is draggable (5px movement threshold)

---

### `NewTaskModal.tsx`

Fields:
| Field | Control |
|---|---|
| `title` | Text input (required) |
| `description` | Textarea |
| `project_id` | Select (list of projects) |
| `status` | Pill toggle: To Do / In Progress / In Review / Completed |
| `priority` | Pill toggle: Low / Normal / High |
| `start_date` | Date input |
| `due_date` | Date input |
| `assignee_ids` | Inline assignee picker (checkboxes with avatar+name) |

Footer: Cancel + Create Task

**APIs enabled:** `POST /tasks`

---

### `EditTaskModal.tsx`

Same form, pre-populated. Footer: Cancel + Save Changes.

**APIs enabled:** `PATCH /tasks/{id}`

---

### `DeleteTaskModal.tsx`

Small confirmation dialog. Danger button.

**APIs enabled:** `DELETE /tasks/{id}`

---

## Phase 3 — Task Detail Drawer

### `TaskDetailDrawer.tsx`

Right-side slide-over panel (500px wide), same construction as CRM's `LeadDetailDrawer`:

```
┌─────────────────────────────────────┐
│ Task Details        [Edit] [Del] [✕]│  ← top bar
├─────────────────────────────────────┤
│                                     │
│  Implement auth module              │  ← title, 20px bold
│  [In Progress] [High]               │  ← status + priority badges
│  Project: Mobile App Build  ────    │
│                                     │
│  📅 May 1 → May 7                   │  ← date range
│                                     │
│  Description ────────────────────   │
│  Sanctum + role middleware…         │
│                                     │
│  Assignees ──────────────────────   │
│  [A] Alice Smith  [B] Bob Johnson   │
│  [ Manage Assignees ]               │
│                                     │
│  Comments (3) ───────────────────   │
│  ┌─────────────────────────────┐   │
│  │ [A] Alice: "Check criteria" │   │
│  │ 2 hours ago                 │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ [textarea] Add a comment... │   │
│  │                  [Post]     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**APIs enabled:** `GET /tasks/{id}`, `POST /tasks/{id}/comments`, `POST /tasks/{id}/assign`

---

### `CommentSection.tsx`

Inside the drawer. Displays list of comments (avatar, name, text, timestamp). Input at the bottom:
- Textarea (2 rows), auto-grows
- "Post Comment" button (primary, small)
- Empty state: "No comments yet. Be the first to comment."

**APIs enabled:** `POST /tasks/{id}/comments`

---

### `AssigneePicker.tsx`

Rendered inside `TaskDetailDrawer`. Shows current assignees as avatar circles. "Manage Assignees" button opens a small modal:
- List of all team members with checkbox
- Pre-checked = currently assigned
- Save button → calls `POST /tasks/{id}/assign`

**APIs enabled:** `POST /tasks/{id}/assign`

---

## Phase 4 — Gantt Chart

### `GanttChart.tsx`

Pure CSS implementation — **no external library**. Rendered as a scrollable two-panel layout:

```
┌────────────────┬────────────────────────────────────────────┐
│ Project / Task │   May          Jun          Jul        Aug  │
├────────────────┼────────────────────────────────────────────┤
│ Mobile App Build│   ████████████████████████████████████    │
│  └ Auth module │        ██████                              │
│  └ UI design   │               ████████                     │
│                │                                            │
│ Website Rebrand│             ████████████████              │
│  └ Wireframes  │             ████                           │
└────────────────┴────────────────────────────────────────────┘
```

- Left panel: project + task names (sticky)
- Right panel: horizontal timeline, scrollable
- Each bar: rounded rectangle, colour = project/task status colour, width = duration in days proportional to visible date range
- Date headers: week markers (Mon DD) or month markers depending on range
- Today indicator: vertical dashed line in `#33084E`
- Date range controls: "From" and "To" date inputs above the chart

**Implementation detail:** The timeline is calculated as:
```
barLeft  = (startDate - rangeStart) / totalDays * 100%
barWidth = (dueDate  - startDate)   / totalDays * 100%
```
No SVG required — pure `div` with percentage widths inside a relative container.

**APIs enabled:** `GET /projects/gantt`

---

## Phase 5 — `page.tsx` (Master Page)

Manages all shared state and renders the active view:

```tsx
State:
  projects[]        ← from GET /projects
  tasks[]           ← from GET /tasks
  activeView        ← "projects" | "kanban" | "gantt"
  selectedProject   ← id for kanban filter
  selectedTask      ← task for drawer
  menu              ← { item, x, y } for context dropdown (same fixed-pos pattern as CRM)

  // Modal flags
  isNewProjectOpen, isEditProjectOpen, isDeleteProjectOpen
  isNewTaskOpen, isEditTaskOpen, isDeleteTaskOpen
  isDrawerOpen
```

**View Tab Bar** — replaces CRM's filter bar. Three tab pills:
```
[📋 Projects]  [📌 Kanban]  [📊 Gantt]
```
Active tab: solid `#33084E` background, white text. Inactive: white bg, muted text.

---

## API Coverage After Implementation

| API | Endpoint | UI Surface |
|---|---|---|
| GET /projects | List | Projects grid |
| POST /projects | Create | NewProjectModal |
| PATCH /projects/{id} | Edit | EditProjectModal (via ⋮ on card) |
| DELETE /projects/{id} | Delete | DeleteProjectModal (via ⋮ on card) |
| GET /tasks | List | Kanban columns + task cards |
| POST /tasks | Create | NewTaskModal |
| PATCH /tasks/{id} | Edit | EditTaskModal (via ⋮ on card or drawer) |
| DELETE /tasks/{id} | Delete | DeleteTaskModal |
| GET /tasks/kanban | Kanban view | KanbanBoard |
| PATCH /tasks/{id}/reorder | Drag & drop | DND drag-end handler |
| POST /tasks/{id}/comments | Add comment | CommentSection in drawer |
| POST /tasks/{id}/assign | Assign users | AssigneePicker in drawer |
| GET /projects/gantt | Gantt chart | GanttChart |

**Zero gaps.** Every endpoint has a UI surface.

---

## Implementation Order

| # | Task | New Files |
|---|---|---|
| 1 | `ModalButton.tsx` | Copy from CRM pattern |
| 2 | Projects view: `ProjectCard` + `NewProjectModal` + `EditProjectModal` + `DeleteProjectModal` | 4 files |
| 3 | Kanban: `KanbanBoard` + `TaskCard` | 2 files |
| 4 | Task CRUD: `NewTaskModal` + `EditTaskModal` + `DeleteTaskModal` | 3 files |
| 5 | Task drawer: `TaskDetailDrawer` + `CommentSection` + `AssigneePicker` | 3 files |
| 6 | Gantt: `GanttChart` | 1 file |
| 7 | `page.tsx` — wire everything | 1 file |

**Total: 15 files, 7 APIs fully covered.**
