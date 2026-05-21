"use client";

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
