import { createHash } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "qindex_admin";

function token() {
  const password = process.env.QINDEX_ADMIN_PASSWORD;
  if (!password) throw new Error("QINDEX_ADMIN_PASSWORD is not configured.");
  return createHash("sha256").update(password).digest("hex");
}

export function isAdminPassword(value: string) {
  const expected = token();
  return createHash("sha256").update(value).digest("hex") === expected;
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function requireAdmin() {
  const store = await cookies();
  return store.get(COOKIE)?.value === token();
}
