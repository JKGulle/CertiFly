import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { templateConfigSchema } from "@/lib/template";
import { unexpectedErrorResponse } from "@/lib/apiError";

const createSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  config: templateConfigSchema,
  activate: z.boolean().optional(),
});

export async function GET() {
  const templates = await prisma.template.findMany({
    orderBy: [{ key: "asc" }, { version: "desc" }],
  });
  return NextResponse.json({ templates });
}

// Publishing a new template version never overwrites the old one — past
// certificates keep citing the exact version they were rendered from.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { key, name, config, activate } = parsed.data;

  try {
    const latest = await prisma.template.findFirst({
      where: { key },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latest?.version ?? 0) + 1;
    const shouldActivate = activate ?? true;

    const template = await prisma.$transaction(async (tx) => {
      if (shouldActivate) {
        await tx.template.updateMany({ where: { key }, data: { isActive: false } });
      }
      return tx.template.create({
        data: {
          key,
          version: nextVersion,
          name,
          isActive: shouldActivate,
          config: JSON.stringify(config),
        },
      });
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    return unexpectedErrorResponse(err);
  }
}
