// marketingAgent/pages/VisualAds.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const BASE = API_BASE_URL;

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("agentToken")}`,
});

/* Lightbox  */
function Lightbox({ ad, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition"
        >
          ×
        </button>

        {ad.mediaType === "video" ? (
          <video
            src={ad.mediaUrl}
            controls
            autoPlay
            className="w-full max-h-[70vh] object-contain"
          />
        ) : (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full max-h-[70vh] object-contain"
          />
        )}

        <div className="bg-gray-900 px-5 py-4">
          <h3 className="text-white font-semibold text-sm">{ad.title}</h3>
          {ad.description && (
            <p className="text-gray-400 text-xs mt-1">{ad.description}</p>
          )}
          {ad.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ad.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Ad Card ──────────────────────────────────────────────── */
function AdCard({ ad, onClick }) {
  const videoRef = useRef();

  const handleMouseEnter = () => {
    if (ad.mediaType === "video" && videoRef.current) {
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
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(ad)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Media */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
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
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
              <div className="bg-black/40 rounded-full w-12 h-12 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
            {/* Video badge */}
            <span className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              VIDEO
            </span>
          </>
        ) : (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {/* Expand icon on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/50 rounded-lg w-8 h-8 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
          {ad.title}
        </h3>
        {ad.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {ad.description}
          </p>
        )}
        {ad.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {ad.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
              >
                #{t}
              </span>
            ))}
            {ad.tags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{ad.tags.length - 3}
              </span>
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
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "image" | "video"
  const [search, setSearch] = useState("");

  const fetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE}/api/agent/visual-ads`, {
        headers: authHeader(),
      });
      setAds(data.ads || []);
    } catch (err) {
      setError("Failed to load ads. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const filtered = ads.filter((ad) => {
    const matchType = filter === "all" || ad.mediaType === filter;
    const matchSearch =
      !search ||
      ad.title.toLowerCase().includes(search.toLowerCase()) ||
      (ad.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (ad.tags || []).some((t) =>
        t.toLowerCase().includes(search.toLowerCase())
      );
    return matchType && matchSearch;
  });

  const counts = {
    all: ads.length,
    image: ads.filter((a) => a.mediaType === "image").length,
    video: ads.filter((a) => a.mediaType === "video").length,
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Visual / Digital Ads</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Marketing materials shared with you by the team
        </p>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Tabs */}
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

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ads..."
            className="w-full border rounded-xl px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <button
          onClick={fetchAds}
          className="text-sm text-gray-500 border rounded-xl px-3 py-2 hover:bg-gray-50 transition w-fit"
        >
          🔄
        </button>
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
          <button
            onClick={fetchAds}
            className="mt-3 text-blue-600 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-base font-medium">No ads available</p>
          <p className="text-sm mt-1">
            {ads.length > 0
              ? "Try a different filter or search term"
              : "Your team hasn't uploaded any ads yet"}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ad) => (
            <AdCard key={ad._id} ad={ad} onClick={setLightbox} />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox ad={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}