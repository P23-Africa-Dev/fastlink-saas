"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  UserPlus, Upload, Users, Clock, Trophy,
  TrendingUp, RefreshCw, CalendarDays, MapPin,
  ArrowUpRight, ChevronRight,
} from "lucide-react";
import {
  useLeadAnalytics,
  useLeadTimeline,
  useTopUploaders,
  type AnalyticsFilters,
} from "../hooks/useCrm";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface Drive { id: number; name: string; }

interface LeadAnalyticsPanelProps {
  drives: Drive[];
}

const PURPLE = "#33084E";
const ORANGE = "#AF580B";
const BLUE = "#1d4ed8";
const GREEN = "#065f46";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initial(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div
      className="flex flex-col bg-white rounded-2xl border border-[#f0f0f5] shadow-sm"
      style={{ padding: "20px 24px", gap: "16px" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-(--text-muted) uppercase tracking-wider">{label}</span>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ width: 36, height: 36, background: `${color}15` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-[28px] font-black text-(--text-primary)" style={{ lineHeight: 1 }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {sub && (
          <div className="text-[11px] font-medium text-(--text-muted)" style={{ marginTop: 4 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodPill({
  label, count, active, onClick,
}: {
  label: string;
  count: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center rounded-xl border transition-all"
      style={{
        padding: "12px 20px",
        background: active ? PURPLE : "white",
        borderColor: active ? PURPLE : "#f0f0f5",
        gap: 2,
      }}
    >
      <span
        className="text-[20px] font-black"
        style={{ color: active ? "white" : "#1a1a2e", lineHeight: 1 }}
      >
        {count.toLocaleString()}
      </span>
      <span
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: active ? "rgba(255,255,255,0.75)" : "#9ca3af" }}
      >
        {label}
      </span>
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white rounded-xl border border-[#f0f0f5] shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
      style={{ padding: "12px 16px", minWidth: 160 }}
    >
      <div className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wide" style={{ marginBottom: 8 }}>
        {label}
      </div>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center justify-between" style={{ gap: 16, marginBottom: 4 }}>
          <div className="flex items-center" style={{ gap: 6 }}>
            <span className="rounded-full" style={{ width: 8, height: 8, background: entry.color, display: "inline-block" }} />
            <span className="text-[12px] font-medium text-(--text-muted) capitalize">{entry.name}</span>
          </div>
          <span className="text-[12px] font-bold text-(--text-primary)">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LeadAnalyticsPanel({ drives }: LeadAnalyticsPanelProps) {
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilters>({ type: "both", period: "month" });
  const [activePeriod, setActivePeriod] = useState<"today" | "this_week" | "this_month">("this_month");

  const updateFilter = (patch: Partial<AnalyticsFilters>) =>
    setAnalyticsFilters((f) => ({ ...f, ...patch }));

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useLeadAnalytics(analyticsFilters);
  const { data: timelineRes, isLoading: timelineLoading } = useLeadTimeline(analyticsFilters, 20);
  const { data: topData, isLoading: topLoading } = useTopUploaders(analyticsFilters, 8);

  const trendPoints = useMemo(() => {
    const pts = analytics?.trend?.points ?? [];
    return pts.map((p) => ({
      ...p,
      date: formatShortDate(p.date),
    }));
  }, [analytics]);

  const maxTotal = useMemo(() => Math.max(...trendPoints.map((p) => p.total_leads), 1), [trendPoints]);

  const summary = analytics?.summary;
  const periodSummaries = analytics?.period_summaries;
  const topItems = topData?.items ?? [];
  const timelineItems = timelineRes?.data ?? [];

  const driveOptions = [
    { value: "0", label: "All Pipelines" },
    ...drives.map((d) => ({ value: d.id.toString(), label: d.name })),
  ];

  const typeOptions = [
    { value: "both", label: "All Types" },
    { value: "manual", label: "Manual Only" },
    { value: "imported", label: "Imported Only" },
  ];

  const periodOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
  ];

  return (
    <div className="flex flex-col w-full overflow-y-auto" style={{ gap: 24, paddingBottom: 32 }}>

      {/* ── Filter Strip ─────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl border border-[#f0f0f5] shadow-sm flex flex-wrap items-center justify-between"
        style={{ padding: "14px 16px", gap: 12 }}
      >
        <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
          {/* Type filter */}
          <div className="w-full sm:w-auto sm:min-w-40">
            <CustomSelect
              value={analyticsFilters.type ?? "both"}
              onChange={(v) => updateFilter({ type: v as AnalyticsFilters["type"] })}
              options={typeOptions}
              searchPlaceholder="Search types…"
              fullWidth
            />
          </div>

          {/* Period filter */}
          <div className="w-full sm:w-auto sm:min-w-40">
            <CustomSelect
              value={analyticsFilters.period ?? "month"}
              onChange={(v) => updateFilter({ period: v as AnalyticsFilters["period"] })}
              options={periodOptions}
              searchPlaceholder="Search periods…"
              fullWidth
            />
          </div>

          {/* Custom date range */}
          {analyticsFilters.period === "custom" && (
            <div className="flex items-center" style={{ gap: 8 }}>
              <input
                type="date"
                value={analyticsFilters.startDate ?? ""}
                onChange={(e) => updateFilter({ startDate: e.target.value })}
                className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] font-medium outline-none focus:border-(--accent-purple) transition-colors"
                style={{ padding: "9px 12px" }}
              />
              <span className="text-[12px] text-(--text-muted) font-medium">to</span>
              <input
                type="date"
                value={analyticsFilters.endDate ?? ""}
                onChange={(e) => updateFilter({ endDate: e.target.value })}
                className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] font-medium outline-none focus:border-(--accent-purple) transition-colors"
                style={{ padding: "9px 12px" }}
              />
            </div>
          )}

          {/* Drive filter */}
          <div className="w-full sm:w-auto sm:min-w-42.5">
            <CustomSelect
              value={(analyticsFilters.driveId ?? 0).toString()}
              onChange={(v) => updateFilter({ driveId: Number(v) || undefined })}
              options={driveOptions}
              searchPlaceholder="Search pipelines…"
              fullWidth
            />
          </div>
        </div>

        <button
          onClick={() => void refetchAnalytics()}
          className="flex items-center rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[12px] font-bold text-(--accent-purple) hover:border-(--accent-purple) transition-all"
          style={{ padding: "9px 14px", gap: 6 }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
        <KpiCard
          label="Manual Leads"
          value={summary?.manual_leads ?? 0}
          icon={UserPlus}
          color={ORANGE}
          sub="Created by team members"
        />
        <KpiCard
          label="Imported Leads"
          value={summary?.imported_leads ?? 0}
          icon={Upload}
          color={PURPLE}
          sub="Bulk file imports"
        />
        <KpiCard
          label="Total Leads"
          value={summary?.total_leads ?? 0}
          icon={Users}
          color={BLUE}
          sub={
            summary?.unattributed
              ? `${summary.unattributed.imported} unattributed`
              : undefined
          }
        />
        <KpiCard
          label="Last Activity"
          value={summary?.last_activity ? formatDate(summary.last_activity) : "—"}
          icon={Clock}
          color={GREEN}
          sub="Most recent lead action"
        />
      </div>

      {/* ── Period Summary Pills ──────────────────────────────────────────── */}
      {periodSummaries && (
        <div
          className="bg-white rounded-2xl border border-[#f0f0f5] shadow-sm flex flex-wrap items-center justify-between"
          style={{ padding: "20px 24px", gap: 16 }}
        >
          <div>
            <h3 className="text-[14px] font-bold text-(--text-primary)">Period Overview</h3>
            <p className="text-[12px] text-(--text-muted)" style={{ marginTop: 2 }}>
              Lead creation counts by timeframe
            </p>
          </div>
          <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
            <PeriodPill
              label="Today"
              count={periodSummaries.today}
              active={activePeriod === "today"}
              onClick={() => setActivePeriod("today")}
            />
            <PeriodPill
              label="This Week"
              count={periodSummaries.this_week}
              active={activePeriod === "this_week"}
              onClick={() => setActivePeriod("this_week")}
            />
            <PeriodPill
              label="This Month"
              count={periodSummaries.this_month}
              active={activePeriod === "this_month"}
              onClick={() => setActivePeriod("this_month")}
            />
          </div>
        </div>
      )}

      {/* ── Trend Chart ──────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl border border-[#f0f0f5] shadow-sm"
        style={{ padding: "24px" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: 8, marginBottom: 24 }}>
          <div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <TrendingUp size={16} style={{ color: PURPLE }} />
              <h3 className="text-[15px] font-bold text-(--text-primary)">Lead Activity Trend</h3>
            </div>
            <p className="text-[12px] text-(--text-muted)" style={{ marginTop: 4 }}>
              Manual vs. imported leads over time
            </p>
          </div>
          <div className="flex items-center" style={{ gap: 16 }}>
            <div className="flex items-center" style={{ gap: 6 }}>
              <span className="rounded-full" style={{ width: 10, height: 10, background: ORANGE, display: "inline-block" }} />
              <span className="text-[12px] font-medium text-(--text-muted)">Manual</span>
            </div>
            <div className="flex items-center" style={{ gap: 6 }}>
              <span className="rounded-full" style={{ width: 10, height: 10, background: PURPLE, display: "inline-block" }} />
              <span className="text-[12px] font-medium text-(--text-muted)">Imported</span>
            </div>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <div className="text-[13px] text-(--text-muted) font-medium">Loading trend data…</div>
          </div>
        ) : trendPoints.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-[#f0f0f5] rounded-2xl"
            style={{ height: 200 }}
          >
            <TrendingUp size={28} className="text-[#d1d5db]" style={{ marginBottom: 8 }} />
            <div className="text-[13px] font-medium text-(--text-muted)">No trend data for this period</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendPoints} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradManual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ORANGE} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradImported" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, Math.ceil(maxTotal * 1.2)]}
                tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="manual_leads"
                name="manual"
                stroke={ORANGE}
                strokeWidth={2.5}
                fill="url(#gradManual)"
                dot={false}
                activeDot={{ r: 5, fill: ORANGE, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="imported_leads"
                name="imported"
                stroke={PURPLE}
                strokeWidth={2.5}
                fill="url(#gradImported)"
                dot={false}
                activeDot={{ r: 5, fill: PURPLE, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Bottom Row: Top Uploaders + Timeline ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: 16 }}>

        {/* Top Uploaders */}
        <div
          className="bg-white rounded-2xl border border-[#f0f0f5] shadow-sm flex flex-col"
          style={{ padding: "24px" }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div>
              <div className="flex items-center" style={{ gap: 8 }}>
                <Trophy size={15} style={{ color: ORANGE }} />
                <h3 className="text-[15px] font-bold text-(--text-primary)">Top Uploaders</h3>
              </div>
              <p className="text-[12px] text-(--text-muted)" style={{ marginTop: 4 }}>
                Most active lead contributors
              </p>
            </div>
            {topData?.total_uploaded_today != null && (
              <div
                className="flex items-center rounded-xl text-[11px] font-bold"
                style={{ padding: "5px 10px", background: `${ORANGE}12`, color: ORANGE, gap: 4 }}
              >
                <ArrowUpRight size={12} />
                {topData.total_uploaded_today} today
              </div>
            )}
          </div>

          {topLoading ? (
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: 120 }}>
              <div className="text-[13px] text-(--text-muted) font-medium">Loading…</div>
            </div>
          ) : topItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#f0f0f5] rounded-xl" style={{ minHeight: 120 }}>
              <Trophy size={24} className="text-[#d1d5db]" style={{ marginBottom: 6 }} />
              <div className="text-[13px] font-medium text-(--text-muted)">No data available</div>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 12 }}>
              {topItems.map((item, idx) => {
                const maxLeads = topItems[0]?.total_leads ?? 1;
                const pct = Math.round((item.total_leads / maxLeads) * 100);
                const rankColors = ["#AF580B", "#33084E", "#1d4ed8"];
                const rankColor = rankColors[idx] ?? "#9ca3af";
                return (
                  <div key={item.user.id} className="flex items-center" style={{ gap: 12 }}>
                    {/* Rank */}
                    <div
                      className="flex items-center justify-center rounded-lg text-[11px] font-black shrink-0"
                      style={{ width: 28, height: 28, background: `${rankColor}15`, color: rankColor }}
                    >
                      {idx + 1}
                    </div>

                    {/* Avatar */}
                    <div
                      className="flex items-center justify-center rounded-full text-[12px] font-bold shrink-0"
                      style={{ width: 36, height: 36, background: `${PURPLE}12`, color: PURPLE }}
                    >
                      {initial(item.user.name)}
                    </div>

                    {/* Info + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-(--text-primary) truncate">{item.user.name}</div>
                          <div className="text-[11px] text-(--text-muted) truncate">{item.user.email}</div>
                        </div>
                        <div className="text-right shrink-0" style={{ marginLeft: 8 }}>
                          <div className="text-[13px] font-black text-(--text-primary)">{item.total_leads.toLocaleString()}</div>
                          <div className="text-[10px] text-(--text-muted) font-medium">
                            {item.manual_leads}M · {item.imported_leads}I
                          </div>
                        </div>
                      </div>
                      <div
                        className="rounded-full overflow-hidden"
                        style={{ height: 4, background: "#f0f0f5", marginTop: 6 }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${rankColor} 0%, ${rankColor}aa 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div
          className="bg-white rounded-2xl border border-[#f0f0f5] shadow-sm flex flex-col"
          style={{ padding: "24px" }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div>
              <div className="flex items-center" style={{ gap: 8 }}>
                <CalendarDays size={15} style={{ color: PURPLE }} />
                <h3 className="text-[15px] font-bold text-(--text-primary)">Activity Timeline</h3>
              </div>
              <p className="text-[12px] text-(--text-muted)" style={{ marginTop: 4 }}>
                Recent lead creation events
              </p>
            </div>
            {timelineRes?.meta?.pagination && (
              <span className="text-[11px] font-bold text-(--text-muted)">
                {timelineRes.meta.pagination.total.toLocaleString()} total
              </span>
            )}
          </div>

          {timelineLoading ? (
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: 120 }}>
              <div className="text-[13px] text-(--text-muted) font-medium">Loading timeline…</div>
            </div>
          ) : timelineItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#f0f0f5] rounded-xl" style={{ minHeight: 120 }}>
              <CalendarDays size={24} className="text-[#d1d5db]" style={{ marginBottom: 6 }} />
              <div className="text-[13px] font-medium text-(--text-muted)">No activity in this period</div>
            </div>
          ) : (
            <div className="flex flex-col overflow-y-auto" style={{ gap: 0, maxHeight: 380 }}>
              {timelineItems.map((item, idx) => {
                const isImported = item.action_type === "imported";
                const actionColor = isImported ? PURPLE : ORANGE;
                const isLast = idx === timelineItems.length - 1;
                return (
                  <div key={`${item.lead_id}-${item.timestamp}`} className="flex" style={{ gap: 12 }}>
                    {/* Timeline spine */}
                    <div className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
                      <div
                        className="flex items-center justify-center rounded-full shrink-0"
                        style={{
                          width: 32, height: 32,
                          background: `${actionColor}15`,
                          color: actionColor,
                          marginTop: idx === 0 ? 0 : 0,
                        }}
                      >
                        {isImported ? <Upload size={13} /> : <UserPlus size={13} />}
                      </div>
                      {!isLast && (
                        <div style={{ width: 2, flex: 1, background: "#f0f0f5", minHeight: 12, margin: "4px 0" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0"
                      style={{ paddingBottom: isLast ? 0 : 12 }}
                    >
                      <div className="flex items-start justify-between" style={{ gap: 8 }}>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-(--text-primary) truncate">
                            {item.action}
                          </div>
                          <div className="flex flex-wrap items-center" style={{ gap: 6, marginTop: 4 }}>
                            {/* User */}
                            <span className="text-[11px] font-semibold text-(--text-muted)">
                              by {item.user.name}
                            </span>

                            {/* Drive badge */}
                            {item.drive && (
                              <span
                                className="rounded-md text-[10px] font-bold"
                                style={{
                                  padding: "2px 7px",
                                  background: `${item.drive.color}18`,
                                  color: item.drive.color,
                                }}
                              >
                                {item.drive.name}
                              </span>
                            )}

                            {/* Action type badge */}
                            <span
                              className="rounded-md text-[10px] font-bold capitalize"
                              style={{
                                padding: "2px 7px",
                                background: `${actionColor}12`,
                                color: actionColor,
                              }}
                            >
                              {item.action_type}
                            </span>
                          </div>

                          {/* Location */}
                          {item.location?.state && (
                            <div className="flex items-center" style={{ gap: 4, marginTop: 4 }}>
                              <MapPin size={10} className="text-[#9ca3af]" />
                              <span className="text-[11px] text-(--text-muted)">
                                {item.location.lga ? `${item.location.lga}, ` : ""}
                                {item.location.state}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span
                          className="text-[10px] font-semibold text-(--text-muted) shrink-0"
                          title={item.timestamp}
                        >
                          {timeAgo(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load more hint */}
              {(timelineRes?.meta?.pagination?.last_page ?? 1) > 1 && (
                <div
                  className="flex items-center justify-center border-t border-[#f0f0f5] text-[12px] font-bold text-(--accent-purple)"
                  style={{ padding: "12px 0", marginTop: 4, gap: 4 }}
                >
                  <ChevronRight size={13} />
                  {timelineRes!.meta.pagination.total - timelineItems.length} more events
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
