import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createDownloadUrl } from "@/lib/downloadToken";
import { eventTypeLabel, statusTone } from "@/lib/eventLabels";
import { Triangle, Zigzag } from "@/components/MemphisShapes";

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

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const certificates = await prisma.certificate.findMany({
    where: query
      ? {
          OR: [
            { recipientName: { contains: query } },
            { recipientEmail: { contains: query } },
            { eventName: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { issuedAt: "desc" },
    take: 200,
  });

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <div className="relative inline-block mb-1">
        <h1 className="font-display text-3xl">Certificates</h1>
        <Triangle className="hidden sm:block absolute -right-10 -top-3 h-8 w-8 text-sun" />
      </div>
      <p className="text-sm text-ink-dim mb-8 max-w-xl">
        Every certificate issued by the worker, newest first. Search by
        recipient name, event name, or email. Download links are signed and
        expire in 15 minutes.
      </p>

      <form method="get" className="flex gap-2 mb-8">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by name, event, or email"
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-accent text-white font-bold text-sm px-4 py-2 shadow-soft"
        >
          Search
        </button>
        {query && (
          <Link
            href="/certificates"
            className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-bold text-ink-dim shadow-soft"
          >
            Clear
          </Link>
        )}
      </form>

      {certificates.length === 0 ? (
        <div className="relative rounded-lg border border-line bg-surface shadow-soft p-8 text-center text-sm text-ink-dim overflow-hidden">
          <Zigzag className="absolute top-3 left-1/2 -translate-x-1/2 h-3 w-24 text-accent-soft" />
          {query ? (
            <>
              No certificates found for <span className="mono">{query}</span>.
            </>
          ) : (
            <>
              No certificates yet. Trigger an event from{" "}
              <a href="/generate" className="text-accent underline font-bold">
                Generate
              </a>{" "}
              to see one appear here once the worker processes it.
            </>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface shadow-soft overflow-x-auto">
          <table className="w-full text-sm min-w-180">
            <thead>
              <tr className="text-left text-xs text-ink mono font-bold uppercase tracking-wide bg-surface-2 border-b-2 border-line">
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verify</th>
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
                  <td className="px-4 py-3 text-ink-dim">
                    {cert.issuedAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={cert.status} />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/verify/${cert.verificationCode}`}
                      className="mono text-xs font-bold text-pipeline underline"
                    >
                      {cert.verificationCode}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {cert.status === "REVOKED" ? (
                      <span className="text-xs text-ink-dim">Revoked</span>
                    ) : (
                      <a
                        href={createDownloadUrl(cert.id, baseUrl)}
                        className="text-xs font-bold text-accent underline"
                      >
                        Download
                      </a>
                    )}
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
