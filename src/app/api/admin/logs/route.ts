/**
 * GET /api/admin/logs - Retrieve request logs
 * 
 * VULNERABILITY: Weak Admin Protection
 * When vulnerable, accessible via ?admin=true query parameter
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { logRequest } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logRequest(req);

  const user = getCurrentUser();
  const searchParams = req.nextUrl.searchParams;

  if (!isAdmin(user, searchParams)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const logs = store.getLogs(Math.min(limit, 200));

  return NextResponse.json({ logs, total: logs.length });
}
