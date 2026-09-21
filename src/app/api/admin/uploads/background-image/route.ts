import { NextRequest, NextResponse } from "next/server";
import { isRemoteKey, saveBackgroundImage } from "@/lib/storage";
import { unexpectedErrorResponse } from "@/lib/apiError";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — plenty for a certificate background, keeps PDFs from ballooning
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Stores an uploaded file under storage/backgrounds/ (same local-filesystem
// stand-in as certificate PDFs) and hands back a URL the renderer can fetch
// like any other backgroundImageUrl — the "browse a file" path just uploads
// first and then behaves exactly like pasting a hosted image URL.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Unsupported image type — use JPEG, PNG, WebP, or GIF" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 5MB)" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = await saveBackgroundImage(buffer, extension);
    const url = isRemoteKey(key)
      ? key
      : new URL(`/api/uploads/backgrounds/${key}`, APP_BASE_URL).toString();

    return NextResponse.json({ url });
  } catch (err) {
    return unexpectedErrorResponse(err);
  }
}
