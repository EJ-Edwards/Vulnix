# Vulnix - Quick Start Guide to Vulnerability Detection

## Getting Started

### 1. Start the Lab

```bash
# Install dependencies
npm install

# Development mode (vulnerabilities ENABLED by default)
npm run dev

# Secure mode (vulnerabilities DISABLED)
export VULNIX_SECURE_MODE=true
npm run dev
```

### 2. Enable Debug Endpoints

```bash
export DEBUG_MODE=true
npm run dev
```

Or with a debug token:
```bash
export DEBUG_TOKEN=mysecrettoken123
export DEBUG_MODE=true
npm run dev
```

---

## First Test - Check Lab Status

```bash
curl http://localhost:3000/api/debug/status
```

You'll see:
- Risk score (0-100)
- Security posture
- Enabled/disabled vulnerabilities
- Recent exploitation attempts

Example output:
```json
{
  "status": "Vulnix Vulnerability Lab",
  "riskAssessment": {
    "riskScore": 62,
    "posture": "Vulnerable"
  },
  "vulnerabilityStatus": {
    "total": 14,
    "enabled": 10,
    "disabled": 4
  }
}
```

---

## Test SQL Injection Detection

### 1. Trigger SQL Injection

```bash
curl "http://localhost:3000/api/search?q=%27%20OR%20%271%27%3D%271"
```

Or with special characters:
```bash
curl "http://localhost:3000/api/search?q='; DROP TABLE users; --"
```

### 2. Check Exploit Log

```bash
curl http://localhost:3000/api/debug/exploits?type=SQL_Injection
```

You'll see:
- Timestamp of attempt
- Payload sent
- Source IP
- Whether it was detected and blocked

### 3. Run Automated Tests

```bash
curl -X POST http://localhost:3000/api/debug/run-tests \
  -H "Content-Type: application/json"
```

---

## Test XSS Detection

### 1. Trigger XSS

```bash
# In query string
curl "http://localhost:3000/api/search?q=<script>alert('xss')</script>"

# Via POST
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "<img src=x onerror=alert(1)>"}'
```

### 2. Real-Time Threat Detection

```bash
curl -X POST http://localhost:3000/api/debug/detect \
  -H "Content-Type: application/json" \
  -d '{
    "input": "<img src=x onerror=alert(\"xss\")>",
    "testType": "xss"
  }'
```

Response:
```json
{
  "detection": {
    "threats": {
      "xss": true,
      "patterns": ["XSS detected"]
    },
    "severity": "critical",
    "recommendations": [
      "HTML-encode all user input",
      "Use Content Security Policy"
    ]
  }
}
```

---

## Test IDOR Detection

### 1. Register Two Users

```bash
# User 1
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "Password123",
    "name": "User One"
  }'

# User 2
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user2@example.com",
    "password": "Password456",
    "name": "User Two"
  }'
```

### 2. Login as User 1

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "Password123"
  }'

# Save the session token
```

### 3. Try IDOR Attack

```bash
# Try to access User 2's project (ID 2)
curl http://localhost:3000/api/projects/2 \
  -H "Cookie: vulnix_session=USER1_SESSION_TOKEN"
```

### 4. Check IDOR Detection

```bash
curl http://localhost:3000/api/debug/exploits?type=IDOR
```

You'll see:
- Unauthorized access attempt logged
- User IDs and resource IDs tracked
- Whether IDOR vulnerability allowed the access

---

## Test Brute Force Detection

### 1. Make Multiple Failed Login Attempts

```bash
# Attempt 1
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "wrong1"}'

# Attempt 2
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "wrong2"}'

# ... repeat 5+ times
```

### 2. Check Brute Force Detection

```bash
curl http://localhost:3000/api/debug/exploits?type=BruteForce
```

You'll see:
- Number of failed attempts
- IP address
- Email being targeted
- Whether exploit was successful

---

## View All Vulnerabilities

```bash
curl http://localhost:3000/api/debug/vulnerabilities
```

Shows:
- Which vulnerabilities are enabled
- How many times each was exploited
- Success rate per vulnerability
- Last exploitation timestamp

Example:
```json
{
  "statistics": {
    "totalVulnerabilities": 14,
    "enabledVulnerabilities": 10,
    "totalExploitAttempts": 47,
    "successfulExploits": 23
  },
  "vulnerabilityDetails": [
    {
      "name": "idor",
      "enabled": true,
      "attempts": 5,
      "successfulExploits": 3,
      "exploitRate": "60%"
    }
  ]
}
```

---

## View Exploitation Log

### Get All Exploits

```bash
curl http://localhost:3000/api/debug/exploits
```

### Filter by Vulnerability Type

```bash
curl http://localhost:3000/api/debug/exploits?type=SQL_Injection
```

### Get Only Successful Exploits

```bash
curl http://localhost:3000/api/debug/exploits?successful=true
```

### Limit Results

```bash
curl http://localhost:3000/api/debug/exploits?limit=5
```

---

## Console Output Examples

Watch the server console for real-time attack detection:

### SQL Injection Detected
```
🚨 SQL Injection attempt detected:
   param: search
   value: ' OR '1'='1
```

### XSS Detected
```
🚨 XSS attempt detected:
   param: bio
   payload: <script>alert('xss')</script>
```

### Brute Force Detected
```
⚠️  VULNERABILITY EXPLOITED: BruteForce on /api/auth/login
   Source IP: 192.168.1.100
   Details: { attempts: 6, window: "900s" }
```

### Successful Login
```
✅ Successful login: user@example.com from 192.168.1.100
```

---

## Enable/Disable Vulnerabilities

### Mode 1: Secure Mode (All Protections ON)

```bash
export VULNIX_SECURE_MODE=true
npm run dev
```

Then check status:
```bash
curl http://localhost:3000/api/debug/status
# Shows: posture: "Secure", all vulnerabilities disabled
```

### Mode 2: Vulnerable Mode (Default)

```bash
npm run dev
# All vulnerabilities enabled
```

### Mode 3: Custom Configuration

Edit `.env` file to selectively enable/disable:
```bash
VULNIX_SECURE_MODE=false
VULN_IDOR=false
VULN_NO_RATE_LIMIT=true
```

---

## Automated Test Suite

Run all vulnerability tests automatically:

```bash
curl -X POST http://localhost:3000/api/debug/run-tests \
  -H "Content-Type: application/json"
```

This will:
- Test 5 SQL injection payloads
- Test 5 XSS payloads
- Test 5 SSRF attempts
- Show detection and blockage rates
- Provide remediation recommendations

Example output:
```json
{
  "statistics": {
    "totalTests": 15,
    "detected": 15,
    "blocked": 0,
    "exploitable": 15,
    "detectionRate": "100%"
  },
  "summary": [
    {
      "category": "SQL_Injection",
      "total": 5,
      "detected": 5,
      "blocked": 0,
      "exploitable": 5
    }
  ]
}
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Check lab status | `curl http://localhost:3000/api/debug/status` |
| View vulnerabilities | `curl http://localhost:3000/api/debug/vulnerabilities` |
| View exploits log | `curl http://localhost:3000/api/debug/exploits` |
| Run tests | `curl -X POST http://localhost:3000/api/debug/run-tests` |
| Test SQL injection | `curl -X POST http://localhost:3000/api/debug/detect -d '{"input":"' OR '1'='1"}' -H "Content-Type: application/json"` |
| Test XSS | `curl -X POST http://localhost:3000/api/debug/detect -d '{"input":"<script>alert(1)</script>"}' -H "Content-Type: application/json"` |
| Enable secure mode | `export VULNIX_SECURE_MODE=true` |
| Enable debug mode | `export DEBUG_MODE=true` |

---

## Next Steps

1. **Explore Vulnerabilities** - Try different attack payloads
2. **Monitor Detection** - Watch console for real-time alerts
3. **Check Statistics** - View exploitation attempts and success rates
4. **Enable Protections** - Switch to secure mode and verify fixes
5. **Review Logs** - Analyze exploitation patterns
6. **Automate Tests** - Use run-tests endpoint for regression testing

---

## Documentation

- **Full API Reference**: [DEBUG_ENDPOINTS.md](./DEBUG_ENDPOINTS.md)
- **Vulnerability Details**: [VULNERABILITY_DETECTION.md](./VULNERABILITY_DETECTION.md)
- **Setup Guide**: [README.md](./README.md)

---

## Tips & Tricks

✅ **Best Practices:**
- Always check status first to understand current configuration
- Use `?limit=10` to reduce response sizes
- Monitor console output for real-time detection
- Test with both vulnerable and secure modes
- Use debug token to protect endpoints in production

⚠️ **Common Issues:**
- Debug endpoints return 403? Enable DEBUG_MODE=true
- Not seeing exploits? Check that vulnerability is enabled
- Getting false positives? Review specific payload patterns
- Console logs not showing? Verify DEBUG_MODE=true

---

Have fun exploring vulnerabilities! Remember: **This is a learning lab - never test on production systems without authorization.**
