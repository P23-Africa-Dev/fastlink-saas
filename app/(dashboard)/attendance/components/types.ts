export type AttendanceStatus = "present" | "absent" | "late" | "half_day";
export type TodayState = "idle" | "signed_in" | "signed_out";

export interface AttendanceLog {
  id: number;
  user_id: number;
  user_name: string;
  user_initials: string;
  date: string;
  sign_in: string | null;
  sign_out: string | null;
  hours: number | null;
  status: AttendanceStatus;
  note: string;
}

export interface CalendarDay {
  date: string;
  status: AttendanceStatus | null;
  sign_in: string | null;
  sign_out: string | null;
  hours: number | null;
  is_today: boolean;
  is_weekend: boolean;
}

export interface SummaryStats {
  present: number;
  absent: number;
  late: number;
  avg_hours: number;
}

export interface TeamMember {
  id: number;
  name: string;
  initials: string;
  color: string;
}

export const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; dot: string }> = {
  present: { label: "Present", color: "#074616", bg: "#dcfce7", dot: "#16a34a" },
  absent: { label: "Absent", color: "#991b1b", bg: "#fee2e2", dot: "#dc2626" },
  late: { label: "Late", color: "#AF580B", bg: "#fef3c7", dot: "#d97706" },
  half_day: { label: "Half Day", color: "#1d4ed8", bg: "#dbeafe", dot: "#2563eb" },
};

export const MOCK_TEAM: TeamMember[] = [
  { id: 1, name: "Alex Morgan", initials: "AM", color: "#33084E" },
  { id: 2, name: "Jordan Lee", initials: "JL", color: "#AF580B" },
  { id: 3, name: "Sam Rivera", initials: "SR", color: "#074616" },
  { id: 4, name: "Taylor Brooks", initials: "TB", color: "#1d4ed8" },
  { id: 5, name: "Casey Kim", initials: "CK", color: "#be185d" },
];

function makeDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function makeTime(dateStr: string, hour: number, min = 0) {
  return `${dateStr}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

export const MOCK_LOGS: AttendanceLog[] = [
  { id: 1, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(1), sign_in: makeTime(makeDate(1), 9, 2), sign_out: makeTime(makeDate(1), 17, 30), hours: 8.5, status: "present", note: "" },
  { id: 2, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(2), sign_in: makeTime(makeDate(2), 9, 45), sign_out: makeTime(makeDate(2), 17, 0), hours: 7.25, status: "late", note: "Traffic delay" },
  { id: 3, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(4), sign_in: null, sign_out: null, hours: null, status: "absent", note: "Sick leave" },
  { id: 4, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(5), sign_in: makeTime(makeDate(5), 9, 0), sign_out: makeTime(makeDate(5), 13, 0), hours: 4.0, status: "half_day", note: "Doctor appointment" },
  { id: 5, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(6), sign_in: makeTime(makeDate(6), 8, 55), sign_out: makeTime(makeDate(6), 18, 0), hours: 9.0, status: "present", note: "" },
  { id: 6, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(7), sign_in: makeTime(makeDate(7), 9, 1), sign_out: makeTime(makeDate(7), 17, 15), hours: 8.25, status: "present", note: "" },
  { id: 7, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(8), sign_in: makeTime(makeDate(8), 9, 50), sign_out: makeTime(makeDate(8), 17, 0), hours: 7.2, status: "late", note: "Bus was late" },
  { id: 8, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(9), sign_in: makeTime(makeDate(9), 9, 3), sign_out: makeTime(makeDate(9), 17, 30), hours: 8.5, status: "present", note: "" },
  { id: 9, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(11), sign_in: makeTime(makeDate(11), 8, 58), sign_out: makeTime(makeDate(11), 17, 45), hours: 8.8, status: "present", note: "" },
  { id: 10, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(12), sign_in: null, sign_out: null, hours: null, status: "absent", note: "Personal day" },
  { id: 11, user_id: 2, user_name: "Jordan Lee", user_initials: "JL", date: makeDate(1), sign_in: makeTime(makeDate(1), 9, 5), sign_out: makeTime(makeDate(1), 17, 0), hours: 7.9, status: "present", note: "" },
  { id: 12, user_id: 2, user_name: "Jordan Lee", user_initials: "JL", date: makeDate(2), sign_in: null, sign_out: null, hours: null, status: "absent", note: "Sick" },
  { id: 13, user_id: 3, user_name: "Sam Rivera", user_initials: "SR", date: makeDate(1), sign_in: makeTime(makeDate(1), 8, 50), sign_out: makeTime(makeDate(1), 17, 20), hours: 8.5, status: "present", note: "" },
  { id: 14, user_id: 3, user_name: "Sam Rivera", user_initials: "SR", date: makeDate(2), sign_in: makeTime(makeDate(2), 9, 55), sign_out: makeTime(makeDate(2), 17, 0), hours: 7.0, status: "late", note: "" },
  { id: 15, user_id: 4, user_name: "Taylor Brooks", user_initials: "TB", date: makeDate(1), sign_in: makeTime(makeDate(1), 9, 0), sign_out: makeTime(makeDate(1), 13, 30), hours: 4.5, status: "half_day", note: "Half day approved" },
  { id: 16, user_id: 4, user_name: "Taylor Brooks", user_initials: "TB", date: makeDate(3), sign_in: makeTime(makeDate(3), 9, 10), sign_out: makeTime(makeDate(3), 17, 0), hours: 7.8, status: "present", note: "" },
  { id: 17, user_id: 5, user_name: "Casey Kim", user_initials: "CK", date: makeDate(1), sign_in: makeTime(makeDate(1), 8, 45), sign_out: makeTime(makeDate(1), 18, 15), hours: 9.5, status: "present", note: "Stayed for deployment" },
  { id: 18, user_id: 5, user_name: "Casey Kim", user_initials: "CK", date: makeDate(4), sign_in: null, sign_out: null, hours: null, status: "absent", note: "" },
  { id: 19, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(14), sign_in: makeTime(makeDate(14), 9, 0), sign_out: makeTime(makeDate(14), 17, 0), hours: 8.0, status: "present", note: "" },
  { id: 20, user_id: 1, user_name: "Alex Morgan", user_initials: "AM", date: makeDate(15), sign_in: makeTime(makeDate(15), 9, 20), sign_out: makeTime(makeDate(15), 17, 0), hours: 7.7, status: "late", note: "" },
];
