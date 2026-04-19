/**
 * GET /api/auth/me
 * 
 * Return the currently authenticated user.
 * 
 * VULNERABILITY: Sensitive Data Exposure
 * When vulnerable, returns password and internal fields.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";
import { logRequest } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logRequest(req);

  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ user: sanitizeUser(user) });
}
