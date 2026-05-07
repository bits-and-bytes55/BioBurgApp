// backend/config/socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinOrderRoom", (orderId) => {
      socket.join(orderId);
      console.log(`Joined room: ${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

export const emitOrderUpdate = (orderId, data) => {
  if (io) {
    io.to(orderId).emit("orderStatusUpdated", data);
  }
};

// ← added: lets any controller broadcast on the shared io instance
export const getIO = () => io;