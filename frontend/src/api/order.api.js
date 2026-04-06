import api from "./axios";

export const getMyOrdersAPI = () =>
  api.get("/api/orders/my-orders");

export const getOrderByIdAPI = (orderId) =>
  api.get(`/api/orders/${orderId}`);
