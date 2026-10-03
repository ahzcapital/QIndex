import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ensureCommunitySchema } from "@/lib/community";
import { createUserSession, generateBackupKey, hashBackupKey, hashPassword } from "@/lib/user-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await ensureCommunitySchema();
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username))
    return NextResponse.json({ message: "Username must be 3–24 characters using letters, numbers or underscores." }, { status: 400 });
  if (password.length < 8 || password.length > 128)
    return NextResponse.json({ message: "Password must be 8–128 characters." }, { status: 400 });

  const existing = await pool.query(
    "select 1 from qindex_users where lower(username)=lower($1) limit 1",
    [username]
  );
  if (existing.rowCount) return NextResponse.json({ message: "That username is already registered." }, { status: 409 });

  const backupKey = generateBackupKey();
  const user = await pool.query(
    "insert into qindex_users(username,email,password_hash,backup_key_hash) values($1,null,$2,$3) returning id,username",
    [username, hashPassword(password), hashBackupKey(backupKey)]
  );

  await createUserSession(user.rows[0].id);
  return NextResponse.json({ ok: true, user: user.rows[0], backupKey }, { status: 201 });
}