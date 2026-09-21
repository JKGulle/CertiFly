import { NextRequest, NextResponse } from "next/server";
import { saveSignatureImage } from "@/lib/storage";
import { unexpectedErrorResponse } from "@/lib/apiError";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB — a signature is a small crop, not a full photo
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

// Same shape as /api/admin/uploads/background-image: upload once, then the
// returned URL behaves exactly like pasting a hosted image URL into
// signatureImageUrl.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Unsupported image type — use PNG, WebP, or JPEG" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 2MB)" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = await saveSignatureImage(buffer, extension);
    const url = new URL(`/api/uploads/signatures/${key}`, APP_BASE_URL).toString();

    return NextResponse.json({ url });
  } catch (err) {
    return unexpectedErrorResponse(err);
  }
}
