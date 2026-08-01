import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  documents,
  summaries,
  quizzes,
  quizAttempts,
  qaMessages,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id);

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, docId));
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const docSummaries = await db
    .select()
    .from(summaries)
    .where(eq(summaries.documentId, docId));
  const docQuizzes = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.documentId, docId));
  const docAttempts = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.documentId, docId));
  const docMessages = await db
    .select()
    .from(qaMessages)
    .where(eq(qaMessages.documentId, docId));

  return NextResponse.json({
    ...doc,
    summaries: docSummaries,
    quizzes: docQuizzes,
    attempts: docAttempts,
    messages: docMessages,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id);

  await db.delete(documents).where(eq(documents.id, docId));
  return NextResponse.json({ success: true });
}
