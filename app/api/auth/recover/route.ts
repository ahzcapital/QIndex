import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ensureCommunitySchema } from "@/lib/community";
import { createUserSession, hashPassword, verifyBackupKey } from "@/lib/user-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await ensureCommunitySchema();
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const backupKey = typeof body.backupKey === "string" ? body.backupKey.trim() : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username) || !backupKey || newPassword.length < 8 || newPassword.length > 128)
    return NextResponse.json({ message: "Enter your username, Backup Key and a new password." }, { status: 400 });

  const result = await pool.query(
    "select id,username,backup_key_hash from qindex_users where lower(username)=lower($1) limit 1",
    [username]
  );
  const user = result.rows[0];

  if (!user || !user.backup_key_hash || !verifyBackupKey(backupKey, user.backup_key_hash))
    return NextResponse.json({ message: "The username or Backup Key is not valid." }, { status: 401 });

  await pool.query("update qindex_users set password_hash=$1 where id=$2", [hashPassword(newPassword), user.id]);
  await pool.query("delete from qindex_user_sessions where user_id=$1", [user.id]);
  await createUserSession(user.id);

  return NextResponse.json({ ok:true, user:{id:user.id,username:user.username} });
}