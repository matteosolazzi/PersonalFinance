"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  PieChart,
  Settings,
  LogOut,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Fatture", href: "/invoices", icon: FileText },
  { name: "Net Worth", href: "/net-worth", icon: TrendingUp },
  { name: "Allocazione", href: "/allocation", icon: PieChart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 min-h-screen bg-slate-900 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Finance</p>
            <p className="text-slate-400 text-xs">Matteo Solazzi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-700/50"
          )}
        >
          <Settings size={18} />
          <span>Impostazioni</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <LogOut size={18} />
          <span>Esci</span>
        </button>
      </div>
    </div>
  );
}
