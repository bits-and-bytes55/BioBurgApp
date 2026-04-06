import { createContext, useContext, useState, useEffect } from "react";

// ─── Default data (only used on very first load, before admin saves anything) ─

const defaultTopNav = [
  {
    id: 1, label: "Pathology Radiology Tests", link: "/book-lab-test",
    enabled: true,
    submenu: [
      { id: 11, label: "Pathology Lab Tests",           link: "/book-lab-test" },
      { id: 12, label: "Radiology Diagnostics Centre",  link: "/register/radiology-diagnostics" },
    ],
  },
  {
    id: 2, label: "Generic Medicine", link: "/generic-medicine",
    enabled: true,
    submenu: [
      { id: 21, label: "All Products",           link: "/category/all" },
      { id: 22, label: "Non Rx Medicine",         link: "/category/non-rx" },
      { id: 23, label: "Bioburg Patent Brand",    link: "/category/bioburg-patent" },
      { id: 24, label: "Others Generic Brand",    link: "/category/generic-brand" },
      { id: 25, label: "Medical Equipments",      link: "/category/medical-equipments" },
      { id: 26, label: "Tablets",                 link: "/category/tablets" },
      { id: 27, label: "Capsules",                link: "/category/capsules" },
      { id: 28, label: "Injections",              link: "/category/injections" },
      { id: 29, label: "Infusions / IV",          link: "/category/infusions" },
      { id: 30, label: "Syrups",                  link: "/category/syrups" },
      { id: 31, label: "Dry Syrups",              link: "/category/dry-syrups" },
      { id: 32, label: "Soft & Hard Gelatin",     link: "/category/gelatin" },
      { id: 33, label: "Eye & Ear Drops",         link: "/category/eye-ear-drops" },
      { id: 34, label: "Ointments & Creams",      link: "/category/ointments" },
      { id: 35, label: "Hot Products",            link: "/category/hot-products" },
      { id: 36, label: "New Arrivals",            link: "/category/new-arrivals" },
      { id: 37, label: "Homeopathy",              link: "/category/homeopathy" },
      { id: 38, label: "Nutrition & Supplements", link: "/category/nutrition" },
      { id: 39, label: "Beauty & Personal Care",  link: "/category/beauty" },
      { id: 40, label: "Sexual Wellness",         link: "/category/sexual-wellness" },
      { id: 41, label: "Exclusive Store",         link: "/category/exclusive-store" },
      { id: 42, label: "Exclusive Offers",        link: "/category/exclusive-offers" },
    ],
  },
  {
    id: 3, label: "Patent Medicine", link: "/patent-medicine",
    enabled: true,
    submenu: [
      { id: 51, label: "Generic OTC (Over The Counter)", link: "/patent/generic-otc" },
      { id: 52, label: "Generic Non-OTC",                link: "/patent/generic-non-otc" },
    ],
  },
  {
    id: 4, label: "Ethical Medicine", link: "/ethical-medicine",
    enabled: true,
    submenu: [
      { id: 61, label: "Branded OTC (Over The Counter)", link: "/ethical/branded-otc" },
      { id: 62, label: "Branded Non-OTC",                link: "/ethical/branded-non-otc" },
    ],
  },
  {
    id: 5, label: "Products Manufacturer", link: "/manufacturer",
    enabled: true,
    submenu: [
      { id: 71, label: "Pharmaceuticals", link: "/manufacturer/pharma" },
      { id: 72, label: "Homeopathy",      link: "/manufacturer/homeopathy" },
      { id: 73, label: "Ayurvedic",       link: "/manufacturer/ayurvedic" },
      { id: 74, label: "Unani-Herbal",    link: "/manufacturer/unani" },
      { id: 75, label: "API",             link: "/manufacturer/api" },
    ],
  },
  {
    id: 6, label: "Sponsors Brands", link: "/sponsors",
    enabled: true,
    submenu: [
      { id: 81, label: "Cipla",               link: "/category/cipla?type=brand" },
      { id: 82, label: "Abbott",              link: "/category/abbott?type=brand" },
      { id: 83, label: "Sun Pharma",          link: "/category/sun-pharma?type=brand" },
      { id: 84, label: "Alkem",               link: "/category/alkem?type=brand" },
      { id: 85, label: "Lupin",               link: "/category/lupin?type=brand" },
      { id: 86, label: "Dr. Reddy",           link: "/category/dr-reddy?type=brand" },
      { id: 87, label: "Mankind",             link: "/category/mankind?type=brand" },
      { id: 88, label: "Zydus",               link: "/category/zydus?type=brand" },
      { id: 89, label: "Torrent",             link: "/category/torrent?type=brand" },
      { id: 90, label: "Dr. Willmar Schwabe", link: "/category/schwabe?type=brand" },
      { id: 91, label: "SBL",                 link: "/category/sbl?type=brand" },
      { id: 92, label: "Dabur",               link: "/category/dabur?type=brand" },
      { id: 93, label: "Patanjali",           link: "/category/patanjali?type=brand" },
      { id: 94, label: "Himalaya",            link: "/category/himalaya?type=brand" },
    ],
  },
  { id: 7,  label: "Investors Partners", link: "/investors",  enabled: true, submenu: [] },
  {
    id: 8, label: "Jobs Careers", link: "/careers",
    enabled: true,
    submenu: [
      { id: 101, label: "Jobs For Others",  link: "/careers" },
      { id: 102, label: "Ex-Servicemens",   link: "/exservice/jobs" },
    ],
  },
  {
    id: 9, label: "Our Presence", link: "/presence",
    enabled: true,
    submenu: [
      { id: 111, label: "PAN-India",    link: "/presence/india" },
      { id: 112, label: "Abroad India", link: "/presence/abroad" },
    ],
  },
  {
    id: 10, label: "Bioburg Jewelers", link: "/jewelers",
    enabled: true,
    submenu: [
      { id: 121, label: "🏅 Gold",        link: "/jewelers/gold" },
      { id: 122, label: "💎 Diamonds",    link: "/jewelers/diamonds" },
      { id: 123, label: "✨ Earrings",    link: "/jewelers/earrings" },
      { id: 124, label: "💍 Rings",       link: "/jewelers/rings" },
      { id: 125, label: "👗 Daily Wears", link: "/jewelers/daily-wears" },
      { id: 126, label: "🎁 Collections", link: "/jewelers/collections" },
      { id: 127, label: "👰 Wedding",     link: "/jewelers/wedding" },
      { id: 128, label: "🎀 Gifts",       link: "/jewelers/gifts" },
      { id: 129, label: "💰 Investment",  link: "/jewelers/investment" },
    ],
  },
  {
    id: 11, label: "Bioburg Group", link: "/group",
    enabled: true,
    submenu: [
      { id: 131, label: "Bioburg Lifesciences",  link: "/group/lifesciences" },
      { id: 132, label: "Bioburg Janaushadhi",   link: "/group/janaushadhi" },
      { id: 133, label: "Bioburg Infratech",     link: "/group/infratech" },
      { id: 134, label: "BB-Shop",               link: "/group/bb-shop" },
    ],
  },
];

const defaultBottomNav = [
  {
    id: 201, label: "Disease", link: "/disease", enabled: true,
    submenu: [
      { id: 2001, label: "Addiction",            link: "/disease/addiction" },
      { id: 2002, label: "Anxiety & Depression", link: "/disease/anxiety" },
      { id: 2003, label: "Sleeplessness",        link: "/disease/sleeplessness" },
      { id: 2004, label: "Acne & Pimples",       link: "/disease/acne" },
      { id: 2005, label: "Hair Fall",            link: "/disease/hair-fall" },
      { id: 2006, label: "Diabetes",             link: "/disease/diabetes" },
      { id: 2007, label: "Blood Pressure",       link: "/disease/bp" },
      { id: 2008, label: "Asthma",               link: "/disease/asthma" },
      { id: 2009, label: "Arthritis & Joint Pains", link: "/disease/arthritis" },
      { id: 2010, label: "Heart Tonics",         link: "/disease/heart" },
    ],
  },
  { id: 202, label: "Homeopathy",        link: "/homeopathy",     enabled: true, submenu: [
    { id: 2021, label: "SBL",             link: "/homeopathy/sbl" },
    { id: 2022, label: "Reckeweg",        link: "/homeopathy/reckeweg" },
    { id: 2023, label: "Schwabe",         link: "/homeopathy/schwabe" },
    { id: 2024, label: "Mother Tinctures",link: "/homeopathy/mother-tinctures" },
    { id: 2025, label: "Dilutions",       link: "/homeopathy/dilutions" },
  ]},
  { id: 203, label: "Ayurveda",          link: "/ayurveda",       enabled: true, submenu: [
    { id: 2031, label: "Himalaya",        link: "/ayurveda/himalaya" },
    { id: 2032, label: "Dabur",           link: "/ayurveda/dabur" },
    { id: 2033, label: "Patanjali",       link: "/ayurveda/patanjali" },
    { id: 2034, label: "Baidyanath",      link: "/ayurveda/baidyanath" },
  ]},
  { id: 204, label: "Unani",             link: "/unani",          enabled: true, submenu: [
    { id: 2041, label: "Hamdard",         link: "/unani/hamdard" },
    { id: 2042, label: "New Shama",       link: "/unani/new-shama" },
    { id: 2043, label: "Habbe & Qurs",    link: "/unani/habbe" },
  ]},
  { id: 205, label: "Vitamin & Nutrition", link: "/nutrition",    enabled: true, submenu: [
    { id: 2051, label: "Proteins",        link: "/nutrition/proteins" },
    { id: 2052, label: "Fat Burner",      link: "/nutrition/fat-burner" },
    { id: 2053, label: "Vitamins",        link: "/nutrition/vitamins" },
    { id: 2054, label: "Organic Foods",   link: "/nutrition/organic" },
  ]},
  { id: 206, label: "Personal Care",     link: "/personal-care",  enabled: true, submenu: [
    { id: 2061, label: "Skin Care",       link: "/personal-care/skin" },
    { id: 2062, label: "Hair Care",       link: "/personal-care/hair" },
    { id: 2063, label: "Bath & Shower",   link: "/personal-care/bath" },
    { id: 2064, label: "Oral Care",       link: "/personal-care/oral" },
  ]},
  { id: 207, label: "Baby Care",         link: "/baby-care",      enabled: true, submenu: [
    { id: 2071, label: "Bath & Skin",     link: "/baby-care/bath" },
    { id: 2072, label: "Wipes & Diapers", link: "/baby-care/diapers" },
    { id: 2073, label: "Gift Packs",      link: "/baby-care/gifts" },
  ]},
  { id: 208, label: "Hair Care",         link: "/hair-care",      enabled: true, submenu: [] },
  { id: 209, label: "Fitness",           link: "/fitness",        enabled: true, submenu: [
    { id: 2091, label: "Supports & Splints",  link: "/fitness/supports" },
    { id: 2092, label: "Health Devices",      link: "/fitness/devices" },
    { id: 2093, label: "Fitness Equipment",   link: "/fitness/equipment" },
  ]},
  { id: 210, label: "Sexual Wellness",   link: "/sexual-wellness",enabled: true, submenu: [] },
  { id: 211, label: "Immunity Boosters", link: "/immunity",       enabled: true, submenu: [] },
  { id: 212, label: "Supports & Braces", link: "/supports",       enabled: true, submenu: [] },
  { id: 213, label: "Surgical Stores",   link: "/surgical",       enabled: true, submenu: [] },
  { id: 214, label: "Medicals Equipment's", link: "/equipment",   enabled: true, submenu: [] },
  { id: 215, label: "Pets Care",         link: "/pets",           enabled: true, submenu: [] },
  { id: 216, label: "Health Insurance",  link: "/insurance",      enabled: true, submenu: [] },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const NavContext = createContext(null);

const STORAGE_KEY_TOP    = "bioburg_top_nav";
const STORAGE_KEY_BOTTOM = "bioburg_bottom_nav";

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function NavProvider({ children }) {
  const [topNav, setTopNavRaw]    = useState(() => loadFromStorage(STORAGE_KEY_TOP,    defaultTopNav));
  const [bottomNav, setBottomNavRaw] = useState(() => loadFromStorage(STORAGE_KEY_BOTTOM, defaultBottomNav));

  // ── Persist on every change ────────────────────────────────────────────────
  const setTopNav = (data) => {
    setTopNavRaw(data);
    try { localStorage.setItem(STORAGE_KEY_TOP, JSON.stringify(data)); } catch {}
  };

  const setBottomNav = (data) => {
    setBottomNavRaw(data);
    try { localStorage.setItem(STORAGE_KEY_BOTTOM, JSON.stringify(data)); } catch {}
  };

  // ── Derived: only enabled items exposed to the frontend ───────────────────
  const activeTopNav    = topNav.filter((i) => i.enabled);
  const activeBottomNav = bottomNav.filter((i) => i.enabled);

  return (
    <NavContext.Provider
      value={{
        // Full data (admin uses these)
        topNav,    setTopNav,
        bottomNav, setBottomNav,
        // Filtered data (frontend uses these)
        activeTopNav,
        activeBottomNav,
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export const useNav = () => {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside <NavProvider>");
  return ctx;
};