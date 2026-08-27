import { headers } from "next/headers";

function decodeHeader(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function browserName(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return "Microsoft Edge";
  if (/OPR\//.test(userAgent)) return "Opera";
  if (/Chrome\//.test(userAgent)) return "Google Chrome";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
  return "Browser not identified";
}

function deviceName(userAgent: string): string {
  const device = /iPad|Tablet/i.test(userAgent)
    ? "Tablet"
    : /Mobile|Android|iPhone|iPod/i.test(userAgent)
      ? "Mobile"
      : "Desktop or laptop";
  const operatingSystem = /Windows NT/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad|iPod/.test(userAgent)
        ? "iOS"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "OS not identified";
  return `${device} · ${operatingSystem}`;
}

export default async function ClientSecurityPanel() {
  const requestHeaders = await headers();
  const forwardedIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedIp || requestHeaders.get("x-real-ip") || "Unavailable";
  const location = [
    decodeHeader(requestHeaders.get("x-vercel-ip-city")),
    decodeHeader(requestHeaders.get("x-vercel-ip-country-region")),
    decodeHeader(requestHeaders.get("x-vercel-ip-country")),
  ].filter(Boolean).join(", ") || "Unavailable";
  const userAgent = requestHeaders.get("user-agent") || "";

  return (
    <section className="security-panel" aria-label="Payment security details">
      <div className="security-panel-header">
        <span><span className="security-live-dot" aria-hidden="true" /> Payment security details</span>
        <span className="security-panel-live">Live</span>
      </div>
      <div className="security-panel-grid">
        <div><span>IP address</span><strong>{ipAddress}</strong></div>
        <div><span>Approx. location</span><strong>{location}</strong></div>
        <div><span>Browser</span><strong>{browserName(userAgent)}</strong></div>
        <div><span>Device / OS</span><strong>{deviceName(userAgent)}</strong></div>
        <div><span>Radar fingerprint</span><strong className="security-muted-value">Stripe-managed · not exposed</strong></div>
      </div>
      <p className="security-panel-note">These are portal-observed details. Stripe Checkout may use additional fraud signals.</p>
    </section>
  );
}
