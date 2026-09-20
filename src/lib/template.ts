import { z } from "zod";

export const signatorySchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

export type Signatory = z.infer<typeof signatorySchema>;

// signatureName/signatureTitle/signatureImageUrl stay flat fields (rather
// than folding into one signatories array) so templates saved before
// multi-signatory support still parse as-is — additionalSignatories is
// purely additive.
export const templateConfigSchema = z.object({
  title: z.string().min(1),
  bodyTemplate: z.string().min(1),
  orgName: z.string().min(1),
  accentColor: z.string().min(1),
  signatureName: z.string().min(1),
  signatureTitle: z.string().min(1),
  signatureImageUrl: z.string().url().optional(),
  additionalSignatories: z.array(signatorySchema).max(2).optional(),
  logoUrl: z.string().url().optional(),
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;

// The primary signatory plus any additional ones, as a single list — what
// the PDF and preview renderers actually iterate over.
export function allSignatories(config: TemplateConfig): Signatory[] {
  return [
    { name: config.signatureName, title: config.signatureTitle, imageUrl: config.signatureImageUrl },
    ...(config.additionalSignatories ?? []),
  ];
}

export interface MergeFields {
  recipientName: string;
  eventName: string;
  orgName: string;
  issuedDate: string;
  verificationCode: string;
  [key: string]: string;
}

export function mergeTemplate(template: string, fields: MergeFields): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    return key in fields ? fields[key] : match;
  });
}

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  title: "Certificate of Completion",
  bodyTemplate:
    "has successfully completed {{eventName}}, demonstrating the skills and dedication required to earn this certificate.",
  orgName: "Acme Academy",
  accentColor: "#8C6A28",
  signatureName: "Jordan Avery",
  signatureTitle: "Program Director",
};
