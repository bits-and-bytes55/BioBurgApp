import express from "express";
import cors from "cors";
import routes from "./index.js";

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 IMPORTANT
routes(app);

export default app;
