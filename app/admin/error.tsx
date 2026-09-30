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
    <main className="admin-login shell">
      <div className="eyebrow">QINDEX ADMIN / ERROR</div>
      <h1>Control room<br /><em>diagnostic.</em></h1>
      <p>The admin interface hit a client-side error. The error details below identify the failing component instead of showing the generic Vercel screen.</p>
      <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",marginTop:24,padding:20,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.03)"}}>
        {error?.message || "Unknown client error"}
        {error?.digest ? "\n\nDigest: " + error.digest : ""}
      </pre>
      <button className="button" onClick={() => reset()}>Retry admin →</button>
    </main>
  );
}
