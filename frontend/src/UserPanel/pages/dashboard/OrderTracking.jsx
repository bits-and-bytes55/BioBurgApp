import { useEffect, useState } from "react";
import socket from "../../../socket/socket.js";
import { useParams } from "react-router-dom";

export default function OrderTracking() {
  const { orderId } = useParams();
  const [status, setStatus] = useState("PLACED");

  useEffect(() => {
    // 🔥 GUARD: orderId jab tak na ho, kuchh mat karo
    if (!orderId) return;

    console.log("Joining order room:", orderId);

    socket.emit("joinOrderRoom", orderId);

    const handleStatusUpdate = (data) => {
      setStatus(data.status);
      console.log("Order status updated:", data);
    };

    socket.on("orderStatusUpdated", handleStatusUpdate);

    return () => {
      socket.off("orderStatusUpdated", handleStatusUpdate);
    };
  }, [orderId]);

  return (
    <div>
      <h2>📦 Order Tracking</h2>
      <h3>Status: {status}</h3>
    </div>
  );
}
