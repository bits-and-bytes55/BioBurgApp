import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const BASE_API   = import.meta.env.VITE_API_BASE_URL;  
const CARD_WIDTH = 300

export default function TestimonialSlider () {
  const [data,        setData]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [videoModal,  setVideoModal]  = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHover,     setIsHover]     = useState(false)

  const sliderRef = useRef(null)

  /* ── Fetch  */
  useEffect(() => {
    axios
      .get(`${BASE_API}/api/testimonial/all`)
      .then(res => {
        const list = res.data.data || []
        if (list.length > 0) 
        setData(list)
      })
      .catch(err => {
        console.error('[TestimonialSlider] fetch error:', err)
        setError('Could not load testimonials')
      })
      .finally(() => setLoading(false))
  }, [])

  /* ── Auto-play  */
  useEffect(() => {
    if (isHover || data.length === 0) return
    const id = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % data.length
        sliderRef.current?.scrollTo({ left: next * CARD_WIDTH, behavior: 'smooth' })
        return next
      })
    }, 3000)
    return () => clearInterval(id)
  }, [isHover, data.length])

  /* ── Arrows  */
  const scrollTo = idx => {
    const clamped = Math.max(0, Math.min(idx, data.length - 1))
    sliderRef.current?.scrollTo({ left: clamped * CARD_WIDTH, behavior: 'smooth' })
    setActiveIndex(clamped)
  }

  // Backend saves: { url, public_id }  → we need .url
  const resolveUrl = field =>
    field && typeof field === 'object' ? field.url : field || ''

  /* ── States  */
  if (loading) return (
    <div className='w-full py-12 flex justify-center'>
      <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin' />
    </div>
  )

  if (error) return (
    <div className='w-full py-8 text-center text-red-500 text-sm'>{error}</div>
  )

  if (data.length === 0) return (
    <div className='w-full py-8 text-center text-gray-400 text-sm'>
      No testimonials yet.
    </div>
  )

  /* ── Render  */
  return (
    <div
      className='relative w-full py-8 group'
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {/* LEFT ARROW */}
      <button
        onClick={() => scrollTo(activeIndex - 1)}
        className='absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex
          bg-white shadow-lg w-10 h-10 rounded-full items-center justify-center
          hover:bg-gray-100 text-gray-700'
      >
        ◀
      </button>

      {/* RIGHT ARROW */}
      <button
        onClick={() => scrollTo(activeIndex + 1)}
        className='absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex
          bg-white shadow-lg w-10 h-10 rounded-full items-center justify-center
          hover:bg-gray-100 text-gray-700'
      >
        ▶
      </button>

      {/* SLIDER */}
      <div
        ref={sliderRef}
        className='flex gap-6 overflow-x-auto px-6 scroll-smooth scrollbar-hide'
        style={{ scrollbarWidth: 'none' }}
      >
        {data.map((item) => {
          // Backend may store as { url, public_id } object OR flat string field
          const videoUrl  = resolveUrl(item.video) || item.videoUrl || ''
          const imgUrl    = resolveUrl(item.clientImage) || item.clientImageUrl || ''
          const thumbUrl  = item.videoPoster || imgUrl || '/video-placeholder.jpg'

          return (
            <div
              key={item._id}
              className='min-w-[280px] max-w-[280px] bg-white rounded-2xl border
                shadow-sm hover:shadow-md transition p-4 flex-shrink-0'
            >
              {/* VIDEO THUMBNAIL */}
              <div
                className='relative h-[160px] rounded-xl overflow-hidden cursor-pointer'
                onClick={() => videoUrl && setVideoModal(videoUrl)}
              >
                <img
                  src={thumbUrl}
                  loading='lazy'
                  className='w-full h-full object-cover'
                  alt='testimonial'
                  onError={e => { e.target.src = '/video-placeholder.jpg' }}
                />
                {videoUrl && (
                  <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
                    <div className='bg-white/90 w-12 h-12 rounded-full flex items-center justify-center text-xl'>
                      ▶
                    </div>
                  </div>
                )}
              </div>

              {/* CLIENT INFO */}
              <div className='flex items-center gap-3 mt-4'>
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt=''
                    className='w-10 h-10 rounded-full object-cover border flex-shrink-0'
                    onError={e => { e.target.style.display = 'none' }}
                  />
                )}
                <div className='min-w-0'>
                  <h3 className='text-sm font-semibold text-gray-800 line-clamp-1'>
                    {item.clientName}
                  </h3>
                  {item.position && (
                    <p className='text-xs text-gray-500 line-clamp-1'>{item.position}</p>
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              {item.description && (
                <p className='text-sm text-gray-700 mt-3 line-clamp-3'>
                  {item.description}
                </p>
              )}

              {/* BRAND */}
              {item.brandName && (
                <p
                  className='text-blue-600 text-sm font-medium mt-3 cursor-pointer hover:underline line-clamp-1'
                  onClick={() => (window.location.href = `/brand-products/${item.brandId}`)}
                >
                  {item.brandName}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* DOTS */}
      <div className='flex justify-center gap-2 mt-4'>
        {data.map((_, i) => (
          <span
            key={i}
            onClick={() => scrollTo(i)}
            className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-colors ${
              activeIndex === i ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* VIDEO MODAL */}
      {videoModal && (
        <div
          className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3'
          onClick={() => setVideoModal(null)}   /* click backdrop to close */
        >
          <div
            className='bg-white rounded-xl p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto'
            onClick={e => e.stopPropagation()}  /* don't close when clicking inside */
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
              className='mt-4 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600'
            >
              Close Video
            </button>
          </div>
        </div>
      )}
    </div>
  )
}