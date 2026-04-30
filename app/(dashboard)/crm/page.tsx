"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Upload, MoreVertical, DollarSign, Building2, Calendar, Pencil, Trash2 } from "lucide-react";
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";

import { NewLeadModal }          from "./components/NewLeadModal";
import { ImportLeadsModal }      from "./components/ImportLeadsModal";
import { LeadDetailDrawer }      from "./components/LeadDetailDrawer";
import { EditLeadModal }         from "./components/EditLeadModal";
import { DeleteLeadModal }       from "./components/DeleteLeadModal";
import { LogActivityModal }      from "./components/LogActivityModal";
import { EditActivityModal }     from "./components/EditActivityModal";
import { ManagePipelinesModal }  from "./components/ManagePipelinesModal";
import { ManageStatusesModal }   from "./components/ManageStatusesModal";
import { FilterBar, FilterState } from "./components/FilterBar";
import { Activity }              from "./components/ActivityFeed";
import { Lead }                  from "./components/LeadDetailDrawer";
import { DriveItem }             from "./components/ManagePipelinesModal";
import { StatusItem }            from "./components/ManageStatusesModal";

// ── Mock Data ────────────────────────────────────────────────────────────────

const initialDrives: DriveItem[] = [
  { id: 1, name: "Enterprise Sales", slug: "enterprise", description: "Large account pipeline", color: "#33084E", position: 1, is_default: true  },
  { id: 2, name: "SMB Outreach",     slug: "smb",        description: "Small business leads",  color: "#AF580B", position: 2, is_default: false },
];

const initialStatuses: StatusItem[] = [
  { id: 1, name: "New Lead",     slug: "new",         color: "#33084E", position: 1, is_default: true,  is_won: false, is_lost: false },
  { id: 2, name: "Qualified",    slug: "qualified",   color: "#AF580B", position: 2, is_default: false, is_won: false, is_lost: false },
  { id: 3, name: "Proposal",     slug: "proposal",    color: "#1d4ed8", position: 3, is_default: false, is_won: false, is_lost: false },
  { id: 4, name: "Negotiation",  slug: "negotiation", color: "#be185d", position: 4, is_default: false, is_won: false, is_lost: false },
  { id: 5, name: "Closed Won",   slug: "won",         color: "#074616", position: 5, is_default: false, is_won: true,  is_lost: false },
];

const initialLeads: Lead[] = [
  { id: 101, first_name: "Alice",   last_name: "Smith",    company: "Globex Corp",  email: "alice@globex.com",   phone: "+1 555 0101", estimated_value: 15000, currency: "USD", priority: "high",   status_id: 1, drive_id: 1, date: "2026-04-30", notes: "Warm lead from referral." },
  { id: 102, first_name: "Bob",     last_name: "Johnson",  company: "Acme Inc",     email: "bob@acme.com",       phone: "+1 555 0102", estimated_value: 8500,  currency: "USD", priority: "normal", status_id: 2, drive_id: 1, date: "2026-04-28" },
  { id: 103, first_name: "Charlie", last_name: "Davis",    company: "Initech",      email: "cdavis@initech.com", phone: "+1 555 0103", estimated_value: 22000, currency: "USD", priority: "high",   status_id: 3, drive_id: 1, date: "2026-04-25" },
  { id: 104, first_name: "Diana",   last_name: "Prince",   company: "Themyscira",   email: "diana@amazon.com",                         estimated_value: 50000, currency: "USD", priority: "high",   status_id: 4, drive_id: 1, date: "2026-04-20" },
  { id: 105, first_name: "Evan",    last_name: "Wright",   company: "Stark Ind",    email: "evan@stark.com",                           estimated_value: 12000, currency: "USD", priority: "normal", status_id: 5, drive_id: 1, date: "2026-04-15" },
  { id: 106, first_name: "Fiona",   last_name: "Gallagher", company: "Southside",   email: "fiona@south.com",                          estimated_value: 5000,  currency: "USD", priority: "low",    status_id: 1, drive_id: 1, date: "2026-04-30" },
  { id: 107, first_name: "George",  last_name: "Costanza", company: "Vandelay",     email: "art@vandelay.com",                         estimated_value: 1500,  currency: "USD", priority: "normal", status_id: 2, drive_id: 1, date: "2026-04-29" },
];

const mockActivities: Record<number, Activity[]> = {
  101: [
    { id: 1, type: "call",    title: "Discovery Call",      description: "Discussed requirements and budget.",  scheduled_at: "2026-04-28T10:00:00", is_completed: true  },
    { id: 2, type: "email",   title: "Sent proposal deck",  description: "Attached pricing breakdown.",          scheduled_at: "2026-04-29T09:00:00", is_completed: true  },
    { id: 3, type: "meeting", title: "Follow-up meeting",                                                        scheduled_at: "2026-05-05T14:00:00", is_completed: false },
  ],
};

const formatCurrency = (val: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(val);

// ── DND Components ───────────────────────────────────────────────────────────

function DroppableColumn({ status, children }: { status: StatusItem; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id.toString() });
  return (
    <div
      ref={setNodeRef}
      className="flex-1 border border-[#f0f0f5] rounded-2xl flex flex-col overflow-y-auto"
      style={{ background: isOver ? "rgba(51,8,78,0.05)" : "rgba(255,255,255,0.6)", padding: "12px", gap: "12px", transition: "background 0.2s ease" }}
    >
      {children}
    </div>
  );
}

interface MenuTrigger { lead: Lead; x: number; y: number; }

function LeadCardContent({
  lead, status, onClick, onMenuClick,
}: {
  lead: Lead;
  status: StatusItem;
  onClick: () => void;
  onMenuClick: (e: React.MouseEvent<HTMLButtonElement>, lead: Lead) => void;
}) {
  const priStyle: Record<string, { bg: string; color: string }> = {
    high:   { bg: "#AF580B15", color: "#AF580B" },
    normal: { bg: "#33084E15", color: "#33084E" },
    low:    { bg: "#f0f0f5",   color: "#9ca3af" },
  };
  const p = priStyle[lead.priority] ?? priStyle.normal;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-[#f0f0f5] shadow-sm hover:shadow-md hover:border-(--accent-purple) transition-all cursor-pointer group flex flex-col w-full"
      style={{ padding: "16px", gap: "12px" }}
    >
      <div className="flex items-start justify-between" style={{ gap: "8px" }}>
        <div className="flex items-center" style={{ gap: "12px" }}>
          <div className="rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ width: "32px", height: "32px", background: `${status.color}15`, color: status.color }}>
            {lead.first_name[0]}{lead.last_name[0]}
          </div>
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold text-(--text-primary) truncate group-hover:text-(--accent-purple) transition-colors">
              {lead.first_name} {lead.last_name}
            </h4>
            <div className="flex items-center text-[11px] font-medium text-(--text-muted)" style={{ marginTop: "2px", gap: "4px" }}>
              <Building2 size={10} />
              <span className="truncate">{lead.company}</span>
            </div>
          </div>
        </div>
        <button
          className="text-[#9ca3af] hover:text-(--accent-purple) hover:bg-[#f0f0f5] rounded-lg transition-all"
          style={{ padding: "4px", marginRight: "-4px" }}
          onClick={e => { e.stopPropagation(); onMenuClick(e, lead); }}
        >
          <MoreVertical size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: "4px" }}>
        <div className="flex items-center rounded-md bg-[#f8f8fc] border border-[#f0f0f5] text-[12px] font-semibold text-(--text-primary)" style={{ padding: "4px 8px", gap: "6px" }}>
          <DollarSign size={12} className="text-[#9ca3af]" />
          {formatCurrency(lead.estimated_value, lead.currency)}
        </div>
        <span className="rounded-md text-[10px] font-bold capitalize" style={{ padding: "4px 8px", background: p.bg, color: p.color }}>
          {lead.priority}
        </span>
      </div>
    </div>
  );
}

function DraggableCard({
  lead, status, onCardClick, onMenuClick,
}: {
  lead: Lead;
  status: StatusItem;
  onCardClick: () => void;
  onMenuClick: (e: React.MouseEvent<HTMLButtonElement>, lead: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id.toString(),
    data: { lead, status },
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.3 : 1 } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <LeadCardContent lead={lead} status={status} onClick={onCardClick} onMenuClick={onMenuClick} />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CrmPage() {
  const [leads,    setLeads]    = useState(initialLeads);
  const [drives,   setDrives]   = useState(initialDrives);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [activities, setActivities] = useState(mockActivities);

  // Modal flags
  const [isNewLeadOpen,       setNewLeadOpen]       = useState(false);
  const [isImportOpen,        setImportOpen]         = useState(false);
  const [isPipelinesOpen,     setPipelinesOpen]      = useState(false);
  const [isStatusesOpen,      setStatusesOpen]       = useState(false);

  // Drawer + nested modals
  const [selectedLead,        setSelectedLead]       = useState<Lead | null>(null);
  const [isEditLeadOpen,      setEditLeadOpen]       = useState(false);
  const [isDeleteLeadOpen,    setDeleteLeadOpen]     = useState(false);
  const [isLogActivityOpen,   setLogActivityOpen]    = useState(false);
  const [editingActivity,     setEditingActivity]    = useState<Activity | null>(null);

  // Context menu
  const [menu, setMenu] = useState<MenuTrigger | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menu]);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, lead: Lead) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ lead, x: rect.right, y: rect.bottom + 4 });
  };

  // Filters & view
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filters,  setFilters]  = useState<FilterState>({
    driveId: drives[0].id, query: "", priority: "", assignedTo: "", perPage: 25, page: 1,
  });

  // DND
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newStatusId = parseInt(over.id.toString());
      setLeads(prev => prev.map(l => l.id.toString() === active.id.toString() ? { ...l, status_id: newStatusId } : l));
    }
  };

  const updateFilters = (next: Partial<FilterState>) => setFilters(f => ({ ...f, ...next }));

  const filteredLeads = leads.filter(l => {
    if (l.drive_id !== filters.driveId) return false;
    if (filters.priority && l.priority !== filters.priority) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      if (!`${l.first_name} ${l.last_name} ${l.company}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeDragLead   = activeDragId ? leads.find(l => l.id.toString() === activeDragId) : null;
  const activeDragStatus = activeDragLead ? statuses.find(s => s.id === activeDragLead.status_id) : null;

  const sortedStatuses = [...statuses].sort((a, b) => a.position - b.position);

  const leadName = selectedLead ? `${selectedLead.first_name} ${selectedLead.last_name}` : "";

  return (
    <div className="flex flex-col w-full bg-[#f8f8fc] overflow-hidden" style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "24px" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ gap: "16px" }}>
        <div>
          <h1 className="text-2xl font-bold text-(--text-primary)">CRM Pipeline</h1>
          <p className="text-sm text-(--text-muted)" style={{ marginTop: "4px" }}>Manage leads, track deals, and oversee your sales pipeline.</p>
        </div>
        <div className="flex items-center w-full sm:w-auto" style={{ gap: "12px" }}>
          <button
            onClick={() => setImportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center border border-[#f0f0f5] text-[13px] font-bold text-(--text-primary) hover:opacity-80 transition-all rounded-xl"
            style={{ padding: "10px 16px", gap: "8px", background: "white" }}
          >
            <Upload size={16} />
            Import Leads
          </button>
          <button
            onClick={() => setNewLeadOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center text-[13px] font-bold text-white hover:opacity-90 transition-all rounded-xl shadow-[0_4px_14px_rgba(51,8,78,0.25)]"
            style={{ padding: "10px 16px", gap: "8px", background: "var(--accent-purple)" }}
          >
            <Plus size={16} />
            New Lead
          </button>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <FilterBar
        drives={drives}
        filters={filters}
        totalLeads={filteredLeads.length}
        viewMode={viewMode}
        onFiltersChange={updateFilters}
        onViewChange={setViewMode}
        onManagePipelines={() => setPipelinesOpen(true)}
        onManageStatuses={() => setStatusesOpen(true)}
      />

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ overflow: "hidden" }}>
        {viewMode === "kanban" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(e: DragStartEvent) => setActiveDragId(e.active.id.toString())}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x" style={{ paddingBottom: "16px", paddingLeft: "4px", paddingRight: "4px" }}>
              <div className="flex items-start h-full" style={{ gap: "24px", width: "max-content" }}>
                {sortedStatuses.map(status => {
                  const columnLeads = filteredLeads.filter(l => l.status_id === status.id);
                  return (
                    <div key={status.id} className="flex flex-col h-full snap-start shrink-0" style={{ width: "320px" }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
                        <div className="flex items-center" style={{ gap: "8px" }}>
                          <span className="rounded-full" style={{ width: "10px", height: "10px", background: status.color }} />
                          <h3 className="text-[14px] font-bold text-(--text-primary)">{status.name}</h3>
                        </div>
                        <span className="rounded-full bg-[#f0f0f5] text-[11px] font-bold text-(--text-muted)" style={{ padding: "2px 10px" }}>
                          {columnLeads.length}
                        </span>
                      </div>
                      <DroppableColumn status={status}>
                        {columnLeads.map(lead => (
                          <DraggableCard
                            key={lead.id}
                            lead={lead}
                            status={status}
                            onCardClick={() => setSelectedLead(lead)}
                            onMenuClick={openMenu}
                          />
                        ))}
                        {columnLeads.length === 0 && (
                          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#f0f0f5] rounded-xl text-[12px] font-medium text-[#9ca3af]" style={{ minHeight: "80px" }}>
                            Drop leads here
                          </div>
                        )}
                      </DroppableColumn>
                    </div>
                  );
                })}
              </div>
            </div>
            <DragOverlay>
              {activeDragLead && activeDragStatus && (
                <div style={{ width: "294px" }}>
                  <LeadCardContent lead={activeDragLead} status={activeDragStatus} onClick={() => {}} onMenuClick={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="bg-white rounded-2xl border border-[#f0f0f5] shadow-sm overflow-hidden flex-1 flex flex-col min-w-0">
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse min-w-200">
                <thead>
                  <tr className="border-b border-[#f0f0f5] bg-[#f8f8fc]">
                    <th className="text-[12px] font-bold text-(--text-muted) uppercase tracking-wider w-75" style={{ padding: "16px 24px" }}>Lead</th>
                    <th className="text-[12px] font-bold text-(--text-muted) uppercase tracking-wider" style={{ padding: "16px 24px" }}>Status</th>
                    <th className="text-[12px] font-bold text-(--text-muted) uppercase tracking-wider" style={{ padding: "16px 24px" }}>Value</th>
                    <th className="text-[12px] font-bold text-(--text-muted) uppercase tracking-wider" style={{ padding: "16px 24px" }}>Added</th>
                    <th className="w-10" style={{ padding: "16px 24px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => {
                    const status = statuses.find(s => s.id === lead.status_id)!;
                    return (
                      <tr
                        key={lead.id}
                        className="border-b border-[#f0f0f5] last:border-b-0 hover:bg-[#f8f8fc] transition-colors group cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td style={{ padding: "16px 24px" }}>
                          <div className="flex items-center" style={{ gap: "12px" }}>
                            <div className="rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ width: "36px", height: "36px", background: `${status?.color}15`, color: status?.color }}>
                              {lead.first_name[0]}{lead.last_name[0]}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-(--text-primary) group-hover:text-(--accent-purple) transition-colors">
                                {lead.first_name} {lead.last_name}
                              </div>
                              <div className="text-[12px] text-(--text-muted)" style={{ marginTop: "2px" }}>{lead.company}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "4px 10px", gap: "6px", background: `${status?.color}15`, color: status?.color }}>
                            <span className="rounded-full" style={{ width: "6px", height: "6px", background: status?.color }} />
                            {status?.name}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span className="text-[13px] font-bold text-(--text-primary)">
                            {formatCurrency(lead.estimated_value, lead.currency)}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span className="flex items-center text-[12px] text-(--text-muted) font-medium" style={{ gap: "6px" }}>
                            <Calendar size={12} />
                            {lead.date}
                          </span>
                        </td>
                        <td className="text-right" style={{ padding: "16px 24px" }}>
                          <button
                            className="text-[#9ca3af] hover:text-(--accent-purple) transition-colors rounded-lg hover:bg-[#f0f0f5] border border-transparent"
                            style={{ padding: "8px" }}
                            onClick={e => openMenu(e, lead)}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-[14px] text-(--text-muted)" style={{ padding: "64px 24px" }}>
                        No leads found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Context Menu Dropdown ───────────────────────────────────────── */}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-9999 bg-white rounded-xl border border-[#f0f0f5] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden"
          style={{
            top: menu.y,
            left: menu.x,
            transform: "translateX(-100%)",
            minWidth: "148px",
          }}
        >
          <button
            className="w-full flex items-center text-[13px] font-bold text-(--text-primary) hover:bg-[#f8f8fc] transition-colors"
            style={{ padding: "11px 16px", gap: "10px" }}
            onClick={() => {
              setSelectedLead(menu.lead);
              setEditLeadOpen(true);
              setMenu(null);
            }}
          >
            <Pencil size={14} className="text-[#9ca3af]" />
            Edit Lead
          </button>
          <div className="border-t border-[#f0f0f5]" />
          <button
            className="w-full flex items-center text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors"
            style={{ padding: "11px 16px", gap: "10px" }}
            onClick={() => {
              setSelectedLead(menu.lead);
              setDeleteLeadOpen(true);
              setMenu(null);
            }}
          >
            <Trash2 size={14} className="text-red-400" />
            Delete Lead
          </button>
        </div>
      )}

      {/* ── Lead Detail Drawer ───────────────────────────────────────────── */}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          statuses={statuses}
          drives={drives}
          activities={activities[selectedLead.id] ?? []}
          onClose={() => setSelectedLead(null)}
          onEdit={() => setEditLeadOpen(true)}
          onDelete={() => setDeleteLeadOpen(true)}
          onLogActivity={() => setLogActivityOpen(true)}
          onEditActivity={(a) => setEditingActivity(a)}
        />
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {isNewLeadOpen && (
        <NewLeadModal statuses={statuses} drives={drives} onClose={() => setNewLeadOpen(false)} />
      )}

      {isImportOpen && (
        <ImportLeadsModal drives={drives} statuses={statuses} onClose={() => setImportOpen(false)} />
      )}

      {isEditLeadOpen && selectedLead && (
        <EditLeadModal
          lead={selectedLead}
          statuses={statuses}
          drives={drives}
          onClose={() => setEditLeadOpen(false)}
          onSave={(updated) => {
            setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, ...updated } : l));
            setSelectedLead(prev => prev ? { ...prev, ...updated } : null);
            setEditLeadOpen(false);
          }}
        />
      )}

      {isDeleteLeadOpen && selectedLead && (
        <DeleteLeadModal
          leadName={leadName}
          onClose={() => setDeleteLeadOpen(false)}
          onConfirm={() => {
            setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
            setSelectedLead(null);
            setDeleteLeadOpen(false);
          }}
        />
      )}

      {isLogActivityOpen && selectedLead && (
        <LogActivityModal
          leadName={leadName}
          onClose={() => setLogActivityOpen(false)}
          onSave={(data) => {
            const newAct: Activity = { ...data, id: Date.now() };
            setActivities(prev => ({
              ...prev,
              [selectedLead.id]: [...(prev[selectedLead.id] ?? []), newAct],
            }));
          }}
        />
      )}

      {editingActivity && selectedLead && (
        <EditActivityModal
          activity={editingActivity}
          leadName={leadName}
          onClose={() => setEditingActivity(null)}
          onSave={(updated) => {
            setActivities(prev => ({
              ...prev,
              [selectedLead.id]: (prev[selectedLead.id] ?? []).map(a =>
                a.id === editingActivity.id ? { ...a, ...updated } : a
              ),
            }));
          }}
        />
      )}

      {isPipelinesOpen && (
        <ManagePipelinesModal
          drives={drives}
          onClose={() => setPipelinesOpen(false)}
          onCreate={(data) => setDrives(prev => [...prev, { ...data, id: Date.now() }])}
          onUpdate={(id, data) => setDrives(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))}
          onDelete={(id) => setDrives(prev => prev.filter(d => d.id !== id))}
        />
      )}

      {isStatusesOpen && (
        <ManageStatusesModal
          statuses={statuses}
          onClose={() => setStatusesOpen(false)}
          onCreate={(data) => setStatuses(prev => [...prev, { ...data, id: Date.now() }])}
          onUpdate={(id, data) => setStatuses(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))}
          onDelete={(id) => setStatuses(prev => prev.filter(s => s.id !== id))}
        />
      )}
    </div>
  );
}
