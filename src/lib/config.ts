/**
 * VULNIX - Vulnerability Configuration
 * 
 * Toggle vulnerabilities on/off for pentesting practice.
 * Set VULNIX_SECURE_MODE=true in environment to enable all fixes at once.
 * Individual toggles below override the global setting.
 */

export interface VulnixConfig {
  secureMode: boolean;
  vulnerabilities: {
    idor: boolean;                    // Broken access control - IDOR
    missingAuthChecks: boolean;       // Missing authorization on API routes
    weakAdminProtection: boolean;     // Admin panel weak logic
    weakPasswords: boolean;           // No password complexity requirements
    predictableTokens: boolean;       // Predictable session tokens
    noRateLimit: boolean;             // No rate limiting
    reflectedXss: boolean;            // Reflected XSS in search
    storedXss: boolean;               // Stored XSS in comments/bio
    subscriptionBypass: boolean;      // Business logic - bypass paywall
    duplicateActions: boolean;        // Business logic - duplicate credits
    sensitiveDataExposure: boolean;   // Debug endpoint, excessive API data
    massAssignment: boolean;          // User can set own role
    noInputValidation: boolean;       // No server-side input validation
    ssrfSimulation: boolean;          // SSRF-like URL fetch endpoint
  };
}

const secureMode = process.env.VULNIX_SECURE_MODE === "true";

const config: VulnixConfig = {
  secureMode,
  vulnerabilities: {
    // VULNERABILITY: IDOR - Insecure Direct Object Reference
    // When enabled: Users can access/modify other users' data by changing IDs
    // Exploit: GET /api/projects/2 while logged in as user 1
    // Fix: Verify resource ownership before returning data
    idor: !secureMode,

    // VULNERABILITY: Missing Authorization Checks
    // When enabled: Some API routes don't verify authentication
    // Exploit: Call API endpoints without a session token
    // Fix: Add auth middleware to all protected routes
    missingAuthChecks: !secureMode,

    // VULNERABILITY: Weak Admin Protection
    // When enabled: Admin panel accessible via ?admin=true or client-side check
    // Exploit: Add ?admin=true to URL or modify localStorage
    // Fix: Server-side role verification
    weakAdminProtection: !secureMode,

    // VULNERABILITY: Weak Password Requirements
    // When enabled: Any password accepted (even "1")
    // Exploit: Register with trivially guessable passwords
    // Fix: Enforce minimum length, complexity rules
    weakPasswords: !secureMode,

    // VULNERABILITY: Predictable Session Tokens
    // When enabled: Tokens are sequential/predictable (user-{id}-{timestamp})
    // Exploit: Guess other users' tokens based on pattern
    // Fix: Use cryptographically secure random tokens
    predictableTokens: !secureMode,

    // VULNERABILITY: No Rate Limiting
    // When enabled: Unlimited login attempts, API calls
    // Exploit: Brute-force passwords, spam endpoints
    // Fix: Implement rate limiting per IP/user
    noRateLimit: !secureMode,

    // VULNERABILITY: Reflected XSS
    // When enabled: Search query reflected in page without sanitization
    // Exploit: /search?q=<script>alert('xss')</script>
    // Fix: Sanitize and encode all user input before rendering
    reflectedXss: !secureMode,

    // VULNERABILITY: Stored XSS
    // When enabled: HTML/JS in comments and bios stored and rendered raw
    // Exploit: Post comment with <img src=x onerror=alert('xss')>
    // Fix: Sanitize input on storage and escape on render
    storedXss: !secureMode,

    // VULNERABILITY: Subscription/Paywall Bypass
    // When enabled: Premium features accessible without valid subscription
    // Exploit: Directly call premium API endpoints or manipulate plan field
    // Fix: Server-side subscription verification on every premium action
    subscriptionBypass: !secureMode,

    // VULNERABILITY: Duplicate Action Exploitation
    // When enabled: Can apply promo codes or credits multiple times
    // Exploit: POST /api/billing/subscribe with same promo code repeatedly
    // Fix: Track used promo codes, use idempotency keys
    duplicateActions: !secureMode,

    // VULNERABILITY: Sensitive Data Exposure
    // When enabled: Debug endpoint returns internal data, API returns passwords
    // Exploit: GET /api/debug returns all users with passwords and tokens
    // Fix: Remove debug endpoints, filter sensitive fields from responses
    sensitiveDataExposure: !secureMode,

    // VULNERABILITY: Mass Assignment
    // When enabled: User can set their own role by including role in request body
    // Exploit: PUT /api/users/1 with { "role": "admin" }
    // Fix: Whitelist allowed fields for update operations
    massAssignment: !secureMode,

    // VULNERABILITY: No Input Validation
    // When enabled: No server-side validation of request data
    // Exploit: Send malformed data, oversized payloads, wrong types
    // Fix: Validate all input with schema validation
    noInputValidation: !secureMode,

    // VULNERABILITY: SSRF Simulation (Safe)
    // When enabled: Endpoint fetches user-provided URLs (returns mocked data)
    // Exploit: Request internal URLs like http://169.254.169.254/metadata
    // Fix: Whitelist allowed domains, block internal IP ranges
    ssrfSimulation: !secureMode,
  },
};

export default config;

export function isVulnerable(vuln: keyof VulnixConfig["vulnerabilities"]): boolean {
  return config.vulnerabilities[vuln];
}
