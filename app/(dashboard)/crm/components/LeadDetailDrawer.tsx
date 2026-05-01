"use client";

import React from "react";
import {
  X, Pencil, Trash2, Building2, Mail, Phone, DollarSign,
  Calendar, User, LayoutGrid,
} from "lucide-react";
import { ActivityFeed, Activity } from "./ActivityFeed";

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone?: string;
  estimated_value: number;
  currency?: string;
  priority: "low" | "normal" | "high";
  status_id: number;
  drive_id: number;
  date: string;
  notes?: string;
  assigned_to?: string | number;
}

interface Status { id: number; name: string; color: string; }
interface Drive { id: number; name: string; }

interface LeadDetailDrawerProps {
  lead: Lead;
  statuses: Status[];
  drives: Drive[];
  activities: Activity[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLogActivity: () => void;
  onEditActivity: (a: Activity) => void;
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  high: { bg: "#AF580B15", color: "#AF580B" },
  normal: { bg: "#33084E15", color: "#33084E" },
  low: { bg: "#f0f0f5", color: "#9ca3af" },
};

const formatCurrency = (val: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(val);

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number }) {
  return (
    <div className="flex items-start" style={{ gap: "10px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #f0f0f5" }}>
      <div className="shrink-0 text-[#9ca3af]" style={{ marginTop: "1px" }}>{icon}</div>
      <div className="flex flex-col" style={{ gap: "2px" }}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">{label}</span>
        <span className="text-[13px] font-semibold text-(--text-primary)">{value || <span className="text-[#9ca3af]">—</span>}</span>
      </div>
    </div>
  );
}

export function LeadDetailDrawer({
  lead, statuses, drives, activities,
  onClose, onEdit, onDelete, onLogActivity, onEditActivity,
}: LeadDetailDrawerProps) {
  const status = statuses.find(s => s.id === lead.status_id);
  const drive = drives.find(d => d.id === lead.drive_id);
  const priStyle = PRIORITY_STYLE[lead.priority] ?? PRIORITY_STYLE.normal;
  const initials = `${lead.first_name[0]}${lead.last_name[0]}`.toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full bg-white z-50 flex flex-col overflow-hidden shadow-2xl"
        style={{ width: "520px", maxWidth: "100vw" }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0"
          style={{ padding: "16px 20px" }}
        >
          <span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-wider">Lead Details</span>
          <div className="flex items-center" style={{ gap: "8px" }}>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0f0f5] bg-white text-[12px] font-bold text-(--text-primary) hover:border-(--accent-purple) hover:text-(--accent-purple) transition-all"
              style={{ padding: "6px 12px" }}
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0f0f5] bg-white text-[12px] font-bold text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
              style={{ padding: "6px 12px" }}
            >
              <Trash2 size={13} /> Delete
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary) hover:bg-[#f0f0f5] transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Lead Hero */}
          <div className="flex items-start" style={{ gap: "16px" }}>
            <div
              className="rounded-2xl flex items-center justify-center text-[18px] font-bold shrink-0"
              style={{ width: "56px", height: "56px", background: `${status?.color ?? "#33084E"}20`, color: status?.color ?? "#33084E" }}
            >
              {initials}
            </div>
            <div className="flex flex-col min-w-0" style={{ gap: "6px" }}>
              <h2 className="text-[20px] font-bold text-(--text-primary) leading-tight">
                {lead.first_name} {lead.last_name}
              </h2>
              <div className="flex items-center text-[13px] text-[#9ca3af]" style={{ gap: "6px" }}>
                <Building2 size={13} />
                <span className="truncate">{lead.company}</span>
              </div>
              {/* Badges row */}
              <div className="flex flex-wrap items-center" style={{ gap: "6px", marginTop: "4px" }}>
                {status && (
                  <span
                    className="inline-flex items-center rounded-full text-[11px] font-bold"
                    style={{ padding: "3px 10px", gap: "5px", background: `${status.color}18`, color: status.color }}
                  >
                    <span className="rounded-full" style={{ width: "6px", height: "6px", background: status.color }} />
                    {status.name}
                  </span>
                )}
                <span
                  className="inline-flex items-center rounded-full text-[11px] font-bold capitalize"
                  style={{ padding: "3px 10px", background: priStyle.bg, color: priStyle.color }}
                >
                  {lead.priority}
                </span>
                <span
                  className="inline-flex items-center rounded-full text-[12px] font-bold"
                  style={{ padding: "3px 10px", gap: "4px", background: "#f8f8fc", color: "#1a1a2e", border: "1px solid #f0f0f5" }}
                >
                  <DollarSign size={11} />
                  {formatCurrency(lead.estimated_value, lead.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="rounded-2xl border border-[#f0f0f5] overflow-hidden" style={{ padding: "0 16px" }}>
            <InfoRow icon={<Mail size={15} />} label="Email" value={lead.email} />
            <InfoRow icon={<Phone size={15} />} label="Phone" value={lead.phone} />
            <InfoRow icon={<LayoutGrid size={15} />} label="Pipeline" value={drive?.name} />
            <InfoRow icon={<User size={15} />} label="Assigned To" value={lead.assigned_to} />
            <InfoRow icon={<Calendar size={15} />} label="Created" value={lead.date} />
          </div>

          {/* Notes */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <h3 className="text-[13px] font-bold text-(--text-primary) uppercase tracking-wider">Notes</h3>
            <div className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px]" style={{ padding: "14px 16px", minHeight: "64px", color: lead.notes ? "#1a1a2e" : "#9ca3af" }}>
              {lead.notes || "No notes added."}
            </div>
          </div>

          {/* Activity feed */}
          <ActivityFeed
            activities={activities}
            onLog={onLogActivity}
            onEdit={onEditActivity}
          />
        </div>
      </div>
    </>
  );
}
