import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  documents,
  quizAttempts,
  summaries,
  quizzes,
  qaMessages,
} from "@/db/schema";
import { count, avg, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // Total counts
  const [docCount] = await db.select({ value: count() }).from(documents);
  const [summaryCount] = await db.select({ value: count() }).from(summaries);
  const [quizCount] = await db.select({ value: count() }).from(quizzes);
  const [attemptCount] = await db.select({ value: count() }).from(quizAttempts);
  const [qaCount] = await db.select({ value: count() }).from(qaMessages);

  // Average quiz score
  const [avgScore] = await db
    .select({
      avgScore: avg(
        sql`CAST(${quizAttempts.score} AS FLOAT) / NULLIF(${quizAttempts.totalQuestions}, 0) * 100`
      ),
    })
    .from(quizAttempts);

  // Recent quiz performance (last 20 attempts)
  const recentPerformance = await db
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
    .limit(20);

  // Per-document stats
  const documentStats = await db
    .select({
      docId: documents.id,
      title: documents.title,
      totalAttempts: count(quizAttempts.id),
      avgScore: avg(
        sql`CAST(${quizAttempts.score} AS FLOAT) / NULLIF(${quizAttempts.totalQuestions}, 0) * 100`
      ),
    })
    .from(documents)
    .leftJoin(
      quizAttempts,
      sql`${documents.id} = ${quizAttempts.documentId}`
    )
    .groupBy(documents.id, documents.title)
    .orderBy(desc(documents.createdAt));

  return NextResponse.json({
    totals: {
      documents: docCount.value,
      summaries: summaryCount.value,
      quizzes: quizCount.value,
      attempts: attemptCount.value,
      qaMessages: qaCount.value,
    },
    averageScore: avgScore.avgScore ? parseFloat(String(avgScore.avgScore)) : 0,
    recentPerformance: recentPerformance.map((r) => ({
      ...r,
      percentage: Math.round((r.score / r.totalQuestions) * 100),
    })),
    documentStats: documentStats.map((d) => ({
      ...d,
      avgScore: d.avgScore ? parseFloat(String(d.avgScore)) : 0,
    })),
  });
}
