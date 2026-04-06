import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

export default function PartnerLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("partnerToken");
    if (!token) {
      navigate("/partner/login");
    } else {
      if (window.location.pathname === "/partner" || window.location.pathname === "/partner/") {
        navigate("/partner/dashboard");
      }
    }
  }, [navigate]);

  return <Outlet />;
}