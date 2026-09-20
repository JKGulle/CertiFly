import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// For authenticated /generate pages and /api/admin/* routes — both already
// sit behind proxy.ts, so this should never be null there, but callers still
// check rather than assuming the proxy ran.
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token)?.userId ?? null;
}

// The public /api/events ingress has no session to attribute ownership
// from (it's a server-to-server webhook), so certificates it produces are
// owned by whichever account has existed the longest.
export async function getSystemOwnerId(): Promise<string> {
  const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!owner) {
    throw new Error("No account exists yet to own events from /api/events — run `npm run db:seed` first.");
  }
  return owner.id;
}
