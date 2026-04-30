"use client";

import React from "react";
import { Search, LayoutGrid, List, Settings2 } from "lucide-react";

interface Drive  { id: number; name: string; }

export interface FilterState {
  driveId:    number;
  query:      string;
  priority:   string;
  assignedTo: string;
  perPage:    number;
  page:       number;
}

interface FilterBarProps {
  drives:        Drive[];
  filters:       FilterState;
  totalLeads:    number;
  viewMode:      "kanban" | "list";
  onFiltersChange: (next: Partial<FilterState>) => void;
  onViewChange:  (mode: "kanban" | "list") => void;
  onManagePipelines: () => void;
  onManageStatuses:  () => void;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const selectCls = "rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] font-bold text-(--text-primary) outline-none focus:border-(--accent-purple) transition-colors cursor-pointer";

export function FilterBar({
  drives, filters, totalLeads, viewMode,
  onFiltersChange, onViewChange, onManagePipelines, onManageStatuses,
}: FilterBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalLeads / filters.perPage));

  return (
    <div className="flex flex-col" style={{ gap: "0" }}>
      {/* Main filter row */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border border-[#f0f0f5] shadow-sm rounded-2xl bg-white"
        style={{ gap: "12px", padding: "14px 16px" }}
      >
        <div className="flex flex-wrap items-center" style={{ gap: "10px" }}>

          {/* Pipeline selector + gear */}
          <div className="flex items-center" style={{ gap: "4px" }}>
            <select
              value={filters.driveId}
              onChange={e => onFiltersChange({ driveId: Number(e.target.value), page: 1 })}
              className={selectCls}
              style={{ padding: "9px 14px" }}
            >
              {drives.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button
              onClick={onManagePipelines}
              title="Manage Pipelines"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-[#9ca3af] border border-[#f0f0f5] bg-[#f8f8fc] hover:text-(--accent-purple) hover:border-(--accent-purple) transition-all"
            >
              <Settings2 size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute text-[#9ca3af]" style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search leads..."
              value={filters.query}
              onChange={e => onFiltersChange({ query: e.target.value, page: 1 })}
              className="w-full rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] font-medium outline-none focus:border-(--accent-purple) transition-colors placeholder:text-[#9ca3af]"
              style={{ padding: "9px 14px 9px 36px" }}
            />
          </div>

          {/* Priority filter */}
          <select
            value={filters.priority}
            onChange={e => onFiltersChange({ priority: e.target.value, page: 1 })}
            className={selectCls}
            style={{ padding: "9px 14px" }}
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Assigned To filter */}
          <select
            value={filters.assignedTo}
            onChange={e => onFiltersChange({ assignedTo: e.target.value, page: 1 })}
            className={selectCls}
            style={{ padding: "9px 14px" }}
          >
            <option value="">All Assignees</option>
            <option value="1">Me</option>
          </select>

          {/* Per page */}
          <select
            value={filters.perPage}
            onChange={e => onFiltersChange({ perPage: Number(e.target.value), page: 1 })}
            className={selectCls}
            style={{ padding: "9px 14px" }}
          >
            {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n} per page</option>)}
          </select>
        </div>

        {/* Right side: manage statuses + view toggle */}
        <div className="flex items-center self-start sm:self-auto" style={{ gap: "8px" }}>
          {viewMode === "kanban" && (
            <button
              onClick={onManageStatuses}
              title="Manage Columns"
              className="flex items-center gap-1.5 rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[12px] font-bold text-[#9ca3af] hover:text-(--accent-purple) hover:border-(--accent-purple) transition-all"
              style={{ padding: "9px 13px" }}
            >
              <Settings2 size={14} />
              Columns
            </button>
          )}

          <div className="flex items-center bg-[#f8f8fc] rounded-xl border border-[#f0f0f5]" style={{ gap: "4px", padding: "4px" }}>
            <button
              onClick={() => onViewChange("kanban")}
              className={`transition-all rounded-lg ${viewMode === "kanban" ? "shadow-sm text-(--accent-purple)" : "text-[#9ca3af] hover:text-(--text-primary)"}`}
              style={{ padding: "7px", background: viewMode === "kanban" ? "white" : "transparent" }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => onViewChange("list")}
              className={`transition-all rounded-lg ${viewMode === "list" ? "shadow-sm text-(--accent-purple)" : "text-[#9ca3af] hover:text-(--text-primary)"}`}
              style={{ padding: "7px", background: viewMode === "list" ? "white" : "transparent" }}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Pagination row — only show in list mode or when totalPages > 1 */}
      {(viewMode === "list" && totalPages > 1) && (
        <div className="flex items-center justify-between" style={{ padding: "12px 4px 0" }}>
          <span className="text-[12px] font-medium text-[#9ca3af]">
            Showing {Math.min((filters.page - 1) * filters.perPage + 1, totalLeads)}–{Math.min(filters.page * filters.perPage, totalLeads)} of {totalLeads} leads
          </span>
          <div className="flex items-center" style={{ gap: "4px" }}>
            <button
              disabled={filters.page <= 1}
              onClick={() => onFiltersChange({ page: filters.page - 1 })}
              className="rounded-lg border border-[#f0f0f5] text-[12px] font-bold text-(--text-primary) bg-white hover:border-(--accent-purple) hover:text-(--accent-purple) disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ padding: "6px 12px" }}
            >
              ← Prev
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              const isActive = p === filters.page;
              return (
                <button
                  key={p}
                  onClick={() => onFiltersChange({ page: p })}
                  className="rounded-lg text-[12px] font-bold transition-all"
                  style={{
                    padding: "6px 10px",
                    background: isActive ? "#33084E" : "white",
                    color: isActive ? "white" : "#1a1a2e",
                    border: isActive ? "1px solid #33084E" : "1px solid #f0f0f5",
                  }}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={filters.page >= totalPages}
              onClick={() => onFiltersChange({ page: filters.page + 1 })}
              className="rounded-lg border border-[#f0f0f5] text-[12px] font-bold text-(--text-primary) bg-white hover:border-(--accent-purple) hover:text-(--accent-purple) disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ padding: "6px 12px" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
