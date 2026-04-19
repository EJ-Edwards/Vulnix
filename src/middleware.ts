/**
 * VULNIX - Middleware
 * 
 * Runs on every request. Handles logging and basic security headers.
 * 
 * Note: Auth is handled per-route (intentionally — some routes skip it
 * as a vulnerability when enabled).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add basic headers
  response.headers.set("X-Powered-By", "Vulnix/1.0");
  response.headers.set("X-Request-Id", crypto.randomUUID());

  return response;
}

export const config = {
  matcher: [
    // Match all API routes and pages, but not static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
