"use client";

import { useEffect, useState } from "react";

type Comment = { id:string; content:string; status:string; createdAt:string; username:string; email:string; projectName:string; slug:string };

export default function AdminComments(){
  const [comments,setComments]=useState<Comment[]>([]);
  const [selected,setSelected]=useState<Comment|null>(null);
  const [error,setError]=useState("");

  async function load(){
    const r=await fetch("/api/admin/comments",{cache:"no-store"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){setError(d.message||"Could not load comments.");return}
    setComments(Array.isArray(d.comments)?d.comments:[]);
  }
  useEffect(()=>{void load()},[]);

  async function action(id:string,status:string){
    setError("");
    const r=await fetch("/api/admin/comments/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){setError(d.message||"Action failed.");return}
    setSelected(null);await load();
  }

  const published=comments.filter(c=>c.status==="published");
  return <div className="admin-comments">
    <div className="admin-toolbar"><span>{published.length} PUBLISHED / {comments.length} TOTAL</span></div>
    {error&&<div className="result error admin-error">{error}</div>}
    <div className="admin-layout">
      <div className="submission-list">
        {comments.map(c=><button key={c.id} className="submission-row" onClick={()=>setSelected(c)}>
          <span><strong>{c.username} · {c.projectName}</strong><small>{c.content.slice(0,90)}{c.content.length>90?"…":""}</small></span>
          <span className={"admin-status "+c.status}>{c.status}</span>
        </button>)}
        {!comments.length&&<div className="admin-empty">No comments yet.</div>}
      </div>
      <div className="submission-detail">
        {selected?<><div className="eyebrow">{selected.status.toUpperCase()} · {selected.projectName}</div>
          <h2>@{selected.username}</h2>
          <div className="detail-group"><label>EMAIL</label><strong>{selected.email}</strong></div>
          <div className="detail-group"><label>PROJECT</label><a href={"/project/"+selected.slug} target="_blank" rel="noreferrer">{selected.projectName} ↗</a></div>
          <div className="community-admin-copy">{selected.content}</div>
          <div className="admin-actions">{selected.status!=="deleted"&&<button className="button danger" onClick={()=>action(selected.id,"deleted")}>REMOVE COMMENT</button>}{selected.status==="pending"&&<button className="button secondary" onClick={()=>action(selected.id,"published")}>PUBLISH</button>}{selected.status==="pending"&&<button className="button secondary" onClick={()=>action(selected.id,"rejected")}>REJECT</button>}</div>
        </>:<div className="muted-detail">Select a comment.</div>}
      </div>
    </div>
  </div>;
}