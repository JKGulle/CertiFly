import { mkdir, writeFile } from "fs/promises";
import path from "path";
import nodemailer, { type Transporter } from "nodemailer";

const MAIL_LOG_DIR = path.join(process.cwd(), "storage", "mail");

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    // No SMTP configured: capture the rendered message to disk instead of
    // sending it, so the demo works without a mail provider. Swap in a real
    // transport (SES/SendGrid/Postmark) by setting SMTP_HOST in .env.
    transporter = nodemailer.createTransport({ streamTransport: true, buffer: true });
  }
  return transporter;
}

export interface CertificateEmailInput {
  to: string;
  recipientName: string;
  eventName: string;
  downloadUrl: string;
  verifyUrl: string;
}

export async function sendCertificateEmail(input: CertificateEmailInput): Promise<void> {
  const { to, recipientName, eventName, downloadUrl, verifyUrl } = input;
  const from = process.env.MAIL_FROM ?? "Certificates <certificates@example.com>";

  const info = await getTransporter().sendMail({
    from,
    to,
    subject: `Your certificate for ${eventName}`,
    text: [
      `Hi ${recipientName},`,
      "",
      `Congratulations on completing ${eventName}! Your certificate is ready.`,
      "",
      `Download: ${downloadUrl}`,
      `Verify authenticity: ${verifyUrl}`,
      "",
      "This download link expires in 15 minutes — visit your dashboard for a fresh one anytime.",
    ].join("\n"),
    html: `
      <p>Hi ${recipientName},</p>
      <p>Congratulations on completing <strong>${eventName}</strong>! Your certificate is ready.</p>
      <p><a href="${downloadUrl}">Download your certificate</a></p>
      <p><a href="${verifyUrl}">Verify authenticity</a></p>
      <p style="color:#655F4E;font-size:12px;">This download link expires in 15 minutes — visit your dashboard for a fresh one anytime.</p>
    `,
  });

  if (!process.env.SMTP_HOST) {
    await mkdir(MAIL_LOG_DIR, { recursive: true });
    const file = path.join(MAIL_LOG_DIR, `${Date.now()}-${to.replace(/[^a-z0-9@.]/gi, "_")}.eml`);
    const source = (info as unknown as { message?: Buffer }).message;
    if (source) await writeFile(file, source);
    console.log(`[mail] no SMTP configured — wrote message to ${file}`);
  } else {
    console.log(`[mail] sent certificate email to ${to}`);
  }
}
