/**
 * POST /api/auth/login
 * 
 * Authenticate a user and create a session.
 * 
 * Security Detections:
 * - Brute force attack detection
 * - SQL injection attempt detection
 * - XSS payload detection
 * - Vulnerability exploitation logging
 * 
 * VULNERABILITIES (when enabled):
 * - No Rate Limiting: Unlimited login attempts
 * - Predictable Tokens: Session tokens follow guessable pattern
 * - Sensitive Data Exposure: Returns password in response
 */

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { generateToken, sanitizeUser } from "@/lib/auth";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";
import {
  detectSqlInjection,
  detectXss,
  detectBruteForce,
  logExploit,
  getSecurityHeaders,
  encodeHtml,
} from "@/lib/security";

// Simple in-memory rate limit tracker
const loginAttempts: Record<string, { count: number; lastAttempt: number }> = {};

export async function POST(req: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    logRequest(req, { email: email || "unknown", password: "***" });

    // Detect SQL injection attempts
    if (email) {
      const sqlCheck = detectSqlInjection(email);
      if (sqlCheck.detected) {
        logExploit("SQL_Injection", "/api/auth/login", "POST", ip, true, {
          field: "email",
          pattern: sqlCheck.pattern,
        });
      }
    }

    if (password) {
      const xssCheck = detectXss(password);
      if (xssCheck.detected) {
        logExploit("XSS", "/api/auth/login", "POST", ip, true, {
          field: "password",
          payload: xssCheck.payload,
        });
      }
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Brute force detection
    if (isVulnerable("noRateLimit")) {
      // When vulnerable, still track but don't block
      const bruteForceCheck = detectBruteForce(email, "/api/auth/login", ip, 999, 15 * 60 * 1000);
    } else {
      // When secure, actively block brute force
      const bruteForceCheck = detectBruteForce(email, "/api/auth/login", ip, 5, 15 * 60 * 1000);
      if (!bruteForceCheck.allowed) {
        logExploit("BruteForce", "/api/auth/login", "POST", ip, true, {
          email,
          attempts: bruteForceCheck.attempts,
        });
        return NextResponse.json(
          { error: "Too many login attempts. Try again in 15 minutes." },
          { status: 429 }
        );
      }
    }

    const user = store.getUserByEmail(email);
    const isValidLogin = user && user.password === password;

    if (!isValidLogin) {
      // Track failed login attempts
      logExploit("FailedLogin", "/api/auth/login", "POST", ip, false, {
        email,
        userExists: !!user,
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = generateToken(user.id);
    store.createSession(user.id, token);

    // Log successful login
    console.log(`✅ Successful login: ${email} from ${ip}`);

    const jsonResponse = NextResponse.json({
      message: "Login successful",
      user: sanitizeUser(user),
      // VULNERABILITY: Sensitive Data Exposure
      // When vulnerable, return token in response
      token: isVulnerable("sensitiveDataExposure") ? token : undefined,
    });

    // Add security headers
    for (const [key, value] of Object.entries(securityHeaders)) {
      jsonResponse.headers.set(key, value);
    }

    jsonResponse.cookies.set("vulnix_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 86400,
      sameSite: "strict",
    });

    return jsonResponse;
  } catch (error: any) {
    console.error("Login error:", error);

    logExploit("LoginError", "/api/auth/login", "POST", ip, false, {
      error: error.message,
    });

    return NextResponse.json(
      { error: "Login failed" },
      { status: 400 }
    );
  }
}
