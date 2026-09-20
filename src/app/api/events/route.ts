import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSystemOwnerId } from "@/lib/currentUser";

const eventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(["COURSE_COMPLETION", "EXAM_PASS", "WEBINAR_CHECKIN", "CUSTOM"]),
  eventName: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  userEmail: z.string().email(),
  templateKey: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

// Public ingress for "certificate.eligible" — whatever already knows a user
// is eligible (LMS, exam grader, webinar platform) posts here and moves on;
// this only durably records the fact, it never renders anything itself.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const ownerId = await getSystemOwnerId();

  const queued = await prisma.eligibilityEvent.create({
    data: {
      eventId: data.eventId,
      eventType: data.eventType,
      eventName: data.eventName,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      templateKey: data.templateKey ?? "default",
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      ownerId,
    },
  });

  return NextResponse.json(
    { id: queued.id, status: queued.status, message: "Event queued for certificate issuance" },
    { status: 202 }
  );
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const events = await prisma.eligibilityEvent.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ events });
}
