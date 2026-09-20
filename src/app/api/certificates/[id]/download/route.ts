import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readCertificatePdf } from "@/lib/storage";
import { verifyDownloadToken } from "@/lib/downloadToken";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const expires = req.nextUrl.searchParams.get("expires");

  if (!verifyDownloadToken(id, expires, token)) {
    return NextResponse.json({ error: "Link is invalid or has expired" }, { status: 403 });
  }

  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  if (certificate.status === "REVOKED") {
    return NextResponse.json({ error: "This certificate has been revoked" }, { status: 403 });
  }

  const pdf = await readCertificatePdf(certificate.pdfPath);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${certificate.verificationCode}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
