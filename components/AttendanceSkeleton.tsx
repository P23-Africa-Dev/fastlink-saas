"use client";

import React from "react";
import { Skeleton } from "./ui/Skeleton";

export function AttendanceSkeleton() {
  return (
    <div className="flex flex-col w-full bg-white p-8 gap-5 h-[calc(100vh-75px)] animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      {/* Hero Card Skeleton */}
      <div className="shrink-0">
        <div className="bg-[#33084E] rounded-3xl p-6 h-[120px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl bg-white/10" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32 bg-white/10" />
              <Skeleton className="h-4 w-48 bg-white/10" />
            </div>
          </div>
          <Skeleton className="h-12 w-32 rounded-xl bg-white/10" />
        </div>
      </div>

      {/* Summary Strip Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-[#f0f0f5] flex justify-between items-center h-[90px]">
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-10 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 bg-white rounded-3xl border border-[#f0f0f5] p-6">
        <div className="flex justify-between mb-8">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {[...Array(35)].map((_, j) => (
            <div key={j} className="h-24 rounded-2xl border border-[#f8f8fc] p-2 flex flex-col justify-between">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
