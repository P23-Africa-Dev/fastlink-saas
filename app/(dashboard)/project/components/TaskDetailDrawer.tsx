"use client";

import React, { useState } from "react";
import { X, Pencil, Trash2, Calendar, Layers, Users, Plus, Check, XIcon } from "lucide-react";
import { Task, Project, Comment, TASK_STATUS_CONFIG, PRIORITY_CONFIG, MOCK_TEAM } from "./types";
import { CommentSection } from "./CommentSection";
import { AssigneePicker } from "./AssigneePicker";

interface TaskDetailDrawerProps {
  task:       Task;
  project?:   Project;
  comments:   Comment[];
  onClose:    () => void;
  onEdit:     () => void;
  onDelete:   () => void;
  onComment:  (text: string) => void;
  onAssign:   (ids: number[]) => void;
  onAddSubtasks: (titles: string[]) => void;
  onToggleSubtask: (subtaskId: number, isCompleted: boolean) => void;
  onRenameSubtask: (subtaskId: number, title: string) => void;
  onDeleteSubtask: (subtaskId: number) => void;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start" style={{ gap: "10px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #f0f0f5" }}>
      <div className="shrink-0 text-[#9ca3af]" style={{ marginTop: "1px" }}>{icon}</div>
      <div className="flex flex-col" style={{ gap: "2px" }}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">{label}</span>
        <span className="text-[13px] font-semibold text-(--text-primary)">{value || <span className="text-[#9ca3af]">—</span>}</span>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  if (!d) return undefined;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function TaskDetailDrawer({
  task,
  project,
  comments,
  onClose,
  onEdit,
  onDelete,
  onComment,
  onAssign,
  onAddSubtasks,
  onToggleSubtask,
  onRenameSubtask,
  onDeleteSubtask,
}: TaskDetailDrawerProps) {
  const [isAssigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const statusCfg   = TASK_STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const assignees   = MOCK_TEAM.filter(m => task.assignee_ids.includes(m.id));
  const subtasks = task.subtasks ?? [];
  const progress = task.subtask_progress ?? { total: subtasks.length, completed: subtasks.filter((item) => item.is_completed).length, percentage: 0 };

  const handleAddSubtasks = () => {
    const titles = subtaskInput
      .split("\n")
      .map((title) => title.trim())
      .filter(Boolean);
    if (titles.length === 0) return;
    onAddSubtasks(titles);
    setSubtaskInput("");
  };

  const beginRename = (id: number, title: string) => {
    setEditingSubtaskId(id);
    setEditingTitle(title);
  };

  const saveRename = () => {
    const title = editingTitle.trim();
    if (!editingSubtaskId || !title) return;
    onRenameSubtask(editingSubtaskId, title);
    setEditingSubtaskId(null);
    setEditingTitle("");
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full bg-white z-50 flex flex-col shadow-2xl overflow-hidden" style={{ width: "500px", maxWidth: "100vw" }}>

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "16px 20px" }}>
          <span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">Task Details</span>
          <div className="flex items-center" style={{ gap: "8px" }}>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0f0f5] bg-white text-[12px] font-bold text-(--text-primary) hover:border-(--accent-purple) hover:text-(--accent-purple) transition-all"
              style={{ padding: "6px 12px" }}
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0f0f5] bg-white text-[12px] font-bold text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
              style={{ padding: "6px 12px" }}
            >
              <Trash2 size={13} /> Delete
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary) hover:bg-[#f0f0f5] transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Hero */}
          <div className="flex flex-col" style={{ gap: "10px" }}>
            <h2 className="text-[20px] font-bold text-(--text-primary) leading-tight">{task.title}</h2>
            <div className="flex flex-wrap items-center" style={{ gap: "6px" }}>
              <span className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "3px 10px", gap: "5px", background: statusCfg.bg, color: statusCfg.color }}>
                <span className="rounded-full" style={{ width: "6px", height: "6px", background: statusCfg.color }} />
                {statusCfg.label}
              </span>
              <span className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "3px 10px", background: priorityCfg.bg, color: priorityCfg.color }}>
                {priorityCfg.label} Priority
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="rounded-2xl border border-[#f0f0f5] overflow-hidden" style={{ padding: "0 16px" }}>
            <InfoRow icon={<Layers size={15} />}   label="Project"    value={project?.name} />
            <InfoRow icon={<Calendar size={15} />} label="Start Date" value={formatDate(task.start_date)} />
            <InfoRow icon={<Calendar size={15} />} label="Due Date"   value={formatDate(task.due_date)} />
          </div>

          {/* Description */}
          {task.description && (
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <h3 className="text-[13px] font-bold text-(--text-primary) uppercase tracking-wider">Description</h3>
              <div className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] text-(--text-primary) leading-relaxed" style={{ padding: "14px 16px" }}>
                {task.description}
              </div>
            </div>
          )}

          {/* Subtasks */}
          <div className="flex flex-col" style={{ gap: "10px" }}>
            <h3 className="text-[13px] font-bold text-(--text-primary) uppercase tracking-wider">Subtasks</h3>

            <div className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "10px 12px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: "8px" }}>
                <span className="text-[12px] font-semibold text-(--text-primary)">
                  {progress.completed}/{progress.total} completed
                </span>
                <span className="text-[11px] font-bold text-[#9ca3af]">{progress.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#e9e9f2] overflow-hidden">
                <div
                  className="h-full rounded-full bg-(--accent-purple) transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, progress.percentage))}%` }}
                />
              </div>
            </div>

            {subtasks.length > 0 ? (
              <div className="flex flex-col rounded-xl border border-[#f0f0f5] overflow-hidden">
                {subtasks.map((subtask, idx) => (
                  <div
                    key={subtask.id}
                    className="flex items-start justify-between bg-white"
                    style={{ padding: "10px 12px", borderTop: idx > 0 ? "1px solid #f0f0f5" : "none", gap: "10px" }}
                  >
                    <div className="flex items-start flex-1 min-w-0" style={{ gap: "10px" }}>
                      <input
                        type="checkbox"
                        checked={subtask.is_completed}
                        onChange={(e) => onToggleSubtask(subtask.id, e.target.checked)}
                        className="rounded mt-0.5"
                      />

                      {editingSubtaskId === subtask.id ? (
                        <input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename();
                            if (e.key === "Escape") {
                              setEditingSubtaskId(null);
                              setEditingTitle("");
                            }
                          }}
                          className="flex-1 min-w-0 rounded-md border border-[#e5e7eb] text-[12px] font-medium text-(--text-primary)"
                          style={{ padding: "6px 8px" }}
                        />
                      ) : (
                        <span
                          className="text-[12px] font-medium text-(--text-primary) break-words"
                          style={{ textDecoration: subtask.is_completed ? "line-through" : "none", opacity: subtask.is_completed ? 0.65 : 1 }}
                        >
                          {subtask.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center shrink-0" style={{ gap: "4px" }}>
                      {editingSubtaskId === subtask.id ? (
                        <>
                          <button
                            type="button"
                            onClick={saveRename}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#16a34a] hover:bg-green-50 transition-colors"
                            title="Save subtask"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubtaskId(null);
                              setEditingTitle("");
                            }}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f3f4f6] transition-colors"
                            title="Cancel"
                          >
                            <XIcon size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => beginRename(subtask.id, subtask.title)}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#9ca3af] hover:text-(--accent-purple) hover:bg-[#f3f4f6] transition-colors"
                            title="Rename subtask"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSubtask(subtask.id)}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete subtask"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#f0f0f5] text-center text-[12px] text-[#9ca3af]" style={{ padding: "14px 12px" }}>
                No subtasks yet.
              </div>
            )}

            <div className="rounded-xl border border-[#f0f0f5] bg-white" style={{ padding: "10px" }}>
              <textarea
                rows={3}
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                placeholder="Add one subtask per line"
                className="w-full resize-none text-[12px] outline-none placeholder:text-[#9ca3af]"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#9ca3af]">Each new line creates a subtask.</span>
                <button
                  type="button"
                  onClick={handleAddSubtasks}
                  disabled={!subtaskInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-(--accent-purple) text-white text-[11px] font-bold disabled:opacity-40"
                  style={{ padding: "6px 10px" }}
                >
                  <Plus size={12} />
                  Add Subtasks
                </button>
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div className="flex flex-col" style={{ gap: "10px" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-(--text-primary) uppercase tracking-wider">Assignees</h3>
              <button
                onClick={() => setAssigneePickerOpen(true)}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-(--accent-purple) hover:opacity-70 transition-opacity"
              >
                <Users size={13} /> Manage
              </button>
            </div>

            {assignees.length > 0 ? (
              <div className="flex flex-col rounded-xl border border-[#f0f0f5] overflow-hidden">
                {assignees.map((m, i) => (
                  <div key={m.id} className="flex items-center" style={{ padding: "10px 14px", gap: "10px", borderTop: i > 0 ? "1px solid #f0f0f5" : "none" }}>
                    <div className="rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ width: "30px", height: "30px", background: m.color }}>
                      {m.initials}
                    </div>
                    <span className="text-[13px] font-semibold text-(--text-primary)">{m.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl border border-dashed border-[#f0f0f5] flex items-center justify-center text-[12px] font-medium text-[#9ca3af] cursor-pointer hover:border-(--accent-purple) hover:text-(--accent-purple) transition-all"
                style={{ padding: "20px" }}
                onClick={() => setAssigneePickerOpen(true)}
              >
                + Assign team members
              </div>
            )}
          </div>

          {/* Comments */}
          <CommentSection comments={comments} onPost={onComment} />
        </div>
      </div>

      {/* Assignee picker modal — z above the drawer */}
      {isAssigneePickerOpen && (
        <AssigneePicker
          currentIds={task.assignee_ids}
          onClose={() => setAssigneePickerOpen(false)}
          onSave={ids => { onAssign(ids); setAssigneePickerOpen(false); }}
        />
      )}
    </>
  );
}
