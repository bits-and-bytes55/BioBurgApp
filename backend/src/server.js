import http from "http";
import app from "./app.js";
import connectDB from "../config/db.js";

connectDB();

const server = http.createServer(app);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
