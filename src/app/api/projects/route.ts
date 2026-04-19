/**
 * GET /api/projects - List projects for current user
 * POST /api/projects - Create a new project
 * 
 * VULNERABILITIES:
 * - Missing Auth Checks: GET accessible without auth when enabled
 * - IDOR: Returns ALL projects instead of only user's when enabled
 * - No Input Validation: Accepts any input when enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logRequest(req);

  const user = getCurrentUser();

  // VULNERABILITY: Missing Authorization Checks
  // When vulnerable, no auth required to list projects
  if (!isVulnerable("missingAuthChecks") && !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let projects;
  if (isVulnerable("idor") || !user) {
    // VULN: Returns ALL projects regardless of ownership
    projects = store.getAllProjects();
  } else {
    projects = store.getProjectsByUser(user.id);
  }

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = getCurrentUser();
  logRequest(req, body, user?.id);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // VULNERABILITY: Subscription Bypass
  // When vulnerable, free users can create unlimited projects
  if (!isVulnerable("subscriptionBypass")) {
    const userProjects = store.getProjectsByUser(user.id);
    if (user.plan === "free" && userProjects.length >= 3) {
      return NextResponse.json(
        { error: "Free plan limited to 3 projects. Upgrade to Pro for unlimited." },
        { status: 403 }
      );
    }
  }

  // VULNERABILITY: No Input Validation
  if (!isVulnerable("noInputValidation")) {
    if (!body.name || typeof body.name !== "string" || body.name.length < 1) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }
    if (body.name.length > 100) {
      return NextResponse.json({ error: "Project name too long" }, { status: 400 });
    }
  }

  const project = store.createProject({
    name: body.name || "Untitled Project",
    description: body.description || "",
    ownerId: user.id,
    teamIds: body.teamIds || [user.id],
    status: body.status || "active",
    priority: body.priority || "medium",
  });

  return NextResponse.json({ project }, { status: 201 });
}
