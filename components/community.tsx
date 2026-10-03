"use client";

import { useEffect, useState } from "react";

type User = { id:string; username:string };
type Comment = { id:string; content:string; createdAt:string; username:string };

export default function Community({ slug }: { slug:string }) {
  const [comments,setComments]=useState<Comment[]>([]);
  const [user,setUser]=useState<User|null>(null);
  const [mode,setMode]=useState<"login"|"register"|"recover"|null>(null);
  const [identifier,setIdentifier]=useState("");
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [backupKey,setBackupKey]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [content,setContent]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [generatedBackupKey,setGeneratedBackupKey]=useState("");
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
  function closeAuth(){setMode(null);setGeneratedBackupKey("");setIdentifier("");setUsername("");setPassword("");setBackupKey("");setNewPassword("");resetFeedback()}

  async function copyBackupKey(){
    if (!generatedBackupKey) return;
    await navigator.clipboard?.writeText(generatedBackupKey);
    setMessage("Backup Key copied to your clipboard.");
  }

  function downloadBackupKey(){
    if (!generatedBackupKey) return;
    const blob=new Blob([
      "QINDEX BACKUP KEY\n\n",
      generatedBackupKey,
      "\n\nKeep this key private. It can reset your QIndex password.\nQIndex cannot recover or replace it for you.\n"
    ],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="qindex-backup-key.txt";a.click();URL.revokeObjectURL(url);
    setMessage("Backup Key saved as a text file.");
  }

  async function submitAuth(e:React.FormEvent){
    e.preventDefault();resetFeedback();setBusy(true);
    try {
      const endpoint=mode==="register"?"/api/auth/register":mode==="recover"?"/api/auth/recover":"/api/auth/login";
      const body=mode==="register"
        ? {username,password}
        : mode==="recover"
          ? {username:identifier,backupKey,newPassword}
          : {identifier,password};
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setError(d.message||"Could not complete account request.");return}
      if(mode==="register"){
        setUser(d.user);setGeneratedBackupKey(d.backupKey);setPassword("");setUsername("");
        setMessage("");
      } else {
        setUser(d.user);closeAuth();setMessage(mode==="recover"?"Password reset. You are now signed in.":"Welcome back.");
      }
    } catch {setError("Could not connect to QIndex.");}
    finally{setBusy(false)}
  }

  async function submitComment(e:React.FormEvent){
    e.preventDefault();resetFeedback();setBusy(true);
    try {
      const r=await fetch("/api/projects/"+encodeURIComponent(slug)+"/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setError(d.message||"Could not submit comment.");return}
      setContent("");setComments(prev=>[...prev,d.comment]);setMessage("Your comment is now public.");
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
      <div><h2>Talk about the project.</h2><p>Ask questions, share experience and add useful context. Comments appear immediately and may be removed if they violate the community rules.</p></div>
      {user&&<div className="community-user"><span>SIGNED IN AS</span><strong>@{user.username}</strong><button onClick={logout}>SIGN OUT</button></div>}
    </div>

    {!user && !mode && <div className="community-auth-prompt"><div><strong>Join without giving QIndex your email.</strong><span>Create a pseudonymous identity with only a username and password.</span></div><div><button className="button" onClick={()=>{resetFeedback();setMode("register")}}>CREATE IDENTITY →</button><button className="button secondary" onClick={()=>{resetFeedback();setMode("login")}}>SIGN IN</button></div></div>}

    {mode && !generatedBackupKey && <form className="community-auth" onSubmit={submitAuth}>
      <div className="panel-title">
        <span>{mode==="register"?"CREATE YOUR QINDEX IDENTITY":mode==="recover"?"RECOVER YOUR ACCOUNT":"SIGN IN"}</span>
        <button type="button" className="text-button" onClick={closeAuth}>CLOSE ×</button>
      </div>

      {mode==="register" && <>
        <div className="community-privacy-note"><strong>Privacy by design.</strong><span>QIndex does not need your email, real name or phone number to let you participate.</span></div>
        <label>USERNAME<input autoFocus value={username} onChange={e=>setUsername(e.target.value)} placeholder="joe_abc"/><small>3–24 characters · letters, numbers and underscores</small></label>
        <label>PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/><small>Choose something you can remember.</small></label>
      </>}

      {mode==="login" && <>
        <label>USERNAME<input autoFocus value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="joe_abc"/></label>
        <label>PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label>
        <button type="button" className="community-link-button" onClick={()=>{resetFeedback();setMode("recover");setIdentifier("");setPassword("")}}>Forgot your password? Use your Backup Key →</button>
      </>}

      {mode==="recover" && <>
        <div className="community-privacy-note"><strong>No email recovery.</strong><span>Use the Backup Key you saved when you created your QIndex identity.</span></div>
        <label>USERNAME<input autoFocus value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="joe_abc"/></label>
        <label>BACKUP KEY<input value={backupKey} onChange={e=>setBackupKey(e.target.value)} placeholder="QX-XXXX-XXXX-XXXX-XXXX-XXXX" autoCapitalize="characters"/><small>Keep it private. Anyone with it can reset your password.</small></label>
        <label>NEW PASSWORD<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="At least 8 characters"/></label>
      </>}

      {error&&<div className="result error">{error}</div>}
      <button className="button" disabled={busy}>{busy?"PLEASE WAIT…":mode==="register"?"CREATE IDENTITY →":mode==="recover"?"RESET PASSWORD →":"SIGN IN →"}</button>
    </form>}

    {generatedBackupKey && <div className="backup-key-panel">
      <div className="backup-key-kicker">ONE-TIME SETUP · SAVE THIS NOW</div>
      <h3>Your Backup Key</h3>
      <p>This is the only recovery method for your QIndex identity. If you forget your password, this key lets you create a new one.</p>
      <div className="backup-key-value">{generatedBackupKey}</div>
      <div className="backup-key-actions"><button className="button" onClick={copyBackupKey}>COPY KEY</button><button className="button secondary" onClick={downloadBackupKey}>DOWNLOAD</button></div>
      <div className="backup-key-warning"><strong>Important:</strong> QIndex does not store the key itself and cannot show it again. Save it somewhere secure before continuing. Anyone who has this key can reset your password.</div>
      <button className="backup-key-confirm" onClick={()=>{setGeneratedBackupKey("");setMode(null);setMessage("Identity created. Your Backup Key has been saved.");}}>I'VE SAVED MY BACKUP KEY →</button>
    </div>}

    {user && !generatedBackupKey && <form className="community-compose" onSubmit={submitComment}>
      <label>WRITE A COMMENT<textarea maxLength={2000} value={content} onChange={e=>setContent(e.target.value)} placeholder="Share a question, experience or useful context…" rows={5}/></label>
      <div className="community-compose-foot"><span>{content.length}/2000</span><button className="button" disabled={busy||content.trim().length<2}>{busy?"SUBMITTING…":"POST COMMENT →"}</button></div>
    </form>}

    {message&&<div className="result success">{message}</div>}
    {error&&!mode&&!message&&!generatedBackupKey&&<div className="result error">{error}</div>}

    <div className="community-list">
      {!comments.length&&<div className="community-empty"><span>NO PUBLIC COMMENTS YET</span><p>Be the first to start a useful discussion.</p></div>}
      {comments.map(c=><article className="community-comment" key={c.id}>
        <div className="community-comment-meta"><strong>@{c.username}</strong><span>{new Date(c.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}</span></div>
        <p>{c.content}</p>
      </article>)}
    </div>
  </section>;
}