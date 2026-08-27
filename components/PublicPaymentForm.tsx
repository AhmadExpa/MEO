"use client";

import { useMemo, useState } from "react";
import { formatInterval, formatUsd, parseAmountToCents } from "@/lib/amount";
import {
  PUBLIC_PAYMENT_MAX_CENTS,
  PUBLIC_PAYMENT_MIN_CENTS,
  PUBLIC_PAYMENT_PRESETS,
  publicPaymentPresetLabel,
  type PublicPaymentInterval,
  type PublicPaymentMode,
} from "@/lib/public-payment";

export default function PublicPaymentForm() {
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

      <div className="form-grid" style={{ marginTop: 23 }}>
        <div className="field full">
          <label htmlFor="public-payment-mode">Payment type</label>
          <select
            id="public-payment-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as PublicPaymentMode)}
          >
            <option value="one_time">One-time payment</option>
            <option value="recurring">Recurring payment</option>
          </select>
        </div>

        {mode === "recurring" ? (
          <div className="field full">
            <label htmlFor="public-payment-interval">Billing frequency</label>
            <select
              id="public-payment-interval"
              value={interval}
              onChange={(event) => setInterval(event.target.value as PublicPaymentInterval)}
            >
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        ) : null}

        <div className="field full">
          <label htmlFor="public-payment-amount">Amount</label>
          <select id="public-payment-amount" value={selectedAmount} onChange={(event) => setSelectedAmount(event.target.value)}>
            {PUBLIC_PAYMENT_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.amountCents}>
                {publicPaymentPresetLabel(preset.amountCents)}
              </option>
            ))}
            <option value="custom">Enter a custom amount</option>
          </select>
        </div>

        {selectedAmount === "custom" ? (
          <div className="field full">
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
            <span className="field-hint">{amountHint}.</span>
          </div>
        ) : null}
      </div>

      <div className="payment-total">
        <span className="muted">{mode === "recurring" ? `Total ${recurringLabel}` : "Total"}</span>
        <strong>{amountLabel}</strong>
      </div>

      {mode === "recurring" ? (
        <div className="info-message" style={{ marginBottom: 17 }}>
          Stripe will automatically bill this amount {recurringLabel} until the subscription is cancelled.
        </div>
      ) : null}

      {error ? <div className="error-message" style={{ marginBottom: 17 }} role="alert">{error}</div> : null}
      <button className="button" type="submit" style={{ width: "100%" }} disabled={busy}>
        {busy ? "Opening secure checkout…" : "Continue to payment"}
      </button>
      <div className="secure-note"><span aria-hidden="true">🔒</span> Stripe securely collects your name, email, billing address, and card details.</div>
      <p className="footer-note">Your card statement may show ELEVENORBITS.</p>
    </form>
  );
}
