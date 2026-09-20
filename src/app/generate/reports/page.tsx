import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildCertificateWhere, parseReportFilters, hasAnyFilter, type ReportFilters } from "@/lib/reportFilters";
import { EVENT_TYPES } from "@/lib/eventTypes";
import { eventTypeLabel, statusTone } from "@/lib/eventLabels";
import { getCurrentUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

const STATUSES = ["ISSUED", "REVOKED", "REISSUED"];

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

function TextField({ name, label, value }: { name: string; label: string; value?: string }) {
  return (
    <div>
      <label className="block text-xs text-ink-dim mb-1">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={value ?? ""}
        className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
      />
    </div>
  );
}

function buildQueryString(filters: ReportFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) redirect("/login");

  const rawParams = await searchParams;
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string") urlParams.set(key, value);
  }
  const filters = parseReportFilters(urlParams);
  const filtered = hasAnyFilter(filters);

  const certificates = await prisma.certificate.findMany({
    where: { ...buildCertificateWhere(filters), ownerId },
    orderBy: { issuedAt: "desc" },
    take: 500,
  });

  const exportHref = `/api/admin/reports/export${buildQueryString(filters) ? `?${buildQueryString(filters)}` : ""}`;

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-1">Reports</h1>
      <p className="text-sm text-ink-dim mb-8">
        Filter issued certificates by holder, event/course, certificate title, type,
        status, verification code, or issue date. Filters combine with AND.
      </p>

      <form method="get" className="rounded-lg border border-line bg-surface shadow-soft p-5 mb-8">
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <TextField name="holderName" label="Certificate holder name" value={filters.holderName} />
          <TextField name="holderEmail" label="Holder email" value={filters.holderEmail} />
          <TextField name="eventName" label="Event / course name" value={filters.eventName} />
          <TextField name="certificateTitle" label="Certificate title" value={filters.certificateTitle} />
          <TextField name="verificationCode" label="Verification code" value={filters.verificationCode} />
          <div>
            <label className="block text-xs text-ink-dim mb-1">Event type</label>
            <select
              name="eventType"
              defaultValue={filters.eventType ?? ""}
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-dim mb-1">Status</label>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-dim mb-1">Issued from</label>
            <input
              type="date"
              name="issuedFrom"
              defaultValue={filters.issuedFrom ?? ""}
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-dim mb-1">Issued to</label>
            <input
              type="date"
              name="issuedTo"
              defaultValue={filters.issuedTo ?? ""}
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-md bg-accent text-white font-bold text-sm px-4 py-2 shadow-soft">
            Apply filters
          </button>
          {filtered && (
            <a href="/generate/reports" className="text-xs font-bold text-ink-dim underline">
              Clear
            </a>
          )}
          <a href={exportHref} className="ml-auto text-xs font-bold text-pipeline underline">
            Export CSV ({certificates.length} row{certificates.length === 1 ? "" : "s"})
          </a>
        </div>
      </form>

      {certificates.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface shadow-soft p-8 text-center text-sm text-ink-dim">
          {filtered ? "No certificates match these filters." : "No certificates issued yet."}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface shadow-soft overflow-x-auto">
          <table className="w-full text-sm min-w-225">
            <thead>
              <tr className="text-left text-xs text-ink mono font-bold uppercase tracking-wide bg-surface-2 border-b-2 border-line">
                <th className="px-4 py-3">Holder</th>
                <th className="px-4 py-3">Event / course</th>
                <th className="px-4 py-3">Certificate title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Code</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{cert.recipientName}</div>
                    <div className="text-xs text-ink-dim">{cert.recipientEmail}</div>
                  </td>
                  <td className="px-4 py-3">{cert.eventName}</td>
                  <td className="px-4 py-3">{cert.certificateTitle}</td>
                  <td className="px-4 py-3 text-xs text-ink-dim">{eventTypeLabel(cert.eventType)}</td>
                  <td className="px-4 py-3">
                    <Badge status={cert.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-dim">{cert.issuedAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <a href={`/verify/${cert.verificationCode}`} className="mono text-xs font-bold text-pipeline underline">
                      {cert.verificationCode}
                    </a>
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
