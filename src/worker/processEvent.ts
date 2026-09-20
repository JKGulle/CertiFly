import { renderToBuffer } from "@react-pdf/renderer";
import { Prisma, type EligibilityEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/hash";
import { generateVerificationCode } from "@/lib/verificationCode";
import { saveCertificatePdf } from "@/lib/storage";
import { generateQrDataUrl } from "@/lib/qr";
import { CertificateDocument } from "@/lib/certificateDocument";
import { allSignatories, mergeTemplate, templateConfigSchema } from "@/lib/template";
import { createDownloadUrl } from "@/lib/downloadToken";
import { sendCertificateEmail } from "@/lib/mail";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

async function deliverCertificateEmail(certificate: {
  id: string;
  verificationCode: string;
  recipientEmail: string;
  recipientName: string;
  eventName: string;
}): Promise<void> {
  const downloadUrl = createDownloadUrl(certificate.id, APP_BASE_URL);
  const verifyUrl = new URL(`/verify/${certificate.verificationCode}`, APP_BASE_URL).toString();

  await sendCertificateEmail({
    to: certificate.recipientEmail,
    recipientName: certificate.recipientName,
    eventName: certificate.eventName,
    downloadUrl,
    verifyUrl,
  });

  await prisma.certificate.update({
    where: { id: certificate.id },
    data: { lastEmailedAt: new Date(), emailSendCount: { increment: 1 } },
  });
}

/**
 * Consumes a single certificate.eligible event. Idempotent: replays of the
 * same (eventId, recipientId) pair short-circuit on the DB unique
 * constraint instead of issuing a second certificate.
 */
export async function processEligibilityEvent(event: EligibilityEvent): Promise<void> {
  const recipientEmail = event.userEmail.trim().toLowerCase();

  const already = await prisma.certificate.findUnique({
    where: { eventId_recipientId: { eventId: event.eventId, recipientId: event.userId } },
  });
  if (already) {
    // The certificate was already issued. If a previous attempt crashed or
    // the SMTP call failed after the row was created, lastEmailedAt is still
    // null — retry just the email instead of treating this as a full no-op.
    if (!already.lastEmailedAt) {
      await deliverCertificateEmail(already);
    }
    return;
  }

  const template = await prisma.template.findFirst({
    where: { key: event.templateKey, isActive: true },
    orderBy: { version: "desc" },
  });
  if (!template) {
    throw new Error(`No active template published for key "${event.templateKey}"`);
  }

  const config = templateConfigSchema.parse(JSON.parse(template.config));
  const verificationCode = await generateVerificationCode();
  const certificateId = crypto.randomUUID();
  const verifyUrl = new URL(`/verify/${verificationCode}`, APP_BASE_URL).toString();

  const metadata = event.metadata ? (JSON.parse(event.metadata) as Record<string, string>) : {};
  const issuedDate = new Date();
  const issuedDateLabel = issuedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fields = {
    recipientName: event.userName,
    eventName: event.eventName,
    orgName: config.orgName,
    issuedDate: issuedDateLabel,
    verificationCode,
    ...metadata,
  };

  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  const pdfBuffer = await renderToBuffer(
    CertificateDocument({
      title: config.title,
      orgName: config.orgName,
      recipientName: event.userName,
      bodyText: mergeTemplate(config.bodyTemplate, fields),
      issuedDateLabel,
      signatories: allSignatories(config),
      accentColor: config.accentColor,
      verificationCode,
      qrDataUrl,
      logoUrl: config.logoUrl,
      backgroundImageUrl: event.backgroundImageUrl ?? undefined,
    })
  );

  const hash = sha256(pdfBuffer);
  const pdfPath = await saveCertificatePdf(certificateId, pdfBuffer);

  try {
    await prisma.certificate.create({
      data: {
        id: certificateId,
        verificationCode,
        eventId: event.eventId,
        eventType: event.eventType,
        eventName: event.eventName,
        recipientId: event.userId,
        recipientName: event.userName,
        recipientEmail,
        certificateTitle: config.title,
        templateId: template.id,
        templateVersion: template.version,
        backgroundImageUrl: event.backgroundImageUrl,
        pdfPath,
        sha256: hash,
        issuedAt: issuedDate,
        ownerId: event.ownerId,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = err.meta?.target;
      const conflictFields = Array.isArray(target) ? target : typeof target === "string" ? [target] : [];
      // Only the (eventId, recipientId) constraint means "a concurrent
      // worker already issued this certificate" — safe to treat as success.
      // A verificationCode collision is a different failure (this event's
      // certificate was never persisted) and must propagate so it retries.
      if (conflictFields.includes("eventId") || conflictFields.includes("recipientId")) return;
    }
    throw err;
  }

  await deliverCertificateEmail({
    id: certificateId,
    verificationCode,
    recipientEmail,
    recipientName: event.userName,
    eventName: event.eventName,
  });
}
