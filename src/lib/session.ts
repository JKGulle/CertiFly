import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-secret";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const SESSION_COOKIE = "certifly_session";
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

// Signed, expiring cookie value in place of a session store — same approach
// as the download-link tokens in downloadToken.ts.
export function createSessionToken(userId: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}:${expiresAt}`;
  const signature = sign(payload);
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): { userId: string } | null {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const payload = Buffer.from(payloadB64, "base64url").toString();
  const expected = sign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [userId, expiresAtRaw] = payload.split(":");
  const expiresAt = Number(expiresAtRaw);
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return { userId };
}
