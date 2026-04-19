/**
 * POST /api/billing/subscribe - Change subscription plan or apply promo code
 * 
 * VULNERABILITIES:
 * - Subscription Bypass: Free users can upgrade without payment when enabled
 * - Duplicate Actions: Promo codes can be reused when enabled
 * - Mass Assignment: Can directly set plan/credits when enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { isVulnerable } from "@/lib/config";
import { logRequest } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = getCurrentUser();
  logRequest(req, body, user?.id);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Handle promo code redemption
  if (body.promoCode) {
    const promo = store.getPromoCode(body.promoCode);
    if (!promo) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }

    // VULNERABILITY: Duplicate Actions
    // When secure, check if user already used this promo code
    if (!isVulnerable("duplicateActions")) {
      if (promo.usedBy.includes(user.id)) {
        return NextResponse.json({ error: "Promo code already used" }, { status: 400 });
      }
    }
    // VULN: When insecure, same promo can be applied unlimited times for free credits

    store.markPromoUsed(body.promoCode, user.id);
    const newCredits = user.credits + promo.credits;
    store.updateUser(user.id, { credits: newCredits });

    return NextResponse.json({
      message: `Applied promo code! +${promo.credits} credits`,
      credits: newCredits,
    });
  }

  // Handle plan change
  if (body.plan) {
    // VULNERABILITY: Subscription Bypass
    // When secure, require valid payment info for upgrades
    if (!isVulnerable("subscriptionBypass")) {
      if (body.plan !== "free" && !body.paymentToken) {
        return NextResponse.json(
          { error: "Payment information required for upgrade" },
          { status: 402 }
        );
      }
    }
    // VULN: When insecure, just accept the plan change directly

    const validPlans = ["free", "pro", "enterprise"];
    if (!validPlans.includes(body.plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    store.updateUser(user.id, { plan: body.plan });
    return NextResponse.json({
      message: `Plan changed to ${body.plan}`,
      plan: body.plan,
    });
  }

  return NextResponse.json({ error: "Specify plan or promoCode" }, { status: 400 });
}
