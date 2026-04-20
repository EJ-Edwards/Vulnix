/**
 * POST /api/debug/detect
 * 
 * Real-Time Vulnerability Detection Endpoint
 * 
 * Test input strings against all known attack patterns:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - SSRF (Server-Side Request Forgery)
 * 
 * Returns detection results with severity and pattern matches.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  detectSqlInjection,
  detectXss,
  detectSsrfAttempt,
  getSecurityHeaders,
} from "@/lib/security";

interface DetectionResult {
  input: string;
  threats: {
    sqlInjection: boolean;
    xss: boolean;
    ssrf: boolean;
    patterns: string[];
  };
  severity: "safe" | "warning" | "critical";
  recommendations: string[];
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json({});

  // Add security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Check authorization
  const authToken = req.headers.get("x-debug-token");
  const isAuthorized = authToken === process.env.DEBUG_TOKEN || process.env.DEBUG_MODE === "true";

  if (!isAuthorized && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized - Debug endpoint disabled" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { input, testType = "all" } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Please provide 'input' as a string" },
        { status: 400 }
      );
    }

    const results: DetectionResult[] = [];
    const patterns: string[] = [];
    let threats = 0;

    // Test for SQL Injection
    if (testType === "all" || testType === "sql") {
      const sqlResult = detectSqlInjection(input);
      if (sqlResult.detected) {
        patterns.push(`SQL Injection: ${sqlResult.pattern}`);
        threats++;
      }
    }

    // Test for XSS
    if (testType === "all" || testType === "xss") {
      const xssResult = detectXss(input);
      if (xssResult.detected) {
        patterns.push(`XSS: ${xssResult.type} - ${xssResult.payload}`);
        threats++;
      }
    }

    // Test for SSRF
    if (testType === "all" || testType === "ssrf") {
      const isSsrf = detectSsrfAttempt(input, req.headers.get("x-forwarded-for") || "unknown");
      if (isSsrf) {
        patterns.push("SSRF: Blocked internal/private IP address");
        threats++;
      }
    }

    const severity: "safe" | "warning" | "critical" =
      threats === 0 ? "safe" : threats === 1 ? "warning" : "critical";

    const result: DetectionResult = {
      input,
      threats: {
        sqlInjection: detectSqlInjection(input).detected,
        xss: detectXss(input).detected,
        ssrf: detectSsrfAttempt(input, req.headers.get("x-forwarded-for") || "unknown"),
        patterns,
      },
      severity,
      recommendations: [],
    };

    // Add recommendations based on threats
    if (result.threats.sqlInjection) {
      result.recommendations.push("Use parameterized queries or prepared statements");
      result.recommendations.push("Implement input validation and sanitization");
      result.recommendations.push("Apply principle of least privilege to database accounts");
    }

    if (result.threats.xss) {
      result.recommendations.push("HTML-encode all user input before rendering");
      result.recommendations.push("Use Content Security Policy (CSP) headers");
      result.recommendations.push("Implement output encoding");
    }

    if (result.threats.ssrf) {
      result.recommendations.push("Whitelist allowed URLs/hosts");
      result.recommendations.push("Disable access to internal IP ranges");
      result.recommendations.push("Use network-level controls");
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      detection: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Detection failed" },
      { status: 400 }
    );
  }
}
