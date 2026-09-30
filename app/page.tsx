"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Project = {
  slug: string;
  name: string;
  description: string;
  url: string;
  category: string;
  verificationStatus: string;
  hosting: string;
};

const categories = ["All", "Infrastructure", "Tools", "Developer", "AI", "Finance", "Gaming", "Research"];

function Field({ x, y, w = 1 }: { x: number; y: number; w?: number }) {
  return <span className="field-orbit" style={{ "--x": x, "--y": y, "--w": w } as React.CSSProperties} />;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {});

    const root = stage.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const move = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const frame = () => {
      x += (tx - x) * 0.045;
      y += (ty - y) * 0.045;
      root.style.setProperty("--mx", x.toFixed(4));
      root.style.setProperty("--my", y.toFixed(4));
      raf = requestAnimationFrame(frame);
    };
    window.addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const haystack = [p.name, p.description || "", p.url, p.category].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) &&
        (category === "All" || p.category === category) &&
        (!verifiedOnly || p.verificationStatus === "qstorage");
    });
  }, [projects, query, category, verifiedOnly]);

  return (
    <main className="site-stage" ref={stage}>
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="grid-ghost" />
      <div className="grain" />

      <header className="nav shell">
        <Link href="/" className="brand-mark" aria-label="QIndex home">
          <span className="brand-symbol">Q</span>
          <span>QINDEX</span>
        </Link>
        <nav className="nav-links">
          <a href="#index">Index</a>
          <a href="#signal">Signal</a>
          <Link href="/submit">Submit</Link>
        </nav>
        <div className="nav-state"><i /> LIVE INDEX</div>
      </header>

      <section className="hero shell">
        <div className="hero-side">Q / 001<br />PUBLIC ECOSYSTEM</div>
        <div className="eyebrow"><span className="signal-dot" /> QUILIBRIUM / WEB INDEX</div>
        <h1>
          The visible layer<br />
          <span>of a quiet network.</span>
        </h1>
        <p className="hero-copy">
          QIndex maps publicly discoverable websites, applications, tools and experiments connected to the Quilibrium ecosystem.
        </p>

        <div className="hero-actions">
          <a href="#index" className="text-action">Enter the index <span>↘</span></a>
          <Link href="/submit" className="text-action muted-action">Submit a project <span>↗</span></Link>
        </div>

        <div className="hero-field" aria-hidden="true">
          <Field x={17} y={25} w={1} />
          <Field x={68} y={18} w={2} />
          <Field x={82} y={62} w={1} />
          <Field x={39} y={76} w={2} />
          <div className="field-ring ring-one" />
          <div className="field-ring ring-two" />
          <div className="field-axis axis-x" />
          <div className="field-axis axis-y" />
          <div className="field-core"><span>Q</span></div>
        </div>

        <div className="hero-meta">
          <span>LATENT / DISCOVERABLE / INDEXED</span>
          <span>EST. 2026</span>
        </div>
      </section>

      <section className="index-section shell" id="index">
        <div className="section-marker"><span>01</span><span>INDEX / DISCOVERY</span></div>
        <div className="index-intro">
          <div>
            <div className="eyebrow">PUBLIC RECORD</div>
            <h2>Find what exists.</h2>
          </div>
          <p>One restrained interface for navigating projects that can be reached in the open.</p>
        </div>

        <div className="index-tools">
          <div className="search-line">
            <span>⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the index" aria-label="Search projects" />
            <small>{filtered.length.toString().padStart(3, "0")} RESULTS</small>
          </div>
          <div className="filter-line">
            <div className="category-scroll">
              {categories.map((c) => (
                <button key={c} className={category === c ? "filter active" : "filter"} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
            <label className="verify-toggle">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              <span />
              QStorage signal
            </label>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="project-list">
            {filtered.map((p, i) => (
              <Link href={"/project/" + p.slug} className="project-row" key={p.slug}>
                <span className="row-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="row-name">
                  <strong>{p.name}</strong>
                  <small>{p.url.replace(/^https?:\/\//, "")}</small>
                </span>
                <span className="row-category">{p.category}</span>
                <span className="row-description">{p.description || "Publicly discoverable project."}</span>
                <span className="row-status">{p.verificationStatus === "qstorage" ? "QSTORAGE" : "REACHABLE"} <b>↗</b></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="index-empty">
            <div className="empty-coordinate">00 / 00 / 00</div>
            <div>
              <strong>The index is quiet.</strong>
              <p>No published projects match this view yet.</p>
            </div>
            <Link href="/submit" className="text-action">Suggest a project <span>↗</span></Link>
          </div>
        )}
      </section>

      <section className="signal-section" id="signal">
        <div className="shell signal-grid">
          <div className="section-marker"><span>02</span><span>SIGNAL / METHOD</span></div>
          <div className="signal-copy">
            <div className="eyebrow">OBSERVATION, NOT CLAIM</div>
            <h2>Reachable is not the same as verified.</h2>
            <p>QIndex records what can be technically observed from a public URL, then keeps publication behind a human review step. Hosting signals are treated as evidence, not identity.</p>
            <div className="method-line"><span>01</span><span>CHECK</span><span>URL reachability + redirect chain</span></div>
            <div className="method-line"><span>02</span><span>REVIEW</span><span>Project context + public information</span></div>
            <div className="method-line"><span>03</span><span>INDEX</span><span>Approved projects become discoverable</span></div>
          </div>
          <div className="signal-visual" aria-hidden="true">
            <div className="scan-ring" />
            <div className="scan-ring small" />
            <div className="scan-line" />
            <span className="scan-label">PUBLIC / SIGNAL</span>
          </div>
        </div>
      </section>

      <section className="submit-section shell">
        <div className="submit-number">03</div>
        <div>
          <div className="eyebrow">OPEN DISCOVERY</div>
          <h2>Something missing<br /><span>from the map?</span></h2>
        </div>
        <div className="submit-copy">
          <p>Suggest a public project. It will be checked, stored and reviewed before it becomes part of the index.</p>
          <Link href="/submit" className="text-action">Submit a project <span>↗</span></Link>
        </div>
      </section>

      <footer className="shell footer">
        <span>QINDEX / 2026</span>
        <span>AN INDEPENDENT PUBLIC ECOSYSTEM INDEX</span>
        <span>Q / END</span>
      </footer>
    </main>
  );
}
