import { NextResponse } from "next/server";

// Route handlers that hit Prisma or the filesystem can throw on failures a
// client can't predict (DB unreachable, read-only storage, etc.). Without a
// catch, Next.js turns that into a body-less 500 in production, and every
// caller here does `await res.json()` unconditionally — an empty body makes
// that throw "Unexpected end of JSON input" instead of showing the real
// error. Always resolve to a JSON body so the client gets a real message.
export function unexpectedErrorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return NextResponse.json({ error: message }, { status: 500 });
}
