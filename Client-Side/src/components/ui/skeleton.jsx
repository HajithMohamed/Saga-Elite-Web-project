import React from "react";
import { cn } from "@/lib/utils";

// Base Skeleton Primitive
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-card/80 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

// Full Page Skeleton for Home
export function HomeSkeleton() {
  return (
    <div className="w-full min-h-screen bg-page flex flex-col">
      {/* Hero Skeleton */}
      <Skeleton className="w-full h-[480px] sm:h-[500px] md:h-[560px] lg:h-[620px] xl:h-[680px] rounded-none" />
      
      {/* Product Grid Skeleton Container */}
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-8 py-16 md:py-24 space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-48 md:w-64" />
          </div>
          <Skeleton className="h-8 w-24 hidden md:block" />
        </div>
        
        {/* 4 Col Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-4">
              <Skeleton className="w-full h-[320px] md:h-[420px] lg:h-[460px] rounded-[20px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Drop Details Skeleton
export function DropDetailsSkeleton() {
  return (
    <div className="w-full min-h-screen bg-page flex flex-col">
      <Skeleton className="w-full h-[50vh] md:h-[65vh] rounded-none" />
      
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-8 py-16 space-y-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
          </div>
          <Skeleton className="w-full md:w-1/3 h-[200px] rounded-2xl" />
        </div>

        {/* 4 Col Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-4">
              <Skeleton className="w-full h-[320px] md:h-[420px] lg:h-[460px] rounded-[20px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Skeleton };
