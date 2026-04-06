import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout () {
  return (
    <>
      {/* <Navbar /> */}
      <div style={{ minHeight: "80vh", padding: "20px" }}>
        <Outlet />  {/* 👈 Page content goes here */}
      </div>
      {/* <Footer /> */}
    </>
  );
};

 
