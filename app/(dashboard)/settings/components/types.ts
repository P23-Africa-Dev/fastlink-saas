export type UserRole = "admin" | "supervisor" | "staff";

export interface User {
  id:         number;
  name:       string;
  email:      string;
  role:       UserRole;
  suspended:  boolean;
  created_at: string;
  initials:   string;
  color:      string;
  department?: string;
  last_active?: string;
}

export interface Pagination {
  total:        number;
  per_page:     number;
  current_page: number;
  last_page:    number;
}

// ── Role config ────────────────────────────────────────────────────────────────

export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; description: string }> = {
  admin:      { label: "Admin",      color: "#33084E", bg: "#f3e8ff", description: "Full access to all modules and settings" },
  supervisor: { label: "Supervisor", color: "#AF580B", bg: "#fef3c7", description: "Can manage team, approve leaves and decisions" },
  staff:      { label: "Staff",      color: "#074616", bg: "#dcfce7", description: "Standard access to assigned modules" },
};

export const USER_ROLES: UserRole[] = ["admin", "supervisor", "staff"];

// ── Avatar color pool ─────────────────────────────────────────────────────────

const COLORS = ["#33084E", "#AF580B", "#074616", "#1d4ed8", "#be185d", "#0f766e", "#7c3aed", "#b45309"];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function ago(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function active(hrs: number) {
  const d = new Date();
  d.setHours(d.getHours() - hrs);
  return d.toISOString();
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const RAW: Omit<User, "initials" | "color">[] = [
  { id: 1,  name: "Alex Morgan",    email: "alex@fastlink.io",    role: "admin",      suspended: false, created_at: ago(200), department: "Engineering",  last_active: active(1) },
  { id: 2,  name: "Jordan Lee",     email: "jordan@fastlink.io",  role: "supervisor", suspended: false, created_at: ago(180), department: "Operations",   last_active: active(3) },
  { id: 3,  name: "Sam Rivera",     email: "sam@fastlink.io",     role: "supervisor", suspended: false, created_at: ago(160), department: "Sales",        last_active: active(0) },
  { id: 4,  name: "Taylor Brooks",  email: "taylor@fastlink.io",  role: "staff",      suspended: false, created_at: ago(120), department: "Marketing",    last_active: active(24) },
  { id: 5,  name: "Casey Kim",      email: "casey@fastlink.io",   role: "staff",      suspended: false, created_at: ago(90),  department: "Design",       last_active: active(2) },
  { id: 6,  name: "Morgan Davis",   email: "morgan@fastlink.io",  role: "staff",      suspended: true,  created_at: ago(75),  department: "Support",      last_active: active(720) },
  { id: 7,  name: "Riley Johnson",  email: "riley@fastlink.io",   role: "staff",      suspended: false, created_at: ago(60),  department: "Engineering",  last_active: active(5) },
  { id: 8,  name: "Avery Williams", email: "avery@fastlink.io",   role: "supervisor", suspended: false, created_at: ago(45),  department: "Product",      last_active: active(12) },
  { id: 9,  name: "Quinn Martinez", email: "quinn@fastlink.io",   role: "staff",      suspended: false, created_at: ago(30),  department: "Sales",        last_active: active(8) },
  { id: 10, name: "Drew Thompson",  email: "drew@fastlink.io",    role: "staff",      suspended: true,  created_at: ago(20),  department: "Support",      last_active: active(1440) },
  { id: 11, name: "Blake Anderson", email: "blake@fastlink.io",   role: "staff",      suspended: false, created_at: ago(14),  department: "Engineering",  last_active: active(0) },
  { id: 12, name: "Jamie Wilson",   email: "jamie@fastlink.io",   role: "staff",      suspended: false, created_at: ago(7),   department: "Marketing",    last_active: active(1) },
];

export const MOCK_USERS: User[] = RAW.map((u, i) => ({
  ...u,
  initials: initials(u.name),
  color:    COLORS[i % COLORS.length],
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtLastActive(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 2)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
