import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

// Cloudinary: serve a small square thumbnail — fast load
function thumbUrl(url, size = 120) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/w_${size},h_${size},c_fill,f_auto,q_auto/`);
}

export default function CategoriesSlider() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate  = useNavigate();
  const swiperRef = useRef(null);

  // Main Category Click
  const handleCategoryClick = (cat) => {
    navigate(`/categories/${cat._id}?type=main`);
  };

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/categories/main`)
      .then((res) => {
        if (res.data.success) setData(res.data.categories);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Skeleton 
  if (loading) {
    return (
      <div className="py-3 px-6 bg-white flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: 72 }}>
            <div className="w-full aspect-square rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-2.5 w-3/4 rounded bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-2 bg-white relative">

      {/* ── Prev button ── */}
      <button
        onClick={() => swiperRef.current?.slidePrev()}
        aria-label="Previous"
        className="
          absolute left-0 top-1/2 -translate-y-1/2 z-20
          w-7 h-10 flex items-center justify-center
          bg-gradient-to-r from-white via-white to-transparent
          text-gray-500 hover:text-gray-800 transition
          text-xs font-bold select-none
        "
      >
        ❮
      </button>

      {/* ── Swiper ── */}
      <Swiper
        modules={[Autoplay]}
        onSwiper={(sw) => (swiperRef.current = sw)}
        autoplay={{ delay: 2800, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop={data.length > 8}
        breakpoints={{
          0:    { slidesPerView: 4,  spaceBetween: 4  },  
          400:  { slidesPerView: 5,  spaceBetween: 6  },  
          540:  { slidesPerView: 6,  spaceBetween: 8  }, 
          640:  { slidesPerView: 7,  spaceBetween: 8  },  
          768:  { slidesPerView: 8,  spaceBetween: 10 }, 
          1024: { slidesPerView: 10, spaceBetween: 10 },  
          1280: { slidesPerView: 12, spaceBetween: 10 },  
        }}
        className="!px-7"   // padding so edge items don't hide under arrows
      >
        {data.map((cat) => (
          <SwiperSlide key={cat._id}>
            <button
              onClick={() => handleCategoryClick(cat)}
              className="w-full flex flex-col items-center group focus:outline-none py-1"
            >
              {/* ── Image circle/square ── */}
              <div
                className="
                  w-full aspect-square overflow-hidden
                  rounded-2xl bg-[#f4f6f8] border border-gray-100
                  group-hover:shadow-md group-hover:-translate-y-[3px]
                  transition-all duration-300
                "
              >
                <img
                  src={thumbUrl(cat.image?.url, 160)}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* ── Label — never truncate with "..." mid-word ── */}
              <p
                className="
                  mt-1 w-full text-center leading-tight
                  text-gray-700 font-medium
                  text-[10px] sm:text-[11px] md:text-[12px]
                  line-clamp-2 break-words hyphens-auto
                "
                lang="en"
              >
                {cat.title}
              </p>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ── Next button ── */}
      <button
        onClick={() => swiperRef.current?.slideNext()}
        aria-label="Next"
        className="
          absolute right-0 top-1/2 -translate-y-1/2 z-20
          w-7 h-10 flex items-center justify-center
          bg-gradient-to-l from-white via-white to-transparent
          text-gray-500 hover:text-gray-800 transition
          text-xs font-bold select-none
        "
      >
        ❯
      </button>

    </div>
  );
}