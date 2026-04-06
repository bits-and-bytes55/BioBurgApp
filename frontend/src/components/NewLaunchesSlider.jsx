import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { API_BASE_URL } from "../config/api";

import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

function LaunchCard({ imageUrl, productName, mrp, price }) {

  const calculateDiscount = () => {
    if (!mrp || !price || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const discountPercent = calculateDiscount();

  return (
    <div className="p-1">
      <div className="bg-white rounded-xl shadow-md overflow-hidden 
                      transition-transform duration-200 ease-in-out hover:scale-[1.02]">

        {/* Product Image */}
        <div className="w-full h-32 flex items-center justify-center p-2 bg-white">
          <img 
            src={imageUrl} 
            alt={productName} 
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <hr />

        {/* Green Details Box */}
        <div className="bg-green-800 text-white p-2">
          <p className="font-semibold text-xs truncate">{productName}</p>
          <p className="text-[10px]">MRP ₹{mrp}</p>
          <p className="text-xs font-bold">
            ₹{price}
            {discountPercent > 0 && (
              <span className="text-[10px] font-normal ml-1">({discountPercent}% OFF)</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function NewLaunchesSlider() {
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = `${API_BASE_URL}/api/launches`;

  useEffect(() => {
    const fetchLaunches = async () => {
      try {
        const res = await fetch(BACKEND_URL);
        const data = await res.json();
        setLaunches(data);
      } catch (err) {
        console.error("Launch fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLaunches();
  }, []);

const settings = {
  infinite: true,
  slidesToShow: 5,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 0,
  speed: 10000,          // ✅ slow smooth scrolling
  cssEase: "linear",
  arrows: false,
  pauseOnHover: false,
  pauseOnFocus: false,
  draggable: false,      // ✅ user drag se stop nahi karega
  swipe: false,
  touchMove: false,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 4 } },
    { breakpoint: 768, settings: { slidesToShow: 3 } },
    { breakpoint: 480, settings: { slidesToShow: 2 } }
  ]
};




  if (loading || launches.length === 0) return null;

  return (
    <div className="w-full py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold">New Launches</h2>
        <p className="text-gray-600 mb-4">New wellness range just for you!</p>

        <Slider {...settings}>
          {launches.map((item) => (
            <LaunchCard 
              key={item._id}
              imageUrl={`${API_BASE_URL}${item.imageUrl}`}
              productName={item.productName}
              mrp={item.mrp}
              price={item.price}
            />
          ))}
        </Slider>
      </div>
    </div>
  );
}

export default NewLaunchesSlider;
