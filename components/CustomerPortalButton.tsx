"use client";

import { useState } from "react";

export default function CustomerPortalButton({ sessionId }: { sessionId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not open the subscription portal.");
      window.location.assign(result.url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Could not open the subscription portal.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="button secondary" type="button" onClick={openPortal} disabled={busy}>
        {busy ? "Opening portal…" : "Manage subscription"}
      </button>
      {error ? <div className="error-message" style={{ marginTop: 12 }}>{error}</div> : null}
    </div>
  );
}
