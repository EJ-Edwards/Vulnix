/**
 * GET /api/users - List all users (admin)
 * 
 * VULNERABILITIES:
 * - Missing Auth Checks: Accessible without auth when enabled
 * - Sensitive Data Exposure: Returns passwords when enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, sanitizeUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logRequest(req);

  const user = getCurrentUser();
  const searchParams = req.nextUrl.searchParams;

  // VULNERABILITY: Missing Authorization Checks
  if (!isVulnerable("missingAuthChecks")) {
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!isAdmin(user, searchParams)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
  }

  const users = store.getAllUsers().map((u) => sanitizeUser(u));
  return NextResponse.json({ users });
}
