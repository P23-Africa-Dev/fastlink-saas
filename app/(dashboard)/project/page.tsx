"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, FolderOpen, LayoutGrid, GanttChartSquare, Pencil, Trash2 } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

import { ProjectCard } from "./components/ProjectCard";
import { NewProjectModal } from "./components/NewProjectModal";
import { EditProjectModal } from "./components/EditProjectModal";
import { DeleteProjectModal } from "./components/DeleteProjectModal";
import { KanbanBoard } from "./components/KanbanBoard";
import { NewTaskModal } from "./components/NewTaskModal";
import { EditTaskModal } from "./components/EditTaskModal";
import { DeleteTaskModal } from "./components/DeleteTaskModal";
import { TaskDetailDrawer } from "./components/TaskDetailDrawer";
import { GanttChart } from "./components/GanttChart";
import {
  Project, Task, Comment, TaskStatus,
} from "./components/types";
import { ProjectSkeleton } from "@/components/ProjectSkeleton";
import { toast } from "sonner";

interface BackendUser {
  id: number;
  name: string;
}

interface BackendTaskComment {
  id: number;
  task_id: number;
  comment: string;
  created_at: string;
  user?: BackendUser;
}

interface BackendTask {
  id: number;
  title: string;
  description?: string | null;
  project_id: number;
  status: "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  start_date: string | null;
  due_date: string | null;
  order?: number;
  comments_count?: number;
  assignees?: BackendUser[];
  comments?: BackendTaskComment[];
}

interface BackendProject {
  id: number;
  name: string;
  description: string | null;
  status: "planning" | "in_progress" | "completed" | "on_hold" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  start_date: string | null;
  due_date: string | null;
}

const mapPriorityToUi = (priority: BackendTask["priority"] | BackendProject["priority"]) => {
  if (priority === "low") return "low" as const;
  if (priority === "high" || priority === "urgent") return "high" as const;
  return "normal" as const;
};

const mapPriorityToApi = (priority: "low" | "normal" | "high") => {
  if (priority === "normal") return "medium";
  return priority;
};

function mapProject(raw: BackendProject): Project {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? "",
    status: raw.status === "cancelled" ? "on_hold" : raw.status,
    priority: mapPriorityToUi(raw.priority),
    start_date: raw.start_date ?? "",
    due_date: raw.due_date ?? "",
  };
}

function mapTask(raw: BackendTask): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? "",
    project_id: raw.project_id,
    status: raw.status,
    priority: mapPriorityToUi(raw.priority),
    start_date: raw.start_date ?? "",
    due_date: raw.due_date ?? "",
    assignee_ids: raw.assignees?.map((a) => a.id) ?? [],
    comment_count: raw.comments_count ?? raw.comments?.length ?? 0,
    order: raw.order ?? 0,
  };
}

function mapComment(raw: BackendTaskComment): Comment {
  const userName = raw.user?.name ?? "User";
  const userInitials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return {
    id: raw.id,
    task_id: raw.task_id,
    user_name: userName,
    user_initials: userInitials,
    comment: raw.comment,
    created_at: raw.created_at,
  };
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const initialProjects: Project[] = [
  { id: 1, name: "Mobile App Build", description: "Core product initiative — iOS & Android.", status: "in_progress", priority: "high", start_date: "2026-05-01", due_date: "2026-08-01" },
  { id: 2, name: "Website Rebrand", description: "Update brand identity across all web surfaces.", status: "planning", priority: "normal", start_date: "2026-05-15", due_date: "2026-07-01" },
  { id: 3, name: "API v2 Migration", description: "Migrate all endpoints to v2 with new auth.", status: "in_progress", priority: "high", start_date: "2026-04-20", due_date: "2026-06-30" },
  { id: 4, name: "Analytics Dashboard", "description": "Build real-time analytics for client portals.", status: "planning", priority: "normal", start_date: "2026-06-01", due_date: "2026-09-01" },
];

const initialTasks: Task[] = [
  { id: 101, title: "Implement auth module", description: "Sanctum + role middleware", project_id: 1, status: "completed", priority: "high", start_date: "2026-05-01", due_date: "2026-05-07", assignee_ids: [1, 2], comment_count: 3, order: 1 },
  { id: 102, title: "Design system setup", description: "Tokens, components, storybook", project_id: 1, status: "completed", priority: "normal", start_date: "2026-05-03", due_date: "2026-05-10", assignee_ids: [3], comment_count: 1, order: 2 },
  { id: 103, title: "Push notification service", description: "FCM integration", project_id: 1, status: "in_progress", priority: "high", start_date: "2026-05-08", due_date: "2026-05-20", assignee_ids: [1], comment_count: 0, order: 1 },
  { id: 104, title: "Offline mode", description: "Cache and sync strategy", project_id: 1, status: "todo", priority: "normal", start_date: "2026-05-20", due_date: "2026-06-05", assignee_ids: [], comment_count: 0, order: 1 },
  { id: 105, title: "Beta testing", description: "Internal QA + TestFlight", project_id: 1, status: "todo", priority: "high", start_date: "2026-06-10", due_date: "2026-06-30", assignee_ids: [2, 4], comment_count: 0, order: 2 },
  { id: 201, title: "Brand audit", description: "Document current assets", project_id: 2, status: "completed", priority: "normal", start_date: "2026-05-15", due_date: "2026-05-22", assignee_ids: [5], comment_count: 2, order: 1 },
  { id: 202, title: "New logo concepts", description: "3 directions for review", project_id: 2, status: "in_progress", priority: "high", start_date: "2026-05-22", due_date: "2026-06-05", assignee_ids: [5], comment_count: 1, order: 1 },
  { id: 203, title: "Website wireframes", description: "Home, about, pricing pages", project_id: 2, status: "review", priority: "normal", start_date: "2026-06-01", due_date: "2026-06-15", assignee_ids: [3, 5], comment_count: 4, order: 1 },
  { id: 301, title: "Endpoint audit", description: "Document all v1 endpoints", project_id: 3, status: "completed", priority: "normal", start_date: "2026-04-20", due_date: "2026-04-30", assignee_ids: [1], comment_count: 0, order: 1 },
  { id: 302, title: "Auth migration", description: "Move to Sanctum tokens", project_id: 3, status: "in_progress", priority: "high", start_date: "2026-05-01", due_date: "2026-05-15", assignee_ids: [1, 2], comment_count: 2, order: 2 },
  { id: 303, title: "Deprecation notices", description: "Notify clients of v1 sunset", project_id: 3, status: "todo", priority: "low", start_date: "2026-05-20", due_date: "2026-06-01", assignee_ids: [], comment_count: 0, order: 1 },
];

const initialComments: Record<number, Comment[]> = {
  101: [
    { id: 1, task_id: 101, user_name: "Alice Smith", user_initials: "AS", comment: "Sanctum is configured. Roles middleware is working.", created_at: "2026-05-06T10:30:00Z" },
    { id: 2, task_id: 101, user_name: "Bob Johnson", user_initials: "BJ", comment: "Please verify the acceptance criteria before marking done.", created_at: "2026-05-06T14:00:00Z" },
    { id: 3, task_id: 101, user_name: "Alice Smith", user_initials: "AS", comment: "Verified — all tests passing. ✅", created_at: "2026-05-07T09:00:00Z" },
  ],
  203: [
    { id: 4, task_id: 203, user_name: "Carol White", user_initials: "CW", comment: "Wireframes uploaded to Figma, ready for review.", created_at: "2026-06-10T11:00:00Z" },
    { id: 5, task_id: 203, user_name: "Eva Martinez", user_initials: "EM", comment: "Looks great! Minor tweak on the pricing layout.", created_at: "2026-06-11T09:30:00Z" },
    { id: 6, task_id: 203, user_name: "Carol White", user_initials: "CW", comment: "Updated. Please check again.", created_at: "2026-06-11T15:00:00Z" },
    { id: 7, task_id: 203, user_name: "Eva Martinez", user_initials: "EM", comment: "Approved! 🎉", created_at: "2026-06-12T08:00:00Z" },
  ],
};

// ── Menu type ────────────────────────────────────────────────────────────────

interface MenuState {
  type: "project" | "task";
  item: Project | Task;
  x: number;
  y: number;
}

// ── Helper ───────────────────────────────────────────────────────────────────

type ActiveView = "projects" | "kanban" | "gantt";

const VIEWS: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
  { id: "projects", label: "Projects", icon: <FolderOpen size={15} /> },
  { id: "kanban", label: "Tasks", icon: <LayoutGrid size={15} /> },
  { id: "gantt", label: "Gantt", icon: <GanttChartSquare size={15} /> },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [activeView, setActiveView] = useState<ActiveView>("projects");
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Selected items
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modal flags
  const [isNewProjectOpen, setNewProjectOpen] = useState(false);
  const [isEditProjectOpen, setEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [isNewTaskOpen, setNewTaskOpen] = useState(false);
  const [isEditTaskOpen, setEditTaskOpen] = useState(false);
  const [isDeleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>("todo");

  // Context menu
  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menu]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [projectRes, taskRes] = await Promise.all([
          api.get<ApiResponse<BackendProject[]>>("/projects", { params: { per_page: 200 } }),
          api.get<ApiResponse<BackendTask[]>>("/tasks", { params: { per_page: 300 } }),
        ]);

        if (!mounted) return;

        setProjects(projectRes.data.data.map(mapProject));
        setTasks(taskRes.data.data.map(mapTask));
      } catch (error: any) {
        console.error("Failed to load project data", error);
        toast.error(error?.response?.data?.message || "Failed to load project data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTask) return;

    let mounted = true;

    const loadTaskComments = async () => {
      try {
        const res = await api.get<ApiResponse<BackendTask>>(`/tasks/${selectedTask.id}`);
        const mappedTask = mapTask(res.data.data);
        const mappedComments = (res.data.data.comments ?? []).map(mapComment);

        if (!mounted) return;

        setSelectedTask(mappedTask);
        setTasks((prev) => prev.map((t) => (t.id === mappedTask.id ? mappedTask : t)));
        setComments((prev) => ({ ...prev, [selectedTask.id]: mappedComments }));
      } catch (error) {
        console.error("Failed to load task details", error);
      }
    };

    void loadTaskComments();

    return () => {
      mounted = false;
    };
  }, [selectedTask?.id]);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, type: "project" | "task", item: Project | Task) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ type, item, x: rect.right, y: rect.bottom + 4 });
  };

  // Project handlers
  const handleOpenProject = (project: Project) => {
    setSelectedProjectId(project.id);
    setActiveView("kanban");
  };

  // Task handlers
  const handleTaskMove = (taskId: number, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    void api.patch(`/tasks/${taskId}`, { status: newStatus }).catch((error) => {
      console.error("Failed to move task", error);
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleAddTask = (status: TaskStatus) => {
    setDefaultTaskStatus(status);
    setNewTaskOpen(true);
  };

  const handleComment = (taskId: number, text: string) => {
    void (async () => {
      try {
        const res = await api.post<ApiResponse<BackendTaskComment>>(`/tasks/${taskId}/comments`, { comment: text });
        const mapped = mapComment(res.data.data);
        setComments(prev => ({ ...prev, [taskId]: [...(prev[taskId] ?? []), mapped] }));
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comment_count: (t.comment_count ?? 0) + 1 } : t));
      } catch (error) {
        console.error("Failed to add comment", error);
      }
    })();
  };

  const handleAssign = (taskId: number, ids: number[]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee_ids: ids } : t));
    setSelectedTask(prev => prev?.id === taskId ? { ...prev, assignee_ids: ids } : prev);
    void api.post(`/tasks/${taskId}/assign`, { assignee_ids: ids }).catch((error) => {
      console.error("Failed to assign task", error);
    });
  };

  const projectName = selectedProject?.name ?? "";

  if (loading) {
    return <ProjectSkeleton />;
  }

  return (
    <div className="flex flex-col w-full bg-white overflow-hidden" style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "24px" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ gap: "16px" }}>
        <div>
          <h1 className="text-2xl font-bold text-(--text-primary)">Project Management</h1>
          <p className="text-sm text-(--text-muted)" style={{ marginTop: "4px" }}>Organize milestones, tasks, and delivery timelines.</p>
        </div>
        <div className="flex items-center" style={{ gap: "10px" }}>
          {activeView === "kanban" && (
            <button
              onClick={() => { setNewTaskOpen(true); setDefaultTaskStatus("todo"); }}
              className="flex items-center border border-[#f0f0f5] text-[13px] font-bold text-(--text-primary) hover:opacity-80 transition-all rounded-xl"
              style={{ padding: "10px 16px", gap: "8px", background: "white" }}
            >
              <Plus size={15} /> New Task
            </button>
          )}
          <button
            onClick={() => setNewProjectOpen(true)}
            className="flex items-center text-[13px] font-bold text-white hover:opacity-90 transition-all rounded-xl shadow-[0_4px_14px_rgba(51,8,78,0.25)]"
            style={{ padding: "10px 16px", gap: "8px", background: "#33084E" }}
          >
            <Plus size={15} /> New Project
          </button>
        </div>
      </div>

      {/* ── View Switcher + Project Filter ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border border-[#f0f0f5] rounded-2xl bg-white shadow-sm" style={{ padding: "12px 16px", gap: "12px" }}>
        {/* Tab pills */}
        <div className="flex items-center bg-[#f8f8fc] rounded-xl border border-[#f0f0f5]" style={{ gap: "4px", padding: "4px" }}>
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className="inline-flex items-center gap-2 rounded-lg text-[13px] font-bold transition-all"
              style={{
                padding: "8px 14px",
                background: activeView === v.id ? "#33084E" : "transparent",
                color: activeView === v.id ? "white" : "#9ca3af",
              }}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>

        {/* Project filter (kanban / gantt) */}
        {(activeView === "kanban" || activeView === "gantt") && (
          <CustomSelect
            value={selectedProjectId?.toString() ?? ""}
            onChange={v => setSelectedProjectId(v ? Number(v) : null)}
            options={[
              { value: "", label: "All Projects" },
              ...projects.map(p => ({ value: p.id.toString(), label: p.name })),
            ]}
            searchPlaceholder="Search projects…"
          />
        )}
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">

        {/* Projects grid */}
        {activeView === "projects" && (
          <div className="overflow-y-auto flex-1" style={{ paddingRight: "4px" }}>
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{ gap: "12px" }}>
                <div className="w-16 h-16 rounded-2xl bg-[#f0f0f5] flex items-center justify-center text-[#9ca3af]">
                  <FolderOpen size={28} />
                </div>
                <p className="text-[15px] font-bold text-(--text-primary)">No projects yet</p>
                <p className="text-[13px] text-[#9ca3af]">Create your first project to get started.</p>
                <button
                  onClick={() => setNewProjectOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl text-[13px] font-bold text-white"
                  style={{ padding: "10px 20px", background: "#33084E", gap: "8px" }}
                >
                  <Plus size={15} /> New Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: "20px" }}>
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    tasks={tasks}
                    onOpen={() => handleOpenProject(project)}
                    onMenuClick={(e, p) => openMenu(e, "project", p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kanban board */}
        {activeView === "kanban" && (
          <KanbanBoard
            tasks={tasks}
            projects={projects}
            selectedProject={selectedProjectId}
            onTaskMove={handleTaskMove}
            onTaskClick={handleTaskClick}
            onTaskMenuClick={(e, t) => openMenu(e, "task", t)}
            onAddTask={handleAddTask}
          />
        )}

        {/* Gantt chart */}
        {activeView === "gantt" && (
          <GanttChart
            projects={selectedProjectId ? projects.filter(p => p.id === selectedProjectId) : projects}
            tasks={selectedProjectId ? tasks.filter(t => t.project_id === selectedProjectId) : tasks}
          />
        )}
      </div>

      {/* ── Context Menu ────────────────────────────────────────────────── */}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-9999 bg-white rounded-xl border border-[#f0f0f5] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden"
          style={{ top: menu.y, left: menu.x, transform: "translateX(-100%)", minWidth: "152px" }}
        >
          <button
            className="w-full flex items-center text-[13px] font-bold text-(--text-primary) hover:bg-[#f8f8fc] transition-colors"
            style={{ padding: "11px 16px", gap: "10px" }}
            onClick={() => {
              if (menu.type === "project") {
                setSelectedProject(menu.item as Project);
                setEditProjectOpen(true);
              } else {
                setSelectedTask(menu.item as Task);
                setEditTaskOpen(true);
              }
              setMenu(null);
            }}
          >
            <Pencil size={14} className="text-[#9ca3af]" />
            Edit {menu.type === "project" ? "Project" : "Task"}
          </button>
          <div className="border-t border-[#f0f0f5]" />
          <button
            className="w-full flex items-center text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors"
            style={{ padding: "11px 16px", gap: "10px" }}
            onClick={() => {
              if (menu.type === "project") {
                setSelectedProject(menu.item as Project);
                setDeleteProjectOpen(true);
              } else {
                setSelectedTask(menu.item as Task);
                setDeleteTaskOpen(true);
              }
              setMenu(null);
            }}
          >
            <Trash2 size={14} className="text-red-400" />
            Delete {menu.type === "project" ? "Project" : "Task"}
          </button>
        </div>
      )}

      {/* ── Task Detail Drawer ──────────────────────────────────────────── */}
      {selectedTask && !isEditTaskOpen && !isDeleteTaskOpen && (
        <TaskDetailDrawer
          task={selectedTask}
          project={projects.find(p => p.id === selectedTask.project_id)}
          comments={comments[selectedTask.id] ?? []}
          onClose={() => setSelectedTask(null)}
          onEdit={() => setEditTaskOpen(true)}
          onDelete={() => setDeleteTaskOpen(true)}
          onComment={text => handleComment(selectedTask.id, text)}
          onAssign={ids => handleAssign(selectedTask.id, ids)}
        />
      )}

      {/* ── Project Modals ──────────────────────────────────────────────── */}
      {isNewProjectOpen && (
        <NewProjectModal
          onClose={() => setNewProjectOpen(false)}
          onSave={(data) => {
            void (async () => {
              try {
                const res = await api.post<ApiResponse<BackendProject>>("/projects", {
                  ...data,
                  priority: mapPriorityToApi(data.priority),
                });
                setProjects((prev) => [...prev, mapProject(res.data.data)]);
              } catch (error) {
                console.error("Failed to create project", error);
              }
            })();
          }}
        />
      )}

      {isEditProjectOpen && selectedProject && (
        <EditProjectModal
          project={selectedProject}
          onClose={() => { setEditProjectOpen(false); setSelectedProject(null); }}
          onSave={(data) => {
            void (async () => {
              try {
                const res = await api.patch<ApiResponse<BackendProject>>(`/projects/${selectedProject.id}`, {
                  ...data,
                  priority: data.priority ? mapPriorityToApi(data.priority) : undefined,
                });
                const updated = mapProject(res.data.data);
                setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? updated : p)));
                setEditProjectOpen(false);
                setSelectedProject(null);
              } catch (error) {
                console.error("Failed to update project", error);
              }
            })();
          }}
        />
      )}

      {isDeleteProjectOpen && selectedProject && (
        <DeleteProjectModal
          projectName={projectName}
          onClose={() => { setDeleteProjectOpen(false); setSelectedProject(null); }}
          onConfirm={() => {
            void (async () => {
              try {
                await api.delete(`/projects/${selectedProject.id}`);
                setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
                setTasks(prev => prev.filter(t => t.project_id !== selectedProject.id));
                setSelectedProject(null);
              } catch (error) {
                console.error("Failed to delete project", error);
              }
            })();
          }}
        />
      )}

      {/* ── Task Modals ─────────────────────────────────────────────────── */}
      {isNewTaskOpen && (
        <NewTaskModal
          projects={projects}
          defaultStatus={defaultTaskStatus}
          defaultProject={selectedProjectId ?? undefined}
          onClose={() => setNewTaskOpen(false)}
          onSave={(data) => {
            void (async () => {
              try {
                const res = await api.post<ApiResponse<BackendTask>>("/tasks", {
                  ...data,
                  priority: mapPriorityToApi(data.priority),
                });
                setTasks((prev) => [...prev, mapTask(res.data.data)]);
              } catch (error) {
                console.error("Failed to create task", error);
              }
            })();
          }}
        />
      )}

      {isEditTaskOpen && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => { setEditTaskOpen(false); }}
          onSave={(data) => {
            void (async () => {
              try {
                const res = await api.patch<ApiResponse<BackendTask>>(`/tasks/${selectedTask.id}`, {
                  ...data,
                  priority: data.priority ? mapPriorityToApi(data.priority) : undefined,
                });
                const updated = mapTask(res.data.data);
                setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? updated : t)));
                setSelectedTask(updated);
                setEditTaskOpen(false);
              } catch (error) {
                console.error("Failed to update task", error);
              }
            })();
          }}
        />
      )}

      {isDeleteTaskOpen && selectedTask && (
        <DeleteTaskModal
          taskTitle={selectedTask.title}
          onClose={() => { setDeleteTaskOpen(false); }}
          onConfirm={() => {
            void (async () => {
              try {
                await api.delete(`/tasks/${selectedTask.id}`);
                setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
                setSelectedTask(null);
                setDeleteTaskOpen(false);
              } catch (error) {
                console.error("Failed to delete task", error);
              }
            })();
          }}
        />
      )}
    </div>
  );
}
