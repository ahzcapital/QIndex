import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await pool.query(
    `select slug, project_name as "name", description, url, category, verification_status as "verificationStatus", hosting from projects where slug=$1`,
    [slug]
  );
  const p = r.rows[0];
  if (!p) notFound();

  const verified = p.verificationStatus === "qstorage";

  return <main className="site-stage">
    <div className="ambient ambient-a" /><div className="grain" />
    <header className="nav shell">
      <Link href="/" className="brand-mark"><span className="brand-symbol">Q</span><span>QINDEX</span></Link>
      <nav className="nav-links"><Link href="/#index">Index</Link><Link href="/submit">Submit</Link></nav>
      <div className="nav-state"><i /> RECORD / {p.category.toUpperCase()}</div>
    </header>

    <section className="project-hero shell">
      <Link href="/" className="back">← Return to index</Link>
      <div className="project-labels">{verified&&<span className="verified">QSTORAGE SIGNAL</span>}<span>PUBLIC RECORD</span><span>{p.category}</span></div>
      <h1>{p.name}</h1>
      <p>{p.description||"A publicly discoverable project recorded by QIndex."}</p>
      <a className="button" href={p.url} target="_blank" rel="noreferrer">OPEN PROJECT <span>↗</span></a>
    </section>

    <section className="shell project-layout">
      <div className="site-frame">
        <div className="frame-bar"><span>{p.url}</span><span>EXTERNAL / ↗</span></div>
        <div className="frame-placeholder"><span>PUBLIC PROJECT</span><strong>{p.name}</strong></div>
      </div>
      <aside className="details">
        <div className="detail-group"><label>STATE</label><strong className="status-line"><i/> INDEXED</strong></div>
        <div className="detail-group"><label>HOSTING SIGNAL</label><strong>{p.hosting||"NOT DETECTED"}</strong></div>
        <div className="detail-group"><label>OBSERVATION</label><strong>{verified?"QSTORAGE HOSTNAME":"REACHABILITY"}</strong></div>
        <div className="detail-group"><label>CATEGORY</label><strong>{p.category}</strong></div>
        <div className="detail-group"><label>PUBLIC URL</label><a href={p.url} target="_blank" rel="noreferrer">{p.url}</a></div>
      </aside>
    </section>

    <section className="shell claim-box">
      <div><div className="eyebrow">PROJECT OWNERS</div><h2>Is this record yours?</h2><p>Owner claiming is not enabled yet. Updates currently move through the public submission and review channel.</p></div>
      <Link href="/submit" className="button">SUGGEST AN UPDATE  ↗</Link>
    </section>
    <footer className="shell footer"><span>QINDEX / 2026</span><span>OBSERVATION ≠ OWNERSHIP</span><span>Q / END</span></footer>
  </main>;
}
