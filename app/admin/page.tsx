"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Project={id:string;slug:string;projectName:string;url:string;category:string;description:string;githubUrl:string;verificationStatus:string;finalUrl:string;httpStatus:number|null;responseTimeMs:number|null;hosting:string;createdAt?:string;updatedAt?:string};
type Submission=Project & {status:string;reviewNote?:string;createdAt:string;reviewedAt?:string};

const categories=["Other","Infrastructure","Developer & Tools","AI","Finance","Social","Media & Journalism","Personal","Business"];

const blank={projectName:"",url:"",slug:"",category:"Other",description:"",githubUrl:"",verificationStatus:"unverified",finalUrl:"",httpStatus:"",responseTimeMs:"",hosting:""};

function normalizeProject(value: unknown): Project | null {
  if (!value || typeof value !== "object") return null;
  const p=value as Record<string,unknown>;
  if (typeof p.id !== "string" || typeof p.projectName !== "string" || typeof p.url !== "string") return null;
  return {
    id:p.id, slug:typeof p.slug==="string"?p.slug:"", projectName:p.projectName, url:p.url,
    category:typeof p.category==="string"?p.category:"Other",
    description:typeof p.description==="string"?p.description:"",
    githubUrl:typeof p.githubUrl==="string"?p.githubUrl:"",
    verificationStatus:typeof p.verificationStatus==="string"?p.verificationStatus:"unverified",
    finalUrl:typeof p.finalUrl==="string"?p.finalUrl:"",
    httpStatus:typeof p.httpStatus==="number"?p.httpStatus:null,
    responseTimeMs:typeof p.responseTimeMs==="number"?p.responseTimeMs:null,
    hosting:typeof p.hosting==="string"?p.hosting:"",
    createdAt:typeof p.createdAt==="string"?p.createdAt:undefined,
    updatedAt:typeof p.updatedAt==="string"?p.updatedAt:undefined
  };
}

function normalizeSubmission(value: unknown): Submission | null {
  const p=normalizeProject(value);
  if (!p || !value || typeof value!=="object") return null;
  const s=value as Record<string,unknown>;
  if (typeof s.status!=="string" || typeof s.createdAt!=="string") return null;
  return {...p,status:s.status,createdAt:s.createdAt,reviewNote:typeof s.reviewNote==="string"?s.reviewNote:undefined,reviewedAt:typeof s.reviewedAt==="string"?s.reviewedAt:undefined};
}

export default function AdminPage(){
  const [authed,setAuthed]=useState(false),[password,setPassword]=useState(""),[projects,setProjects]=useState<Project[]>([]),[submissions,setSubmissions]=useState<Submission[]>([]);
  const [tab,setTab]=useState("overview"),[selected,setSelected]=useState<Project|null>(null),[selectedSubmission,setSelectedSubmission]=useState<Submission|null>(null),[form,setForm]=useState<any>(blank),[adding,setAdding]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(""),[search,setSearch]=useState("");

  async function load(){
    try {
      const [pr,su]=await Promise.all([
        fetch("/api/admin/projects",{cache:"no-store"}),
        fetch("/api/admin/submissions",{cache:"no-store"})
      ]);
      const prData=await pr.json().catch(()=>({}));
      const suData=await su.json().catch(()=>({}));
      if(pr.ok && su.ok){
        setProjects(Array.isArray(prData.projects)?prData.projects.map((value: unknown)=>normalizeProject(value)).filter((p: Project | null): p is Project=>p!==null):[]);
        setSubmissions(Array.isArray(suData.submissions)?suData.submissions.map((value: unknown)=>normalizeSubmission(value)).filter((s: Submission | null): s is Submission=>s!==null):[]);
        setAuthed(true);
        setError("");
      } else {
        setAuthed(false);
        setError(prData.message||suData.message||"Admin session could not be loaded.");
      }
    } catch {
      setAuthed(false);
      setError("Could not connect to the QIndex admin API.");
    }
  }
  useEffect(()=>{ void load(); },[]);

  async function login(e:React.FormEvent){
    e.preventDefault();setError("");
    try {
      const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setError(d.message||"Login failed.");return}
      setPassword("");
      await load();
    } catch { setError("Could not connect to the admin login."); }
  }

  async function saveProject(e:React.FormEvent){
    e.preventDefault();setSaving(true);setError("");
    try {
      const endpoint=selected?"/api/admin/projects/"+selected.id:"/api/admin/projects";
      const r=await fetch(endpoint,{method:selected?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)setError(d.message||"Could not save.");else{setAdding(false);setSelected(null);setForm(blank);await load()}
    } catch { setError("Could not connect to the admin API."); }
    setSaving(false);
  }

  async function stateAction(id:string,action:string){
    if(action==="delete"&&!window.confirm("Delete this project from QIndex? The public record will disappear."))return;
    setSaving(true);setError("");
    try {
      const r=await fetch("/api/admin/projects/"+id,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
      const d=await r.json().catch(()=>({}));if(!r.ok)setError(d.message||"Action failed.");else await load();
    } catch { setError("Could not connect to the admin API."); }
    setSaving(false);
  }

  async function decide(id:string,status:"approved"|"rejected"){
    setSaving(true);setError("");
    try {
      const r=await fetch("/api/admin/submissions/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
      const d=await r.json().catch(()=>({}));if(!r.ok)setError(d.message||"Review failed.");else await load();
    } catch { setError("Could not connect to the admin API."); }
    setSaving(false);
  }

  const filtered=useMemo(()=>projects.filter(p=>[p.projectName,p.url,p.category,p.description,p.hosting].join(" ").toLowerCase().includes(search.toLowerCase())),[projects,search]);
  const pending=submissions.filter(s=>s.status==="pending");
  const rejected=submissions.filter(s=>s.status==="rejected");
  const qstorage=projects.filter(p=>p.verificationStatus==="qstorage").length;

  if(!authed)return <main><header className="nav shell"><Link href="/" className="brand-mark"><span className="brand-symbol">Q</span><span>QINDEX</span></Link></header><section className="admin-login shell"><div className="eyebrow">PRIVATE ADMIN</div><h1>QIndex<br/><em>Control room.</em></h1><form className="admin-login-form" onSubmit={login}><label>ADMIN PASSWORD</label><input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your admin password"/>{error&&<div className="result error">{error}</div>}<button className="button">Enter admin →</button></form></section></main>;

  function openEdit(p:Project){setSelected(p);setAdding(false);setForm({projectName:p.projectName,url:p.url,slug:p.slug,category:p.category,description:p.description||"",githubUrl:p.githubUrl||"",verificationStatus:p.verificationStatus||"unverified",finalUrl:p.finalUrl||"",httpStatus:p.httpStatus??"",responseTimeMs:p.responseTimeMs??"",hosting:p.hosting||""});setTab("projects");setSelectedSubmission(null)}

  return <main className="site-stage">
    <div className="ambient ambient-a"/><div className="grain"/>
    <header className="nav shell"><Link href="/" className="brand-mark"><span className="brand-symbol">Q</span><span>QINDEX</span></Link><nav className="nav-links"><Link href="/">Public index</Link><button className="text-button" onClick={async()=>{await fetch("/api/admin/logout",{method:"POST"});setAuthed(false)}}>Sign out</button></nav><span className="nav-state"><i/> ADMIN</span></header>

    <section className="admin shell">
      <div className="admin-head"><div><div className="eyebrow">QINDEX ADMIN / EDITORIAL CMS</div><h1>Control room.</h1><p>Curate the canonical public index. Users propose records; you decide what becomes public.</p></div><div className="admin-count"><strong>{projects.length}</strong><span>published records</span></div></div>

      <div className="admin-nav">{["overview","projects","submissions"].map(x=><button key={x} className={tab===x?"active":""} onClick={()=>{setTab(x);setSelected(null);setAdding(false)}}>{x.toUpperCase()}</button>)}<button className="admin-add" onClick={()=>{setTab("projects");setSelected(null);setAdding(true);setForm({...blank})}}>+ ADD PROJECT</button></div>

      {error&&<div className="result error admin-error">{error}</div>}

      {tab==="overview"&&<div className="admin-overview">
        <div className="admin-stat-grid"><div><strong>{projects.length}</strong><span>PUBLISHED</span></div><div><strong>{pending.length}</strong><span>PENDING</span></div><div><strong>{rejected.length}</strong><span>REJECTED / UNPUBLISHED</span></div><div><strong>{qstorage}</strong><span>QSTORAGE SIGNALS</span></div></div>
        <div className="admin-overview-grid"><div className="admin-panel"><div className="panel-title">RECENT SUBMISSIONS</div>{submissions.slice(0,8).map(s=><button className="admin-mini-row" key={s.id} onClick={()=>{setTab("submissions");setSelectedSubmission(s);setSelected(null)}}><span><strong>{s.projectName}</strong><small>{s.url}</small></span><em className={"admin-status "+s.status}>{s.status}</em></button>)}{!submissions.length&&<div className="admin-empty">No submissions yet.</div>}</div><div className="admin-panel"><div className="panel-title">RECENTLY PUBLISHED</div>{projects.slice(0,8).map(p=><button className="admin-mini-row" key={p.id} onClick={()=>openEdit(p)}><span><strong>{p.projectName}</strong><small>{p.category} · {p.url}</small></span><em>EDIT ↗</em></button>)}{!projects.length&&<div className="admin-empty">No published projects yet.</div>}</div></div>
      </div>}

      {tab==="projects"&&<div className="admin-projects">
        <div className="admin-toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects, URLs, categories…"/><span>{filtered.length} RECORDS</span></div>
        {adding||selected?<div className="admin-editor"><div className="panel-title">{adding?"ADD PROJECT":"EDIT PROJECT"} <button className="text-button" onClick={()=>{setAdding(false);setSelected(null)}}>CLOSE ×</button></div><form onSubmit={saveProject}><div className="admin-form-grid"><label>PROJECT NAME<input required value={form.projectName} onChange={e=>setForm({...form,projectName:e.target.value})}/></label><label>URL<input required type="url" value={form.url} onChange={e=>setForm({...form,url:e.target.value})}/></label><label>SLUG<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label><label>CATEGORY<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="wide">DESCRIPTION<textarea rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>GITHUB URL<input value={form.githubUrl} onChange={e=>setForm({...form,githubUrl:e.target.value})}/></label><label>HOSTING SIGNAL<input value={form.hosting} onChange={e=>setForm({...form,hosting:e.target.value})}/></label><label>VERIFICATION<select value={form.verificationStatus} onChange={e=>setForm({...form,verificationStatus:e.target.value})}><option>unverified</option><option>reachable</option><option>qstorage</option></select></label><label>FINAL URL<input value={form.finalUrl} onChange={e=>setForm({...form,finalUrl:e.target.value})}/></label><label>HTTP STATUS<input value={form.httpStatus} onChange={e=>setForm({...form,httpStatus:e.target.value})}/></label><label>RESPONSE TIME<input value={form.responseTimeMs} onChange={e=>setForm({...form,responseTimeMs:e.target.value})}/></label></div><div className="admin-actions"><button className="button" disabled={saving}>{saving?"SAVING…":adding?"CREATE & PUBLISH →":"SAVE CHANGES →"}</button>{selected&&<><button type="button" className="button secondary" disabled={saving} onClick={()=>stateAction(selected.id,"unpublish")}>UNPUBLISH</button><button type="button" className="button danger" disabled={saving} onClick={()=>stateAction(selected.id,"delete")}>DELETE</button></>}</div></form></div>:null}
        <div className="admin-project-table"><div className="admin-table-head"><span>PROJECT</span><span>CATEGORY</span><span>SIGNAL</span><span>ACTION</span></div>{filtered.map(p=><button key={p.id} className="admin-table-row" onClick={()=>openEdit(p)}><span><strong>{p.projectName}</strong><small>{p.url}</small></span><span>{p.category}</span><span>{p.verificationStatus==="qstorage"?"QSTORAGE":"REACHABLE"}</span><span>EDIT ↗</span></button>)}{!filtered.length&&<div className="admin-empty">No records match the current search.</div>}</div>
      </div>}

      {tab==="submissions"&&<div className="admin-submissions"><div className="admin-toolbar"><span>{pending.length} PENDING / {submissions.length} TOTAL</span></div><div className="admin-layout"><div className="submission-list">{submissions.map(s=><button key={s.id} className="submission-row" onClick={()=>{setSelectedSubmission(s);setSelected(null)}}><span><strong>{s.projectName}</strong><small>{s.url}</small></span><span className={"admin-status "+s.status}>{s.status}</span></button>)}{!submissions.length&&<div className="admin-empty">No submissions yet.</div>}</div><div className="submission-detail">{selectedSubmission?<><div className="eyebrow">{String(selectedSubmission.status).toUpperCase()} · {selectedSubmission.category}</div><h2>{selectedSubmission.projectName}</h2><a className="admin-url" href={selectedSubmission.url} target="_blank" rel="noreferrer">{selectedSubmission.url} ↗</a><p>{selectedSubmission.description||"No description supplied."}</p><div className="admin-facts"><div><span>HOSTING</span><strong>{selectedSubmission.hosting||"—"}</strong></div><div><span>HTTP</span><strong>{selectedSubmission.httpStatus??"—"}</strong></div><div><span>RESPONSE</span><strong>{selectedSubmission.responseTimeMs!=null?selectedSubmission.responseTimeMs+" ms":"—"}</strong></div><div><span>SIGNAL</span><strong>{selectedSubmission.verificationStatus}</strong></div></div>{selectedSubmission.githubUrl&&<div className="detail-group"><label>GITHUB</label><a href={selectedSubmission.githubUrl} target="_blank" rel="noreferrer">{selectedSubmission.githubUrl} ↗</a></div>}<div className="admin-actions">{selectedSubmission.status==="pending"&&<><button className="button" disabled={saving} onClick={()=>decide(selectedSubmission.id,"approved")}>APPROVE & PUBLISH →</button><button className="button secondary" disabled={saving} onClick={()=>decide(selectedSubmission.id,"rejected")}>REJECT</button></>}</div></>:<div className="muted-detail">Select a submission.</div>}</div></div></div>}
    </section>
  </main>;
}
