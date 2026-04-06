import api from "./axios";

export const addToCartAPI  = (data) => api.post("/api/cart/add", data);
export const getCartAPI    = ()     => api.get("/api/cart");
export const updateCartAPI = (data) => api.put("/api/cart/update", data);
export const clearCartAPI  = ()     => api.delete("/api/cart/clear");

// variantName as query param so backend identifies the exact item
export const removeFromCartAPI = (productId, variantName = null) => {
  const params = variantName ? `?variantName=${encodeURIComponent(variantName)}` : "";
  return api.delete(`/api/cart/remove/${productId}${params}`);
};