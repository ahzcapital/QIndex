import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ensureCommunitySchema } from "@/lib/community";
import { createUserSession, verifyPassword } from "@/lib/user-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await ensureCommunitySchema();
  const body = await request.json().catch(() => ({}));
  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier || !password) return NextResponse.json({ message: "Username and password are required." }, { status: 400 });

  const result = await pool.query(
    "select id,username,email,password_hash from qindex_users where lower(username)=lower($1) or lower(email)=lower($1) limit 1",
    [identifier]
  );
  const user = result.rows[0];
  if (!user || !verifyPassword(password, user.password_hash))
    return NextResponse.json({ message: "Invalid login details." }, { status: 401 });

  await createUserSession(user.id);
  return NextResponse.json({ ok: true, user: { id:user.id, username:user.username } });
}