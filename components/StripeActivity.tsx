"use client";

import { useState } from "react";
import type { StripePaymentRow, StripeSummary } from "@/lib/types";
import { formatUsd } from "@/lib/amount";

type Props = {
  initialRows: StripePaymentRow[];
  initialSummary: StripeSummary;
  initialCursor: string | null;
  initialHasMore: boolean;
};

const summaryItems: Array<{ key: keyof StripeSummary; label: string }> = [
  { key: "all", label: "All" },
  { key: "succeeded", label: "Succeeded" },
  { key: "refunded", label: "Refunded" },
  { key: "disputed", label: "Disputed" },
  { key: "failed", label: "Failed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "uncaptured", label: "Uncaptured" },
];

function readableDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function StripeActivity({ initialRows, initialSummary, initialCursor, initialHasMore }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [summary] = useState(initialSummary);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/stripe/payments?starting_after=${encodeURIComponent(cursor)}`);
      const result = (await response.json()) as { rows?: StripePaymentRow[]; nextCursor?: string | null; hasMore?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load payments.");
      setRows((current) => [...current, ...(result.rows || [])]);
      setCursor(result.nextCursor || null);
      setHasMore(Boolean(result.hasMore));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load more payments.");
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = status === "all" ? rows : rows.filter((row) => row.status === status);

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Stripe activity</p>
          <h2>Payments and customer status</h2>
          <p className="muted small">Live, read-only data from Stripe. This app does not mirror it locally.</p>
        </div>
        <a className="button secondary" href="https://dashboard.stripe.com" target="_blank" rel="noreferrer">Open Stripe Dashboard</a>
      </div>

      <div className="summary-grid">
        {summaryItems.map((item) => (
          <button className={`summary-card ${status === item.key ? "active" : ""}`} key={item.key} type="button" onClick={() => setStatus(item.key)}>
            <span className="summary-label">{item.label}</span>
            <strong className="summary-value">{summary[item.key]}</strong>
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Payment method</th>
              <th>Description</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Refunded date</th>
              <th>Decline reason</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length ? filteredRows.map((row) => (
              <tr key={row.id}>
                <td className="amount-cell">{formatUsd(row.amountCents)} {row.currency}</td>
                <td><span className="status-pill">{row.paymentMethod}</span></td>
                <td>{row.description}</td>
                <td>{row.customer}</td>
                <td>{readableDate(row.createdAt)}</td>
                <td>{row.refundedAt ? readableDate(row.refundedAt) : "—"}</td>
                <td><span className={`status-pill ${row.status}`}>{row.status === "failed" ? row.declineReason || "Payment failed" : row.status}</span></td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="muted">No payments match this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {error ? <div className="error-message" style={{ marginTop: 12 }}>{error}</div> : null}
      {hasMore ? <div className="button-row" style={{ justifyContent: "center", marginTop: 17 }}><button className="button secondary" type="button" onClick={loadMore} disabled={loading}>{loading ? "Loading…" : "Load more"}</button></div> : null}
    </section>
  );
}
