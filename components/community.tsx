"use client";

import { useEffect, useState } from "react";

type User = { id:string; username:string; email:string };
type Comment = { id:string; content:string; createdAt:string; username:string };

export default function Community({ slug }: { slug:string }) {
  const [comments,setComments]=useState<Comment[]>([]);
  const [user,setUser]=useState<User|null>(null);
  const [mode,setMode]=useState<"login"|"register"|null>(null);
  const [identifier,setIdentifier]=useState("");
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [content,setContent]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function load() {
    const [cr,ur]=await Promise.all([
      fetch("/api/projects/"+encodeURIComponent(slug)+"/comments",{cache:"no-store"}),
      fetch("/api/auth/me",{cache:"no-store"})
    ]);
    const cd=await cr.json().catch(()=>({}));
    const ud=await ur.json().catch(()=>({}));
    setComments(Array.isArray(cd.comments)?cd.comments:[]);
    setUser(ud.user||null);
  }
  useEffect(()=>{void load()},[slug]);

  function resetFeedback(){setError("");setMessage("")}

  async function submitAuth(e:React.FormEvent){
    e.preventDefault();resetFeedback();setBusy(true);
    try {
      const endpoint=mode==="register"?"/api/auth/register":"/api/auth/login";
      const body=mode==="register"?{username,email,password}:{identifier,password};
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setError(d.message||"Could not complete account request.");return}
      setUser(d.user);setMode(null);setIdentifier("");setUsername("");setEmail("");setPassword("");
    } catch {setError("Could not connect to QIndex.");}
    finally{setBusy(false)}
  }

  async function submitComment(e:React.FormEvent){
    e.preventDefault();resetFeedback();setBusy(true);
    try {
      const r=await fetch("/api/projects/"+encodeURIComponent(slug)+"/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setError(d.message||"Could not submit comment.");return}
      setContent("");setMessage("Submitted for review. It will appear here once approved.");
    } catch {setError("Could not connect to QIndex.");}
    finally{setBusy(false)}
  }

  async function logout(){
    await fetch("/api/auth/logout",{method:"POST"});
    setUser(null);setMode(null);resetFeedback();
  }

  return <section className="shell community-section fade-up-d2">
    <div className="section-heading">
      <div><span className="section-number">05</span><span>COMMUNITY</span></div>
      <p>{comments.length} {comments.length===1?"comment":"comments"}</p>
    </div>

    <div className="community-head">
      <div><h2>Talk about the project.</h2><p>Ask questions, share experience and add useful context. Comments are reviewed before publication.</p></div>
      {user&&<div className="community-user"><span>SIGNED IN AS</span><strong>@{user.username}</strong><button onClick={logout}>SIGN OUT</button></div>}
    </div>

    {!user && !mode && <div className="community-auth-prompt"><span>Join the discussion with a free QIndex account.</span><div><button className="button" onClick={()=>{resetFeedback();setMode("register")}}>CREATE ACCOUNT →</button><button className="button secondary" onClick={()=>{resetFeedback();setMode("login")}}>SIGN IN</button></div></div>}

    {mode && <form className="community-auth" onSubmit={submitAuth}>
      <div className="panel-title">{mode==="register"?"CREATE QINDEX ACCOUNT":"SIGN IN"} <button type="button" className="text-button" onClick={()=>{setMode(null);resetFeedback()}}}>CLOSE ×</button></div>
      {mode==="register"&&<><label>USERNAME<input autoFocus value={username} onChange={e=>setUsername(e.target.value)} placeholder="e.g. ahmed_q"/></label><label>EMAIL<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label></>}
      {mode==="login"&&<label>USERNAME OR EMAIL<input autoFocus value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Username or email"/></label>}
      <label>PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
      <p className="community-note">Email verification is not required in this first version.</p>
      {error&&<div className="result error">{error}</div>}
      <button className="button" disabled={busy}>{busy?"PLEASE WAIT…":mode==="register"?"CREATE ACCOUNT →":"SIGN IN →"}</button>
    </form>}

    {user && <form className="community-compose" onSubmit={submitComment}>
      <label>WRITE A COMMENT<textarea maxLength={2000} value={content} onChange={e=>setContent(e.target.value)} placeholder="Share a question, experience or useful context…" rows={5}/></label>
      <div className="community-compose-foot"><span>{content.length}/2000</span><button className="button" disabled={busy||content.trim().length<2}>{busy?"SUBMITTING…":"SUBMIT FOR REVIEW →"}</button></div>
    </form>}

    {message&&<div className="result success">{message}</div>}
    {error&&!mode&&!message&&<div className="result error">{error}</div>}

    <div className="community-list">
      {!comments.length&&<div className="community-empty"><span>NO PUBLIC COMMENTS YET</span><p>Be the first to start a useful discussion.</p></div>}
      {comments.map(c=><article className="community-comment" key={c.id}>
        <div className="community-comment-meta"><strong>@{c.username}</strong><span>{new Date(c.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}</span></div>
        <p>{c.content}</p>
      </article>)}
    </div>
  </section>;
}