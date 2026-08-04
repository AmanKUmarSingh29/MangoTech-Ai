import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { desc, eq, or, isNull } from "drizzle-orm";
import { PDFParse } from "pdf-parse";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession();
  let query;

  if (session) {
    query = db
      .select()
      .from(documents)
      .where(or(eq(documents.userId, session.id), isNull(documents.userId)))
      .orderBy(desc(documents.createdAt));
  } else {
    query = db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
  }

  const docs = await query;
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    let extractedText = "";
    let pageCount = 1;

    try {
      const pdf = new PDFParse({ data: uint8 });
      const textResult = await pdf.getText();
      extractedText = textResult.text?.trim() || "";
      pageCount = textResult.total || 1;
      await pdf.destroy();
    } catch {
      return NextResponse.json(
        { error: "Failed to parse PDF file. Please ensure it contains readable text." },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from this PDF. It may be image-based or empty.",
        },
        { status: 400 }
      );
    }

    // Generate title from filename
    const title = file.name
      .replace(/\.pdf$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const [doc] = await db
      .insert(documents)
      .values({
        userId: session?.id || null,
        title,
        filename: file.name,
        content: extractedText,
        fileSize: file.size,
        pageCount,
      })
      .returning();

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
