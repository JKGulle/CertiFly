import { TemplateForm } from "@/components/TemplateForm";

export const dynamic = "force-dynamic";

export default function NewTemplatePage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-1">New template</h1>
      <p className="text-sm text-ink-dim mb-8">
        Publishing activates this design immediately. Reuse an existing key to
        add a new version under it, or type a new key to start a new design
        family.
      </p>
      <TemplateForm mode="create" />
    </div>
  );
}
