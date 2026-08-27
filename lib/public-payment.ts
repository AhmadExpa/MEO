import { formatUsd, parseAmountToCents } from "@/lib/amount";

export const PUBLIC_PAYMENT_PRESETS = [
  { id: "preset-49-99", amountCents: 4999 },
  { id: "preset-99-99", amountCents: 9999 },
  { id: "preset-199-99", amountCents: 19999 },
] as const;

export const PUBLIC_PAYMENT_MIN_CENTS = 1000;
export const PUBLIC_PAYMENT_MAX_CENTS = 500000;

export type PublicPaymentMode = "one_time" | "recurring";
export type PublicPaymentInterval = "week" | "month" | "year";

export function publicPaymentPresetLabel(amountCents: number): string {
  return formatUsd(amountCents);
}

export function parsePublicPaymentAmount(value: unknown): number {
  const amountCents = parseAmountToCents(String(value || ""));
  if (amountCents < PUBLIC_PAYMENT_MIN_CENTS || amountCents > PUBLIC_PAYMENT_MAX_CENTS) {
    throw new Error(
      `The amount must be between ${formatUsd(PUBLIC_PAYMENT_MIN_CENTS)} and ${formatUsd(PUBLIC_PAYMENT_MAX_CENTS)}.`,
    );
  }
  return amountCents;
}

export function parsePublicPaymentInterval(value: unknown): PublicPaymentInterval {
  if (value === "week" || value === "month" || value === "year") return value;
  throw new Error("Choose a valid recurring interval.");
}
