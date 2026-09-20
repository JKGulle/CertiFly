import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() || undefined;
  const certificates = await prisma.certificate.findMany({
    where: email ? { recipientEmail: email } : undefined,
    orderBy: { issuedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ certificates });
}
