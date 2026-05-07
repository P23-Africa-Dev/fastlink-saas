"use client";

/**
 * Single source of truth for CRM activity types.
 *
 * Adding a new activity type:
 *  1. Add the string literal to `ActivityType`.
 *  2. TypeScript will immediately flag every `Record<ActivityType, ...>` below
 *     as incomplete — add the missing entry and you're done.
 *
 * Consumers should import `ActivityType`, `Activity`, and the config constants
 * from this file instead of defining them locally.
 */

import React from "react";
import {
    Phone,
    Mail,
    Calendar,
    FileText,
    CheckSquare,
    ArrowRightLeft,
    Bell,
    Send,
    Paperclip,
    MoreHorizontal,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export type ActivityType =
    | "call"
    | "email"
    | "meeting"
    | "note"
    | "task"
    | "status_change"
    | "follow_up"
    | "proposal_sent"
    | "document"
    | "other";

export interface Activity {
    id: number;
    type: ActivityType;
    title: string;
    description?: string;
    scheduled_at: string;
    is_completed: boolean;
}

// ---------------------------------------------------------------------------
// Per-type color / border config  (no JSX — safe to use anywhere)
// ---------------------------------------------------------------------------

export interface ActivityColorConfig {
    color: string;
    bg: string;
    border: string;
}

export const ACTIVITY_COLORS: Record<ActivityType, ActivityColorConfig> = {
    call: { color: "#33084E", bg: "#33084E15", border: "#33084E40" },
    email: { color: "#AF580B", bg: "#AF580B15", border: "#AF580B40" },
    meeting: { color: "#074616", bg: "#07461615", border: "#07461640" },
    note: { color: "#6b7280", bg: "#f0f0f5", border: "#d1d5db" },
    task: { color: "#1d4ed8", bg: "#1d4ed815", border: "#1d4ed840" },
    status_change: { color: "#7c3aed", bg: "#7c3aed15", border: "#7c3aed40" },
    follow_up: { color: "#b45309", bg: "#b4530915", border: "#b4530940" },
    proposal_sent: { color: "#0369a1", bg: "#0369a115", border: "#0369a140" },
    document: { color: "#374151", bg: "#37415115", border: "#37415140" },
    other: { color: "#6b7280", bg: "#f0f0f5", border: "#d1d5db" },
};

// ---------------------------------------------------------------------------
// Full per-type config including icon and label (JSX — import from .tsx only)
// ---------------------------------------------------------------------------

export interface ActivityFullConfig extends ActivityColorConfig {
    icon: React.ReactNode;
    label: string;
}

export const ACTIVITY_CONFIG: Record<ActivityType, ActivityFullConfig> = {
    call: { ...ACTIVITY_COLORS.call, icon: <Phone size={13} />, label: "Call" },
    email: { ...ACTIVITY_COLORS.email, icon: <Mail size={13} />, label: "Email" },
    meeting: { ...ACTIVITY_COLORS.meeting, icon: <Calendar size={13} />, label: "Meeting" },
    note: { ...ACTIVITY_COLORS.note, icon: <FileText size={13} />, label: "Note" },
    task: { ...ACTIVITY_COLORS.task, icon: <CheckSquare size={13} />, label: "Task" },
    status_change: { ...ACTIVITY_COLORS.status_change, icon: <ArrowRightLeft size={13} />, label: "Status Change" },
    follow_up: { ...ACTIVITY_COLORS.follow_up, icon: <Bell size={13} />, label: "Follow-up" },
    proposal_sent: { ...ACTIVITY_COLORS.proposal_sent, icon: <Send size={13} />, label: "Proposal Sent" },
    document: { ...ACTIVITY_COLORS.document, icon: <Paperclip size={13} />, label: "Document" },
    other: { ...ACTIVITY_COLORS.other, icon: <MoreHorizontal size={13} />, label: "Other" },
};

/** Fallback for any unknown type that might arrive from the API. */
export const ACTIVITY_FALLBACK_CONFIG: ActivityFullConfig = {
    icon: <MoreHorizontal size={13} />,
    color: "#6b7280",
    bg: "#f0f0f5",
    border: "#d1d5db",
    label: "Activity",
};

// ---------------------------------------------------------------------------
// The 4 types surfaced in the Log / Edit modals UI
// ---------------------------------------------------------------------------

export interface ActivityTypeOption {
    type: ActivityType;
    label: string;
    icon: React.ReactNode;
}

export const MODAL_ACTIVITY_TYPES: ActivityTypeOption[] = [
    { type: "call", label: "Call", icon: <Phone size={15} /> },
    { type: "email", label: "Email", icon: <Mail size={15} /> },
    { type: "meeting", label: "Meeting", icon: <Calendar size={15} /> },
    { type: "note", label: "Note", icon: <FileText size={15} /> },
];
