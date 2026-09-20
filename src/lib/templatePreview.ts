import { allSignatories, mergeTemplate, type TemplateConfig } from "./template";

// Preview-only stand-ins so the thumbnail reads like a real certificate
// without needing an actual recipient/event.
const PLACEHOLDER_FIELDS = {
  recipientName: "Recipient Name",
  eventName: "Course / Event Name",
  issuedDate: "Month Day, Year",
  verificationCode: "CERT-XXXX-XXXX",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const WIDTH = 800;
const HEIGHT = 566; // A4 landscape aspect ratio, same as the real PDF

export interface PreviewFields {
  recipientName: string;
  eventName: string;
  issuedDate: string;
  backgroundImageUrl?: string;
}

// Renders a lightweight SVG mock of what a certificate from this template
// looks like — same layout/merge logic as CertificateDocument, but as an
// inline SVG instead of an actual PDF render, so a thumbnail can be shown
// per card/list item without generating a PDF for each one. Pass real
// recipient/event/issuedDate fields for an actual certificate's preview, or
// omit them for a generic template preview using placeholder text.
function renderPreviewSvg(config: TemplateConfig, fields: PreviewFields): string {
  const accent = config.accentColor || "#8C6A28";
  const mergeFields = { ...fields, orgName: config.orgName, verificationCode: "" };
  const bodyLines = wrapText(mergeTemplate(config.bodyTemplate, mergeFields), 66).slice(0, 3);
  const bodyTspans = bodyLines
    .map((line, i) => `<tspan x="${WIDTH / 2}" dy="${i === 0 ? 0 : 20}">${escapeXml(line)}</tspan>`)
    .join("");

  const background = fields.backgroundImageUrl
    ? `<image href="${escapeXml(fields.backgroundImageUrl)}" x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" preserveAspectRatio="xMidYMid slice" />
  <rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" fill="#FFFFFF" opacity="0.82" />`
    : "";

  const BLOCK_WIDTH = 130;
  const BLOCK_GAP = 20;
  const signatureBlocks = allSignatories(config)
    .map((sig, i) => {
      const x = 90 + i * (BLOCK_WIDTH + BLOCK_GAP);
      const image = sig.imageUrl
        ? `<image href="${escapeXml(sig.imageUrl)}" x="${x}" y="${HEIGHT - 112}" width="${BLOCK_WIDTH - 10}" height="28" preserveAspectRatio="xMinYMid meet" />`
        : "";
      return `${image}
  <line x1="${x}" y1="${HEIGHT - 80}" x2="${x + BLOCK_WIDTH - 10}" y2="${HEIGHT - 80}" stroke="#221D14" stroke-width="1" />
  <text x="${x}" y="${HEIGHT - 62}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="13" fill="#221D14">${escapeXml(sig.name)}</text>
  <text x="${x}" y="${HEIGHT - 46}" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#655F4E">${escapeXml(sig.title)}</text>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#FFFFFF" />
  ${background}
  <rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}" fill="none" stroke="${accent}" stroke-width="3" />
  <text x="${WIDTH / 2}" y="70" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" letter-spacing="3" fill="${accent}">${escapeXml(config.orgName.toUpperCase())}</text>
  <text x="${WIDTH / 2}" y="120" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="34" fill="#221D14">${escapeXml(config.title)}</text>
  <text x="${WIDTH / 2}" y="160" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#4A4636">This certifies that</text>
  <text x="${WIDTH / 2}" y="200" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="28" fill="#221D14">${escapeXml(fields.recipientName)}</text>
  <text x="${WIDTH / 2}" y="240" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#3A362A">${bodyTspans}</text>
  ${signatureBlocks}
  <rect x="${WIDTH - 150}" y="${HEIGHT - 116}" width="60" height="60" fill="none" stroke="${accent}" stroke-width="2" />
  <text x="${WIDTH - 120}" y="${HEIGHT - 42}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="9" fill="#655F4E">QR</text>
  <text x="${WIDTH - 90}" y="${HEIGHT - 62}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#655F4E">Issued</text>
  <text x="${WIDTH - 90}" y="${HEIGHT - 46}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="12" fill="#221D14">${escapeXml(fields.issuedDate)}</text>
</svg>`;
}

// Generic template preview, using placeholder recipient/event text.
export function templatePreviewDataUri(config: TemplateConfig): string {
  const svg = renderPreviewSvg(config, PLACEHOLDER_FIELDS);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// An actual issued certificate's preview, using its real recipient/event
// data (but not its custom metadata fields, which aren't stored on the
// Certificate row — any {{customField}} placeholders beyond the standard
// ones are left unresolved here, same as mergeTemplate does elsewhere).
export function certificatePreviewDataUri(config: TemplateConfig, fields: PreviewFields): string {
  const svg = renderPreviewSvg(config, fields);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
