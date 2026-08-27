import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getPortalSession()) redirect("/");
  const params = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="brand-lockup" href="/" aria-label="ElevenOrbits home">
          <img className="brand-logo" src="/elevenorbits-logo.webp" alt="ElevenOrbits" />
        </Link>
        <p className="eyebrow">Private customer portal</p>
        <h1 style={{ fontSize: "2.5rem" }}>Enter your access details.</h1>
        <p className="muted">Use the username and password supplied by ElevenOrbits to continue to payment.</p>

        {params.error ? (
          <div className="error-message" style={{ marginBottom: 16 }}>
            The email or password was not accepted. Check your setup and try again.
          </div>
        ) : null}

        <form className="auth-form" action="/api/auth/login" method="post">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="button" type="submit">Sign in</button>
        </form>
        <p className="footer-note">This portal is private. Do not share your access details publicly.</p>
      </section>
    </main>
  );
}
