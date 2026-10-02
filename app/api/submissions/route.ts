import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { sendSubmissionEmail } from "@/lib/email";

export const runtime = "nodejs";

const categories = ["Other","Infrastructure","Tools","Developer","AI","Finance","Gaming","Research"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) return NextResponse.json({ message: "A project URL is required." }, { status: 400 });
    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { return NextResponse.json({ message: "Enter a valid project URL." }, { status: 400 }); }
    if (!["http:","https:"].includes(parsedUrl.protocol)) return NextResponse.json({ message: "Only HTTP and HTTPS URLs are supported." }, { status: 400 });
    const projectName = typeof body.projectName === "string" && body.projectName.trim() ? body.projectName.trim() : parsedUrl.hostname;
    const category = categories.includes(body.category) ? body.category : "Other";

    const verification = await fetch(new URL("/api/verify", new URL(request.url)).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      cache: "no-store",
    });
    const checked = await verification.json();
    if (!verification.ok) return NextResponse.json(checked, { status: verification.status });

    const normalizedUrl = checked.finalUrl || url;
    const existing = await pool.query(
      "select id, status from submissions where normalized_url = $1",
      [normalizedUrl]
    );

    if (existing.rowCount && existing.rows[0].status !== "rejected") {
      return NextResponse.json({ message: "This URL has already been submitted to QIndex." }, { status: 409 });
    }

    const submissionValues = [
      projectName, url, normalizedUrl, category,
      typeof body.description === "string" ? body.description.trim() : null,
      typeof body.githubUrl === "string" ? body.githubUrl.trim() : null,
      checked.verified ? "qstorage" : "reachable",
      checked.finalUrl || null, checked.status || null, checked.responseTimeMs || null, checked.hosting || null,
    ];

    const result = existing.rowCount
      ? await pool.query(
          `update submissions set
            project_name=$1,url=$2,normalized_url=$3,category=$4,description=$5,github_url=$6,
            status='pending',verification_status=$7,final_url=$8,http_status=$9,response_time_ms=$10,hosting=$11,
            review_note=null,reviewed_at=null
           where id=$12
           returning id, project_name, status, verification_status`,
          [...submissionValues, existing.rows[0].id]
        )
      : await pool.query(
          `insert into submissions
          (project_name,url,normalized_url,category,description,github_url,verification_status,final_url,http_status,response_time_ms,hosting)
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          returning id, project_name, status, verification_status`,
          submissionValues
        );

    const submission = result.rows[0];
    await sendSubmissionEmail({
      id: submission.id,
      projectName,
      url,
      category,
      description: body.description,
      verified: Boolean(checked.verified),
    });

    return NextResponse.json({ ok: true, submission, message: "Submitted successfully. Your project is now waiting for QIndex review." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "QIndex could not save this submission. Please try again later." }, { status: 500 });
  }
}
