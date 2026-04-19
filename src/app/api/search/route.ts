/**
 * GET /api/search?q=... - Search projects and users
 * 
 * VULNERABILITY: Reflected XSS
 * When vulnerable, search query is reflected in response without sanitization
 * The frontend renders this raw, enabling script injection.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function GET(req: NextRequest) {
  logRequest(req);

  const user = getCurrentUser();
  const query = req.nextUrl.searchParams.get("q") || "";

  if (!query) {
    return NextResponse.json({ query: "", results: [], message: "Enter a search query" });
  }

  const lowerQuery = query.toLowerCase();

  // Search projects
  const projects = store.getAllProjects().filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
  );

  // Search users (names only)
  const users = store.getAllUsers()
    .filter((u) => u.name.toLowerCase().includes(lowerQuery))
    .map((u) => ({ id: u.id, name: u.name, email: u.email }));

  // VULNERABILITY: Reflected XSS
  // When vulnerable, the query is returned as-is and rendered in the frontend
  const displayQuery = isVulnerable("reflectedXss") ? query : sanitizeHtml(query);

  return NextResponse.json({
    query: displayQuery, // VULN: Raw HTML/JS reflected back
    results: {
      projects,
      users,
    },
    total: projects.length + users.length,
  });
}
