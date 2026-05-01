"use client";

import React, { useState, useMemo } from "react";
import { Plus, ListFilter, CalendarDays, Users, Clock, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { LeaveRequest as ApiLeaveRequest, User as ApiUser } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useUpdateLeaveStatus,
  useRespondToLeave,
  useUsers,
} from "../attendance/hooks/useAttendance";

import { RequestCard } from "./components/RequestCard";
import { RequestDetailDrawer } from "./components/RequestDetailDrawer";
import { NewLeaveRequestModal } from "./components/NewLeaveRequestModal";
import { DecisionModal } from "./components/DecisionModal";
import { ModifyModal } from "./components/ModifyModal";
import { RespondModal } from "./components/RespondModal";
import { LeaveCalendar } from "./components/LeaveCalendar";
import { LeaveSkeleton } from "@/components/LeaveSkeleton";
import { toast } from "sonner";

import {
  LeaveRequest, LeaveStatus, LeaveType,
  STATUS_CONFIG, TYPE_CONFIG, LEAVE_TYPES,
  countDays,
} from "./components/types";

// ── Helpers ────────────────────────────────────────────────────────────────────


function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function colorFromId(id: number): string {
  const colors = ["#33084E", "#AF580B", "#074616", "#1d4ed8", "#be185d", "#0f766e", "#7c3aed"];
  return colors[id % colors.length];
}

function mapLeaveRequest(raw: ApiLeaveRequest): LeaveRequest {
  const userName = raw.user?.name ?? `User #${raw.user_id}`;
  const supervisorName = raw.supervisor?.name ?? (raw.supervisor_id ? `User #${raw.supervisor_id}` : "Unassigned");

  return {
    ...raw,
    decision_note: raw.decision_note ?? null,
    supervisor_note: raw.supervisor_note ?? null,
    sender_response_note: raw.sender_response_note ?? null,
    modified_start_date: raw.modified_start_date ?? null,
    modified_end_date: raw.modified_end_date ?? null,
    user_name: userName,
    user_initials: initialsFromName(userName),
    user_color: colorFromId(raw.user_id),
    type: (raw.leave_type as LeaveType) || "other",
    reason: raw.reason ?? "",
    supervisor_id: raw.supervisor_id ?? 0,
    supervisor_name: supervisorName,
    supervisor_initials: initialsFromName(supervisorName),
    status: (raw.status as LeaveStatus) || "pending",
    days: countDays(raw.start_date, raw.end_date),
  };
}

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

type View = "my" | "team" | "calendar";
type DecideMode = "approve" | "reject";

// ── Page ──────────────────────────────────────────────────────────────────────

const inputCls = "rounded-xl border border-[#f0f0f5] bg-white text-[12px] font-medium outline-none text-(--text-primary) focus:border-[#33084E] transition-colors placeholder:text-[#9ca3af]";

export default function LeaveRequestsPage() {
  const currentUser = useAuthStore((s) => s.user);
  const MY_USER_ID = currentUser?.id ?? 0;
  const IS_ADMIN = Boolean(currentUser?.roles?.some((r) => r.name === "admin" || r.name === "supervisor"));

  const [view, setView] = useState<View>("my");
  const [month, setMonth] = useState(currentMonth());

  // Filters
  const [statusF, setStatusF] = useState<LeaveStatus | "all">("all");
  const [typeF, setTypeF] = useState<LeaveType | "all">("all");
  const [fromF, setFromF] = useState("");
  const [toF, setToF] = useState("");
  const [perPage, setPerPage] = useState(6);
  const [page, setPage] = useState(1);

  // Queries
  const { data: requestsRaw, isLoading: requestsLoading } = useLeaveRequests();
  const { data: usersRaw } = useUsers();

  // Mutations
  const createLeaveMutation = useCreateLeaveRequest();
  const updateLeaveStatusMutation = useUpdateLeaveStatus();
  const respondLeaveMutation = useRespondToLeave();

  const requests = useMemo(() => (requestsRaw || []).map(mapLeaveRequest), [requestsRaw]);

  const supervisors = useMemo(() => {
    return (usersRaw || [])
      .filter((u: ApiUser) => u.roles?.some((r) => r.name === "admin" || r.name === "supervisor"))
      .map((u: ApiUser) => ({
        id: u.id,
        name: u.name,
        initials: initialsFromName(u.name),
        color: colorFromId(u.id),
      }));
  }, [usersRaw]);

  // Modal / drawer state
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [decideMode, setDecideMode] = useState<DecideMode | null>(null);
  const [showModify, setShowModify] = useState(false);
  const [respondMode, setRespondMode] = useState<boolean | null>(null); // true=accept, false=decline

  // ── Filtered + paginated list ──────────────────────────────────────────────
  const source = view === "my"
    ? requests.filter(r => r.user_id === MY_USER_ID)
    : requests;

  const filtered = useMemo(() => {
    return source.filter(r => {
      if (statusF !== "all" && r.status !== statusF) return false;
      if (typeF !== "all" && r.type !== typeF) return false;
      if (fromF && r.start_date < fromF) return false;
      if (toF && r.end_date > toF) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [source, statusF, typeF, fromF, toF]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetFilters = () => { setStatusF("all"); setTypeF("all"); setFromF(""); setToF(""); setPage(1); };

  // ── Summary counts ────────────────────────────────────────────────────────
  const myReqs = requests.filter(r => r.user_id === MY_USER_ID);
  const pendingMine = myReqs.filter(r => r.status === "pending").length;
  const modifiedMine = myReqs.filter(r => r.status === "modified").length;
  const teamPending = requests.filter(r => r.status === "pending").length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openDecide = (r: LeaveRequest, mode: DecideMode) => { setSelected(r); setDecideMode(mode); };
  const openModify = (r: LeaveRequest) => { setSelected(r); setShowModify(true); };

  const handleCreate = (data: { type: LeaveType; reason: string; start_date: string; end_date: string; supervisor_id: number }) => {
    createLeaveMutation.mutate({
      ...data,
      leave_type: data.type,
      status: "pending", // required by type but set by backend
      id: 0, // placeholder
      user_id: MY_USER_ID,
      created_at: "",
      updated_at: "",
    }, {
      onSuccess: () => {
        setShowNew(false);
        toast.success("Leave request submitted successfully");
      },
      onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to submit request")
    });
  };

  const handleDecision = (note: string) => {
    if (!selected || !decideMode) return;
    updateLeaveStatusMutation.mutate({
      id: selected.id,
      status: decideMode === "approve" ? "approved" : "rejected",
      decision_note: note || null,
    }, {
      onSuccess: () => {
        setSelected(null);
        setDecideMode(null);
        toast.success("Action completed successfully");
      },
      onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Action failed")
    });
  };

  const handleModify = (data: { supervisor_note: string; modified_start_date: string; modified_end_date: string }) => {
    if (!selected) return;
    updateLeaveStatusMutation.mutate({
      id: selected.id,
      status: "modified",
      ...data,
    }, {
      onSuccess: () => {
        setSelected(null);
        setShowModify(false);
        toast.success("Request modified successfully");
      },
      onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Modification failed")
    });
  };

  const handleRespond = (note: string) => {
    if (!selected || respondMode === null) return;
    respondLeaveMutation.mutate({
      id: selected.id,
      accept: respondMode,
      sender_response_note: note || null,
    }, {
      onSuccess: () => {
        setSelected(null);
        setRespondMode(null);
        toast.success("Response recorded successfully");
      },
      onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Response failed")
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (requestsLoading) {
    return <LeaveSkeleton />;
  }

  return (
    <div className="flex flex-col w-full bg-white overflow-hidden" style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "20px" }}>

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
          { label: "My Requests", value: myReqs.length, icon: <ListFilter size={15} />, bg: "#f3e8ff", color: "#33084E", iconBg: "#ede9fe" },
          { label: "Awaiting My OK", value: modifiedMine, icon: <Clock size={15} />, bg: "#dbeafe", color: "#1d4ed8", iconBg: "#eff6ff" },
          { label: "My Pending", value: pendingMine, icon: <Clock size={15} />, bg: "#fef3c7", color: "#AF580B", iconBg: "#fef9c3" },
          { label: "Team Pending", value: teamPending, icon: <Users size={15} />, bg: "#dcfce7", color: "#074616", iconBg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} className="flex items-center bg-white rounded-2xl border border-[#f0f0f5] transition-all duration-[250ms] ease-out hover:-translate-y-[3px] shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:shadow-[0_18px_50px_rgba(0,0,0,0.24)]" style={{ padding: "12px 18px", gap: "12px", flex: "1 1 150px" }}>
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
            { key: "my", icon: <ListFilter size={13} />, label: "My Requests" },
            { key: "team", icon: <Users size={13} />, label: "Team Requests" },
            { key: "calendar", icon: <CalendarDays size={13} />, label: "Calendar" },
          ] as { key: View; icon: React.ReactNode; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setView(tab.key); setPage(1); }}
              className="inline-flex items-center rounded-lg text-[12px] font-bold transition-all"
              style={{
                padding: "7px 14px", gap: "6px",
                background: view === tab.key ? "#33084E" : "transparent",
                color: view === tab.key ? "white" : "#9ca3af",
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
              onChange={v => { setStatusF(v as LeaveStatus | "all"); setPage(1); }}
              options={[
                { value: "all", label: "All Statuses" },
                ...(Object.keys(STATUS_CONFIG) as LeaveStatus[]).map(s => ({ value: s, label: STATUS_CONFIG[s].label })),
              ]}
              searchPlaceholder="Search statuses…"
            />

            <CustomSelect
              value={typeF}
              onChange={v => { setTypeF(v as LeaveType | "all"); setPage(1); }}
              options={[
                { value: "all", label: "All Types" },
                ...LEAVE_TYPES.map(t => ({ value: t, label: TYPE_CONFIG[t].label })),
              ]}
              searchPlaceholder="Search types…"
            />

            <input type="date" value={fromF} onChange={e => { setFromF(e.target.value); setPage(1); }} className={inputCls} style={{ padding: "7px 10px" }} placeholder="From" />
            <input type="date" value={toF} onChange={e => { setToF(e.target.value); setPage(1); }} className={inputCls} style={{ padding: "7px 10px" }} placeholder="To" />

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
                        color: p === page ? "white" : "#6b7280",
                        border: `1px solid ${p === page ? "#33084E" : "#f0f0f5"}`,
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
          supervisors={supervisors}
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
