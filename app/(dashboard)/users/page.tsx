"use client";

import React, { useState, useMemo } from "react";
import { Plus, ListFilter, CalendarDays, Users, Clock, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

import { RequestCard }           from "./components/RequestCard";
import { RequestDetailDrawer }   from "./components/RequestDetailDrawer";
import { NewLeaveRequestModal }  from "./components/NewLeaveRequestModal";
import { DecisionModal }         from "./components/DecisionModal";
import { ModifyModal }           from "./components/ModifyModal";
import { RespondModal }          from "./components/RespondModal";
import { LeaveCalendar }         from "./components/LeaveCalendar";

import {
  LeaveRequest, LeaveStatus, LeaveType,
  STATUS_CONFIG, TYPE_CONFIG, LEAVE_TYPES, SUPERVISORS,
  MOCK_REQUESTS, countDays,
} from "./components/types";

// ── Helpers ────────────────────────────────────────────────────────────────────

const MY_USER_ID   = 1;  // logged-in user id (Alex Morgan)
const IS_ADMIN     = true; // toggle to see admin vs staff view

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function prevMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function nextMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type View        = "my" | "team" | "calendar";
type DecideMode  = "approve" | "reject";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeaveRequestsPage() {
  const [requests,  setRequests]  = useState<LeaveRequest[]>(MOCK_REQUESTS);
  const [view,      setView]      = useState<View>("my");
  const [month,     setMonth]     = useState(currentMonth());

  // Filters
  const [statusF,   setStatusF]   = useState<LeaveStatus | "all">("all");
  const [typeF,     setTypeF]     = useState<LeaveType   | "all">("all");
  const [fromF,     setFromF]     = useState("");
  const [toF,       setToF]       = useState("");
  const [perPage,   setPerPage]   = useState(6);
  const [page,      setPage]      = useState(1);

  // Modal / drawer state
  const [selected,    setSelected]    = useState<LeaveRequest | null>(null);
  const [showNew,     setShowNew]     = useState(false);
  const [decideMode,  setDecideMode]  = useState<DecideMode | null>(null);
  const [showModify,  setShowModify]  = useState(false);
  const [respondMode, setRespondMode] = useState<boolean | null>(null); // true=accept, false=decline

  // ── Filtered + paginated list ──────────────────────────────────────────────
  const source = view === "my"
    ? requests.filter(r => r.user_id === MY_USER_ID)
    : requests;

  const filtered = useMemo(() => {
    return source.filter(r => {
      if (statusF !== "all" && r.status !== statusF) return false;
      if (typeF   !== "all" && r.type   !== typeF)   return false;
      if (fromF && r.start_date < fromF) return false;
      if (toF   && r.end_date   > toF)   return false;
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [source, statusF, typeF, fromF, toF]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  const resetFilters = () => { setStatusF("all"); setTypeF("all"); setFromF(""); setToF(""); setPage(1); };

  // ── Summary counts ────────────────────────────────────────────────────────
  const myReqs      = requests.filter(r => r.user_id === MY_USER_ID);
  const pendingMine = myReqs.filter(r => r.status === "pending").length;
  const modifiedMine= myReqs.filter(r => r.status === "modified").length;
  const teamPending = requests.filter(r => r.status === "pending").length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openDecide  = (r: LeaveRequest, mode: DecideMode) => { setSelected(r); setDecideMode(mode); };
  const openModify  = (r: LeaveRequest) => { setSelected(r); setShowModify(true); };
  const openRespond = (r: LeaveRequest, accept: boolean) => { setSelected(r); setRespondMode(accept); };

  const handleCreate = (data: { type: LeaveType; reason: string; start_date: string; end_date: string; supervisor_id: number }) => {
    const sup = SUPERVISORS.find(s => s.id === data.supervisor_id)!;
    const newReq: LeaveRequest = {
      id:                   Date.now(),
      user_id:              MY_USER_ID,
      user_name:            "Alex Morgan",
      user_initials:        "AM",
      user_color:           "#33084E",
      type:                 data.type,
      reason:               data.reason,
      start_date:           data.start_date,
      end_date:             data.end_date,
      supervisor_id:        data.supervisor_id,
      supervisor_name:      sup.name,
      supervisor_initials:  sup.initials,
      status:               "pending",
      decision_note:        null,
      supervisor_note:      null,
      modified_start_date:  null,
      modified_end_date:    null,
      sender_response_note: null,
      created_at:           new Date().toISOString(),
      days:                 countDays(data.start_date, data.end_date),
    };
    setRequests(prev => [newReq, ...prev]);
    setShowNew(false);
  };

  const handleDecision = (note: string) => {
    if (!selected || !decideMode) return;
    setRequests(prev => prev.map(r =>
      r.id === selected.id
        ? { ...r, status: decideMode === "approve" ? "approved" : "rejected", decision_note: note || null }
        : r
    ));
    setSelected(null); setDecideMode(null);
  };

  const handleModify = (data: { supervisor_note: string; modified_start_date: string; modified_end_date: string }) => {
    if (!selected) return;
    setRequests(prev => prev.map(r =>
      r.id === selected.id
        ? { ...r, status: "modified", supervisor_note: data.supervisor_note, modified_start_date: data.modified_start_date, modified_end_date: data.modified_end_date }
        : r
    ));
    setSelected(null); setShowModify(false);
  };

  const handleRespond = (note: string) => {
    if (!selected || respondMode === null) return;
    setRequests(prev => prev.map(r =>
      r.id === selected.id
        ? {
            ...r,
            status: respondMode ? "approved" : "rejected",
            sender_response_note: note || null,
            ...(respondMode && r.modified_start_date
              ? { start_date: r.modified_start_date, end_date: r.modified_end_date!, days: countDays(r.modified_start_date, r.modified_end_date!) }
              : {}),
          }
        : r
    ));
    setSelected(null); setRespondMode(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full bg-[#f8f8fc] overflow-hidden" style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "20px" }}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between shrink-0" style={{ gap: "12px" }}>
        <div className="flex flex-col" style={{ gap: "2px" }}>
          <h1 className="text-[22px] font-bold text-(--text-primary)">Leave Requests</h1>
          <p className="text-[13px] text-[#9ca3af]">Manage, track, and approve team leave requests.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
          style={{ padding: "10px 18px", gap: "7px", background: "#33084E" }}
        >
          <Plus size={15} /> New Request
        </button>
      </div>

      {/* ── Summary stat strip ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap shrink-0" style={{ gap: "10px" }}>
        {[
          { label: "My Requests",    value: myReqs.length,    icon: <ListFilter size={15} />, bg: "#f3e8ff", color: "#33084E", iconBg: "#ede9fe" },
          { label: "Awaiting My OK", value: modifiedMine,     icon: <Clock      size={15} />, bg: "#dbeafe", color: "#1d4ed8", iconBg: "#eff6ff" },
          { label: "My Pending",     value: pendingMine,      icon: <Clock      size={15} />, bg: "#fef3c7", color: "#AF580B", iconBg: "#fef9c3" },
          { label: "Team Pending",   value: teamPending,      icon: <Users      size={15} />, bg: "#dcfce7", color: "#074616", iconBg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} className="flex items-center bg-white rounded-2xl border border-[#f0f0f5]" style={{ padding: "12px 18px", gap: "12px", flex: "1 1 150px" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="flex flex-col" style={{ gap: "1px" }}>
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">{s.label}</span>
              <span className="text-[20px] font-bold leading-none" style={{ color: s.color }}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── View tabs + filters ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between shrink-0" style={{ gap: "10px" }}>

        {/* Tabs */}
        <div className="flex items-center rounded-xl border border-[#f0f0f5] bg-white overflow-hidden" style={{ padding: "4px" }}>
          {([
            { key: "my",       icon: <ListFilter size={13} />, label: "My Requests" },
            { key: "team",     icon: <Users      size={13} />, label: "Team Requests" },
            { key: "calendar", icon: <CalendarDays size={13} />, label: "Calendar" },
          ] as { key: View; icon: React.ReactNode; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setView(tab.key); setPage(1); }}
              className="inline-flex items-center rounded-lg text-[12px] font-bold transition-all"
              style={{
                padding: "7px 14px", gap: "6px",
                background: view === tab.key ? "#33084E" : "transparent",
                color:      view === tab.key ? "white"   : "#9ca3af",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Filters — hidden on calendar */}
        {view !== "calendar" && (
          <div className="flex flex-wrap items-center" style={{ gap: "8px" }}>
            <CustomSelect
              value={statusF}
              onChange={v => { setStatusF(v as any); setPage(1); }}
              options={[
                { value: "all", label: "All Statuses" },
                ...(Object.keys(STATUS_CONFIG) as LeaveStatus[]).map(s => ({ value: s, label: STATUS_CONFIG[s].label })),
              ]}
              searchPlaceholder="Search statuses…"
            />

            <CustomSelect
              value={typeF}
              onChange={v => { setTypeF(v as any); setPage(1); }}
              options={[
                { value: "all", label: "All Types" },
                ...LEAVE_TYPES.map(t => ({ value: t, label: TYPE_CONFIG[t].label })),
              ]}
              searchPlaceholder="Search types…"
            />

            <input type="date" value={fromF} onChange={e => { setFromF(e.target.value); setPage(1); }} className={inputCls} style={{ padding: "7px 10px" }} placeholder="From" />
            <input type="date" value={toF}   onChange={e => { setToF(e.target.value);   setPage(1); }} className={inputCls} style={{ padding: "7px 10px" }} placeholder="To" />

            <button onClick={resetFilters} className="inline-flex items-center rounded-xl border border-[#f0f0f5] bg-white text-[12px] font-bold text-[#9ca3af] hover:text-(--text-primary) transition-all" style={{ padding: "7px 12px", gap: "5px" }}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: "0", gap: "14px" }}>

        {/* Calendar view */}
        {view === "calendar" && (
          <LeaveCalendar
            month={month}
            requests={requests}
            onPrev={() => setMonth(prevMonth(month))}
            onNext={() => setMonth(nextMonth(month))}
            onRequestClick={r => setSelected(r)}
          />
        )}

        {/* My / Team list view */}
        {view !== "calendar" && (
          <>
            {/* Cards grid */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: "0" }}>
              {paginated.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center" style={{ gap: "12px" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#f3f4f6" }}>
                    <ListFilter size={24} className="text-[#9ca3af]" />
                  </div>
                  <p className="text-[15px] font-bold text-(--text-primary)">No requests found</p>
                  <p className="text-[13px] text-[#9ca3af]">Try adjusting your filters, or submit a new request.</p>
                  <button onClick={() => setShowNew(true)} className="inline-flex items-center rounded-xl text-[13px] font-bold text-white" style={{ padding: "9px 18px", gap: "6px", background: "#33084E" }}>
                    <Plus size={13} /> New Request
                  </button>
                </div>
              ) : (
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
                  {paginated.map(r => (
                    <RequestCard
                      key={r.id}
                      request={r}
                      isAdmin={view === "team" && IS_ADMIN}
                      onClick={() => setSelected(r)}
                      onApprove={() => openDecide(r, "approve")}
                      onReject={() => openDecide(r, "reject")}
                      onModify={() => openModify(r)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination bar */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between bg-white rounded-2xl border border-[#f0f0f5] shrink-0" style={{ padding: "10px 18px" }}>
                <div className="flex items-center" style={{ gap: "8px" }}>
                  <span className="text-[12px] text-[#9ca3af]">Rows:</span>
                  <CustomSelect
                    value={perPage.toString()}
                    onChange={v => { setPerPage(Number(v)); setPage(1); }}
                    options={[6, 12, 24].map(n => ({ value: n.toString(), label: n.toString() }))}
                    searchPlaceholder="Search…"
                  />
                  <span className="text-[12px] text-[#9ca3af]">
                    {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                  </span>
                </div>

                <div className="flex items-center" style={{ gap: "4px" }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] text-[#9ca3af] hover:text-(--text-primary) disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all"
                      style={{
                        background: p === page ? "#33084E" : "white",
                        color:      p === page ? "white"   : "#6b7280",
                        border:     `1px solid ${p === page ? "#33084E" : "#f0f0f5"}`,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] text-[#9ca3af] hover:text-(--text-primary) disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Drawers & Modals ──────────────────────────────────────────────────── */}

      {selected && !decideMode && !showModify && respondMode === null && (
        <RequestDetailDrawer
          request={selected}
          isAdmin={IS_ADMIN && selected.user_id !== MY_USER_ID}
          onClose={() => setSelected(null)}
          onApprove={() => { setDecideMode("approve"); }}
          onReject={() => { setDecideMode("reject"); }}
          onModify={() => { setShowModify(true); }}
          onAccept={() => setRespondMode(true)}
          onDecline={() => setRespondMode(false)}
        />
      )}

      {showNew && (
        <NewLeaveRequestModal
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}

      {selected && decideMode && (
        <DecisionModal
          request={selected}
          action={decideMode}
          onClose={() => { setDecideMode(null); }}
          onSubmit={handleDecision}
        />
      )}

      {selected && showModify && (
        <ModifyModal
          request={selected}
          onClose={() => { setShowModify(false); }}
          onSubmit={handleModify}
        />
      )}

      {selected && respondMode !== null && (
        <RespondModal
          request={selected}
          accept={respondMode}
          onClose={() => setRespondMode(null)}
          onSubmit={handleRespond}
        />
      )}
    </div>
  );
}
