// marketingAgent/pages/VisualAds.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const BASE = API_BASE_URL;

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("agentToken")}`,
});

/* ─── Fullscreen Lightbox ─────────────────────────────────── */
function Lightbox({ ads, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const videoRef = useRef();
  const ad = ads[index];

  const prev = useCallback(() => setIndex((i) => (i - 1 + ads.length) % ads.length), [ads.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % ads.length), [ads.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  // Auto-play video with audio when it changes
  useEffect(() => {
    if (ad?.mediaType === "video" && videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {
        // Fallback: play muted if autoplay blocked
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      });
    }
  }, [ad, index]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{ backdropFilter: "none" }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white text-xl font-bold transition-all border border-white/20"
        style={{ backdropFilter: "blur(8px)" }}
      >
        ×
      </button>

      {/* Counter */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-white text-xs font-semibold tracking-widest"
        style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        {index + 1} / {ads.length}
      </div>

      {/* Prev */}
      {ads.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl font-bold transition-all border border-white/20"
          style={{ backdropFilter: "blur(8px)" }}
        >
          ‹
        </button>
      )}

      {/* Next */}
      {ads.length > 1 && (
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl font-bold transition-all border border-white/20"
          style={{ backdropFilter: "blur(8px)" }}
        >
          ›
        </button>
      )}

      {/* Media */}
      <div className="w-full h-full flex items-center justify-center">
        {ad.mediaType === "video" ? (
          <video
            ref={videoRef}
            key={ad._id}
            src={ad.mediaUrl}
            controls
            playsInline
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: "calc(100vh - 140px)" }}
          />
        ) : (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: "calc(100vh - 140px)" }}
          />
        )}
      </div>

      {/* Bottom info panel */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-6 py-4"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
      >
        <h3 className="text-white font-semibold text-base leading-tight">{ad.title}</h3>
        {ad.description && (
          <p className="text-gray-300 text-sm mt-1 line-clamp-2">{ad.description}</p>
        )}
        {/* Linked products */}
        {ad.linkedProducts?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {ad.linkedProducts.map((p) => (
              <span
                key={p._id || p}
                className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(59,130,246,0.3)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.4)" }}
              >
                {typeof p === "object" ? p.title || p.name : p}
              </span>
            ))}
          </div>
        )}
        {ad.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {ad.tags.map((t) => (
              <span key={t} className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                #{t}
              </span>
            ))}
          </div>
        )}
        {/* Thumbnail strip */}
        {ads.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {ads.map((a, i) => (
              <button
                key={a._id}
                onClick={() => setIndex(i)}
                className="flex-shrink-0 rounded overflow-hidden transition-all"
                style={{
                  width: 48,
                  height: 34,
                  outline: i === index ? "2px solid #60a5fa" : "2px solid transparent",
                  outlineOffset: 1,
                  opacity: i === index ? 1 : 0.55,
                }}
              >
                {a.mediaType === "video" ? (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs">▶</div>
                ) : (
                  <img src={a.mediaUrl} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Ad Card ──────────────────────────────────────────────── */
function AdCard({ ad, onClick }) {
  const videoRef = useRef();

  const handleMouseEnter = () => {
    if (ad.mediaType === "video" && videoRef.current) {
      videoRef.current.muted = true; // muted preview on hover
      videoRef.current.play().catch(() => {});
    }
  };
  const handleMouseLeave = () => {
    if (ad.mediaType === "video" && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Media */}
      <div className="relative bg-gray-100 overflow-hidden" style={{ paddingBottom: "62.5%" }}>
        <div className="absolute inset-0">
          {ad.mediaType === "video" ? (
            <>
              <video
                ref={videoRef}
                src={ad.mediaUrl}
                poster={ad.thumbnailUrl || undefined}
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-200">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
              <span className="absolute bottom-2 left-2 bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full tracking-wide">
                VIDEO
              </span>
              {/* Audio hint */}
              <span className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                🔊 Click for audio
              </span>
            </>
          ) : (
            <img
              src={ad.mediaUrl}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          {/* Fullscreen hint */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 mb-0.5">{ad.title}</h3>
        {ad.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ad.description}</p>
        )}
        {/* Linked products */}
        {ad.linkedProducts?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {ad.linkedProducts.slice(0, 2).map((p) => (
              <span key={p._id || p} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {typeof p === "object" ? p.title || p.name : p}
              </span>
            ))}
            {ad.linkedProducts.length > 2 && (
              <span className="text-xs text-gray-400">+{ad.linkedProducts.length - 2} more</span>
            )}
          </div>
        )}
        {ad.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{t}</span>
            ))}
            {ad.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{ad.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function VisualAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE}/api/agent/visual-ads`, {
        headers: authHeader(),
      });
      setAds(data.ads || []);
    } catch {
      setError("Failed to load ads. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const filtered = ads.filter((ad) => {
    const matchType = filter === "all" || ad.mediaType === filter;
    const matchSearch =
      !search ||
      ad.title.toLowerCase().includes(search.toLowerCase()) ||
      (ad.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (ad.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      (ad.linkedProducts || []).some((p) =>
        (typeof p === "object" ? (p.title || p.name || "") : p)
          .toLowerCase().includes(search.toLowerCase())
      );
    return matchType && matchSearch;
  });

  const counts = {
    all: ads.length,
    image: ads.filter((a) => a.mediaType === "image").length,
    video: ads.filter((a) => a.mediaType === "video").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">Visual / Digital Ads</h1>
            <p className="text-sm text-gray-500 mt-0.5">Marketing materials shared with you — click any ad to view fullscreen</p>
          </div>
          <button
            onClick={fetchAds}
            className="text-sm text-gray-500 border rounded-xl px-3 py-2 hover:bg-gray-50 transition w-fit"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-5">
        {/* Filter tabs + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { key: "all", label: `All (${counts.all})` },
              { key: "image", label: `Images (${counts.image})` },
              { key: "video", label: `Videos (${counts.video})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === tab.key
                    ? "bg-white shadow-sm text-blue-700 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ads, products, tags..."
              className="w-full border rounded-xl px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={fetchAds} className="mt-3 text-blue-600 text-sm underline">Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base font-medium">No ads available</p>
            <p className="text-sm mt-1">
              {ads.length > 0 ? "Try a different filter or search term" : "Your team hasn't uploaded any ads yet"}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((ad, i) => (
              <AdCard
                key={ad._id}
                ad={ad}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          ads={filtered}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}