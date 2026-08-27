import Stripe from "stripe";
import { getAppUrl, getStripeSecretKey } from "@/lib/config";
import type { PaymentLinkConfig } from "@/lib/types";

let client: Stripe | undefined;

export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(getStripeSecretKey());
  }
  return client;
}

export function checkoutUrls(): { successUrl: string; cancelUrl: string } {
  const resultUrl = `${getAppUrl()}/payment/result?session_id={CHECKOUT_SESSION_ID}`;
  return {
    successUrl: resultUrl,
    cancelUrl: `${resultUrl}&cancelled=1`,
  };
}

export function checkoutBranding(): Stripe.Checkout.SessionCreateParams.BrandingSettings {
  const logoUrl = process.env.ELEVENORBITS_LOGO_URL?.trim();
  const branding: Stripe.Checkout.SessionCreateParams.BrandingSettings = {
    display_name: "ElevenOrbits",
    background_color: "#F6F8FC",
    button_color: "#5146FF",
    border_style: "rounded",
    font_family: "inter",
  };

  if (logoUrl?.startsWith("https://")) {
    branding.logo = { type: "url", url: logoUrl };
  }

  return branding;
}

export function paymentMetadata(config: PaymentLinkConfig, mode: "payment" | "subscription") {
  return {
    elevenorbits: "true",
    payment_link_reference: config.reference,
    payment_type: mode,
    merchant_name: "ElevenOrbits",
  };
}
