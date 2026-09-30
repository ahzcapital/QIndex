import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

function cleanSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") || "project";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const found = await client.query("select * from projects where id=$1 for update",[id]);
    if (!found.rowCount) return NextResponse.json({ message:"Project not found." },{status:404});
    const p=found.rows[0];
    const name=typeof body.projectName==="string" && body.projectName.trim()?body.projectName.trim():p.project_name;
    const url=typeof body.url==="string" && body.url.trim()?body.url.trim():p.url;
    try { new URL(url); } catch { return NextResponse.json({message:"Enter a valid project URL."},{status:400}); }
    let slug=typeof body.slug==="string" && body.slug.trim()?cleanSlug(body.slug):p.slug;
    const collision=await client.query("select id from projects where slug=$1 and id<>$2",[slug,id]);
    if(collision.rowCount) slug=slug+"-"+id.slice(0,6);
    await client.query(
      `update projects set slug=$1,project_name=$2,url=$3,category=$4,description=$5,github_url=$6,
       verification_status=$7,final_url=$8,http_status=$9,response_time_ms=$10,hosting=$11,updated_at=now()
       where id=$12`,
      [slug,name,url,body.category??p.category,body.description??p.description,body.githubUrl??p.github_url,
       body.verificationStatus??p.verification_status,body.finalUrl??p.final_url,body.httpStatus??p.http_status,
       body.responseTimeMs??p.response_time_ms,body.hosting??p.hosting,id]
    );
    if(p.submission_id){
      await client.query(
        `update submissions set project_name=$1,url=$2,normalized_url=$2,category=$3,description=$4,github_url=$5,
         verification_status=$6,final_url=$7,http_status=$8,response_time_ms=$9,hosting=$10,review_note=$11
         where id=$12`,
        [name,url,body.category??p.category,body.description??p.description,body.githubUrl??p.github_url,
         body.verificationStatus??p.verification_status,body.finalUrl??p.final_url,body.httpStatus??p.http_status,
         body.responseTimeMs??p.response_time_ms,body.hosting??p.hosting,"ADMIN_EDITED",p.submission_id]
      );
    }
    await client.query("commit");
    return NextResponse.json({ok:true});
  } catch(error) {
    await client.query("rollback");
    return NextResponse.json({message:"Could not update the project."},{status:500});
  } finally { client.release(); }
}
