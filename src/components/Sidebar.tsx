"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload PDF", icon: Upload },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-card border-r border-dark-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-dark-border">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="MangoTech AI"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-lg font-bold gradient-mango-text">
              MangoTech AI
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Study Platform
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-mango/15 text-mango shadow-lg shadow-mango/5"
                  : "text-slate-400 hover:text-white hover:bg-dark-hover"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <div className="bg-gradient-to-r from-mango/10 to-orange-500/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-mango" />
            <span className="text-xs font-semibold text-mango">AI Powered</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Upload PDFs to unlock AI summaries, quizzes, and smart Q&A.
          </p>
        </div>
      </div>
    </aside>
  );
}
