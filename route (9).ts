import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, summaries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { summarizeText } from "@/lib/ai";

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
    const result = await summarizeText(doc.content);

    const [summary] = await db
      .insert(summaries)
      .values({
        documentId: docId,
        content: result.summary,
        keyPoints: result.keyPoints,
      })
      .returning();

    return NextResponse.json(summary, { status: 201 });
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
