import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api";

const socket = io(API_BASE_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;
