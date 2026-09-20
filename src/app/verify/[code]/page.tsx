import { prisma } from "@/lib/prisma";
import { eventTypeLabel } from "@/lib/eventLabels";
import { RingBurst, Triangle } from "@/components/MemphisShapes";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
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
    return (
      <div className="relative max-w-md mx-auto px-5 py-20 text-center overflow-hidden">
        <Triangle className="hidden sm:block absolute top-8 right-6 h-8 w-8 text-sun" />
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-ink bg-danger-soft text-danger text-xl font-bold shadow-soft mb-4">
          ✕
        </div>
        <h1 className="font-display text-2xl mb-2">No certificate found</h1>
        <p className="text-sm text-ink-dim">
          <span className="mono">{code}</span> doesn&apos;t match any issued certificate.
        </p>
      </div>
    );
  }

  const isValid = certificate.status === "ISSUED" || certificate.status === "REISSUED";

  return (
    <div className="relative max-w-md mx-auto px-5 py-20 text-center overflow-hidden">
      <Triangle className="hidden sm:block absolute top-8 right-6 h-8 w-8 text-sun" />
      <div className="relative inline-flex items-center justify-center w-14 h-14 mb-4">
        <RingBurst
          className={`absolute -inset-3 h-20 w-20 ${isValid ? "text-pipeline" : "text-danger"}`}
        />
        <div
          className="relative inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-ink text-xl font-bold shadow-soft"
          style={{
            background: isValid ? "#7CF5DA" : "#FFB199",
            color: isValid ? "#0F2E27" : "#5C1B0A",
          }}
        >
          {isValid ? "✓" : "✕"}
        </div>
      </div>
      <h1 className="font-display text-2xl mb-1">
        {isValid ? "Certificate verified" : `Certificate ${certificate.status.toLowerCase()}`}
      </h1>
      <p className="text-sm text-ink-dim mb-8 mono">{code}</p>

      <div className="rounded-lg border border-line bg-surface shadow-soft p-6 text-left text-sm space-y-3">
        <div className="flex justify-between">
          <span className="text-ink-dim">Recipient</span>
          <span className="font-medium">{certificate.recipientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-dim">Awarded for</span>
          <span className="font-medium text-right">{certificate.eventName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-dim">Type</span>
          <span>{eventTypeLabel(certificate.eventType)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-dim">Issued</span>
          <span>{certificate.issuedAt.toLocaleDateString()}</span>
        </div>
        {certificate.revokedAt && (
          <div className="flex justify-between">
            <span className="text-ink-dim">Revoked</span>
            <span className="text-danger">{certificate.revokedAt.toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-ink-dim">Template version</span>
          <span className="mono">v{certificate.templateVersion}</span>
        </div>
      </div>
    </div>
  );
}
