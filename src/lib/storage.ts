import { mkdir, readFile, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

// Stand-in for S3/GCS. Same shape as the architecture doc's "object storage"
// box: callers deal in opaque storage keys, never real file paths, so this
// can be swapped for an S3 SDK client without touching call sites.
const CERT_DIR = path.join(process.cwd(), "storage", "certificates");
const BACKGROUND_DIR = path.join(process.cwd(), "storage", "backgrounds");
const SIGNATURE_DIR = path.join(process.cwd(), "storage", "signatures");

export function certificateStorageKey(certificateId: string): string {
  return `${certificateId}.pdf`;
}

export async function saveCertificatePdf(
  certificateId: string,
  pdf: Buffer
): Promise<string> {
  await mkdir(CERT_DIR, { recursive: true });
  const key = certificateStorageKey(certificateId);
  await writeFile(path.join(CERT_DIR, key), pdf);
  return key;
}

export async function readCertificatePdf(key: string): Promise<Buffer> {
  return readFile(path.join(CERT_DIR, key));
}

// Uploaded background images. Keyed by a fresh UUID (never derived from
// user input), so the serving route can validate a key's shape before ever
// touching the filesystem with it.
export async function saveBackgroundImage(image: Buffer, extension: string): Promise<string> {
  await mkdir(BACKGROUND_DIR, { recursive: true });
  const key = `${randomUUID()}.${extension}`;
  await writeFile(path.join(BACKGROUND_DIR, key), image);
  return key;
}

export async function readBackgroundImage(key: string): Promise<Buffer> {
  return readFile(path.join(BACKGROUND_DIR, key));
}

// Uploaded signature images (electronic signatures for a template's
// signatories) — same fresh-UUID-keyed pattern as background images.
export async function saveSignatureImage(image: Buffer, extension: string): Promise<string> {
  await mkdir(SIGNATURE_DIR, { recursive: true });
  const key = `${randomUUID()}.${extension}`;
  await writeFile(path.join(SIGNATURE_DIR, key), image);
  return key;
}

export async function readSignatureImage(key: string): Promise<Buffer> {
  return readFile(path.join(SIGNATURE_DIR, key));
}
