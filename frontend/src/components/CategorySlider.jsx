import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

function CategoryCard({ imageUrl, title, discount }) {
  return (
    <div className="flex-shrink-0 w-48 mx-4 my-2">
      <div
        className="relative bg-white rounded-2xl shadow-md w-full h-40 
                   flex items-center justify-center p-4 
                   overflow-hidden transition-transform duration-300 
                   ease-in-out hover:scale-105 cursor-pointer"
      >
        {discount > 0 && (
          <div
            className="absolute top-2 left-2 bg-red-500 text-white 
                        text-xs font-bold px-2 py-1 rounded-full z-10"
          >
            {discount}% OFF
          </div>
        )}
        <img
          src={imageUrl}
          alt={title}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <p className="mt-3 text-center font-medium text-gray-700 text-sm truncate">
        {title}
      </p>
    </div>
  );
}

function CategorySlider({ refresh }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = API_BASE_URL;

  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/categories`);
      const data = await res.json();

export default function CategoriesSlider() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  const handleCategoryClick = (cat) => {
    navigate(`/category/${cat.title}?type=main`);
  };

  useEffect(() => {
    axios.get(`${API_BASE}/api/categories/main`).then((res) => {
      if (res.data.success) setData(res.data.categories);
    });
  }, []);

  return (
    <div className="py-3 px-4 bg-white relative">
      {/* LEFT ARROW */}
      <button
        className="absolute left-1 top-1/2 -translate-y-1/2 z-30
          bg-white shadow-md rounded-full w-8 h-8 flex items-center justify-center
          hover:bg-gray-100 transition text-gray-600 text-sm"
        onClick={() => sliderRef.current?.slidePrev()}
        aria-label="Previous"
      >
        ❮
      </button>

      {/* RIGHT ARROW */}
      <button
        className="absolute right-1 top-1/2 -translate-y-1/2 z-30
          bg-white shadow-md rounded-full w-8 h-8 flex items-center justify-center
          hover:bg-gray-100 transition text-gray-600 text-sm"
        onClick={() => sliderRef.current?.slideNext()}
        aria-label="Next"
      >
        ❯
      </button>

      <Swiper
        modules={[Autoplay, Navigation]}
        onSwiper={(swiper) => (sliderRef.current = swiper)}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        loop={data.length > 6}
        navigation={false}
        spaceBetween={8}
        // ✅ Responsive breakpoints — screens from 320px to 1280px+
        breakpoints={{
          0:    { slidesPerView: 3, spaceBetween: 6  },   // xs phones
          400:  { slidesPerView: 4, spaceBetween: 8  },   // small phones
          540:  { slidesPerView: 5, spaceBetween: 8  },   // large phones
          640:  { slidesPerView: 6, spaceBetween: 10 },   // tablets portrait
          768:  { slidesPerView: 7, spaceBetween: 10 },   // tablets landscape
          1024: { slidesPerView: 9, spaceBetween: 10 },   // small desktop
          1280: { slidesPerView: 11, spaceBetween: 10 },  // full desktop
        }}
        className="px-4"
      >
        {data.map((cat) => (
          <SwiperSlide key={cat._id}>
            <div
              onClick={() => handleCategoryClick(cat)}
              className="flex flex-col items-center cursor-pointer group"
            >
              {/* Image box — square, responsive via aspect-ratio */}
              <div className="w-full aspect-square overflow-hidden rounded-xl bg-[#f5f5f5] border border-gray-100
                group-hover:shadow-md group-hover:-translate-y-[2px] transition-all duration-300">
                <img
                  src={cat.image?.url}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                  loading="lazy"
                />
              </div>

              {/* Label */}
              <h2 className="text-center text-[11px] sm:text-[12px] font-semibold text-gray-700 mt-1.5 leading-tight px-0.5 line-clamp-2">
                {cat.title}
              </h2>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default CategorySlider;
