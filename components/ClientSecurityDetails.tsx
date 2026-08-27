"use client";

import { useEffect, useState } from "react";

type ClientSecurityDetailsProps = {
  ipAddress: string;
  location: string;
};

type BrowserDetails = {
  browser: string;
  operatingSystem: string;
  device: string;
  timezone: string;
  language: string;
  screen: string;
};

function browserName(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return "Microsoft Edge";
  if (/OPR\//.test(userAgent)) return "Opera";
  if (/Chrome\//.test(userAgent)) return "Google Chrome";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
  return "Browser not identified";
}

function operatingSystem(userAgent: string): string {
  if (/Windows NT/.test(userAgent)) return "Windows";
  if (/Android/.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
  if (/Mac OS X/.test(userAgent)) return "macOS";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Operating system not identified";
}

function deviceType(userAgent: string): string {
  if (/iPad|Tablet/i.test(userAgent)) return "Tablet";
  if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) return "Mobile";
  return "Desktop or laptop";
}

export default function ClientSecurityDetails({ ipAddress, location }: ClientSecurityDetailsProps) {
  const [details, setDetails] = useState<BrowserDetails | null>(null);

  useEffect(() => {
    const resolvedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetails({
      browser: browserName(navigator.userAgent),
      operatingSystem: operatingSystem(navigator.userAgent),
      device: deviceType(navigator.userAgent),
      timezone: resolvedTimezone || "Unavailable",
      language: navigator.language || "Unavailable",
      screen: `${window.screen.width} × ${window.screen.height}`,
    });
  }, []);

  return (
    <details className="security-details" open>
      <summary>
        <span><span className="security-live-dot" aria-hidden="true" /> Live connection details</span>
        <span className="security-summary-value">{ipAddress}</span>
      </summary>
      <div className="security-grid">
        <div><span>IP address observed by portal</span><strong>{ipAddress}</strong></div>
        <div><span>Approximate location</span><strong>{location}</strong></div>
        <div><span>Browser</span><strong>{details?.browser || "Detecting…"}</strong></div>
        <div><span>Device / OS</span><strong>{details ? `${details.device} · ${details.operatingSystem}` : "Detecting…"}</strong></div>
        <div><span>Timezone / language</span><strong>{details ? `${details.timezone} · ${details.language}` : "Detecting…"}</strong></div>
        <div><span>Screen</span><strong>{details?.screen || "Detecting…"}</strong></div>
      </div>
      <p className="security-details-note">
        These are transparency details for this page. Stripe Checkout may receive additional device and activity signals. Stripe’s private Radar fingerprint and risk score are not exposed here.
      </p>
    </details>
  );
}
