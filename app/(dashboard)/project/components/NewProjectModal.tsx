"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { ModalButton } from "./ModalButton";
import { Project, ProjectStatus, Priority, PROJECT_STATUS_CONFIG, PRIORITY_CONFIG } from "./types";

interface NewProjectModalProps {
  onClose:  () => void;
  onSave:   (data: Omit<Project, "id">) => void;
}

const PROJECT_STATUSES: ProjectStatus[] = ["planning", "in_progress", "completed", "on_hold"];
const PRIORITIES: Priority[]            = ["low", "normal", "high"];

const inputCls    = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors";
const labelCls    = "text-[13px] font-bold text-(--text-primary)";

export function NewProjectModal({ onClose, onSave }: NewProjectModalProps) {
  const [name,        setName]       = useState("");
  const [description, setDesc]       = useState("");
  const [status,      setStatus]     = useState<ProjectStatus>("planning");
  const [priority,    setPriority]   = useState<Priority>("normal");
  const [startDate,   setStartDate]  = useState("");
  const [dueDate,     setDueDate]    = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description, status, priority, start_date: startDate, due_date: dueDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "20px 24px" }}>
          <h2 className="text-lg font-bold text-(--text-primary)">New Project</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ padding: "24px", maxHeight: "70vh", display: "flex", flexDirection: "column", gap: "18px" }}>

          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Project Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mobile App Build" className={inputCls} style={{ padding: "12px 16px" }} />
          </div>

          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Description</label>
            <textarea rows={3} value={description} onChange={e => setDesc(e.target.value)} placeholder="What is this project about?" className={`${inputCls} resize-none`} style={{ padding: "12px 16px" }} />
          </div>

          {/* Status pill toggle */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Status</label>
            <div className="flex flex-wrap items-center" style={{ gap: "8px" }}>
              {PROJECT_STATUSES.map(s => {
                const cfg    = PROJECT_STATUS_CONFIG[s];
                const active = status === s;
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)} style={{
                    padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "700",
                    cursor: "pointer", border: `1.5px solid ${active ? cfg.color : "#f0f0f5"}`,
                    background: active ? cfg.bg : "white", color: active ? cfg.color : "#9ca3af", transition: "all 0.15s",
                  }}>{cfg.label}</button>
                );
              })}
            </div>
          </div>

          {/* Priority pill toggle */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Priority</label>
            <div className="flex items-center" style={{ gap: "8px" }}>
              {PRIORITIES.map(p => {
                const cfg    = PRIORITY_CONFIG[p];
                const active = priority === p;
                return (
                  <button key={p} type="button" onClick={() => setPriority(p)} style={{
                    padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "700",
                    cursor: "pointer", border: `1.5px solid ${active ? cfg.border : "#f0f0f5"}`,
                    background: active ? cfg.bg : "white", color: active ? cfg.color : "#9ca3af", transition: "all 0.15s",
                  }}>{cfg.label}</button>
                );
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
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "20px 24px", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" disabled={!name.trim()} onClick={handleSave}>Create Project</ModalButton>
        </div>
      </div>
    </div>
  );
}
