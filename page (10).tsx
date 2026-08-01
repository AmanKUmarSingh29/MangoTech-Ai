import { db } from "@/db";
import { documents, quizAttempts, summaries, quizzes, qaMessages } from "@/db/schema";
import { count, desc, sql } from "drizzle-orm";
import Link from "next/link";
import {
  FileText,
  Brain,
  HelpCircle,
  TrendingUp,
  Upload,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [docCount] = await db.select({ value: count() }).from(documents);
  const [summaryCount] = await db.select({ value: count() }).from(summaries);
  const [quizCount] = await db.select({ value: count() }).from(quizAttempts);
  const [qaCount] = await db.select({ value: count() }).from(qaMessages);

  const recentDocs = await db
    .select()
    .from(documents)
    .orderBy(desc(documents.createdAt))
    .limit(5);

  const recentAttempts = await db
    .select({
      id: quizAttempts.id,
      score: quizAttempts.score,
      totalQuestions: quizAttempts.totalQuestions,
      completedAt: quizAttempts.completedAt,
      docTitle: documents.title,
    })
    .from(quizAttempts)
    .leftJoin(documents, sql`${quizAttempts.documentId} = ${documents.id}`)
    .orderBy(desc(quizAttempts.completedAt))
    .limit(5);

  const stats = [
    {
      label: "Documents",
      value: docCount.value,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Summaries",
      value: summaryCount.value,
      icon: Brain,
      color: "text-mango",
      bg: "bg-mango/10",
    },
    {
      label: "Quizzes Taken",
      value: quizCount.value,
      icon: HelpCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Q&A Messages",
      value: qaCount.value,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-mango" size={28} />
          <h1 className="text-3xl font-bold">Welcome to MangoTech AI</h1>
        </div>
        <p className="text-slate-400 text-lg">
          Your AI-powered study companion. Upload, analyze, and master your study materials.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
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

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-mango" />
            Quick Actions
          </h2>
          <div className="space-y-4">
            <Link
              href="/upload"
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-mango/10 to-orange-500/10 border border-mango/20 hover:border-mango/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Upload className="text-mango" size={20} />
                <div>
                  <p className="font-medium">Upload PDF</p>
                  <p className="text-xs text-slate-400">
                    Add new study material
                  </p>
                </div>
              </div>
              <ArrowRight
                className="text-mango group-hover:translate-x-1 transition-transform"
                size={20}
              />
            </Link>
            <Link
              href="/documents"
              className="flex items-center justify-between p-4 rounded-xl bg-blue-400/5 border border-blue-400/20 hover:border-blue-400/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileText className="text-blue-400" size={20} />
                <div>
                  <p className="font-medium">Browse Documents</p>
                  <p className="text-xs text-slate-400">
                    View all uploaded documents
                  </p>
                </div>
              </div>
              <ArrowRight
                className="text-blue-400 group-hover:translate-x-1 transition-transform"
                size={20}
              />
            </Link>
            <Link
              href="/analytics"
              className="flex items-center justify-between p-4 rounded-xl bg-green-400/5 border border-green-400/20 hover:border-green-400/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="text-green-400" size={20} />
                <div>
                  <p className="font-medium">View Analytics</p>
                  <p className="text-xs text-slate-400">
                    Track your study performance
                  </p>
                </div>
              </div>
              <ArrowRight
                className="text-green-400 group-hover:translate-x-1 transition-transform"
                size={20}
              />
            </Link>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText size={20} className="text-blue-400" />
            Recent Documents
          </h2>
          {recentDocs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400 mb-4">No documents yet</p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-mango text-black rounded-lg font-medium text-sm hover:bg-mango-light transition-colors"
              >
                <Upload size={16} />
                Upload your first PDF
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-dark-hover transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-400/10 p-2 rounded-lg">
                      <FileText className="text-blue-400" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-mango transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {doc.pageCount} pages •{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className="text-slate-600 group-hover:text-mango group-hover:translate-x-1 transition-all"
                    size={16}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Quiz Attempts */}
      {recentAttempts.length > 0 && (
        <div className="mt-8 bg-dark-card border border-dark-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <HelpCircle size={20} className="text-green-400" />
            Recent Quiz Attempts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase">
                  <th className="pb-3 font-medium">Document</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Percentage</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentAttempts.map((attempt) => {
                  const pct = Math.round(
                    (attempt.score / attempt.totalQuestions) * 100
                  );
                  return (
                    <tr
                      key={attempt.id}
                      className="border-t border-dark-border"
                    >
                      <td className="py-3">{attempt.docTitle || "Unknown"}</td>
                      <td className="py-3">
                        {attempt.score}/{attempt.totalQuestions}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pct >= 80
                              ? "bg-green-400/10 text-green-400"
                              : pct >= 60
                              ? "bg-mango/10 text-mango"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(attempt.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
