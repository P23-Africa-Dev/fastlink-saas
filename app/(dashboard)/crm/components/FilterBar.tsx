"use client";

import React from "react";
import { Search, LayoutGrid, List, Settings2 } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface Drive { id: number; name: string; }
interface Country { id: number; name: string; }
interface State { id: number; name: string; }
interface Lga { id: number; name: string; }

export interface FilterState {
  driveId: number;
  countryId: number;
  stateId: number;
  lgaId: number;
  query: string;
  priority: string;
  assignedTo: string;
  perPage: number;
  page: number;
}

interface FilterBarProps {
  drives: Drive[];
  countries: Country[];
  states: State[];
  lgas: Lga[];
  filters: FilterState;
  totalLeads: number;
  viewMode: "kanban" | "list";
  onFiltersChange: (next: Partial<FilterState>) => void;
  onViewChange: (mode: "kanban" | "list") => void;
  onManagePipelines: () => void;
  onManageStatuses: () => void;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function FilterBar({
  drives, countries, states, lgas, filters, totalLeads, viewMode,
  onFiltersChange, onViewChange, onManagePipelines, onManageStatuses,
}: FilterBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalLeads / filters.perPage));

  const driveOptions = [{ value: "0", label: "All Pipelines" }, ...drives.map(d => ({ value: d.id.toString(), label: d.name }))];
  const priorityOptions = [
    { value: "", label: "All Priorities" },
    { value: "high", label: "High" },
    { value: "normal", label: "Normal" },
    { value: "low", label: "Low" },
  ];
  const assigneeOptions = [
    { value: "", label: "All Assignees" },
    { value: "1", label: "Me" },
  ];
  const countryOptions = [
    { value: "0", label: "All Countries" },
    ...countries.map((country) => ({ value: country.id.toString(), label: country.name })),
  ];
  const stateOptions = [
    { value: "0", label: filters.countryId ? "All States" : "Select country first" },
    ...states.map((state) => ({ value: state.id.toString(), label: state.name })),
  ];
  const lgaOptions = [
    { value: "0", label: filters.stateId ? "All LGAs" : "Select state first" },
    ...lgas.map((lga) => ({ value: lga.id.toString(), label: lga.name })),
  ];
  const perPageOptions = PER_PAGE_OPTIONS.map(n => ({ value: n.toString(), label: `${n} per page` }));

  return (
    <div className="flex flex-col" style={{ gap: "0" }}>
      {/* Main filter row */}
      <div
        className="border border-[#f0f0f5] shadow-sm rounded-2xl bg-white"
        style={{ padding: "14px 16px" }}
      >
        <div className="flex flex-col" style={{ gap: "10px" }}>

          <div className="flex flex-wrap items-stretch sm:items-center" style={{ gap: "10px" }}>
            {/* Pipeline selector + gear */}
            <div className="flex items-center w-full sm:w-auto" style={{ gap: "4px" }}>
              <div className="w-full sm:w-auto sm:min-w-[170px]">
                <CustomSelect
                  value={filters.driveId.toString()}
                  onChange={v => onFiltersChange({ driveId: Number(v), page: 1 })}
                  options={driveOptions}
                  searchPlaceholder="Search pipelines…"
                  fullWidth
                />
              </div>
              <button
                onClick={onManagePipelines}
                title="Manage Pipelines"
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-(--accent-purple) hover:border-(--accent-purple) transition-all"
              >
                <Settings2 size={14} />
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:flex-1 sm:min-w-[260px]">
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
            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <CustomSelect
                value={filters.priority}
                onChange={v => onFiltersChange({ priority: v, page: 1 })}
                options={priorityOptions}
                searchPlaceholder="Search priorities…"
                fullWidth
              />
            </div>

            {/* Assigned To filter */}
            <div className="w-full sm:w-auto sm:min-w-[170px]">
              <CustomSelect
                value={filters.assignedTo}
                onChange={v => onFiltersChange({ assignedTo: v, page: 1 })}
                options={assigneeOptions}
                searchPlaceholder="Search assignees…"
                fullWidth
              />
            </div>
          </div>

          <div className="flex flex-wrap items-stretch sm:items-center justify-between" style={{ gap: "10px" }}>
            <div className="flex flex-wrap items-stretch sm:items-center w-full xl:w-auto" style={{ gap: "10px" }}>
              {/* Location filters */}
              <div className="w-full sm:w-auto sm:min-w-[160px]">
                <CustomSelect
                  value={filters.countryId.toString()}
                  onChange={v => onFiltersChange({ countryId: Number(v), stateId: 0, lgaId: 0, page: 1 })}
                  options={countryOptions}
                  searchPlaceholder="Search countries…"
                  fullWidth
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[160px]">
                <CustomSelect
                  value={filters.stateId.toString()}
                  onChange={v => onFiltersChange({ stateId: Number(v), lgaId: 0, page: 1 })}
                  options={stateOptions}
                  searchPlaceholder="Search states…"
                  fullWidth
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[160px]">
                <CustomSelect
                  value={filters.lgaId.toString()}
                  onChange={v => onFiltersChange({ lgaId: Number(v), page: 1 })}
                  options={lgaOptions}
                  searchPlaceholder="Search LGAs…"
                  fullWidth
                />
              </div>

              {/* Per page */}
              <div className="w-full sm:w-auto sm:min-w-[130px]">
                <CustomSelect
                  value={filters.perPage.toString()}
                  onChange={v => onFiltersChange({ perPage: Number(v), page: 1 })}
                  options={perPageOptions}
                  searchPlaceholder="Search…"
                  fullWidth
                />
              </div>
            </div>

            {/* Right side: manage statuses + view toggle */}
            <div className="flex items-center w-full sm:w-auto justify-end" style={{ gap: "8px" }}>
              {viewMode === "kanban" && (
                <button
                  onClick={onManageStatuses}
                  title="Manage Columns"
                  className="flex items-center gap-1.5 rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[12px] font-bold text-(--accent-purple) hover:border-(--accent-purple) transition-all"
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
        </div>
      </div>

      {/* Pagination row — only show in list mode or when totalPages > 1 */}
      {(viewMode === "list" && totalPages > 1) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ padding: "12px 4px 0", gap: "10px" }}>
          <span className="text-[12px] font-medium text-[#9ca3af]">
            Showing {Math.min((filters.page - 1) * filters.perPage + 1, totalLeads)}–{Math.min(filters.page * filters.perPage, totalLeads)} of {totalLeads} leads
          </span>
          <div className="flex flex-wrap items-center" style={{ gap: "4px" }}>
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
