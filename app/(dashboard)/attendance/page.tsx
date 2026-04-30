"use client";

import React, { useState, useMemo } from "react";
import { CalendarDays, List } from "lucide-react";

import { TodayHeroCard }   from "./components/TodayHeroCard";
import { SummaryStrip }    from "./components/SummaryStrip";
import { CalendarView }    from "./components/CalendarView";
import { LogListView }     from "./components/LogListView";
import { DayDetailDrawer } from "./components/DayDetailDrawer";
import { SignInModal }     from "./components/SignInModal";
import { SignOutModal }    from "./components/SignOutModal";

import {
  AttendanceLog,
  CalendarDay,
  SummaryStats,
  TodayState,
  MOCK_LOGS,
} from "./components/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split("T")[0]; }

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

function buildCalendarDays(logs: AttendanceLog[], month: string): CalendarDay[] {
  const [y, mo] = month.split("-").map(Number);
  const daysInMo = new Date(y, mo, 0).getDate();
  const today    = todayStr();
  const result: CalendarDay[] = [];

  for (let d = 1; d <= daysInMo; d++) {
    const dateStr  = `${month}-${String(d).padStart(2, "0")}`;
    const log      = logs.find(l => l.date === dateStr && l.user_id === 1);
    const dow      = new Date(dateStr + "T00:00:00").getDay();
    result.push({
      date:       dateStr,
      status:     log?.status ?? null,
      sign_in:    log?.sign_in  ?? null,
      sign_out:   log?.sign_out ?? null,
      hours:      log?.hours    ?? null,
      is_today:   dateStr === today,
      is_weekend: dow === 0 || dow === 6,
    });
  }
  return result;
}

function computeStats(logs: AttendanceLog[], userId = 1): SummaryStats {
  const myLogs = logs.filter(l => l.user_id === userId);
  const present  = myLogs.filter(l => l.status === "present" || l.status === "late" || l.status === "half_day").length;
  const absent   = myLogs.filter(l => l.status === "absent").length;
  const late     = myLogs.filter(l => l.status === "late").length;
  const hoursArr = myLogs.filter(l => l.hours != null).map(l => l.hours!);
  const avg_hours = hoursArr.length ? hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length : 0;
  return { present, absent, late, avg_hours };
}

// ── Page ──────────────────────────────────────────────────────────────────────

type View = "calendar" | "log";

export default function AttendancePage() {
  const [logs,       setLogs]       = useState<AttendanceLog[]>(MOCK_LOGS);
  const [activeView, setActiveView] = useState<View>("calendar");
  const [month,      setMonth]      = useState(currentMonth());
  const [todayState, setTodayState] = useState<TodayState>("idle");
  const [signInTime, setSignInTime] = useState<string | null>(null);
  const [signOutTime,setSignOutTime]= useState<string | null>(null);
  const [selectedDay,setSelectedDay]= useState<CalendarDay | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignOut,setShowSignOut]= useState(false);

  const calendarDays = useMemo(() => buildCalendarDays(logs, month), [logs, month]);
  const stats        = useMemo(() => computeStats(logs, 1), [logs]);

  // ── Sign-in handler ──────────────────────────────────────────────────────
  const handleSignIn = (note: string) => {
    const now = new Date().toISOString();
    setSignInTime(now);
    setTodayState("signed_in");
    setShowSignIn(false);

    const today = todayStr();
    setLogs(prev => {
      const exists = prev.find(l => l.date === today && l.user_id === 1);
      if (exists) {
        return prev.map(l => l.date === today && l.user_id === 1 ? { ...l, sign_in: now, status: "present", note } : l);
      }
      return [...prev, {
        id:            Date.now(),
        user_id:       1,
        user_name:     "Alex Morgan",
        user_initials: "AM",
        date:          today,
        sign_in:       now,
        sign_out:      null,
        hours:         null,
        status:        "present",
        note,
      }];
    });
  };

  // ── Sign-out handler ─────────────────────────────────────────────────────
  const handleSignOut = (note: string) => {
    const now = new Date().toISOString();
    setSignOutTime(now);
    setTodayState("signed_out");
    setShowSignOut(false);

    const today = todayStr();
    const diff  = signInTime ? (new Date(now).getTime() - new Date(signInTime).getTime()) / 3600000 : 0;

    setLogs(prev =>
      prev.map(l =>
        l.date === today && l.user_id === 1
          ? { ...l, sign_out: now, hours: Math.round(diff * 10) / 10, note: note || l.note }
          : l
      )
    );
  };

  return (
    <div
      className="flex flex-col w-full bg-[#f8f8fc] overflow-hidden"
      style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "20px" }}
    >

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between shrink-0" style={{ gap: "12px" }}>
        <div className="flex flex-col" style={{ gap: "2px" }}>
          <h1 className="text-[22px] font-bold text-(--text-primary)">Attendance</h1>
          <p className="text-[13px] text-[#9ca3af]">Track presence, hours worked, and team attendance patterns.</p>
        </div>

        {/* View toggle tabs */}
        <div className="flex items-center rounded-xl border border-[#f0f0f5] bg-white overflow-hidden" style={{ padding: "4px" }}>
          {([
            { key: "calendar", icon: <CalendarDays size={13} />, label: "Calendar" },
            { key: "log",      icon: <List size={13} />,          label: "Log List"  },
          ] as { key: View; icon: React.ReactNode; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className="inline-flex items-center rounded-lg text-[12px] font-bold transition-all"
              style={{
                padding: "7px 14px",
                gap: "6px",
                background: activeView === tab.key ? "#33084E" : "transparent",
                color:      activeView === tab.key ? "white"    : "#9ca3af",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Today hero card ──────────────────────────────────────────────── */}
      <div className="shrink-0">
        <TodayHeroCard
          state={todayState}
          signInTime={signInTime}
          signOutTime={signOutTime}
          onSignIn={() => setShowSignIn(true)}
          onSignOut={() => setShowSignOut(true)}
        />
      </div>

      {/* ── Summary strip ───────────────────────────────────────────────── */}
      <div className="shrink-0">
        <SummaryStrip stats={stats} />
      </div>

      {/* ── Main view ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: "0" }}>
        {activeView === "calendar" ? (
          <CalendarView
            month={month}
            days={calendarDays}
            onPrev={() => setMonth(prevMonth(month))}
            onNext={() => setMonth(nextMonth(month))}
            onDayClick={day => setSelectedDay(day)}
          />
        ) : (
          <LogListView logs={logs} />
        )}
      </div>

      {/* ── Modals & drawers ─────────────────────────────────────────────── */}
      {selectedDay && (
        <DayDetailDrawer
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onConfirm={handleSignIn}
        />
      )}

      {showSignOut && signInTime && (
        <SignOutModal
          onClose={() => setShowSignOut(false)}
          onConfirm={handleSignOut}
          signInTime={signInTime}
        />
      )}
    </div>
  );
}
