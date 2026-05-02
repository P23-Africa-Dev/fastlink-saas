export interface UserRole {
  id: number;
  name: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  roles: UserRole[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  roles?: UserRole[];
  suspended_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_name: string;
}

export interface LoginResponseData {
  token: string;
  token_type: string;
  user: CurrentUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  overview: {
    users_total: number;
    users_active: number;
    leads_total: number;
    projects_total: number;
    tasks_total: number;
    attendance_today: number;
    leave_pending: number;
    spreadsheets_total: number;
  };
  crm: {
    new: number;
    won: number;
    lost: number;
    pipeline_value: number;
    conversion_rate: number;
  };
  projects: {
    active: number;
    completed_tasks: number;
    pending_tasks: number;
  };
  monthly: {
    new_leads: number;
    completed_tasks: number;
  };
}
// ─── CRM ──────────────────────────────────────────────────────────────────────
export interface Drive {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  position: number;
  is_default: boolean;
}

export interface LeadStatus {
  id: number;
  name: string;
  slug: string;
  color: string;
  position: number;
  is_default: boolean;
  is_won: boolean;
  is_lost: boolean;
}

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string | null;
  estimated_value: number | string | null;
  currency: string | null;
  priority: "low" | "medium" | "high" | "urgent" | "normal";
  status_id: number;
  drive_id: number;
  notes: string | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  statusDefinition?: LeadStatus;
  status_definition?: LeadStatus;
  user?: User;
}
// ─── Projects ──────────────────────────────────────────────────────────────
export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: "active" | "completed" | "on_hold" | "planning";
  priority: "low" | "medium" | "high" | "urgent" | "normal";
  progress: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent" | "normal";
  start_date: string | null;
  due_date: string | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  project?: {
    id: number;
    name: string;
  } | null;
  user?: User;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

// ─── Attendance ────────────────────────────────────────────────────────────
export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  signed_in_at: string | null;
  signed_out_at: string | null;
  status: "present" | "absent" | "late" | "half_day";
  total_hours: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface AttendanceCalendarPayload {
  month: string;
  attendances: Attendance[];
  leave_requests: LeaveRequest[];
  tasks: Task[];
}

// ─── Leave Requests ────────────────────────────────────────────────────────
export interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type: string;
  type?: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  duration_days?: string | number;
  status: "pending" | "approved" | "rejected" | "modified";
  created_at: string;
  updated_at: string;
  user?: User;
  supervisor?: User;
  supervisor_id?: number | null;
  decision_note?: string | null;
  supervisor_note?: string | null;
  modified_start_date?: string | null;
  modified_end_date?: string | null;
  sender_response_note?: string | null;
}
