export const cacheProducts = products => {
  localStorage.setItem("agent_products", JSON.stringify(products));
};

export const getCachedProducts = () => {
  return JSON.parse(localStorage.getItem("agent_products")) || [];
};
