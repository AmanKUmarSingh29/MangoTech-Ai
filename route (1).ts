import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  createSessionToken,
  AUTH_COOKIE_NAME,
} from "@/lib/auth";

export async function POST() {
  try {
    const demoEmail = "student@mangotech.ai";
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, demoEmail));

    if (!user) {
      const passwordHash = await hashPassword("mangoDemo123!");
      [user] = await db
        .insert(users)
        .values({
          name: "Alex Johnson",
          email: demoEmail,
          passwordHash,
        })
        .returning();
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      message: "Logged in as Demo Student",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json(
      { error: "Failed to sign in with demo account." },
      { status: 500 }
    );
  }
}
