"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function SubmitPage() {
  const [form, setForm] = useState({ url:"", projectName:"", category:"Other", description:"", githubUrl:"" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/submissions", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(form)
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.message);
      setResult({ok:true,message:d.message});
      setForm({url:"",projectName:"",category:"Other",description:"",githubUrl:""});
    } catch(e) {
      setResult({ok:false,message:e instanceof Error?e.message:"Submission failed."});
    } finally {
      setLoading(false);
    }
  }

  return <main className="site-stage">
    <div className="ambient ambient-a" /><div className="grain" />
    <header className="nav shell">
      <Link href="/" className="brand-mark"><span className="brand-symbol">Q</span><span>QINDEX</span></Link>
      <nav className="nav-links"><Link href="/#index">Index</Link><Link href="/#signal">Method</Link></nav>
      <div className="nav-state"><i /> SUBMISSION CHANNEL</div>
    </header>

    <section className="submit-page shell">
      <Link href="/" className="back">← Return to index</Link>
      <div className="eyebrow">PUBLIC SUBMISSION / 03</div>
      <h1>Put a project<br /><em>on the map.</em></h1>
      <p className="lead">Submit a publicly accessible website, application, tool or experiment. QIndex observes the URL first, then places the record into a human review queue.</p>

      <form className="submission-form" onSubmit={submit}>
        <div className="field"><label>PROJECT URL <span>*</span></label><input required type="url" value={form.url} onChange={e=>setForm({...form,url:e.target.value})} placeholder="https://your-project.qstorage.quilibrium.com"/><small>Use the public URL visitors can open without authentication.</small></div>
        <div className="form-grid">
          <div className="field"><label>PROJECT NAME</label><input value={form.projectName} onChange={e=>setForm({...form,projectName:e.target.value})} placeholder="Project name"/></div>
          <div className="field"><label>CATEGORY</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["Other","Infrastructure","Tools","Developer","AI","Finance","Gaming","Research"].map(x=><option key={x}>{x}</option>)}</select></div>
        </div>
        <div className="field"><label>DESCRIPTION</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What exists here? What does it do?" rows={5}/></div>
        <div className="field"><label>GITHUB <span className="muted">(OPTIONAL)</span></label><input value={form.githubUrl} onChange={e=>setForm({...form,githubUrl:e.target.value})} placeholder="https://github.com/..."/></div>
        <div className="verify-note"><span>+</span><p><strong>Observation first.</strong> The URL is checked for reachability and visible hosting signals. Publication is never automatic: every record enters the review queue.</p></div>
        <button className="submit-button" disabled={loading}>{loading?"CHECKING / SAVING…":"VERIFY + SUBMIT  →"}</button>
        {result&&<div className={result.ok?"result success":"result error"}><strong>{result.message}</strong>{result.ok&&<span>Awaiting review.</span>}</div>}
      </form>
    </section>

    <footer className="shell footer"><span>QINDEX / 2026</span><span>PUBLIC SUBMISSION CHANNEL</span><span>Q / END</span></footer>
  </main>;
}
