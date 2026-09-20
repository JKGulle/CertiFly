import { prisma } from "@/lib/prisma";
import { CreateCertificateForm } from "@/components/CreateCertificateForm";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { key: "asc" },
    select: { key: true, name: true },
  });

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-1">Create a certificate</h1>
      <p className="text-sm text-ink-dim mb-8">
        Pick a template — that&apos;s the certificate&apos;s type — and issue
        it to one or more participants at once. It publishes immediately. External
        systems (an LMS, exam grader, webinar platform) reach the same
        pipeline through the events API instead.
      </p>
      <CreateCertificateForm templates={templates} />
    </div>
  );
}
