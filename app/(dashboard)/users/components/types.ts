export type LeaveStatus = "pending" | "approved" | "rejected" | "modified" | "cancelled";
export type LeaveType   = "annual" | "sick" | "maternity" | "paternity" | "unpaid" | "study" | "compassionate";

export interface LeaveRequest {
  id:                   number;
  user_id:              number;
  user_name:            string;
  user_initials:        string;
  user_color:           string;
  type:                 LeaveType;
  reason:               string;
  start_date:           string;
  end_date:             string;
  supervisor_id:        number;
  supervisor_name:      string;
  supervisor_initials:  string;
  status:               LeaveStatus;
  decision_note:        string | null;
  supervisor_note:      string | null;
  modified_start_date:  string | null;
  modified_end_date:    string | null;
  sender_response_note: string | null;
  created_at:           string;
  days:                 number;
}

export interface Pagination {
  total:        number;
  per_page:     number;
  current_page: number;
  last_page:    number;
}

// ── Status config ──────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending:   { label: "Pending",   color: "#AF580B", bg: "#fef3c7", dot: "#d97706" },
  approved:  { label: "Approved",  color: "#074616", bg: "#dcfce7", dot: "#16a34a" },
  rejected:  { label: "Rejected",  color: "#991b1b", bg: "#fee2e2", dot: "#dc2626" },
  modified:  { label: "Modified",  color: "#1d4ed8", bg: "#dbeafe", dot: "#2563eb" },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

// ── Leave type config ──────────────────────────────────────────────────────────

export const TYPE_CONFIG: Record<LeaveType, { label: string; color: string; bg: string }> = {
  annual:        { label: "Annual",        color: "#33084E", bg: "#f3e8ff" },
  sick:          { label: "Sick",          color: "#991b1b", bg: "#fee2e2" },
  maternity:     { label: "Maternity",     color: "#be185d", bg: "#fce7f3" },
  paternity:     { label: "Paternity",     color: "#1d4ed8", bg: "#dbeafe" },
  unpaid:        { label: "Unpaid",        color: "#6b7280", bg: "#f3f4f6" },
  study:         { label: "Study",         color: "#074616", bg: "#dcfce7" },
  compassionate: { label: "Compassionate", color: "#AF580B", bg: "#fef3c7" },
};

export const LEAVE_TYPES: LeaveType[] = ["annual", "sick", "maternity", "paternity", "unpaid", "study", "compassionate"];

// ── Mock team ──────────────────────────────────────────────────────────────────

export const SUPERVISORS = [
  { id: 2, name: "Jordan Lee",    initials: "JL", color: "#AF580B" },
  { id: 3, name: "Sam Rivera",    initials: "SR", color: "#074616" },
  { id: 4, name: "Taylor Brooks", initials: "TB", color: "#1d4ed8" },
];

export const TEAM_MEMBERS = [
  { id: 1,  name: "Alex Morgan",    initials: "AM", color: "#33084E" },
  { id: 2,  name: "Jordan Lee",     initials: "JL", color: "#AF580B" },
  { id: 3,  name: "Sam Rivera",     initials: "SR", color: "#074616" },
  { id: 4,  name: "Taylor Brooks",  initials: "TB", color: "#1d4ed8" },
  { id: 5,  name: "Casey Kim",      initials: "CK", color: "#be185d" },
];

// ── Day count helper ───────────────────────────────────────────────────────────

export function countDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = new Date(end + "T00:00:00").getTime() - new Date(start + "T00:00:00").getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

export function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateRange(start: string, end: string) {
  if (!start || !end) return "—";
  const s = new Date(start + "T00:00:00");
  const e = new Date(end   + "T00:00:00");
  const so = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const eo = e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${so} – ${eo}`;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

function ago(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function future(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function past(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export const MOCK_REQUESTS: LeaveRequest[] = [
  {
    id: 1, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", user_color: "#33084E",
    type: "annual", reason: "Family vacation to the coast. We've been planning this for months.",
    start_date: future(10), end_date: future(14), supervisor_id: 2,
    supervisor_name: "Jordan Lee", supervisor_initials: "JL",
    status: "pending", decision_note: null, supervisor_note: null,
    modified_start_date: null, modified_end_date: null, sender_response_note: null,
    created_at: ago(2), days: 5,
  },
  {
    id: 2, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", user_color: "#33084E",
    type: "sick", reason: "Flu symptoms and doctor-advised rest.",
    start_date: past(5), end_date: past(3), supervisor_id: 2,
    supervisor_name: "Jordan Lee", supervisor_initials: "JL",
    status: "approved", decision_note: "Get well soon! Approved.", supervisor_note: null,
    modified_start_date: null, modified_end_date: null, sender_response_note: null,
    created_at: ago(6), days: 3,
  },
  {
    id: 3, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", user_color: "#33084E",
    type: "study", reason: "Professional certification exam preparation — AWS Solutions Architect.",
    start_date: future(20), end_date: future(21), supervisor_id: 3,
    supervisor_name: "Sam Rivera", supervisor_initials: "SR",
    status: "modified", decision_note: null,
    supervisor_note: "Can you shift by one day? The team has a critical sprint review on the 20th.",
    modified_start_date: future(21), modified_end_date: future(22),
    sender_response_note: null, created_at: ago(4), days: 2,
  },
  {
    id: 4, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", user_color: "#33084E",
    type: "annual", reason: "Christmas and New Year break.",
    start_date: past(40), end_date: past(34), supervisor_id: 2,
    supervisor_name: "Jordan Lee", supervisor_initials: "JL",
    status: "rejected", decision_note: "We are short-staffed during this period. Please resubmit for a shorter window.", supervisor_note: null,
    modified_start_date: null, modified_end_date: null, sender_response_note: null,
    created_at: ago(45), days: 7,
  },
  {
    id: 5, user_id: 5, user_name: "Casey Kim", user_initials: "CK", user_color: "#be185d",
    type: "maternity", reason: "Maternity leave starting after delivery.",
    start_date: future(5), end_date: future(95), supervisor_id: 4,
    supervisor_name: "Taylor Brooks", supervisor_initials: "TB",
    status: "approved", decision_note: "Congratulations! Fully approved.", supervisor_note: null,
    modified_start_date: null, modified_end_date: null, sender_response_note: null,
    created_at: ago(10), days: 90,
  },
  {
    id: 6, user_id: 3, user_name: "Sam Rivera", user_initials: "SR", user_color: "#074616",
    type: "compassionate", reason: "Bereavement — passing of a family member.",
    start_date: past(3), end_date: past(1), supervisor_id: 4,
    supervisor_name: "Taylor Brooks", supervisor_initials: "TB",
    status: "approved", decision_note: "Our deepest condolences. Approved immediately.", supervisor_note: null,
    modified_start_date: null, modified_end_date: null, sender_response_note: null,
    created_at: ago(4), days: 3,
  },
  {
    id: 7, user_id: 4, user_name: "Taylor Brooks", user_initials: "TB", user_color: "#1d4ed8",
    type: "annual", reason: "Summer getaway with family.",
    start_date: future(30), end_date: future(37), supervisor_id: 2,
    supervisor_name: "Jordan Lee", supervisor_initials: "JL",
    status: "pending", decision_note: null, supervisor_note: null,
    modified_start_date: null, modified_end_date: null, sender_response_note: null,
    created_at: ago(1), days: 8,
  },
  {
    id: 8, user_id: 2, user_name: "Jordan Lee", user_initials: "JL", user_color: "#AF580B",
    type: "unpaid", reason: "Personal project sabbatical.",
    start_date: future(60), end_date: future(74), supervisor_id: 3,
    supervisor_name: "Sam Rivera", supervisor_initials: "SR",
    status: "pending", decision_note: null, supervisor_note: null,
    modified_start_date: null, modified_end_date: null, sender_response_note: null,
    created_at: ago(3), days: 15,
  },
];
