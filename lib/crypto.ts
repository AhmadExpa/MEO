import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getPaymentLinkSecret } from "@/lib/config";
import type { PaymentLinkConfig } from "@/lib/types";

const algorithm = "aes-256-gcm";

function keyFromSecret(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function encode(value: Buffer): string {
  return value.toString("base64url");
}

function decode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function encryptPaymentLink(config: PaymentLinkConfig): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, keyFromSecret(getPaymentLinkSecret()), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(config), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `v1.${encode(iv)}.${encode(authTag)}.${encode(encrypted)}`;
}

export function decryptPaymentLink(token: string): PaymentLinkConfig | null {
  try {
    const [version, ivPart, authTagPart, encryptedPart] = token.split(".");
    if (version !== "v1" || !ivPart || !authTagPart || !encryptedPart) {
      return null;
    }

    const decipher = createDecipheriv(
      algorithm,
      keyFromSecret(getPaymentLinkSecret()),
      decode(ivPart),
    );
    decipher.setAuthTag(decode(authTagPart));
    const decrypted = Buffer.concat([
      decipher.update(decode(encryptedPart)),
      decipher.final(),
    ]).toString("utf8");
    const config = JSON.parse(decrypted) as PaymentLinkConfig;

    if (config.version !== 1 || config.expiresAt <= Date.now()) {
      return null;
    }
    return config;
  } catch {
    return null;
  }
}

export function publicPaymentLinkConfig(config: PaymentLinkConfig) {
  if (!config.recurring) {
    return config;
  }

  return {
    ...config,
    recurring: {
      plans: config.recurring.plans.map(({ stripePriceId: _stripePriceId, ...plan }) => plan),
    },
  };
}
