import React, { useEffect, useState } from "react";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
// const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${API_BASE}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setWishlist(res.data.products))
      .catch((err) => console.log("Wishlist Error:", err));
  }, []);

  const handleRemove = async (productId) => {
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API_BASE}/api/wishlist/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setWishlist((prev) => prev.filter((item) => item._id !== productId));
    } catch (error) {
      console.log("Remove error", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full">
      <h2 className="font-bold text-xl mb-4">My Wishlist ({wishlist.length})</h2>

      {wishlist.length === 0 && (
        <div className="text-gray-500 text-center py-6 flex flex-col items-center justify-center gap-2">
          <img
            src="src/assets/mywishlist-empty.png"
            className="w-24 h-28 object-contain rounded"
            alt="Empty Wishlist"
          />

          <h3 className="text-lg font-semibold">Your wishlist is empty 🖤</h3>
          <p className="text-sm">You have no items in your wishlist. Start adding!</p>
        </div>
      )}

      <div className="space-y-5">
        {wishlist.map((item) => (
          <div
            key={item._id}
            onClick={() => navigate(`/product-details/${item._id}`)}
            className="border rounded-lg p-4 flex items-start gap-4 hover:shadow-md transition relative cursor-pointer"
          >
            <img
              src={`${API_BASE}/uploads/products/${
                item.images?.[item.primaryImageIndex || 0]
              }`}
              alt={item.title}
              className="w-24 h-28 object-contain rounded"
            />

            <div className="flex-1">
              <h3 className="font-semibold text-sm">{item.title}</h3>

              <div className="text-xs text-blue-600 font-semibold mt-1">
                ✔ Assured
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-bold">₹{item.price}</span>

                {item.mrp && (
                  <span className="text-sm line-through text-gray-400">
                    ₹{item.mrp}
                  </span>
                )}

                {item.mrp && (
                  <span className="text-green-600 text-sm font-medium">
                    {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation(); // stop opening details page
                handleRemove(item._id);
              }}
              className="text-gray-400 hover:text-red-500 absolute right-4 top-4"
            >
              <DeleteIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
