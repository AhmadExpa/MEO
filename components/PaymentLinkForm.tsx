"use client";

import { useMemo, useRef, useState } from "react";
import type { PublicPaymentLinkConfig } from "@/lib/types";
import { formatInterval, formatUsd } from "@/lib/amount";

type Props = {
  config: PublicPaymentLinkConfig;
  token: string;
  previewAmount: string;
  previewInterval?: string;
};

export default function PaymentLinkForm({ config, token }: Props) {
  const firstSelection =
    config.type === "one_time" ? config.oneTime?.presets[0]?.id || "custom" : config.recurring?.plans[0]?.id || "";
  const [selectionId, setSelectionId] = useState(firstSelection);
  const [customAmount, setCustomAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const attemptId = useRef<string | null>(null);

  const selectedPlan = useMemo(
    () => config.recurring?.plans.find((plan) => plan.id === selectionId),
    [config.recurring?.plans, selectionId],
  );
  const selectedPreset = useMemo(
    () => config.oneTime?.presets.find((preset) => preset.id === selectionId),
    [config.oneTime?.presets, selectionId],
  );
  const selectedAmount = selectedPreset?.amountCents || selectedPlan?.amountCents;
  const customBounds = config.oneTime?.custom;

  async function beginCheckout() {
    setBusy(true);
    setError("");
    attemptId.current ||= crypto.randomUUID();
    try {
      const response = await fetch(`/api/payment-links/${token}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectionId,
          customAmount: selectionId === "custom" ? customAmount : undefined,
          attemptId: attemptId.current,
        }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not start secure checkout.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not start secure checkout.");
      setBusy(false);
    }
  }

  return (
    <section className="payment-card">
      <p className="eyebrow">Secure payment</p>
      <h1>{config.title}</h1>
      <p className="payment-description">{config.description}</p>

      {config.type === "one_time" && config.oneTime ? (
        <>
          <div className="price-options">
            {config.oneTime.presets.map((preset) => (
              <button
                className={`price-option ${selectionId === preset.id ? "selected" : ""}`}
                key={preset.id}
                type="button"
                onClick={() => setSelectionId(preset.id)}
              >
                <span><strong>{preset.label}</strong><span>One-time payment</span></span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
            {customBounds ? (
              <button
                className={`price-option ${selectionId === "custom" ? "selected" : ""}`}
                type="button"
                onClick={() => setSelectionId("custom")}
              >
                <span><strong>Custom amount</strong><span>{formatUsd(customBounds.minCents)} – {formatUsd(customBounds.maxCents)}</span></span>
                <span aria-hidden="true">›</span>
              </button>
            ) : null}
          </div>
          {selectionId === "custom" && customBounds ? (
            <div className="field">
              <label htmlFor="customAmount">Enter amount (USD)</label>
              <input
                id="customAmount"
                inputMode="decimal"
                placeholder="e.g. 149.99"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
              />
              <span className="field-hint">Allowed range: {formatUsd(customBounds.minCents)} to {formatUsd(customBounds.maxCents)}.</span>
            </div>
          ) : null}
        </>
      ) : null}

      {config.type === "recurring" && config.recurring ? (
        <div className="price-options">
          {config.recurring.plans.map((plan) => (
            <button
              className={`price-option ${selectionId === plan.id ? "selected" : ""}`}
              key={plan.id}
              type="button"
              onClick={() => setSelectionId(plan.id)}
            >
              <span><strong>{plan.label}</strong><span>{formatUsd(plan.amountCents)} {formatInterval(plan.interval, plan.intervalCount)}</span></span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="payment-total">
        <span className="muted">{config.type === "recurring" ? "Recurring total" : "Total"}</span>
        <strong>
          {selectedAmount ? formatUsd(selectedAmount) : selectionId === "custom" && customAmount ? `$${customAmount}` : "Choose an amount"}
        </strong>
      </div>

      {config.type === "recurring" ? (
        <div className="info-message" style={{ marginBottom: 17 }}>
          This is a recurring subscription. Stripe will charge the selected amount {selectedPlan ? formatInterval(selectedPlan.interval, selectedPlan.intervalCount) : ""} until you cancel it.
        </div>
      ) : null}

      {error ? <div className="error-message" style={{ marginBottom: 17 }}>{error}</div> : null}
      <button className="button" type="button" style={{ width: "100%" }} onClick={beginCheckout} disabled={busy}>
        {busy ? "Opening secure checkout…" : "Continue to secure payment"}
      </button>
      <div className="secure-note"><span aria-hidden="true">🔒</span> Your payment details are entered securely on Stripe.</div>
      <p className="footer-note">Your card statement may show ELEVENORBITS.</p>
    </section>
  );
}
