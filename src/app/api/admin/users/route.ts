/**
 * GET /api/admin/users - Admin list all users
 * DELETE /api/admin/users?id=X - Admin delete a user
 * 
 * VULNERABILITY: Weak Admin Protection
 * When vulnerable, admin check uses query param ?admin=true
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin, sanitizeUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { logRequest } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logRequest(req);

  const user = getCurrentUser();
  const searchParams = req.nextUrl.searchParams;

  if (!isAdmin(user, searchParams)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const users = store.getAllUsers().map((u) => sanitizeUser(u));
  return NextResponse.json({ users, total: users.length });
}

export async function DELETE(req: NextRequest) {
  logRequest(req);

  const user = getCurrentUser();
  const searchParams = req.nextUrl.searchParams;

  if (!isAdmin(user, searchParams)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const targetId = parseInt(searchParams.get("id") || "0", 10);
  if (!targetId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const target = store.getUser(targetId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Don't allow deleting yourself
  if (user && target.id === user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  store.updateUser(targetId, { role: "user" as const }); // Soft "delete" - demote
  return NextResponse.json({ message: `User ${targetId} demoted` });
}
