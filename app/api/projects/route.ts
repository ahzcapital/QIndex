import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureProjectOrder() {
  await pool.query(`alter table projects add column if not exists sort_order integer`);
  await pool.query(`
    with ordered as (
      select id, row_number() over (order by created_at asc, id asc) - 1 as position
      from projects
      where sort_order is null
    )
    update projects p set sort_order = ordered.position
    from ordered where p.id = ordered.id
  `);
}

export async function GET() {
  await ensureProjectOrder();
  const result = await pool.query(
    `select id, slug, project_name as "name", url, category, description, github_url as "githubUrl",
      verification_status as "verificationStatus", hosting, final_url as "finalUrl", created_at as "createdAt"
     from projects order by sort_order asc, created_at asc, id asc`
  );
  return NextResponse.json({ projects: result.rows });
}
