import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { marked } from "marked";
import { API_BASE_URL } from "../config/api";

const BASE_API = API_BASE_URL;

// Configure marked for clean output
marked.setOptions({
  breaks: true,
  gfm: true,
});

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #1a1a2e;
    --ink-light: #4a4a6a;
    --ink-muted: #8888aa;
    --accent: #c8a96e;
    --accent-light: #f5efe3;
    --border: #e8e4f0;
    --surface: #fdfcff;
    --white: #ffffff;
  }

  .policy-root {
    background: var(--surface);
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    color: var(--ink);
  }

  /* ── Top bar ── */
  .policy-topbar {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 14px 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--ink-muted);
    letter-spacing: 0.02em;
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(8px);
  }
  .policy-topbar a {
    color: var(--ink-muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .policy-topbar a:hover { color: var(--ink); }
  .policy-topbar .sep { opacity: 0.4; }
  .policy-topbar .current { color: var(--ink); font-weight: 500; }

  /* ── Layout ── */
  .policy-layout {
    max-width: 1100px;
    margin: 0 auto;
    padding: 60px 48px 100px;
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 64px;
    align-items: start;
  }

  /* ── Sidebar ── */
  .policy-sidebar {
    position: sticky;
    top: 80px;
  }
  .sidebar-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 16px;
  }
  .sidebar-toc {
    list-style: none;
    padding: 0;
    margin: 0;
    border-left: 2px solid var(--border);
  }
  .sidebar-toc li {
    padding: 6px 0 6px 16px;
    font-size: 13px;
    color: var(--ink-light);
    cursor: pointer;
    transition: all 0.2s;
    border-left: 2px solid transparent;
    margin-left: -2px;
    line-height: 1.4;
  }
  .sidebar-toc li:hover,
  .sidebar-toc li.active {
    color: var(--ink);
    border-left-color: var(--accent);
  }
  .sidebar-meta {
    margin-top: 36px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    font-size: 12px;
    color: var(--ink-muted);
    line-height: 1.8;
  }
  .sidebar-meta strong {
    display: block;
    color: var(--ink-light);
    margin-bottom: 2px;
    font-weight: 500;
  }

  /* ── Main content ── */
  .policy-main {}

  .policy-header {
    margin-bottom: 48px;
    padding-bottom: 36px;
    border-bottom: 1px solid var(--border);
  }
  .policy-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent-light);
    color: var(--accent);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 20px;
    margin-bottom: 20px;
  }
  .policy-tag::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
  }
  .policy-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(32px, 4vw, 48px);
    font-weight: 700;
    color: var(--ink);
    line-height: 1.2;
    margin: 0 0 16px;
    letter-spacing: -0.02em;
  }
  .policy-subtitle {
    font-size: 16px;
    color: var(--ink-light);
    line-height: 1.7;
    font-weight: 300;
    max-width: 560px;
  }

  /* ── Markdown content styles ── */
  .policy-body {
    line-height: 1.85;
    font-size: 15.5px;
    color: #2d2d4e;
    font-weight: 300;
  }

  .policy-body h1,
  .policy-body h2,
  .policy-body h3,
  .policy-body h4 {
    font-family: 'Playfair Display', serif;
    color: var(--ink);
    margin: 2.5em 0 0.8em;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }
  .policy-body h1 { font-size: 28px; }
  .policy-body h2 {
    font-size: 22px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .policy-body h3 { font-size: 18px; }
  .policy-body h4 { font-size: 15px; font-family: 'DM Sans', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; color: var(--ink-light); }

  .policy-body p {
    margin: 0 0 1.4em;
  }

  .policy-body strong {
    font-weight: 600;
    color: var(--ink);
  }

  .policy-body em {
    font-style: italic;
    color: var(--ink-light);
  }

  .policy-body a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .policy-body ul, .policy-body ol {
    padding-left: 0;
    margin: 0 0 1.6em;
    list-style: none;
  }
  .policy-body ul li, .policy-body ol li {
    position: relative;
    padding: 6px 0 6px 24px;
    font-size: 15px;
    border-bottom: 1px solid #f0eef8;
    color: var(--ink-light);
  }
  .policy-body ul li::before {
    content: '—';
    position: absolute;
    left: 0;
    color: var(--accent);
    font-weight: 600;
  }
  .policy-body ol {
    counter-reset: ol-counter;
  }
  .policy-body ol li {
    counter-increment: ol-counter;
  }
  .policy-body ol li::before {
    content: counter(ol-counter, decimal-leading-zero);
    position: absolute;
    left: 0;
    color: var(--accent);
    font-size: 11px;
    font-weight: 600;
    top: 8px;
  }

  .policy-body blockquote {
    border-left: 3px solid var(--accent);
    background: var(--accent-light);
    margin: 2em 0;
    padding: 20px 24px;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: var(--ink-light);
  }

  .policy-body code {
    background: #f0eef8;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 13px;
    font-family: 'Menlo', monospace;
    color: #5c3d8f;
  }

  .policy-body pre {
    background: var(--ink);
    color: #e2e8f0;
    padding: 24px;
    border-radius: 10px;
    overflow-x: auto;
    margin: 1.5em 0;
  }
  .policy-body pre code {
    background: none;
    color: inherit;
    padding: 0;
  }

  .policy-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.8em 0;
    font-size: 14px;
  }
  .policy-body th {
    background: var(--accent-light);
    color: var(--ink);
    font-weight: 600;
    text-align: left;
    padding: 12px 16px;
    border-bottom: 2px solid var(--accent);
    font-size: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .policy-body td {
    padding: 11px 16px;
    border-bottom: 1px solid var(--border);
    color: var(--ink-light);
    vertical-align: top;
  }
  .policy-body tr:last-child td { border-bottom: none; }
  .policy-body tr:hover td { background: #faf9ff; }

  .policy-body hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 2.5em 0;
  }

  /* ── Section dividers (numbered sections) ── */
  .policy-body h2:first-of-type { margin-top: 0; }

  /* ── Footer strip ── */
  .policy-footer {
    margin-top: 60px;
    padding: 28px 32px;
    background: var(--accent-light);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }
  .policy-footer-text {
    font-size: 13px;
    color: var(--ink-light);
    line-height: 1.6;
  }
  .policy-footer-text strong { color: var(--ink); }
  .policy-footer-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--ink-muted);
    white-space: nowrap;
  }
  .badge-dot {
    width: 8px;
    height: 8px;
    background: #4caf7d;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(76,175,125,0.2);
  }

  /* ── Loading ── */
  .policy-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    font-family: 'DM Sans', sans-serif;
  }
  .loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 14px; color: var(--ink-muted); }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .policy-layout {
      grid-template-columns: 1fr;
      padding: 32px 24px 64px;
      gap: 40px;
    }
    .policy-sidebar { position: static; }
    .policy-topbar { padding: 12px 24px; }
    .policy-footer { flex-direction: column; align-items: flex-start; }
  }
`;

// Extract headings from rendered HTML for TOC
function extractHeadings(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const tags = div.querySelectorAll("h1, h2, h3");
  return Array.from(tags).map((el, i) => ({
    id: `section-${i}`,
    text: el.textContent,
    level: parseInt(el.tagName[1]),
  }));
}

// Inject IDs into rendered HTML
function injectHeadingIds(html) {
  let counter = 0;
  return html.replace(/<(h[1-3])(.*?)>/g, (match, tag, attrs) => {
    return `<${tag}${attrs} id="section-${counter++}">`;
  });
}

export default function PolicyPage() {
  const { slug } = useParams();
  const [policy, setPolicy] = useState(null);
  const [toc, setToc] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [renderedHtml, setRenderedHtml] = useState("");

  useEffect(() => {
    axios
      .get(`${BASE_API}/api/policies`)
      .then((res) => {
        const found = res.data.policies.find((p) => p.slug === slug);
        if (found) {
          const rawHtml = marked(found.content || "");
          const withIds = injectHeadingIds(rawHtml);
          setRenderedHtml(withIds);
          setToc(extractHeadings(rawHtml));
          setPolicy(found);
        }
      })
      .catch((err) => console.log(err));
  }, [slug]);

  // Scroll spy
  useEffect(() => {
    if (!toc.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!policy) {
    return (
      <>
        <style>{styles}</style>
        <div className="policy-loading">
          <div className="loading-spinner" />
          <p className="loading-text">Loading policy document…</p>
        </div>
      </>
    );
  }

  const lastUpdated = policy.updated_at
    ? new Date(policy.updated_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      });

  return (
    <>
      <style>{styles}</style>
      <div className="policy-root">
        {/* Breadcrumb topbar */}
        <nav className="policy-topbar">
          <a href="/">Home</a>
          <span className="sep">/</span>
          <a href="/policy">Policies</a>
          <span className="sep">/</span>
          <span className="current">{policy.title}</span>
        </nav>

        <div className="policy-layout">
          {/* Sidebar */}
          <aside className="policy-sidebar">
            {toc.length > 0 && (
              <>
                <p className="sidebar-label">On this page</p>
                <ul className="sidebar-toc">
                  {toc.map(({ id, text, level }) => (
                    <li
                      key={id}
                      className={activeId === id ? "active" : ""}
                      style={{ paddingLeft: `${(level - 1) * 12 + 16}px` }}
                      onClick={() => scrollTo(id)}
                    >
                      {text}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="sidebar-meta">
              <strong>Last updated</strong>
              {lastUpdated}
              {policy.version && (
                <>
                  <strong style={{ marginTop: "12px" }}>Version</strong>
                  {policy.version}
                </>
              )}
              <strong style={{ marginTop: "12px" }}>Jurisdiction</strong>
              India
            </div>
          </aside>

          {/* Main */}
          <main className="policy-main">
            <header className="policy-header">
              <div className="policy-tag">Legal Document</div>
              <h1 className="policy-title">{policy.title}</h1>
              <p className="policy-subtitle">
                {policy.description ||
                  "Please read this document carefully. It governs your use of our platform and services."}
              </p>
            </header>

            <article
              className="policy-body"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />

            <footer className="policy-footer">
              <div className="policy-footer-text">
                <strong>Questions about this policy?</strong>
                <br />
                Contact our legal team at{" "}
                <a href="mailto:legal@bioburg.in" style={{ color: "#c8a96e" }}>
                  legal@bioburg.in
                </a>
              </div>
              <div className="policy-footer-badge">
                <span className="badge-dot" />
                Current &amp; Effective
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
