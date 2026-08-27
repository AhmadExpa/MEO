import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/config";
import { safeFailureMessage, type CustomerResultState } from "@/lib/result";
import CustomerPortalButton from "@/components/CustomerPortalButton";

type ResultPageProps = {
  searchParams: Promise<{ session_id?: string; cancelled?: string }>;
};

type ResultData = {
  state: CustomerResultState;
  title: string;
  message: string;
  sessionId: string;
  subscription: boolean;
  amount: string | null;
  currency: string | null;
};

async function loadResult(sessionId: string, wasCancelled: boolean): Promise<ResultData | null> {
  if (!isStripeConfigured() || !sessionId.startsWith("cs_")) return null;

  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "subscription"],
  });
  if (session.metadata?.elevenorbits !== "true") return null;

  const paymentIntent = typeof session.payment_intent === "object" && session.payment_intent
    ? session.payment_intent
    : null;
  const failureCode = paymentIntent?.last_payment_error?.decline_code || paymentIntent?.last_payment_error?.code || null;
  const subscription = session.mode === "subscription";
  let state: CustomerResultState = "pending";
  let title = "Payment status";
  let message = "Your payment is still being confirmed. Please wait a moment and refresh this page.";

  if (session.payment_status === "paid" || (session.status === "complete" && session.payment_status === "no_payment_required")) {
    state = "paid";
    title = subscription ? "Subscription active" : "Payment complete";
    message = subscription
      ? "Your subscription is active. Stripe will handle future billing automatically."
      : "Thank you. Your payment was completed successfully.";
  } else if (paymentIntent?.status === "requires_action") {
    state = "requires_action";
    title = "Security verification required";
    message = "Your bank requires an additional security step. Return to checkout and complete the verification prompt.";
  } else if (failureCode || session.payment_status === "unpaid") {
    state = "failed";
    title = "Payment was not approved";
    message = safeFailureMessage(failureCode);
  } else if (wasCancelled || session.status === "expired") {
    state = "cancelled";
    title = "Payment cancelled";
    message = "The payment was cancelled or the Checkout session expired. No completed charge was recorded for this attempt.";
  }

  const amount = session.amount_total ? new Intl.NumberFormat("en-US", { style: "currency", currency: session.currency?.toUpperCase() || "USD" }).format(session.amount_total / 100) : null;
  return {
    state,
    title,
    message,
    sessionId: session.id,
    subscription,
    amount,
    currency: session.currency?.toUpperCase() || null,
  };
}

export default async function PaymentResultPage({ searchParams }: ResultPageProps) {
  if (!(await getPortalSession())) redirect("/login");
  const params = await searchParams;
  let result: ResultData | null = null;
  try {
    result = params.session_id ? await loadResult(params.session_id, params.cancelled === "1") : null;
  } catch {
    result = null;
  }

  if (!result) {
    return (
      <main className="center-shell">
        <section className="result-card">
          <div className="result-icon error">!</div>
          <h1>We could not verify this payment</h1>
          <p className="muted">Please sign in to the ElevenOrbits portal again or contact us for help.</p>
          <Link className="button secondary" href="/">Return to ElevenOrbits</Link>
        </section>
      </main>
    );
  }

  const icon = result.state === "paid" ? "✓" : result.state === "failed" ? "!" : result.state === "cancelled" ? "×" : "…";
  const iconClass = result.state === "paid" ? "success" : result.state === "failed" ? "error" : "warning";

  return (
    <main className="center-shell">
      <section className="result-card">
        <div className={`result-icon ${iconClass}`}>{icon}</div>
        <p className="eyebrow">ElevenOrbits</p>
        <h1>{result.title}</h1>
        <p className="lead" style={{ fontSize: "1rem" }}>{result.message}</p>
        {result.amount ? <div className="payment-total"><span className="muted">Amount</span><strong>{result.amount}</strong></div> : null}
        {result.state === "failed" ? (
          <div className="result-help">Try another card or wallet, check the billing address, or ask your bank to approve the transaction. Repeated retries may not help if the bank has declined it.</div>
        ) : null}
        <div className="button-row">
          <Link className="button secondary" href="/">Return to ElevenOrbits</Link>
          {result.state === "paid" && result.subscription ? <CustomerPortalButton sessionId={result.sessionId} /> : null}
        </div>
        <p className="footer-note">Your card statement may show ELEVENORBITS.</p>
      </section>
    </main>
  );
}
