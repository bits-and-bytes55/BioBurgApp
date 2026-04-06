import React, { useEffect, useState } from "react";
import Categories from "./Categories";
import HeroSearch from "./HeroSearch";
import ProductCategory from "./ProductCategory";
import HomeSlider from "./HomeSlider";
import Slider from "./Slider";
import PrescriptionBox from "./PrescriptionBox";
import DynamicSectionSlider from "./DynamicSectionSlider";
import CounterSection from "./CounterSection";
import AppDownloadSection from "./AppDownloadSection";
import Testimonialslider from "./Testimonialslider";
import BrandLogo from "./BrandLogo";
import TopHeader from "./TopHeader";
import BTBSection from "./BTBSection";
import BrandLogoSection from "./BrandLogoSection";
import BioburgJewelersSection from "./BioburgJewelersSection";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export default function Home() {
  const [sections, setSections] = useState([]);

  /*LOAD SECTIONS FROM BACKEND */
  useEffect(() => {
    const fetchSections = () => {
      fetch(`${API_BASE}/api/sections/all`)
        .then((res) => res.json())
        .then((data) => {
  // console.log("Bhai kitne sections hai:", data) 
  setSections(data.sections || [])
})
        .catch((err) =>
          console.log("Sections load failed:", err)
        );
    };

    // 🔹 initial load
    fetchSections();

    // LISTENER (ADMIN DRAG & DROP SYNC)
    window.addEventListener("sections-updated", fetchSections);

    return () => {
      window.removeEventListener("sections-updated", fetchSections);
    };
  }, []);

  return (
    <>
      <TopHeader />
      <Categories />
      <HeroSearch />
      <ProductCategory />
      <HomeSlider />
      <Slider />
      <PrescriptionBox />
      <BTBSection />
      <BrandLogoSection />

      {/* ==========================
          DYNAMIC SECTIONS 
      ============================ */}
      {sections.map((sec) => (
  <DynamicSectionSlider
    key={sec._id}
    section={{
      title: sec.title || sec.name,
      key: sec.key || sec.slug || sec.title?.toLowerCase().replace(/\s+/g, '-')
    }}
  />
))}

      <BioburgJewelersSection />

      {/* STATIC SECTIONS BELOW */}
      <CounterSection />
      <AppDownloadSection />
      <Testimonialslider />
    </>
  );
}
