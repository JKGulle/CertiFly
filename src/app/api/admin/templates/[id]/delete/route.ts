import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Deletion is always allowed, even for a template that already has
// certificates issued from it — the schema's onDelete: SetNull means those
// certificates keep their PDF, sha256, and templateVersion/certificateTitle
// snapshot; only the live templateId reference (used by Reissue to find
// "what's active now") is cleared.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.template.delete({ where: { id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
