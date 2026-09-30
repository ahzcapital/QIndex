"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";

export default function SubmitPage() {
  const [form, setForm] = useState({ url:"", projectName:"", category:"Other", description:"", githubUrl:"" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setResult(null);
    try {
      const r = await fetch("/api/submissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const d = await r.json(); if(!r.ok) throw new Error(d.message);
      setResult({ok:true,message:d.message}); setForm({url:"",projectName:"",category:"Other",description:"",githubUrl:""});
    } catch(e){setResult({ok:false,message:e instanceof Error?e.message:"Submission failed."})} finally{setLoading(false)}
  }
  return <main>
    <header className="nav shell"><Link href="/" className="brand">QINDEX<span>.</span></Link><nav><Link href="/">Explore</Link><a href="#how">How it works</a></nav></header>
    <section className="submit-page shell"><Link href="/" className="back">← Back to index</Link><div className="eyebrow">COMMUNITY SUBMISSION</div><h1>Suggest a project<br/><em>for the index.</em></h1><p className="lead">Submit a publicly accessible website or project. QIndex checks the URL, stores the submission securely, and places it in the review queue.</p>
    <form className="submission-form" onSubmit={submit}><div className="field"><label>PROJECT URL <span>*</span></label><input required type="url" value={form.url} onChange={e=>setForm({...form,url:e.target.value})} placeholder="https://your-project.qstorage.quilibrium.com"/><small>Use the public URL visitors can actually open.</small></div>
    <div className="form-grid"><div className="field"><label>PROJECT NAME</label><input value={form.projectName} onChange={e=>setForm({...form,projectName:e.target.value})} placeholder="Project name"/></div><div className="field"><label>CATEGORY</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["Other","Infrastructure","Tools","Developer","AI","Finance","Gaming","Research"].map(x=><option key={x}>{x}</option>)}</select></div></div>
    <div className="field"><label>DESCRIPTION</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What does this project do?" rows={5}/></div><div className="field"><label>GITHUB <span className="muted">(optional)</span></label><input value={form.githubUrl} onChange={e=>setForm({...form,githubUrl:e.target.value})} placeholder="https://github.com/..."/></div>
    <div className="verify-note"><span>✓</span><p><strong>Verification first.</strong> QIndex checks reachability and visible hosting signals. Every submission then waits for human review before publication.</p></div>
    <button className="button submit-button" disabled={loading}>{loading?"Checking & saving…":"Verify & submit →"}</button>
    {result&&<div className={result.ok?"result success":"result error"}><strong>{result.message}</strong>{result.ok&&<span>Your project is now waiting for review.</span>}</div>}</form></section>
    <section className="submit-band" id="how"><div className="shell split"><div><div className="eyebrow">WHAT HAPPENS NEXT</div><h2>Verify.<br/>Review.<br/>Publish.</h2></div><div><p>Your submission is saved to QIndex. The team reviews the technical verification and project information before publication.</p></div></div></section>
    <footer className="shell footer"><span>QINDEX © 2026</span><span>Independent ecosystem directory</span></footer></main>;
}