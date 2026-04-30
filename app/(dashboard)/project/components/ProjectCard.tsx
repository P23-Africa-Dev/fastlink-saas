"use client";

import React from "react";
import { Calendar, MoreVertical, CheckSquare, ArrowUpRight } from "lucide-react";
import { Project, Task, PROJECT_STATUS_CONFIG, PRIORITY_CONFIG } from "./types";

interface ProjectCardProps {
  project:    Project;
  tasks:      Task[];
  onOpen:     () => void;
  onMenuClick:(e: React.MouseEvent<HTMLButtonElement>, project: Project) => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ProjectCard({ project, tasks, onOpen, onMenuClick }: ProjectCardProps) {
  const statusCfg   = PROJECT_STATUS_CONFIG[project.status];
  const priorityCfg = PRIORITY_CONFIG[project.priority];

  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const doneTasks    = projectTasks.filter(t => t.status === "completed").length;
  const progress     = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

  return (
    <div
      className="bg-white rounded-2xl border border-[#f0f0f5] shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group relative overflow-hidden"
      style={{ borderLeft: `4px solid ${statusCfg.color}` }}
      onClick={onOpen}
    >
      {/* Top row */}
      <div className="flex items-start justify-between" style={{ padding: "20px 20px 0" }}>
        <span
          className="inline-flex items-center rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ padding: "3px 10px", background: priorityCfg.bg, color: priorityCfg.color }}
        >
          {priorityCfg.label}
        </span>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--accent-purple) hover:bg-[#f0f0f5] transition-all opacity-0 group-hover:opacity-100"
          onClick={e => { e.stopPropagation(); onMenuClick(e, project); }}
        >
          <MoreVertical size={15} />
        </button>
      </div>

      {/* Name + description */}
      <div style={{ padding: "12px 20px 0" }}>
        <div className="flex items-start gap-2">
          <h3 className="text-[16px] font-bold text-(--text-primary) leading-tight group-hover:text-(--accent-purple) transition-colors flex-1">
            {project.name}
          </h3>
          <ArrowUpRight size={14} className="text-[#9ca3af] group-hover:text-(--accent-purple) transition-colors shrink-0 mt-0.5" />
        </div>
        {project.description && (
          <p className="text-[12px] text-[#9ca3af] leading-relaxed" style={{ marginTop: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {project.description}
          </p>
        )}
      </div>

      {/* Status badge */}
      <div style={{ padding: "14px 20px 0" }}>
        <span
          className="inline-flex items-center rounded-full text-[11px] font-bold"
          style={{ padding: "4px 10px", gap: "5px", background: statusCfg.bg, color: statusCfg.color }}
        >
          <span className="rounded-full" style={{ width: "6px", height: "6px", background: statusCfg.color }} />
          {statusCfg.label}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "14px 20px 0" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "6px" }}>
          <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Progress</span>
          <span className="text-[12px] font-bold text-(--text-primary)">{progress}%</span>
        </div>
        <div className="w-full rounded-full bg-[#f0f0f5]" style={{ height: "6px" }}>
          <div
            className="rounded-full transition-all"
            style={{ height: "6px", width: `${progress}%`, background: statusCfg.color }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between border-t border-[#f0f0f5]"
        style={{ padding: "14px 20px", marginTop: "16px" }}
      >
        <span className="flex items-center text-[12px] font-medium text-[#9ca3af]" style={{ gap: "5px" }}>
          <Calendar size={12} />
          {formatDate(project.start_date)} → {formatDate(project.due_date)}
        </span>
        <span className="flex items-center text-[12px] font-bold text-(--text-primary)" style={{ gap: "5px" }}>
          <CheckSquare size={12} className="text-[#9ca3af]" />
          {doneTasks}/{projectTasks.length} tasks
        </span>
      </div>
    </div>
  );
}
