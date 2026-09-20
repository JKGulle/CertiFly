"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_TEMPLATE_CONFIG, type Signatory, type TemplateConfig } from "@/lib/template";

interface TemplateFormProps {
  mode: "create" | "edit";
  templateId?: string; // required when mode === "edit"
  initialKey?: string;
  initialName?: string;
  initialConfig?: TemplateConfig;
}

const MAX_ADDITIONAL_SIGNATORIES = 2;

async function uploadSignatureFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/uploads/signature-image", { method: "POST", body: formData });
  const body = await res.json();
  if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "Upload failed");
  return body.url;
}

function SignatureFields({
  legend,
  name,
  title,
  imageUrl,
  onNameChange,
  onTitleChange,
  onImageUrlChange,
  onFileChange,
  uploading,
  uploadError,
  onRemove,
}: {
  legend: string;
  name: string;
  title: string;
  imageUrl: string;
  onNameChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  uploadError: string | null;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-bg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ink-dim uppercase tracking-wide">{legend}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs font-bold text-danger underline">
            Remove
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-dim mb-1">Signature name</label>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1">Signature title</label>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-ink-dim mb-1">Signature image (optional)</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            placeholder="https://example.com/signature.png"
            className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
          <label className="shrink-0 rounded-md border border-line bg-surface-2 px-3 py-2 text-sm font-bold text-ink-dim hover:text-ink transition-colors cursor-pointer">
            {uploading ? "Uploading…" : "Browse…"}
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg"
              onChange={onFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        {uploadError && <p className="text-xs text-danger mt-1">{uploadError}</p>}
        {imageUrl && (
          <div className="mt-2 h-14 w-36 rounded-md border border-line overflow-hidden bg-surface flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary externally-hosted or uploaded URL, not a static build asset */}
            <img src={imageUrl} alt="Signature preview" className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplateForm({
  mode,
  templateId,
  initialKey,
  initialName,
  initialConfig,
}: TemplateFormProps) {
  const router = useRouter();
  const [key, setKey] = useState(initialKey ?? "");
  const [name, setName] = useState(initialName ?? "Untitled design");
  const [config, setConfig] = useState<TemplateConfig>(initialConfig ?? DEFAULT_TEMPLATE_CONFIG);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [primaryUploading, setPrimaryUploading] = useState(false);
  const [primaryUploadError, setPrimaryUploadError] = useState<string | null>(null);

  const additional = config.additionalSignatories ?? [];
  const [additionalUploadStates, setAdditionalUploadStates] = useState<
    { uploading: boolean; error: string | null }[]
  >(additional.map(() => ({ uploading: false, error: null })));

  function updateField<K extends keyof TemplateConfig>(field: K, value: TemplateConfig[K]) {
    setConfig((c) => ({ ...c, [field]: value }));
  }

  function updateAdditional(index: number, patch: Partial<Signatory>) {
    setConfig((c) => {
      const list = [...(c.additionalSignatories ?? [])];
      list[index] = { ...list[index], ...patch };
      return { ...c, additionalSignatories: list };
    });
  }

  function addSignatory() {
    setConfig((c) => ({
      ...c,
      additionalSignatories: [...(c.additionalSignatories ?? []), { name: "", title: "" }],
    }));
    setAdditionalUploadStates((s) => [...s, { uploading: false, error: null }]);
  }

  function removeSignatory(index: number) {
    setConfig((c) => ({
      ...c,
      additionalSignatories: (c.additionalSignatories ?? []).filter((_, i) => i !== index),
    }));
    setAdditionalUploadStates((s) => s.filter((_, i) => i !== index));
  }

  async function handlePrimaryFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPrimaryUploading(true);
    setPrimaryUploadError(null);
    try {
      const url = await uploadSignatureFile(file);
      updateField("signatureImageUrl", url);
    } catch (err) {
      setPrimaryUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPrimaryUploading(false);
    }
  }

  async function handleAdditionalFileChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAdditionalUploadStates((s) =>
      s.map((st, i) => (i === index ? { uploading: true, error: null } : st))
    );
    try {
      const url = await uploadSignatureFile(file);
      updateAdditional(index, { imageUrl: url });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setAdditionalUploadStates((s) => s.map((st, i) => (i === index ? { ...st, error: message } : st)));
    } finally {
      setAdditionalUploadStates((s) => s.map((st, i) => (i === index ? { ...st, uploading: false } : st)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const url = mode === "edit" ? `/api/admin/templates/${templateId}` : "/api/admin/templates";
      const method = mode === "edit" ? "PATCH" : "POST";
      const payload = mode === "edit" ? { name, config } : { key, name, config, activate: true };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : JSON.stringify(body.error));

      if (mode === "create" || body.newVersion) {
        router.push("/generate/templates");
      } else {
        setNotice("Saved.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-surface shadow-soft p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-dim mb-1">Template key</label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={mode === "edit"}
            placeholder="e.g. course-completion"
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm disabled:opacity-60"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1">Version name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-ink-dim mb-1">Title</label>
        <input
          value={config.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-ink-dim mb-1">
          Body (supports {"{{recipientName}}"}, {"{{eventName}}"}, {"{{orgName}}"}, {"{{issuedDate}}"})
        </label>
        <textarea
          value={config.bodyTemplate}
          onChange={(e) => updateField("bodyTemplate", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-dim mb-1">Organization name</label>
          <input
            value={config.orgName}
            onChange={(e) => updateField("orgName", e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1">Accent color</label>
          <input
            type="color"
            value={config.accentColor}
            onChange={(e) => updateField("accentColor", e.target.value)}
            className="w-full rounded-md border border-line bg-bg h-10"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs text-ink-dim">Signatories</label>
          <button
            type="button"
            onClick={addSignatory}
            disabled={additional.length >= MAX_ADDITIONAL_SIGNATORIES}
            className="text-xs font-bold text-accent underline disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Add signatory
          </button>
        </div>
        <div className="space-y-3">
          <SignatureFields
            legend="Primary"
            name={config.signatureName}
            title={config.signatureTitle}
            imageUrl={config.signatureImageUrl ?? ""}
            onNameChange={(v) => updateField("signatureName", v)}
            onTitleChange={(v) => updateField("signatureTitle", v)}
            onImageUrlChange={(v) => updateField("signatureImageUrl", v || undefined)}
            onFileChange={handlePrimaryFileChange}
            uploading={primaryUploading}
            uploadError={primaryUploadError}
          />
          {additional.map((sig, index) => (
            <SignatureFields
              key={index}
              legend={`Signatory ${index + 2}`}
              name={sig.name}
              title={sig.title}
              imageUrl={sig.imageUrl ?? ""}
              onNameChange={(v) => updateAdditional(index, { name: v })}
              onTitleChange={(v) => updateAdditional(index, { title: v })}
              onImageUrlChange={(v) => updateAdditional(index, { imageUrl: v || undefined })}
              onFileChange={(e) => handleAdditionalFileChange(index, e)}
              uploading={additionalUploadStates[index]?.uploading ?? false}
              uploadError={additionalUploadStates[index]?.error ?? null}
              onRemove={() => removeSignatory(index)}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent text-white font-bold text-sm px-4 py-2 shadow-soft"
      >
        {submitting ? "Saving…" : mode === "edit" ? "Save changes" : "Publish & activate new version"}
      </button>
      {notice && <p className="text-xs text-pipeline">{notice}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
