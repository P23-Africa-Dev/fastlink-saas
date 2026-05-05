export type ProjectStatus = "planning" | "in_progress" | "completed" | "on_hold";
export type TaskStatus    = "todo" | "in_progress" | "review" | "completed";
export type Priority      = "low" | "normal" | "high";

export interface Project {
  id:          number;
  name:        string;
  description: string;
  status:      ProjectStatus;
  priority:    Priority;
  start_date:  string;
  due_date:    string;
}

export interface Task {
  id:           number;
  title:        string;
  description?: string;
  project_id:   number;
  status:       TaskStatus;
  priority:     Priority;
  start_date:   string;
  due_date:     string;
  assignee_ids: number[];
  comment_count?: number;
  order?:       number;
  subtasks?: Subtask[];
  subtask_progress?: SubtaskProgress;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface SubtaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

export interface Comment {
  id:         number;
  task_id:    number;
  user_name:  string;
  user_initials: string;
  comment:    string;
  created_at: string;
}

export interface TeamMember {
  id:       number;
  name:     string;
  initials: string;
  color:    string;
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  planning:    { label: "Planning",     color: "#33084E", bg: "#33084E15" },
  in_progress: { label: "In Progress",  color: "#AF580B", bg: "#AF580B15" },
  completed:   { label: "Completed",    color: "#074616", bg: "#07461615" },
  on_hold:     { label: "On Hold",      color: "#9ca3af", bg: "#f0f0f5"   },
};

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo:        { label: "To Do",        color: "#6b7280", bg: "#f0f0f5"   },
  in_progress: { label: "In Progress",  color: "#AF580B", bg: "#AF580B15" },
  review:      { label: "In Review",    color: "#1d4ed8", bg: "#1d4ed815" },
  completed:   { label: "Completed",    color: "#074616", bg: "#07461615" },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  low:    { label: "Low",    color: "#9ca3af", bg: "#f0f0f5",   border: "#d1d5db"  },
  normal: { label: "Normal", color: "#33084E", bg: "#33084E15", border: "#33084E40"},
  high:   { label: "High",   color: "#AF580B", bg: "#AF580B15", border: "#AF580B40"},
};

export const MOCK_TEAM: TeamMember[] = [
  { id: 1, name: "Alice Smith",   initials: "AS", color: "#33084E" },
  { id: 2, name: "Bob Johnson",   initials: "BJ", color: "#AF580B" },
  { id: 3, name: "Carol White",   initials: "CW", color: "#074616" },
  { id: 4, name: "David Lee",     initials: "DL", color: "#1d4ed8" },
  { id: 5, name: "Eva Martinez",  initials: "EM", color: "#be185d" },
];
