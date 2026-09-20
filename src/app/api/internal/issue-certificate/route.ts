import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processEligibilityEvent } from "@/worker/processEvent";

// Internal-only: invoked by the worker process, never by a client. Rendering
// lives here (inside the Next.js server) rather than in the standalone
// worker script because @react-pdf/renderer's CJS/ESM interop only resolves
// cleanly through Next's own bundler, not through a plain Node/tsx process.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const event = await prisma.eligibilityEvent.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    await processEligibilityEvent(event);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
