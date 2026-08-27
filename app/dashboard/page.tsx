import { redirect } from "next/navigation";
import Link from "next/link";
import { getMerchantSession } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/config";
import { getStripeSummary, listStripeCharges } from "@/lib/stripe-data";
import StripeActivity from "@/components/StripeActivity";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getMerchantSession();
  if (!session) redirect("/login");

  const stripeReady = isStripeConfigured();
  let summary = null;
  let activity = null;
  let stripeError = "";

  if (stripeReady) {
    try {
      [summary, activity] = await Promise.all([getStripeSummary(), listStripeCharges()]);
    } catch {
      stripeError = "Stripe could not be reached with the current credentials. Check STRIPE_SECRET_KEY and try again.";
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark">E</span>
          ElevenOrbits
        </Link>
        <nav className="topbar-nav">
          <span>{session.email}</span>
          <form action="/api/auth/logout" method="post"><button className="button secondary" type="submit">Sign out</button></form>
        </nav>
      </header>

      <main className="main-content">
        <div className="section-header">
          <div>
            <p className="eyebrow">Merchant dashboard</p>
            <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)" }}>Monitor customer payments.</h1>
            <p className="lead" style={{ fontSize: "1rem" }}>Customers pay from the public portal. Use this page to review activity while Stripe handles checkout and recurring billing.</p>
          </div>
          <div className="button-row">
            <Link className="button secondary" href="/">Open customer portal</Link>
            <span className="pill">Stripe is the source of truth</span>
          </div>
        </div>

        {!stripeReady ? (
          <div className="error-message section">Add STRIPE_SECRET_KEY to `.env.local` before creating live or test payment links.</div>
        ) : null}
        {stripeError ? <div className="error-message section">{stripeError}</div> : null}

        {summary && activity ? (
          <StripeActivity
            initialRows={activity.rows}
            initialSummary={summary}
            initialCursor={activity.nextCursor}
            initialHasMore={activity.hasMore}
          />
        ) : null}
      </main>
    </div>
  );
}
