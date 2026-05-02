"use client";

import React, { useState, useMemo } from "react";
import { CalendarDays, List } from "lucide-react";
import type { Attendance as ApiAttendance } from "@/lib/types";
import { useAttendance, useSignIn, useSignOut } from "./hooks/useAttendance";
import { useAuthStore } from "@/lib/stores/authStore";

import { TodayHeroCard } from "./components/TodayHeroCard";
import { SummaryStrip } from "./components/SummaryStrip";
import { CalendarView } from "./components/CalendarView";
import { LogListView } from "./components/LogListView";
import { DayDetailDrawer } from "./components/DayDetailDrawer";
import { SignInModal } from "./components/SignInModal";
import { SignOutModal } from "./components/SignOutModal";
import { AttendanceSkeleton } from "@/components/AttendanceSkeleton";
import { toast } from "sonner";

import {
  AttendanceLog,
  CalendarDay,
  SummaryStats,
  TeamMember,
  TodayState,
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

function buildCalendarDays(logs: AttendanceLog[], month: string, userId: number): CalendarDay[] {
  const [y, mo] = month.split("-").map(Number);
  const daysInMo = new Date(y, mo, 0).getDate();
  const today = todayStr();
  const result: CalendarDay[] = [];

  for (let d = 1; d <= daysInMo; d++) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    const log = logs.find(l => l.date === dateStr && l.user_id === userId);
    const dow = new Date(dateStr + "T00:00:00").getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isPastOrToday = dateStr <= today;

    let status = log?.status ?? null;
    if (!log && isPastOrToday && !isWeekend) {
      status = "absent";
    }

    result.push({
      date: dateStr,
      status,
      sign_in: log?.sign_in ?? null,
      sign_out: log?.sign_out ?? null,
      hours: log?.hours ?? null,
      is_today: dateStr === today,
      is_weekend: isWeekend,
    });
  }
  return result;
}


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

function deriveStatus(signedInAt: string | null, signedOutAt: string | null, hours: number | null): AttendanceLog["status"] {
  if (!signedInAt) return "absent";
  if (hours !== null && hours < 5) return "half_day";

  const signInHour = new Date(signedInAt).getHours();
  const signInMinute = new Date(signedInAt).getMinutes();
  const isLate = signInHour > 9 || (signInHour === 9 && signInMinute > 15);

  if (signedOutAt && isLate) return "late";
  return "present";
}

function mapAttendance(raw: ApiAttendance): AttendanceLog {
  const userName = raw.user?.name ?? `User #${raw.user_id}`;
  const hours = raw.signed_in_at && raw.signed_out_at
    ? Math.round((((new Date(raw.signed_out_at).getTime() - new Date(raw.signed_in_at).getTime()) / 3600000) * 10)) / 10
    : null;

  return {
    id: raw.id,
    user_id: raw.user_id,
    user_name: userName,
    user_initials: initialsFromName(userName),
    date: String(raw.date).split("T")[0],
    sign_in: raw.signed_in_at,
    sign_out: raw.signed_out_at,
    hours,
    status: raw.status ?? deriveStatus(raw.signed_in_at, raw.signed_out_at, hours),
    note: "",
  };
}

function computeStats(days: CalendarDay[]): SummaryStats {
  const today = todayStr();
  const completedWorkDays = days.filter((d) => d.date <= today && !d.is_weekend);

  const present = completedWorkDays.filter((d) => d.status === "present" || d.status === "late" || d.status === "half_day").length;
  const absent = completedWorkDays.filter((d) => d.status === "absent").length;
  const late = completedWorkDays.filter((d) => d.status === "late").length;
  const hoursArr = completedWorkDays.filter((d) => d.hours != null).map((d) => d.hours as number);
  const avg_hours = hoursArr.length ? hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length : 0;
  return { present, absent, late, avg_hours };
}

// ── Page ──────────────────────────────────────────────────────────────────────

type View = "calendar" | "log";

export default function AttendancePage() {
  const currentUser = useAuthStore((s) => s.user);
  const userId = currentUser?.id ?? 0;

  const [month, setMonth] = useState(currentMonth());
  const [activeView, setActiveView] = useState<View>("calendar");
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  // Queries
  const { data: attRaw, isLoading } = useAttendance({ userId });

  // Mutations
  const signInMutation = useSignIn();
  const signOutMutation = useSignOut();

  const logs = useMemo(() => (attRaw || []).map(mapAttendance), [attRaw]);

  const teamMembers = useMemo(() => {
    const memberMap = new Map<number, TeamMember>();
    logs.forEach((log) => {
      if (!memberMap.has(log.user_id)) {
        memberMap.set(log.user_id, {
          id: log.user_id,
          name: log.user_name,
          initials: log.user_initials,
          color: colorFromId(log.user_id),
        });
      }
    });
    return Array.from(memberMap.values());
  }, [logs]);

  const todayLog = useMemo(() => {
    const today = todayStr();
    return logs.find((l) => l.user_id === userId && l.date === today);
  }, [logs, userId]);

  const todayState: TodayState = useMemo(() => {
    if (todayLog?.sign_out) return "signed_out";
    if (todayLog?.sign_in) return "signed_in";
    return "idle";
  }, [todayLog]);

  const signInTime = todayLog?.sign_in ?? null;
  const signOutTime = todayLog?.sign_out ?? null;


  const calendarDays = useMemo(() => buildCalendarDays(logs, month, userId), [logs, month, userId]);
  const stats = useMemo(() => computeStats(calendarDays), [calendarDays]);

  // ── Sign-in handler ──────────────────────────────────────────────────────
  const handleSignIn = (note: string) => {
    signInMutation.mutate({ note }, {
      onSuccess: () => {
        setShowSignIn(false);
        toast.success("Clocked in successfully");
      },
      onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Clock in failed")
    });
  };

  // ── Sign-out handler ─────────────────────────────────────────────────────
  const handleSignOut = (note: string) => {
    signOutMutation.mutate({ note }, {
      onSuccess: () => {
        setShowSignOut(false);
        toast.success("Clocked out successfully");
      },
      onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Clock out failed")
    });
  };

  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  return (
    <div
      className="flex flex-col w-full bg-white overflow-hidden"
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
            { key: "log", icon: <List size={13} />, label: "Log List" },
          ] as { key: View; icon: React.ReactNode; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className="inline-flex items-center rounded-lg text-[12px] font-bold transition-all"
              style={{
                padding: "7px 14px",
                gap: "6px",
                background: activeView === tab.key ? "#33084E" : "transparent",
                color: activeView === tab.key ? "white" : "#9ca3af",
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
          <LogListView logs={logs} teamMembers={teamMembers} />
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
