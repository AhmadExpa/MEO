import Link from "next/link";
import { decryptPaymentLink, publicPaymentLinkConfig } from "@/lib/crypto";
import { formatInterval, formatUsd } from "@/lib/amount";
import PaymentLinkForm from "@/components/PaymentLinkForm";

type PaymentPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { token } = await params;
  const config = decryptPaymentLink(token);

  if (!config) {
    return (
      <main className="center-shell">
        <section className="result-card">
          <div className="result-icon error">!</div>
          <h1>Payment link unavailable</h1>
          <p className="muted">This link is invalid or has expired. Please ask ElevenOrbits for a new payment link.</p>
          <Link className="button secondary" href="/">Return to ElevenOrbits</Link>
        </section>
      </main>
    );
  }

  const publicConfig = publicPaymentLinkConfig(config);
  const previewAmount =
    config.type === "one_time"
      ? config.oneTime?.presets[0]?.amountCents
      : config.recurring?.plans[0]?.amountCents;
  const previewText = previewAmount ? formatUsd(previewAmount) : "Choose an amount";
  const firstInterval = config.recurring?.plans[0];

  return (
    <main className="payment-shell">
      <Link className="brand-lockup" href="/" style={{ width: "fit-content", margin: "0 auto" }}>
        <span className="brand-mark">E</span>
        ElevenOrbits
      </Link>
      <PaymentLinkForm
        config={publicConfig}
        token={token}
        previewAmount={previewText}
        previewInterval={firstInterval ? formatInterval(firstInterval.interval, firstInterval.intervalCount) : undefined}
      />
    </main>
  );
}
