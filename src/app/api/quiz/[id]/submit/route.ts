import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, quizAttempts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quizId = parseInt(id);
  const { answers, timeTaken } = await req.json();

  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, quizId));

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const questions = quiz.questions;
  const gradedAnswers: { questionId: number; selected: number; correct: boolean }[] = [];
  let score = 0;

  for (const q of questions) {
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) score++;
    gradedAnswers.push({
      questionId: q.id,
      selected: userAnswer ?? -1,
      correct: isCorrect,
    });
  }

  const [attempt] = await db
    .insert(quizAttempts)
    .values({
      quizId,
      documentId: quiz.documentId,
      score,
      totalQuestions: questions.length,
      answers: gradedAnswers,
      timeTaken: timeTaken || 0,
    })
    .returning();

  return NextResponse.json(
    {
      ...attempt,
      questions: questions.map((q) => ({
        ...q,
        userAnswer: answers[q.id],
        isCorrect: answers[q.id] === q.correctAnswer,
      })),
    },
    { status: 201 }
  );
}
