import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

async function ensureProjectOrder(client = pool) {
  await client.query(`alter table projects add column if not exists sort_order integer`);
  await client.query(`
    with ordered as (
      select id, row_number() over (order by created_at asc, id asc) - 1 as position
      from projects where sort_order is null
    )
    update projects p set sort_order = ordered.position
    from ordered where p.id = ordered.id
  `);
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  await ensureProjectOrder();
  const result = await pool.query(
    `select id, slug, project_name as "projectName", url, category, description, github_url as "githubUrl",
      verification_status as "verificationStatus", final_url as "finalUrl", http_status as "httpStatus",
      response_time_ms as "responseTimeMs", hosting, sort_order as "sortOrder", created_at as "createdAt", updated_at as "updatedAt"
     from projects order by sort_order asc, created_at asc, id asc`
  );
  return NextResponse.json({ projects: result.rows });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const body = await request.json();
  const name = typeof body.projectName === "string" ? body.projectName.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!name || !url) return NextResponse.json({ message: "Project name and URL are required." }, { status: 400 });
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ message: "Enter a valid project URL." }, { status: 400 });
  }
  const slug = typeof body.slug === "string" && body.slug.trim()
    ? body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")
    : name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
  const client = await pool.connect();
  try {
    await client.query("begin");
    const submission = await client.query(
      `insert into submissions
       (project_name,url,normalized_url,category,description,github_url,status,verification_status,final_url,http_status,response_time_ms,hosting,review_note)
       values ($1,$2,$2,$3,$4,$5,'approved',$6,$7,$8,$9,$10,$11)
       returning id`,
      [name,url,body.category||"Other",body.description||null,body.githubUrl||null,body.verificationStatus||"unverified",body.finalUrl||url,body.httpStatus||null,body.responseTimeMs||null,body.hosting||null,"ADMIN_CREATED"]
    );
    const row = await client.query(
      `insert into projects
       (submission_id,slug,project_name,url,category,description,github_url,verification_status,final_url,http_status,response_time_ms,hosting,sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,coalesce((select max(sort_order)+1 from projects),0))
       returning id,slug,project_name as "projectName"`,
      [submission.rows[0].id,slug,name,url,body.category||"Other",body.description||null,body.githubUrl||null,body.verificationStatus||"unverified",body.finalUrl||url,body.httpStatus||null,body.responseTimeMs||null,body.hosting||null]
    );
    await client.query("commit");
    return NextResponse.json({ ok:true, project:row.rows[0] }, { status:201 });
  } catch (error) {
    await client.query("rollback");
    const message = error instanceof Error && /duplicate key|unique/i.test(error.message)
      ? "A project with this URL or slug already exists."
      : "Could not create the project.";
    return NextResponse.json({ message }, { status:500 });
  } finally {
    client.release();
  }
}
