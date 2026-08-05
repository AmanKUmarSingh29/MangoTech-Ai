import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, qaMessages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { answerQuestion } from "@/lib/ai";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id);

  const messages = await db
    .select()
    .from(qaMessages)
    .where(eq(qaMessages.documentId, docId))
    .orderBy(asc(qaMessages.createdAt));

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id);
  const { question } = await req.json();

  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 }
    );
  }

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, docId));

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Get conversation history
  const history = await db
    .select()
    .from(qaMessages)
    .where(eq(qaMessages.documentId, docId))
    .orderBy(asc(qaMessages.createdAt));

  try {
    // Save user question
    await db.insert(qaMessages).values({
      documentId: docId,
      role: "user",
      content: question,
    });

    // Generate answer
    const answer = await answerQuestion(
      doc.content,
      question,
      history.map((m) => ({ role: m.role, content: m.content }))
    );

    // Save assistant answer
    const [savedAnswer] = await db
      .insert(qaMessages)
      .values({
        documentId: docId,
        role: "assistant",
        content: answer,
      })
      .returning();

    return NextResponse.json(savedAnswer, { status: 201 });
  } catch (error) {
    console.error("Q&A error:", error);
    return NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 }
    );
  }
}
