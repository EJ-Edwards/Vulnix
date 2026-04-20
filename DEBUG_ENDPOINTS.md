# Vulnix Security Lab - Vulnerability Detection Guide

## Overview

Vulnix includes comprehensive vulnerability detection and tracking capabilities. Every endpoint monitors for exploitation attempts and logs successful attacks.

## Debug Endpoints

All debug endpoints are available at `/api/debug/*` and support optional authentication via `x-debug-token` header.

### 1. Status Dashboard
**Endpoint:** `GET /api/debug/status`

Get a comprehensive overview of the vulnerability lab's current state:
- Overall risk score (0-100)
- Security posture assessment (Secure → Critical)
- List of enabled/disabled vulnerabilities
- Recent exploitation activity
- Attack statistics

```bash
curl http://localhost:3000/api/debug/status
```

Response includes risk assessment, vulnerability status, and active exploitation attempts.

---

### 2. Vulnerability Configuration
**Endpoint:** `GET /api/debug/vulnerabilities`

Detailed status of all vulnerabilities:
- Which vulnerabilities are enabled/disabled
- Number of exploitation attempts per vulnerability
- Successful exploit count
- Severity levels
- Detailed statistics

```bash
curl http://localhost:3000/api/debug/vulnerabilities
```

---

### 3. Exploitation Log
**Endpoint:** `GET /api/debug/exploits`

Detailed log of all detected exploitation attempts with filtering:

```bash
# Get last 100 exploits
curl http://localhost:3000/api/debug/exploits

# Filter by vulnerability type
curl http://localhost:3000/api/debug/exploits?type=xss

# Get only successful exploits
curl http://localhost:3000/api/debug/exploits?successful=true

# Limit results
curl http://localhost:3000/api/debug/exploits?limit=10
```

Returns:
- Individual exploit details with timestamps
- Payload information
- Source IP
- Success/failure status
- Summary statistics by vulnerability type

---

### 4. Real-Time Threat Detection
**Endpoint:** `POST /api/debug/detect`

Test input strings against all known attack patterns in real-time:

```bash
curl -X POST http://localhost:3000/api/debug/detect \
  -H "Content-Type: application/json" \
  -d '{"input": "test<script>alert(1)</script>", "testType": "all"}'
```

Detects:
- **SQL Injection** patterns
- **XSS** payloads
- **SSRF** attempts

Response includes detected threats, severity, and remediation recommendations.

---

### 5. IDOR Vulnerability Testing
**Endpoint:** `POST /api/debug/test-idor`

Test and simulate IDOR (Insecure Direct Object Reference) attacks:

```bash
curl -X POST http://localhost:3000/api/debug/test-idor \
  -H "Content-Type: application/json" \
  -H "Cookie: vulnix_session=YOUR_SESSION_TOKEN" \
  -d '{"projectId": 2, "simulateExploit": true}'
```

Tests:
- Access control validation
- Authorization enforcement
- Logs IDOR exploitation attempts

---

## Vulnerability Categories

### 1. **IDOR** (Insecure Direct Object Reference)
- **Status:** Trackable via `/api/debug/test-idor`
- **Detection:** Logs when users access resources they don't own
- **Example:** User 1 accessing Project owned by User 2

### 2. **SQL Injection**
- **Status:** Detected in all inputs
- **Detection:** Pattern matching in query parameters and request bodies
- **Example:** `?search='; DROP TABLE users; --`

### 3. **XSS** (Cross-Site Scripting)
- **Reflected:** Detected in query strings
- **Stored:** Monitored in comments, bios, etc.
- **Detection:** Script tag, event handler, and payload patterns
- **Example:** `<img src=x onerror=alert('xss')>`

### 4. **CSRF** (Cross-Site Request Forgery)
- **Status:** Trackable via request fingerprinting
- **Detection:** Missing/invalid CSRF tokens on state-changing requests

### 5. **SSRF** (Server-Side Request Forgery)
- **Status:** Tested via `/api/debug/detect`
- **Detection:** Blocks requests to internal IPs (127.0.0.1, 192.168.*, etc.)
- **Example:** Attempting to access AWS metadata at 169.254.169.254

### 6. **Brute Force**
- **Status:** Tracked per email/IP
- **Detection:** 5+ login attempts in 15 minutes triggers alert
- **Logging:** Logs all failed login attempts

### 7. **Authentication Bypass**
- **Status:** Monitored on protected endpoints
- **Detection:** Unauthenticated access to restricted resources

---

## Real-Time Monitoring

### Console Logs
Attack detection is logged to the server console with visual indicators:

```
⚠️  Suspicious request detected:
   patterns: ['SecurityScanner'],
   endpoint: /api/projects/1?q=<script>alert('xss')</script>
   ip: 192.168.1.100

🚨 SQL Injection attempt detected:
   param: q
   value: ' OR '1'='1

🚨 XSS attempt detected:
   param: bio
   payload: <script>alert('xss')</script>

✅ Successful login: admin@vulnix.io from 192.168.1.100
```

---

## Setting Up Secure Mode

### Enable All Protections
```bash
export VULNIX_SECURE_MODE=true
npm run dev
```

### Individual Vulnerability Control
Edit `.env` to toggle individual vulnerabilities:

```bash
VULNIX_SECURE_MODE=false
VULN_IDOR=false           # Enable IDOR vulnerability
VULN_NO_RATE_LIMIT=false  # Disable rate limiting
```

---

## Debug Token Authentication

To protect debug endpoints in production, set a debug token:

```bash
export DEBUG_TOKEN=your-secret-token
export DEBUG_MODE=true
```

Then include the token in requests:

```bash
curl http://localhost:3000/api/debug/vulnerabilities \
  -H "x-debug-token: your-secret-token"
```

---

## Exploitation Detection Example

### 1. Attempt IDOR Attack
```bash
# User 1 tries to access User 2's project (ID 2)
curl http://localhost:3000/api/projects/2 \
  -H "Cookie: vulnix_session=USER1_SESSION"
```

### 2. Check Detection
```bash
curl http://localhost:3000/api/debug/exploits?type=IDOR
```

Response shows:
- Timestamp of attempt
- Source IP
- User ID attempting access
- Resource owner ID
- Whether vulnerability was exploitable

---

## Vulnerability Testing Workflow

1. **Check Status**
   ```bash
   curl http://localhost:3000/api/debug/status
   ```

2. **Identify Active Vulnerabilities**
   - Look for enabled vulnerabilities with successful exploits

3. **Test Exploits**
   ```bash
   curl http://localhost:3000/api/debug/detect \
     -X POST -H "Content-Type: application/json" \
     -d '{"input": "<img src=x onerror=alert(1)>", "testType": "xss"}'
   ```

4. **Review Exploitation Log**
   ```bash
   curl http://localhost:3000/api/debug/exploits
   ```

5. **Patch Vulnerabilities**
   - Verify fixes by checking `/api/debug/status` again

---

## Response Examples

### Status Response
```json
{
  "status": "Vulnix Vulnerability Lab",
  "riskAssessment": {
    "riskScore": 45,
    "posture": "Vulnerable",
    "assessment": "Multiple vulnerabilities detected and active"
  },
  "vulnerabilityStatus": {
    "total": 14,
    "enabled": 8,
    "disabled": 6
  },
  "activeVulnerabilities": [
    {
      "name": "idor",
      "attempts": 5,
      "successful": 3,
      "exploitRate": "60.0%"
    }
  ]
}
```

### Detection Response
```json
{
  "detection": {
    "input": "<script>alert('xss')</script>",
    "threats": {
      "sqlInjection": false,
      "xss": true,
      "ssrf": false,
      "patterns": ["XSS: /<script[^>]*>[\\s\\S]*?<\\/script>/gi - <script>alert('xss')</script>"]
    },
    "severity": "critical",
    "recommendations": [
      "HTML-encode all user input before rendering",
      "Use Content Security Policy (CSP) headers",
      "Implement output encoding"
    ]
  }
}
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VULNIX_SECURE_MODE` | `false` | Enable all security fixes |
| `DEBUG_MODE` | `false` | Enable debug endpoints |
| `DEBUG_TOKEN` | `undefined` | Require token for debug access |
| `NODE_ENV` | `development` | Environment mode |

---

## Best Practices for Testing

1. **Always check status first** before testing
2. **Use filtering** to focus on specific vulnerabilities
3. **Monitor console logs** for real-time detection
4. **Test with payloads** from `/api/debug/detect`
5. **Review exploitation log** to confirm detection
6. **Enable secure mode** to verify fixes
7. **Reset between tests** if needed

---

## Troubleshooting

**Q: Debug endpoints returning 403?**
- A: Set `DEBUG_MODE=true` or provide valid `x-debug-token` header

**Q: Not seeing exploit logs?**
- A: Check console output and verify vulnerability is enabled

**Q: Getting false positives on detection?**
- A: Adjust detection patterns or review specific payload

---

## Security Notes

- Debug endpoints expose vulnerability information - restrict in production
- Exploitation logs are in-memory - will reset on server restart
- Debug tokens should be rotated regularly
- Never expose debug endpoints on public internet

---

For more information, see the main [README.md](../README.md)
