/**
 * GET /api/users/[id] - Get a user's profile
 * PUT /api/users/[id] - Update a user's profile
 * 
 * VULNERABILITIES:
 * - IDOR: Any user can view/edit any other user's profile when enabled
 * - Mass Assignment: User can set role/plan via request body when enabled
 * - Stored XSS: Bio field stored without sanitization when enabled
 * - Sensitive Data Exposure: Returns password in response when enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

interface RouteParams {
  params: { id: string };
}

function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  logRequest(req);

  const currentUser = getCurrentUser();
  const targetId = parseInt(params.id, 10);

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // VULNERABILITY: IDOR
  // When secure, users can only view their own profile
  if (!isVulnerable("idor") && currentUser.id !== targetId && currentUser.role !== "admin") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const user = store.getUser(targetId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: sanitizeUser(user) });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => ({}));
  const currentUser = getCurrentUser();
  const targetId = parseInt(params.id, 10);
  logRequest(req, body, currentUser?.id);

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // VULNERABILITY: IDOR
  if (!isVulnerable("idor") && currentUser.id !== targetId && currentUser.role !== "admin") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const existingUser = store.getUser(targetId);
  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Build update object
  const update: Record<string, any> = {};

  if (body.name !== undefined) update.name = body.name;
  if (body.email !== undefined) update.email = body.email;

  // VULNERABILITY: Stored XSS in bio
  if (body.bio !== undefined) {
    update.bio = isVulnerable("storedXss") ? body.bio : sanitizeHtml(body.bio);
  }

  // VULNERABILITY: Mass Assignment
  // When vulnerable, user can set their own role and plan
  if (isVulnerable("massAssignment")) {
    if (body.role !== undefined) update.role = body.role;   // VULN: Can set role=admin
    if (body.plan !== undefined) update.plan = body.plan;   // VULN: Can set plan=enterprise
    if (body.credits !== undefined) update.credits = body.credits; // VULN: Can set arbitrary credits
  }

  const updated = store.updateUser(targetId, update);
  return NextResponse.json({ user: sanitizeUser(updated!) });
}
