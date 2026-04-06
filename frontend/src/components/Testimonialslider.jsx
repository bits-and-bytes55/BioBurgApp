import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

export default function TestimonialSlider () {
  const [data, setData] = useState([])
  const [videoModal, setVideoModal] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHover, setIsHover] = useState(false)

  const sliderRef = useRef(null)

  const BASE_API = 'https://bioburglifescience-1.onrender.com'
  const CARD_WIDTH = 300

  // FETCH DATA
  useEffect(() => {
    axios.get(`${BASE_API}/api/testimonial/all`).then(res => {
      setData(res.data.data || [])
    })
  }, [])

  // AUTO PLAY
  useEffect(() => {
    if (isHover || data.length === 0) return

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % data.length
      sliderRef.current.scrollTo({
        left: nextIndex * CARD_WIDTH,
        behavior: 'smooth'
      })
      setActiveIndex(nextIndex)
    }, 3000)

    return () => clearInterval(interval)
  }, [activeIndex, isHover, data.length])

  // ARROWS
  const scrollLeft = () => {
    const prev = Math.max(activeIndex - 1, 0)
    sliderRef.current.scrollTo({ left: prev * CARD_WIDTH, behavior: 'smooth' })
    setActiveIndex(prev)
  }

  const scrollRight = () => {
    const next = Math.min(activeIndex + 1, data.length - 1)
    sliderRef.current.scrollTo({ left: next * CARD_WIDTH, behavior: 'smooth' })
    setActiveIndex(next)
  }

  return (
    <div
      className='relative w-full py-8 group'
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {/* LEFT ARROW */}
      <button
        onClick={scrollLeft}
        className='absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex 
        bg-white shadow-lg w-10 h-10 rounded-full items-center justify-center hover:bg-gray-100'
      >
        ◀
      </button>

      {/* RIGHT ARROW */}
      <button
        onClick={scrollRight}
        className='absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex 
        bg-white shadow-lg w-10 h-10 rounded-full items-center justify-center hover:bg-gray-100'
      >
        ▶
      </button>

      {/* SLIDER */}
      <div
        ref={sliderRef}
        className='flex gap-6 overflow-x-auto px-6 scroll-smooth scrollbar-hide'
      >
        {data.map((item, index) => (
          <div
            key={item._id}
            className='min-w-[280px] max-w-[280px] bg-white rounded-2xl border 
            shadow-sm hover:shadow-md transition p-4 flex-shrink-0'
          >
            {/* LAZY VIDEO THUMB */}
            <div
              className='relative h-[160px] rounded-xl overflow-hidden cursor-pointer'
              onClick={() => setVideoModal(item.videoUrl)}
            >
              <img
                src={
                  item.videoPoster ||
                  item.clientImage ||
                  '/video-placeholder.jpg'
                }
                loading='lazy'
                className='w-full h-full object-cover'
                alt='testimonial video'
              />

              <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
                <div className='bg-white/90 w-12 h-12 rounded-full flex items-center justify-center text-xl'>
                  ▶
                </div>
              </div>
            </div>

            {/* CLIENT INFO */}
            <div className='flex items-center gap-3 mt-4'>
              <img
                src={item.clientImage}
                alt=''
                className='w-10 h-10 rounded-full object-cover border'
              />
              <div>
                <h3 className='text-sm font-semibold text-gray-800 line-clamp-1'>
                  {item.clientName}
                </h3>
                <p className='text-xs text-gray-500 line-clamp-1'>
                  
                  {item.position}
                </p>
                <p className='text-xs text-gray-500 line-clamp-1'>
                  
                  {item.birthDate}
                </p>
              </div>
            </div>

            {/* DESCRIPTION */}
            <p className='text-sm text-gray-700 mt-3 line-clamp-3'>
              {item.description}
            </p>

            {/* BRAND */}
            <p
              className='text-blue-600 text-sm font-medium mt-3 cursor-pointer hover:underline line-clamp-1'
              onClick={() =>
                (window.location.href = `/brand-products/${item.brandId}`)
              }
            >
              {item.brandName}
            </p>
          </div>
        ))}
      </div>

      {/* DOTS */}
      <div className='flex justify-center gap-2 mt-4'>
        {data.map((_, i) => (
          <span
            key={i}
            onClick={() => {
              sliderRef.current.scrollTo({
                left: i * CARD_WIDTH,
                behavior: 'smooth'
              })
              setActiveIndex(i)
            }}
            className={`w-2.5 h-2.5 rounded-full cursor-pointer ${
              activeIndex === i ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* VIDEO MODAL (SMALLER & SAFE) */}
      {videoModal && (
        <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3'>
          <div
            className='
        bg-white rounded-xl p-4
        w-full max-w-sm   /* 👈 modal width reduced */
        max-h-[80vh]      /* 👈 modal height limit */
        overflow-y-auto   /* 👈 scroll if needed */
      '
          >
            <video
              src={videoModal}
              controls
              autoPlay
              preload='metadata'
              className='w-full rounded max-h-[45vh] object-contain'
            />

            <button
              onClick={() => setVideoModal(null)}
              className='
          mt-4 w-full
          bg-red-500 text-white
          py-2 rounded
          hover:bg-red-600
        '
            >
              Close Video
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
