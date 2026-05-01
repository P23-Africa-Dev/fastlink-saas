"use client";

import React, { useState, useMemo, useEffect } from "react";
import { CalendarDays, List } from "lucide-react";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
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

function buildCalendarDays(logs: AttendanceLog[], month: string): CalendarDay[] {
  const [y, mo] = month.split("-").map(Number);
  const daysInMo = new Date(y, mo, 0).getDate();
  const today = todayStr();
  const result: CalendarDay[] = [];

  for (let d = 1; d <= daysInMo; d++) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    const log = logs.find(l => l.date === dateStr && l.user_id === 1);
    const dow = new Date(dateStr + "T00:00:00").getDay();
    result.push({
      date: dateStr,
      status: log?.status ?? null,
      sign_in: log?.sign_in ?? null,
      sign_out: log?.sign_out ?? null,
      hours: log?.hours ?? null,
      is_today: dateStr === today,
      is_weekend: dow === 0 || dow === 6,
    });
  }
  return result;
}

interface BackendUser {
  id: number;
  name: string;
}

interface BackendAttendance {
  id: number;
  user_id: number;
  user?: BackendUser;
  date: string;
  signed_in_at: string | null;
  signed_out_at: string | null;
  note: string | null;
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

function mapAttendance(raw: BackendAttendance): AttendanceLog {
  const userName = raw.user?.name ?? `User #${raw.user_id}`;
  const hours = raw.signed_in_at && raw.signed_out_at
    ? Math.round((((new Date(raw.signed_out_at).getTime() - new Date(raw.signed_in_at).getTime()) / 3600000) * 10)) / 10
    : null;

  return {
    id: raw.id,
    user_id: raw.user_id,
    user_name: userName,
    user_initials: initialsFromName(userName),
    date: raw.date,
    sign_in: raw.signed_in_at,
    sign_out: raw.signed_out_at,
    hours,
    status: deriveStatus(raw.signed_in_at, raw.signed_out_at, hours),
    note: raw.note ?? "",
  };
}

function computeStats(logs: AttendanceLog[], userId = 1): SummaryStats {
  const myLogs = logs.filter(l => l.user_id === userId);
  const present = myLogs.filter(l => l.status === "present" || l.status === "late" || l.status === "half_day").length;
  const absent = myLogs.filter(l => l.status === "absent").length;
  const late = myLogs.filter(l => l.status === "late").length;
  const hoursArr = myLogs.filter(l => l.hours != null).map(l => l.hours!);
  const avg_hours = hoursArr.length ? hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length : 0;
  return { present, absent, late, avg_hours };
}

// ── Page ──────────────────────────────────────────────────────────────────────

type View = "calendar" | "log";

export default function AttendancePage() {
  const currentUser = useAuthStore((s) => s.user);
  const userId = currentUser?.id ?? 0;

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeView, setActiveView] = useState<View>("calendar");
  const [month, setMonth] = useState(currentMonth());
  const [todayState, setTodayState] = useState<TodayState>("idle");
  const [signInTime, setSignInTime] = useState<string | null>(null);
  const [signOutTime, setSignOutTime] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const attRes = await api.get<ApiResponse<BackendAttendance[]>>("/attendance", { params: { per_page: 200 } });

        if (!mounted) return;

        const mappedLogs = attRes.data.data.map(mapAttendance);
        const memberMap = new Map<number, TeamMember>();
        mappedLogs.forEach((log) => {
          if (!memberMap.has(log.user_id)) {
            memberMap.set(log.user_id, {
              id: log.user_id,
              name: log.user_name,
              initials: log.user_initials,
              color: colorFromId(log.user_id),
            });
          }
        });

        setLogs(mappedLogs);
        setTeamMembers(Array.from(memberMap.values()));

        const today = todayStr();
        const myTodayLog = mappedLogs.find((l) => l.user_id === userId && l.date === today);
        if (myTodayLog?.sign_out) {
          setTodayState("signed_out");
          setSignInTime(myTodayLog.sign_in);
          setSignOutTime(myTodayLog.sign_out);
        } else if (myTodayLog?.sign_in) {
          setTodayState("signed_in");
          setSignInTime(myTodayLog.sign_in);
        } else {
          setTodayState("idle");
        }
      } catch (error: any) {
        console.error("Failed to load attendance", error);
        toast.error(error?.response?.data?.message || "Failed to load attendance data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const calendarDays = useMemo(() => buildCalendarDays(logs, month), [logs, month]);
  const stats = useMemo(() => computeStats(logs, userId), [logs, userId]);

  // ── Sign-in handler ──────────────────────────────────────────────────────
  const handleSignIn = (note: string) => {
    void (async () => {
      try {
        const res = await api.post<ApiResponse<BackendAttendance>>("/attendance/sign-in", { note });
        const mapped = mapAttendance(res.data.data);

        setSignInTime(mapped.sign_in);
        setTodayState("signed_in");
        setLogs((prev) => {
          const exists = prev.some((l) => l.id === mapped.id);
          if (exists) return prev.map((l) => (l.id === mapped.id ? mapped : l));
          return [mapped, ...prev];
        });
        setShowSignIn(false);
      } catch (error: any) {
        console.error("Sign-in failed", error);
        toast.error(error?.response?.data?.message || "Clock in failed.");
      }
    })();
  };

  // ── Sign-out handler ─────────────────────────────────────────────────────
  const handleSignOut = (note: string) => {
    void (async () => {
      try {
        const res = await api.post<ApiResponse<BackendAttendance>>("/attendance/sign-out", { note });
        const mapped = mapAttendance(res.data.data);
        setSignOutTime(mapped.sign_out);
        setTodayState("signed_out");
        setLogs((prev) => prev.map((l) => (l.id === mapped.id ? mapped : l)));
        setShowSignOut(false);
      } catch (error: any) {
        console.error("Sign-out failed", error);
        toast.error(error?.response?.data?.message || "Clock out failed.");
      }
    })();
  };

  if (loading) {
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
