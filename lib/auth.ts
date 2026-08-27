import { cookies } from "next/headers";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import {
  getAuthSecret,
  getMerchantEmail,
  getMerchantPasswordHash,
} from "@/lib/config";

const cookieName = "elevenorbits_merchant_session";
const sessionLifetimeSeconds = 60 * 60 * 12;

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [scheme, saltPart, hashPart] = storedHash.split("$");
  if (scheme !== "scrypt" || !saltPart || !hashPart) return false;

  try {
    const expected = Buffer.from(hashPart, "base64url");
    const actual = scryptSync(password, Buffer.from(saltPart, "base64url"), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function authenticateMerchant(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === getMerchantEmail() &&
    verifyPassword(password, getMerchantPasswordHash())
  );
}

export function createSessionToken(email: string): string {
  const payload = encode(
    JSON.stringify({
      email,
      expiresAt: Date.now() + sessionLifetimeSeconds * 1000,
    }),
  );
  return `${payload}.${signature(payload)}`;
}

function verifySessionToken(token: string): { email: string } | null {
  try {
    const [payload, providedSignature] = token.split(".");
    if (!payload || !providedSignature) return null;

    const expectedSignature = signature(payload);
    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(providedSignature);
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return null;
    }

    const data = JSON.parse(decode(payload)) as { email?: string; expiresAt?: number };
    if (!data.email || !data.expiresAt || data.expiresAt <= Date.now()) return null;
    if (data.email.toLowerCase() !== getMerchantEmail()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

export async function getMerchantSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function setMerchantSession(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, createSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export async function clearMerchantSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}
