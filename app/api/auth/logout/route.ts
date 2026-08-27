import { NextResponse } from "next/server";
import { clearPortalSession } from "@/lib/auth";

export async function POST(request: Request) {
  await clearPortalSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
