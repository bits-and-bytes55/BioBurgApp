// import React, { useEffect, useState, useMemo } from 'react'
// import axios from 'axios'
// import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
// import { HiChevronDown, HiChevronUp } from 'react-icons/hi'
// import ProductSlider from '../pages/ProductSlider'
// import BrandsPage from '../pages/BrandsPage'
// import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
// import FavoriteIcon from '@mui/icons-material/Favorite'

// const API_BASE = 'https://bioburglifescience-1.onrender.com'
// // const API_BASE = 'https://bioburglifescience-1.onrender.com'

// export default function ShopByCategory () {
//   const [trendingProducts, setTrendingProducts] = useState([])
//   const { id } = useParams()
//   const [searchParams] = useSearchParams()
//   const navigate = useNavigate()
//   const type = searchParams.get('type')

//   // ----- DATA -----
//   const [categoryName, setCategoryName] = useState('')
//   const [mainCategory, setMainCategory] = useState('')
//   const [subCategories, setSubCategories] = useState([])
//   const [products, setProducts] = useState([])
//   const [wishlist, setWishlist] = useState([])
//   const token = localStorage.getItem('token')

//   // ----- FILTER STATES -----
//   const [brands, setBrands] = useState([])
//   const [brandQuery, setBrandQuery] = useState('')
//   const [selectedBrands, setSelectedBrands] = useState(new Set())
//   const [priceRange, setPriceRange] = useState([0, 1000])
//   const [maxPriceLimit, setMaxPriceLimit] = useState(1000)
//   const [sortBy, setSortBy] = useState('')
//   const [drawerOpen, setDrawerOpen] = useState(false)

//   // UI toggles
//   const [openCategory, setOpenCategory] = useState(true)
//   const [openPrice, setOpenPrice] = useState(true)
//   const [openBrand, setOpenBrand] = useState(true)

//   // =====================================================================
//   // FETCH CATEGORY, SUBCATEGORY, PRODUCTS
//   // =====================================================================
//   useEffect(() => {
//     const load = async () => {
//       try {
//         // --- Set page category title ---
//         setCategoryName(id)

//         // ---------------------------------------------
//         // (A) FETCH SUBCATEGORIES when type = main
//         // ---------------------------------------------
//         if (type === 'main') {
//           const subRes = await axios.get(`${API_BASE}/api/categories`, {
//             params: { parent: id }
//           })

//           setSubCategories(subRes.data.categories || [])
//         }

//         // ---------------------------------------------
//         // (B) FETCH PRODUCTS
//         // ---------------------------------------------
//         let prodRes
//         if (type === 'main') {
//           prodRes = await axios.get(`${API_BASE}/api/admin/products/filter`, {
//             params: { main: id }
//           })
//           console.log('Main=', prodRes)
//         } else {
//           prodRes = await axios.get(`${API_BASE}/api/admin/products/filter`, {
//             params: { category: id } // ID required for sub
//           })
//           console.log('Sub=', prodRes)
//         }

//         const data = prodRes.data.products || []
//         setProducts(data)

//         console.log('Data=', data)

//         // (D) FETCH TRENDING PRODUCTS
//         const trendingRes = await axios.get(
//           `${API_BASE}/api/admin/products/filter`,
//           {
//             params: { isTrending: true }
//           }
//         )

//         setTrendingProducts(trendingRes.data.products || [])

//         // ---------------------------------------------
//         // Build Unique Brands
//         // ---------------------------------------------
//         const uniqBrands = [
//           ...new Set(data.map(p => p.brand).filter(Boolean))
//         ].sort()
//         setBrands(uniqBrands)

//         // ---------------------------------------------
//         // Price limit calculation
//         // ---------------------------------------------
//         if (data.length > 0) {
//           const prices = data.map(p => p.price)
//           const maxP = Math.max(...prices)
//           setMaxPriceLimit(maxP)
//           setPriceRange([0, maxP])
//         }

//         // ---------------------------------------------
//         // (C) FIND MAIN CATEGORY for type=sub
//         // ---------------------------------------------
//         if (type === 'sub') {
//           const all = await axios.get(`${API_BASE}/api/categories/all`)
//           const list = all.data.categories
//           console.log('List=', list)

//           // find current sub category using ID (NOT title)
//           const current = list.find(c => c._id === id)

//           if (current) {
//             setCategoryName(current.title)

//             if (current.parentCategory) {
//               const parent = list.find(c => c._id === current.parentCategory)
//               setMainCategory(parent?.title || '')
//             }
//           }
//         }
//       } catch (err) {
//         console.log('Error=', err)
//       }
//     }

//     load()
//   }, [id, type])

//   // ====================================================
//   // Wishlist products section
//   // ====================================================
//   useEffect(() => {
//     if (!token) return

//     axios
//       .get(`${API_BASE}/api/wishlist`, {
//         headers: { Authorization: `Bearer ${token}` }
//       })
//       .then(res => {
//         const ids = res.data.products.map(p => p._id)
//         setWishlist(ids)
//       })
//       .catch(err => console.log('Wishlist load error:', err))
//   }, [token])

//   // =====================================================================
//   // FILTERS (brands, price, sorting)
//   // =====================================================================

//   const filteredBrandList = useMemo(() => {
//     if (!brandQuery) return brands
//     return brands.filter(b =>
//       b.toLowerCase().includes(brandQuery.toLowerCase())
//     )
//   }, [brands, brandQuery])

//   const filteredProducts = useMemo(() => {
//     let list = [...products]

//     // brand
//     if (selectedBrands.size > 0) {
//       list = list.filter(p => selectedBrands.has(p.brand))
//     }

//     // price
//     list = list.filter(
//       p => p.price >= priceRange[0] && p.price <= priceRange[1]
//     )

//     // sort
//     if (sortBy === 'low-high') list.sort((a, b) => a.price - b.price)
//     if (sortBy === 'high-low') list.sort((a, b) => b.price - a.price)
//     if (sortBy === 'discount')
//       list.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))
//     if (sortBy === 'newest')
//       list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

//     return list
//   }, [products, selectedBrands, priceRange, sortBy])

//   const toggleBrand = brand => {
//     const s = new Set(selectedBrands)
//     s.has(brand) ? s.delete(brand) : s.add(brand)
//     setSelectedBrands(s)
//   }

//   // =====================================================================
//   // LEFT FILTER PANEL (DESKTOP)
//   // =====================================================================

//   const FilterPanel = () => (
//     <div className='hidden md:block md:col-span-3'>
//       <div className='sticky top-20 bg-gray-50   p-4 h-[calc(100vh-160px)] overflow-y-auto'>
//         {/* CATEGORY */}
//         <div className='mb-5'>
//           <div
//             className='flex justify-between cursor-pointer'
//             onClick={() => setOpenCategory(!openCategory)}
//           >
//             <h4 className='font-semibold'>Category</h4>
//             {openCategory ? <HiChevronUp /> : <HiChevronDown />}
//           </div>

//           {openCategory && (
//             <div className='mt-2 text-sm'>
//               {type === 'main' &&
//                 subCategories.map(c => (
//                   <div
//                     key={c._id}
//                     className='py-1 pl-2 hover:bg-gray-100 cursor-pointer'
//                     onClick={() => navigate(`/category/${c._id}?type=sub`)}
//                   >
//                     {c.title}
//                   </div>
//                 ))}
//             </div>
//           )}
//         </div>

//         {/* PRICE */}
//         <div className='mb-5'>
//           <div
//             className='flex justify-between cursor-pointer'
//             onClick={() => setOpenPrice(!openPrice)}
//           >
//             <h4 className='font-semibold'>Price</h4>
//             {openPrice ? <HiChevronUp /> : <HiChevronDown />}
//           </div>

//           {openPrice && (
//             <div className='mt-3'>
//               <div className='flex gap-2 text-sm mb-3'>
//                 <input
//                   type='number'
//                   value={priceRange[0]}
//                   onChange={e =>
//                     setPriceRange([Number(e.target.value), priceRange[1]])
//                   }
//                   className='border p-1 rounded w-1/2'
//                 />
//                 <input
//                   type='number'
//                   value={priceRange[1]}
//                   onChange={e =>
//                     setPriceRange([priceRange[0], Number(e.target.value)])
//                   }
//                   className='border p-1 rounded w-1/2'
//                 />
//               </div>

//               <input
//                 type='range'
//                 min={0}
//                 max={maxPriceLimit}
//                 value={priceRange[0]}
//                 onChange={e =>
//                   setPriceRange([Number(e.target.value), priceRange[1]])
//                 }
//                 className='w-full mb-2'
//               />

//               <input
//                 type='range'
//                 min={0}
//                 max={maxPriceLimit}
//                 value={priceRange[1]}
//                 onChange={e =>
//                   setPriceRange([priceRange[0], Number(e.target.value)])
//                 }
//                 className='w-full'
//               />
//             </div>
//           )}
//         </div>

//         {/* BRAND */}
//         <div className='mb-5'>
//           <div
//             className='flex justify-between cursor-pointer'
//             onClick={() => setOpenBrand(!openBrand)}
//           >
//             <h4 className='font-semibold'>Brand</h4>
//             {openBrand ? <HiChevronUp /> : <HiChevronDown />}
//           </div>

//           {openBrand && (
//             <>
//               <input
//                 placeholder='Search Brand'
//                 className='border rounded p-1 text-sm w-full mt-2'
//                 value={brandQuery}
//                 onChange={e => setBrandQuery(e.target.value)}
//               />

//               <div className='mt-2 max-h-48 overflow-y-auto text-sm'>
//                 {filteredBrandList.map(b => (
//                   <label
//                     key={b}
//                     className='flex items-center gap-2 p-1 cursor-pointer'
//                   >
//                     <input
//                       type='checkbox'
//                       checked={selectedBrands.has(b)}
//                       onChange={() => toggleBrand(b)}
//                     />
//                     {b}
//                   </label>
//                 ))}
//               </div>
//             </>
//           )}
//         </div>

//         {/* SORT */}
//         <div>
//           <h4 className='font-semibold mb-2'>Sort By</h4>
//           <select
//             className='border rounded p-2 w-full'
//             value={sortBy}
//             onChange={e => setSortBy(e.target.value)}
//           >
//             <option value=''>Relevance</option>
//             <option value='low-high'>Low → High</option>
//             <option value='high-low'>High → Low</option>
//             <option value='discount'>Discount</option>
//             <option value='newest'>Newest</option>
//           </select>
//         </div>
//       </div>
//     </div>
//   )
//   // =========================
//   // wishlist handle input
//   // ========================

//   const handleWishlist = async (e, productId) => {
//     e.stopPropagation()

//     if (!token) {
//       navigate('/login')
//       return
//     }

//     try {
//       if (wishlist.includes(productId)) {
//         await axios.delete(`${API_BASE}/api/wishlist/remove/${productId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         })
//         setWishlist(prev => prev.filter(id => id !== productId))
//       } else {
//         await axios.post(
//           `${API_BASE}/api/wishlist/add/${productId}`,
//           {},
//           {
//             headers: { Authorization: `Bearer ${token}` }
//           }
//         )
//         setWishlist(prev => [...prev, productId])
//       }
//     } catch (error) {
//       console.log('Wishlist error', error)
//     }
//   }

//   // =====================================================================
//   // MAIN RETURN LAYOUT
//   // =====================================================================

//   return (
//     <>
//       <div className='px-4 pt-4 space-y-6'>
//         <ProductSlider />
//         <BrandsPage />
//       </div>
//       <div className='h-[100vh] overflow-hidden bg-gray-50'>
//         {/* TOP HEADER (sticky) */}
//         <div className='sticky top-0 bg-gray-50 z-20 px-4 py-3 shadow-sm'>
//           {/* Breadcrumb */}
//           <div className='text-sm text-gray-600 mb-1'>
//             <span onClick={() => navigate('/')} className='cursor-pointer'>
//               Home
//             </span>

//             {type === 'main' && <span> › {id}</span>}

//             {type === 'sub' && (
//               <>
//                 <span
//                   className='cursor-pointer'
//                   onClick={() =>
//                     navigate(`/category/${mainCategory}?type=main`)
//                   }
//                 >
//                   {' '}
//                   › {mainCategory}
//                 </span>
//                 <span> › {categoryName}</span>
//               </>
//             )}
//           </div>

//           {/* Title + Sort */}
//           <div className='flex justify-between items-center'>
//             <h1 className='text-xl font-semibold'>Shop by Category</h1>

//             <div className='hidden md:flex gap-2 items-center'>
//               <span className='text-sm text-gray-600'>Sort by</span>
//               <select
//                 className='border p-2 rounded'
//                 value={sortBy}
//                 onChange={e => setSortBy(e.target.value)}
//               >
//                 <option value=''>Relevance</option>
//                 <option value='low-high'>Low → High</option>
//                 <option value='high-low'>High → Low</option>
//                 <option value='discount'>Discount</option>
//                 <option value='newest'>Newest</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* MAIN GRID */}
//         <div className='grid grid-cols-12 gap-4 px-4 pt-3'>
//           {/* LEFT FILTER PANEL */}
//           <FilterPanel />

//           {/* RIGHT PRODUCTS PANEL — SCROLLABLE */}
//           <div className='col-span-12 md:col-span-9 h-[calc(100vh-140px)] overflow-y-auto pr-2 pb-10'>
//             <div className='text-gray-600 text-sm mb-4'></div>

//             {/* PRODUCT GRID */}
//             {(() => {
//               const groups = {}

//               filteredProducts.forEach(p => {
//                 const cat = p.category || 'Others'
//                 if (!groups[cat]) groups[cat] = []
//                 groups[cat].push(p)
//               })

//               const categoryBlocks = Object.entries(groups)

//               return (
//                 <div className='space-y-10'>
//                   {categoryBlocks.map(([catName, items]) => (
//                     <div key={catName}>
//                       <h2 className='text-xl font-bold mt-3 '>
//                         {catName}{' '}
//                         <span className='text-gray-500 text-sm'>
//                           ({items.length} items)
//                         </span>
//                       </h2>

//                       {/* PRODUCT GRID */}
//                       <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
//                         {items.map(p => (
//                           <div
//                             key={p._id}
//                             className='relative bg-white border rounded shadow-sm p-3 hover:shadow-lg transition cursor-pointer'
//                             onClick={() =>
//                               navigate(`/product-details/${p._id}`)
//                             }
//                           >
//                             {/* ❤️ Wishlist Heart */}
//                             <div
//                               className='absolute top-2 right-2 z-20'
//                               onClick={e => handleWishlist(e, p._id)}
//                             >
//                               {wishlist.includes(p._id) ? (
//                                 <FavoriteIcon style={{ color: 'red' }} />
//                               ) : (
//                                 <FavoriteBorderIcon style={{ color: '#555' }} />
//                               )}
//                             </div>

//                             <img
//                               className='w-full h-40 object-contain mb-3'
//                               src={`${API_BASE}/uploads/products/${
//                                 p.images?.[p.primaryImageIndex || 0]
//                               }`}
//                             />

//                             <h2 className='text-sm font-semibold line-clamp-2'>
//                               {p.title}
//                             </h2>

//                             <p className='text-xs text-gray-500'>
//                               <strong className='text-[#000]'>Brand:</strong>{' '}
//                               {p.brand}
//                             </p>

//                             <div className='mt-1'>
//                               <span className='text-lg font-bold'>
//                                 ₹{p.price}
//                               </span>
//                               {p.mrp && (
//                                 <span className='text-sm line-through text-gray-400 ml-2'>
//                                   ₹{p.mrp}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )
//             })()}

//             {trendingProducts.length > 0 && (
//               <div className='mb-10'>
//                 <h2 className='text-xl font-bold mb-4'>
//                   🔥 Trending Near You
//                   <span className='text-gray-500 text-sm'>
//                     {' '}
//                     ({trendingProducts.length} items)
//                   </span>
//                 </h2>

//                 <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
//                   {trendingProducts.map(p => (
//                     <div
//                       key={p._id}
//                       className='relative bg-white border rounded shadow-sm p-3 hover:shadow-lg transition cursor-pointer'
//                       onClick={() => navigate(`/product-details/${p._id}`)}
//                     >
//                       <div
//                         className='absolute top-2 right-2 z-20'
//                         onClick={e => handleWishlist(e, p._id)}
//                       >
//                         {wishlist.includes(p._id) ? (
//                           <FavoriteIcon style={{ color: 'red' }} />
//                         ) : (
//                           <FavoriteBorderIcon style={{ color: '#555' }} />
//                         )}
//                       </div>

//                       <img
//                         className='w-full h-40 object-contain mb-3'
//                         src={`${API_BASE}/uploads/products/${
//                           p.images?.[p.primaryImageIndex || 0]
//                         }`}
//                       />

//                       <h2 className='text-sm font-semibold line-clamp-2'>
//                         {p.title}
//                       </h2>

//                       <p className='text-xs text-gray-500'>
//                         <strong className='text-[#000]'>Brand:</strong>{' '}
//                         {p.brand}
//                       </p>

//                       <div className='mt-1'>
//                         <span className='text-lg font-bold'>₹{p.price}</span>
//                         {p.mrp && (
//                           <span className='text-sm line-through text-gray-400 ml-2'>
//                             ₹{p.mrp}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {filteredProducts.length === 0 && (
//               <div className='text-center mt-20 text-gray-500'>
//                 No Products Found
//               </div>
//             )}
//           </div>
//         </div>

//         {/* MOBILE DRAWER */}
//         {drawerOpen && <Drawer />}
//       </div>
//     </>
//   )
// }
