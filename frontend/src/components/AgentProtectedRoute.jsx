import { Navigate } from "react-router-dom";

const AgentProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("agentToken");
  return token ? children : <Navigate to="/agent/login" />;
};

export default AgentProtectedRoute;
