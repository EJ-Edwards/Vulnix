/**
 * POST /api/auth/login
 * 
 * Authenticate a user and create a session.
 * 
 * VULNERABILITIES:
 * - No Rate Limiting: Unlimited login attempts when enabled
 * - Predictable Tokens: Session tokens follow guessable pattern when enabled
 * - Sensitive Data Exposure: Returns password in response when enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { generateToken, sanitizeUser } from "@/lib/auth";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

// Simple in-memory rate limit tracker
const loginAttempts: Record<string, { count: number; lastAttempt: number }> = {};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  logRequest(req, { email: body.email, password: "***" });

  const { email, password } = body;

  // VULNERABILITY: No Rate Limiting
  // When secure, we limit login attempts per IP
  if (!isVulnerable("noRateLimit")) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const attempts = loginAttempts[ip];

    if (attempts) {
      // Reset after 15 minutes
      if (now - attempts.lastAttempt > 15 * 60 * 1000) {
        loginAttempts[ip] = { count: 0, lastAttempt: now };
      } else if (attempts.count >= 5) {
        return NextResponse.json(
          { error: "Too many login attempts. Try again in 15 minutes." },
          { status: 429 }
        );
      }
    }

    loginAttempts[ip] = {
      count: (loginAttempts[ip]?.count || 0) + 1,
      lastAttempt: now,
    };
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = store.getUserByEmail(email);
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = generateToken(user.id);
  store.createSession(user.id, token);

  const response = NextResponse.json({
    message: "Login successful",
    user: sanitizeUser(user),
    // VULNERABILITY: Sensitive Data Exposure
    // When vulnerable, sanitizeUser returns the password field
    token: isVulnerable("sensitiveDataExposure") ? token : undefined,
  });

  response.cookies.set("vulnix_session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
  });

  return response;
}
