"use client";

import React, { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { CreateMeetingPayload, Project, User } from "@/lib/types";

interface CreateMeetingModalProps {
  selectedDate: string;
  projects: Project[];
  users: User[];
  onClose: () => void;
  onSave: (payload: CreateMeetingPayload) => Promise<void>;
}

const inputCls =
  "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-[#33084E] transition-colors";
const labelCls = "text-[13px] font-bold text-(--text-primary)";

const REMINDER_OPTIONS = [
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
];

function toDefaultDateTime(date: string, hour: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date}T${pad(hour)}:00`;
}

function toApiDateTime(local: string): string {
  return local.replace("T", " ") + ":00";
}

export function CreateMeetingModal({
  selectedDate,
  projects,
  users,
  onClose,
  onSave,
}: CreateMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState(() => toDefaultDateTime(selectedDate, 10));
  const [endAt, setEndAt] = useState(() => toDefaultDateTime(selectedDate, 11));
  const [guestIds, setGuestIds] = useState<number[]>([]);
  const [guestEmailInput, setGuestEmailInput] = useState("");
  const [guestEmails, setGuestEmails] = useState<string[]>([]);
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([15]);
  const [projectId, setProjectId] = useState("");
  const [shareMeetLink, setShareMeetLink] = useState(true);
  const [shareCalLink, setShareCalLink] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
      ),
    [users, userSearch]
  );

  const projectOptions = useMemo(
    () => [
      { value: "", label: "No project" },
      ...projects.map((p) => ({ value: String(p.id), label: p.name })),
    ],
    [projects]
  );

  function toggleGuest(id: number) {
    setGuestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleReminder(value: number) {
    setReminderMinutes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  }

  function addGuestEmail() {
    const email = guestEmailInput.trim();
    if (
      email &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      !guestEmails.includes(email)
    ) {
      setGuestEmails((prev) => [...prev, email]);
      setGuestEmailInput("");
    }
  }

  function removeGuestEmail(email: string) {
    setGuestEmails((prev) => prev.filter((e) => e !== email));
  }

  const isValid =
    !!title.trim() && !!startAt && !!endAt && endAt > startAt;

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        start_at: toApiDateTime(startAt),
        end_at: toApiDateTime(endAt),
        timezone: "Africa/Lagos",
        guest_ids: guestIds.length ? guestIds : undefined,
        guest_emails: guestEmails.length ? guestEmails : undefined,
        reminder_minutes: reminderMinutes.length ? reminderMinutes : undefined,
        project_id: projectId ? Number(projectId) : undefined,
        share_meeting_link: shareMeetLink,
        share_calendar_link: shareCalLink,
        is_recurring: false,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        <div
          className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc]"
          style={{ padding: "18px 22px" }}
        >
          <h2 className="text-lg font-bold text-(--text-primary)">
            Schedule Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-(--text-primary) transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="overflow-y-auto"
          style={{
            padding: "22px",
            maxHeight: "72vh",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Title */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>
              Meeting title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              style={{ padding: "12px 16px" }}
              placeholder="e.g. Sales Strategy Meeting"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              style={{ padding: "12px 16px" }}
              placeholder="Optional agenda or notes"
            />
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "14px" }}>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>
                Start <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className={inputCls}
                style={{ padding: "12px 16px" }}
              />
            </div>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className={labelCls}>
                End <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className={inputCls}
                style={{ padding: "12px 16px" }}
              />
            </div>
          </div>
          {endAt && startAt && endAt <= startAt && (
            <p className="text-[12px] text-[#b91c1c] font-semibold">
              End time must be after start time.
            </p>
          )}

          {/* Project */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Link to project</label>
            <CustomSelect
              value={projectId}
              onChange={setProjectId}
              options={projectOptions}
              fullWidth
            />
          </div>

          {/* Internal guests */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Invite team members</label>
            <div className="rounded-xl border border-[#f0f0f5] overflow-hidden">
              <div
                className="flex items-center gap-2 border-b border-[#f0f0f5] bg-[#f8f8fc]"
                style={{ padding: "8px 12px" }}
              >
                <Search size={14} className="text-[#9ca3af] shrink-0" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="flex-1 bg-transparent text-[12px] outline-none text-(--text-primary) placeholder:text-[#9ca3af]"
                  placeholder="Search by name or email..."
                />
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "140px" }}>
                {filteredUsers.length === 0 ? (
                  <p
                    className="text-[12px] text-[#9ca3af] text-center"
                    style={{ padding: "12px" }}
                  >
                    No users found.
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-[#f8f8fc]"
                      style={{ padding: "7px 12px" }}
                    >
                      <input
                        type="checkbox"
                        checked={guestIds.includes(u.id)}
                        onChange={() => toggleGuest(u.id)}
                        className="rounded accent-[#33084E]"
                      />
                      <span className="text-[12px] font-semibold text-(--text-primary)">
                        {u.name}
                      </span>
                      <span className="text-[11px] text-[#9ca3af] truncate">
                        {u.email}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
            {guestIds.length > 0 && (
              <p className="text-[11px] text-[#6b7280]">
                {guestIds.length} member{guestIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* External guest emails */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>External guests</label>
            <div className="flex gap-2">
              <input
                value={guestEmailInput}
                onChange={(e) => setGuestEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addGuestEmail();
                  }
                }}
                className={`flex-1 ${inputCls}`}
                style={{ padding: "10px 14px" }}
                placeholder="email@example.com — press Enter to add"
              />
              <button
                type="button"
                onClick={addGuestEmail}
                className="h-10 rounded-xl border border-[#f0f0f5] text-[#6b7280] text-[12px] font-bold shrink-0"
                style={{ padding: "0 14px" }}
              >
                Add
              </button>
            </div>
            {guestEmails.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {guestEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-md bg-[#f3f4f6] text-[11px] font-semibold text-[#374151]"
                    style={{ padding: "3px 8px" }}
                  >
                    {email}
                    <button
                      onClick={() => removeGuestEmail(email)}
                      className="text-[#9ca3af] hover:text-[#374151]"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reminders */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Reminders</label>
            <div className="flex flex-wrap gap-3">
              {REMINDER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={reminderMinutes.includes(opt.value)}
                    onChange={() => toggleReminder(opt.value)}
                    className="rounded accent-[#33084E]"
                  />
                  <span className="text-[12px] font-semibold text-[#6b7280]">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sharing */}
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <label className={labelCls}>Sharing</label>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareMeetLink}
                  onChange={(e) => setShareMeetLink(e.target.checked)}
                  className="rounded accent-[#33084E]"
                />
                <span className="text-[12px] font-semibold text-[#6b7280]">
                  Share Google Meet link with guests
                </span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareCalLink}
                  onChange={(e) => setShareCalLink(e.target.checked)}
                  className="rounded accent-[#33084E]"
                />
                <span className="text-[12px] font-semibold text-[#6b7280]">
                  Share Google Calendar link with guests
                </span>
              </label>
            </div>
          </div>
        </div>

        <div
          className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]"
          style={{ padding: "16px 22px", gap: "10px" }}
        >
          <button
            className="h-10 rounded-xl border border-[#e5e7eb] text-[#6b7280] text-[12px] font-bold"
            style={{ padding: "0 14px" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="h-10 rounded-xl bg-[#33084E] text-white text-[12px] font-bold disabled:opacity-60"
            style={{ padding: "0 14px" }}
            onClick={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
