import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ensureCommunitySchema } from "@/lib/community";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  await ensureCommunitySchema();
  const result = await pool.query(
    `select c.id, c.content, c.status, c.created_at as "createdAt", c.updated_at as "updatedAt",
            u.username, u.email, p.id as "projectId", p.project_name as "projectName", p.slug
     from qindex_comments c
     join qindex_users u on u.id=c.user_id
     join projects p on p.id=c.project_id
     order by case when c.status='pending' then 0 else 1 end, c.created_at desc`
  );
  return NextResponse.json({ comments: result.rows });
}