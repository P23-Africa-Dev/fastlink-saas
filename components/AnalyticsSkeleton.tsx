import React from "react";

export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col w-full bg-white animate-pulse" style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "24px" }}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-slate-100 rounded-lg" />
          <div className="h-4 w-64 bg-slate-50 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-slate-100 rounded-xl" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl" />
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4">
          <div className="h-6 w-40 bg-slate-100 rounded-md" />
          <div className="flex-1 bg-slate-50 rounded-xl" />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4">
          <div className="h-6 w-40 bg-slate-100 rounded-md" />
          <div className="flex-1 bg-slate-50 rounded-xl" />
        </div>
      </div>
      
      {/* Bottom Row */}
      <div className="h-64 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4">
        <div className="h-6 w-40 bg-slate-100 rounded-md" />
        <div className="flex-1 bg-slate-50 rounded-xl" />
      </div>
    </div>
  );
}
