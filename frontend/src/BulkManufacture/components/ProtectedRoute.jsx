import { Navigate } from "react-router-dom";
import { getBulkManufacturingToken } from "../bulkManufactureApi";

export default function ProtectedBulkManufacturingRoute({ children }) {
  const token = getBulkManufacturingToken();

  if (!token) {
    return <Navigate to="/bulk-manufacturing/login" replace />;
  }

  return children;
}
