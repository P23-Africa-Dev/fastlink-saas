"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Search, LayoutGrid, List, RotateCcw, ChevronLeft, ChevronRight, Users, Shield, UserCheck, UserX } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

import { UserCard }          from "./components/UserCard";
import { UserDetailDrawer }  from "./components/UserDetailDrawer";
import { CreateUserModal }   from "./components/CreateUserModal";
import { EditUserModal }     from "./components/EditUserModal";
import { DeleteUserModal }   from "./components/DeleteUserModal";

import {
  User, UserRole, ROLE_CONFIG, USER_ROLES,
  MOCK_USERS, fmtDate,
} from "./components/types";

// ── Types ──────────────────────────────────────────────────────────────────────

type Layout   = "grid" | "list";
type OpenMenu = number | null;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [users,      setUsers]      = useState<User[]>(MOCK_USERS);
  const [search,     setSearch]     = useState("");
  const [roleF,      setRoleF]      = useState<UserRole | "all">("all");
  const [layout,     setLayout]     = useState<Layout>("list");
  const [perPage,    setPerPage]    = useState(9);
  const [page,       setPage]       = useState(1);

  // Drawer / modal state
  const [selected,   setSelected]   = useState<User | null>(null);
  const [editing,    setEditing]    = useState<User | null>(null);
  const [deleting,   setDeleting]   = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [openMenu,   setOpenMenu]   = useState<OpenMenu>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Filtered + paginated ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      if (roleF !== "all" && u.role !== roleF) return false;
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !(u.department ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, roleF]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  const resetFilters = () => { setSearch(""); setRoleF("all"); setPage(1); };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalUsers     = users.length;
  const activeCount    = users.filter(u => !u.suspended).length;
  const suspendedCount = users.filter(u => u.suspended).length;
  const adminCount     = users.filter(u => u.role === "admin").length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = (data: { name: string; email: string; password: string; role: UserRole; department?: string }) => {
    const initials = data.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
    const colors   = ["#33084E","#AF580B","#074616","#1d4ed8","#be185d","#0f766e","#7c3aed"];
    const newUser: User = {
      id:         Date.now(),
      name:       data.name,
      email:      data.email,
      role:       data.role,
      suspended:  false,
      created_at: new Date().toISOString(),
      initials,
      color:      colors[users.length % colors.length],
      department: data.department,
      last_active: new Date().toISOString(),
    };
    setUsers(prev => [newUser, ...prev]);
    setShowCreate(false);
  };

  const handleEdit = (data: { name: string; role: UserRole; suspended: boolean; department?: string }) => {
    if (!editing) return;
    setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...data } : u));
    // Sync selected drawer if open on this user
    if (selected?.id === editing.id) setSelected(prev => prev ? { ...prev, ...data } : prev);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    setUsers(prev => prev.filter(u => u.id !== deleting.id));
    if (selected?.id === deleting.id) setSelected(null);
    setDeleting(null);
  };

  const handleToggleSuspend = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, suspended: !u.suspended } : u));
    if (selected?.id === user.id) setSelected(prev => prev ? { ...prev, suspended: !prev.suspended } : prev);
    setOpenMenu(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full bg-white overflow-hidden" style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "20px" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between shrink-0" style={{ gap: "12px" }}>
        <div className="flex flex-col" style={{ gap: "2px" }}>
          <h1 className="text-[22px] font-bold text-(--text-primary)">User Management</h1>
          <p className="text-[13px] text-[#9ca3af]">Manage team members, roles, and account access.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
          style={{ padding: "10px 18px", gap: "7px", background: "#33084E" }}
        >
          <Plus size={15} /> Create User
        </button>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap shrink-0" style={{ gap: "10px" }}>
        {[
          { label: "Total Members",  value: totalUsers,     icon: <Users size={15} />,     bg: "#f3e8ff", color: "#33084E", iconBg: "#ede9fe" },
          { label: "Active",         value: activeCount,    icon: <UserCheck size={15} />, bg: "#dcfce7", color: "#074616", iconBg: "#f0fdf4" },
          { label: "Suspended",      value: suspendedCount, icon: <UserX size={15} />,     bg: "#fee2e2", color: "#991b1b", iconBg: "#fff5f5" },
          { label: "Admins",         value: adminCount,     icon: <Shield size={15} />,    bg: "#fef3c7", color: "#AF580B", iconBg: "#fef9c3" },
        ].map(s => (
          <div key={s.label} className="flex items-center bg-white rounded-2xl border border-[#f0f0f5]" style={{ padding: "12px 18px", gap: "12px", flex: "1 1 130px" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="flex flex-col" style={{ gap: "1px" }}>
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">{s.label}</span>
              <span className="text-[20px] font-bold leading-none" style={{ color: s.color }}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filters + layout toggle ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between shrink-0" style={{ gap: "10px" }}>
        <div className="flex flex-wrap items-center" style={{ gap: "8px" }}>
          {/* Search */}
          <div className="flex items-center rounded-xl border border-[#f0f0f5] bg-white" style={{ gap: "8px", padding: "7px 12px", minWidth: "220px" }}>
            <Search size={13} className="text-[#9ca3af] shrink-0" />
            <input
              type="text"
              placeholder="Search name, email, department…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 text-[12px] font-medium outline-none bg-transparent placeholder:text-[#9ca3af] text-(--text-primary)"
            />
          </div>

          {/* Role filter */}
          <CustomSelect
            value={roleF}
            onChange={v => { setRoleF(v as any); setPage(1); }}
            options={[
              { value: "all", label: "All Roles" },
              ...USER_ROLES.map(r => ({ value: r, label: ROLE_CONFIG[r].label })),
            ]}
            searchPlaceholder="Search roles…"
          />

          {/* Reset */}
          {(search || roleF !== "all") && (
            <button onClick={resetFilters} className="inline-flex items-center rounded-xl border border-[#f0f0f5] bg-white text-[12px] font-bold text-[#9ca3af] hover:text-(--text-primary) transition-all" style={{ padding: "7px 12px", gap: "5px" }}>
              <RotateCcw size={12} /> Reset
            </button>
          )}

          <span className="text-[12px] text-[#9ca3af]">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Layout + per-page */}
        <div className="flex items-center" style={{ gap: "8px" }}>
          <CustomSelect
            value={perPage.toString()}
            onChange={v => { setPerPage(Number(v)); setPage(1); }}
            options={[6, 9, 12, 24].map(n => ({ value: n.toString(), label: `${n} per page` }))}
            searchPlaceholder="Search…"
          />
          <div className="flex items-center rounded-xl border border-[#f0f0f5] bg-white overflow-hidden" style={{ padding: "4px" }}>
            {(["grid", "list"] as Layout[]).map(l => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                style={{ background: layout === l ? "#33084E" : "transparent", color: layout === l ? "white" : "#9ca3af" }}
              >
                {l === "grid" ? <LayoutGrid size={13} /> : <List size={13} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── User list / grid ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: "0", gap: "14px" }}>

        <div className="flex-1 overflow-y-auto" style={{ minHeight: "0" }}>
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center" style={{ gap: "12px" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#f3f4f6" }}>
                <Users size={24} className="text-[#9ca3af]" />
              </div>
              <p className="text-[15px] font-bold text-(--text-primary)">No users found</p>
              <p className="text-[13px] text-[#9ca3af]">Try adjusting your search or filters, or add a new user.</p>
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center rounded-xl text-[13px] font-bold text-white" style={{ padding: "9px 18px", gap: "6px", background: "#33084E" }}>
                <Plus size={13} /> Create User
              </button>
            </div>
          ) : layout === "grid" ? (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "14px" }}>
              {paginated.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onClick={() => setSelected(user)}
                  onEdit={() => { setEditing(user); setOpenMenu(null); }}
                  onDelete={() => { setDeleting(user); setOpenMenu(null); }}
                  onToggleSuspend={() => handleToggleSuspend(user)}
                  menuOpen={openMenu === user.id}
                  onMenuToggle={e => { e.stopPropagation(); setOpenMenu(prev => prev === user.id ? null : user.id); }}
                  menuRef={openMenu === user.id ? menuRef : { current: null }}
                />
              ))}
            </div>
          ) : (
            /* List view */
            <div className="bg-white rounded-2xl border border-[#f0f0f5] overflow-hidden">
              <table className="w-full border-collapse" style={{ minWidth: "600px" }}>
                <thead>
                  <tr className="bg-[#f8f8fc] border-b border-[#f0f0f5]">
                    {["Member", "Role", "Department", "Status", "Joined", "Last Active", ""].map(h => (
                      <th key={h} className="text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider" style={{ padding: "10px 16px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user, i) => {
                    const roleCfg = ROLE_CONFIG[user.role];
                    return (
                      <tr
                        key={user.id}
                        onClick={() => setSelected(user)}
                        className="border-b border-[#f0f0f5] hover:bg-[#f8f8fc] transition-colors cursor-pointer"
                        style={{ background: i % 2 === 0 ? "white" : "#fdfcff" }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div className="flex items-center" style={{ gap: "10px" }}>
                            <div className="rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ width: "32px", height: "32px", background: user.suspended ? "#9ca3af" : user.color }}>
                              {user.initials}
                            </div>
                            <div className="flex flex-col" style={{ gap: "1px" }}>
                              <span className="text-[13px] font-bold text-(--text-primary)">{user.name}</span>
                              <span className="text-[11px] text-[#9ca3af]">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="inline-flex rounded-lg text-[11px] font-bold" style={{ padding: "3px 10px", background: roleCfg.bg, color: roleCfg.color }}>
                            {roleCfg.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="text-[12px] text-[#6b7280]">{user.department ?? "—"}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "3px 10px", gap: "4px", background: user.suspended ? "#fee2e2" : "#dcfce7", color: user.suspended ? "#991b1b" : "#074616" }}>
                            <span className="rounded-full" style={{ width: "5px", height: "5px", background: user.suspended ? "#dc2626" : "#16a34a" }} />
                            {user.suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="text-[12px] text-[#6b7280]">{fmtDate(user.created_at)}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="text-[12px] font-medium text-[#374151]">{user.last_active ? new Date(user.last_active).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                          <div className="flex items-center" style={{ gap: "4px" }}>
                            <button onClick={() => setEditing(user)} className="rounded-lg border border-[#f0f0f5] text-[11px] font-bold text-(--text-primary) hover:border-(--accent-purple) hover:text-(--accent-purple) transition-all" style={{ padding: "4px 10px" }}>Edit</button>
                            <button onClick={() => setDeleting(user)} className="rounded-lg border border-[#f0f0f5] text-[11px] font-bold text-red-400 hover:border-red-300 hover:bg-red-50 transition-all" style={{ padding: "4px 10px" }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────────── */}
        {filtered.length > perPage && (
          <div className="flex items-center justify-between bg-white rounded-2xl border border-[#f0f0f5] shrink-0" style={{ padding: "10px 18px" }}>
            <span className="text-[12px] text-[#9ca3af]">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} users
            </span>
            <div className="flex items-center" style={{ gap: "4px" }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] text-[#9ca3af] hover:text-(--text-primary) disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all"
                  style={{ background: p === page ? "#33084E" : "white", color: p === page ? "white" : "#6b7280", border: `1px solid ${p === page ? "#33084E" : "#f0f0f5"}` }}>
                  {p}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f5] text-[#9ca3af] hover:text-(--text-primary) disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Drawers & Modals ─────────────────────────────────────────────────── */}

      {selected && !editing && !deleting && (
        <UserDetailDrawer
          user={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); }}
          onDelete={() => { setDeleting(selected); }}
          onToggleSuspend={() => handleToggleSuspend(selected)}
        />
      )}

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSave={handleEdit}
        />
      )}

      {deleting && (
        <DeleteUserModal
          user={deleting}
          onClose={() => setDeleting(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
