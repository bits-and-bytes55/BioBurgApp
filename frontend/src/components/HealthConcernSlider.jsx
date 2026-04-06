import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/navigation'
import { Autoplay, Navigation } from 'swiper/modules'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export default function CategoriesSlider () {
  const [data, setData] = useState([])
  const navigate = useNavigate()
  const sliderRef = useRef(null)

  // ⭐ Main Category Click
  const handleCategoryClick = cat => {
    navigate(`/category/${cat.title}?type=main`)
  }

  // ⭐ Fetch Main Categories
  useEffect(() => {
    axios.get(`${API_BASE}/api/categories/main`).then(res => {
      if (res.data.success) setData(res.data.categories)
    })
  }, [])

  return (
    <>
      <h2 className='text-3xl font-bold px-5 mt-2'>Health Concern</h2>
      <p className='text-xl mb-3 px-8'>Shop by disease</p>
      <div className='py-3 px-1 bg-white relative'>
        {/* LEFT ARROW */}
        <button
          className='
        absolute left-1 top-1/2 -translate-y-1/2 z-30 
        bg-white shadow-lg rounded-full w-8 h-8 flex items-center justify-center 
        hover:bg-gray-100 transition
      '
          onClick={() => sliderRef.current?.slidePrev()}
        >
          ❮
        </button>

        {/* RIGHT ARROW */}
        <button
          className='
        absolute right-1 top-1/2 -translate-y-1/2 z-30 
        bg-white shadow-lg rounded-full w-8 h-8 flex items-center justify-center 
        hover:bg-gray-100 transition
      '
          onClick={() => sliderRef.current?.slideNext()}
        >
          ❯
        </button>

        <Swiper
          modules={[Autoplay, Navigation]}
          onSwiper={swiper => (sliderRef.current = swiper)}
          autoplay={{ delay: 2000, disableOnInteraction: false }}
          loop={false}
          navigation={false} // we use custom arrows instead
          slidesPerView={10}
          spaceBetween={10}
          className='px-1'
        >
          {data.map(cat => (
            <SwiperSlide key={cat._id} style={{ width: '120px' }}>
              <div
                onClick={() => handleCategoryClick(cat)}
                className='
                  bg-white rounded-xl  
                overflow-hidden cursor-pointer transition-all duration-300
                hover:shadow-md hover:-translate-y-[2px]
              '
              >
                <div className='h-28 w-full overflow-hidden  bg-[#f9f9f9]'>
                  {/* ⭐ FIXED → CLOUDINARY IMAGE DIRECT URL */}
                  <img
                    src={cat.image?.url}
                    alt={cat.title}
                    className='border border-gray-200 w-full h-full object-cover transition-transform duration-300 hover:scale-[1.04]'
                  />
                </div>

                <h2 className='text-center text-[13px] font-semibold text-gray-800 py-2'>
                  {cat.title}
                </h2>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  )
}
