"use client";

import React, { useState } from "react";
import {
  Plus, Upload, Search, LayoutGrid, List,
  MoreVertical, DollarSign, Building2, Calendar
} from "lucide-react";
import { NewLeadModal } from "./components/NewLeadModal";
import { ImportLeadsModal } from "./components/ImportLeadsModal";
import { 
  DndContext, DragOverlay, closestCorners, 
  PointerSensor, useSensor, useSensors, 
  DragStartEvent, DragEndEvent 
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';

// --- Mock Data based on API Specifications ---
const drives = [
  { id: 1, name: "Enterprise Sales" },
  { id: 2, name: "SMB Outreach" }
];

const statuses = [
  { id: 1, name: "New Lead", slug: "new", color: "#33084E" },
  { id: 2, name: "Qualified", slug: "qualified", color: "#AF580B" },
  { id: 3, name: "Proposal", slug: "proposal", color: "#33084E" },
  { id: 4, name: "Negotiation", slug: "negotiation", color: "#AF580B" },
  { id: 5, name: "Closed Won", slug: "won", color: "#074616" }
];

const initialMockLeads = [
  { id: 101, first_name: "Alice", last_name: "Smith", company: "Globex Corp", email: "alice@globex.com", estimated_value: 15000, priority: "high", status_id: 1, drive_id: 1, date: "2026-04-30" },
  { id: 102, first_name: "Bob", last_name: "Johnson", company: "Acme Inc", email: "bob@acme.com", estimated_value: 8500, priority: "normal", status_id: 2, drive_id: 1, date: "2026-04-28" },
  { id: 103, first_name: "Charlie", last_name: "Davis", company: "Initech", email: "cdavis@initech.com", estimated_value: 22000, priority: "high", status_id: 3, drive_id: 1, date: "2026-04-25" },
  { id: 104, first_name: "Diana", last_name: "Prince", company: "Themyscira", email: "diana@amazon.com", estimated_value: 50000, priority: "high", status_id: 4, drive_id: 1, date: "2026-04-20" },
  { id: 105, first_name: "Evan", last_name: "Wright", company: "Stark Ind", email: "evan@stark.com", estimated_value: 12000, priority: "normal", status_id: 5, drive_id: 1, date: "2026-04-15" },
  { id: 106, first_name: "Fiona", last_name: "Gallagher", company: "Southside", email: "fiona@south.com", estimated_value: 5000, priority: "low", status_id: 1, drive_id: 1, date: "2026-04-30" },
  { id: 107, first_name: "George", last_name: "Costanza", company: "Vandelay", email: "art@vandelay.com", estimated_value: 1500, priority: "normal", status_id: 2, drive_id: 1, date: "2026-04-29" },
];

const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

// --- DND Components ---
function DroppableColumn({ status, children }: { status: any, children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id.toString(),
  });
  return (
    <div 
      ref={setNodeRef} 
      className="flex-1 border border-[#f0f0f5] rounded-2xl flex flex-col overflow-y-auto" 
      style={{ 
        background: isOver ? "rgba(51,8,78,0.05)" : "rgba(255,255,255,0.6)", 
        padding: "12px", 
        gap: "12px",
        transition: "background 0.2s ease"
      }}
    >
      {children}
    </div>
  );
}

function LeadCardContent({ lead, status }: { lead: any, status: any }) {
  return (
    <div className="bg-white rounded-xl border border-[#f0f0f5] shadow-sm hover:shadow-md hover:border-[var(--accent-purple)] transition-all cursor-pointer group flex flex-col w-full" style={{ padding: "16px", gap: "12px" }}>
      <div className="flex items-start justify-between" style={{ gap: "8px" }}>
        <div className="flex items-center" style={{ gap: "12px" }}>
          <div className="rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ width: "32px", height: "32px", background: `${status.color}15`, color: status.color }}>
            {lead.first_name[0]}{lead.last_name[0]}
          </div>
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-purple)] transition-colors">
              {lead.first_name} {lead.last_name}
            </h4>
            <div className="flex items-center text-[11px] font-medium text-[var(--text-muted)]" style={{ marginTop: "2px", gap: "4px" }}>
              <Building2 size={10} />
              <span className="truncate">{lead.company}</span>
            </div>
          </div>
        </div>
        <button className="text-[#9ca3af] hover:text-[var(--accent-purple)] transition-colors" style={{ padding: "4px", marginRight: "-4px" }}>
          <MoreVertical size={14} />
        </button>
      </div>
      
      <div className="flex items-center justify-between" style={{ marginTop: "4px" }}>
        <div className="flex items-center rounded-md bg-[#f8f8fc] border border-[#f0f0f5] text-[12px] font-semibold text-[var(--text-primary)]" style={{ padding: "4px 8px", gap: "6px" }}>
          <DollarSign size={12} className="text-[#9ca3af]" />
          {formatCurrency(lead.estimated_value)}
        </div>
        <span className="rounded-md text-[10px] font-bold uppercase tracking-wider" style={{
          padding: "4px 8px",
          background: lead.priority === 'high' ? '#AF580B15' : lead.priority === 'low' ? '#f0f0f5' : '#33084E15',
          color: lead.priority === 'high' ? '#AF580B' : lead.priority === 'low' ? '#9ca3af' : '#33084E',
        }}>
          {lead.priority}
        </span>
      </div>
    </div>
  );
}

function DraggableCard({ lead, status }: { lead: any, status: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id.toString(),
    data: { lead, status }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : undefined,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <LeadCardContent lead={lead} status={status} />
    </div>
  );
}


export default function CrmPage() {
  const [leads, setLeads] = useState(initialMockLeads);
  const [activeDrive, setActiveDrive] = useState(drives[0].id);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // DND state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before drag starts so buttons are clickable
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const newStatusId = parseInt(over.id.toString());
      setLeads((prev) => 
        prev.map((lead) => 
          lead.id.toString() === active.id.toString() 
            ? { ...lead, status_id: newStatusId } 
            : lead
        )
      );
    }
  };

  const filteredLeads = leads.filter(l => 
    l.drive_id === activeDrive && 
    (l.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     l.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     l.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeDragLead = activeDragId ? leads.find(l => l.id.toString() === activeDragId) : null;
  const activeDragStatus = activeDragLead ? statuses.find(s => s.id === activeDragLead.status_id) : null;

  return (
    <div className="flex flex-col w-full bg-[#f8f8fc] overflow-hidden" style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "24px" }}>
      
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ gap: "16px" }}>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">CRM Pipeline</h1>
          <p className="text-sm text-[var(--text-muted)]" style={{ marginTop: "4px" }}>Manage leads, track deals, and oversee your sales pipeline.</p>
        </div>
        <div className="flex items-center w-full sm:w-auto" style={{ gap: "12px" }}>
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center border border-[#f0f0f5] text-[13px] font-bold text-[var(--text-primary)] hover:opacity-80 transition-all rounded-xl"
            style={{ padding: "10px 16px", gap: "8px", background: "white" }}
          >
            <Upload size={16} />
            Import Leads
          </button>
          <button 
            onClick={() => setIsNewLeadOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center text-[13px] font-bold text-white hover:opacity-90 transition-all rounded-xl shadow-[0_4px_14px_rgba(51,8,78,0.25)]"
            style={{ padding: "10px 16px", gap: "8px", background: "var(--accent-purple)" }}
          >
            <Plus size={16} />
            New Lead
          </button>
        </div>
      </div>

      {/* ── Filters & Controls ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border border-[#f0f0f5] shadow-sm rounded-2xl bg-white" style={{ gap: "16px", padding: "16px" }}>
        <div className="flex items-center w-full sm:w-auto" style={{ gap: "16px" }}>
          {/* Pipeline Selector */}
          <select 
            value={activeDrive}
            onChange={(e) => setActiveDrive(Number(e.target.value))}
            className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-purple)] transition-colors cursor-pointer"
            style={{ padding: "10px 16px" }}
          >
            {drives.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          
          {/* Search */}
          <div className="relative flex-1 sm:w-[260px]">
            <Search size={16} className="absolute text-[#9ca3af]" style={{ left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] font-medium outline-none focus:border-[var(--accent-purple)] transition-colors placeholder:text-[#9ca3af]"
              style={{ padding: "10px 16px 10px 40px" }}
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-[#f8f8fc] rounded-xl border border-[#f0f0f5] self-start sm:self-auto" style={{ gap: "4px", padding: "4px" }}>
          <button 
            onClick={() => setViewMode("kanban")}
            className={`transition-all rounded-lg ${viewMode === "kanban" ? "shadow-sm text-[var(--accent-purple)]" : "text-[#9ca3af] hover:text-[var(--text-primary)]"}`}
            style={{ padding: "8px", background: viewMode === "kanban" ? "white" : "transparent" }}
          >
            <LayoutGrid size={16} />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`transition-all rounded-lg ${viewMode === "list" ? "shadow-sm text-[var(--accent-purple)]" : "text-[#9ca3af] hover:text-[var(--text-primary)]"}`}
            style={{ padding: "8px", background: viewMode === "list" ? "white" : "transparent" }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ width: "100%", maxWidth: "100%", overflow: "hidden", boxSizing: "border-box" }}>
        {viewMode === "kanban" ? (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x" style={{ paddingBottom: "16px", paddingLeft: "4px", paddingRight: "4px" }}>
              <div className="flex items-start h-full" style={{ gap: "24px", width: "max-content" }}>
                {statuses.map(status => {
                  const columnLeads = filteredLeads.filter(l => l.status_id === status.id);
                  return (
                    <div key={status.id} className="flex flex-col h-full snap-start shrink-0" style={{ width: "320px" }}>
                      {/* Column Header */}
                      <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
                        <div className="flex items-center" style={{ gap: "8px" }}>
                          <span className="rounded-full" style={{ width: "10px", height: "10px", background: status.color }} />
                          <h3 className="text-[14px] font-bold text-[var(--text-primary)]">{status.name}</h3>
                        </div>
                        <span className="rounded-full bg-[#f0f0f5] text-[11px] font-bold text-[var(--text-muted)]" style={{ padding: "2px 10px" }}>
                          {columnLeads.length}
                        </span>
                      </div>

                      {/* Column Body / Dropzone */}
                      <DroppableColumn status={status}>
                        {columnLeads.map(lead => (
                          <DraggableCard key={lead.id} lead={lead} status={status} />
                        ))}
                        {columnLeads.length === 0 && (
                          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#f0f0f5] rounded-xl text-[12px] font-medium text-[#9ca3af]">
                            Drop leads here
                          </div>
                        )}
                      </DroppableColumn>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Drag Overlay for smooth animation while dragging */}
            <DragOverlay>
              {activeDragLead && activeDragStatus ? (
                <div style={{ width: "294px" }}>
                  <LeadCardContent lead={activeDragLead} status={activeDragStatus} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="bg-white rounded-2xl border border-[#f0f0f5] shadow-sm overflow-hidden flex-1 flex flex-col min-w-0">
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#f0f0f5] bg-[#f8f8fc]">
                    <th className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider w-[300px]" style={{ padding: "16px 24px" }}>Lead</th>
                    <th className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider" style={{ padding: "16px 24px" }}>Status</th>
                    <th className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider" style={{ padding: "16px 24px" }}>Value</th>
                    <th className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider" style={{ padding: "16px 24px" }}>Added</th>
                    <th className="w-10" style={{ padding: "16px 24px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const status = statuses.find(s => s.id === lead.status_id)!;
                    return (
                      <tr key={lead.id} className="border-b border-[#f0f0f5] last:border-b-0 hover:bg-[#f8f8fc] transition-colors group cursor-pointer">
                        <td style={{ padding: "16px 24px" }}>
                          <div className="flex items-center" style={{ gap: "12px" }}>
                            <div className="rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ width: "36px", height: "36px", background: `${status.color}15`, color: status.color }}>
                              {lead.first_name[0]}{lead.last_name[0]}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-purple)] transition-colors">
                                {lead.first_name} {lead.last_name}
                              </div>
                              <div className="text-[12px] text-[var(--text-muted)]" style={{ marginTop: "2px" }}>{lead.company}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span className="inline-flex items-center rounded-full text-[11px] font-bold" style={{ padding: "4px 10px", gap: "6px", background: `${status.color}15`, color: status.color }}>
                            <span className="rounded-full" style={{ width: "6px", height: "6px", background: status.color }} />
                            {status.name}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span className="text-[13px] font-bold text-[var(--text-primary)]">
                            {formatCurrency(lead.estimated_value)}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span className="flex items-center text-[12px] text-[var(--text-muted)] font-medium" style={{ gap: "6px" }}>
                            <Calendar size={12} />
                            {lead.date}
                          </span>
                        </td>
                        <td className="text-right" style={{ padding: "16px 24px" }}>
                          <button className="text-[#9ca3af] hover:text-[var(--accent-purple)] transition-colors rounded-lg hover:bg-white border border-transparent hover:border-[#f0f0f5]" style={{ padding: "8px" }}>
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-[14px] text-[var(--text-muted)]" style={{ padding: "64px 24px" }}>
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

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {isNewLeadOpen && (
        <NewLeadModal statuses={statuses} onClose={() => setIsNewLeadOpen(false)} />
      )}
      {isImportOpen && (
        <ImportLeadsModal drives={drives} onClose={() => setIsImportOpen(false)} />
      )}

    </div>
  );
}
