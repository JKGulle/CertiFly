import { NextRequest, NextResponse } from "next/server";
import { readBackgroundImage } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

// Keys are always a fresh UUID + known extension, generated server-side at
// upload time (see saveBackgroundImage) — never accept anything else here,
// since this value goes straight into a filesystem path.
const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif)$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!KEY_PATTERN.test(key)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const extension = key.split(".").pop()!.toLowerCase();
  try {
    const image = await readBackgroundImage(key);
    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": CONTENT_TYPES[extension],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
