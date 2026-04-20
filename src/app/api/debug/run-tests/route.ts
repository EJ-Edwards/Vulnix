/**
 * POST /api/debug/run-tests
 * 
 * Automated Vulnerability Test Suite
 * 
 * Runs a series of automated tests against vulnerabilities to check:
 * - If vulnerabilities are properly exploitable
 * - If protections are working when enabled
 * - Which attacks are being detected
 */

import { NextRequest, NextResponse } from "next/server";
import {
  detectSqlInjection,
  detectXss,
  detectSsrfAttempt,
  logExploit,
  getSecurityHeaders,
} from "@/lib/security";
import { isVulnerable } from "@/lib/config";

interface TestResult {
  name: string;
  category: string;
  payload: string;
  detected: boolean;
  blocked: boolean;
  exploitable: boolean;
  severity: string;
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

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const results: TestResult[] = [];

  // SQL Injection Test Cases
  const sqlInjectionTests = [
    { name: "Basic OR 1=1", payload: "' OR '1'='1" },
    { name: "UNION SELECT", payload: "' UNION SELECT * FROM users --" },
    { name: "Drop Table", payload: "; DROP TABLE users; --" },
    { name: "Comment Bypass", payload: "admin'--" },
    { name: "Number Bypass", payload: "1 OR 1=1" },
  ];

  for (const test of sqlInjectionTests) {
    const detection = detectSqlInjection(test.payload);
    const result: TestResult = {
      name: test.name,
      category: "SQL_Injection",
      payload: test.payload,
      detected: detection.detected,
      blocked: detection.detected && !isVulnerable("noInputValidation"),
      exploitable: detection.detected && isVulnerable("noInputValidation"),
      severity: "critical",
    };
    results.push(result);

    if (result.exploitable) {
      logExploit("SQL_Injection", "/api/debug/run-tests", "POST", ip, true, {
        test: test.name,
        payload: test.payload,
      });
    }
  }

  // XSS Test Cases
  const xssTests = [
    { name: "Script Alert", payload: "<script>alert('xss')</script>" },
    { name: "Image Onerror", payload: "<img src=x onerror=alert('xss')>" },
    { name: "SVG Onload", payload: "<svg onload=alert('xss')>" },
    { name: "Event Handler", payload: "<div onclick=alert('xss')>click</div>" },
    { name: "JavaScript Protocol", payload: "<a href='javascript:alert(1)'>link</a>" },
  ];

  for (const test of xssTests) {
    const detection = detectXss(test.payload);
    const result: TestResult = {
      name: test.name,
      category: "XSS",
      payload: test.payload,
      detected: detection.detected,
      blocked: detection.detected && !isVulnerable("storedXss") && !isVulnerable("reflectedXss"),
      exploitable: detection.detected && (isVulnerable("storedXss") || isVulnerable("reflectedXss")),
      severity: "high",
    };
    results.push(result);

    if (result.exploitable) {
      logExploit("XSS", "/api/debug/run-tests", "POST", ip, true, {
        test: test.name,
        payload: test.payload,
      });
    }
  }

  // SSRF Test Cases
  const ssrfTests = [
    { name: "Localhost", payload: "http://localhost:8080/admin" },
    { name: "Loopback IP", payload: "http://127.0.0.1/api" },
    { name: "Private IP", payload: "http://192.168.1.1/router" },
    { name: "AWS Metadata", payload: "http://169.254.169.254/latest/meta-data/" },
    { name: "Link Local", payload: "http://169.254.169.254/aws" },
  ];

  for (const test of ssrfTests) {
    const detection = detectSsrfAttempt(test.payload, ip);
    const result: TestResult = {
      name: test.name,
      category: "SSRF",
      payload: test.payload,
      detected: detection,
      blocked: detection && !isVulnerable("ssrfSimulation"),
      exploitable: detection && isVulnerable("ssrfSimulation"),
      severity: "high",
    };
    results.push(result);

    if (result.exploitable) {
      logExploit("SSRF", "/api/debug/run-tests", "POST", ip, true, {
        test: test.name,
        payload: test.payload,
      });
    }
  }

  // Calculate statistics
  const totalTests = results.length;
  const detectedTests = results.filter((r) => r.detected).length;
  const blockedTests = results.filter((r) => r.blocked).length;
  const exploitableTests = results.filter((r) => r.exploitable).length;

  // Group by category
  const byCategory = results.reduce(
    (acc, test) => {
      if (!acc[test.category]) {
        acc[test.category] = [];
      }
      acc[test.category].push(test);
      return acc;
    },
    {} as Record<string, TestResult[]>
  );

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    testSuite: "Automated Vulnerability Tests",
    statistics: {
      totalTests,
      detected: detectedTests,
      blocked: blockedTests,
      exploitable: exploitableTests,
      detectionRate: totalTests > 0 ? ((detectedTests / totalTests) * 100).toFixed(1) + "%" : "0%",
      blockRate: totalTests > 0 ? ((blockedTests / totalTests) * 100).toFixed(1) + "%" : "0%",
    },
    results: results,
    summary: Object.entries(byCategory).map(([category, tests]) => ({
      category,
      total: tests.length,
      detected: tests.filter((t) => t.detected).length,
      blocked: tests.filter((t) => t.blocked).length,
      exploitable: tests.filter((t) => t.exploitable).length,
    })),
    recommendations: [
      ...(!isVulnerable("noInputValidation")
        ? ["✅ Input validation is enabled - SQL injection and XSS threats mitigated"]
        : ["⚠️  Input validation is disabled - Critical vulnerability"]),

      ...(!isVulnerable("reflectedXss") && !isVulnerable("storedXss")
        ? ["✅ XSS protections are active"]
        : ["⚠️  XSS vulnerabilities are exploitable"]),

      ...(!isVulnerable("ssrfSimulation")
        ? ["✅ SSRF protections are blocking internal requests"]
        : ["⚠️  SSRF vulnerability allows internal access"]),

      ...(exploitableTests > 0
        ? [`⚠️  ${exploitableTests} vulnerabilities are currently exploitable`]
        : ["✅ All tested vulnerabilities are properly protected"]),
    ],
  });
}
