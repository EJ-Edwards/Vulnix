/**
 * POST /api/fetch - Fetch a URL (SSRF simulation)
 * 
 * VULNERABILITY: SSRF Simulation (Safe)
 * When vulnerable, accepts any URL and returns mocked data simulating
 * what an actual SSRF vulnerability would expose.
 * When secure, only whitelisted domains are allowed.
 * 
 * This does NOT make real external requests — it returns simulated responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

const WHITELISTED_DOMAINS = ["api.github.com", "jsonplaceholder.typicode.com"];

// Simulated responses for common SSRF targets
const MOCK_RESPONSES: Record<string, any> = {
  "http://169.254.169.254/latest/meta-data": {
    status: 200,
    body: {
      "ami-id": "ami-0abcdef1234567890",
      "instance-id": "i-1234567890abcdef0",
      "instance-type": "t2.micro",
      "local-ipv4": "10.0.1.100",
      "public-ipv4": "203.0.113.25",
      "security-groups": "vulnix-prod-sg",
      "iam-role": "vulnix-admin-role",
      _warning: "SSRF SIMULATION — In a real app, this would expose cloud metadata",
    },
  },
  "http://169.254.169.254/latest/meta-data/iam/security-credentials": {
    status: 200,
    body: {
      role: "vulnix-admin-role",
      AccessKeyId: "AKIAIOSFODNN7EXAMPLE",
      SecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      Token: "FwoGZXIvYXdzE...(simulated)...",
      _warning: "SSRF SIMULATION — These are fake credentials for demo purposes",
    },
  },
  "http://localhost:3000/api/debug": {
    status: 200,
    body: {
      internalEndpoint: true,
      message: "Internal debug data accessed via SSRF",
      _warning: "SSRF SIMULATION — Internal endpoint reached",
    },
  },
  "http://127.0.0.1:6379": {
    status: 200,
    body: {
      service: "Redis",
      message: "SSRF SIMULATION — Redis instance reached on internal network",
      keys: ["session:admin", "cache:users", "queue:emails"],
    },
  },
};

function getMockResponse(url: string): any {
  // Check exact matches
  if (MOCK_RESPONSES[url]) {
    return MOCK_RESPONSES[url];
  }

  // Check prefix matches
  for (const [pattern, response] of Object.entries(MOCK_RESPONSES)) {
    if (url.startsWith(pattern)) {
      return response;
    }
  }

  // Default response for unknown URLs
  return {
    status: 200,
    body: {
      url,
      message: "Simulated fetch response",
      timestamp: new Date().toISOString(),
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = getCurrentUser();
  logRequest(req, body, user?.id);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { url } = body;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // VULNERABILITY: SSRF Simulation
  // When secure, only allow whitelisted domains
  if (!isVulnerable("ssrfSimulation")) {
    try {
      const parsed = new URL(url);
      if (!WHITELISTED_DOMAINS.includes(parsed.hostname)) {
        return NextResponse.json(
          { error: `Domain not allowed. Whitelisted: ${WHITELISTED_DOMAINS.join(", ")}` },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  }
  // VULN: When insecure, any URL is accepted (returns mocked data)

  const mockResponse = getMockResponse(url);
  return NextResponse.json({
    fetchedUrl: url,
    response: mockResponse,
  });
}
