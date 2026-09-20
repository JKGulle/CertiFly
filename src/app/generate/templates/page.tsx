import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ActionButton } from "@/components/ActionButton";
import { templateConfigSchema, type TemplateConfig } from "@/lib/template";
import { templatePreviewDataUri } from "@/lib/templatePreview";

export const dynamic = "force-dynamic";

function parseConfig(raw: string): TemplateConfig | null {
  try {
    const result = templateConfigSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: [{ key: "asc" }, { version: "desc" }],
  });

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-display text-3xl">Templates</h1>
        <Link
          href="/generate/templates/new"
          className="shrink-0 rounded-md bg-accent text-white font-bold text-sm px-4 py-2 shadow-soft"
        >
          New template
        </Link>
      </div>
      <p className="text-sm text-ink-dim mb-8">
        Versioned designs. Publishing a new version never overwrites the old one —
        certificates already issued keep citing the exact version they were
        rendered from.
      </p>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface shadow-soft p-8 text-center text-sm text-ink-dim">
          No templates yet.{" "}
          <Link href="/generate/templates/new" className="text-accent underline">
            Create one
          </Link>
          .
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const config = parseConfig(t.config);
            return (
              <div
                key={t.id}
                className="rounded-lg border border-line bg-surface shadow-soft overflow-hidden flex flex-col"
              >
                <div className="aspect-[800/566] bg-bg border-b border-line">
                  {config ? (
                    <img
                      src={templatePreviewDataUri(config)}
                      alt={`Preview of ${t.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-dim">
                      Preview unavailable
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <span className="mono text-xs text-ink-dim truncate">
                    {t.key} · v{t.version}
                  </span>
                  <h2 className="font-medium text-sm">{t.name}</h2>
                  <div className="mt-auto pt-2 flex items-center gap-3">
                    <Link href={`/generate/templates/${t.id}/edit`} className="text-xs font-bold text-accent underline">
                      Edit
                    </Link>
                    <ActionButton
                      href={`/api/admin/templates/${t.id}/delete`}
                      label="Delete"
                      pendingLabel="Deleting…"
                      className="text-xs font-bold text-danger underline disabled:opacity-50"
                      confirmMessage={`Delete "${t.name}" (${t.key} v${t.version})? Certificates already issued from it keep their PDF and details, but lose the ability to be reissued from this exact design.`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
