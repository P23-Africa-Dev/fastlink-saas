"use client";

import React, { useState } from "react";
import { Phone, Mail, Calendar, FileText, CheckCircle2, Clock, Plus } from "lucide-react";

export interface Activity {
  id: number;
  type: "call" | "email" | "meeting" | "note";
  title: string;
  description?: string;
  scheduled_at: string;
  is_completed: boolean;
}

interface ActivityFeedProps {
  activities: Activity[];
  onLog: () => void;
  onEdit: (activity: Activity) => void;
}

const TYPE_CONFIG: Record<Activity["type"], { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  call:    { icon: <Phone    size={13} />, color: "#33084E", bg: "#33084E15", label: "Call"    },
  email:   { icon: <Mail     size={13} />, color: "#AF580B", bg: "#AF580B15", label: "Email"   },
  meeting: { icon: <Calendar size={13} />, color: "#074616", bg: "#07461615", label: "Meeting" },
  note:    { icon: <FileText size={13} />, color: "#6b7280", bg: "#f0f0f5",   label: "Note"    },
};

function formatDate(raw: string) {
  try {
    return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return raw;
  }
}

export function ActivityFeed({ activities, onLog, onEdit }: ActivityFeedProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex flex-col" style={{ gap: "0" }}>
      {/* Section header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
        <h3 className="text-[13px] font-bold text-(--text-primary) uppercase tracking-wider">Activity</h3>
        <button
          onClick={onLog}
          className="inline-flex items-center gap-1.5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90"
          style={{ padding: "6px 12px", background: "#33084E", gap: "6px" }}
        >
          <Plus size={13} />
          Log Activity
        </button>
      </div>

      {activities.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[#f0f0f5]" style={{ padding: "40px 24px", gap: "8px" }}>
          <div className="w-10 h-10 rounded-full bg-[#f0f0f5] flex items-center justify-center text-[#9ca3af]">
            <Calendar size={18} />
          </div>
          <p className="text-[13px] font-bold text-(--text-primary)">No activities yet</p>
          <p className="text-[12px] text-[#9ca3af]">Log a call, email, or meeting to get started.</p>
        </div>
      )}

      {/* Timeline */}
      <div className="relative flex flex-col" style={{ gap: "0" }}>
        {activities.length > 0 && (
          <div
            className="absolute"
            style={{ left: "15px", top: "8px", bottom: "8px", width: "1.5px", background: "#f0f0f5", zIndex: 0 }}
          />
        )}

        {activities.map((act, idx) => {
          const cfg = TYPE_CONFIG[act.type];
          const isHovered = hovered === act.id;
          return (
            <div
              key={act.id}
              className="relative flex cursor-pointer"
              style={{ gap: "12px", paddingBottom: idx < activities.length - 1 ? "20px" : "0", zIndex: 1 }}
              onClick={() => onEdit(act)}
              onMouseEnter={() => setHovered(act.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Dot */}
              <div
                className="shrink-0 rounded-full flex items-center justify-center"
                style={{ width: "30px", height: "30px", background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}30` }}
              >
                {cfg.icon}
              </div>

              {/* Card */}
              <div
                className="flex-1 rounded-xl border transition-all"
                style={{
                  padding: "12px 14px",
                  background: isHovered ? "#f8f8fc" : "white",
                  borderColor: isHovered ? "#33084E30" : "#f0f0f5",
                  gap: "4px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="flex items-start justify-between" style={{ gap: "8px" }}>
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    <span
                      className="rounded-md text-[10px] font-bold uppercase tracking-wider"
                      style={{ padding: "2px 7px", background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-[13px] font-bold text-(--text-primary)">{act.title}</span>
                  </div>
                  {act.is_completed ? (
                    <CheckCircle2 size={14} className="shrink-0 text-green-500" style={{ marginTop: "2px" }} />
                  ) : (
                    <Clock size={14} className="shrink-0 text-[#9ca3af]" style={{ marginTop: "2px" }} />
                  )}
                </div>
                {act.description && (
                  <p className="text-[12px] text-[#9ca3af]">{act.description}</p>
                )}
                <p className="text-[11px] font-medium text-[#9ca3af]">{formatDate(act.scheduled_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
