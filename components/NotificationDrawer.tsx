"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Briefcase,
  UserCheck,
  Upload,
  Star,
  Tag,
  CalendarClock,
  UserPlus,
  LogIn,
  LogOut,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  useNotificationList,
  useMarkAsRead,
  useMarkAllRead,
  useDeleteNotification,
  triggerBrowserNotification,
  type AppNotification,
} from "@/lib/hooks/useNotifications";

// ─── Type → Icon / Color map ──────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; color: string; label: string }> = {
  "crm.lead_created":           { icon: <Briefcase size={14} />,     bg: "#f3e8ff", color: "#33084E", label: "New Lead" },
  "crm.lead_assigned":          { icon: <UserCheck size={14} />,     bg: "#dcfce7", color: "#074616", label: "Lead Assigned" },
  "crm.lead_imported":          { icon: <Upload size={14} />,        bg: "#fef3c7", color: "#AF580B", label: "Leads Imported" },
  "project.valuable_created":   { icon: <Star size={14} />,          bg: "#fef3c7", color: "#AF580B", label: "Valuable Project" },
  "project.tag_created":        { icon: <Tag size={14} />,           bg: "#f3e8ff", color: "#33084E", label: "Tag Created" },
  "project.tag_assigned":       { icon: <Tag size={14} />,           bg: "#dcfce7", color: "#074616", label: "Tag Assigned" },
  "attendance.clock_in":        { icon: <LogIn size={14} />,         bg: "#dcfce7", color: "#074616", label: "Clocked In" },
  "attendance.clock_out":       { icon: <LogOut size={14} />,        bg: "#fee2e2", color: "#991b1b", label: "Clocked Out" },
  "leave.request_created":      { icon: <CalendarClock size={14} />, bg: "#fef3c7", color: "#AF580B", label: "Leave Request" },
  "leave.status_updated":       { icon: <CalendarClock size={14} />, bg: "#dcfce7", color: "#074616", label: "Leave Updated" },
  "user.created_by_supervisor": { icon: <UserPlus size={14} />,      bg: "#f3e8ff", color: "#33084E", label: "New User" },
};

const FALLBACK_CONFIG = { icon: <Bell size={14} />, bg: "#f3f4f6", color: "#6b7280", label: "Notification" };

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? FALLBACK_CONFIG;
}

const PRIORITY_DOT: Record<string, string> = {
  high:   "#ef4444",
  medium: "#f59e0b",
  low:    "#d1d5db",
};

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotificationRow({
  n,
  onRead,
  onDelete,
}: {
  n: AppNotification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = getTypeConfig(n.type);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-start transition-colors"
      style={{
        padding: "14px 16px",
        gap: "12px",
        background: n.is_read ? "white" : "#faf5ff",
        borderBottom: "1px solid #f0f0f5",
      }}
    >
      {/* Unread left accent */}
      {!n.is_read && (
        <div
          className="absolute left-0 top-3 bottom-3 rounded-r-full"
          style={{ width: "3px", background: "#33084E" }}
        />
      )}

      {/* Type icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0" style={{ gap: "2px", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between" style={{ gap: "8px" }}>
          <span className="text-[12px] font-bold text-(--text-primary) truncate">{n.title}</span>
          <span className="text-[10px] text-[#9ca3af] shrink-0">{relativeTime(n.created_at)}</span>
        </div>
        <p className="text-[11px] text-[#6b7280] leading-relaxed line-clamp-2">{n.message}</p>
        <div className="flex items-center" style={{ gap: "6px", marginTop: "4px" }}>
          <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: PRIORITY_DOT[n.priority] ?? "#d1d5db" }}
            title={`${n.priority} priority`}
          />
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div
        className="flex items-center shrink-0 transition-all"
        style={{ gap: "4px", opacity: hovered ? 1 : 0 }}
      >
        {!n.is_read && (
          <button
            onClick={() => onRead(n.id)}
            title="Mark as read"
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-[#dcfce7]"
            style={{ color: "#074616" }}
          >
            <Check size={12} />
          </button>
        )}
        <button
          onClick={() => onDelete(n.id)}
          title="Delete"
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-[#fee2e2]"
          style={{ color: "#991b1b" }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
}

export function NotificationDrawer({ open, onClose, unreadCount }: NotificationDrawerProps) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [perPage, setPerPage] = useState(20);
  // Track IDs seen on previous poll to fire browser notifications for truly new ones
  const prevIdsRef = useRef(new Set<number>());
  const isFirstFetchRef = useRef(true);
  // Locally deleted IDs so they disappear immediately before refetch
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  const { data, isLoading, isFetching } = useNotificationList(unreadOnly, perPage);
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllRead();
  const deleteNotif = useDeleteNotification();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Fire browser notifications for newly arriving items — no setState here
  useEffect(() => {
    const incoming = data?.data;
    if (!incoming) return;
    if (!isFirstFetchRef.current) {
      incoming.forEach((n) => {
        if (!prevIdsRef.current.has(n.id)) {
          triggerBrowserNotification(n);
        }
      });
    }
    isFirstFetchRef.current = false;
    prevIdsRef.current = new Set(incoming.map((n) => n.id));
  }, [data]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Visible items: filter out locally deleted ones
  const items = (data?.data ?? []).filter((n) => !deletedIds.has(n.id));

  const pagination = data?.meta?.pagination;
  const hasMore = pagination ? pagination.current_page < pagination.last_page : false;

  const handleFilterChange = (next: "all" | "unread") => {
    setUnreadOnly(next === "unread");
    setPerPage(20);
    setDeletedIds(new Set());
  };

  const handleRead = (id: number) => markAsRead.mutate([id]);

  const handleDelete = (id: number) => {
    setDeletedIds((prev) => new Set([...prev, id]));
    deleteNotif.mutate(id);
  };

  const handleMarkAllRead = () => markAllRead.mutate();

  const handleLoadMore = () => setPerPage((p) => p + 20);

  const filter: "all" | "unread" = unreadOnly ? "unread" : "all";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: open ? "blur(2px)" : "none",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-white"
        style={{
          width: "min(420px, 100vw)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          borderLeft: "1px solid #f0f0f5",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0 border-b border-[#f0f0f5]"
          style={{ padding: "20px 20px 16px" }}
        >
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f3e8ff" }}>
              <Bell size={16} style={{ color: "#33084E" }} />
            </div>
            <div>
              <div className="flex items-center" style={{ gap: "7px" }}>
                <h2 className="text-[16px] font-bold text-(--text-primary)">Notifications</h2>
                {unreadCount > 0 && (
                  <span
                    className="inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white min-w-5 h-5"
                    style={{ padding: "0 6px", background: "#33084E" }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#9ca3af]">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>

          <div className="flex items-center" style={{ gap: "6px" }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                title="Mark all as read"
                className="flex items-center rounded-xl border border-[#f0f0f5] text-[11px] font-bold text-[#6b7280] hover:border-[#33084E] hover:text-[#33084E] transition-all disabled:opacity-50"
                style={{ padding: "6px 10px", gap: "4px" }}
              >
                {markAllRead.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                All read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-[#f0f0f5] text-[#9ca3af] hover:text-(--text-primary) hover:border-[#33084E] transition-all"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center shrink-0 border-b border-[#f0f0f5]" style={{ padding: "0 20px" }}>
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className="relative text-[12px] font-bold capitalize transition-colors"
              style={{
                padding: "10px 12px",
                paddingBottom: "12px",
                color: filter === f ? "#33084E" : "#9ca3af",
              }}
            >
              {f === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              {filter === f && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full" style={{ background: "#33084E" }} />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {isLoading ? (
            <div className="flex flex-col">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start animate-pulse" style={{ padding: "14px 16px", gap: "12px", borderBottom: "1px solid #f0f0f5" }}>
                  <div className="w-8 h-8 rounded-xl shrink-0" style={{ background: "#f3f4f6" }} />
                  <div className="flex-1" style={{ gap: "6px", display: "flex", flexDirection: "column" }}>
                    <div className="h-3 rounded-full w-2/3" style={{ background: "#f3f4f6" }} />
                    <div className="h-2.5 rounded-full w-full" style={{ background: "#f3f4f6" }} />
                    <div className="h-2.5 rounded-full w-1/2" style={{ background: "#f3f4f6" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center" style={{ padding: "48px 24px", gap: "14px" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#f3f4f6" }}>
                <BellOff size={24} className="text-[#9ca3af]" />
              </div>
              <div style={{ gap: "4px", display: "flex", flexDirection: "column" }}>
                <p className="text-[15px] font-bold text-(--text-primary)">
                  {filter === "unread" ? "No unread notifications" : "All clear!"}
                </p>
                <p className="text-[12px] text-[#9ca3af]">
                  {filter === "unread" ? "You're all caught up." : "No notifications yet — check back later."}
                </p>
              </div>
              {filter === "unread" && (
                <button
                  onClick={() => handleFilterChange("all")}
                  className="text-[12px] font-bold transition-colors"
                  style={{ color: "#33084E" }}
                >
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            <>
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                />
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="flex items-center justify-center" style={{ padding: "16px" }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="flex items-center rounded-xl border border-[#f0f0f5] text-[12px] font-bold text-[#6b7280] hover:border-[#33084E] hover:text-[#33084E] transition-all disabled:opacity-50"
                    style={{ padding: "8px 16px", gap: "6px" }}
                  >
                    {isFetching ? <Loader2 size={13} className="animate-spin" /> : <ChevronDown size={13} />}
                    Load more
                  </button>
                </div>
              )}

              {/* Subtle refresh indicator */}
              {isFetching && !isLoading && (
                <div className="flex items-center justify-center" style={{ padding: "8px", gap: "5px" }}>
                  <Loader2 size={11} className="animate-spin text-[#9ca3af]" />
                  <span className="text-[10px] text-[#9ca3af]">Refreshing…</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
