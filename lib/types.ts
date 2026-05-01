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
