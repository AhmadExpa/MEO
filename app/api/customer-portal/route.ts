import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/config";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: string };
    const sessionId = String(body.sessionId || "");
    if (!sessionId.startsWith("cs_")) return NextResponse.json({ error: "Invalid Checkout session." }, { status: 400 });

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.elevenorbits !== "true" || session.mode !== "subscription") {
      return NextResponse.json({ error: "This subscription is not managed by ElevenOrbits." }, { status: 403 });
    }

    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (!customerId) return NextResponse.json({ error: "No Stripe customer was found for this subscription." }, { status: 409 });

    const portal = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/payment/result?session_id=${encodeURIComponent(session.id)}`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not open the subscription portal." }, { status: 400 });
  }
}
