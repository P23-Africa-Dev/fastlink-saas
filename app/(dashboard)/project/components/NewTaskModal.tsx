"use client";

import React, { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { ModalButton } from "./ModalButton";
import { Task, Project, TaskStatus, Priority, TASK_STATUS_CONFIG, PRIORITY_CONFIG, MOCK_TEAM } from "./types";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface NewTaskModalProps {
  projects: Project[];
  defaultStatus?: TaskStatus;
  defaultProject?: number;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    project_id: number;
    status: TaskStatus;
    priority: Priority;
    start_date: string;
    due_date: string;
    assignee_ids: number[];
    comment_count: number;
    order: number;
    subtasks?: string[];
  }) => void;
}

const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "completed"];
const PRIORITIES: Priority[] = ["low", "normal", "high"];
const inputCls = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors";
const labelCls = "text-[13px] font-bold text-(--text-primary)";

export function NewTaskModal({ projects, defaultStatus = "todo", defaultProject, onClose, onSave }: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [projectId, setProjectId] = useState<number>(defaultProject ?? (projects[0]?.id ?? 0));
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<Priority>("normal");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignees, setAssignees] = useState<number[]>([]);
  const [extraDescs, setExtraDescs] = useState<string[]>([]);

  const toggleAssignee = (id: number) =>
    setAssignees(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const handleSave = () => {
    if (!title.trim()) return;
    const subtasks = extraDescs.map((desc) => desc.trim()).filter(Boolean);
    onSave({
      title: title.trim(),
      description,
      project_id: projectId,
      status,
      priority,
      start_date: startDate,
      due_date: dueDate,
      assignee_ids: assignees,
      comment_count: 0,
      order: 0,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "20px 24px" }}>
          <h2 className="text-lg font-bold text-(--text-primary)">New Task</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto" style={{ padding: "24px", maxHeight: "72vh", display: "flex", flexDirection: "column", gap: "18px" }}>

          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Task Title <span className="text-red-500">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Implement auth module" className={inputCls} style={{ padding: "12px 16px" }} />
          </div>

          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Description</label>
            <div className="flex flex-col" style={{ gap: "10px" }}>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder="Task details, acceptance criteria…"
                className={`${inputCls} resize-none`}
                style={{ padding: "12px 16px" }}
              />

              {/* Extra descriptions */}
              {extraDescs.map((desc, idx) => (
                <div key={idx} className="relative group animate-in slide-in-from-top-2 duration-200">
                  <textarea
                    rows={2}
                    value={desc}
                    onChange={e => {
                      const next = [...extraDescs];
                      next[idx] = e.target.value;
                      setExtraDescs(next);
                    }}
                    placeholder="Capture more nuances or specific details…"
                    className={`${inputCls} resize-none pr-10`}
                    style={{ padding: "12px 16px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setExtraDescs(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute right-3 top-3 text-[#9ca3af] hover:text-red-500 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setExtraDescs(prev => [...prev, ""])}
                className="flex items-center gap-2 text-[12px] font-bold text-[#33084E] hover:text-[#4d0b75] transition-all w-fit group cursor-pointer"
                style={{ marginTop: "2px" }}
              >
                <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Plus size={12} />
                </div>
                <span>For multiple task, click here</span>
              </button>
            </div>
          </div>

          {/* Project */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Project</label>
            <CustomSelect
              fullWidth
              value={projectId.toString()}
              onChange={v => setProjectId(Number(v))}
              options={projects.map(p => ({ value: p.id.toString(), label: p.name }))}
              searchPlaceholder="Search projects…"
            />
          </div>

          {/* Status pill */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Status</label>
            <div className="flex flex-wrap" style={{ gap: "8px" }}>
              {TASK_STATUSES.map(s => {
                const cfg = TASK_STATUS_CONFIG[s]; const active = status === s;
                return <button key={s} type="button" onClick={() => setStatus(s)} style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", border: `1.5px solid ${active ? cfg.color : "#f0f0f5"}`, background: active ? cfg.bg : "white", color: active ? cfg.color : "#9ca3af", transition: "all 0.15s" }}>{cfg.label}</button>;
              })}
            </div>
          </div>

          {/* Priority pill */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Priority</label>
            <div className="flex items-center" style={{ gap: "8px" }}>
              {PRIORITIES.map(p => {
                const cfg = PRIORITY_CONFIG[p]; const active = priority === p;
                return <button key={p} type="button" onClick={() => setPriority(p)} style={{ padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", border: `1.5px solid ${active ? cfg.border : "#f0f0f5"}`, background: active ? cfg.bg : "white", color: active ? cfg.color : "#9ca3af", transition: "all 0.15s" }}>{cfg.label}</button>;
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "16px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} style={{ padding: "12px 16px" }} />
            </div>
          </div>

          {/* Assignees */}
          <div className="flex flex-col" style={{ gap: "10px" }}>
            <label className={labelCls}>Assign To</label>
            <div className="flex flex-col rounded-xl border border-[#f0f0f5] overflow-hidden">
              {MOCK_TEAM.map((m, i) => (
                <label key={m.id} className="flex items-center gap-3 cursor-pointer hover:bg-[#f8f8fc] transition-colors" style={{ padding: "10px 14px", borderTop: i > 0 ? "1px solid #f0f0f5" : "none" }}>
                  <input type="checkbox" checked={assignees.includes(m.id)} onChange={() => toggleAssignee(m.id)} className="rounded" />
                  <div className="rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ width: "28px", height: "28px", background: m.color }}>
                    {m.initials}
                  </div>
                  <span className="text-[13px] font-semibold text-(--text-primary)">{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "20px 24px", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" disabled={!title.trim()} onClick={handleSave}>Create Task</ModalButton>
        </div>
      </div>
    </div>
  );
}
