import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/auth";
import PublicPaymentForm from "@/components/PublicPaymentForm";

export default async function HomePage() {
  const session = await getPortalSession();
  if (!session) redirect("/login");

  return (
    <div className="page-shell">
      <header className="topbar">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark">E</span>
          ElevenOrbits
        </Link>
        <nav className="topbar-nav">
          <span>Client payment portal</span>
          <form action="/api/auth/logout" method="post"><button className="button secondary" type="submit">Sign out</button></form>
        </nav>
      </header>

      <main className="main-content">
        <section className="hero">
          <div>
            <p className="eyebrow">ElevenOrbits customer portal</p>
            <h1>Pay securely in one place.</h1>
            <p className="lead">
              Choose a one-time payment or a recurring plan, select an amount, and continue to
              Stripe’s secure Checkout. Sign in once with the access details supplied by ElevenOrbits.
            </p>
            <div className="fake-row" style={{ maxWidth: 520, marginTop: 26 }}>
              <span className="muted">Card and bank verification</span>
              <strong>Handled by Stripe</strong>
            </div>
            <div className="fake-row" style={{ maxWidth: 520 }}>
              <span className="muted">Recurring billing</span>
              <strong>Managed by Stripe</strong>
            </div>
          </div>

          <PublicPaymentForm />
        </section>

        <section className="section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Simple by design</p>
              <h2>Everything important stays with Stripe</h2>
            </div>
          </div>
          <div className="form-grid">
            <article className="card">
              <h3>One-time or recurring</h3>
              <p className="muted small">Choose the payment type before Checkout so you know exactly what will happen.</p>
            </article>
            <article className="card">
              <h3>No card data stored here</h3>
              <p className="muted small">Card details, payment methods, invoices, and subscriptions stay in Stripe.</p>
            </article>
            <article className="card">
              <h3>Clear failure messages</h3>
              <p className="muted small">Customers see helpful next steps without being told internal fraud decisions.</p>
            </article>
            <article className="card">
              <h3>ElevenOrbits identity</h3>
              <p className="muted small">Branding and statement descriptor are configured from your Stripe account.</p>
            </article>
          </div>
          <p className="footer-note">Need help? Contact ElevenOrbits before retrying a declined payment.</p>
        </section>
      </main>
    </div>
  );
}
