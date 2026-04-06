import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

// === Naya Card Component (Health Article) ===
function HealthArticleCard({ imageUrl, heading }) {
  return (
    // Card ka width set karein (Image ke hisaab se)
    <div className="flex-shrink-0 w-64 mx-3">
      {" "}
      {/* Width adjust kar sakte hain */}
      <div
        className="bg-white rounded-2xl shadow-md overflow-hidden 
                      transition-transform duration-300 ease-in-out hover:scale-105"
      >
        {/* Image Box */}
        <div className="w-full h-40 flex items-center justify-center p-4 bg-white">
          <img
            src={imageUrl}
            alt={heading}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Horizontal Line */}
        <hr />

        {/* Heading Box */}
        <div className="p-4">
          <p className="font-semibold text-sm text-gray-800 truncate">
            {heading}
          </p>
        </div>
      </div>
    </div>
  );
}

// === Main Slider Component (Marquee wala) ===
function HealthArticlesSlider() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = API_BASE_URL;

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health-articles`);
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        console.error("Health Articles fetch karne me error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  if (loading || articles.length === 0) {
    return null;
  }

  // --- 1. BUG FIX: 'duplicatedArticles' waali line yahaan se hata di hai ---

  return (
    <div className="w-full py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Title aur Subtitle */}
        <h2 className="text-3xl font-bold">Health Articles</h2>
        <p className="text-gray-600 mb-6">
          Get up-to-date on our latest health updates
        </p>

        {/* Marquee Slider Container */}
        {/* 2. BUG FIX: 'slider-container' class add ki (jaisa pichli baar kiya tha) */}
        <div
          className="w-full inline-flex flex-nowrap overflow-hidden 
                     [mask-image:_linear-gradient(to_right,transparent_0,_black_10%,_black_90%,transparent_100%)]
                     slider-container" // <-- Ye class zaroori hai
        >
          {/* Pehli List */}
          {/* 3. BUG FIX: 'animate-marquee' class ka istemal kiya */}
          <div className="flex items-center justify-start animate-marquee">
            {/* 4. BUG FIX: 'articles.map' ka istemal kiya */}
            {articles.map((item, index) => (
              <HealthArticleCard
                key={`${item._id}-${index}`}
                imageUrl={`${BACKEND_URL}${item.imageUrl}`}
                heading={item.heading}
              />
            ))}
          </div>

          {/* Doosri List (Loop ke liye) */}
          <div
            className="flex items-center justify-start animate-marquee" // <-- Yahaan bhi
            aria-hidden="true"
          >
            {/* 4. BUG FIX: Yahaan bhi 'articles.map' ka istemal kiya */}
            {articles.map((item, index) => (
              <HealthArticleCard
                key={`${item._id}-${index}-dup`}
                imageUrl={`${BACKEND_URL}${item.imageUrl}`}
                heading={item.heading}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthArticlesSlider;
