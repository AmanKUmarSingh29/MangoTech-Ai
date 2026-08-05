"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  FileText,
  Brain,
  HelpCircle,
  MessageSquare,
  Trophy,
  TrendingUp,
  Loader2,
  Target,
} from "lucide-react";

interface AnalyticsData {
  totals: {
    documents: number;
    summaries: number;
    quizzes: number;
    attempts: number;
    qaMessages: number;
  };
  averageScore: number;
  recentPerformance: {
    id: number;
    score: number;
    totalQuestions: number;
    completedAt: string;
    docTitle: string | null;
    percentage: number;
  }[];
  documentStats: {
    docId: number;
    title: string;
    totalAttempts: number;
    avgScore: number;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-mango" size={48} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Failed to load analytics</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Documents",
      value: data.totals.documents,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Summaries Generated",
      value: data.totals.summaries,
      icon: Brain,
      color: "text-mango",
      bg: "bg-mango/10",
    },
    {
      label: "Quizzes Generated",
      value: data.totals.quizzes,
      icon: HelpCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Quizzes Taken",
      value: data.totals.attempts,
      icon: Target,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Q&A Messages",
      value: data.totals.qaMessages,
      icon: MessageSquare,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
    },
    {
      label: "Avg. Score",
      value: `${Math.round(data.averageScore)}%`,
      icon: Trophy,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
  ];

  const maxScore = Math.max(
    ...data.recentPerformance.map((p) => p.percentage),
    100
  );

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <BarChart3 className="text-green-400" size={32} />
          Study Analytics
        </h1>
        <p className="text-slate-400">
          Track your learning performance and monitor progress across all documents.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-dark-card border border-dark-border rounded-2xl p-6 hover:card-glow transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="text-3xl font-bold">{stat.value}</span>
            </div>
            <p className="text-slate-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-mango" />
            Quiz Performance History
          </h2>
          {data.recentPerformance.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400">No quiz attempts yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Take quizzes to see your performance over time
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentPerformance.map((perf, idx) => (
                <div key={perf.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 truncate max-w-[60%]">
                      {perf.docTitle || "Unknown Document"}
                    </span>
                    <span
                      className={`font-medium ${
                        perf.percentage >= 80
                          ? "text-green-400"
                          : perf.percentage >= 60
                          ? "text-mango"
                          : "text-red-400"
                      }`}
                    >
                      {perf.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-dark-border rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        perf.percentage >= 80
                          ? "bg-green-400"
                          : perf.percentage >= 60
                          ? "bg-mango"
                          : "bg-red-400"
                      }`}
                      style={{
                        width: `${(perf.percentage / maxScore) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {perf.score}/{perf.totalQuestions} •{" "}
                    {new Date(perf.completedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Stats */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText size={20} className="text-blue-400" />
            Document Performance
          </h2>
          {data.documentStats.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400">No documents yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.documentStats.map((doc) => (
                <div
                  key={doc.docId}
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-hover/30 hover:bg-dark-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-400/10 p-2 rounded-lg">
                      <FileText className="text-blue-400" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-slate-500">
                        {doc.totalAttempts} quiz attempt
                        {doc.totalAttempts !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {doc.totalAttempts > 0 ? (
                    <div
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                        doc.avgScore >= 80
                          ? "bg-green-400/10 text-green-400"
                          : doc.avgScore >= 60
                          ? "bg-mango/10 text-mango"
                          : "bg-red-400/10 text-red-400"
                      }`}
                    >
                      {Math.round(doc.avgScore)}%
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No attempts</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      {data.recentPerformance.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-mango/10 to-orange-500/10 border border-mango/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-mango" />
            Performance Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-mango">
                {Math.round(data.averageScore)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Best Score</p>
              <p className="text-3xl font-bold text-green-400">
                {Math.max(...data.recentPerformance.map((p) => p.percentage))}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Quizzes</p>
              <p className="text-3xl font-bold text-blue-400">
                {data.totals.attempts}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
