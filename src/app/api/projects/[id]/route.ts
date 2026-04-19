/**
 * GET /api/projects/[id] - Get a single project
 * PUT /api/projects/[id] - Update a project
 * DELETE /api/projects/[id] - Delete a project
 * 
 * VULNERABILITIES:
 * - IDOR: Any user can access/modify any project by ID when enabled
 * - Missing Auth Checks: No auth required when enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  logRequest(req);

  const user = getCurrentUser();
  const projectId = parseInt(params.id, 10);

  // VULNERABILITY: Missing Authorization Checks
  if (!isVulnerable("missingAuthChecks") && !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const project = store.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // VULNERABILITY: IDOR
  // When secure, verify user has access to this project
  if (!isVulnerable("idor") && user) {
    if (project.ownerId !== user.id && !project.teamIds.includes(user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  return NextResponse.json({ project });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => ({}));
  const user = getCurrentUser();
  const projectId = parseInt(params.id, 10);
  logRequest(req, body, user?.id);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const project = store.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // VULNERABILITY: IDOR
  // When secure, only owner can update
  if (!isVulnerable("idor")) {
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the project owner can edit" }, { status: 403 });
    }
  }

  const updated = store.updateProject(projectId, {
    name: body.name ?? project.name,
    description: body.description ?? project.description,
    status: body.status ?? project.status,
    priority: body.priority ?? project.priority,
    teamIds: body.teamIds ?? project.teamIds,
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const user = getCurrentUser();
  const projectId = parseInt(params.id, 10);
  logRequest(req, null, user?.id);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const project = store.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // VULNERABILITY: IDOR
  if (!isVulnerable("idor")) {
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the project owner can delete" }, { status: 403 });
    }
  }

  store.deleteProject(projectId);
  return NextResponse.json({ message: "Project deleted" });
}
