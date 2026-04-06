export const BASE_API = import.meta.env.VITE_API_BASE_URL;

export const C = {
  primary:     "#16a34a",
  primaryDark: "#14532d",
  green:       "#10b981",
  greenLight:  "#ecfdf5",
  greenBorder: "#6ee7b7",
  amber:       "#f59e0b",
  amberLight:  "#fffbeb",
  amberBorder: "#fde68a",
  red:         "#ef4444",
  redLight:    "#fff1f2",
  redBorder:   "#fecdd3",
  rose:        "#f43f5e",
  violet:      "#7c3aed",
  slate:       "#64748b",
  text:        "#0f172a",
  muted:       "#94a3b8",
  border:      "#f1f5f9",
  border2:     "#e2e8f0",
  bg:          "#f8fafc",
};

export const GS = `
  @keyframes ph-spin  { to { transform: rotate(360deg); } }
  @keyframes ph-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  @keyframes ph-slide { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:translateX(0); } }
  @keyframes ph-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
`;