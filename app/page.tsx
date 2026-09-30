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

const categories = ["All", "Infrastructure", "Tools", "Developer", "AI", "Finance", "Gaming", "Research", "Other"];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {});

    const node = root.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const move = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const frame = () => {
      x += (tx - x) * 0.035;
      y += (ty - y) * 0.035;
      node.style.setProperty("--mx", x.toFixed(4));
      node.style.setProperty("--my", y.toFixed(4));
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
      const haystack = [p.name, p.description || "", p.url, p.category, p.hosting || ""].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) &&
        (category === "All" || p.category === category) &&
        (!verifiedOnly || p.verificationStatus === "qstorage");
    });
  }, [projects, query, category, verifiedOnly]);

  const count = projects.length;
  const qstorageCount = projects.filter((p) => p.verificationStatus === "qstorage").length;
  const verifiedCount = projects.filter((p) => p.verificationStatus === "qstorage").length;

  return (
    <main className="site-stage" ref={root}>
      <div className="ambient ambient-a" />
      <div className="grain" />

      <header className="nav shell">
        <Link href="/" className="brand-mark" aria-label="QIndex home">
          <span className="brand-symbol">Q</span>
          <span>QINDEX</span>
        </Link>
        <nav className="nav-links">
          <a href="#index">Explore</a>
          <a href="#categories">Categories</a>
          <Link href="/signal">Signal</Link>
          <Link href="/submit">Submit</Link>
        </nav>
        <span className="nav-state"><i /> PUBLIC INDEX</span>
      </header>

      <section className="intro shell">
        <div className="intro-kicker">Q / PUBLIC ECOSYSTEM INDEX</div>
        <h1>The Quilibrium<br /><span>web index.</span></h1>
        <p>Discover publicly accessible websites, applications, tools and projects connected to the Quilibrium ecosystem.</p>
        <a href="#index" className="primary-link">Explore the index <span>↓</span></a>
      </section>

      <section className="stats shell" aria-label="Index statistics">
        <div><strong>{count.toLocaleString()}</strong><span>PUBLIC PROJECTS</span></div>
        <div><strong>{qstorageCount.toLocaleString()}</strong><span>QSTORAGE SIGNALS</span></div>
        <div><strong>{verifiedCount.toLocaleString()}</strong><span>REVIEWED RECORDS</span></div>
        <div><strong>{categories.length - 1}</strong><span>CATEGORIES</span></div>
      </section>

      <section className="index-section shell" id="index">
        <div className="section-heading">
          <div><span className="section-number">01</span><span>EXPLORE</span></div>
          <p>{filtered.length.toLocaleString()} {filtered.length === 1 ? "result" : "results"}</p>
        </div>

        <div className="search-box">
          <span>⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects, URLs, categories..." aria-label="Search QIndex" />
          {query && <button onClick={() => setQuery("")}>CLEAR</button>}
        </div>

        <div className="filter-bar">
          <div className="category-scroll">
            {categories.map((c) => (
              <button key={c} className={category === c ? "filter active" : "filter"} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          <label className="verify-toggle">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            <span />
            QStorage
          </label>
        </div>

        <div className="index-header">
          <span>RECORD</span><span>PROJECT</span><span>CATEGORY</span><span>DESCRIPTION</span><span>STATE</span>
        </div>

        {filtered.length ? (
          <div className="project-list">
            {filtered.map((p, i) => (
              <Link href={"/project/" + p.slug} className="project-row" key={p.slug}>
                <span className="row-index">{String(i + 1).padStart(3, "0")}</span>
                <span className="row-name"><strong>{p.name}</strong><small>{p.url.replace(/^https?:\/\//, "")}</small></span>
                <span className="row-category">{p.category}</span>
                <span className="row-description">{p.description || "No description supplied."}</span>
                <span className="row-state"><i />{p.verificationStatus === "qstorage" ? "QSTORAGE" : "REACHABLE"} <b>↗</b></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>00 / INDEX</span>
            <div><strong>No records found.</strong><p>Try another search or category, or submit a project.</p></div>
            <Link href="/submit" className="secondary-link">Submit a project ↗</Link>
          </div>
        )}
      </section>

      <section className="category-section shell" id="categories">
        <div className="section-heading"><div><span className="section-number">02</span><span>CATEGORIES</span></div><p>Browse the index by type.</p></div>
        <div className="category-grid">
          {categories.slice(1).map((c) => {
            const n = projects.filter((p) => p.category === c).length;
            return (
              <button key={c} className="category-item" onClick={() => { setCategory(c); document.getElementById("index")?.scrollIntoView({ behavior: "smooth" }); }}>
                <span>{c}</span><strong>{String(n).padStart(2, "0")}</strong><b>↗</b>
              </button>
            );
          })}
        </div>
      </section>

      <section className="method-section">
        <div className="shell method-layout">
          <div className="section-heading"><div><span className="section-number">03</span><span>METHOD</span></div><Link href="/signal" className="secondary-link">Read the signal page ↗</Link></div>
          <div className="method-copy">
            <h2>A public record,<br />not an endorsement.</h2>
            <p>QIndex separates what a machine can observe from what a human has reviewed. A reachable URL is a technical observation. A QStorage signal is a hosting clue. Publication follows review.</p>
            <div className="method-steps">
              <div><span>01</span><strong>CHECK</strong><p>Reachability, redirects and visible hosting signals.</p></div>
              <div><span>02</span><strong>REVIEW</strong><p>Project context and publicly available information.</p></div>
              <div><span>03</span><strong>INDEX</strong><p>Approved records become part of the public directory.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="submit-strip shell">
        <span className="section-number">04</span>
        <div><span className="eyebrow">OPEN SUBMISSION</span><h2>Know something<br /><span>missing?</span></h2></div>
        <div><p>Suggest a publicly accessible project. It will be checked and reviewed before publication.</p><Link href="/submit" className="primary-link">Submit a project ↗</Link></div>
      </section>

      <footer className="footer shell"><span>QINDEX / 2026</span><span>AN INDEPENDENT PUBLIC ECOSYSTEM INDEX</span><span>Q / END</span></footer>
    </main>
  );
}
