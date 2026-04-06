import { Navigate } from "react-router-dom";
import { getManufacturerToken } from "../manufacturerApi";

export default function ProtectedManufacturerRoute({ children }) {
  const token = getManufacturerToken();

  if (!token) {
    return <Navigate to="/login/manufacturer" replace />;
  }

  return children;
}
