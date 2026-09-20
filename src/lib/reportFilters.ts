import type { Prisma } from "@prisma/client";

export interface ReportFilters {
  holderName?: string;
  holderEmail?: string;
  eventName?: string;
  certificateTitle?: string;
  eventType?: string;
  status?: string;
  verificationCode?: string;
  issuedFrom?: string; // yyyy-mm-dd
  issuedTo?: string; // yyyy-mm-dd
}

const FIELDS = [
  "holderName",
  "holderEmail",
  "eventName",
  "certificateTitle",
  "eventType",
  "status",
  "verificationCode",
  "issuedFrom",
  "issuedTo",
] as const;

export function parseReportFilters(params: URLSearchParams): ReportFilters {
  const filters: ReportFilters = {};
  for (const field of FIELDS) {
    const value = params.get(field)?.trim();
    if (value) filters[field] = value;
  }
  return filters;
}

export function hasAnyFilter(filters: ReportFilters): boolean {
  return Object.values(filters).some(Boolean);
}

export function buildCertificateWhere(filters: ReportFilters): Prisma.CertificateWhereInput {
  const where: Prisma.CertificateWhereInput = {};

  if (filters.holderName) where.recipientName = { contains: filters.holderName };
  if (filters.holderEmail) where.recipientEmail = { contains: filters.holderEmail };
  if (filters.eventName) where.eventName = { contains: filters.eventName };
  if (filters.certificateTitle) where.certificateTitle = { contains: filters.certificateTitle };
  if (filters.eventType) where.eventType = filters.eventType;
  if (filters.status) where.status = filters.status;
  if (filters.verificationCode) where.verificationCode = { contains: filters.verificationCode };

  if (filters.issuedFrom || filters.issuedTo) {
    where.issuedAt = {};
    // issuedAt is stored/exported in UTC, so the filter boundaries must be
    // parsed as UTC too — otherwise the range shifts by the server's offset.
    if (filters.issuedFrom) where.issuedAt.gte = new Date(`${filters.issuedFrom}T00:00:00.000Z`);
    if (filters.issuedTo) where.issuedAt.lte = new Date(`${filters.issuedTo}T23:59:59.999Z`);
  }

  return where;
}
