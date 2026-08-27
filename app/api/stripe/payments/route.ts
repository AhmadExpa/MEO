import { NextResponse } from "next/server";
import { getMerchantSession } from "@/lib/auth";
import { listStripeCharges } from "@/lib/stripe-data";

export async function GET(request: Request) {
  if (!(await getMerchantSession())) return NextResponse.json({ error: "Merchant authentication required." }, { status: 401 });
  const url = new URL(request.url);
  const startingAfter = url.searchParams.get("starting_after") || undefined;

  try {
    return NextResponse.json(await listStripeCharges(startingAfter));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Stripe activity." }, { status: 503 });
  }
}
