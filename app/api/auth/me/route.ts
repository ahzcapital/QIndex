import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user: user ?? null });
}