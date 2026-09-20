import { randomBytes } from "crypto";
import { prisma } from "./prisma";

// Crockford-ish alphabet: no 0/O, 1/I/L, so a human reading it off a printed
// certificate can't confuse characters.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export async function generateVerificationCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `CERT-${randomSegment(4)}-${randomSegment(4)}`;
    const existing = await prisma.certificate.findUnique({
      where: { verificationCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique verification code");
}
