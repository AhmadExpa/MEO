import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getMerchantSession } from "@/lib/auth";
import { getAppUrl, isStripeConfigured } from "@/lib/config";
import { encryptPaymentLink } from "@/lib/crypto";
import { formatUsd, parseAmountToCents } from "@/lib/amount";
import { getStripe } from "@/lib/stripe";
import type { PaymentLinkConfig, PaymentLinkCreateInput, RecurringPlan } from "@/lib/types";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function cleanText(value: unknown, field: string, maxLength: number): string {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${field} is required.`);
  if (text.length > maxLength) throw new Error(`${field} is too long.`);
  return text;
}

function parseExpiryHours(value: unknown): number {
  const hours = Number(value || 168);
  if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
    throw new Error("Link expiry must be between 1 and 720 hours.");
  }
  return hours;
}

export async function POST(request: Request) {
  if (!(await getMerchantSession())) return errorResponse("Merchant authentication required.", 401);
  if (!isStripeConfigured()) return errorResponse("Stripe is not configured yet.", 503);

  try {
    const input = (await request.json()) as PaymentLinkCreateInput;
    const type = input.type === "recurring" ? "recurring" : input.type === "one_time" ? "one_time" : null;
    if (!type) throw new Error("Choose one-time or recurring payment.");

    const title = cleanText(input.title, "Title", 80);
    const description = cleanText(input.description, "Description", 600);
    const reference = `EO-${randomUUID().slice(0, 8).toUpperCase()}`;
    const expiresAt = Date.now() + parseExpiryHours(input.expiresInHours) * 60 * 60 * 1000;

    const config: PaymentLinkConfig = {
      version: 1,
      reference,
      type,
      title,
      description,
      currency: "usd",
      expiresAt,
    };

    if (type === "one_time") {
      const presetValues = Array.isArray(input.presetAmounts) ? input.presetAmounts : [];
      const presets = Array.from(new Set(presetValues.map((value) => parseAmountToCents(String(value)))))
        .sort((left, right) => left - right)
        .map((amountCents, index) => ({
          id: `preset-${index + 1}`,
          label: formatUsd(amountCents),
          amountCents,
        }));
      const allowCustomAmount = Boolean(input.allowCustomAmount);

      if (!presets.length && !allowCustomAmount) {
        throw new Error("Add at least one preset amount or enable custom amount.");
      }

      config.oneTime = { presets };
      if (allowCustomAmount) {
        if (!input.customMin || !input.customMax) {
          throw new Error("Custom amount requires both a minimum and maximum.");
        }
        const minCents = parseAmountToCents(input.customMin);
        const maxCents = parseAmountToCents(input.customMax);
        if (minCents > maxCents) throw new Error("Custom minimum cannot exceed maximum.");
        config.oneTime.custom = { minCents, maxCents };
      }
    }

    if (type === "recurring") {
      const inputPlans = Array.isArray(input.recurringPlans) ? input.recurringPlans : [];
      if (!inputPlans.length) throw new Error("Add at least one recurring plan.");

      const stripe = getStripe();
      const plans: RecurringPlan[] = [];
      for (let index = 0; index < inputPlans.length; index += 1) {
        const candidate = inputPlans[index];
        const label = cleanText(candidate.label, `Plan ${index + 1} label`, 50);
        const amountCents = parseAmountToCents(String(candidate.amount));
        const interval = candidate.interval;
        const intervalCount = Number(candidate.intervalCount || 1);
        if (!["week", "month", "year"].includes(interval)) {
          throw new Error(`Plan ${index + 1} has an invalid interval.`);
        }
        const maxIntervalCount = interval === "year" ? 3 : interval === "month" ? 36 : 156;
        if (!Number.isInteger(intervalCount) || intervalCount < 1 || intervalCount > maxIntervalCount) {
          throw new Error(`Plan ${index + 1} interval count must be between 1 and ${maxIntervalCount}.`);
        }

        const product = await stripe.products.create({
          name: `ElevenOrbits · ${title} · ${label}`.slice(0, 250),
          metadata: {
            elevenorbits: "true",
            payment_link_reference: reference,
          },
        });
        const price = await stripe.prices.create({
          product: product.id,
          currency: "usd",
          unit_amount: amountCents,
          recurring: { interval, interval_count: intervalCount },
          metadata: {
            elevenorbits: "true",
            payment_link_reference: reference,
          },
        });

        plans.push({
          id: `plan-${index + 1}`,
          label,
          amountCents,
          interval,
          intervalCount,
          stripePriceId: price.id,
        });
      }
      config.recurring = { plans };
    }

    const token = encryptPaymentLink(config);
    return NextResponse.json({
      reference,
      url: `${getAppUrl()}/pay/${token}`,
      expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the payment link.";
    return errorResponse(message);
  }
}
