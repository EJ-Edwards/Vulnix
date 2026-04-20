/**
 * VULNIX - Security Utilities & Vulnerability Detection
 * 
 * Comprehensive security framework for detecting and tracking:
 * - SQL Injection attempts
 * - XSS (Cross-Site Scripting) exploits
 * - CSRF (Cross-Site Request Forgery) violations
 * - SSRF (Server-Side Request Forgery) attempts
 * - IDOR (Insecure Direct Object References) exploitation
 * - Brute force and rate limit violations
 * - Unauthorized access attempts
 */

import { v4 as uuidv4 } from "uuid";

// ─── Vulnerability Exploitation Tracking ───────────────────────────────────

export interface ExploitAttempt {
  id: string;
  timestamp: string;
  vulnerabilityType: string;
  endpoint: string;
  method: string;
  sourceIp: string;
  payload?: string;
  severity: "low" | "medium" | "high" | "critical";
  successful: boolean;
  details: Record<string, any>;
}

export interface VulnerabilityStats {
  vulnerability: string;
  enabled: boolean;
  attempts: number;
  successfulExploits: number;
  lastAttempt?: string;
  severity: string;
}

// In-memory exploit tracker (use database in production)
const exploitLog: ExploitAttempt[] = [];
const vulnerabilityStats = new Map<string, { attempts: number; successful: number; lastAttempt: string }>();

/**
 * Log a vulnerability exploitation attempt.
 */
export function logExploit(
  vulnerabilityType: string,
  endpoint: string,
  method: string,
  sourceIp: string,
  successful: boolean = false,
  details: Record<string, any> = {},
  payload?: string
): ExploitAttempt {
  const exploit: ExploitAttempt = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    vulnerabilityType,
    endpoint,
    method,
    sourceIp,
    payload,
    severity: successful ? "high" : "medium",
    successful,
    details,
  };

  exploitLog.push(exploit);

  // Update stats
  const stats = vulnerabilityStats.get(vulnerabilityType) || { attempts: 0, successful: 0, lastAttempt: "" };
  stats.attempts++;
  if (successful) stats.successful++;
  stats.lastAttempt = exploit.timestamp;
  vulnerabilityStats.set(vulnerabilityType, stats);

  // Log to console for visibility
  if (successful) {
    console.warn(`⚠️  VULNERABILITY EXPLOITED: ${vulnerabilityType} on ${endpoint}`);
    console.warn(`   Source IP: ${sourceIp}, Details:`, details);
  }

  return exploit;
}

/**
 * Get all exploit attempts.
 */
export function getExploitLog(): ExploitAttempt[] {
  return exploitLog;
}

/**
 * Get exploit statistics for all vulnerabilities.
 */
export function getVulnerabilityStats(vulnerabilities: Record<string, boolean>): VulnerabilityStats[] {
  return Object.entries(vulnerabilities).map(([name, enabled]) => {
    const stats = vulnerabilityStats.get(name) || { attempts: 0, successful: 0, lastAttempt: "" };
    return {
      vulnerability: name,
      enabled,
      attempts: stats.attempts,
      successfulExploits: stats.successful,
      lastAttempt: stats.lastAttempt || undefined,
      severity: stats.successful > 0 ? "critical" : "medium",
    };
  });
}

/**
 * Clear exploit log (for reset/testing).
 */
export function clearExploitLog(): void {
  exploitLog.length = 0;
  vulnerabilityStats.clear();
}

// ─── SQL Injection Detection ────────────────────────────────────────────────

const sqlInjectionPatterns = [
  /(\bunion\b.*\bselect\b|\bor\b\s*1\s*=\s*1|;\s*drop\b|--\s|\/\*|\*\/|xp_|sp_|exec|execute)/gi,
  /('|("))\s*(or|and)\s*('|("))?[\s\S]*?=[\s\S]*?('|("))?/gi,
  /(\bor\b\s+[\w]+\s*=\s*[\w]+)|(\bor\b\s+1\s*=\s*1)/gi,
];

/**
 * Detect potential SQL injection attempt.
 */
export function detectSqlInjection(input: string): { detected: boolean; pattern: string } {
  if (typeof input !== "string") return { detected: false, pattern: "" };

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return { detected: true, pattern: pattern.source };
    }
  }

  return { detected: false, pattern: "" };
}

// ─── XSS Detection ──────────────────────────────────────────────────────────

const xssPatterns = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /javascript:/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<img[^>]*onerror/gi,
  /<svg[^>]*onload/gi,
];

/**
 * Detect potential XSS attack payload.
 */
export function detectXss(input: string): { detected: boolean; type: string; payload: string } {
  if (typeof input !== "string") return { detected: false, type: "", payload: "" };

  for (const pattern of xssPatterns) {
    const match = input.match(pattern);
    if (match) {
      return { detected: true, type: pattern.source, payload: match[0] };
    }
  }

  return { detected: false, type: "", payload: "" };
}

// ─── IDOR Detection ──────────────────────────────────────────────────────────

/**
 * Detect potential IDOR exploitation attempt.
 * Logs when user tries to access resource they don't own.
 */
export function detectIdorAttempt(
  resourceOwnerId: number,
  requestingUserId: number | null,
  resourceType: string,
  resourceId: number
): boolean {
  if (!requestingUserId) return false;

  const isIdorAttempt = resourceOwnerId !== requestingUserId;

  if (isIdorAttempt) {
    logExploit(
      "IDOR",
      `/api/${resourceType}/${resourceId}`,
      "GET/PUT/DELETE",
      "unknown",
      true,
      {
        requestingUserId,
        resourceOwnerId,
        resourceType,
        resourceId,
      }
    );
  }

  return isIdorAttempt;
}

// ─── CSRF Detection ──────────────────────────────────────────────────────────

/**
 * Detect potential CSRF attack (missing or invalid token).
 */
export function detectCsrfAttempt(
  method: string,
  tokenPresent: boolean,
  tokenValid: boolean,
  sourceIp: string
): boolean {
  // CSRF attacks typically use POST, PUT, DELETE without valid tokens
  const isMutationMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase());

  if (isMutationMethod && (!tokenPresent || !tokenValid)) {
    const isCsrfAttempt = true;
    logExploit(
      "CSRF",
      "unknown",
      method,
      sourceIp,
      isCsrfAttempt,
      {
        tokenPresent,
        tokenValid,
        method,
      }
    );
    return true;
  }

  return false;
}

// ─── SSRF Detection ────────────────────────────────────────────────────────

const ssrfBlockedHosts = [
  "localhost",
  "127.0.0.1",
  "169.254.169.254", // AWS metadata
  "0.0.0.0",
];

/**
 * Detect potential SSRF (Server-Side Request Forgery) attempt.
 */
export function detectSsrfAttempt(urlString: string, sourceIp: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Check against blocked hosts
    const isBlocked = ssrfBlockedHosts.some((host) => hostname.includes(host)) ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.");

    if (isBlocked) {
      logExploit("SSRF", url.pathname, "FETCH", sourceIp, true, { url: urlString, hostname });
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

// ─── Brute Force Detection ──────────────────────────────────────────────────

const bruteForceAttempts = new Map<string, { count: number; firstAttempt: number; attempts: string[] }>();

/**
 * Detect potential brute force attack.
 */
export function detectBruteForce(
  identifier: string, // email, IP, or combination
  endpoint: string,
  sourceIp: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { detected: boolean; attempts: number; allowed: boolean } {
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  let record = bruteForceAttempts.get(key);

  if (!record || now - record.firstAttempt > windowMs) {
    // New window
    record = { count: 1, firstAttempt: now, attempts: [] };
    bruteForceAttempts.set(key, record);
    return { detected: false, attempts: 1, allowed: true };
  }

  record.count++;
  record.attempts.push(now.toString());

  if (record.count > maxAttempts) {
    logExploit("BruteForce", endpoint, "POST", sourceIp, true, {
      identifier,
      attempts: record.count,
      window: `${windowMs / 1000}s`,
    });
    return { detected: true, attempts: record.count, allowed: false };
  }

  return { detected: false, attempts: record.count, allowed: true };
}

// ─── Mass Assignment Detection ──────────────────────────────────────────────

/**
 * Detect potential mass assignment vulnerability exploit.
 */
export function detectMassAssignment(
  input: Record<string, any>,
  allowedFields: string[],
  sourceIp: string
): { detected: boolean; suspiciousFields: string[] } {
  const suspiciousFields = Object.keys(input).filter((key) => !allowedFields.includes(key));

  if (suspiciousFields.length > 0) {
    logExploit(
      "MassAssignment",
      "unknown",
      "POST/PUT",
      sourceIp,
      true,
      {
        attemptedFields: suspiciousFields,
        allowedFields,
      }
    );
    return { detected: true, suspiciousFields };
  }

  return { detected: false, suspiciousFields: [] };
}

// ─── Authentication Bypass Detection ────────────────────────────────────────

/**
 * Detect potential authentication bypass attempts.
 */
export function detectAuthBypass(
  endpoint: string,
  userAuthenticated: boolean,
  requiredAuth: boolean,
  sourceIp: string
): boolean {
  if (requiredAuth && !userAuthenticated) {
    logExploit("AuthenticationBypass", endpoint, "GET", sourceIp, true, {
      requiresAuth: requiredAuth,
      userAuthenticated,
    });
    return true;
  }

  return false;
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit and detect if exceeded.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// ─── Request Fingerprinting ────────────────────────────────────────────────

export interface RequestFingerprint {
  ip: string;
  userAgent: string;
  method: string;
  endpoint: string;
  timestamp: string;
  suspiciousPatterns: string[];
}

/**
 * Create fingerprint of request for anomaly detection.
 */
export function fingerprintRequest(
  ip: string,
  userAgent: string,
  method: string,
  endpoint: string
): RequestFingerprint {
  const suspiciousPatterns: string[] = [];

  // Detect suspicious user agents
  if (userAgent.includes("sqlmap") || userAgent.includes("nikto") || userAgent.includes("curl")) {
    suspiciousPatterns.push("SecurityScanner");
  }

  // Detect suspicious endpoints
  if (endpoint.includes("../") || endpoint.includes("..\\")) {
    suspiciousPatterns.push("PathTraversal");
  }

  return {
    ip,
    userAgent,
    method,
    endpoint,
    timestamp: new Date().toISOString(),
    suspiciousPatterns,
  };
}

// ─── Input Validation Helpers ──────────────────────────────────────────────

/**
 * Validate email format and detect injection patterns.
 */
export function validateEmail(email: string): { valid: boolean; injection: boolean } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid = emailRegex.test(email) && email.length <= 254;

  const injection = detectSqlInjection(email).detected || detectXss(email).detected;

  return { valid, injection };
}

/**
 * Sanitize and encode HTML to prevent XSS.
 */
export function encodeHtml(text: string): string {
  if (typeof text !== "string") return "";

  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Generate CSRF token.
 */
export function generateCsrfToken(): string {
  return uuidv4();
}

// ─── Response Headers for Security ─────────────────────────────────────────

/**
 * Get security headers to prevent attacks.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}
