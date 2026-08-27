"use client";

import { useState } from "react";

type PlanDraft = {
  label: string;
  amount: string;
  interval: "week" | "month" | "year";
  intervalCount: number;
};

const initialPlan: PlanDraft = {
  label: "Monthly service",
  amount: "99.00",
  interval: "month",
  intervalCount: 1,
};

export default function PaymentRequestForm() {
  const [type, setType] = useState<"one_time" | "recurring">("one_time");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [presets, setPresets] = useState("49.99, 99.99, 199.99");
  const [allowCustom, setAllowCustom] = useState(true);
  const [customMin, setCustomMin] = useState("10.00");
  const [customMax, setCustomMax] = useState("5000.00");
  const [plans, setPlans] = useState<PlanDraft[]>([initialPlan]);
  const [expiresInHours, setExpiresInHours] = useState("168");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdLink, setCreatedLink] = useState<{ url: string; reference: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function updatePlan(index: number, key: keyof PlanDraft, value: string | number) {
    setPlans((current) => current.map((plan, itemIndex) => itemIndex === index ? { ...plan, [key]: value } : plan));
  }

  async function createLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCreatedLink(null);
    try {
      const response = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          presetAmounts: presets.split(",").map((value) => value.trim()).filter(Boolean),
          allowCustomAmount: allowCustom,
          customMin,
          customMax,
          recurringPlans: plans,
          expiresInHours: Number(expiresInHours),
        }),
      });
      const result = (await response.json()) as { url?: string; reference?: string; error?: string };
      if (!response.ok || !result.url || !result.reference) throw new Error(result.error || "Could not create the link.");
      setCreatedLink({ url: result.url, reference: result.reference });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create the link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <form className="card" onSubmit={createLink}>
      <div className="card-header">
        <div>
          <p className="eyebrow">New request</p>
          <h2>Create a payment link</h2>
          <p className="muted small">The customer will choose from the options you provide. No customer record is saved here.</p>
        </div>
        <span className="pill">USD · ElevenOrbits</span>
      </div>

      <div className="form-grid" style={{ marginTop: 22 }}>
        <div className="field">
          <label htmlFor="type">Payment type</label>
          <select id="type" value={type} onChange={(event) => setType(event.target.value as "one_time" | "recurring")}>
            <option value="one_time">One-time payment</option>
            <option value="recurring">Recurring subscription</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="expiresInHours">Link expires after</label>
          <select id="expiresInHours" value={expiresInHours} onChange={(event) => setExpiresInHours(event.target.value)}>
            <option value="24">24 hours</option>
            <option value="72">3 days</option>
            <option value="168">7 days</option>
            <option value="720">30 days</option>
          </select>
        </div>
        <div className="field full">
          <label htmlFor="title">Payment title</label>
          <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Website design service" required maxLength={80} />
        </div>
        <div className="field full">
          <label htmlFor="description">Description shown to the customer</label>
          <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Payment for the agreed ElevenOrbits service." required maxLength={600} />
        </div>
      </div>

      {type === "one_time" ? (
        <div className="section" style={{ marginTop: 25 }}>
          <h3>One-time amount choices</h3>
          <p className="field-hint">Enter preset amounts separated by commas. Use whole dollars and cents.</p>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="field full">
              <label htmlFor="presets">Preset amounts</label>
              <input id="presets" value={presets} onChange={(event) => setPresets(event.target.value)} placeholder="49.99, 99.99, 199.99" />
            </div>
            <label className="check-row full">
              <input type="checkbox" checked={allowCustom} onChange={(event) => setAllowCustom(event.target.checked)} />
              Let the customer enter a custom one-time amount
            </label>
            {allowCustom ? (
              <>
                <div className="field">
                  <label htmlFor="customMin">Custom minimum (USD)</label>
                  <input id="customMin" value={customMin} onChange={(event) => setCustomMin(event.target.value)} inputMode="decimal" required />
                </div>
                <div className="field">
                  <label htmlFor="customMax">Custom maximum (USD)</label>
                  <input id="customMax" value={customMax} onChange={(event) => setCustomMax(event.target.value)} inputMode="decimal" required />
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="section" style={{ marginTop: 25 }}>
          <div className="section-header">
            <div>
              <h3>Recurring plans</h3>
              <p className="field-hint">Stripe creates and manages these recurring Prices. It will charge future billing cycles.</p>
            </div>
            <button className="button secondary" type="button" onClick={() => setPlans((current) => [...current, { ...initialPlan, label: `Plan ${current.length + 1}` }])}>Add plan</button>
          </div>
          <div className="plan-editor">
            {plans.map((plan, index) => (
              <div className="plan-row" key={`${index}-${plan.label}`}>
                <div className="field">
                  <label htmlFor={`plan-label-${index}`}>Plan label</label>
                  <input id={`plan-label-${index}`} value={plan.label} onChange={(event) => updatePlan(index, "label", event.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor={`plan-amount-${index}`}>Amount</label>
                  <input id={`plan-amount-${index}`} value={plan.amount} onChange={(event) => updatePlan(index, "amount", event.target.value)} inputMode="decimal" required />
                </div>
                <div className="field">
                  <label htmlFor={`plan-interval-${index}`}>Billing interval</label>
                  <select id={`plan-interval-${index}`} value={plan.interval} onChange={(event) => updatePlan(index, "interval", event.target.value)}>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
                <button className="icon-button" type="button" aria-label={`Remove plan ${index + 1}`} onClick={() => setPlans((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error ? <div className="error-message" style={{ marginTop: 20 }}>{error}</div> : null}
      <div className="button-row" style={{ marginTop: 24 }}>
        <button className="button" type="submit" disabled={busy}>{busy ? "Creating link…" : "Create secure payment link"}</button>
      </div>

      {createdLink ? (
        <div className="link-result">
          <div className="success-message">Created {createdLink.reference}. The link is ready to share.</div>
          <div className="link-value">{createdLink.url}</div>
          <div className="button-row">
            <button className="button secondary" type="button" onClick={copyLink}>{copied ? "Copied" : "Copy link"}</button>
            <a className="button secondary" href={createdLink.url} target="_blank" rel="noreferrer">Preview</a>
          </div>
        </div>
      ) : null}
    </form>
  );
}
