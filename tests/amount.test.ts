import { describe, expect, it } from "vitest";
import { formatInterval, formatUsd, parseAmountToCents } from "@/lib/amount";

describe("amount helpers", () => {
  it("parses dollar strings without floating-point rounding", () => {
    expect(parseAmountToCents("199.98")).toBe(19998);
    expect(parseAmountToCents("5")).toBe(500);
  });

  it("rejects unsafe or malformed amounts", () => {
    expect(() => parseAmountToCents("0.10")).toThrow();
    expect(() => parseAmountToCents("12.999")).toThrow();
    expect(() => parseAmountToCents("not-money")).toThrow();
  });

  it("formats customer-facing values", () => {
    expect(formatUsd(19998)).toBe("$199.98");
    expect(formatInterval("month", 1)).toBe("every 1 month");
  });
});
