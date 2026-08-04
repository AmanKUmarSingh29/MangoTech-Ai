import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const AUTH_COOKIE_NAME = "mangotech_session";

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    "mangotech-ai-secure-secret-study-platform-2025"
);

export interface AuthSessionUser {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface JWTPayloadData {
  userId: number;
  email: string;
  name: string;
  [key: string]: unknown;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: {
  userId: number;
  email: string;
  name: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET_KEY);
}

export async function verifySessionToken(
  token: string
): Promise<JWTPayloadData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    return payload as unknown as JWTPayloadData;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<AuthSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user) return null;

    return user;
  } catch {
    return null;
  }
}
