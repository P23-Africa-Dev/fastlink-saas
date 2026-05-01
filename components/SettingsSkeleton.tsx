"use client";

import React from "react";
import { Skeleton } from "./ui/Skeleton";

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col w-full bg-white p-8 gap-5 h-[calc(100vh-75px)] animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Stats Strip Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-[#f0f0f5] flex items-center h-[70px] gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>

      {/* List Skeleton */}
      <div className="flex-1 bg-white rounded-3xl border border-[#f0f0f5] overflow-hidden">
        <div className="bg-[#f8f8fc] h-10 border-b border-[#f0f0f5] flex items-center px-4 gap-4">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        {[...Array(6)].map((_, j) => (
          <div key={j} className="h-16 border-b border-[#f0f0f5] flex items-center px-4 gap-4 last:border-0">
            <div className="flex-1 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="flex-1 h-6 w-20 rounded-lg" />
            <Skeleton className="flex-1 h-4 w-24" />
            <Skeleton className="flex-1 h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
