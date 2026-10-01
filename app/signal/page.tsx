import Link from "next/link";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SignalPage() {
  const r = await pool.query(`select count(*)::int as total, count(*) filter (where verification_status='qstorage')::int as qstorage from projects`);
  const stats = r.rows[0] || { total: 0, qstorage: 0 };

  return <main className="site-stage">
    <div className="ambient ambient-a"/><div className="ambient ambient-b"/><div className="grain"/>
    <header className="nav shell">
      <Link href="/" className="brand-mark"><span className="brand-symbol">Q</span><span>QINDEX</span></Link>
      <nav className="nav-links"><Link href="/#index">Explore</Link><Link href="/#categories">Categories</Link><Link href="/signal">Signal</Link><Link href="/submit">Submit</Link></nav>
      <span className="nav-state"><i className="ping-dot"/> OBSERVATORY</span>
    </header>

    <section className="signal-page shell fade-up">
      <Link href="/" className="back">← Back to QIndex</Link>
      <div className="eyebrow">QINDEX / SIGNAL</div>
      <h1>What we can observe,<br/><span className="grad-text">and what we cannot.</span></h1>
      <p className="lead">QIndex is a public directory built from observable web endpoints and human review. Technical signals describe an endpoint; they do not establish ownership, quality or endorsement.</p>

      <div className="stats" style={{marginBottom:80}}>
        <div><strong>{stats.total.toLocaleString()}</strong><span>INDEXED RECORDS</span></div>
        <div><strong>{stats.qstorage.toLocaleString()}</strong><span>QSTORAGE SIGNALS</span></div>
        <div><strong>03</strong><span>REVIEW STAGES</span></div>
        <div><strong>01</strong><span>PUBLIC INDEX</span></div>
      </div>

      <div className="signal-table">
        <div className="signal-row"><span>01</span><strong>CHECK</strong><p>QIndex requests the submitted URL and records whether it can be reached, where it redirects, and technical hosting signals visible from the response.</p></div>
        <div className="signal-row"><span>02</span><strong>REVIEW</strong><p>A human reviews the project context and publicly available information before a submission can become a published record.</p></div>
        <div className="signal-row"><span>03</span><strong>INDEX</strong><p>Approved records become discoverable through the public directory. The index records what was observed at the time of review.</p></div>
        <div className="signal-row"><span>04</span><strong>QSTORAGE SIGNAL</strong><p>A QStorage signal means the endpoint presents a hostname or technical characteristic associated with QStorage. It is a technical observation, not a statement about ownership.</p></div>
      </div>

      <p className="signal-note">The index is intentionally conservative: when a fact cannot be established from the available public information, QIndex should leave it unknown rather than manufacture certainty.</p>
    </section>
    <footer className="shell footer"><span>QINDEX / 2026</span><span>OBSERVATION ≠ ENDORSEMENT</span><span>Q / END</span></footer>
  </main>;
}