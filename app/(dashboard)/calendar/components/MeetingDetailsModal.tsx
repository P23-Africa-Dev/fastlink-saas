"use client";

import React, { useState } from "react";
import { X, Video, Calendar, Users, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CalendarEvent } from "@/lib/types";
import { useUpdateMeeting, useDeleteMeeting } from "../hooks/useCalendar";

interface MeetingDetailsModalProps {
  event: CalendarEvent;
  canManage: boolean;
  onClose: () => void;
}

type Meta = Record<string, unknown>;

function formatMeetingTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "Africa/Lagos",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toLocalDt(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toApiDt(local: string): string {
  return local.replace("T", " ") + ":00";
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: "#dcfce7", color: "#074616" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  completed: { bg: "#e0e7ff", color: "#3730a3" },
};

function statusStyle(status: string) {
  return STATUS_STYLE[status] ?? { bg: "#f3f4f6", color: "#374151" };
}

export function MeetingDetailsModal({
  event,
  canManage,
  onClose,
}: MeetingDetailsModalProps) {
  const meta = event.meta as Meta;
  const meetingId = meta.meeting_id as number;
  const meetLink = (meta.meet_link as string | null) ?? null;
  const calendarLink = (meta.calendar_link as string | null) ?? null;
  const organizer = (meta.organizer as { id: number; name: string; email: string } | null) ?? null;
  const guestCount = (meta.guest_count as number) ?? 0;
  const startAt = (meta.start_at as string) ?? "";
  const endAt = (meta.end_at as string) ?? "";
  const timezone = (meta.timezone as string) ?? "Africa/Lagos";

  const [mode, setMode] = useState<"view" | "reschedule" | "cancel">("view");
  const [newStart, setNewStart] = useState(() => (startAt ? toLocalDt(startAt) : ""));
  const [newEnd, setNewEnd] = useState(() => (endAt ? toLocalDt(endAt) : ""));
  const [saving, setSaving] = useState(false);

  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  async function handleReschedule() {
    if (!newStart || !newEnd || newEnd <= newStart || saving) return;
    setSaving(true);
    try {
      await updateMeeting.mutateAsync({
        id: meetingId,
        payload: { start_at: toApiDt(newStart), end_at: toApiDt(newEnd) },
      });
      toast.success("Meeting rescheduled.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reschedule meeting."));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (saving) return;
    setSaving(true);
    try {
      await deleteMeeting.mutateAsync(meetingId);
      toast.success("Meeting cancelled.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to cancel meeting."));
    } finally {
      setSaving(false);
    }
  }

  const { bg: statusBg, color: statusColor } = statusStyle(event.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#f0f0f5] overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between bg-[#f8f8fc] border-b border-[#f0f0f5]"
          style={{ padding: "16px 18px" }}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#9ca3af]">
              Meeting
            </p>
            <h3 className="text-[16px] font-bold text-(--text-primary) truncate">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-(--text-primary) shrink-0 ml-3"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="flex flex-col overflow-y-auto"
          style={{ padding: "16px 18px", gap: "12px", maxHeight: "70vh" }}
        >
          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg border border-[#f0f0f5] bg-[#fcfcff]"
              style={{ padding: "10px" }}
            >
              <p className="text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                Starts
              </p>
              <p className="text-[12px] font-semibold text-(--text-primary)">
                {startAt ? formatMeetingTime(startAt) : "—"}
              </p>
            </div>
            <div
              className="rounded-lg border border-[#f0f0f5] bg-[#fcfcff]"
              style={{ padding: "10px" }}
            >
              <p className="text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                Ends
              </p>
              <p className="text-[12px] font-semibold text-(--text-primary)">
                {endAt ? formatMeetingTime(endAt) : "—"}
              </p>
            </div>
          </div>

          {/* Status + Organizer */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg border border-[#f0f0f5] bg-[#fcfcff]"
              style={{ padding: "10px" }}
            >
              <p className="text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                Status
              </p>
              <span
                className="inline-flex items-center rounded-md text-[11px] font-bold"
                style={{ padding: "2px 8px", background: statusBg, color: statusColor }}
              >
                {event.status || "scheduled"}
              </span>
            </div>
            <div
              className="rounded-lg border border-[#f0f0f5] bg-[#fcfcff]"
              style={{ padding: "10px" }}
            >
              <p className="text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                Organizer
              </p>
              <p className="text-[12px] font-semibold text-(--text-primary) truncate">
                {organizer?.name ?? "—"}
              </p>
            </div>
          </div>

          {/* Attendees + Timezone */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg border border-[#f0f0f5] bg-[#fcfcff] flex items-center gap-2"
              style={{ padding: "10px" }}
            >
              <Users size={14} className="text-[#9ca3af] shrink-0" />
              <span className="text-[12px] font-semibold text-(--text-primary)">
                {guestCount} attendee{guestCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div
              className="rounded-lg border border-[#f0f0f5] bg-[#fcfcff]"
              style={{ padding: "10px" }}
            >
              <p className="text-[10px] font-bold uppercase text-[#9ca3af] mb-1">
                Timezone
              </p>
              <p className="text-[11px] font-semibold text-(--text-primary) truncate">
                {timezone}
              </p>
            </div>
          </div>

          {/* Join / Calendar CTAs */}
          {(meetLink || calendarLink) && (
            <div className="flex gap-2">
              {meetLink && (
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-9 rounded-xl bg-[#33084E] text-white text-[12px] font-bold flex items-center justify-center gap-1.5"
                >
                  <Video size={13} />
                  Join Meet
                </a>
              )}
              {calendarLink && (
                <a
                  href={calendarLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-9 rounded-xl border border-[#f0f0f5] text-[#6b7280] text-[12px] font-bold flex items-center justify-center gap-1.5 hover:border-[#d1d5db]"
                >
                  <Calendar size={13} />
                  Open Calendar
                </a>
              )}
            </div>
          )}

          {/* Manage CTAs */}
          {canManage && mode === "view" && (
            <div className="flex gap-2">
              <button
                onClick={() => setMode("reschedule")}
                className="flex-1 h-9 rounded-xl border border-[#f0f0f5] text-[#6b7280] text-[12px] font-bold flex items-center justify-center gap-1.5 hover:border-[#d1d5db]"
              >
                <RefreshCw size={13} />
                Reschedule
              </button>
              <button
                onClick={() => setMode("cancel")}
                className="flex-1 h-9 rounded-xl border border-[#fca5a5] text-[#b91c1c] text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#fff7f7]"
              >
                <Trash2 size={13} />
                Cancel Meeting
              </button>
            </div>
          )}

          {/* Reschedule form */}
          {mode === "reschedule" && (
            <div
              className="rounded-xl border border-[#f0f0f5] bg-[#fcfcff] flex flex-col gap-3"
              style={{ padding: "12px" }}
            >
              <p className="text-[13px] font-bold text-(--text-primary)">
                Reschedule Meeting
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#6b7280]">
                    New start
                  </label>
                  <input
                    type="datetime-local"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[12px] outline-none focus:border-[#33084E] transition-colors"
                    style={{ padding: "8px 10px" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#6b7280]">
                    New end
                  </label>
                  <input
                    type="datetime-local"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[12px] outline-none focus:border-[#33084E] transition-colors"
                    style={{ padding: "8px 10px" }}
                  />
                </div>
              </div>
              {newEnd && newStart && newEnd <= newStart && (
                <p className="text-[11px] text-[#b91c1c] font-semibold">
                  End must be after start.
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setMode("view")}
                  className="h-8 rounded-xl border border-[#e5e7eb] text-[#6b7280] text-[11px] font-bold"
                  style={{ padding: "0 12px" }}
                >
                  Back
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!newStart || !newEnd || newEnd <= newStart || saving}
                  className="h-8 rounded-xl bg-[#33084E] text-white text-[11px] font-bold disabled:opacity-60"
                  style={{ padding: "0 12px" }}
                >
                  {saving ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          )}

          {/* Cancel confirmation */}
          {mode === "cancel" && (
            <div
              className="rounded-xl border border-[#fca5a5] bg-[#fff7f7] flex flex-col gap-3"
              style={{ padding: "12px" }}
            >
              <p className="text-[13px] font-bold text-[#b91c1c]">
                Cancel this meeting?
              </p>
              <p className="text-[12px] text-[#6b7280]">
                This will permanently cancel the meeting and notify attendees.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setMode("view")}
                  className="h-8 rounded-xl border border-[#e5e7eb] text-[#6b7280] text-[11px] font-bold"
                  style={{ padding: "0 12px" }}
                >
                  Go back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="h-8 rounded-xl bg-[#b91c1c] text-white text-[11px] font-bold disabled:opacity-60"
                  style={{ padding: "0 12px" }}
                >
                  {saving ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
