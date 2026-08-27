import { NextResponse } from "next/server";
import { clearMerchantSession } from "@/lib/auth";

export async function POST(request: Request) {
  await clearMerchantSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
