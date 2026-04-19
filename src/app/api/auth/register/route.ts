/**
 * POST /api/auth/register
 * 
 * Register a new user account.
 * 
 * VULNERABILITIES:
 * - Weak Passwords: Accepts any password when enabled
 * - Mass Assignment: User can set their own role when enabled
 * - No Input Validation: No server-side validation when enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { generateToken, validatePassword } from "@/lib/auth";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  logRequest(req, body);

  const { email, password, name, bio, role, plan } = body;

  // VULNERABILITY: No Input Validation
  // When secure, we validate all fields
  if (!isVulnerable("noInputValidation")) {
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }
  }

  // Check password strength
  const pwCheck = validatePassword(password || "");
  if (!pwCheck.valid) {
    return NextResponse.json({ error: pwCheck.message }, { status: 400 });
  }

  // Check duplicate email
  if (store.getUserByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  // VULNERABILITY: Mass Assignment
  // When vulnerable, user-supplied role and plan are accepted directly
  let userRole: "user" | "admin" = "user";
  let userPlan: "free" | "pro" | "enterprise" = "free";

  if (isVulnerable("massAssignment")) {
    // VULN: User can set role=admin or plan=enterprise in request body
    userRole = role || "user";
    userPlan = plan || "free";
  }

  const user = store.createUser({
    email,
    password, // VULN: Stored in plain text (intentional for this lab)
    name: name || email.split("@")[0],
    bio: bio || "",
    role: userRole,
    plan: userPlan,
  });

  // Create session
  const token = generateToken(user.id);
  store.createSession(user.id, token);

  const response = NextResponse.json({
    message: "Registration successful",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
    },
  }, { status: 201 });

  response.cookies.set("vulnix_session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
  });

  return response;
}
