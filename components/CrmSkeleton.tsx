"use client";

import React from "react";
import { Skeleton } from "./ui/Skeleton";

export function CrmSkeleton() {
  return (
    <div className="flex flex-col w-full bg-white p-8 gap-5 h-[calc(100vh-75px)] animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl ml-auto" />
      </div>

      {/* Kanban Board Skeleton */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[320px] flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <div className="flex-1 bg-[#f8f8fc]/50 rounded-2xl p-3 flex flex-col gap-3 border border-[#f0f0f5]">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="bg-white rounded-xl p-4 border border-[#f0f0f5] flex flex-col gap-3">
                    <div className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-20 rounded-md" />
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
