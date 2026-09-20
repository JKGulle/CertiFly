import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// The only endpoint the open internet talks to directly. Confirms validity
// and status without exposing the underlying record (no email, no ids).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { verificationCode: code },
    select: {
      recipientName: true,
      eventName: true,
      eventType: true,
      status: true,
      issuedAt: true,
      revokedAt: true,
      templateVersion: true,
    },
  });

  if (!certificate) {
    return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    valid: certificate.status === "ISSUED" || certificate.status === "REISSUED",
    status: certificate.status,
    recipientName: certificate.recipientName,
    eventName: certificate.eventName,
    eventType: certificate.eventType,
    issuedAt: certificate.issuedAt,
    revokedAt: certificate.revokedAt,
    templateVersion: certificate.templateVersion,
  });
}
