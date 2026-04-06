import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export default function ProductSlider() {
  const banners = [
    "https://static.oxinis.com/healthmug/image/asset/7395-uv.webp",
    "https://static.oxinis.com/healthmug/image/asset/7399-by.webp",
    "https://static.oxinis.com/healthmug/image/asset/7396-tw.webp",
  ];

  return (
    <div className="w-full relative mt-4">

      <Swiper
        modules={[Navigation]}
        navigation={true}
        loop={true}
        slidesPerView={1}
        autoplay={false}
        className="rounded-xl overflow-hidden shadow-md"
      >
        {banners.map((img, index) => (
          <SwiperSlide key={index}>
            <img
              src={img}
              alt="banner"
              className="w-full h-[380px] object-cover rounded-xl"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
