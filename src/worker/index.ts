import "dotenv/config";
import { prisma } from "@/lib/prisma";

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 1500);
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const BATCH_SIZE = 5;
const MAX_ATTEMPTS = 5;

let stopping = false;

// The actual rendering happens inside the Next.js server (see
// /api/internal/issue-certificate) — this process only owns queue polling,
// retries, and dead-lettering, the same split a real SQS consumer + Lambda
// renderer would have.
async function issueCertificate(eventId: string): Promise<void> {
  const res = await fetch(`${APP_BASE_URL}/api/internal/issue-certificate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: eventId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `issue-certificate failed with ${res.status}`);
  }
}

async function claimBatch() {
  // This plain findMany + updateMany claim still assumes a single worker
  // process — it doesn't use SELECT ... FOR UPDATE SKIP LOCKED, which MySQL
  // does support, to keep the demo's poll loop simple. A real queue
  // (SQS/Kafka) gives you safe concurrent consumers for free.
  const batch = await prisma.eligibilityEvent.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });
  if (batch.length === 0) return;

  await prisma.eligibilityEvent.updateMany({
    where: { id: { in: batch.map((e) => e.id) } },
    data: { status: "PROCESSING" },
  });

  for (const event of batch) {
    try {
      await issueCertificate(event.id);
      await prisma.eligibilityEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
      console.log(`[worker] issued certificate for event ${event.eventId} (${event.userEmail})`);
    } catch (err) {
      const attempts = event.attempts + 1;
      const message = err instanceof Error ? err.message : String(err);
      const nextStatus = attempts >= MAX_ATTEMPTS ? "DEAD_LETTER" : "PENDING";
      await prisma.eligibilityEvent.update({
        where: { id: event.id },
        data: { status: nextStatus, attempts, lastError: message },
      });
      console.error(
        `[worker] event ${event.eventId} failed (attempt ${attempts}/${MAX_ATTEMPTS}): ${message}`
      );
    }
  }
}

async function loop() {
  console.log(`[worker] polling every ${POLL_INTERVAL_MS}ms, issuing via ${APP_BASE_URL}`);
  while (!stopping) {
    try {
      await claimBatch();
    } catch (err) {
      console.error("[worker] poll cycle failed:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

let running: Promise<void> | null = null;

async function shutdown() {
  if (stopping) return;
  stopping = true;
  console.log("[worker] shutting down after the current batch finishes…");
  await running;
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});

running = loop();
