"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, RotateCcw, Clock, FileText } from "lucide-react";
import { AttendanceLog, STATUS_CONFIG, MOCK_TEAM } from "./types";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface LogListViewProps {
  logs: AttendanceLog[];
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", weekday: "short" });
}

const inputCls = "rounded-xl border border-[#f0f0f5] bg-white text-[12px] font-medium outline-none text-(--text-primary) focus:border-[#33084E] transition-colors placeholder:text-[#9ca3af]";

export function LogListView({ logs }: LogListViewProps) {
  const [from,      setFrom]      = useState("");
  const [to,        setTo]        = useState("");
  const [userId,    setUserId]    = useState<number | "all">("all");
  const [statusF,   setStatusF]   = useState<string>("all");
  const [search,    setSearch]    = useState("");

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (from   && l.date < from)                         return false;
      if (to     && l.date > to)                           return false;
      if (userId !== "all" && l.user_id !== userId)        return false;
      if (statusF !== "all" && l.status !== statusF)       return false;
      if (search && !l.user_name.toLowerCase().includes(search.toLowerCase()) &&
                    !l.date.includes(search)) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, from, to, userId, statusF, search]);

  const reset = () => { setFrom(""); setTo(""); setUserId("all"); setStatusF("all"); setSearch(""); };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#f0f0f5] shadow-sm overflow-hidden flex-1">

      {/* Filter bar */}
      <div className="border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "14px 20px" }}>
        <div className="flex flex-wrap items-center" style={{ gap: "10px" }}>

          {/* Search */}
          <div className="flex items-center rounded-xl border border-[#f0f0f5] bg-white" style={{ gap: "8px", padding: "7px 12px", minWidth: "180px" }}>
            <Search size={13} className="text-[#9ca3af] shrink-0" />
            <input
              type="text"
              placeholder="Search name or date…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-[12px] font-medium outline-none bg-transparent placeholder:text-[#9ca3af] text-(--text-primary)"
              style={{ minWidth: "120px" }}
            />
          </div>

          {/* Date range */}
          <div className="flex items-center" style={{ gap: "6px" }}>
            <span className="text-[12px] font-bold text-[#9ca3af]">From</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} style={{ padding: "7px 10px" }} />
            <span className="text-[12px] font-bold text-[#9ca3af]">To</span>
            <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className={inputCls} style={{ padding: "7px 10px" }} />
          </div>

          {/* User filter */}
          <CustomSelect
            value={userId === "all" ? "all" : userId.toString()}
            onChange={v => setUserId(v === "all" ? "all" : Number(v))}
            options={[
              { value: "all", label: "All Members" },
              ...MOCK_TEAM.map(m => ({ value: m.id.toString(), label: m.name })),
            ]}
            searchPlaceholder="Search members…"
          />

          {/* Status filter */}
          <CustomSelect
            value={statusF}
            onChange={setStatusF}
            options={[
              { value: "all",      label: "All Statuses" },
              { value: "present",  label: "Present" },
              { value: "absent",   label: "Absent" },
              { value: "late",     label: "Late" },
              { value: "half_day", label: "Half Day" },
            ]}
            searchPlaceholder="Search statuses…"
          />

          {/* Reset */}
          <button
            onClick={reset}
            className="inline-flex items-center rounded-xl border border-[#f0f0f5] bg-white text-[12px] font-bold text-[#9ca3af] hover:text-(--text-primary) hover:border-[#d1d5db] transition-all"
            style={{ padding: "7px 12px", gap: "5px" }}
          >
            <RotateCcw size={12} /> Reset
          </button>

          {/* Result count */}
          <span className="ml-auto text-[12px] font-medium text-[#9ca3af]">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: "700px" }}>
          <thead>
            <tr className="bg-[#f8f8fc] border-b border-[#f0f0f5]">
              {["Date", "Member", "Status", "Clock In", "Clock Out", "Hours", "Note"].map(h => (
                <th key={h} className="text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider" style={{ padding: "10px 16px" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => {
              const cfg = STATUS_CONFIG[log.status];
              return (
                <tr
                  key={log.id}
                  className="border-b border-[#f0f0f5] hover:bg-[#f8f8fc] transition-colors"
                  style={{ background: i % 2 === 0 ? "white" : "#fdfcff" }}
                >
                  {/* Date */}
                  <td style={{ padding: "12px 16px" }}>
                    <span className="text-[12px] font-semibold text-(--text-primary)">{fmtDate(log.date)}</span>
                  </td>

                  {/* Member */}
                  <td style={{ padding: "12px 16px" }}>
                    <div className="flex items-center" style={{ gap: "8px" }}>
                      {(() => {
                        const m = MOCK_TEAM.find(t => t.id === log.user_id);
                        return (
                          <>
                            <div
                              className="rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ width: "26px", height: "26px", background: m?.color ?? "#9ca3af" }}
                            >
                              {log.user_initials}
                            </div>
                            <span className="text-[12px] font-semibold text-(--text-primary)">{log.user_name}</span>
                          </>
                        );
                      })()}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      className="inline-flex items-center rounded-full text-[11px] font-bold"
                      style={{ padding: "3px 10px", gap: "5px", background: cfg.bg, color: cfg.color }}
                    >
                      <span className="rounded-full" style={{ width: "5px", height: "5px", background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Sign In */}
                  <td style={{ padding: "12px 16px" }}>
                    <div className="flex items-center" style={{ gap: "5px" }}>
                      <Clock size={11} className="text-[#9ca3af]" />
                      <span className="text-[12px] font-semibold text-(--text-primary)">{fmt(log.sign_in)}</span>
                    </div>
                  </td>

                  {/* Sign Out */}
                  <td style={{ padding: "12px 16px" }}>
                    <div className="flex items-center" style={{ gap: "5px" }}>
                      <Clock size={11} className="text-[#9ca3af]" />
                      <span className="text-[12px] font-semibold text-(--text-primary)">{fmt(log.sign_out)}</span>
                    </div>
                  </td>

                  {/* Hours */}
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span className="text-[13px] font-bold" style={{ color: log.hours != null ? "#33084E" : "#9ca3af" }}>
                      {log.hours != null ? `${log.hours}h` : "—"}
                    </span>
                  </td>

                  {/* Note */}
                  <td style={{ padding: "12px 16px", maxWidth: "180px" }}>
                    {log.note ? (
                      <div className="flex items-center" style={{ gap: "5px" }}>
                        <FileText size={11} className="text-[#9ca3af] shrink-0" />
                        <span className="text-[12px] text-[#6b7280] truncate" title={log.note}>{log.note}</span>
                      </div>
                    ) : (
                      <span className="text-[#d1d5db] text-[12px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center" style={{ padding: "60px 24px", gap: "12px" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <Filter size={20} className="text-[#9ca3af]" />
            </div>
            <p className="text-[14px] font-bold text-(--text-primary)">No records found</p>
            <p className="text-[12px] text-[#9ca3af]">Try adjusting your filters or date range.</p>
          </div>
        )}
      </div>
    </div>
  );
}
