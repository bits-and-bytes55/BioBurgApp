import React from "react";
import { useNavigate } from "react-router-dom";


export default function AgentTopbar() {
    const navigate = useNavigate();
   const logout = () => {
    localStorage.removeItem("agentToken");
    navigate("/agent/login");
  };

  return (
    <div style={{
      height: 60, background: "#0f172a",
      color: "#fff", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      padding: "0 20px"
    }}>
      <h3>Marketing Agent Panel</h3>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
