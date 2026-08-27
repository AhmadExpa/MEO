import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/auth";
import PublicPaymentForm from "@/components/PublicPaymentForm";

export default async function HomePage() {
  const session = await getPortalSession();
  if (!session) redirect("/login");

  const requestHeaders = await headers();
  const forwardedIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedIp || requestHeaders.get("x-real-ip") || "Unavailable";
  const decodeHeader = (value: string | null) => {
    if (!value) return "";
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  const location = [
    decodeHeader(requestHeaders.get("x-vercel-ip-city")),
    decodeHeader(requestHeaders.get("x-vercel-ip-country-region")),
    decodeHeader(requestHeaders.get("x-vercel-ip-country")),
  ].filter(Boolean).join(", ") || "Unavailable on this page";

  return (
    <div className="page-shell">
      <header className="topbar">
        <Link className="brand-lockup" href="/" aria-label="ElevenOrbits home">
          <img className="brand-logo" src="/elevenorbits-logo.png" alt="ElevenOrbits" />
        </Link>
        <nav className="topbar-nav">
          <span>Client payment portal</span>
          <form action="/api/auth/logout" method="post"><button className="button secondary" type="submit">Sign out</button></form>
        </nav>
      </header>

      <main className="main-content portal-content">
        <section className="hero portal-hero">
          <div>
            <p className="eyebrow">ElevenOrbits customer portal</p>
            <h1>Pay securely in one place.</h1>
            <p className="lead">
              Choose one-time or recurring billing, select an amount, and continue to Stripe’s secure Checkout.
            </p>
            <div className="fake-row portal-fact" style={{ maxWidth: 520 }}>
              <span className="muted">Card and bank verification</span>
              <strong>Handled by Stripe</strong>
            </div>
            <div className="fake-row portal-fact">
              <span className="muted">Recurring billing</span>
              <strong>Managed by Stripe</strong>
            </div>
          </div>

          <PublicPaymentForm clientContext={{ ipAddress, location }} />
        </section>
      </main>
    </div>
  );
}
