"use client";

import React, { useState } from "react";
import { X, Phone, Mail, Calendar, FileText } from "lucide-react";
import { ModalButton } from "./ModalButton";
import { Activity } from "./ActivityFeed";

interface LogActivityModalProps {
  leadName: string;
  onClose:  () => void;
  onSave:   (data: Omit<Activity, "id">) => void;
}

type ActivityType = Activity["type"];

const TYPES: { type: ActivityType; label: string; icon: React.ReactNode }[] = [
  { type: "call",    label: "Call",    icon: <Phone    size={15} /> },
  { type: "email",   label: "Email",   icon: <Mail     size={15} /> },
  { type: "meeting", label: "Meeting", icon: <Calendar size={15} /> },
  { type: "note",    label: "Note",    icon: <FileText size={15} /> },
];

const TYPE_COLORS: Record<ActivityType, { color: string; bg: string; border: string }> = {
  call:    { color: "#33084E", bg: "#33084E15", border: "#33084E40" },
  email:   { color: "#AF580B", bg: "#AF580B15", border: "#AF580B40" },
  meeting: { color: "#074616", bg: "#07461615", border: "#07461640" },
  note:    { color: "#6b7280", bg: "#f0f0f5",   border: "#d1d5db"   },
};

const inputCls    = "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-(--accent-purple) transition-colors";
const labelCls    = "text-[13px] font-bold text-(--text-primary)";
const textareaCls = `${inputCls} resize-none`;

export function LogActivityModal({ leadName, onClose, onSave }: LogActivityModalProps) {
  const [type, setType]             = useState<ActivityType>("call");
  const [title, setTitle]           = useState("");
  const [description, setDesc]      = useState("");
  const [scheduledAt, setScheduled] = useState("");
  const [completed, setCompleted]   = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ type, title: title.trim(), description: description.trim() || undefined, scheduled_at: scheduledAt, is_completed: completed });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]" style={{ padding: "20px 24px" }}>
          <div>
            <h2 className="text-lg font-bold text-(--text-primary)">Log Activity</h2>
            <p className="text-[12px] text-[#9ca3af]" style={{ marginTop: "2px" }}>{leadName}</p>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-(--text-primary) transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col" style={{ padding: "24px", gap: "20px" }}>

          {/* Type selector */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Activity Type</label>
            <div className="grid grid-cols-4" style={{ gap: "8px" }}>
              {TYPES.map(t => {
                const cfg    = TYPE_COLORS[t.type];
                const active = type === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setType(t.type)}
                    className="flex flex-col items-center rounded-xl border transition-all"
                    style={{
                      padding: "12px 8px", gap: "6px",
                      border: `1.5px solid ${active ? cfg.border : "#f0f0f5"}`,
                      background: active ? cfg.bg : "white",
                      color: active ? cfg.color : "#9ca3af",
                      cursor: "pointer",
                    }}
                  >
                    {t.icon}
                    <span style={{ fontSize: "11px", fontWeight: "700" }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Discovery Call"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputCls}
              style={{ padding: "12px 16px" }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Description</label>
            <textarea
              rows={3}
              placeholder="What was discussed or planned..."
              value={description}
              onChange={e => setDesc(e.target.value)}
              className={textareaCls}
              style={{ padding: "12px 16px" }}
            />
          </div>

          {/* Scheduled at */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Date &amp; Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduled(e.target.value)}
              className={inputCls}
              style={{ padding: "12px 16px" }}
            />
          </div>

          {/* Completed toggle */}
          <div
            className="flex items-center justify-between rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] cursor-pointer"
            style={{ padding: "14px 16px" }}
            onClick={() => setCompleted(c => !c)}
          >
            <span className="text-[13px] font-bold text-(--text-primary)">Mark as completed</span>
            <div
              className="rounded-full transition-all"
              style={{
                width: "40px", height: "22px",
                background: completed ? "#33084E" : "#d1d5db",
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div style={{
                position: "absolute",
                top: "3px",
                left: completed ? "21px" : "3px",
                width: "16px", height: "16px",
                borderRadius: "50%",
                background: "white",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]" style={{ padding: "20px 24px", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSave} disabled={!title.trim()}>Log Activity</ModalButton>
        </div>
      </div>
    </div>
  );
}
