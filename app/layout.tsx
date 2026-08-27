import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElevenOrbits Payments",
  description: "Secure payments for ElevenOrbits customers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
