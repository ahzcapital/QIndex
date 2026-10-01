"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("QIndex admin client error:", error);
  }, [error]);

  return (
    <main className="site-stage">
      <div className="ambient ambient-a"/><div className="grain"/>
      <section className="admin-login shell fade-up">
      <div className="eyebrow">QINDEX ADMIN / ERROR</div>
      <h1>Control room<br /><em className="grad-text">diagnostic.</em></h1>
      <p style={{color:"#94A3B8",maxWidth:560,lineHeight:1.8,fontSize:13}}>The admin interface hit a client-side error. The error details below identify the failing component instead of showing the generic Vercel screen.</p>
      <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",marginTop:24,padding:20,borderRadius:14,border:"1px solid rgba(247,147,26,.25)",background:"rgba(15,17,21,.7)",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#94A3B8"}}>
        {error?.message || "Unknown client error"}
        {error?.digest ? "\n\nDigest: " + error.digest : ""}
      </pre>
      <button className="button" onClick={() => reset()}>Retry admin →</button>
      </section>
    </main>
  );
}