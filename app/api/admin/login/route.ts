import { NextResponse } from "next/server";
import { setAdminCookie, isAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (typeof password !== "string" || !isAdminPassword(password)) {
    return NextResponse.json({ message: "Invalid admin password." }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
