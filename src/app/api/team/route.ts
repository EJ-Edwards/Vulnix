/**
 * GET /api/team - List team members for current user's projects
 * POST /api/team - Add a member to a project
 * 
 * VULNERABILITIES:
 * - IDOR: Can add members to any project when enabled
 * - Missing Auth Checks: Accessible without auth when enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logRequest(req);

  const user = getCurrentUser();
  if (!isVulnerable("missingAuthChecks") && !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get all unique team members across user's projects
  const projects = user
    ? store.getProjectsByUser(user.id)
    : store.getAllProjects();

  const memberIds = new Set<number>();
  projects.forEach((p) => {
    p.teamIds.forEach((id) => memberIds.add(id));
    memberIds.add(p.ownerId);
  });

  const members = Array.from(memberIds)
    .map((id) => store.getUser(id))
    .filter(Boolean)
    .map((u) => ({
      id: u!.id,
      name: u!.name,
      email: u!.email,
      role: u!.role,
    }));

  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = getCurrentUser();
  logRequest(req, body, user?.id);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId, userId: targetUserId } = body;

  const project = store.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // VULNERABILITY: IDOR
  // When secure, only project owner can add members
  if (!isVulnerable("idor")) {
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Only project owner can add members" }, { status: 403 });
    }
  }

  const targetUser = store.getUser(targetUserId);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (project.teamIds.includes(targetUserId)) {
    return NextResponse.json({ error: "User already a team member" }, { status: 409 });
  }

  store.updateProject(projectId, {
    teamIds: [...project.teamIds, targetUserId],
  });

  return NextResponse.json({ message: `Added ${targetUser.name} to project` });
}
