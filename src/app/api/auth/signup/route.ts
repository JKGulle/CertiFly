import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword(password) },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
