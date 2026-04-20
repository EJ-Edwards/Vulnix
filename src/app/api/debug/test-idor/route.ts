/**
 * POST /api/debug/test-idor
 * 
 * Test IDOR (Insecure Direct Object Reference) Vulnerability Detection
 * 
 * Simulates IDOR exploitation attempts and detects access control violations.
 * Logs all detection attempts.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { logExploit, getSecurityHeaders } from "@/lib/security";
import { isVulnerable } from "@/lib/config";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({});

  // Add security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  try {
    // Check authorization
    const authToken = req.headers.get("x-debug-token");
    const isAuthorized = authToken === process.env.DEBUG_TOKEN || process.env.DEBUG_MODE === "true";

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Unauthorized - Debug endpoint disabled" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, projectId, simulateExploit = false } = body;
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    const user = getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Test access to project
    const project = store.getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if access should be denied
    const isOwner = project.ownerId === user.id;
    const isTeamMember = project.teamIds.includes(user.id);
    const hasAccess = isOwner || isTeamMember;

    // Log potential IDOR attempt
    if (!hasAccess && !isVulnerable("idor")) {
      logExploit("IDOR", `/api/projects/${projectId}`, "GET", ip, true, {
        requestingUserId: user.id,
        projectOwnerId: project.ownerId,
        projectTeamIds: project.teamIds,
        unauthorized: true,
      });
    }

    // Simulate unauthorized access if vulnerability enabled
    if (simulateExploit && isVulnerable("idor")) {
      logExploit("IDOR", `/api/projects/${projectId}`, "GET", ip, true, {
        requestingUserId: user.id,
        projectOwnerId: project.ownerId,
        simulatedExploit: true,
      });
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      test: "IDOR Detection",
      requestingUserId: user.id,
      projectId,
      projectOwnerId: project.ownerId,
      projectTeamIds: project.teamIds,
      userAccess: {
        isOwner,
        isTeamMember,
        hasAccess,
      },
      vulnerability: {
        enabled: isVulnerable("idor"),
        vulnerable: !hasAccess && isVulnerable("idor"),
        wouldBeExploitable: !hasAccess,
      },
      result: {
        accessGranted: hasAccess || isVulnerable("idor"),
        reason: hasAccess
          ? "User has valid access"
          : isVulnerable("idor")
            ? "IDOR vulnerability enabled - access granted despite no authorization"
            : "Access denied - IDOR protection active",
      },
    });
  } catch (error: any) {
    console.error("IDOR test error:", error);
    return NextResponse.json(
      { error: error.message || "IDOR test failed" },
      { status: 400 }
    );
  }
}
