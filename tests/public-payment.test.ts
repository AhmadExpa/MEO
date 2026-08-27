import { describe, expect, it } from "vitest";
import {
  PUBLIC_PAYMENT_MAX_CENTS,
  PUBLIC_PAYMENT_MIN_CENTS,
  parsePublicPaymentAmount,
  parsePublicPaymentInterval,
} from "@/lib/public-payment";

describe("public payment validation", () => {
  it("accepts amounts inside the customer range", () => {
    expect(parsePublicPaymentAmount("149.99")).toBe(14999);
  });

  it("rejects amounts outside the customer range", () => {
    expect(() => parsePublicPaymentAmount("9.99")).toThrow();
    expect(() => parsePublicPaymentAmount("5000.01")).toThrow();
    expect(PUBLIC_PAYMENT_MIN_CENTS).toBe(1000);
    expect(PUBLIC_PAYMENT_MAX_CENTS).toBe(500000);
  });

  it("accepts only supported recurring intervals", () => {
    expect(parsePublicPaymentInterval("month")).toBe("month");
    expect(() => parsePublicPaymentInterval("daily")).toThrow();
  });
});
