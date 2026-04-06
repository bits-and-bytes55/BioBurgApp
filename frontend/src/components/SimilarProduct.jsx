import React, { useEffect, useState } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;


export default function SimilarProducts({ productId }) {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!productId) return;

    const fetchSimilar = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/admin/products/product/${productId}`);
        setSimilar(res.data.similarProducts || []);
      } catch (error) {
        console.log("Error fetching similar products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [productId]);

  if (loading) {
    return <h3>Loading Similar Products...</h3>;
  }

  if (!similar.length) {
    return null; // no similar products
  }

  return (
    <div className="similar-container">
      <h2 className="similar-title">Similar Products</h2>

      <Swiper
        slidesPerView={3}
        spaceBetween={10}
        autoplay={{ delay: 2000 }}
        modules={[Autoplay]}
      >
        {similar.map((item) => (
          <SwiperSlide key={item._id}>
            <div
              className="sim-card"
              onClick={() => navigate(`/product/${item._id}`)}
            >
              <div className="sim-img-box">
                <img src={item.image} alt={item.name} />

                {item.mrp && item.price && (
                  <span className="sim-discount">
                    {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                  </span>
                )}
              </div>

              <h4 className="sim-title">{item.name}</h4>

              <div className="sim-price-box">
                <span className="sim-price">₹{item.price}</span>
                <span className="sim-mrp">₹{item.mrp}</span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
