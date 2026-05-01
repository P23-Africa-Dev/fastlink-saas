"use client";

import React from "react";
import { Skeleton } from "./ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="content-area animate-fade-in">
      <div className="content-main">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-[22px] p-6 border border-[#f0f0f5] h-[140px] flex flex-col justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
          <div className="bg-white rounded-3xl p-6 border border-[#f0f0f5] h-[320px]">
            <div className="flex justify-between mb-6">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="bg-white rounded-3xl p-6 border border-[#f0f0f5] h-[320px]">
            <div className="flex justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between items-center p-4 rounded-2xl bg-[#f8f8fc]">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CRM Table Skeleton */}
        <div className="bg-white rounded-3xl p-6 border border-[#f0f0f5] h-[400px]">
          <div className="flex justify-between mb-8">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div className="flex gap-4 mb-4 pb-2 border-b border-[#f0f0f5]">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex gap-4 py-4 border-b border-[#f8f8fc] last:border-0">
              <div className="flex-1 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="flex-1 h-4" />
              <Skeleton className="flex-1 h-4" />
              <Skeleton className="flex-1 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Skeleton */}
      <div className="content-sidebar flex flex-col gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#f0f0f5] h-[400px]">
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="flex justify-center mb-8">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2].map((l) => (
              <div key={l} className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#f0f0f5] h-[400px]">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((m) => (
              <div key={m} className="flex items-center gap-3 py-3 border-b border-[#f8f8fc] last:border-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
