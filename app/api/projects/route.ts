import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await pool.query(
    `select id, slug, project_name as "name", url, category, description, github_url as "githubUrl",
      verification_status as "verificationStatus", hosting, final_url as "finalUrl", created_at as "createdAt"
     from projects order by created_at desc`
  );
  return NextResponse.json({ projects: result.rows });
}
