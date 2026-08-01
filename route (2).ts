import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, quizzes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateQuiz } from "@/lib/ai";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id);

  const docQuizzes = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.documentId, docId))
    .orderBy(desc(quizzes.createdAt));

  return NextResponse.json(docQuizzes);
}

export async function POST(
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

  try {
    const questions = await generateQuiz(doc.content, 10);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Could not generate questions from this document" },
        { status: 400 }
      );
    }

    const [quiz] = await db
      .insert(quizzes)
      .values({
        documentId: docId,
        title: `Quiz: ${doc.title}`,
        questions,
      })
      .returning();

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
