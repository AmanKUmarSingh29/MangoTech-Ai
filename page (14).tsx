import { db } from "@/db";
import { documents, summaries, quizzes, quizAttempts } from "@/db/schema";
import { desc, count, or, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import {
  FileText,
  Calendar,
  BookOpen,
  Brain,
  HelpCircle,
  ArrowRight,
  Upload,
} from "lucide-react";
import { DeleteButton } from "./DeleteButton";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await getServerSession();

  const docWhere = session
    ? or(eq(documents.userId, session.id), isNull(documents.userId))
    : undefined;

  const docs = await db
    .select()
    .from(documents)
    .where(docWhere)
    .orderBy(desc(documents.createdAt));

  // Get summary/quiz counts per document
  const summaryCountsRaw = await db
    .select({
      documentId: summaries.documentId,
      cnt: count(),
    })
    .from(summaries)
    .groupBy(summaries.documentId);

  const quizCountsRaw = await db
    .select({
      documentId: quizzes.documentId,
      cnt: count(),
    })
    .from(quizzes)
    .groupBy(quizzes.documentId);

  const attemptCountsRaw = await db
    .select({
      documentId: quizAttempts.documentId,
      cnt: count(),
    })
    .from(quizAttempts)
    .groupBy(quizAttempts.documentId);

  const summaryCounts = new Map(
    summaryCountsRaw.map((s) => [s.documentId, s.cnt])
  );
  const quizCounts = new Map(quizCountsRaw.map((q) => [q.documentId, q.cnt]));
  const attemptCounts = new Map(
    attemptCountsRaw.map((a) => [a.documentId, a.cnt])
  );

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="text-blue-400" size={32} />
            Documents
          </h1>
          <p className="text-slate-400">
            {docs.length} document{docs.length !== 1 ? "s" : ""} in your study library
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 px-5 py-3 gradient-mango text-black rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-mango/20"
        >
          <Upload size={20} />
          Upload PDF
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-16 text-center">
          <FileText className="mx-auto text-slate-600 mb-6" size={64} />
          <h2 className="text-xl font-semibold mb-2">No Documents Yet</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Upload your first PDF document to get started with AI-powered
            summarization, quiz generation, and Q&A.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 gradient-mango text-black rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <Upload size={20} />
            Upload Your First PDF
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:card-glow hover:border-dark-hover transition-all duration-300 group"
            >
              {/* Card Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-blue-400/10 p-3 rounded-xl">
                    <FileText className="text-blue-400" size={24} />
                  </div>
                  <DeleteButton docId={doc.id} />
                </div>
                <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-mango transition-colors">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Stats */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />
                    {doc.pageCount} pages
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain size={12} />
                    {summaryCounts.get(doc.id) || 0} summaries
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle size={12} />
                    {attemptCounts.get(doc.id) || 0} quizzes taken
                  </span>
                </div>
              </div>

              {/* Action */}
              <Link
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between px-6 py-4 border-t border-dark-border bg-dark-hover/30 hover:bg-dark-hover transition-colors"
              >
                <span className="text-sm font-medium text-mango">
                  View & Analyze
                </span>
                <ArrowRight
                  className="text-mango group-hover:translate-x-1 transition-transform"
                  size={18}
                />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
