import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : [];
  if (!ids.length) return NextResponse.json({ message: "A project order is required." }, { status: 400 });
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("alter table projects add column if not exists sort_order integer");
    const existing = await client.query("select id from projects order by sort_order asc nulls last, created_at asc, id asc");
    const existingIds = existing.rows.map((row: { id: string }) => row.id);
    if (ids.length !== existingIds.length || ids.some((id: string) => !existingIds.includes(id))) {
      await client.query("rollback");
      return NextResponse.json({ message: "Project list changed. Reload the admin page and try again." }, { status: 409 });
    }
    for (let i = 0; i < ids.length; i++) await client.query("update projects set sort_order=$1, updated_at=now() where id=$2", [i, ids[i]]);
    await client.query("commit");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("rollback");
    console.error(error);
    return NextResponse.json({ message: "Could not save project order." }, { status: 500 });
  } finally { client.release(); }
}
