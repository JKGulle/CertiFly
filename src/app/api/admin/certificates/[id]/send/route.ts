import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDownloadUrl } from "@/lib/downloadToken";
import { sendCertificateEmail } from "@/lib/mail";
import { getCurrentUserId } from "@/lib/currentUser";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

// Admin-triggered (re)send. Reuses the same mailer the worker uses at
// issuance time, so a flaky first send or a "resend to their inbox" request
// doesn't require re-issuing the certificate.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate || certificate.ownerId !== ownerId) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  if (certificate.status === "REVOKED") {
    return NextResponse.json(
      { error: "Can't email a revoked certificate" },
      { status: 400 }
    );
  }

  const downloadUrl = createDownloadUrl(certificate.id, APP_BASE_URL);
  const verifyUrl = new URL(`/verify/${certificate.verificationCode}`, APP_BASE_URL).toString();

  await sendCertificateEmail({
    to: certificate.recipientEmail,
    recipientName: certificate.recipientName,
    eventName: certificate.eventName,
    downloadUrl,
    verifyUrl,
  });

  const updated = await prisma.certificate.update({
    where: { id },
    data: { lastEmailedAt: new Date(), emailSendCount: { increment: 1 } },
  });

  return NextResponse.json({ certificate: updated });
}
