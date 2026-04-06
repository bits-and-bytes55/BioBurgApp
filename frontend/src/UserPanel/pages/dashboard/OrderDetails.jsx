import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderByIdAPI } from '../../../api/order.api.js'

const BASE_API = import.meta.env.VITE_BASE_API_URL;

const statusColor = (status) => {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "SHIPPED":
      return "info";
    case "CANCELLED":
      return "error";
    default:
      return "warning";
  }
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchOrder = async () => {
    try {
      const res = await getOrderByIdAPI(orderId);
      setOrder(res.data.order || res.data.data || res.data);
    } catch (err) {
      console.error("Fetch order error", err);
    } finally {
      setLoading(false);
    }
  };

  fetchOrder();
}, [orderId]);

  // ⏳ Loader
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Typography sx={{ textAlign: "center", mt: 5 }}>
        Order not found
      </Typography>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>
        🧾 Order Details
      </Typography>

      {/* ORDER INFO */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight="bold">
            Order ID: {order._id}
          </Typography>

          <Chip
            label={order.status}
            color={statusColor(order.status)}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Placed on {new Date(order.createdAt).toLocaleString()}
        </Typography>

        <Typography sx={{ mt: 1 }}>
          Payment Mode: <b>{order.paymentMode}</b>
        </Typography>
      </Paper>

      {/* ADDRESS */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📍 Delivery Address
        </Typography>

        <Typography>{order.address.fullName}</Typography>
        <Typography>{order.address.phone}</Typography>
        <Typography>
          {order.address.addressLine}, {order.address.city}
        </Typography>
        <Typography>
          {order.address.state} - {order.address.pincode}
        </Typography>
      </Paper>

      {/* ITEMS */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🛍️ Items
        </Typography>

        <Divider sx={{ my: 1 }} />

        {order.items.map((item, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              py: 1,
            }}
          >
            <Typography>
              {item.product?.title} × {item.quantity}
            </Typography>
            <Typography>
              ₹{item.quantity * item.price}
            </Typography>
          </Box>
        ))}
      </Paper>

      {/* TOTAL */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">
          Total Amount: ₹{order.totalAmount}
        </Typography>

        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          onClick={() => navigate(`/orders/${order._id}`)}
        >
          Track Order
        </Button>
      </Paper>
    </Box>
  );
}
