import { Navigate } from "react-router-dom";
import { getFranchiseToken } from "../franchiseApi";

export default function ProtectedFranchiseRoute({ children }) {
  const token = getFranchiseToken();

  if (!token) {
    return <Navigate to="/franchise/login" replace />;
  }

  return children;
}
