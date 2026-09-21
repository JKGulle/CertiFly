import { mkdir, readFile, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { get, put } from "@vercel/blob";

// Stand-in for S3/GCS. Same shape as the architecture doc's "object storage"
// box: callers deal in opaque storage keys, never real file paths, so this
// can be swapped for an S3 SDK client without touching call sites.
//
// Local dev (no Blob store connected) writes to the local filesystem, which
// is the zero-infra path the README documents. On Vercel that filesystem is
// read-only and ephemeral, so once a Blob store is connected — either via a
// static BLOB_READ_WRITE_TOKEN or, as this project uses, OIDC (BLOB_STORE_ID
// + VERCEL_OIDC_TOKEN, no static token) — everything goes through Vercel
// Blob instead. Keys returned from the local path are bare filenames; keys
// returned from the Blob path are full URLs — every read function branches
// on that shape, so callers never need to know which backend wrote a given
// key.
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.BLOB_STORE_ID;

const CERT_DIR = path.join(process.cwd(), "storage", "certificates");
const BACKGROUND_DIR = path.join(process.cwd(), "storage", "backgrounds");
const SIGNATURE_DIR = path.join(process.cwd(), "storage", "signatures");

const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

// True when a saved key is a Blob URL rather than a local filename — the
// upload routes need this to decide whether to hand the URL back directly
// or build their own /api/uploads/... proxy URL around it.
export function isRemoteKey(key: string): boolean {
  return key.startsWith("http://") || key.startsWith("https://");
}

async function readRemote(url: string): Promise<Buffer> {
  const result = await get(url, { access: "private" });
  if (!result || !result.stream) throw new Error(`Blob not found: ${url}`);
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

export function certificateStorageKey(certificateId: string): string {
  return `${certificateId}.pdf`;
}

export async function saveCertificatePdf(
  certificateId: string,
  pdf: Buffer
): Promise<string> {
  const key = certificateStorageKey(certificateId);
  if (useBlob) {
    const blob = await put(`certificates/${key}`, pdf, {
      access: "private",
      contentType: "application/pdf",
    });
    return blob.url;
  }
  await mkdir(CERT_DIR, { recursive: true });
  await writeFile(path.join(CERT_DIR, key), pdf);
  return key;
}

export async function readCertificatePdf(key: string): Promise<Buffer> {
  if (isRemoteKey(key)) return readRemote(key);
  return readFile(path.join(CERT_DIR, key));
}

// Uploaded background images. Keyed by a fresh UUID (never derived from
// user input), so the local-dev serving route can validate a key's shape
// before ever touching the filesystem with it. In blob mode the returned
// key is the public URL directly — @react-pdf/renderer and <img> tags fetch
// it themselves, no proxy route involved.
export async function saveBackgroundImage(image: Buffer, extension: string): Promise<string> {
  if (useBlob) {
    const blob = await put(`backgrounds/${randomUUID()}.${extension}`, image, {
      access: "public",
      contentType: EXTENSION_MIME[extension],
    });
    return blob.url;
  }
  await mkdir(BACKGROUND_DIR, { recursive: true });
  const key = `${randomUUID()}.${extension}`;
  await writeFile(path.join(BACKGROUND_DIR, key), image);
  return key;
}

export async function readBackgroundImage(key: string): Promise<Buffer> {
  if (isRemoteKey(key)) {
    const res = await fetch(key);
    if (!res.ok) throw new Error(`Failed to fetch background image (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(path.join(BACKGROUND_DIR, key));
}

// Uploaded signature images (electronic signatures for a template's
// signatories) — same fresh-UUID-keyed, public-in-blob-mode pattern as
// background images.
export async function saveSignatureImage(image: Buffer, extension: string): Promise<string> {
  if (useBlob) {
    const blob = await put(`signatures/${randomUUID()}.${extension}`, image, {
      access: "public",
      contentType: EXTENSION_MIME[extension],
    });
    return blob.url;
  }
  await mkdir(SIGNATURE_DIR, { recursive: true });
  const key = `${randomUUID()}.${extension}`;
  await writeFile(path.join(SIGNATURE_DIR, key), image);
  return key;
}

export async function readSignatureImage(key: string): Promise<Buffer> {
  if (isRemoteKey(key)) {
    const res = await fetch(key);
    if (!res.ok) throw new Error(`Failed to fetch signature image (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(path.join(SIGNATURE_DIR, key));
}
