import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

// === Card Component (Sirf Image) ===
function AdBannerCard({ imageUrl }) {
  return (
    <div className="p-2 flex-shrink-0 w-80">
      <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105">
        <div className="w-full h-auto flex items-center justify-center bg-white">
          <img src={imageUrl} alt="Ad Banner" className="max-w-full max-h-full object-contain" />
        </div>
      </div>
    </div>
  );
}

// === Main Slider Component ===
function AdBannerSlider() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = API_BASE_URL;

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/banners`);
        const data = await res.json();
        setBanners(data);
      } catch (err) {
        console.error("Ad Banners fetch karne me error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  if (loading || banners.length === 0) return null;

  return (
    <div className="w-full py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_10%,_black_90%,transparent_100%)] slider-container">
          {/* First Loop */}
          <div className="animate-marquee flex">
            {banners.map((item) => (
              <AdBannerCard key={item._id + "-1"} imageUrl={`${BACKEND_URL}${item.imageUrl}`} />
            ))}
          </div>

          {/* Second Loop (for continuous scroll) */}
          <div className="animate-marquee flex" aria-hidden="true">
            {banners.map((item) => (
              <AdBannerCard key={item._id + "-2"} imageUrl={`${BACKEND_URL}${item.imageUrl}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdBannerSlider;
