# FastLink API Integration Plan

**Base URL:** `https://p23africa.com/fastlink-backend/public/api/v1`  
**Auth:** Laravel Sanctum — Bearer token, stored in Zustand (persisted to `localStorage`).  
**Data fetching:** TanStack React Query (`@tanstack/react-query`)  
**Global state:** Zustand (`zustand`)

---

## Package Installation (once, before Phase 1)

```bash
npm install @tanstack/react-query zustand axios
```

- `@tanstack/react-query` — server state: fetching, caching, mutations, invalidation
- `zustand` — client state: auth token, current user, UI state that spans multiple pages
- `axios` — HTTP client with interceptors for auth headers and 401 handling

---

## Architecture Conventions (applied from Phase 1 onward)

| Concern | Tool | Location |
|---|---|---|
| Auth token + current user | Zustand store | `lib/stores/authStore.ts` |
| UI-only cross-page state (sidebar open, active filters) | Zustand store | `lib/stores/uiStore.ts` |
| Server data (leads, tasks, users…) | React Query | co-located `hooks/use*.ts` per feature |
| Raw HTTP calls | Axios instance | `lib/api.ts` |
| TypeScript shapes | Interfaces | `lib/types.ts` |
| React Query provider | `QueryClientProvider` | `app/(dashboard)/layout.tsx` or root layout |

**Rules:**
- React Query owns all server state — never duplicate API responses into Zustand.
- Zustand owns auth token, current user profile, and any UI state that must survive a page navigation.
- Each feature folder gets its own `hooks/` directory with typed `useQuery` / `useMutation` hooks.
- Loading and error states are handled inside each hook; components just consume `{ data, isPending, error }`.
- A 401 response in the Axios interceptor clears the Zustand auth store and redirects to `/`.
- Mock data stays in place as a fallback until the live endpoint for that feature is confirmed working.

---

## Phase 1 — Auth Layer

**Files:** `app/page.tsx`, `lib/api.ts`, `lib/types.ts`, `lib/stores/authStore.ts`, `app/(dashboard)/layout.tsx`, `components/Topbar.tsx`

### 1.1 Axios instance (`lib/api.ts`)
- `baseURL` set to the FastLink API.
- Request interceptor: reads token from Zustand `authStore` and attaches `Authorization: Bearer <token>`.
- Response interceptor: on 401, calls `authStore.clearAuth()` and redirects to `/`.

### 1.2 Auth Zustand store (`lib/stores/authStore.ts`)
```ts
interface AuthState {
  token: string | null;
  user: CurrentUser | null;
  setAuth: (token: string, user: CurrentUser) => void;
  clearAuth: () => void;
}
```
- Persisted to `localStorage` via Zustand `persist` middleware so token survives page refresh.

### 1.3 Login Screen (`app/page.tsx`)
- Full-screen creative UI — purple `#33084E` / green / amber gradient theme.
- Fields: Email, Password with client-side validation (required, email format, min 8 chars password).
- On submit: `POST /auth/login` via plain Axios (not React Query — login is a one-shot action).
- On success: call `authStore.setAuth(token, user)`, redirect to `/dashboard`.
- On failure: show inline error message.

### 1.4 Route guard (`app/(dashboard)/layout.tsx`)
- On mount, read token from `authStore`.
- If no token → redirect to `/`.
- Wrap children in `QueryClientProvider` (single `QueryClient` instance).

### 1.5 Logout (`components/Topbar.tsx`)
- `POST /auth/logout` (invalidates token server-side).
- Call `authStore.clearAuth()`, redirect to `/`.
- Wire to the existing logout button.

**Exit criteria:** Login works end-to-end, token persists on refresh, unauthenticated users are redirected, logout clears everything.

---

## Phase 2 — Dashboard Stats

**Files:** `app/(dashboard)/dashboard/page.tsx`, `app/(dashboard)/dashboard/hooks/useDashboard.ts`

### Hooks
```ts
// useDashboard.ts
export function useDashboardStats() {
  return useQuery({ queryKey: ["dashboard", "stats"], queryFn: () => api.get("/dashboard/stats") });
}
```

### Integration points
- Summary stat cards → `GET /dashboard/stats` (live totals replacing hardcoded numbers).
- Recent activity feed → `GET /dashboard/recent-activity` (if endpoint exists).
- Skeleton loaders shown while `isPending === true`.
- Stale time: 60 seconds (stats don't need real-time updates).

**Exit criteria:** Dashboard cards show live counts from the database.

---

## Phase 3 — CRM (Leads, Drives, Statuses)

**Files:** `app/(dashboard)/crm/`, `app/(dashboard)/crm/hooks/`

### Hooks
| Hook | Endpoint | Notes |
|---|---|---|
| `useDrives()` | `GET /leads/drives` | Populates pipeline columns + drive filter |
| `useStatuses()` | `GET /leads/statuses` | Populates status dropdowns in all modals |
| `useLeads(filters)` | `GET /leads` | Paginated; filters passed as query params |
| `useCreateLead()` | `POST /leads` | Mutation; invalidates `["leads"]` on success |
| `useUpdateLead()` | `PUT /leads/{id}` | Mutation; invalidates `["leads"]` |
| `useDeleteLead()` | `DELETE /leads/{id}` | Mutation; invalidates `["leads"]` |
| `useImportLeads()` | `POST /leads/import` | Multipart form mutation |

### Integration points
- FilterBar filters → React Query `enabled` + `queryKey` updated on filter change (no manual fetch calls).
- Kanban columns built from `useDrives()` + `useLeads()` combined.
- Optimistic updates optional for drag-and-drop lane changes.

**Exit criteria:** Leads load live, CRUD operations persist to the database, import works.

---

## Phase 4 — Projects & Tasks

**Files:** `app/(dashboard)/project/`, `app/(dashboard)/project/hooks/`

### Hooks
| Hook | Endpoint |
|---|---|
| `useProjects()` | `GET /projects` |
| `useCreateProject()` | `POST /projects` |
| `useUpdateProject()` | `PUT /projects/{id}` |
| `useDeleteProject()` | `DELETE /projects/{id}` |
| `useTasks(filters)` | `GET /tasks` (with `project_id`, `status`, `priority`) |
| `useCreateTask()` | `POST /tasks` |
| `useUpdateTask()` | `PUT /tasks/{id}` |
| `useDeleteTask()` | `DELETE /tasks/{id}` |

### Integration points
- Project filter dropdown → `useProjects()` replaces `MOCK_PROJECTS`.
- Task list / board → `useTasks(filters)` replaces `MOCK_TASKS`.
- Modals submit via mutations; on success React Query auto-refetches the affected list.

**Exit criteria:** Projects and tasks persist, filters work against live data.

---

## Phase 5 — Attendance & Leave Requests

**Files:** `app/(dashboard)/attendance/`, `app/(dashboard)/users/` (Leave Requests tab)

### Hooks
| Hook | Endpoint |
|---|---|
| `useAttendanceLogs(filters)` | `GET /attendance` |
| `useAttendanceSummary(date)` | `GET /attendance/summary` |
| `useCreateAttendance()` | `POST /attendance` |
| `useUpdateAttendance()` | `PUT /attendance/{id}` |
| `useLeaveRequests(filters)` | `GET /leave-requests` |
| `useCreateLeaveRequest()` | `POST /leave-requests` |
| `useApproveLeave()` | `PUT /leave-requests/{id}/approve` |
| `useRejectLeave()` | `PUT /leave-requests/{id}/reject` |

### Integration points
- LogListView filters → query params passed into `useAttendanceLogs`.
- Calendar heatmap → `useAttendanceSummary` keyed by month.
- Leave request table → `useLeaveRequests`; approve/reject buttons call mutations.

**Exit criteria:** Attendance and leave data are live; approval actions persist.

---

## Phase 6 — User Management & Settings

**Files:** `app/(dashboard)/settings/`, `components/Topbar.tsx`, `components/Sidebar.tsx`

### Hooks
| Hook | Endpoint |
|---|---|
| `useUsers(filters)` | `GET /users` |
| `useCurrentUser()` | `GET /users/me` |
| `useCreateUser()` | `POST /users` |
| `useUpdateUser()` | `PUT /users/{id}` |
| `useDeleteUser()` | `DELETE /users/{id}` |

### Integration points
- `useCurrentUser()` → logged-in user's name and avatar in Topbar/Sidebar (replaces hardcoded placeholder).
- Settings user table → `useUsers(filters)` with role filter and pagination wired to query params.
- Create/Edit/Delete user modals → mutations with list invalidation on success.

**Exit criteria:** All user management is live; Topbar shows the real logged-in user.

---

## Phase Summary

| Phase | Scope | Key Dependencies |
|---|---|---|
| 1 | Auth (login, token, guard, logout) | `axios`, `zustand` |
| 2 | Dashboard stats | React Query |
| 3 | CRM — leads, drives, statuses | React Query |
| 4 | Projects & Tasks | React Query |
| 5 | Attendance & Leave Requests | React Query |
| 6 | User Management + current user in nav | React Query |

Each phase is independently testable. Implementation begins only after explicit approval per phase.
