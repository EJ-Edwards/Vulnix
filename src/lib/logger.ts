/**
 * VULNIX - Request Logger
 * 
 * Logs all requests and payloads for analysis.
 */

import { NextRequest } from "next/server";
import { store } from "./store";

export function logRequest(
  req: NextRequest,
  body: any = null,
  userId: number | null = null,
  statusCode?: number
) {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    // Skip very large or binary headers
    if (key !== "cookie" && value.length < 500) {
      headers[key] = value;
    }
  });

  store.addLog({
    method: req.method,
    path: req.nextUrl.pathname + req.nextUrl.search,
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    userId,
    body,
    headers,
    statusCode,
  });
}
