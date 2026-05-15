import React, { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

  @keyframes pp-fade-in   { from{opacity:0} to{opacity:1} }
  @keyframes pp-slide-up  { from{opacity:0;transform:translateY(32px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes pp-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(.85)} }
  @keyframes pp-mini-in   { from{opacity:0;transform:translateY(20px) scale(.85)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes pp-spin      { to{transform:rotate(360deg)} }
  @keyframes pp-slide-left  { from{opacity:0;transform:translateX(60px)}  to{opacity:1;transform:translateX(0)} }
  @keyframes pp-slide-right { from{opacity:0;transform:translateX(-60px)} to{opacity:1;transform:translateX(0)} }

  .pp-overlay{
    position:fixed;inset:0;z-index:99999;
    display:flex;align-items:center;justify-content:center;padding:16px;
    animation:pp-fade-in .35s ease forwards;
    font-family:'DM Sans',sans-serif;
    pointer-events:all;
  }
  .pp-overlay::before{
    content:'';position:absolute;inset:0;
    backdrop-filter:blur(6px) saturate(1.2);
    -webkit-backdrop-filter:blur(6px) saturate(1.2);
    background:var(--pp-overlay, rgba(0,0,0,0.75));
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

  .pp-slide-left  { animation:pp-slide-left  .35s ease forwards; }
  .pp-slide-right { animation:pp-slide-right .35s ease forwards; }

  .pp-video-wrap{
    position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden;
  }
  .pp-video-wrap video,
  .pp-video-wrap iframe{
    width:100%;height:100%;border:none;display:block;object-fit:cover;
  }
  .pp-video-wrap::after{
    content:'';position:absolute;inset:auto 0 0 0;height:120px;
    background:linear-gradient(to bottom,transparent,#0b0f1a);
    pointer-events:none;
  }

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

  .pp-mute{
    position:absolute;top:14px;left:14px;z-index:20;
    width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.18);
    background:rgba(10,14,30,.7);backdrop-filter:blur(8px);
    color:#fff;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-size:16px;line-height:1;padding:0;
    transition:background .2s,border-color .2s,transform .15s;
  }
  .pp-mute:hover{background:rgba(37,99,235,.6);border-color:rgba(37,99,235,.5);transform:scale(1.1);}

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

  .pp-progress{
    position:absolute;bottom:0;left:0;right:0;height:3px;
    background:rgba(255,255,255,.1);z-index:10;
  }
  .pp-progress-fill{height:100%;transition:width .1s linear;}

  .pp-body{
    padding:20px 28px 28px;position:relative;z-index:2;
    background:#0b0f1a;
  }

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

  .pp-title{
    font-family:'Syne',sans-serif;
    font-size:clamp(20px,4vw,26px);font-weight:800;
    color:#fff;letter-spacing:-.4px;margin:0 0 6px;line-height:1.2;
  }
  .pp-sub{
    font-size:14px;color:rgba(255,255,255,.5);margin:0 0 22px;line-height:1.6;
  }
  .pp-actions{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}

  .pp-cta{
    display:inline-flex;align-items:center;gap:8px;
    padding:11px 24px;border-radius:12px;border:none;cursor:pointer;
    font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;
    letter-spacing:.1px;color:#fff;text-decoration:none;
    transition:opacity .2s,transform .15s,box-shadow .2s;
    box-shadow:0 4px 20px rgba(0,0,0,.3);
  }
  .pp-cta:hover{opacity:.88;transform:translateY(-1px);box-shadow:0 8px 28px rgba(0,0,0,.4);}

  .pp-dismiss{
    background:none;border:none;cursor:pointer;padding:0;
    font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;
    color:rgba(255,255,255,.3);transition:color .2s;
  }
  .pp-dismiss:hover{color:rgba(255,255,255,.65);}

  /* ── Carousel nav ── */
  .pp-nav{
    display:flex;align-items:center;justify-content:center;gap:8px;
    padding:0 28px 18px;background:#0b0f1a;position:relative;z-index:2;
  }
  .pp-nav-arrow{
    width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.15);
    background:rgba(255,255,255,.07);color:#fff;cursor:pointer;
    display:flex;align-items:center;justify-content:center;font-size:14px;
    transition:background .2s,transform .15s;flex-shrink:0;
  }
  .pp-nav-arrow:hover{background:rgba(255,255,255,.18);transform:scale(1.1);}
  .pp-nav-arrow:disabled{opacity:.25;cursor:default;transform:none;}
  .pp-dots{display:flex;gap:6px;align-items:center;}
  .pp-dot{
    width:7px;height:7px;border-radius:50%;
    background:rgba(255,255,255,.2);border:none;cursor:pointer;padding:0;
    transition:background .2s,transform .2s;
  }
  .pp-dot.active{transform:scale(1.3);}
  .pp-counter{
    font-size:11px;font-weight:600;color:rgba(255,255,255,.3);
    letter-spacing:.5px;min-width:36px;text-align:center;
  }

  /* ── MINI PLAYER ── */
  .pp-mini{
    position:fixed;
    bottom:20px;left:20px;
    z-index:99999;
    width:260px;
    border-radius:16px;
    overflow:hidden;
    background:#0b0f1a;
    box-shadow:
      0 0 0 1px rgba(255,255,255,.1),
      0 20px 60px rgba(0,0,0,.6),
      0 0 40px rgba(37,99,235,.15);
    animation:pp-mini-in .4s cubic-bezier(.34,1.4,.64,1) forwards;
    font-family:'DM Sans',sans-serif;
    cursor:pointer;
  }
  .pp-mini:hover .pp-mini-overlay{ opacity:1; }

  .pp-mini-video-wrap{
    position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden;
  }
  .pp-mini-video-wrap video,
  .pp-mini-video-wrap iframe{
    width:100%;height:100%;border:none;display:block;object-fit:cover;
  }
  .pp-mini-overlay{
    position:absolute;inset:0;
    background:rgba(0,0,0,.45);
    opacity:0;transition:opacity .2s;
    display:flex;align-items:center;justify-content:center;gap:10px;
  }
  .pp-mini-icon-btn{
    width:30px;height:30px;border-radius:50%;
    background:rgba(255,255,255,.9);
    display:flex;align-items:center;justify-content:center;
    font-size:13px;border:none;cursor:pointer;
    transition:transform .15s;flex-shrink:0;
  }
  .pp-mini-icon-btn:hover{transform:scale(1.15);}

  .pp-mini-body{
    padding:10px 12px 12px;
    background:linear-gradient(to bottom,#0f1629,#0b0f1a);
  }
  .pp-mini-title{
    font-size:12px;font-weight:700;color:#fff;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px;
  }
  .pp-mini-actions{
    display:flex;align-items:center;justify-content:space-between;gap:6px;
  }
  .pp-mini-expand{
    font-size:10px;font-weight:700;color:rgba(255,255,255,.5);
    background:rgba(255,255,255,.07);border:none;cursor:pointer;
    border-radius:6px;padding:4px 10px;transition:background .2s,color .2s;
    letter-spacing:.3px;text-transform:uppercase;
  }
  .pp-mini-expand:hover{background:rgba(255,255,255,.15);color:#fff;}
  .pp-mini-close{
    font-size:14px;color:rgba(255,255,255,.35);background:none;border:none;
    cursor:pointer;padding:2px 5px;border-radius:5px;transition:color .2s;line-height:1;
  }
  .pp-mini-close:hover{color:#ef4444;}
  .pp-mini-mute{
    font-size:10px;font-weight:700;color:rgba(255,255,255,.4);
    background:rgba(255,255,255,.06);border:none;cursor:pointer;
    border-radius:6px;padding:4px 8px;transition:background .2s,color .2s;
    text-transform:uppercase;letter-spacing:.3px;
  }
  .pp-mini-mute:hover{background:rgba(37,99,235,.3);color:#93c5fd;}

  @media(max-width:480px){
    .pp-card{border-radius:18px;}
    .pp-body{padding:16px 18px 22px;}
    .pp-title{font-size:20px;}
    .pp-mini{width:220px;bottom:14px;left:14px;}
  }
`;

export default function PopupVideoPlayer() {
  const [configs, setConfigs]           = useState([]);
  const [index, setIndex]               = useState(0);
  const [slideAnim, setSlideAnim]       = useState("");
  const [phase, setPhase]               = useState("hidden"); // hidden | full | mini | gone
  const [manuallyExpanded, setManuallyExpanded] = useState(false); // ← key flag
  const [progress, setProgress]         = useState(0);
  const [showPlayOverlay, setShowOverlay] = useState(true);
  const [muted, setMuted]               = useState(true);

  const videoRef     = useRef(null);
  const miniRef      = useRef(null);
  const timerRef     = useRef(null);
  const rafRef       = useRef(null);
  const startRef     = useRef(null);
  const miniTimerRef = useRef(null);

  const config = configs[index] ?? null;

  /* Inject styles once */
  useEffect(() => {
    if (document.getElementById("pp-styles")) return;
    const el = document.createElement("style");
    el.id = "pp-styles";
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  /* Fetch all active configs */
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;

    fetch(`${API_BASE}/api/popup-video/active-all`)
      .then(r => r.json())
      .then(data => {
        const list = data?.configs ?? [];
        if (!list.length) return;

        // Filter out seen-once popups
        const filtered = list.filter(cfg => {
          if (cfg.showOnce && sessionStorage.getItem(`pp_seen_${cfg.videoUrl}`) === "1") return false;
          return true;
        });
        if (!filtered.length) return;

        setConfigs(filtered);
        const delay = (filtered[0]?.showDelay ?? 2) * 1000;
        setTimeout(() => setPhase("full"), delay);
      })
      .catch(() => {});
  }, []);

  /* Sync muted to video elements */
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
    if (miniRef.current)  miniRef.current.muted  = muted;
  }, [muted]);

  /* Auto-close progress bar */
  useEffect(() => {
    if (phase !== "full" || !config?.closeAfter) return;
    const total = config.closeAfter * 1000;
    startRef.current = Date.now();
    const tick = () => {
      const pct = Math.min(((Date.now() - startRef.current) / total) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(() => shrinkToMini(), total);
    return () => { clearTimeout(timerRef.current); cancelAnimationFrame(rafRef.current); };
  }, [phase, config]);

  /* Auto-minimize after 3s — ONLY on first load, not after manual expand */
  useEffect(() => {
    if (phase !== "full" || manuallyExpanded) return; // ← skip if user expanded manually
    miniTimerRef.current = setTimeout(() => shrinkToMini(), 3000);
    return () => clearTimeout(miniTimerRef.current);
  }, [phase, manuallyExpanded]);

  const shrinkToMini = useCallback(() => {
    clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    clearTimeout(miniTimerRef.current);
    setPhase("mini");
  }, []);

  const handleClose = useCallback(() => {
    setPhase("gone");
    configs.forEach(cfg => {
      if (cfg.showOnce) sessionStorage.setItem(`pp_seen_${cfg.videoUrl}`, "1");
    });
    clearTimeout(timerRef.current);
    clearTimeout(miniTimerRef.current);
    cancelAnimationFrame(rafRef.current);
    videoRef.current?.pause();
    miniRef.current?.pause();
  }, [configs]);

  /* Manual expand — sets flag so auto-minimize never fires again */
  const expandToFull = useCallback(() => {
    setManuallyExpanded(true); // ← prevents auto-shrink
    setPhase("full");
    clearTimeout(miniTimerRef.current);
  }, []);

  const goTo = useCallback((newIndex, direction) => {
    setSlideAnim(direction === "next" ? "pp-slide-left" : "pp-slide-right");
    setTimeout(() => {
      setIndex(newIndex);
      setShowOverlay(true);
      setProgress(0);
      setSlideAnim("");
    }, 350);
  }, []);

  const goNext = () => { if (index < configs.length - 1) goTo(index + 1, "next"); };
  const goPrev = () => { if (index > 0) goTo(index - 1, "prev"); };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setShowOverlay(false); }
    else          { v.pause(); setShowOverlay(true); }
  };

  const toggleMiniPlay = () => {
    const v = miniRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  if (window.location.pathname.startsWith("/admin")) return null;
  if (phase === "hidden" || phase === "gone" || !config) return null;

  const isYT   = config.videoUrl?.includes("youtube.com") || config.videoUrl?.includes("youtu.be");
  const accent = config.accentColor || "#2563eb";
  const overlay= config.overlayColor || "rgba(0,0,0,0.75)";
  const multi  = configs.length > 1;

  /* ── MINI ── */
  if (phase === "mini") {
    return (
      <div className="pp-mini" onClick={expandToFull} title="Click to expand">
        <div className="pp-mini-video-wrap" onClick={e => e.stopPropagation()}>
          {isYT ? (
            <iframe
              src={`${config.videoUrl}?autoplay=1&mute=${muted ? 1 : 0}&rel=0&modestbranding=1`}
              allow="autoplay;encrypted-media;fullscreen"
              allowFullScreen
              title="Popup mini"
            />
          ) : (
            <video
              ref={miniRef}
              src={config.videoUrl}
              poster={config.posterUrl || undefined}
              autoPlay muted={muted} loop playsInline
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
            />
          )}
          <div className="pp-mini-overlay" onClick={e => e.stopPropagation()}>
            <button className="pp-mini-icon-btn" onClick={toggleMiniPlay}>⏯</button>
            <button className="pp-mini-icon-btn" onClick={() => setMuted(m => !m)} style={{ fontSize:14 }}>
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
        <div className="pp-mini-body" onClick={e => e.stopPropagation()}>
          {config.title && <div className="pp-mini-title">{config.title}</div>}
          <div className="pp-mini-actions">
            <button className="pp-mini-expand" onClick={expandToFull}>▲ Expand</button>
            <button className="pp-mini-mute" onClick={() => setMuted(m => !m)}>
              {muted ? "🔇 Muted" : "🔊 Live"}
            </button>
            <button className="pp-mini-close" onClick={handleClose}>✕</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── FULL ── */
  return (
    <div
      className="pp-overlay"
      style={{ "--pp-overlay": overlay }}
      onClick={e => { if (e.target === e.currentTarget) shrinkToMini(); }}
      role="dialog" aria-modal="true" aria-label="Welcome video"
    >
      <div className={`pp-card ${slideAnim}`} onClick={e => e.stopPropagation()}>

        {/* Video */}
        <div className="pp-video-wrap">
          {isYT ? (
            <iframe
              src={`${config.videoUrl}${config.autoPlay ? `?autoplay=1&mute=${muted?1:0}&rel=0&modestbranding=1` : "?rel=0"}`}
              allow="autoplay;encrypted-media;fullscreen"
              allowFullScreen title="Popup video"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={config.videoUrl}
                poster={config.posterUrl || undefined}
                autoPlay={config.autoPlay}
                muted={muted} loop={!config.closeAfter} playsInline
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

          {!isYT && (
            <button className="pp-mute" onClick={() => setMuted(m => !m)}
              aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? "🔇" : "🔊"}
            </button>
          )}

          {config.showCloseButton && (
            <button className="pp-close" onClick={handleClose} aria-label="Close">×</button>
          )}

          {config.closeAfter > 0 && (
            <div className="pp-progress">
              <div className="pp-progress-fill" style={{ width:`${progress}%`, background:accent }} />
            </div>
          )}
        </div>

        {/* Body */}
        {(config.title || config.subtitle || config.ctaText) && (
          <div className="pp-body">
            <div className="pp-badge">
              <div className="pp-badge-dot" style={{ background: accent }} />
              <span className="pp-badge-text">BioBurg Healthcare</span>
            </div>
            {config.title    && <h2 className="pp-title">{config.title}</h2>}
            {config.subtitle && <p className="pp-sub">{config.subtitle}</p>}
            <div className="pp-actions">
              {config.ctaText && (
                <a href={config.ctaLink || "/"} className="pp-cta"
                  style={{ background:`linear-gradient(135deg,${accent},${accent}cc)` }}
                  onClick={handleClose}>
                  {config.ctaText}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </a>
              )}
              <button className="pp-dismiss" onClick={shrinkToMini}>Minimize ↙</button>
            </div>
          </div>
        )}

        {/* Carousel nav — only shown when multiple popups */}
        {multi && (
          <div className="pp-nav">
            <button className="pp-nav-arrow" onClick={goPrev} disabled={index === 0}>‹</button>
            <div className="pp-dots">
              {configs.map((_, i) => (
                <button
                  key={i}
                  className={`pp-dot${i === index ? " active" : ""}`}
                  style={{ background: i === index ? accent : undefined }}
                  onClick={() => goTo(i, i > index ? "next" : "prev")}
                />
              ))}
            </div>
            <button className="pp-nav-arrow" onClick={goNext} disabled={index === configs.length - 1}>›</button>
            <span className="pp-counter">{index + 1}/{configs.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}