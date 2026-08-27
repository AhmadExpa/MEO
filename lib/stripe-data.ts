import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import type { StripePaymentRow, StripeSummary } from "@/lib/types";

function paymentMethodLabel(charge: Stripe.Charge): string {
  const card = charge.payment_method_details?.card;
  if (card?.brand && card.last4) {
    return `${card.brand.toUpperCase()} •••• ${card.last4}`;
  }
  return charge.payment_method_details?.type || "Card payment";
}

function rowFromCharge(charge: Stripe.Charge): StripePaymentRow {
  let status: StripePaymentRow["status"] = "pending";
  if (charge.captured === false) status = "uncaptured";
  else if (charge.disputed) status = "disputed";
  else if (charge.amount_refunded > 0) status = "refunded";
  else if (charge.paid && charge.status === "succeeded") status = "succeeded";
  else if (charge.status === "failed") status = "failed";

  const refunds = charge.refunds && typeof charge.refunds === "object" ? charge.refunds.data : [];
  const latestRefund = refunds?.at(-1);

  return {
    id: charge.id,
    amountCents: charge.amount,
    currency: charge.currency.toUpperCase(),
    status,
    paymentMethod: paymentMethodLabel(charge),
    description: charge.description || "ElevenOrbits payment",
    customer: charge.billing_details.email || charge.receipt_email || "Guest customer",
    createdAt: new Date(charge.created * 1000).toISOString(),
    refundedAt: latestRefund ? new Date(latestRefund.created * 1000).toISOString() : null,
    declineReason: charge.failure_code || charge.outcome?.seller_message || null,
  };
}

export async function listStripeCharges(startingAfter?: string, limit = 20) {
  const charges = await getStripe().charges.list({
    limit,
    expand: ["data.refunds"],
    ...(startingAfter ? { starting_after: startingAfter } : {}),
  });
  const last = charges.data.at(-1);
  return {
    rows: charges.data.map(rowFromCharge),
    hasMore: charges.has_more,
    nextCursor: last?.id || null,
  };
}

export async function getStripeSummary(): Promise<StripeSummary> {
  const summary: StripeSummary = {
    all: 0,
    succeeded: 0,
    refunded: 0,
    disputed: 0,
    failed: 0,
    cancelled: 0,
    uncaptured: 0,
  };

  for await (const charge of getStripe().charges.list({ limit: 100 })) {
    summary.all += 1;
    const row = rowFromCharge(charge);
    if (row.status !== "pending") summary[row.status] += 1;
  }

  for await (const intent of getStripe().paymentIntents.list({ limit: 100 })) {
    if (intent.status === "canceled") summary.cancelled += 1;
  }

  return summary;
}
