import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { HiChevronDown, HiChevronUp, HiFilter, HiX } from "react-icons/hi";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { MdLocalShipping, MdDiscount } from "react-icons/md";
import ProductSlider from "../pages/ProductSlider";
import BrandsPage from "../pages/BrandsPage";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export default function ShopByCategory() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type");

  /* ---------------- STATES ---------------- */
  const [categoryName, setCategoryName] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const token = localStorage.getItem("token");

  // Filters
  const [brands, setBrands] = useState([]);
  const [brandQuery, setBrandQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [maxPriceLimit, setMaxPriceLimit] = useState(0);
  const [sortBy, setSortBy] = useState("");

  // Toggles
  const [openCategory, setOpenCategory] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);
  const [openBrand, setOpenBrand] = useState(true);

  // Load category and products
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setSelectedBrands(new Set());
        setSortBy("");
        setSubCategories([]);
        setMainCategory("");

        const decoded = decodeURIComponent(id);
        setCategoryName(decoded);

        let params = {};

        if (type === "brand") {
          params = { brandName: decoded };
        } else if (type === "sub") {
          try {
            const catRes = await axios.get(`${API_BASE}/api/categories/all`);
            const allCats = catRes.data.categories || [];
            const matchedCat = allCats.find(
              (c) => c.title.toLowerCase() === decoded.toLowerCase(),
            );

            if (matchedCat) {
              if (matchedCat.parentCategory?.title) {
                setMainCategory(matchedCat.parentCategory.title);
              } else if (matchedCat.parentCategory) {
                const parentRes = await axios.get(
                  `${API_BASE}/api/categories/${matchedCat.parentCategory}`,
                );
                setMainCategory(parentRes.data?.category?.title || "");
              }
              params = { categoryId: matchedCat._id, categoryName: decoded };
            } else {
              params = { categoryName: decoded };
            }
          } catch {
            params = { categoryName: decoded };
          }
        } else {
          params = { categoryName: decoded };
        }

        const prodRes = await axios.get(
          `${API_BASE}/api/products/filter`,
          { params },
        );

        const data = prodRes.data.products || [];
        setProducts(data);

        const uniqBrands = [
          ...new Set(data.map((p) => p.brandName).filter(Boolean)),
        ];
        setBrands(uniqBrands);

        if (data.length > 0) {
          const maxP = Math.max(...data.map((p) => p.ptr || p.mrp || 0));
          setMaxPriceLimit(maxP);
          setPriceRange([0, maxP]);
        } else {
          setMaxPriceLimit(0);
          setPriceRange([0, 0]);
        }

        if (type === "main") {
          try {
            const catRes = await axios.get(
              `${API_BASE}/api/category/sub/${encodeURIComponent(decoded)}`,
            );
            setSubCategories(catRes.data.categories || []);
            setMainCategory(decoded);
          } catch (_) {
            setSubCategories([]);
          }
        }
      } catch (err) {
        console.error("CATEGORY PAGE ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, type]);

  // Load wishlist
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API_BASE}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const ids = res.data.products.map((p) => p._id);
        setWishlist(ids);
      })
      .catch(() => {});
  }, [token]);

  // Filter logic
  const filteredBrandList = useMemo(() => {
    if (!brandQuery) return brands;
    return brands.filter((b) =>
      b.toLowerCase().includes(brandQuery.toLowerCase()),
    );
  }, [brands, brandQuery]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedBrands.size > 0) {
      list = list.filter((p) => selectedBrands.has(p.brandName));
    }

    list = list.filter((p) => {
      const price = p.ptr || p.mrp || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (sortBy === "low-high")
      list.sort((a, b) => (a.ptr || a.mrp) - (b.ptr || b.mrp));
    if (sortBy === "high-low")
      list.sort((a, b) => (b.ptr || b.mrp) - (a.ptr || a.mrp));
    if (sortBy === "newest")
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return list;
  }, [products, selectedBrands, priceRange, sortBy]);

  const toggleBrand = (brand) => {
    const s = new Set(selectedBrands);
    s.has(brand) ? s.delete(brand) : s.add(brand);
    setSelectedBrands(s);
  };

  const handleWishlist = async (e, productId) => {
    e.stopPropagation();
    if (!token) return navigate("/login");

    try {
      if (wishlist.includes(productId)) {
        await axios.delete(`${API_BASE}/api/wishlist/remove/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlist((prev) => prev.filter((id) => id !== productId));
      } else {
        await axios.post(
          `${API_BASE}/api/wishlist/add/${productId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setWishlist((prev) => [...prev, productId]);
      }
    } catch {}
  };

  const pageTitle = useMemo(() => {
    if (type === "brand") return `Brand: ${decodeURIComponent(id)}`;
    return `Shop by Category`;
  }, [type, id]);

  // Filter Sidebar Component (reused for mobile and desktop)
  const FilterSidebar = ({ isMobile = false, onClose }) => (
    <div className={`${isMobile ? 'p-4' : 'sticky top-24'}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header for mobile */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg">Filters</h3>
            <button onClick={onClose} className="p-1">
              <HiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Sub Categories */}
        {type === "main" && subCategories.length > 0 && (
          <div className="border-b border-gray-200">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setOpenCategory(!openCategory)}
            >
              <h4 className="font-semibold text-gray-800">Sub Categories</h4>
              {openCategory ? <HiChevronUp className="text-gray-500" /> : <HiChevronDown className="text-gray-500" />}
            </div>

            {openCategory && (
              <div className="px-4 pb-4 space-y-1">
                {subCategories.map((c) => (
                  <div
                    key={c._id}
                    className="py-2 px-3 hover:bg-blue-50 hover:text-blue-600 rounded-lg cursor-pointer transition-all text-sm"
                    onClick={() => {
                      navigate(`/category/${encodeURIComponent(c.title)}?type=sub`);
                      if (isMobile) onClose();
                    }}
                  >
                    {c.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price Filter */}
        <div className="border-b border-gray-200">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setOpenPrice(!openPrice)}
          >
            <h4 className="font-semibold text-gray-800">Price Range</h4>
            {openPrice ? <HiChevronUp className="text-gray-500" /> : <HiChevronDown className="text-gray-500" />}
          </div>

          {openPrice && (
            <div className="px-4 pb-4">
              <div className="space-y-3">
                <input
                  type="range"
                  min={0}
                  max={maxPriceLimit || 1000}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">₹0</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 font-semibold rounded-full">
                    ₹{priceRange[1]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Brand Filter */}
        {brands.length > 0 && (
          <div>
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setOpenBrand(!openBrand)}
            >
              <h4 className="font-semibold text-gray-800">Brand</h4>
              {openBrand ? <HiChevronUp className="text-gray-500" /> : <HiChevronDown className="text-gray-500" />}
            </div>

            {openBrand && (
              <div className="px-4 pb-4">
                <input
                  placeholder="Search brands..."
                  value={brandQuery}
                  onChange={(e) => setBrandQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
                  {filteredBrandList.map((b) => (
                    <label
                      key={b}
                      className="flex items-center gap-3 p-1 cursor-pointer hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.has(b)}
                        onChange={() => toggleBrand(b)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{b}</span>
                    </label>
                  ))}
                </div>

                {selectedBrands.size > 0 && (
                  <button
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setSelectedBrands(new Set())}
                  >
                    Clear all brands
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="px-4 pt-4 space-y-6 bg-gray-50">
        <ProductSlider />
        <BrandsPage
          category={type === "brand" ? null : decodeURIComponent(id)}
          subCategories={subCategories}
        />
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 bg-white z-20 border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <span
                className="cursor-pointer hover:text-blue-600 hover:underline"
                onClick={() => navigate("/")}
              >
                Home
              </span>

              {type === "brand" && (
                <>
                  <span className="mx-2 text-gray-400">›</span>
                  <span className="text-gray-900 font-medium">Brands</span>
                  <span className="mx-2 text-gray-400">›</span>
                  <span className="text-blue-600 font-medium">{decodeURIComponent(id)}</span>
                </>
              )}

              {type === "main" && (
                <>
                  <span className="mx-2 text-gray-400">›</span>
                  <span className="text-blue-600 font-medium">{decodeURIComponent(id)}</span>
                </>
              )}

              {type === "sub" && mainCategory && (
                <>
                  <span className="mx-2 text-gray-400">›</span>
                  <span
                    className="cursor-pointer hover:text-blue-600 hover:underline"
                    onClick={() =>
                      navigate(`/category/${encodeURIComponent(mainCategory)}?type=main`)
                    }
                  >
                    {mainCategory}
                  </span>
                  <span className="mx-2 text-gray-400">›</span>
                  <span className="text-blue-600 font-medium">{categoryName}</span>
                </>
              )}
            </div>

            {/* Title and controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>

              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                >
                  <HiFilter className="w-5 h-5" />
                  <span>Filter</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {loading ? "Loading..." : `${filteredProducts.length} products`}
                  </span>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="">Sort by: Relevance</option>
                    <option value="low-high">Price: Low to High</option>
                    <option value="high-low">Price: High to Low</option>
                    <option value="newest">Newest Arrivals</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Desktop filter sidebar */}
            <div className="hidden md:block md:col-span-3">
              <FilterSidebar />
            </div>

            {/* Mobile filter sidebar */}
            {mobileFilterOpen && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileFilterOpen(false)} />
                <div className="absolute left-0 top-0 h-full w-80 bg-white overflow-y-auto">
                  <FilterSidebar isMobile onClose={() => setMobileFilterOpen(false)} />
                </div>
              </div>
            )}

            {/* Product grid */}
            <div className="col-span-1 md:col-span-9">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
              )}

              {!loading && (
                <>
                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredProducts.map((p) => (
                        <div
                          key={p._id}
                          className="group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                          onClick={() => navigate(`/product-details/${p._id}`)}
                        >
                          {/* Wishlist button */}
                          <button
                            className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                            onClick={(e) => handleWishlist(e, p._id)}
                          >
                            {wishlist.includes(p._id) ? (
                              <FavoriteIcon style={{ color: "#ef4444", fontSize: 20 }} />
                            ) : (
                              <FavoriteBorderIcon style={{ color: "#6b7280", fontSize: 20 }} />
                            )}
                          </button>

                          {/* Product image */}
                          <div className="aspect-square p-4 bg-white">
                            <img
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              src={p.images?.[0]?.url || "/no-image.png"}
                              alt={p.brandName}
                            />
                          </div>

                          {/* Product details */}
                          <div className="p-4 border-t border-gray-100">
                            {/* Brand name */}
                            <p className="text-xs text-blue-600 font-medium mb-1">{p.brandName}</p>

                            {/* Product name */}
                            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 min-h-[40px]">
                              {p.genericCompositions || p.title || "Product Name"}
                            </h3>

                            {/* Rating (static for demo) */}
                            <div className="flex items-center gap-1 mb-2">
                              <div className="flex text-yellow-400">
                                <FaStar />
                                <FaStar />
                                <FaStar />
                                <FaStar />
                                <FaStarHalfAlt />
                              </div>
                              <span className="text-xs text-gray-500">(124)</span>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-xl font-bold text-gray-900">
                                ₹{p.ptr || p.mrp}
                              </span>
                              {p.mrp && p.ptr && p.mrp !== p.ptr && (
                                <>
                                  <span className="text-sm line-through text-gray-400">
                                    ₹{p.mrp}
                                  </span>
                                  <span className="text-xs text-green-600 font-medium">
                                    {Math.round(((p.mrp - p.ptr) / p.mrp) * 100)}% off
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Delivery badge */}
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MdLocalShipping className="text-green-600" />
                              <span>Free delivery</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Products Found</h3>
                      <p className="text-gray-600 mb-6">
                        {type === "brand"
                          ? `No products found for brand "${decodeURIComponent(id)}"`
                          : "Try adjusting your filters or explore other categories"}
                      </p>
                      <button
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={() => navigate("/")}
                      >
                        Browse All Products
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
