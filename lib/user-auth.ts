import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import { ensureCommunitySchema } from "@/lib/community";

const COOKIE = "qindex_session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function getCurrentUser() {
  await ensureCommunitySchema();
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const result = await pool.query(
    `select u.id, u.username, u.email
     from qindex_user_sessions s
     join qindex_users u on u.id=s.user_id
     where s.token_hash=$1 and s.expires_at > now()`,
    [hashToken(token)]
  );
  return result.rows[0] ?? null;
}

export async function createUserSession(userId: string) {
  await ensureCommunitySchema();
  const token = randomBytes(32).toString("hex");
  await pool.query(
    `insert into qindex_user_sessions(user_id,token_hash,expires_at)
     values($1,$2,now()+interval '30 days')`,
    [userId, hashToken(token)]
  );
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function clearUserSession() {
  await ensureCommunitySchema();
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await pool.query("delete from qindex_user_sessions where token_hash=$1", [hashToken(token)]);
  store.delete(COOKIE);
}