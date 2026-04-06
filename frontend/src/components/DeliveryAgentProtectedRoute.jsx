import { Navigate } from "react-router-dom";

const DeliveryAgentProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("deliveryToken");
  return token ? children : <Navigate to="/delivery-agent/login" />;
};

export default DeliveryAgentProtectedRoute;
