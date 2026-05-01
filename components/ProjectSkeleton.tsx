"use client";

import React from "react";
import { Skeleton } from "./ui/Skeleton";

export function ProjectSkeleton() {
  return (
    <div className="flex flex-col w-full bg-white p-8 gap-5 h-[calc(100vh-75px)] animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* View Switcher Skeleton */}
      <div className="flex justify-between items-center border border-[#f0f0f5] rounded-2xl p-3 bg-white shrink-0">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>

      {/* Grid Skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-[22px] p-6 border border-[#f0f0f5] h-[220px] flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
