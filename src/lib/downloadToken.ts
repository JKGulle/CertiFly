import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.DOWNLOAD_TOKEN_SECRET ?? "dev-only-insecure-secret";
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

function sign(certificateId: string, expiresAt: number): string {
  return createHmac("sha256", SECRET)
    .update(`${certificateId}:${expiresAt}`)
    .digest("base64url");
}

// Signed, expiring URL in place of a public storage bucket — see
// "Reliability & security" in the architecture doc.
export function createDownloadUrl(
  certificateId: string,
  baseUrl: string,
  ttlMs: number = DEFAULT_TTL_MS
): string {
  const expiresAt = Date.now() + ttlMs;
  const token = sign(certificateId, expiresAt);
  const url = new URL(`/api/certificates/${certificateId}/download`, baseUrl);
  url.searchParams.set("expires", String(expiresAt));
  url.searchParams.set("token", token);
  return url.toString();
}

export function verifyDownloadToken(
  certificateId: string,
  expiresAtRaw: string | null,
  token: string | null
): boolean {
  if (!expiresAtRaw || !token) return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = sign(certificateId, expiresAt);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
