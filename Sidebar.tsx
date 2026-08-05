"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Sparkles,
  LogOut,
  User,
  Loader2,
} from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload PDF", icon: Upload },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

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
            className="rounded-lg shadow-sm"
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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

        {/* AI Info Card */}
        <div className="pt-4">
          <div className="bg-gradient-to-br from-mango/10 to-orange-500/10 border border-mango/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={15} className="text-mango" />
              <span className="text-xs font-semibold text-mango">AI Study Hub</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Upload documents, generate instant quizzes & ask questions.
            </p>
          </div>
        </div>
      </nav>

      {/* User Profile & Logout in Footer */}
      <div className="p-4 border-t border-dark-border bg-[#101828]">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-amber-500/20 flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <LogOut size={14} />
              )}
              <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <User size={16} />
              <span>Authenticating...</span>
            </div>
            <Link
              href="/login"
              className="text-xs text-amber-400 hover:underline font-medium"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
