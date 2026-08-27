import { NextResponse } from "next/server";
import { decryptPaymentLink } from "@/lib/crypto";
import { allowRateLimitedRequest } from "@/lib/rate-limit";
import { checkoutBranding, checkoutUrls, getStripe, paymentMetadata } from "@/lib/stripe";
import { parseAmountToCents } from "@/lib/amount";

type RouteContext = { params: Promise<{ token: string }> };

function clientAddress(request: Request): string {
  return (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const config = decryptPaymentLink(token);
  if (!config) return NextResponse.json({ error: "This payment link is invalid or expired." }, { status: 410 });

  const address = clientAddress(request);
  if (
    !allowRateLimitedRequest(`checkout:${config.reference}:${address}`, 6) ||
    !allowRateLimitedRequest(`checkout-ip:${address}`, 20)
  ) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as { selectionId?: string; customAmount?: string; attemptId?: string };
    const selectionId = String(body.selectionId || "");
    const attemptId = String(body.attemptId || "");
    if (!/^[a-zA-Z0-9_-]{12,80}$/.test(attemptId)) {
      return NextResponse.json({ error: "Please refresh the payment page and try again." }, { status: 400 });
    }
    const { successUrl, cancelUrl } = checkoutUrls();
    const metadata = paymentMetadata(config, config.type === "one_time" ? "payment" : "subscription");
    const stripe = getStripe();

    if (config.type === "one_time" && config.oneTime) {
      const preset = config.oneTime.presets.find((item) => item.id === selectionId);
      let amountCents = preset?.amountCents;

      if (!amountCents && config.oneTime.custom && body.customAmount) {
        amountCents = parseAmountToCents(body.customAmount);
        if (
          amountCents < config.oneTime.custom.minCents ||
          amountCents > config.oneTime.custom.maxCents
        ) {
          return NextResponse.json({ error: "The custom amount is outside the allowed range." }, { status: 400 });
        }
      }

      if (!amountCents) return NextResponse.json({ error: "Choose a valid payment amount." }, { status: 400 });

      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          customer_creation: "always",
          payment_method_types: ["card"],
          branding_settings: checkoutBranding(),
          billing_address_collection: "required",
          name_collection: { individual: { enabled: true, optional: false } },
          line_items: [
            {
              price_data: {
                currency: config.currency,
                unit_amount: amountCents,
                product_data: { name: config.title, description: "ElevenOrbits payment" },
              },
              quantity: 1,
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
          client_reference_id: config.reference,
          metadata: { ...metadata, amount_cents: String(amountCents) },
          payment_intent_data: { metadata },
        },
        { idempotencyKey: `checkout-${config.reference}-${attemptId}` },
      );

      return NextResponse.json({ url: session.url });
    }

    if (config.type === "recurring" && config.recurring) {
      const plan = config.recurring.plans.find((item) => item.id === selectionId);
      if (!plan) return NextResponse.json({ error: "Choose a valid recurring plan." }, { status: 400 });

      const price = await stripe.prices.retrieve(plan.stripePriceId);
      if (!price.active || price.type !== "recurring" || price.currency !== config.currency) {
        return NextResponse.json({ error: "This recurring plan is no longer available." }, { status: 409 });
      }

      const session = await stripe.checkout.sessions.create(
        {
          mode: "subscription",
          payment_method_types: ["card"],
          branding_settings: checkoutBranding(),
          billing_address_collection: "required",
          name_collection: { individual: { enabled: true, optional: false } },
          line_items: [{ price: plan.stripePriceId, quantity: 1 }],
          success_url: successUrl,
          cancel_url: cancelUrl,
          client_reference_id: config.reference,
          metadata,
          subscription_data: { metadata },
        },
        { idempotencyKey: `checkout-${config.reference}-${attemptId}` },
      );

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "This payment link is not configured correctly." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
