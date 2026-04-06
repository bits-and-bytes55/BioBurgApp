import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { userApi } from '../../utils/api'
import { useNavigate } from 'react-router-dom'

import FavoriteBorderIcon  from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon        from '@mui/icons-material/Favorite'
import ShoppingCartIcon    from '@mui/icons-material/ShoppingCart'
import InfoIcon            from '@mui/icons-material/Info'
import StarIcon            from '@mui/icons-material/Star'
import LocalOfferIcon      from '@mui/icons-material/LocalOffer'
import InventoryIcon       from '@mui/icons-material/Inventory'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosIcon    from '@mui/icons-material/ArrowBackIos'
import BoltIcon            from '@mui/icons-material/Bolt'

import { useCart } from '../context/useCart'

export default function DynamicSectionSlider(props) {
  const section    = props.section || { title: props.title, key: props.sectionKey }
  const { title, key: sectionKey } = section || {}

  const { addToCart }               = useCart()
  const [products,    setProducts]  = useState([])
  const [wishlist,    setWishlist]  = useState([])
  const [loading,     setLoading]   = useState(true)
  const [loadingIds,  setLoadingIds]= useState(new Set())

  const mountedRef    = useRef(true)
  const fetchCountRef = useRef(0)
  // Once products are shown, this is true — we never hide them again
  const hasLoadedRef  = useRef(false)

  // Stable refs so useCallback never goes stale
  const keyRef   = useRef(sectionKey)
  const titleRef = useRef(title)
  keyRef.current   = sectionKey
  titleRef.current = title

  const navigate  = useNavigate()
  const swiperRef = useRef(null)

  const loadProducts = useCallback(async () => {
    const key = keyRef.current
    const ttl = titleRef.current

    if (!key && !ttl) { setLoading(false); return }

    fetchCountRef.current += 1
    const thisFetch = fetchCountRef.current

    if (!hasLoadedRef.current) setLoading(true)

    const attempts = [
      { section: ttl || key },
      ...(key && key !== ttl ? [{ section: key }] : []),
      { categoryName: ttl || key },
    ]

    try {
      for (const params of attempts) {
        try {
          const res = await userApi.get('/api/products/filter', { params })
          const p   = res.data?.products || []

          // Discard stale responses — a newer fetch is already running
          if (thisFetch !== fetchCountRef.current) return

          if (p.length) {
            if (mountedRef.current) {
              setProducts(p)
              hasLoadedRef.current = true
            }
            return
          }
        } catch {
          // silently try next fallback
        }
      }

      if (
        thisFetch === fetchCountRef.current &&
        mountedRef.current &&
        !hasLoadedRef.current
      ) {
        setProducts([])
      }

    } finally {
      if (thisFetch === fetchCountRef.current && mountedRef.current) {
        setLoading(false)
      }
    }
  }, []) // empty deps — uses refs, so stable forever

  useEffect(() => {
    mountedRef.current = true
    loadProducts()
    return () => { mountedRef.current = false }
  }, [loadProducts])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlist(Array.isArray(saved) ? saved : [])
    } catch { setWishlist([]) }
  }, [])

  const toggleWishlist = (id, e) => {
    e.stopPropagation()
    const updated = wishlist.includes(id)
      ? wishlist.filter((i) => i !== id)
      : [...wishlist, id]
    setWishlist(updated)
    try { localStorage.setItem('wishlist', JSON.stringify(updated)) } catch {}
  }

  const handleAddToCart = async (product, e) => {
    e.stopPropagation()
    const pid = product._id
    setLoadingIds((prev) => new Set(prev).add(pid))
    try { await addToCart(product, 1, null) } catch {}
    finally {
      setLoadingIds((prev) => { const n = new Set(prev); n.delete(pid); return n })
    }
  }

  const handleBuyNow = (product, e) => {
    e.stopPropagation()
    addToCart(product, 1, null).catch(() => {})
    navigate('/checkout')
  }

  const goToDetails = (id) => { if (id) navigate(`/product-details/${id}`) }

  if (!section || !section.key) return null

  // Skeleton — only on very first load, never after products have been shown
  if (loading && !hasLoadedRef.current) {
    return (
      <div className="w-full py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 px-2">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
            <div className="h-1 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Nothing found on first load — render nothing cleanly
  if (!products.length) return null

  const enableLoop = products.length >= 12

  return (
    <>
      <style>{`
        .swiper-wrapper { align-items: stretch; }
        .swiper-slide   { height: auto !important; }
      `}</style>

      <div className="w-full mt-15 py-8 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="mb-8 px-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-blue-600 rounded-full" />
                  <div className="w-4  h-1 bg-blue-400 rounded-full" />
                  <div className="w-2  h-1 bg-blue-300 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm md:text-base font-medium flex items-center gap-1 transition-colors group">
                  View All Products
                  <ArrowForwardIosIcon className="text-sm group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-2 sm:hidden">
                  <button className={`prev-${sectionKey} w-8 h-8 bg-white rounded-full shadow flex items-center justify-center`} aria-label="Previous">
                    <ArrowBackIosIcon className="text-sm text-gray-700" />
                  </button>
                  <button className={`next-${sectionKey} w-8 h-8 bg-white rounded-full shadow flex items-center justify-center`} aria-label="Next">
                    <ArrowForwardIosIcon className="text-sm text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDER */}
          <div className="relative group">
            <Swiper
              ref={swiperRef}
              slidesPerView={2}
              spaceBetween={16}
              autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              loop={enableLoop}
              navigation={{ nextEl: `.next-${sectionKey}`, prevEl: `.prev-${sectionKey}` }}
              pagination={{ clickable: true, el: `.pagination-${sectionKey}` }}
              modules={[Autoplay, Navigation, Pagination]}
              breakpoints={{
                375:  { slidesPerView: 2 },
                480:  { slidesPerView: 2.3 },
                640:  { slidesPerView: 2.8 },
                768:  { slidesPerView: 3.6 },
                1024: { slidesPerView: 4.5 },
                1280: { slidesPerView: 5.2 },
              }}
              className="!pb-12"
            >
              {products.map((p) => {
                const productName   = p.brandName || p.genericName || 'Unnamed Product'
                const mrp           = parseFloat(p.mrp) || 0
                const sellingPrice  = p.rolePrice ? parseFloat(p.rolePrice.finalRate) : mrp
                const discount      = p.rolePrice ? parseFloat(p.rolePrice.discountPercent) : 0
                const isInStock     = (p.totalStocks > 0) || (p.stocks > 0)
                const isWishlisted  = wishlist.includes(p._id)
                const isThisLoading = loadingIds.has(p._id)

                return (
                  <SwiperSlide key={p._id} className="h-full">
                    <div
                      className="group/card bg-white rounded-2xl h-full flex flex-col relative overflow-hidden
                                 border border-gray-200 hover:border-blue-200 hover:shadow-2xl
                                 transition-all duration-300 ease-out cursor-pointer
                                 hover:-translate-y-1 active:scale-[0.98]"
                      onClick={() => goToDetails(p._id)}
                    >
                      {discount > 0 && (
                        <div className="absolute top-8 left-3 bg-gradient-to-r from-red-500 to-orange-500
                                        text-white text-xs font-bold px-3 py-1.5 rounded-full
                                        shadow-lg z-10 flex items-center gap-1.5">
                          <LocalOfferIcon sx={{ fontSize: 12 }} />
                          <span>{discount}% OFF</span>
                        </div>
                      )}

                      <button
                        className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/80 backdrop-blur-sm
                                   rounded-full flex items-center justify-center shadow-lg
                                   hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200"
                        onClick={(e) => toggleWishlist(p._id, e)}
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        {isWishlisted
                          ? <FavoriteIcon className="text-red-500" sx={{ fontSize: 18 }} />
                          : <FavoriteBorderIcon className="text-gray-600 group-hover/card:text-red-400" sx={{ fontSize: 18 }} />}
                      </button>

                      <div className="pt-[75%] relative bg-gradient-to-b from-gray-50 to-white overflow-hidden">
                        <div className="absolute inset-0 p-4 flex items-center justify-center">
                          <img
                            src={p.images?.[0]?.url || '/no-image.png'}
                            alt={productName}
                            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover/card:scale-110"
                            loading="lazy"
                            onError={(e) => { e.target.src = '/no-image.png' }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/60 flex items-center justify-center transition-all duration-300 z-20">
                          <button className="opacity-0 group-hover/card:opacity-100 transform translate-y-4 group-hover/card:translate-y-0
                                             bg-white text-blue-600 px-4 py-2 rounded-full font-medium text-sm
                                             flex items-center gap-2 hover:bg-blue-50 transition-all duration-300">
                            <InfoIcon sx={{ fontSize: 16 }} />
                            Quick View
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 p-3 flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-tight line-clamp-1">
                          {productName}
                        </h3>
                        {p.genericName && (
                          <p className="text-xs text-gray-500 mb-3 line-clamp-1">{p.genericName}</p>
                        )}
                        {p.rating && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <div className="flex items-center bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded">
                              <StarIcon sx={{ fontSize: 12 }} />
                              <span className="ml-1">{p.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-gray-400">• 128 reviews</span>
                          </div>
                        )}

                        <div className="mt-auto">
                          <div className="flex flex-col gap-1 mb-2">
                            <span className="text-lg md:text-xl font-bold text-gray-900">
                              ₹{sellingPrice.toLocaleString()}
                            </span>
                            {mrp > sellingPrice && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm line-through text-gray-400">₹{mrp.toLocaleString()}</span>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                  Save ₹{(mrp - sellingPrice).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${isInStock ? 'text-green-600' : 'text-red-500'} mb-2`}>
                            <InventoryIcon sx={{ fontSize: 14 }} />
                            <span className="font-medium">
                              {isInStock ? `${p.totalStocks || p.stocks} units available` : 'Out of Stock'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            className={`w-full py-2 rounded-xl text-sm font-medium transition-all duration-200
                                       ${isInStock && !isThisLoading
                                         ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg active:scale-95'
                                         : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            onClick={(e) => { if (isInStock && !isThisLoading) handleAddToCart(p, e); else e.stopPropagation() }}
                            disabled={!isInStock || isThisLoading}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {isThisLoading
                                ? <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                : <ShoppingCartIcon sx={{ fontSize: 16 }} />}
                              {!isInStock ? 'Out of Stock' : isThisLoading ? 'Adding...' : 'Add to Cart'}
                            </div>
                          </button>

                          <button
                            className={`w-full py-2 rounded-xl text-sm font-medium transition-all duration-200
                                       ${isInStock
                                         ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg active:scale-95'
                                         : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            onClick={(e) => { if (isInStock) handleBuyNow(p, e); else e.stopPropagation() }}
                            disabled={!isInStock}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <BoltIcon sx={{ fontSize: 16 }} />
                              {isInStock ? 'Buy Now' : 'Out of Stock'}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>

            <button
              className={`prev-${sectionKey} hidden sm:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2
                          bg-white shadow-xl rounded-full w-10 h-10 lg:w-12 lg:h-12
                          items-center justify-center z-10 opacity-0 group-hover:opacity-100
                          transition-all duration-300 hover:shadow-2xl hover:scale-110 hover:bg-gray-50 active:scale-95`}
              aria-label="Previous"
            >
              <ArrowBackIosIcon className="text-gray-700 text-sm lg:text-base" />
            </button>
            <button
              className={`next-${sectionKey} hidden sm:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2
                          bg-white shadow-xl rounded-full w-10 h-10 lg:w-12 lg:h-12
                          items-center justify-center z-10 opacity-0 group-hover:opacity-100
                          transition-all duration-300 hover:shadow-2xl hover:scale-110 hover:bg-gray-50 active:scale-95`}
              aria-label="Next"
            >
              <ArrowForwardIosIcon className="text-gray-700 text-sm lg:text-base" />
            </button>

            <div className={`pagination-${sectionKey} flex justify-center gap-2 mt-6`} />
          </div>
        </div>
      </div>
    </>
  )
}