import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActionButton } from "@/components/ActionButton";
import { eventTypeLabel, statusTone } from "@/lib/eventLabels";
import { getCurrentUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

function Badge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span
      className="mono text-xs font-bold px-2 py-0.5 rounded-full border-2 border-ink"
      style={{ background: tone.bg, color: tone.fg }}
    >
      {status}
    </span>
  );
}

export default async function GenerateCertificatesPage() {
  const ownerId = await getCurrentUserId();
  if (!ownerId) redirect("/login");

  const certificates = await prisma.certificate.findMany({
    where: { ownerId },
    orderBy: { issuedAt: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-1">Certificates</h1>
      <p className="text-sm text-ink-dim mb-8">
        Every certificate issued so far. Send (or resend) a copy straight to
        the recipient&apos;s inbox.
      </p>

      {certificates.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface shadow-soft p-8 text-center text-sm text-ink-dim">
          No certificates issued yet.
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface shadow-soft overflow-x-auto">
          <table className="w-full text-sm min-w-190">
            <thead>
              <tr className="text-left text-xs text-ink mono font-bold uppercase tracking-wide bg-surface-2 border-b-2 border-line">
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Emailed</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{cert.recipientName}</div>
                    <div className="text-xs text-ink-dim">{cert.recipientEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{cert.eventName}</div>
                    <div className="text-xs text-ink-dim">{eventTypeLabel(cert.eventType)}</div>
                  </td>
                  <td className="px-4 py-3 mono text-xs">{cert.verificationCode}</td>
                  <td className="px-4 py-3">
                    <Badge status={cert.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-dim">
                    {cert.lastEmailedAt
                      ? `${cert.lastEmailedAt.toLocaleString()}${cert.emailSendCount > 1 ? ` (×${cert.emailSendCount})` : ""}`
                      : "Not sent"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <ActionButton
                      href={`/api/admin/certificates/${cert.id}/send`}
                      label="Send to mail"
                      pendingLabel="Sending…"
                      className="text-xs font-bold text-accent underline disabled:opacity-50"
                      confirmMessage={`Send this certificate to ${cert.recipientEmail}?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
