"use client";

import React, { useEffect, useState } from "react";
import { LogIn, LogOut, Clock, CheckCircle2, Calendar } from "lucide-react";
import { TodayState } from "./types";

interface TodayHeroCardProps {
  state:       TodayState;
  signInTime:  string | null;
  signOutTime: string | null;
  onSignIn:    () => void;
  onSignOut:   () => void;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function calcLive(signInISO: string) {
  const diff = Date.now() - new Date(signInISO).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function calcHours(signInISO: string, signOutISO: string) {
  const diff = new Date(signOutISO).getTime() - new Date(signInISO).getTime();
  return (diff / 3600000).toFixed(1) + " hrs";
}

export function TodayHeroCard({ state, signInTime, signOutTime, onSignIn, onSignOut }: TodayHeroCardProps) {
  const [clock, setClock]   = useState(new Date());
  const [live,  setLive]    = useState("00:00:00");

  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date());
      if (state === "signed_in" && signInTime) setLive(calcLive(signInTime));
    }, 1000);
    return () => clearInterval(id);
  }, [state, signInTime]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const statusBadge = {
    idle:       { label: "Not Signed In", color: "#9ca3af",  bg: "#f3f4f6"  },
    signed_in:  { label: "Signed In",     color: "#074616",  bg: "#dcfce7"  },
    signed_out: { label: "Signed Out",    color: "#AF580B",  bg: "#fef3c7"  },
  }[state];

  return (
    <div
      className="relative bg-white rounded-2xl border border-[#f0f0f5] shadow-sm overflow-hidden flex flex-col"
      style={{ borderLeft: "4px solid #33084E" }}
    >
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(51,8,78,0.03) 0%, transparent 60%)" }} />

      <div className="relative flex flex-wrap items-center justify-between" style={{ padding: "20px 24px", gap: "16px" }}>

        {/* Left — date + clock */}
        <div className="flex items-center" style={{ gap: "16px" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#33084E" }}>
            <Calendar size={22} className="text-white" />
          </div>
          <div className="flex flex-col" style={{ gap: "2px" }}>
            <span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">{today}</span>
            <span className="text-[26px] font-bold leading-none" style={{ color: "#33084E", fontVariantNumeric: "tabular-nums" }}>{timeStr}</span>
          </div>
        </div>

        {/* Center — status + in/out times */}
        <div className="flex flex-wrap items-center" style={{ gap: "12px" }}>
          {/* Status badge */}
          <span
            className="inline-flex items-center rounded-full text-[12px] font-bold"
            style={{ padding: "5px 14px", gap: "6px", background: statusBadge.bg, color: statusBadge.color }}
          >
            <span className="rounded-full" style={{ width: "7px", height: "7px", background: statusBadge.color }} />
            {statusBadge.label}
          </span>

          {/* Times */}
          {(state === "signed_in" || state === "signed_out") && (
            <div className="flex items-center rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] divide-x divide-[#f0f0f5] overflow-hidden">
              <div className="flex flex-col items-center" style={{ padding: "8px 16px" }}>
                <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">In</span>
                <span className="text-[14px] font-bold text-(--text-primary)">{fmt(signInTime)}</span>
              </div>
              {state === "signed_out" && (
                <div className="flex flex-col items-center" style={{ padding: "8px 16px" }}>
                  <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Out</span>
                  <span className="text-[14px] font-bold text-(--text-primary)">{fmt(signOutTime)}</span>
                </div>
              )}
              <div className="flex flex-col items-center" style={{ padding: "8px 16px" }}>
                <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">
                  {state === "signed_in" ? "Live" : "Total"}
                </span>
                <span className="text-[14px] font-bold" style={{ color: state === "signed_in" ? "#33084E" : "#074616", fontVariantNumeric: "tabular-nums" }}>
                  {state === "signed_in" ? live : calcHours(signInTime!, signOutTime!)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right — action button */}
        <div className="flex items-center shrink-0">
          {state === "idle" && (
            <button
              onClick={onSignIn}
              className="inline-flex items-center rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ padding: "10px 22px", gap: "8px", background: "#33084E", boxShadow: "0 4px 12px rgba(51,8,78,0.25)" }}
            >
              <LogIn size={15} /> Sign In
            </button>
          )}
          {state === "signed_in" && (
            <button
              onClick={onSignOut}
              className="inline-flex items-center rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ padding: "10px 22px", gap: "8px", background: "#AF580B", boxShadow: "0 4px 12px rgba(175,88,11,0.25)" }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          )}
          {state === "signed_out" && (
            <div className="inline-flex items-center rounded-xl text-[13px] font-bold" style={{ padding: "10px 22px", gap: "8px", background: "#dcfce7", color: "#074616" }}>
              <CheckCircle2 size={15} /> Day Complete
            </div>
          )}
        </div>
      </div>

      {/* Bottom progress bar — only while signed in */}
      {state === "signed_in" && (
        <div className="h-1 bg-[#f0f0f5]" style={{ borderTop: "1px solid #f0f0f5" }}>
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, ((Date.now() - new Date(signInTime!).getTime()) / (9 * 3600000)) * 100)}%`,
              background: "linear-gradient(90deg, #33084E, #7c3aed)",
            }}
          />
        </div>
      )}
    </div>
  );
}
