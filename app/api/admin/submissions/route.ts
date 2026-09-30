import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const result = await pool.query(
    `select id, project_name as "projectName", url, category, description, github_url as "githubUrl",
      status, verification_status as "verificationStatus", final_url as "finalUrl", http_status as "httpStatus",
      response_time_ms as "responseTimeMs", hosting, review_note as "reviewNote", created_at as "createdAt", reviewed_at as "reviewedAt"
     from submissions order by case when status='pending' then 0 else 1 end, created_at desc`
  );
  return NextResponse.json({ submissions: result.rows });
}
