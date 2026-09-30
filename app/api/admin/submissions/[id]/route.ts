import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const status = body.status;
  if (!["approved","rejected"].includes(status)) return NextResponse.json({ message: "Invalid status." }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("begin");
    const found = await client.query("select * from submissions where id=$1 for update", [id]);
    if (!found.rowCount) return NextResponse.json({ message: "Submission not found." }, { status: 404 });
    const s = found.rows[0];

    await client.query("update submissions set status=$1, review_note=$2, reviewed_at=now() where id=$3", [status, body.reviewNote || null, id]);

    if (status === "approved") {
      let slug = slugify(s.project_name);
      const collision = await client.query("select id from projects where slug=$1 and submission_id<>$2", [slug, id]);
      if (collision.rowCount) slug = slug + "-" + id.slice(0, 6);
      await client.query(
        `insert into projects
        (submission_id,slug,project_name,url,category,description,github_url,verification_status,final_url,http_status,response_time_ms,hosting)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        on conflict (submission_id) do update set
          project_name=excluded.project_name,url=excluded.url,category=excluded.category,description=excluded.description,
          github_url=excluded.github_url,verification_status=excluded.verification_status,final_url=excluded.final_url,
          http_status=excluded.http_status,response_time_ms=excluded.response_time_ms,hosting=excluded.hosting,updated_at=now()`,
        [id,slug,s.project_name,s.url,s.category,s.description,s.github_url,s.verification_status,s.final_url,s.http_status,s.response_time_ms,s.hosting]
      );
    } else {
      await client.query("delete from projects where submission_id=$1", [id]);
    }
    await client.query("commit");
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    await client.query("rollback");
    console.error(error);
    return NextResponse.json({ message: "Could not update submission." }, { status: 500 });
  } finally { client.release(); }
}
