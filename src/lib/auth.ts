/**
 * VULNIX - Authentication Helpers
 * 
 * Contains intentionally flawed authentication logic for pentesting practice.
 */

import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { store, User } from "./store";
import { isVulnerable } from "./config";

/**
 * Generate a session token.
 * 
 * VULNERABILITY: Predictable Tokens
 * When vulnerable: Token is "user-{id}-{timestamp}" — easily guessable
 * When secure: Uses UUID v4 (cryptographically random)
 */
export function generateToken(userId: number): string {
  if (isVulnerable("predictableTokens")) {
    // VULN: Predictable token pattern — attacker can guess other users' tokens
    return `user-${userId}-${Date.now()}`;
  }
  return uuidv4();
}

/**
 * Validate password strength.
 * 
 * VULNERABILITY: Weak Passwords
 * When vulnerable: Any non-empty string accepted
 * When secure: Minimum 8 chars, requires uppercase, lowercase, number
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (isVulnerable("weakPasswords")) {
    // VULN: No password requirements — trivial passwords accepted
    if (password.length > 0) {
      return { valid: true, message: "OK" };
    }
    return { valid: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain an uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain a lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain a number" };
  }
  return { valid: true, message: "OK" };
}

/**
 * Get the currently authenticated user from the session cookie.
 * Returns null if not authenticated.
 */
export function getCurrentUser(): User | null {
  const cookieStore = cookies();
  const token = cookieStore.get("vulnix_session")?.value;
  if (!token) return null;

  const session = store.getSession(token);
  if (!session) return null;

  const user = store.getUser(session.userId);
  return user || null;
}

/**
 * Require authentication — returns user or throws.
 */
export function requireAuth(): User {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Check if user is admin.
 * 
 * VULNERABILITY: Weak Admin Protection
 * When vulnerable: Also checks query param ?admin=true
 * When secure: Only checks user.role === "admin"
 */
export function isAdmin(user: User | null, searchParams?: URLSearchParams): boolean {
  if (isVulnerable("weakAdminProtection")) {
    // VULN: Admin access via query parameter — anyone can add ?admin=true
    if (searchParams?.get("admin") === "true") {
      return true;
    }
  }
  return user?.role === "admin";
}

/**
 * Sanitize user object for API response.
 * 
 * VULNERABILITY: Sensitive Data Exposure
 * When vulnerable: Returns full user object including password
 * When secure: Strips password and sensitive fields
 */
export function sanitizeUser(user: User): Partial<User> {
  if (isVulnerable("sensitiveDataExposure")) {
    // VULN: Returns password and all internal fields
    return { ...user };
  }
  const { password, ...safe } = user;
  return safe;
}
