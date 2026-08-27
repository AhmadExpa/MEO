import { NextResponse } from "next/server";
import { authenticatePortal, setPortalSession } from "@/lib/auth";
import { allowRateLimitedRequest } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const forwardedFor = request.headers.get("x-forwarded-for") || "unknown";
  const clientKey = forwardedFor.split(",")[0].trim();

  if (!allowRateLimitedRequest(`login:${clientKey}`, 8, 10 * 60 * 1000)) {
    return NextResponse.redirect(new URL("/login?error=rate", request.url));
  }

  try {
    if (!authenticatePortal(username, password)) {
      return NextResponse.redirect(new URL("/login?error=1", request.url));
    }
    await setPortalSession(username.trim());
    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }
}
