import { beforeEach, describe, expect, it } from "vitest";
import { checkoutBranding } from "@/lib/stripe";

describe("ElevenOrbits Checkout branding", () => {
  beforeEach(() => {
    delete process.env.ELEVENORBITS_LOGO_URL;
  });

  it("applies the ElevenOrbits name and visual system", () => {
    expect(checkoutBranding()).toMatchObject({
      display_name: "ElevenOrbits",
      background_color: "#F6F8FC",
      button_color: "#5146FF",
      border_style: "rounded",
      font_family: "inter",
    });
  });

  it("only sends a public HTTPS logo to Stripe", () => {
    process.env.ELEVENORBITS_LOGO_URL = "https://payments.example.com/elevenorbits-logo.svg";
    expect(checkoutBranding().logo).toEqual({
      type: "url",
      url: "https://payments.example.com/elevenorbits-logo.svg",
    });

    process.env.ELEVENORBITS_LOGO_URL = "http://localhost/logo.svg";
    expect(checkoutBranding().logo).toBeUndefined();
  });
});
