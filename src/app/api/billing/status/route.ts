/**
 * GET /api/billing/status - Get billing/subscription status
 * 
 * VULNERABILITY: Sensitive Data Exposure
 * When vulnerable, returns internal billing data including credit amounts
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logRequest(req);

  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const plans: Record<string, any> = {
    free: { name: "Free", price: 0, maxProjects: 3, maxTeamMembers: 1, features: ["Basic projects", "1 team member"] },
    pro: { name: "Pro", price: 29, maxProjects: 50, maxTeamMembers: 10, features: ["Unlimited projects", "10 team members", "Priority support", "Advanced analytics"] },
    enterprise: { name: "Enterprise", price: 99, maxProjects: -1, maxTeamMembers: -1, features: ["Unlimited everything", "Custom integrations", "Dedicated support", "SSO"] },
  };

  const response: any = {
    plan: user.plan,
    planDetails: plans[user.plan],
    credits: user.credits,
  };

  // VULNERABILITY: Sensitive Data Exposure
  // When vulnerable, expose internal billing data and promo codes
  if (isVulnerable("sensitiveDataExposure")) {
    response._internal = {
      allPlans: plans,
      promoCodes: store.promoCodes, // VULN: Leaks valid promo codes
      userId: user.id,
      rawUser: user, // VULN: Includes password
    };
  }

  return NextResponse.json(response);
}
