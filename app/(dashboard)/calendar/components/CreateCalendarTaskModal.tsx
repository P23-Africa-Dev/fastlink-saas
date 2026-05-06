"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { CreateCalendarTaskPayload, Project, User } from "@/lib/types";

interface CreateCalendarTaskModalProps {
  selectedDate: string;
  projects: Project[];
  users: User[];
  onClose: () => void;
  onSave: (payload: CreateCalendarTaskPayload) => Promise<void>;
}

const inputCls = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors";
const labelCls = "text-[13px] font-bold text-(--text-primary)";

export function CreateCalendarTaskModal({ selectedDate, projects, users, onClose, onSave }: CreateCalendarTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(selectedDate);
  const [dueDate, setDueDate] = useState(selectedDate);
  const [status, setStatus] = useState<"todo" | "in_progress" | "review" | "completed">("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [projectId, setProjectId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const todayIso = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);
  const isPastStartDate = !!startDate && startDate < todayIso;

  const projectOptions = useMemo(
    () => [{ value: "", label: "No project" }, ...projects.map((project) => ({ value: String(project.id), label: project.name }))],
    [projects]
  );

  const userOptions = useMemo(
    () => [{ value: "", label: "Unassigned" }, ...users.map((user) => ({ value: String(user.id), label: user.name }))],
    [users]
  );

  async function handleSave() {
    if (!title.trim() || !startDate || !dueDate || dueDate < startDate || isPastStartDate || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: startDate,
        due_date: dueDate,
        status,
        priority,
        project_id: projectId ? Number(projectId) : undefined,
        assigned_to: assignedTo ? Number(assignedTo) : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "18px 22px" }}>
          <h2 className="text-lg font-bold text-(--text-primary)">Create Task</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ padding: "22px", maxHeight: "72vh", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>
              Task title <span className="text-red-500">*</span>
            </label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputCls} style={{ padding: "12px 16px" }} placeholder="e.g. Call client for monthly review" />
          </div>

          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${inputCls} resize-none`}
              style={{ padding: "12px 16px" }}
              placeholder="Additional details..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "14px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Start date</label>
              <input type="date" min={todayIso} value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Due date</label>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "14px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Project</label>
              <CustomSelect value={projectId} onChange={setProjectId} options={projectOptions} fullWidth />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Assignee</label>
              <CustomSelect value={assignedTo} onChange={setAssignedTo} options={userOptions} fullWidth />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "14px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Status</label>
              <CustomSelect
                value={status}
                onChange={(value) => setStatus(value as "todo" | "in_progress" | "review" | "completed")}
                options={[
                  { value: "todo", label: "To Do" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "review", label: "Review" },
                  { value: "completed", label: "Completed" },
                ]}
                fullWidth
              />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Priority</label>
              <CustomSelect
                value={priority}
                onChange={(value) => setPriority(value as "low" | "medium" | "high" | "urgent")}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ]}
                fullWidth
              />
            </div>
          </div>

          {dueDate < startDate && (
            <p className="text-[12px] text-[#b91c1c] font-semibold">Due date cannot be earlier than start date.</p>
          )}
          {isPastStartDate && (
            <p className="text-[12px] text-[#b91c1c] font-semibold">Start date cannot be in the past.</p>
          )}
        </div>

        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "16px 22px", gap: "10px" }}>
          <button className="h-10 rounded-xl border border-[#e5e7eb] text-[#6b7280] text-[12px] font-bold" style={{ padding: "0 14px" }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="h-10 rounded-xl bg-[#33084E] text-white text-[12px] font-bold disabled:opacity-60"
            style={{ padding: "0 14px" }}
            onClick={handleSave}
            disabled={!title.trim() || !startDate || !dueDate || dueDate < startDate || isPastStartDate || saving}
          >
            {saving ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
