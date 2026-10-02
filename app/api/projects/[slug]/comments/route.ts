import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ensureCommunitySchema } from "@/lib/community";
import { getCurrentUser } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  await ensureCommunitySchema();
  const { slug } = await params;
  const result = await pool.query(
    `select c.id, c.content, c.created_at as "createdAt", u.username
     from qindex_comments c
     join qindex_users u on u.id=c.user_id
     join projects p on p.id=c.project_id
     where p.slug=$1 and c.status='published'
     order by c.created_at asc`,
    [slug]
  );
  return NextResponse.json({ comments: result.rows });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  await ensureCommunitySchema();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to join the discussion." }, { status: 401 });

  const { slug } = await params;
  const project = await pool.query("select id from projects where slug=$1", [slug]);
  if (!project.rowCount) return NextResponse.json({ message: "Project not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content.length < 2) return NextResponse.json({ message: "Comment is too short." }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ message: "Comments are limited to 2,000 characters." }, { status: 400 });

  const recent = await pool.query(
    `select count(*)::int as count from qindex_comments
     where user_id=$1 and created_at > now()-interval '10 minutes' and status <> 'deleted'`,
    [user.id]
  );
  if (recent.rows[0].count >= 5)
    return NextResponse.json({ message: "Please wait before posting more comments." }, { status: 429 });

  const duplicate = await pool.query(
    `select 1 from qindex_comments where user_id=$1 and project_id=$2 and content=$3 and created_at > now()-interval '1 hour' limit 1`,
    [user.id, project.rows[0].id, content]
  );
  if (duplicate.rowCount) return NextResponse.json({ message: "You already posted this comment recently." }, { status: 409 });

  const inserted = await pool.query(
    `insert into qindex_comments(project_id,user_id,content,status)
     values($1,$2,$3,'pending')
     returning id, content, created_at as "createdAt"`,
    [project.rows[0].id, user.id, content]
  );
  return NextResponse.json({ ok: true, comment: { ...inserted.rows[0], username:user.username }, message: "Your comment was submitted for review." }, { status: 201 });
}