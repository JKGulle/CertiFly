import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { processEligibilityEvent } from "@/worker/processEvent";
import { getCurrentUserId } from "@/lib/currentUser";

const recipientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const createCertificateSchema = z.object({
  eventName: z.string().min(1),
  templateKey: z.string().min(1),
  backgroundImageUrl: z.string().url().optional(),
  recipients: z.array(recipientSchema).min(1),
});

interface RecipientResult {
  email: string;
  success: boolean;
  verificationCode?: string;
  error?: string;
}

// Admin-triggered direct issuance. Unlike the public /api/events ingress
// (which just queues a row for the worker's next poll tick), this renders
// and emails each certificate synchronously in the same request, so
// pressing "Create certificate" publishes it immediately. There's no
// separate "event type" here — the chosen template *is* the certificate's
// type — so every admin-created certificate is tagged CUSTOM; only the
// public events API still distinguishes COURSE_COMPLETION/EXAM_PASS/etc.
// Each recipient still gets its own EligibilityEvent row and runs through
// the same processEligibilityEvent path the worker uses, one at a time, so
// a failure for one recipient doesn't stop the rest of the batch.
export async function POST(req: NextRequest) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createCertificateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { eventName, templateKey, backgroundImageUrl, recipients } = parsed.data;

  const results: RecipientResult[] = [];

  for (const [index, recipient] of recipients.entries()) {
    const userId = recipient.email.trim().toLowerCase();
    const eventId = `admin:${eventName}:${userId}:${Date.now()}:${index}`;

    try {
      const event = await prisma.eligibilityEvent.create({
        data: {
          eventId,
          eventType: "CUSTOM",
          eventName,
          userId,
          userName: recipient.name,
          userEmail: recipient.email,
          templateKey,
          backgroundImageUrl,
          status: "PROCESSING",
          ownerId,
        },
      });

      try {
        await processEligibilityEvent(event);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Leave it PENDING (not DEAD_LETTER) so it's a normal retry
        // candidate — e.g. once someone publishes the missing template, the
        // worker's next poll picks it right up automatically.
        await prisma.eligibilityEvent.update({
          where: { id: event.id },
          data: { status: "PENDING", attempts: 1, lastError: message },
        });
        results.push({ email: recipient.email, success: false, error: message });
        continue;
      }

      await prisma.eligibilityEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
      const certificate = await prisma.certificate.findUnique({
        where: { eventId_recipientId: { eventId, recipientId: userId } },
      });
      results.push({
        email: recipient.email,
        success: true,
        verificationCode: certificate?.verificationCode,
      });
    } catch (err) {
      // Covers failures outside processEligibilityEvent itself (e.g. the
      // database being unreachable for the initial create) so one bad
      // recipient still comes back as JSON instead of an unhandled 500.
      const message = err instanceof Error ? err.message : String(err);
      results.push({ email: recipient.email, success: false, error: message });
    }
  }

  const anySucceeded = results.some((r) => r.success);
  return NextResponse.json({ results }, { status: anySucceeded ? 201 : 400 });
}
