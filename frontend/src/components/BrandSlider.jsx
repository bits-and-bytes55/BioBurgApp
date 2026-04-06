import React, { useState, useEffect } from 'react'

// === Card Component (Aapke naye design ke hisaab se) ===
function BrandCard ({ imageUrl, productName }) {
  return (
    // Card ka width set karein
    <div className='p-2 flex-shrink-0 w-64'>
      <div
        className='bg-white rounded-2xl shadow-md overflow-hidden 
                      transition-transform duration-300 ease-in-out hover:scale-105'
      >
        {/* Image Box */}
        <div className='w-full h-48 flex items-center justify-center p-4 bg-white'>
          <img
            src={imageUrl}
            alt={productName}
            className='max-w-full max-h-full object-contain'
          />
        </div>

        {/* Horizontal Line */}
        <hr />

        {/* Product Name Box */}
        <div className='p-3'>
          <p className='font-semibold text-sm truncate text-center'>
            {productName}
          </p>
        </div>
      </div>
    </div>
  )
}

// === Main Slider Component (Marquee wala) ===
function FeaturedBrandsSlider () {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const BACKEND_URL = 'https://bioburglifescience-1.onrender.com'

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        // Sahi API URL
        const res = await fetch(
          'https://bioburglifescience-1.onrender.com/api/brands'
        )
        const data = await res.json()
        setBrands(data)
      } catch (err) {
        console.error('Featured brands fetch karne me error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBrands()
  }, [])

  // Jab tak load ho raha hai, ya koi item nahi hai,
  // component kuch bhi render nahi karega (blank).
  if (loading || brands.length === 0) {
    return null
  }

  return (
    <>
      
    </>
  )
}

export default FeaturedBrandsSlider
