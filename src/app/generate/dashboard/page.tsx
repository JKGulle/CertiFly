import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { eventTypeLabel, statusTone } from "@/lib/eventLabels";
import { Dots } from "@/components/MemphisShapes";
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

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface shadow-soft p-4">
      <div className="h-1.5 w-10 rounded-full mb-3" style={{ background: accent }} />
      <div className="font-display text-3xl leading-none mb-1">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wide text-ink-dim">{label}</div>
    </div>
  );
}

function sevenDaysAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

export default async function DashboardPage() {
  const ownerId = await getCurrentUserId();
  if (!ownerId) redirect("/login");

  const [statusGroups, issuedLast7Days, topTitleGroups, recent] = await Promise.all([
    prisma.certificate.groupBy({ by: ["status"], where: { ownerId }, _count: { _all: true } }),
    prisma.certificate.count({ where: { ownerId, issuedAt: { gte: sevenDaysAgo() } } }),
    prisma.certificate.groupBy({
      by: ["certificateTitle"],
      where: { ownerId },
      _count: { _all: true },
      orderBy: { _count: { certificateTitle: "desc" } },
      take: 1,
    }),
    prisma.certificate.findMany({ where: { ownerId }, orderBy: { issuedAt: "desc" }, take: 10 }),
  ]);

  const countFor = (status: string) =>
    statusGroups.find((g) => g.status === status)?._count._all ?? 0;
  const total = statusGroups.reduce((sum, g) => sum + g._count._all, 0);
  const topTitle = topTitleGroups[0];

  return (
    <div className="relative max-w-5xl mx-auto px-5 py-12 overflow-hidden">
      <Dots className="hidden sm:block absolute top-14 right-0 h-6 w-16 text-sun" />
      <h1 className="font-display text-3xl mb-1">Dashboard</h1>
      <p className="text-sm text-ink-dim mb-8 max-w-xl">
        At-a-glance overview of everything issued so far. For filterable detail
        and CSV export, use Reports.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatTile label="Total" value={String(total)} accent="var(--ink)" />
        <StatTile label="Issued" value={String(countFor("ISSUED"))} accent="#7CF5DA" />
        <StatTile label="Last 7 days" value={String(issuedLast7Days)} accent="#FFE066" />
        <StatTile
          label="Top certificate"
          value={topTitle ? String(topTitle._count._all) : "—"}
          accent="var(--accent)"
        />
      </div>
      {topTitle && (
        <p className="text-xs text-ink-dim mb-8 -mt-6">
          Most-issued certificate: <span className="font-bold text-ink">{topTitle.certificateTitle || "Untitled"}</span>
        </p>
      )}

      <h2 className="font-display text-xl mb-3">Recent activity</h2>
      {recent.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface shadow-soft p-8 text-center text-sm text-ink-dim">
          No certificates issued yet.
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface shadow-soft overflow-x-auto">
          <table className="w-full text-sm min-w-150">
            <thead>
              <tr className="text-left text-xs text-ink mono font-bold uppercase tracking-wide bg-surface-2 border-b-2 border-line">
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((cert) => (
                <tr key={cert.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{cert.recipientName}</div>
                    <div className="text-xs text-ink-dim">{cert.recipientEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{cert.eventName}</div>
                    <div className="text-xs text-ink-dim">{eventTypeLabel(cert.eventType)}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-dim">{cert.issuedAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge status={cert.status} />
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
