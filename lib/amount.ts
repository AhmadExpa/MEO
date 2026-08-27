export function parseAmountToCents(value: string): number {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Enter a valid amount with up to two decimal places.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 50) {
    throw new Error("The amount must be at least US$0.50.");
  }
  return cents;
}

export function formatUsd(amountCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

export function formatInterval(interval: "week" | "month" | "year", count: number): string {
  const unit = count === 1 ? interval : `${interval}s`;
  return `every ${count} ${unit}`;
}
