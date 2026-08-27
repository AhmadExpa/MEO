export function getAppUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_"));
}

export function getStripeSecretKey(): string {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value?.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return value;
}

export function getPaymentLinkSecret(): string {
  const value = process.env.PAYMENT_LINK_SECRET;
  if (!value || value.length < 32) {
    throw new Error("PAYMENT_LINK_SECRET must be at least 32 characters.");
  }
  return value;
}

export function getAuthSecret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }
  return value;
}

export function getMerchantEmail(): string {
  const value = process.env.MERCHANT_EMAIL;
  if (!value) {
    throw new Error("MERCHANT_EMAIL is not configured.");
  }
  return value.trim().toLowerCase();
}

export function getMerchantPasswordHash(): string {
  const value = process.env.MERCHANT_PASSWORD_HASH;
  if (!value) {
    throw new Error("MERCHANT_PASSWORD_HASH is not configured.");
  }
  return value;
}
