/**
 * GET /api/projects/[id]/comments - List comments for a project
 * POST /api/projects/[id]/comments - Add a comment
 * 
 * VULNERABILITIES:
 * - Stored XSS: Comment content is stored without sanitization when enabled
 * - IDOR: Any user can view/post comments on any project when enabled
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
  if (!isVulnerable("idor") && user) {
    if (project.ownerId !== user.id && !project.teamIds.includes(user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const comments = store.getCommentsByProject(projectId);
  // Enrich comments with user names
  const enriched = comments.map((c) => {
    const author = store.getUser(c.userId);
    return {
      ...c,
      authorName: author?.name || "Unknown",
    };
  });

  return NextResponse.json({ comments: enriched });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
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
  if (!isVulnerable("idor")) {
    if (project.ownerId !== user.id && !project.teamIds.includes(user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  let content = body.content || "";

  // VULNERABILITY: Stored XSS
  // When secure, sanitize HTML from comments
  if (!isVulnerable("storedXss")) {
    content = sanitizeHtml(content);
  }
  // VULN: When insecure, raw HTML/JS stored and rendered as-is

  if (!content.trim()) {
    return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
  }

  const comment = store.createComment({
    projectId,
    userId: user.id,
    content,
  });

  return NextResponse.json({
    comment: {
      ...comment,
      authorName: user.name,
    },
  }, { status: 201 });
}
