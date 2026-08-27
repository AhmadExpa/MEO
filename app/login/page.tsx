import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark">E</span>
          ElevenOrbits
        </Link>
        <p className="eyebrow">Merchant area</p>
        <h1 style={{ fontSize: "2.5rem" }}>Review your payments.</h1>
        <p className="muted">Customers pay from the public portal. Sign in here only to review Stripe activity.</p>

        {params.error ? (
          <div className="error-message" style={{ marginBottom: 16 }}>
            The email or password was not accepted. Check your setup and try again.
          </div>
        ) : null}

        <form className="auth-form" action="/api/auth/login" method="post">
          <div className="field">
            <label htmlFor="email">Merchant email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="button" type="submit">Sign in</button>
        </form>
        <p className="footer-note">Customers should never receive these merchant credentials.</p>
      </section>
    </main>
  );
}
