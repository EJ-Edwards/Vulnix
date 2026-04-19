/**
 * GET /api/debug - Debug endpoint
 * 
 * VULNERABILITY: Sensitive Data Exposure
 * When vulnerable, returns all internal data including users, sessions, passwords.
 * When secure, endpoint is disabled entirely.
 * 
 * Exploit: Simply visit /api/debug to see all internal state
 * Fix: Remove debug endpoints from production, or require strong auth
 */

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";
import config from "@/lib/config";

export async function GET(req: NextRequest) {
  logRequest(req);

  // VULNERABILITY: Sensitive Data Exposure
  if (!isVulnerable("sensitiveDataExposure")) {
    return NextResponse.json(
      { error: "Debug endpoint is disabled in production" },
      { status: 404 }
    );
  }

  // VULN: Exposes everything — users with passwords, sessions, config
  return NextResponse.json({
    _warning: "DEBUG ENDPOINT — This exposes sensitive internal data",
    environment: {
      nodeEnv: process.env.NODE_ENV,
      secureMode: config.secureMode,
      vulnerabilities: config.vulnerabilities,
    },
    data: {
      users: store.getAllUsers(), // VULN: Includes plaintext passwords
      sessions: store.sessions,  // VULN: Active session tokens
      projects: store.getAllProjects(),
      promoCodes: store.promoCodes, // VULN: Valid promo codes
    },
    stats: {
      totalUsers: store.getAllUsers().length,
      totalProjects: store.getAllProjects().length,
      totalSessions: store.sessions.length,
      totalLogs: store.logs.length,
    },
  });
}
