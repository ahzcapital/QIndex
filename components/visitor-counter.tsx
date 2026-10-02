"use client";

import { useEffect, useState } from "react";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;

    const update = async (register = false) => {
      try {
        const response = await fetch("/api/visits", {
          method: register ? "POST" : "GET",
          cache: "no-store",
        });
        const data = await response.json();
        if (!active) return;
        setCount(typeof data.count === "number" ? data.count : 0);
        setLive(response.ok && data.live !== false);
      } catch {
        if (active) setLive(false);
      }
    };

    update(true);
    const interval = window.setInterval(() => update(false), 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="visitor-counter" aria-live="polite" aria-label="Visits today UTC">
      <span className="visitor-label">VISITS TODAY (UTC)</span>
      <strong>{count === null ? "—" : count.toLocaleString()}</strong>
      <span className={"visitor-live" + (live ? " is-live" : "")}>
        <i />
        {live ? "LIVE" : "OFFLINE"}
      </span>
    </div>
  );
}
