"use client";

import { useMemo, useState } from "react";
import { formatInterval, formatUsd, parseAmountToCents } from "@/lib/amount";
import ClientSecurityDetails from "@/components/ClientSecurityDetails";
import {
  PUBLIC_PAYMENT_MAX_CENTS,
  PUBLIC_PAYMENT_MIN_CENTS,
  PUBLIC_PAYMENT_PRESETS,
  publicPaymentPresetLabel,
  type PublicPaymentInterval,
  type PublicPaymentMode,
} from "@/lib/public-payment";

type PublicPaymentFormProps = {
  clientContext: {
    ipAddress: string;
    location: string;
  };
};

export default function PublicPaymentForm({ clientContext }: PublicPaymentFormProps) {
  const [mode, setMode] = useState<PublicPaymentMode>("one_time");
  const [selectedAmount, setSelectedAmount] = useState(String(PUBLIC_PAYMENT_PRESETS[0].amountCents));
  const [customAmount, setCustomAmount] = useState("");
  const [interval, setInterval] = useState<PublicPaymentInterval>("month");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const amountCents = useMemo(() => {
    if (selectedAmount !== "custom") return Number(selectedAmount) || 0;
    try {
      return parseAmountToCents(customAmount);
    } catch {
      return 0;
    }
  }, [customAmount, selectedAmount]);
  const amountLabel = amountCents ? formatUsd(amountCents) : "Choose an amount";
  const recurringLabel = formatInterval(interval, 1);
  const canSubmit = amountCents >= PUBLIC_PAYMENT_MIN_CENTS && amountCents <= PUBLIC_PAYMENT_MAX_CENTS;
  const amountHint = useMemo(
    () => `From ${formatUsd(PUBLIC_PAYMENT_MIN_CENTS)} to ${formatUsd(PUBLIC_PAYMENT_MAX_CENTS)}`,
    [],
  );

  async function startCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError(`Enter an amount between ${formatUsd(PUBLIC_PAYMENT_MIN_CENTS)} and ${formatUsd(PUBLIC_PAYMENT_MAX_CENTS)}.`);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          amount: (amountCents / 100).toFixed(2),
          interval: mode === "recurring" ? interval : undefined,
          attemptId: crypto.randomUUID(),
        }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not open secure checkout.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not open secure checkout.");
      setBusy(false);
    }
  }

  return (
    <form className="card public-payment-card" onSubmit={startCheckout}>
      <div className="card-header">
        <div>
          <p className="eyebrow">ElevenOrbits checkout</p>
          <h2>Make a payment</h2>
          <p className="muted small">Choose an amount and continue to Stripe’s secure payment page.</p>
        </div>
        <span className="pill">USD · Secure</span>
      </div>

      <div className="payment-choice-grid">
        <div className="choice-block">
          <span className="choice-label">Payment type</span>
          <div className="choice-options" role="group" aria-label="Payment type">
            <button
              className={`choice-button ${mode === "one_time" ? "selected" : ""}`}
              type="button"
              aria-pressed={mode === "one_time"}
              onClick={() => setMode("one_time")}
            >
              One-time
            </button>
            <button
              className={`choice-button ${mode === "recurring" ? "selected" : ""}`}
              type="button"
              aria-pressed={mode === "recurring"}
              onClick={() => setMode("recurring")}
            >
              Recurring
            </button>
          </div>
        </div>

        {mode === "recurring" ? (
          <div className="choice-block">
            <span className="choice-label">Billing frequency</span>
            <div className="choice-options" role="group" aria-label="Billing frequency">
              {(["week", "month", "year"] as PublicPaymentInterval[]).map((option) => (
                <button
                  className={`choice-button ${interval === option ? "selected" : ""}`}
                  key={option}
                  type="button"
                  aria-pressed={interval === option}
                  onClick={() => setInterval(option)}
                >
                  {option === "week" ? "Weekly" : option === "month" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="choice-block amount-block">
          <div className="choice-heading">
            <span className="choice-label">Amount</span>
            <span className="field-hint">{amountHint}</span>
          </div>
          <div className="amount-options" role="group" aria-label="Payment amount">
            {PUBLIC_PAYMENT_PRESETS.map((preset) => (
              <button
                className={`amount-button ${selectedAmount === String(preset.amountCents) ? "selected" : ""}`}
                key={preset.id}
                type="button"
                aria-pressed={selectedAmount === String(preset.amountCents)}
                onClick={() => setSelectedAmount(String(preset.amountCents))}
              >
                {publicPaymentPresetLabel(preset.amountCents)}
              </button>
            ))}
            <button
              className={`amount-button ${selectedAmount === "custom" ? "selected" : ""}`}
              type="button"
              aria-pressed={selectedAmount === "custom"}
              onClick={() => setSelectedAmount("custom")}
            >
              Custom
            </button>
          </div>
        </div>

        {selectedAmount === "custom" ? (
          <div className="field custom-amount-field">
            <label htmlFor="public-custom-amount">Custom amount (USD)</label>
            <input
              id="public-custom-amount"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              inputMode="decimal"
              placeholder="e.g. 149.99"
              min="10"
              max="5000"
              step="0.01"
              required
            />
          </div>
        ) : null}
      </div>

      <div className="payment-total">
        <span className="muted">{mode === "recurring" ? `Total ${recurringLabel}` : "Total"}</span>
        <strong>{amountLabel}</strong>
      </div>

      {mode === "recurring" ? (
        <div className="info-message compact-message">
          Stripe will automatically bill this amount {recurringLabel} until the subscription is cancelled.
        </div>
      ) : null}

      <div className="privacy-notice">
        <div className="privacy-notice-icon" aria-hidden="true">✓</div>
        <div>
          <strong>Stripe security check</strong>
          <p>Stripe may use your IP-derived location, browser/device signals, billing details, card information, and bank authentication to assess this payment.</p>
          <span>The full Radar fingerprint is not shown here, and ElevenOrbits does not store card details or create its own fingerprint.</span>
        </div>
      </div>

      <ClientSecurityDetails {...clientContext} />

      {error ? <div className="error-message compact-message" role="alert">{error}</div> : null}
      <button className="button payment-submit" type="submit" disabled={busy}>
        {busy ? "Opening secure checkout…" : "Continue to payment"}
      </button>
      <div className="secure-note"><span aria-hidden="true">🔒</span> Stripe securely collects your name, email, billing address, and card details.</div>
      <p className="footer-note">Your card statement may show ELEVENORBITS.</p>
    </form>
  );
}
