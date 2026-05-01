"use client";

import React from "react";
import { Calendar, MessageSquare, MoreVertical } from "lucide-react";
import { Task, Project, PRIORITY_CONFIG, TASK_STATUS_CONFIG, MOCK_TEAM } from "./types";

interface TaskCardProps {
  task:        Task;
  project?:    Project;
  onClick:     () => void;
  onMenuClick: (e: React.MouseEvent<HTMLButtonElement>, task: Task) => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(due: string) {
  return new Date(due) < new Date() ? true : false;
}

export function TaskCard({ task, project, onClick, onMenuClick }: TaskCardProps) {
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const overdue     = isOverdue(task.due_date) && task.status !== "completed";
  const assignees   = MOCK_TEAM.filter(m => task.assignee_ids.includes(m.id));
  const visibleAssignees = assignees.slice(0, 3);
  const overflow    = assignees.length - 3;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-[#f0f0f5] shadow-sm hover:shadow-md hover:border-(--accent-purple) transition-all cursor-pointer group flex flex-col"
      style={{ padding: "14px", gap: "10px" }}
    >
      {/* Top: project tag + menu */}
      <div className="flex items-center justify-between" style={{ gap: "8px" }}>
        {project ? (
          <span
            className="rounded-md text-[10px] font-bold truncate max-w-[140px]"
            style={{ padding: "3px 8px", background: `${TASK_STATUS_CONFIG[task.status].color}12`, color: TASK_STATUS_CONFIG[task.status].color }}
          >
            {project.name}
          </span>
        ) : <span />}
        <button
          className="w-6 h-6 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--accent-purple) hover:bg-[#f0f0f5] transition-all opacity-0 group-hover:opacity-100 shrink-0"
          onClick={e => { e.stopPropagation(); onMenuClick(e, task); }}
        >
          <MoreVertical size={13} />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-[13px] font-bold text-(--text-primary) leading-snug group-hover:text-(--accent-purple) transition-colors">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-[11px] text-[#9ca3af] leading-relaxed" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {task.description}
        </p>
      )}

      {/* Priority + due date */}
      <div className="flex items-center justify-between">
        <span
          className="rounded-md text-[10px] font-bold"
          style={{ padding: "3px 8px", background: priorityCfg.bg, color: priorityCfg.color }}
        >
          {priorityCfg.label}
        </span>
        <span
          className="flex items-center text-[11px] font-medium"
          style={{ gap: "4px", color: overdue ? "#ef4444" : "#9ca3af" }}
        >
          <Calendar size={11} />
          {formatDate(task.due_date)}
        </span>
      </div>

      {/* Footer: assignees + comment count */}
      <div className="flex items-center justify-between" style={{ borderTop: "1px solid #f0f0f5", paddingTop: "10px" }}>
        {/* Assignee avatar stack */}
        <div className="flex items-center">
          {visibleAssignees.length > 0 ? (
            <div className="flex" style={{ gap: "-4px" }}>
              {visibleAssignees.map((m, i) => (
                <div
                  key={m.id}
                  title={m.name}
                  className="rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white"
                  style={{ width: "24px", height: "24px", background: m.color, marginLeft: i > 0 ? "-6px" : "0", zIndex: visibleAssignees.length - i }}
                >
                  {m.initials}
                </div>
              ))}
              {overflow > 0 && (
                <div className="rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white" style={{ width: "24px", height: "24px", background: "#f0f0f5", color: "#9ca3af", marginLeft: "-6px" }}>
                  +{overflow}
                </div>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-[#9ca3af]">Unassigned</span>
          )}
        </div>

        {/* Comment count */}
        {(task.comment_count ?? 0) > 0 && (
          <span className="flex items-center text-[11px] font-medium text-[#9ca3af]" style={{ gap: "4px" }}>
            <MessageSquare size={11} />
            {task.comment_count}
          </span>
        )}
      </div>
    </div>
  );
}
