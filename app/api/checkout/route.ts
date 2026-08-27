import { NextResponse } from "next/server";
import { allowRateLimitedRequest } from "@/lib/rate-limit";
import { isStripeConfigured } from "@/lib/config";
import { checkoutBranding, checkoutUrls, getStripe, publicPaymentMetadata } from "@/lib/stripe";
import {
  parsePublicPaymentAmount,
  parsePublicPaymentInterval,
  type PublicPaymentMode,
} from "@/lib/public-payment";

function clientAddress(request: Request): string {
  return (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

function validAttemptId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{12,80}$/.test(value);
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const address = clientAddress(request);
  if (!allowRateLimitedRequest(`public-checkout:${address}`, 20)) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as {
      mode?: PublicPaymentMode;
      amount?: string;
      interval?: string;
      attemptId?: string;
    };
    if (body.mode !== "one_time" && body.mode !== "recurring") {
      throw new Error("Choose one-time or recurring payment.");
    }
    if (!validAttemptId(body.attemptId)) {
      throw new Error("Please refresh the payment page and try again.");
    }

    const amountCents = parsePublicPaymentAmount(body.amount);
    const interval = body.mode === "recurring" ? parsePublicPaymentInterval(body.interval) : undefined;
    const { successUrl, cancelUrl } = checkoutUrls();
    const metadata = publicPaymentMetadata(body.mode, amountCents, interval);
    const stripe = getStripe();

    if (body.mode === "one_time") {
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
                currency: "usd",
                unit_amount: amountCents,
                product_data: {
                  name: "ElevenOrbits payment",
                  description: "Customer payment via ElevenOrbits",
                },
              },
              quantity: 1,
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
          client_reference_id: "PUBLIC-PORTAL",
          metadata,
          payment_intent_data: { metadata },
        },
        { idempotencyKey: `public-checkout-${body.attemptId}` },
      );

      return NextResponse.json({ url: session.url });
    }

    if (!interval) throw new Error("Choose a valid recurring interval.");

    const product = await stripe.products.create(
      {
        name: "ElevenOrbits subscription",
        description: "Recurring customer payment via ElevenOrbits",
        metadata,
      },
      { idempotencyKey: `public-product-${body.attemptId}` },
    );
    const price = await stripe.prices.create(
      {
        product: product.id,
        currency: "usd",
        unit_amount: amountCents,
        recurring: { interval },
        metadata,
      },
      { idempotencyKey: `public-price-${body.attemptId}` },
    );
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        payment_method_types: ["card"],
        branding_settings: checkoutBranding(),
        billing_address_collection: "required",
        name_collection: { individual: { enabled: true, optional: false } },
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: "PUBLIC-PORTAL",
        metadata,
        subscription_data: { metadata },
      },
      { idempotencyKey: `public-checkout-${body.attemptId}` },
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start secure checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
