import { db } from "@/db";
import { documents, summaries, quizzes, quizAttempts, qaMessages } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DocumentClient } from "./DocumentClient";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const docId = parseInt(id);

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, docId));

  if (!doc) {
    notFound();
  }

  const docSummaries = await db
    .select()
    .from(summaries)
    .where(eq(summaries.documentId, docId))
    .orderBy(desc(summaries.createdAt));

  const docQuizzes = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.documentId, docId))
    .orderBy(desc(quizzes.createdAt));

  const docAttempts = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.documentId, docId))
    .orderBy(desc(quizAttempts.completedAt));

  const docMessages = await db
    .select()
    .from(qaMessages)
    .where(eq(qaMessages.documentId, docId))
    .orderBy(asc(qaMessages.createdAt));

  return (
    <DocumentClient
      document={doc}
      summaries={docSummaries}
      quizzes={docQuizzes}
      attempts={docAttempts}
      messages={docMessages}
    />
  );
}
