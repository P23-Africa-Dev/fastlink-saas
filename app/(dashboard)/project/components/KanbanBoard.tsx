"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Task, Project, TaskStatus, TASK_STATUS_CONFIG } from "./types";
import { TaskCard } from "./TaskCard";

interface KanbanBoardProps {
  tasks:           Task[];
  projects:        Project[];
  selectedProject: number | null;
  onTaskMove:      (taskId: number, newStatus: TaskStatus) => void;
  onTaskClick:     (task: Task) => void;
  onTaskMenuClick: (e: React.MouseEvent<HTMLButtonElement>, task: Task) => void;
  onAddTask:       (status: TaskStatus) => void;
}

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "review", "completed"];

function DroppableColumn({ status, children }: { status: TaskStatus; children: React.ReactNode }) {
  const cfg = TASK_STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className="flex-1 rounded-2xl border border-[#f0f0f5] flex flex-col overflow-y-auto"
      style={{
        background: isOver ? `${cfg.color}08` : "rgba(255,255,255,0.6)",
        padding: "12px",
        gap: "10px",
        minHeight: "120px",
        transition: "background 0.2s",
        borderColor: isOver ? cfg.color : "#f0f0f5",
      }}
    >
      {children}
    </div>
  );
}

function DraggableTaskCard({ task, project, onTaskClick, onMenuClick }: {
  task: Task; project?: Project;
  onTaskClick: () => void;
  onMenuClick: (e: React.MouseEvent<HTMLButtonElement>, task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id.toString(),
    data: { task },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined, opacity: isDragging ? 0.3 : 1 }}
      {...listeners} {...attributes}
    >
      <TaskCard task={task} project={project} onClick={onTaskClick} onMenuClick={onMenuClick} />
    </div>
  );
}

export function KanbanBoard({ tasks, projects, selectedProject, onTaskMove, onTaskClick, onTaskMenuClick, onAddTask }: KanbanBoardProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const visibleTasks = selectedProject
    ? tasks.filter(t => t.project_id === selectedProject)
    : tasks;

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (over && active.id !== over.id) {
      onTaskMove(parseInt(active.id.toString()), over.id as TaskStatus);
    }
  };

  const activeTask = activeDragId ? tasks.find(t => t.id.toString() === activeDragId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveDragId(e.active.id.toString())}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto overflow-y-hidden" style={{ paddingBottom: "16px" }}>
        <div className="flex items-start h-full" style={{ gap: "20px", width: "max-content", minWidth: "100%" }}>
          {COLUMNS.map(status => {
            const cfg          = TASK_STATUS_CONFIG[status];
            const columnTasks  = visibleTasks.filter(t => t.status === status);

            return (
              <div key={status} className="flex flex-col h-full shrink-0" style={{ width: "300px" }}>
                {/* Column header */}
                <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
                  <div className="flex items-center" style={{ gap: "8px" }}>
                    <span className="rounded-full" style={{ width: "10px", height: "10px", background: cfg.color }} />
                    <h3 className="text-[14px] font-bold text-(--text-primary)">{cfg.label}</h3>
                    <span className="rounded-full text-[11px] font-bold" style={{ padding: "1px 8px", background: "#f0f0f5", color: "#9ca3af" }}>
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => onAddTask(status)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--accent-purple) hover:bg-[#f0f0f5] transition-all"
                    title={`Add task to ${cfg.label}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Droppable column body */}
                <DroppableColumn status={status}>
                  {columnTasks.map(task => {
                    const project = projects.find(p => p.id === task.project_id);
                    return (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        project={project}
                        onTaskClick={() => onTaskClick(task)}
                        onMenuClick={onTaskMenuClick}
                      />
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <div
                      className="flex-1 flex items-center justify-center border-2 border-dashed border-[#f0f0f5] rounded-xl text-[12px] font-medium text-[#9ca3af]"
                      style={{ minHeight: "80px" }}
                    >
                      Drop tasks here
                    </div>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div style={{ width: "280px", opacity: 0.95 }}>
            <TaskCard task={activeTask} onClick={() => {}} onMenuClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
