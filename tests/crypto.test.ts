import { beforeEach, describe, expect, it } from "vitest";
import { decryptPaymentLink, encryptPaymentLink } from "@/lib/crypto";
import type { PaymentLinkConfig } from "@/lib/types";

const config: PaymentLinkConfig = {
  version: 1,
  reference: "EO-TEST123",
  type: "one_time",
  title: "Test payment",
  description: "Test description",
  currency: "usd",
  oneTime: {
    presets: [{ id: "preset-1", label: "$50.00", amountCents: 5000 }],
  },
  expiresAt: Date.now() + 60_000,
};

describe("stateless payment links", () => {
  beforeEach(() => {
    process.env.PAYMENT_LINK_SECRET = "a".repeat(48);
  });

  it("round-trips encrypted configurations", () => {
    const token = encryptPaymentLink(config);
    expect(token).toMatch(/^v1\./);
    expect(decryptPaymentLink(token)).toEqual(config);
  });

  it("rejects tampered and expired links", () => {
    const token = encryptPaymentLink(config);
    expect(decryptPaymentLink(`${token}x`)).toBeNull();

    const expired = encryptPaymentLink({ ...config, expiresAt: Date.now() - 1 });
    expect(decryptPaymentLink(expired)).toBeNull();
  });
});
