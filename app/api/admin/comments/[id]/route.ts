import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ensureCommunitySchema } from "@/lib/community";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  await ensureCommunitySchema();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = body.status;
  if (!["published","rejected","deleted"].includes(status))
    return NextResponse.json({ message: "Invalid comment status." }, { status: 400 });

  const result = await pool.query(
    "update qindex_comments set status=$1,updated_at=now() where id=$2 returning id,status",
    [status,id]
  );
  if (!result.rowCount) return NextResponse.json({ message: "Comment not found." }, { status: 404 });
  return NextResponse.json({ ok:true, comment:result.rows[0] });
}