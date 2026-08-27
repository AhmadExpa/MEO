import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark">E</span>
          ElevenOrbits
        </Link>
        <nav className="topbar-nav">
          <Link href="/login">Merchant login</Link>
        </nav>
      </header>

      <main className="main-content">
        <section className="hero">
          <div>
            <p className="eyebrow">Secure customer payments</p>
            <h1>Payments that feel familiar and safe.</h1>
            <p className="lead">
              ElevenOrbits gives customers a short payment link that opens Stripe-hosted Checkout.
              Customers never need your Stripe login, and recurring billing stays inside Stripe.
            </p>
            <div className="button-row" style={{ marginTop: 26 }}>
              <Link className="button" href="/login">Open merchant dashboard</Link>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-header">
              <div>
                <p className="eyebrow" style={{ marginBottom: 5 }}>Stripe-hosted</p>
                <h2 style={{ marginBottom: 0 }}>ElevenOrbits payment</h2>
              </div>
              <span className="status-pill paid">Secure</span>
            </div>
            <div className="fake-row">
              <span className="muted">One-time service</span>
              <strong>US$199.00</strong>
            </div>
            <div className="fake-row">
              <span className="muted">Customer details</span>
              <strong>Collected by Stripe</strong>
            </div>
            <div className="fake-row">
              <span className="muted">Bank verification</span>
              <strong>Only when needed</strong>
            </div>
            <p className="footer-note" style={{ marginBottom: 0 }}>
              Your card statement may show ELEVENORBITS.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Built for a clean handoff</p>
              <h2>Stripe remains the source of truth</h2>
            </div>
          </div>
          <div className="form-grid">
            <article className="card">
              <h3>One-time or recurring</h3>
              <p className="muted small">Each link is clearly configured so customers do not accidentally subscribe.</p>
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
        </section>
      </main>
    </div>
  );
}
