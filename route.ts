import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  documents,
  quizAttempts,
  summaries,
  quizzes,
  qaMessages,
} from "@/db/schema";
import { count, avg, sql, desc, eq, or, isNull } from "drizzle-orm";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();

  const docWhere = session
    ? or(eq(documents.userId, session.id), isNull(documents.userId))
    : undefined;

  const attemptWhere = session
    ? or(eq(quizAttempts.userId, session.id), isNull(quizAttempts.userId))
    : undefined;

  // Total counts
  const [docCount] = await db
    .select({ value: count() })
    .from(documents)
    .where(docWhere);

  const [summaryCount] = await db.select({ value: count() }).from(summaries);
  const [quizCount] = await db.select({ value: count() }).from(quizzes);
  const [attemptCount] = await db
    .select({ value: count() })
    .from(quizAttempts)
    .where(attemptWhere);
  const [qaCount] = await db.select({ value: count() }).from(qaMessages);

  // Average quiz score
  const [avgScore] = await db
    .select({
      avgScore: avg(
        sql`CAST(${quizAttempts.score} AS FLOAT) / NULLIF(${quizAttempts.totalQuestions}, 0) * 100`
      ),
    })
    .from(quizAttempts)
    .where(attemptWhere);

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
    .where(attemptWhere)
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
    .where(docWhere)
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
