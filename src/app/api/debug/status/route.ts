/**
 * GET /api/debug/status
 * 
 * Vulnerability Lab Status Endpoint
 * 
 * Comprehensive health check and vulnerability status report.
 * Shows:
 * - Overall security posture
 * - Vulnerability configuration
 * - Active exploit detection
 * - System statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getVulnerabilityStats, getExploitLog, getSecurityHeaders } from "@/lib/security";
import { isVulnerable } from "@/lib/config";

export async function GET(req: NextRequest) {
  const response = NextResponse.json({});

  // Add security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Optional authentication check
  const authToken = req.headers.get("x-debug-token");
  const isAuthorized = authToken === process.env.DEBUG_TOKEN || process.env.DEBUG_MODE === "true";

  if (!isAuthorized && process.env.NODE_ENV === "production") {
    // Return limited info in production
    return NextResponse.json({
      status: "Vulnix Lab (Limited)",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      authenticated: false,
    });
  }

  const vulnerabilities = {
    idor: isVulnerable("idor"),
    missingAuthChecks: isVulnerable("missingAuthChecks"),
    weakAdminProtection: isVulnerable("weakAdminProtection"),
    weakPasswords: isVulnerable("weakPasswords"),
    predictableTokens: isVulnerable("predictableTokens"),
    noRateLimit: isVulnerable("noRateLimit"),
    reflectedXss: isVulnerable("reflectedXss"),
    storedXss: isVulnerable("storedXss"),
    subscriptionBypass: isVulnerable("subscriptionBypass"),
    duplicateActions: isVulnerable("duplicateActions"),
    sensitiveDataExposure: isVulnerable("sensitiveDataExposure"),
    massAssignment: isVulnerable("massAssignment"),
    noInputValidation: isVulnerable("noInputValidation"),
    ssrfSimulation: isVulnerable("ssrfSimulation"),
  };

  const exploitLog = getExploitLog();
  const stats = getVulnerabilityStats(vulnerabilities);

  // Calculate risk score (0-100)
  const enabledCount = Object.values(vulnerabilities).filter((v) => v).length;
  const exploitedCount = stats.filter((s) => s.successfulExploits > 0).length;
  const riskScore = Math.min(
    100,
    (enabledCount * 5) + (exploitedCount * 20) + Math.min(exploitLog.length * 2, 40)
  );

  // Security posture assessment
  let posture: "Secure" | "At Risk" | "Vulnerable" | "Critical";
  if (riskScore <= 20) posture = "Secure";
  else if (riskScore <= 40) posture = "At Risk";
  else if (riskScore <= 70) posture = "Vulnerable";
  else posture = "Critical";

  const recentExploits = exploitLog.slice(-5).reverse();
  const exploitsByType = exploitLog.reduce(
    (acc, e) => {
      acc[e.vulnerabilityType] = (acc[e.vulnerabilityType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    status: "Vulnix Vulnerability Lab",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    secureMode: process.env.VULNIX_SECURE_MODE === "true",
    authenticated: isAuthorized,

    // Risk Assessment
    riskAssessment: {
      riskScore,
      posture,
      assessment:
        posture === "Secure"
          ? "All critical vulnerabilities are patched"
          : posture === "At Risk"
            ? "Some vulnerabilities are enabled"
            : posture === "Vulnerable"
              ? "Multiple vulnerabilities detected and active"
              : "Critical vulnerabilities detected and likely exploited",
    },

    // Vulnerability Configuration
    vulnerabilityStatus: {
      total: Object.keys(vulnerabilities).length,
      enabled: enabledCount,
      disabled: Object.keys(vulnerabilities).length - enabledCount,
    },

    // Active Vulnerabilities
    activeVulnerabilities: stats
      .filter((s) => s.enabled)
      .map((s) => ({
        name: s.vulnerability,
        attempts: s.attempts,
        successful: s.successfulExploits,
        exploitRate: s.attempts > 0 ? ((s.successfulExploits / s.attempts) * 100).toFixed(1) + "%" : "0%",
      })),

    // Patched Vulnerabilities
    patchedVulnerabilities: stats
      .filter((s) => !s.enabled)
      .map((s) => s.vulnerability),

    // Exploitation Activity
    exploitationActivity: {
      totalAttempts: exploitLog.length,
      successfulExploits: exploitLog.filter((e) => e.successful).length,
      topVulnerabilities: Object.entries(exploitsByType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      recentActivity: recentExploits.map((e) => ({
        timestamp: e.timestamp,
        type: e.vulnerabilityType,
        endpoint: e.endpoint,
        successful: e.successful,
      })),
    },

    // Security Endpoints Available
    debugEndpoints: {
      vulnerabilities: "/api/debug/vulnerabilities",
      exploits: "/api/debug/exploits",
      detect: "/api/debug/detect",
      testIidor: "/api/debug/test-idor",
      status: "/api/debug/status",
      documentation: {
        description: "Check Vulnix documentation for vulnerability descriptions",
        url: "/docs",
      },
    },

    // Environment Configuration
    configuration: {
      debugMode: process.env.DEBUG_MODE === "true",
      debugToken: process.env.DEBUG_TOKEN ? "***" : "not set",
      nodeEnv: process.env.NODE_ENV,
      secureMode: process.env.VULNIX_SECURE_MODE === "true",
    },
  });
}
