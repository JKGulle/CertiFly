import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { templateConfigSchema } from "@/lib/template";
import { unexpectedErrorResponse } from "@/lib/apiError";

const updateSchema = z.object({
  name: z.string().min(1),
  config: templateConfigSchema,
});

// Edits a template's content. Mutating a version in place is only safe if
// nothing has been rendered from it yet — otherwise a certificate's
// templateId/templateVersion would stop matching what was actually used to
// produce it. So: no certificates yet -> update this row directly. Already
// used -> publish a new version instead (activated immediately), the same
// guarantee "Publish a new version" already gives on the templates page.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, config } = parsed.data;

  try {
    const target = await prisma.template.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const usageCount = await prisma.certificate.count({ where: { templateId: id } });

    if (usageCount === 0) {
      const template = await prisma.template.update({
        where: { id },
        data: { name, config: JSON.stringify(config) },
      });
      return NextResponse.json({ template, newVersion: false });
    }

    const latest = await prisma.template.findFirst({
      where: { key: target.key },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latest?.version ?? target.version) + 1;

    const template = await prisma.$transaction(async (tx) => {
      await tx.template.updateMany({ where: { key: target.key }, data: { isActive: false } });
      return tx.template.create({
        data: {
          key: target.key,
          version: nextVersion,
          name,
          isActive: true,
          config: JSON.stringify(config),
        },
      });
    });

    return NextResponse.json({ template, newVersion: true }, { status: 201 });
  } catch (err) {
    return unexpectedErrorResponse(err);
  }
}
