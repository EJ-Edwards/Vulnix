/**
 * VULNIX - Middleware
 * 
 * Runs on every request. Handles:
 * - Security headers to prevent attacks
 * - Request tracking and fingerprinting
 * - Vulnerability detection and logging
 * - Attack pattern recognition
 * 
 * Note: Auth is handled per-route (intentionally — some routes skip it
 * as a vulnerability when enabled).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSecurityHeaders, fingerprintRequest, detectSqlInjection, detectXss } from "@/lib/security";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Add request tracking
  const requestId = crypto.randomUUID();
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Powered-By", "Vulnix/1.0");

  // Request fingerprinting for anomaly detection
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const method = request.method;
  const endpoint = request.nextUrl.pathname;

  const fingerprint = fingerprintRequest(ip, userAgent, method, endpoint);

  // Log suspicious patterns
  if (fingerprint.suspiciousPatterns.length > 0) {
    console.warn(`⚠️  Suspicious request detected:`, {
      requestId,
      patterns: fingerprint.suspiciousPatterns,
      endpoint,
      ip,
      userAgent,
    });
  }

  // Detect SQL injection in query parameters
  const searchParams = request.nextUrl.searchParams;
  for (const [key, value] of searchParams.entries()) {
    const sqlCheck = detectSqlInjection(value);
    if (sqlCheck.detected) {
      console.warn(`🚨 SQL Injection attempt detected:`, {
        requestId,
        param: key,
        value: value.substring(0, 100),
      });
    }

    const xssCheck = detectXss(value);
    if (xssCheck.detected) {
      console.warn(`🚨 XSS attempt detected:`, {
        requestId,
        param: key,
        payload: xssCheck.payload.substring(0, 100),
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all API routes and pages, but not static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
