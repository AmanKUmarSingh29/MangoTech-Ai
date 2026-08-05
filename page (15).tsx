"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to log in with demo account");
        setDemoLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0f1d] text-white">
      {/* Glow decorative effects */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-lg shadow-amber-500/10">
            <Image
              src="/images/logo.png"
              alt="MangoTech AI"
              width={56}
              height={56}
              className="rounded-xl"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to <span className="gradient-mango-text">MangoTech AI</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Sign in to access your AI study companion & notes
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#131d31]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {/* 1-Click Demo Login */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading || loading}
            className="w-full mb-6 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center justify-center gap-2.5 text-sm font-semibold text-amber-300 hover:text-amber-200 group shadow-md shadow-amber-500/5 disabled:opacity-50"
          >
            {demoLoading ? (
              <Loader2 className="animate-spin text-amber-400" size={18} />
            ) : (
              <Sparkles
                className="text-amber-400 group-hover:scale-110 transition-transform"
                size={18}
              />
            )}
            <span>Instant Demo Account (1-Click)</span>
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#131d31] px-3 text-xs uppercase tracking-wider text-slate-500 font-medium">
              or sign in with email
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-[#0d1527] border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                  disabled={loading || demoLoading}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0d1527] border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                  disabled={loading || demoLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl gradient-mango text-slate-950 font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-slate-950" size={18} />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to MangoTech</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign Up */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Feature badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <GraduationCap size={16} className="text-amber-500" />
          <span>AI-Powered Notes • Smart Quizzes • Document Q&A</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] text-amber-400">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
