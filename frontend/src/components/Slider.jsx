import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { IconButton } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import { API_BASE_URL } from "../config/api";

const BASE_API = API_BASE_URL;

function optimizeCloudinaryUrl(url, width = 1200) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace(
    "/upload/",
    `/upload/w_${width},f_auto,q_auto,c_limit/`
  );
}

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    axios
      .get(`${BASE_API}/api/home-sliders`)
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.sliders)
          ? res.data.sliders
          : [];
        setSlides(data.filter((s) => s.isActive !== false));
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Slider load error", err);
        setLoaded(true);
      });
  }, []);

  const next = useCallback(
    () => setCurrent((p) => (slides.length ? (p + 1) % slides.length : 0)),
    [slides.length]
  );
  const prev = () =>
    setCurrent((p) => (p === 0 ? slides.length - 1 : p - 1));

  useEffect(() => {
    if (!slides.length || paused) return;
    const t = setInterval(next, 3500);
    return () => clearInterval(t);
  }, [next, paused, slides.length]);

  //  Skeleton 
  if (!loaded || !slides.length) {
    return (
      <div className="w-full px-3 sm:px-5">
        <div className="flex gap-3">
          <div
            className="w-full sm:w-[80%] rounded-xl bg-gray-100 animate-pulse"
            style={{ aspectRatio: "16/5" }}
          />
          <div
            className="hidden sm:block w-[20%] rounded-xl bg-gray-100 animate-pulse"
            style={{ aspectRatio: "16/5" }}
          />
        </div>
      </div>
    );
  }

  // Use first slide's admin dimensions to set aspect ratio (default 16:5 = 1920×600)
  const firstSlide  = slides[0] || {};
  const bannerW     = firstSlide.width  || 1920;
  const bannerH     = firstSlide.height || 600;
  const aspectRatio = `${bannerW} / ${bannerH}`;

  return (
    <div className="w-full px-3 sm:px-5">
      <div className="flex gap-3 sm:gap-4 items-stretch">

        {/*  LEFT: Main banner slider  */}
        <div
          className="relative w-full sm:w-[80%] overflow-hidden rounded-xl shadow-md bg-[#f8fafc]"
          style={{ aspectRatio }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Slide strip — width = N × 100%, slides side-by-side */}
          <div
            className="absolute inset-0 flex transition-transform duration-700 ease-in-out will-change-transform"
            style={{
              width: `${slides.length * 100}%`,
              transform: `translateX(-${(current * 100) / slides.length}%)`,
            }}
          >
            {slides.map((s, idx) => (
              <div
                key={s._id || idx}
                style={{ width: `${100 / slides.length}%`, flexShrink: 0, height: "100%" }}
              >
                <img
                  src={optimizeCloudinaryUrl(s.image, 1600)}
                  alt={`Banner ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: s.objectFit || "contain",
                    objectPosition: "center",
                    display: "block",
                    background: (s.objectFit || "contain") === "contain" ? "#f8fafc" : "transparent",
                  }}
                  loading={idx === 0 ? "eager" : "lazy"}
                  fetchPriority={idx === 0 ? "high" : "low"}
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Prev arrow */}
          <IconButton
            onClick={prev}
            size="small"
            sx={{
              position: "absolute", top: "50%", left: { xs: 4, sm: 10 },
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.85)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              width: { xs: 28, sm: 36 }, height: { xs: 28, sm: 36 },
              zIndex: 10,
              "&:hover": { bgcolor: "#fff", transform: "translateY(-50%) scale(1.1)" },
              transition: "all 0.2s",
            }}
          >
            <ArrowBackIosNew sx={{ fontSize: { xs: 11, sm: 15 } }} />
          </IconButton>

          {/* Next arrow */}
          <IconButton
            onClick={next}
            size="small"
            sx={{
              position: "absolute", top: "50%", right: { xs: 4, sm: 10 },
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.85)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              width: { xs: 28, sm: 36 }, height: { xs: 28, sm: 36 },
              zIndex: 10,
              "&:hover": { bgcolor: "#fff", transform: "translateY(-50%) scale(1.1)" },
              transition: "all 0.2s",
            }}
          >
            <ArrowForwardIos sx={{ fontSize: { xs: 11, sm: 15 } }} />
          </IconButton>

          {/* Dot indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  style={{
                    width: current === idx ? 20 : 7,
                    height: 7,
                    borderRadius: 4,
                    background: current === idx ? "#fff" : "rgba(255,255,255,0.5)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.3s, background 0.3s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Franchise card (desktop only)  */}
        <div
          className="hidden sm:block w-[20%] rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-gray-50"
          style={{ aspectRatio }}
        >
          <img
            src="/homesliderimages/franchiseImage.jpg"
            className="w-full h-full object-contain"
            alt="Franchise"
            loading="lazy"
          />
        </div>

      </div>
    </div>
  );
}