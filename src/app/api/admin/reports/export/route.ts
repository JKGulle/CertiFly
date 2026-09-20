import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCertificateWhere, parseReportFilters } from "@/lib/reportFilters";
import { eventTypeLabel } from "@/lib/eventLabels";
import { toCsv } from "@/lib/csv";
import { getCurrentUserId } from "@/lib/currentUser";

export async function GET(req: NextRequest) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filters = parseReportFilters(req.nextUrl.searchParams);

  const certificates = await prisma.certificate.findMany({
    where: { ...buildCertificateWhere(filters), ownerId },
    orderBy: { issuedAt: "desc" },
    take: 5000,
  });

  const csv = toCsv(
    [
      "Holder name",
      "Holder email",
      "Event / course",
      "Certificate title",
      "Event type",
      "Status",
      "Verification code",
      "Issued at",
      "Revoked at",
      "Template version",
    ],
    certificates.map((c) => [
      c.recipientName,
      c.recipientEmail,
      c.eventName,
      c.certificateTitle,
      eventTypeLabel(c.eventType),
      c.status,
      c.verificationCode,
      c.issuedAt.toISOString(),
      c.revokedAt ? c.revokedAt.toISOString() : "",
      c.templateVersion,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="certificates-report-${Date.now()}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
