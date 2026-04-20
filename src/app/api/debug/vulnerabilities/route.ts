/**
 * GET /api/debug/vulnerabilities
 * 
 * Vulnerability Detection & Status Endpoint
 * 
 * Returns:
 * - List of all vulnerabilities and their current status
 * - Exploitation attempts tracked
 * - Statistics on detected attacks
 * - Severity assessment
 * 
 * CAUTION: This endpoint reveals which vulnerabilities are enabled.
 * In production, this should be protected behind authentication and IP whitelisting.
 */

import { NextRequest, NextResponse } from "next/server";
import { isVulnerable } from "@/lib/config";
import {
  getVulnerabilityStats,
  getExploitLog,
  getSecurityHeaders,
} from "@/lib/security";

export async function GET(req: NextRequest) {
  const response = NextResponse.json({});

  // Add security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Check authorization (optional - can be restricted)
  const authToken = req.headers.get("x-debug-token");
  const isAuthorized = authToken === process.env.DEBUG_TOKEN || process.env.DEBUG_MODE === "true";

  if (!isAuthorized && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized - Debug endpoint disabled" },
      { status: 403 }
    );
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

  const stats = getVulnerabilityStats(vulnerabilities);
  const exploitLog = getExploitLog();

  // Count exploits by type
  const exploitsByType = exploitLog.reduce(
    (acc, exploit) => {
      if (!acc[exploit.vulnerabilityType]) {
        acc[exploit.vulnerabilityType] = { successful: 0, total: 0 };
      }
      acc[exploit.vulnerabilityType].total++;
      if (exploit.successful) {
        acc[exploit.vulnerabilityType].successful++;
      }
      return acc;
    },
    {} as Record<string, { successful: number; total: number }>
  );

  // Find most recent exploits
  const recentExploits = exploitLog.slice(-10).reverse();

  return NextResponse.json({
    status: "Vulnix Vulnerability Lab",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    secureMode: process.env.VULNIX_SECURE_MODE === "true",
    vulnerabilities,
    statistics: {
      totalVulnerabilities: Object.keys(vulnerabilities).length,
      enabledVulnerabilities: Object.values(vulnerabilities).filter((v) => v).length,
      totalExploitAttempts: exploitLog.length,
      successfulExploits: exploitLog.filter((e) => e.successful).length,
      exploitsByType,
    },
    vulnerabilityDetails: stats.map((stat) => ({
      name: stat.vulnerability,
      enabled: stat.enabled,
      attempts: stat.attempts,
      successfulExploits: stat.successfulExploits,
      exploitRate:
        stat.attempts > 0
          ? ((stat.successfulExploits / stat.attempts) * 100).toFixed(2) + "%"
          : "0%",
      severity: stat.severity,
      lastAttempt: stat.lastAttempt,
    })),
    recentActivity: {
      lastExploits: recentExploits.slice(0, 5).map((e) => ({
        id: e.id,
        type: e.vulnerabilityType,
        endpoint: e.endpoint,
        method: e.method,
        timestamp: e.timestamp,
        successful: e.successful,
        sourceIp: e.sourceIp,
      })),
    },
  });
}
