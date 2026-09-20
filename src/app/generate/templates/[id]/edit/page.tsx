import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateForm } from "@/components/TemplateForm";
import { templateConfigSchema } from "@/lib/template";

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) notFound();

  const config = templateConfigSchema.parse(JSON.parse(template.config));
  const usageCount = await prisma.certificate.count({ where: { templateId: id } });

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-1">Edit template</h1>
      <p className="text-sm text-ink-dim mb-8">
        <span className="mono">{template.key}</span> v{template.version} — {template.name}.{" "}
        {usageCount > 0
          ? `${usageCount} certificate${usageCount === 1 ? " has" : "s have"} already been issued from this version, so saving will publish a new version instead of changing this one.`
          : "No certificates have been issued from this version yet, so your changes save in place."}
      </p>
      <TemplateForm
        mode="edit"
        templateId={template.id}
        initialKey={template.key}
        initialName={template.name}
        initialConfig={config}
      />
    </div>
  );
}
