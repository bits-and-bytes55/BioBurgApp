// PopupVideoPlayer.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* Injected styles (no extra deps needed)*/
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

  @keyframes pp-fade-in   { from{opacity:0}       to{opacity:1} }
  @keyframes pp-slide-up  { from{opacity:0;transform:translateY(32px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes pp-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(.85)} }
  @keyframes pp-shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes pp-spin      { to{transform:rotate(360deg)} }

  .pp-overlay{
    position:fixed;inset:0;z-index:99999;
    display:flex;align-items:center;justify-content:center;padding:16px;
    animation:pp-fade-in .35s ease forwards;
    font-family:'DM Sans',sans-serif;
  }

  /* Backdrop blur layer */
  .pp-overlay::before{
    content:'';position:absolute;inset:0;
    backdrop-filter:blur(6px) saturate(1.2);
    -webkit-backdrop-filter:blur(6px) saturate(1.2);
  }

  .pp-card{
    position:relative;z-index:1;
    width:100%;max-width:660px;
    border-radius:24px;overflow:hidden;
    background:#0b0f1a;
    box-shadow:
      0 0 0 1px rgba(255,255,255,.08),
      0 40px 100px rgba(0,0,0,.7),
      0 0 80px rgba(37,99,235,.12);
    animation:pp-slide-up .5s cubic-bezier(.34,1.56,.64,1) forwards;
  }

  /* ── Video area ── */
  .pp-video-wrap{
    position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden;
  }
  .pp-video-wrap video,
  .pp-video-wrap iframe{
    width:100%;height:100%;border:none;display:block;object-fit:cover;
  }

  /* Gradient fade at bottom of video into card body */
  .pp-video-wrap::after{
    content:'';position:absolute;inset:auto 0 0 0;height:120px;
    background:linear-gradient(to bottom,transparent,#0b0f1a);
    pointer-events:none;
  }

  /* ── Close button ── */
  .pp-close{
    position:absolute;top:14px;right:14px;z-index:20;
    width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.18);
    background:rgba(10,14,30,.7);backdrop-filter:blur(8px);
    color:#fff;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;font-weight:300;line-height:1;padding:0;
    transition:background .2s,border-color .2s,transform .15s;
  }
  .pp-close:hover{background:rgba(220,38,38,.75);border-color:rgba(220,38,38,.5);transform:scale(1.1);}

  /* ── Play overlay ── */
  .pp-play-overlay{
    position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,.35);cursor:pointer;z-index:5;
    transition:background .25s;
  }
  .pp-play-overlay:hover{background:rgba(0,0,0,.15);}
  .pp-play-btn{
    width:58px;height:58px;border-radius:50%;
    background:rgba(255,255,255,.95);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 8px 32px rgba(0,0,0,.4);
    transition:transform .2s,box-shadow .2s;
  }
  .pp-play-overlay:hover .pp-play-btn{transform:scale(1.12);box-shadow:0 12px 40px rgba(0,0,0,.5);}

  /* ── Auto-close progress bar ── */
  .pp-progress{
    position:absolute;bottom:0;left:0;right:0;height:3px;
    background:rgba(255,255,255,.1);z-index:10;
  }
  .pp-progress-fill{height:100%;transition:width .1s linear;}

  /* ── Body ── */
  .pp-body{
    padding:20px 28px 28px;position:relative;z-index:2;
    background:#0b0f1a;
  }

  /* Live badge */
  .pp-badge{
    display:inline-flex;align-items:center;gap:7px;
    background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.1);
    border-radius:999px;padding:4px 12px;margin-bottom:12px;
  }
  .pp-badge-dot{
    width:7px;height:7px;border-radius:50%;
    animation:pp-pulse-dot 2s ease-in-out infinite;
  }
  .pp-badge-text{
    font-size:10.5px;font-weight:700;letter-spacing:.9px;
    text-transform:uppercase;color:rgba(255,255,255,.5);
  }

  /* Title */
  .pp-title{
    font-family:'Syne',sans-serif;
    font-size:clamp(20px,4vw,26px);font-weight:800;
    color:#fff;letter-spacing:-.4px;margin:0 0 6px;line-height:1.2;
  }

  /* Subtitle */
  .pp-sub{
    font-size:14px;color:rgba(255,255,255,.5);margin:0 0 22px;line-height:1.6;
  }

  /* Actions row */
  .pp-actions{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}

  /* CTA button */
  .pp-cta{
    display:inline-flex;align-items:center;gap:8px;
    padding:11px 24px;border-radius:12px;border:none;cursor:pointer;
    font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;
    letter-spacing:.1px;color:#fff;text-decoration:none;
    transition:opacity .2s,transform .15s,box-shadow .2s;
    box-shadow:0 4px 20px rgba(0,0,0,.3);
  }
  .pp-cta:hover{opacity:.88;transform:translateY(-1px);box-shadow:0 8px 28px rgba(0,0,0,.4);}

  /* Dismiss */
  .pp-dismiss{
    background:none;border:none;cursor:pointer;padding:0;
    font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;
    color:rgba(255,255,255,.3);transition:color .2s;
  }
  .pp-dismiss:hover{color:rgba(255,255,255,.65);}


  @media(max-width:480px){
    .pp-card{border-radius:18px;}
    .pp-body{padding:16px 18px 22px;}
    .pp-title{font-size:20px;}
  }
`;

/*Component */
export default function PopupVideoPlayer() {
  // All hooks must come first — no early returns before hooks
  const [config, setConfig]               = useState(null);
  const [visible, setVisible]             = useState(false);
  const [progress, setProgress]           = useState(0);
  const [showPlayOverlay, setShowOverlay] = useState(true);
  const videoRef        = useRef(null);
  const timerRef        = useRef(null);
  const rafRef          = useRef(null);
  const startRef        = useRef(null);

  /* Inject styles once */
  useEffect(() => {
    if (document.getElementById("pp-styles")) return;
    const el = document.createElement("style");
    el.id = "pp-styles";
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  /* Fetch config — skip entirely on admin pages */
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;

    fetch(`${API_BASE}/api/popup-video/active`)
      .then((r) => r.json())
      .then((data) => {
        const cfg = data?.config;
        if (!cfg?.enabled || !cfg?.videoUrl) return;

        if (cfg.showOnce && sessionStorage.getItem("pp_seen") === "1") return;

        setConfig(cfg);
        setTimeout(() => setVisible(true), (cfg.showDelay ?? 2) * 1000);
      })
      .catch(() => {});
  }, []);

  /* Auto-close + progress animation */
  useEffect(() => {
    if (!visible || !config?.closeAfter) return;
    const total = config.closeAfter * 1000;
    startRef.current = Date.now();

    const tick = () => {
      const pct = Math.min(((Date.now() - startRef.current) / total) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(handleClose, total);

    return () => {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible, config]);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (config?.showOnce) sessionStorage.setItem("pp_seen", "1");
    clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    videoRef.current?.pause();
  }, [config]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setShowOverlay(false); }
    else          { v.pause(); setShowOverlay(true);  }
  };

  /* ── Guard: never render popup on admin pages ── */
  if (window.location.pathname.startsWith("/admin")) return null;

  if (!visible || !config) return null;

  const isYT    = config.videoUrl?.includes("youtube.com") || config.videoUrl?.includes("youtu.be");
  const accent  = config.accentColor || "#2563eb";
  const overlay = config.overlayColor || "rgba(0,0,0,0.75)";

  return (
    <div
      className="pp-overlay"
      style={{ background: overlay }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome video"
    >
      <div className="pp-card" onClick={(e) => e.stopPropagation()}>

        {/* ── Video ── */}
        <div className="pp-video-wrap">
          {isYT ? (
            <iframe
              src={`${config.videoUrl}${config.autoPlay ? "?autoplay=1&mute=1&rel=0&modestbranding=1" : "?rel=0"}`}
              allow="autoplay;encrypted-media;fullscreen"
              allowFullScreen
              title="Popup video"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={config.videoUrl}
                poster={config.posterUrl || undefined}
                autoPlay={config.autoPlay}
                muted
                loop={!config.closeAfter}
                playsInline
                onPlay={() => setShowOverlay(false)}
                onPause={() => setShowOverlay(true)}
                onEnded={() => setShowOverlay(true)}
              />
              {showPlayOverlay && (
                <div className="pp-play-overlay" onClick={togglePlay}>
                  <div className="pp-play-btn">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={accent}>
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              )}
            </>
          )}

          {config.showCloseButton && (
            <button className="pp-close" onClick={handleClose} aria-label="Close">
              ×
            </button>
          )}

          {config.closeAfter > 0 && (
            <div className="pp-progress">
              <div
                className="pp-progress-fill"
                style={{ width: `${progress}%`, background: accent }}
              />
            </div>
          )}
        </div>

        {/* ── Body ── */}
        {(config.title || config.subtitle || config.ctaText) && (
          <div className="pp-body">
            <div className="pp-badge">
              <div className="pp-badge-dot" style={{ background: accent }} />
              <span className="pp-badge-text">BioBurg Healthcare</span>
            </div>

            {config.title    && <h2 className="pp-title">{config.title}</h2>}
            {config.subtitle && <p  className="pp-sub">{config.subtitle}</p>}

            <div className="pp-actions">
              {config.ctaText && (
                <a
                  href={config.ctaLink || "/"}
                  className="pp-cta"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  }}
                  onClick={handleClose}
                >
                  {config.ctaText}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </a>
              )}
              <button className="pp-dismiss" onClick={handleClose}>
                No thanks, close
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}