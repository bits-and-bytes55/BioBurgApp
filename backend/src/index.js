import cartRoutes from "../routes/cart.routes.js";

export default function routes(app) {
  app.use("/api/cart", cartRoutes);
}
