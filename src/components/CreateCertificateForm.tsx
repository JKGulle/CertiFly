"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface TemplateOption {
  key: string;
  name: string;
}

interface Recipient {
  name: string;
  email: string;
}

interface RecipientResult {
  email: string;
  success: boolean;
  verificationCode?: string;
  error?: string;
}

export function CreateCertificateForm({ templates }: { templates: TemplateOption[] }) {
  const router = useRouter();
  const [templateKey, setTemplateKey] = useState(
    templates.find((t) => t.key === "default")?.key ?? templates[0]?.key ?? ""
  );
  const [eventName, setEventName] = useState("Intro to Data Science");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: "Juan D. Cruz", email: "juan.cruz@example.com" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RecipientResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface shadow-soft p-5 text-sm text-ink-dim">
        No active certificate template yet.{" "}
        <a href="/generate/templates" className="text-accent underline">
          Publish one
        </a>{" "}
        before creating a certificate.
      </div>
    );
  }

  function updateRecipient(index: number, field: keyof Recipient, value: string) {
    setRecipients((rs) => rs.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRecipient() {
    setRecipients((rs) => [...rs, { name: "", email: "" }]);
  }

  function removeRecipient(index: number) {
    setRecipients((rs) => (rs.length > 1 ? rs.filter((_, i) => i !== index) : rs));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/uploads/background-image", {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "Upload failed");
      setBackgroundImageUrl(body.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResults(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          templateKey,
          backgroundImageUrl: backgroundImageUrl.trim() || undefined,
          recipients,
        }),
      });
      const body = await res.json();
      if (!res.ok && !body.results) {
        throw new Error(typeof body.error === "string" ? body.error : JSON.stringify(body.error));
      }
      setResults(body.results);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create certificates");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-surface shadow-soft p-5 space-y-4">
      <div>
        <label className="block text-xs text-ink-dim mb-1">Certificate template</label>
        <select
          value={templateKey}
          onChange={(e) => setTemplateKey(e.target.value)}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        >
          {templates.map((t) => (
            <option key={t.key} value={t.key}>
              {t.name} ({t.key})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-ink-dim mb-1">Event / course name</label>
        <input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-ink-dim mb-1">Background image (optional)</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={backgroundImageUrl}
            onChange={(e) => setBackgroundImageUrl(e.target.value)}
            placeholder="https://example.com/background.jpg"
            className="flex-1 rounded-md border border-line bg-bg px-3 py-2 text-sm"
          />
          <label className="shrink-0 rounded-md border border-line bg-surface-2 px-3 py-2 text-sm font-bold text-ink-dim hover:text-ink transition-colors cursor-pointer">
            {uploading ? "Uploading…" : "Browse…"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        {uploadError && <p className="text-xs text-danger mt-1">{uploadError}</p>}
        {backgroundImageUrl && (
          <div className="mt-2 w-32 aspect-800/566 rounded-md border border-line overflow-hidden bg-surface">
            <img
              src={backgroundImageUrl}
              alt="Background preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs text-ink-dim">Recipients</label>
          <button type="button" onClick={addRecipient} className="text-xs font-bold text-accent underline">
            + Add recipient
          </button>
        </div>
        <div className="space-y-2">
          {recipients.map((recipient, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <input
                value={recipient.name}
                onChange={(e) => updateRecipient(index, "name", e.target.value)}
                placeholder="Recipient name"
                className="rounded-md border border-line bg-bg px-3 py-2 text-sm sm:flex-1"
                required
              />
              <input
                type="email"
                value={recipient.email}
                onChange={(e) => updateRecipient(index, "email", e.target.value)}
                placeholder="Recipient email"
                className="rounded-md border border-line bg-bg px-3 py-2 text-sm sm:flex-1"
                required
              />
              <button
                type="button"
                onClick={() => removeRecipient(index)}
                disabled={recipients.length === 1}
                className="col-span-2 sm:col-span-1 text-xs font-bold text-danger underline disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent text-white font-bold text-sm px-4 py-2 shadow-soft"
      >
        {submitting
          ? "Publishing…"
          : recipients.length > 1
            ? `Create ${recipients.length} certificates`
            : "Create certificate"}
      </button>

      {results && (
        <ul className="text-xs space-y-1">
          {results.map((r, i) => (
            <li key={i} className={r.success ? "text-pipeline" : "text-danger"}>
              {r.email}:{" "}
              {r.success ? (
                <>
                  Published
                  {r.verificationCode && (
                    <>
                      {" — "}
                      <a href={`/verify/${r.verificationCode}`} className="underline">
                        View verification page
                      </a>
                    </>
                  )}
                </>
              ) : (
                `Failed — ${r.error}`
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
