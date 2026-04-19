/**
 * POST /api/auth/logout
 * 
 * Destroy the current session.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { logRequest } from "@/lib/logger";

export async function POST(req: NextRequest) {
  logRequest(req);

  const cookieStore = cookies();
  const token = cookieStore.get("vulnix_session")?.value;

  if (token) {
    store.deleteSession(token);
  }

  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set("vulnix_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
