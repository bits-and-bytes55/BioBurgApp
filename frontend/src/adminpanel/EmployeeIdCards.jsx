import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box, Typography, Button, Paper, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Chip,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, IconButton,
  Tooltip, InputAdornment, LinearProgress,
} from "@mui/material";
import {
  Badge as BadgeIcon, Download as DownloadIcon, Visibility as ViewIcon,
  Search as SearchIcon, Send as SendIcon, Close as CloseIcon,
  Work as WorkIcon, Groups as GroupsIcon, LocalOffer as MarketingIcon,
  Refresh as RefreshIcon, CheckCircle as CheckIcon, HourglassEmpty as PendingIcon,
  CloudUpload as UploadIcon, Delete as DeleteIcon,
} from "@mui/icons-material";

import frontLogoUrl  from "../assets/IDCARDS/frontlogo.png";
import backLogoUrl   from "../assets/IDCARDS/backlogo.png";
import authorityUrl  from "../assets/IDCARDS/authority.png";

const BASE       = import.meta.env.VITE_API_BASE_URL;
const BRAND_BLUE = "#1e3a5f";
const BRAND_GOLD = "#c9a84c";
const DEPT_COLORS = {
  "Jobs & Careers":  "#3b82f6",
  "Ex-Servicemen":   "#7c3aed",
  "Marketing Agent": "#059669",
  "Manual":          "#f59e0b",
};

// ─── UTILITIES ─────────────────────────────────────────────────────────────────

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "", cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, cy);
      line = words[i] + " ";
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, cy);
  return cy;
}

async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawSilhouette(ctx, cx, cy, r) {
  ctx.fillStyle = "#a8c4d0";
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.2, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.55, r * 0.52, r * 0.42, 0, Math.PI, 0);
  ctx.fill();
}

function generateBarcode(ctx, empId, x, y, w, h) {
  let seed = 0;
  for (let i = 0; i < empId.length; i++) seed += empId.charCodeAt(i) * (i + 1);
  let rng = seed >>> 0, bx = x;
  let bar = true;
  while (bx < x + w) {
    rng = ((rng * 1664525 + 1013904223) | 0) >>> 0;
    const bw = (rng % 3) + 1;
    if (bar) { ctx.fillStyle = "#111111"; ctx.fillRect(bx, y, bw, h); }
    bx += bw; bar = !bar;
  }
}

// ─── HEADER (uses frontlogo.png) ───────────────────────────────────────────────

async function drawHeader(ctx, W) {
  const TEAL   = "#26bfbf";
  const YELLOW = "#f5c012";
  const NAVY   = "#0d3d5e";
  const WHITE  = "#ffffff";

  // Main teal band
  ctx.fillStyle = TEAL;
  ctx.fillRect(0, 0, W, 82);

  // Front logo image
  const logo = await loadImage(frontLogoUrl);
  if (logo) {
    ctx.drawImage(logo, 6, 4, 72, 72);
  }

  // Company name
  ctx.save();
  ctx.fillStyle = WHITE;
  ctx.font = "bold 18px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("BIOBURG LIFESCIENCES", 84, 38);
  ctx.restore();

  // Subtitle inside teal
  ctx.save();
  ctx.fillStyle = NAVY;
  ctx.font = "bold 9.5px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("PHARMACEUTICALS DISTRIBUTOR", 84, 60);
  ctx.restore();

  // Yellow wave
  ctx.save();
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(0, 82);
  ctx.bezierCurveTo(W * 0.30, 66,  W * 0.70, 98,  W, 82);
  ctx.lineTo(W, 96);
  ctx.bezierCurveTo(W * 0.70, 112, W * 0.30, 80,  0, 96);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Second teal band below wave
  ctx.save();
  ctx.fillStyle = TEAL;
  ctx.beginPath();
  ctx.moveTo(0, 96);
  ctx.bezierCurveTo(W * 0.30, 112, W * 0.70, 80, W, 96);
  ctx.lineTo(W, 150);
  ctx.lineTo(0, 150);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

//  FOOTER 

function drawFooter(ctx, W, H) {
  const TEAL   = "#26bfbf";
  const YELLOW = "#f5c012";

  ctx.save();
  ctx.fillStyle = TEAL;
  ctx.beginPath();
  ctx.moveTo(0, H - 88);
  ctx.bezierCurveTo(W * 0.30, H - 104, W * 0.70, H - 72, W, H - 88);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(0, H - 88);
  ctx.bezierCurveTo(W * 0.30, H - 104, W * 0.70, H - 72, W, H - 88);
  ctx.lineTo(W, H - 74);
  ctx.bezierCurveTo(W * 0.70, H - 58, W * 0.30, H - 90, 0, H - 74);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// FRONT CARD 

async function drawFront(ctx, emp, W, H) {
  // White card background
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 14);
  ctx.fill();
  ctx.restore();

  await drawHeader(ctx, W);
  drawFooter(ctx, W, H);

  //  Photo oval frame 
  const px = W / 2, py = 236;
  const rx = 62, ry = 72; // oval portrait shape

  // Outer border ring
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(px, py, rx + 5, ry + 5, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#b8d4de";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Photo clip region
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#cce4ee";
  ctx.fill();
  ctx.clip();

  if (emp.photo) {
    const img = await loadImage(emp.photo);
    if (img) {
      const aspect = img.width / img.height;
      const dh = ry * 2;
      const dw = dh * aspect;
      ctx.drawImage(img, px - dw / 2, py - dh / 2, dw, dh);
    } else {
      drawSilhouette(ctx, px, py, rx);
    }
  } else {
    drawSilhouette(ctx, px, py, rx);
  }
  ctx.restore();

  // Name
  ctx.save();
  ctx.fillStyle    = "#1a3a6e";
  ctx.font         = "bold 17px 'Arial Black', Georgia, serif";
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText((emp.name || "—").toUpperCase(), W / 2, 328);
  ctx.restore();

  // Designation 
  ctx.save();
  ctx.fillStyle = "#cc2200";
  ctx.font      = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(emp.designation || emp.role || "Employee", W / 2, 348);
  ctx.restore();

  // Divider
  ctx.save();
  ctx.strokeStyle = "#dddddd";
  ctx.lineWidth   = 0.8;
  ctx.beginPath();
  ctx.moveTo(24, 360); ctx.lineTo(W - 24, 360);
  ctx.stroke();
  ctx.restore();

  //Info fields 
  const fmt = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  };

  const fields = [
    { label: "Date Of Issue", value: fmt(emp.issuedAt || emp.dateOfIssue) },
    { label: "Date of Birth", value: fmt(emp.dateOfBirth) },
    { label: "Contact No.",   value: emp.phone || emp.mobile || "—" },
  ];

  const labelX = 32, colonX = 156, valueX = 168, startY = 380, rowH = 28;

  fields.forEach(({ label, value }, i) => {
    const y = startY + i * rowH;
    ctx.save();
    ctx.fillStyle = "#444444"; ctx.font = "12px Arial";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(label, labelX, y);
    ctx.fillText(":", colonX, y);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#111111"; ctx.font = "bold 12px Arial";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(value, valueX, y);
    ctx.restore();
  });

  //  Authority stamp 
  const stamp = await loadImage(authorityUrl);
  if (stamp) {
    ctx.drawImage(stamp, 14, H - 95, 80, 80);
  }

  //  Barcode 
  const empId = emp.employeeId || "BB10001001";
  const bcX = 108, bcY = H - 78, bcW = 200, bcH = 28;
  generateBarcode(ctx, empId, bcX, bcY, bcW, bcH);

  ctx.save();
  ctx.fillStyle = "#111111"; ctx.font = "bold 9px monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillText(empId, bcX + bcW / 2, bcY + bcH + 11);
  ctx.restore();
}

// BACK CARD 

async function drawBack(ctx, emp, W, H) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 14);
  ctx.fill();
  ctx.restore();

  await drawHeader(ctx, W);
  drawFooter(ctx, W, H);

  // ── Back wreath logo (backlogo.png) — left side ──
  const backLogo = await loadImage(backLogoUrl);
  if (backLogo) {
    ctx.drawImage(backLogo, 16, 160, 148, 148);
  }

  // "BIOBURG LIFESCIENCES" below wreath
  ctx.save();
  ctx.fillStyle    = "#26bfbf";
  ctx.font         = "bold 8px Arial";
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("BIOBURG LIFESCIENCES", 90, 318);
  ctx.restore();

  //  Motto section right side 
  ctx.save();
  ctx.fillStyle    = "#111111";
  ctx.font         = "bold 12px Arial";
  ctx.textAlign    = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Motto Of Bioburg", 178, 180);
  ctx.restore();

  const mottos = [
    "Nothing Beyond Our Products",
    "Bio Burg Helping Peoples",
    "Our Challenge Is Life Sciences",
    "Biosciences, Research & Development",
  ];
  ctx.save();
  ctx.fillStyle    = "#222222";
  ctx.font         = "10px Arial";
  ctx.textAlign    = "left";
  ctx.textBaseline = "alphabetic";
  mottos.forEach((m, i) => {
    ctx.fillText("• " + m, 178, 198 + i * 17);
  });
  ctx.restore();

  //  Divider 
  ctx.save();
  ctx.strokeStyle = "#cccccc"; ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(16, 322); ctx.lineTo(W - 16, 322);
  ctx.stroke();
  ctx.restore();

  // Terms 
  ctx.save();
  ctx.fillStyle    = "#cc0000";
  ctx.font         = "bold 11px Arial";
  ctx.textAlign    = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Terms And Conditions:-", 16, 340);
  ctx.restore();

  ctx.save();
  ctx.fillStyle    = "#222222";
  ctx.font         = "10px Arial";
  ctx.textBaseline = "alphabetic";
  wrapText(
    ctx,
    "This Card is not transferable. It is the property of the \"Bioburg Lifesciences\" and is to be returned to the issuing authority on cessation of the service.",
    16, 356, W - 32, 15
  );
  ctx.restore();

  // If Found
  ctx.save();
  ctx.fillStyle    = "#111111";
  ctx.font         = "bold 10.5px Arial";
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("If Found Please Return it to", W / 2, 396);
  const tw = ctx.measureText("If Found Please Return it to").width;
  ctx.strokeStyle = "#111111"; ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(W / 2 - tw / 2, 398); ctx.lineTo(W / 2 + tw / 2, 398);
  ctx.stroke();
  ctx.restore();

  // Contact block 
  const contacts = [
    { label: "Address",   value: ": B-119, 2nd Floor, Lane No-7, Laxmi Vihar," },
    { label: "",          value: "  Mohan Garden, Dwarka Mor, New Delhi-110059." },
    { label: "",          value: "" },
    { label: "E-Mail ID", value: ": bioburg.lifesciences@yahoo.com" },
    { label: "Phone",     value: ": 9990719273, 9868013337, 6005459761" },
    { label: "Website",   value: ": https://www.bioburglifesciences.com" },
  ];
  const lw = { Address: 50, "E-Mail ID": 58, Phone: 42, Website: 50 };

  contacts.forEach(({ label, value }, i) => {
    const y = 414 + i * 15;
    if (label) {
      ctx.save();
      ctx.fillStyle = "#111111"; ctx.font = "bold 9.5px Arial";
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(label, 16, y);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "#222222"; ctx.font = "9.5px Arial";
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(value, 16 + (lw[label] || 42), y);
      ctx.restore();
    } else if (value.trim()) {
      ctx.save();
      ctx.fillStyle = "#222222"; ctx.font = "9.5px Arial";
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(value, 16, y);
      ctx.restore();
    }
  });

  // Footer note 
  ctx.save();
  ctx.fillStyle    = "#ffffff";
  ctx.font         = "7.5px Arial";
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    "Display the Security Pass at all times while outside BIOBURG Premises",
    W / 2, H - 10
  );
  ctx.restore();
}

//  ENTRY POINT 

async function drawIDCard(emp, side = "front") {
  const W = 360, H = 590, DPR = 2;
  const canvas  = document.createElement("canvas");
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (side === "front") await drawFront(ctx, emp, W, H);
  else                  await drawBack(ctx, emp, W, H);
  return canvas.toDataURL("image/png");
}

//  PHOTO UPLOAD 

const toBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

function PhotoUploadField({ value, onChange }) {
  const inputRef = useRef();
  const [previewLocal, setPreviewLocal] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("Image must be under 5 MB.");     return; }
    const base64 = await toBase64(file);
    setPreviewLocal(base64);
    onChange(base64);
    toast.success("Photo ready!");
  };

  const handleClear = () => {
    onChange(""); setPreviewLocal(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayImg = value || previewLocal;

  return (
    <Box sx={{ gridColumn: "1 / -1" }}>
      <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.75} textTransform="uppercase" letterSpacing={0.4}>
        Employee Photo <span style={{ color: "#ef4444" }}>*</span>
      </Typography>

      {displayImg ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Avatar src={displayImg} sx={{ width: 64, height: 64, borderRadius: 2, border: "2px solid #cbd5e1" }} />
          <Box flex={1}>
            <Typography fontSize={13} fontWeight={600} color="success.main">✓ Photo uploaded</Typography>
            <Typography fontSize={11} color="text.secondary" mt={0.3}>This photo will appear on the ID card</Typography>
          </Box>
          <IconButton size="small" onClick={handleClear} sx={{ bgcolor: "#fee2e2", "&:hover": { bgcolor: "#fecaca" } }}>
            <DeleteIcon fontSize="small" sx={{ color: "#ef4444" }} />
          </IconButton>
        </Box>
      ) : (
        <Box
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: "2px dashed #cbd5e1", borderRadius: 2, p: 3, textAlign: "center",
            cursor: "pointer", bgcolor: "#f8fafc", transition: "all 0.2s",
            "&:hover": { borderColor: BRAND_BLUE, bgcolor: "#f0f9ff" },
          }}
        >
          <UploadIcon sx={{ fontSize: 32, color: "#94a3b8", mb: 0.5 }} />
          <Typography fontSize={13} fontWeight={600} color="text.primary">Click or drag & drop to upload</Typography>
          <Typography fontSize={11} color="text.secondary" mt={0.3}>JPG, PNG, WEBP — max 5 MB</Typography>
        </Box>
      )}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])} />
    </Box>
  );
}

//  MAIN COMPONENT 

const AdminEmployeeIDCards = () => {
  const token   = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab]               = useState(0);
  const [employees, setEmployees]   = useState([]);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const [issuedCards, setIssuedCards]     = useState([]);
  const [loadingCards, setLoadingCards]   = useState(false);
  const [search, setSearch]               = useState("");
  const [sourceFilter, setSourceFilter]   = useState("all");
  const [genOpen, setGenOpen]             = useState(false);
  const [selEmp, setSelEmp]               = useState(null);
  const [cardForm, setCardForm] = useState({
    designation: "", department: "", location: "India",
    validTill: "2026-12-31", dateOfBirth: "", photo: "",
  });
  const [generating, setGenerating]       = useState(false);
  const [previewOpen, setPreviewOpen]     = useState(false);
  const [previewCard, setPreviewCard]     = useState(null);
  const [previewFront, setPreviewFront]   = useState("");
  const [previewBack, setPreviewBack]     = useState("");
  const [previewSide, setPreviewSide]     = useState("front");

  const fetchAllEmployees = useCallback(async () => {
    setLoadingEmp(true);
    const pool = [];
    try {
      const maRes = await axios.get(`${BASE}/api/admin/marketing-agents`, { headers });
      if (maRes?.data?.agents) {
        maRes.data.agents.forEach((a) =>
          pool.push({ _id: a._id, name: a.name || a.fullName || "—", email: a.email, phone: a.phone || a.mobile, photo: a.photo || a.profileImage, source: "Marketing Agent", rawData: a })
        );
      }
    } catch {
      try {
        const r2 = await axios.get(`${BASE}/api/marketing-agents`, { headers });
        const list = r2?.data?.agents || r2?.data?.data || r2?.data || [];
        (Array.isArray(list) ? list : []).forEach((a) =>
          pool.push({ _id: a._id, name: a.name || a.fullName || "—", email: a.email, phone: a.phone || a.mobile, photo: a.photo || a.profileImage, source: "Marketing Agent", rawData: a })
        );
      } catch {}
    }
    try {
      const jaRes = await axios.get(`${BASE}/api/jobs-careers/applications`, { headers });
      if (jaRes?.data?.data) {
        jaRes.data.data.filter((a) => ["hired","approved","joining"].includes(a.status || a.stage))
          .forEach((a) => pool.push({ _id: a._id, name: a.fullName || a.applicantName || "—", email: a.email, phone: a.phone, photo: a.photo, source: "Jobs & Careers", rawData: a }));
      }
    } catch {}
    try {
      const esRes = await axios.get(`${BASE}/api/exservice-jobs`, { headers });
      if (esRes?.data?.applications) {
        esRes.data.applications.filter((a) => ["hired","approved"].includes(a.status))
          .forEach((a) => pool.push({ _id: a._id, name: a.applicantName || a.name || "—", email: a.email, phone: a.phone, photo: a.photo, source: "Ex-Servicemen", rawData: a }));
      }
    } catch {}
    setEmployees(pool);
    setLoadingEmp(false);
  }, []);

  const fetchIssuedCards = useCallback(async () => {
    setLoadingCards(true);
    try {
      const res = await axios.get(`${BASE}/api/employee-id-cards`, { headers });
      const cards = Array.isArray(res.data) ? res.data : res.data?.cards || res.data?.data || [];
      setIssuedCards(cards);
    } catch {
      try {
        const res2 = await axios.get(`${BASE}/api/cards/all`, { headers });
        setIssuedCards(Array.isArray(res2.data) ? res2.data : res2.data?.cards || []);
      } catch { setIssuedCards([]); }
    }
    setLoadingCards(false);
  }, []);

  useEffect(() => { fetchAllEmployees(); fetchIssuedCards(); }, [fetchAllEmployees, fetchIssuedCards]);

  const openGenDialog = (emp) => {
    setSelEmp(emp);
    setCardForm({
      designation: emp.rawData?.designation || emp.rawData?.role || "",
      department:  emp.rawData?.department  || emp.source || "",
      location:    emp.rawData?.location    || "India",
      validTill:   "2026-12-31",
      dateOfBirth: emp.rawData?.dateOfBirth || "",
      photo:       emp.photo || "",
    });
    setGenOpen(true);
  };

  const handleIssueCard = async () => {
    if (!selEmp) return;
    if (!cardForm.photo) { toast.error("Please upload an employee photo before issuing the card."); return; }
    setGenerating(true);
    const employeeId = `BB${Date.now().toString().slice(-6)}`;
    const empData = {
      ...selEmp, employeeId,
      designation: cardForm.designation, department: cardForm.department,
      location: cardForm.location,       validTill:   cardForm.validTill,
      dateOfBirth: cardForm.dateOfBirth, photo:        cardForm.photo,
      name: selEmp.name,                 issuedAt:     new Date().toISOString(),
    };
    const frontImg = await drawIDCard(empData, "front").catch(() => "");
    const backImg  = await drawIDCard(empData, "back").catch(() => "");
    try {
      await axios.post(`${BASE}/api/employee-id-cards`, {
        employeeRef: selEmp._id, employeeId, name: selEmp.name, email: selEmp.email,
        phone: selEmp.phone, source: selEmp.source,
        designation: cardForm.designation, department: cardForm.department,
        location: cardForm.location, validTill: cardForm.validTill,
        dateOfBirth: cardForm.dateOfBirth, photo: cardForm.photo,
        cardImage: frontImg, cardImageBack: backImg, issuedAt: empData.issuedAt,
      }, { headers });
    } catch (err) { console.warn("Save card API error:", err?.response?.data || err.message); }
    toast.success(`ID card issued for ${selEmp.name}!`);
    setGenOpen(false); setGenerating(false);
    fetchIssuedCards();
    setPreviewCard(empData); setPreviewFront(frontImg); setPreviewBack(backImg);
    setPreviewSide("front"); setPreviewOpen(true);
  };

  const handlePreview = async (card) => {
    setPreviewCard(card); setPreviewFront(""); setPreviewBack(""); setPreviewSide("front"); setPreviewOpen(true);
    const front = card.cardImage     || await drawIDCard(card, "front").catch(() => "");
    const back  = card.cardImageBack || await drawIDCard(card, "back").catch(() => "");
    setPreviewFront(front); setPreviewBack(back);
  };

  const handleDownload = (side) => {
    const img = side === "front" ? previewFront : previewBack;
    if (!img) return;
    const a = document.createElement("a");
    a.href = img; a.download = `ID_${previewCard?.employeeId || "card"}_${side}.png`; a.click();
    toast.success(`${side === "front" ? "Front" : "Back"} downloaded!`);
  };

  const filteredEmployees = employees.filter((e) => {
    const ms = !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.email || "").toLowerCase().includes(search.toLowerCase());
    const mf = sourceFilter === "all" || e.source === sourceFilter;
    return ms && mf;
  });
  const filteredCards = issuedCards.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const sources = ["all", "Marketing Agent", "Jobs & Careers", "Ex-Servicemen"];
  const currentPreviewImg = previewSide === "front" ? previewFront : previewBack;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, background: `linear-gradient(135deg, ${BRAND_BLUE}, #2a5298)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(30,58,95,0.4)" }}>
            <BadgeIcon sx={{ color: BRAND_GOLD, fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color={BRAND_BLUE}>Employee ID Cards</Typography>
            <Typography variant="body2" color="text.secondary">Issue, manage and distribute employee identity cards</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => { fetchAllEmployees(); fetchIssuedCards(); }}
          sx={{ bgcolor: BRAND_BLUE, borderRadius: 2, textTransform: "none", "&:hover": { bgcolor: "#162d4a" } }}>
          Refresh Data
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        {[
          { label: "Total Employees",  value: employees.length,                                             icon: <GroupsIcon />,   color: "#3b82f6" },
          { label: "Marketing Agents", value: employees.filter((e) => e.source === "Marketing Agent").length, icon: <MarketingIcon />, color: "#059669" },
          { label: "Jobs Recruits",    value: employees.filter((e) => e.source === "Jobs & Careers").length,  icon: <WorkIcon />,      color: "#f59e0b" },
          { label: "IDs Issued",       value: issuedCards.length,                                            icon: <BadgeIcon />,     color: "#8b5cf6" },
        ].map((s) => (
          <Paper key={s.label} elevation={2} sx={{ p: 2.5, borderRadius: 3, borderLeft: `4px solid ${s.color}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="body2" color="text.secondary" fontSize={12}>{s.label}</Typography>
                <Typography variant="h5" fontWeight={700} mt={0.5}>{s.value}</Typography>
              </Box>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Tabs */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary">
            <Tab label="Employee Pool"   icon={<GroupsIcon fontSize="small" />} iconPosition="start" sx={{ textTransform: "none", fontWeight: 600 }} />
            <Tab label="Issued ID Cards" icon={<BadgeIcon  fontSize="small" />} iconPosition="start" sx={{ textTransform: "none", fontWeight: 600 }} />
          </Tabs>
        </Box>

        <Box sx={{ px: 2, py: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField size="small" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          {tab === 0 && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Source</InputLabel>
              <Select value={sourceFilter} label="Source" onChange={(e) => setSourceFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                {sources.map((s) => <MenuItem key={s} value={s}>{s === "all" ? "All Sources" : s}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Tab 0 — Employee Pool */}
        {tab === 0 && (
          <TableContainer>
            {loadingEmp ? <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box> : (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["Employee","Contact","Source","Status","Action"].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>No employees found.</TableCell></TableRow>
                  ) : filteredEmployees.map((emp) => {
                    const alreadyIssued = issuedCards.some((c) => c.employeeRef === emp._id);
                    return (
                      <TableRow key={emp._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar src={emp.photo} sx={{ width: 38, height: 38, bgcolor: BRAND_BLUE, fontSize: 14 }}>{emp.name?.[0]}</Avatar>
                            <Box>
                              <Typography fontWeight={600} fontSize={14}>{emp.name}</Typography>
                              <Typography fontSize={12} color="text.secondary">{emp.rawData?.designation || emp.rawData?.role || "—"}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography fontSize={13}>{emp.email || "—"}</Typography>
                          <Typography fontSize={12} color="text.secondary">{emp.phone || "—"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={emp.source} size="small" sx={{ bgcolor: `${DEPT_COLORS[emp.source] || "#64748b"}18`, color: DEPT_COLORS[emp.source] || "#64748b", fontWeight: 600, fontSize: 11, borderRadius: 1.5 }} />
                        </TableCell>
                        <TableCell>
                          {alreadyIssued
                            ? <Chip icon={<CheckIcon fontSize="small" />}   label="ID Issued" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                            : <Chip icon={<PendingIcon fontSize="small" />} label="Pending"   size="small" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />}
                        </TableCell>
                        <TableCell>
                          <Button variant="contained" size="small" startIcon={<BadgeIcon fontSize="small" />} onClick={() => openGenDialog(emp)}
                            sx={{ textTransform: "none", borderRadius: 1.5, fontSize: 12, bgcolor: alreadyIssued ? "#64748b" : BRAND_BLUE, "&:hover": { bgcolor: alreadyIssued ? "#475569" : "#162d4a" } }}>
                            {alreadyIssued ? "Re-issue" : "Issue ID"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}

        {/* Tab 1 — Issued Cards */}
        {tab === 1 && (
          <TableContainer>
            {loadingCards ? <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box> : (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["Employee","Employee ID","Department","Source","Issued On","Valid Till","Actions"].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCards.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>No ID cards issued yet.</TableCell></TableRow>
                  ) : filteredCards.map((card) => (
                    <TableRow key={card._id || card.employeeId} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar src={card.photo} sx={{ width: 36, height: 36, bgcolor: BRAND_BLUE, fontSize: 13 }}>{card.name?.[0]}</Avatar>
                          <Box>
                            <Typography fontWeight={600} fontSize={14}>{card.name}</Typography>
                            <Typography fontSize={12} color="text.secondary">{card.designation || "—"}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography fontFamily="monospace" fontWeight={700} fontSize={13} color={BRAND_BLUE}>{card.employeeId}</Typography></TableCell>
                      <TableCell><Typography fontSize={13}>{card.department || "—"}</Typography></TableCell>
                      <TableCell>
                        <Chip label={card.source || "—"} size="small" sx={{ bgcolor: `${DEPT_COLORS[card.source] || "#64748b"}18`, color: DEPT_COLORS[card.source] || "#64748b", fontWeight: 600, fontSize: 11 }} />
                      </TableCell>
                      <TableCell><Typography fontSize={13}>{card.issuedAt ? new Date(card.issuedAt).toLocaleDateString("en-IN") : "—"}</Typography></TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={600} color={new Date(card.validTill) < new Date() ? "error.main" : "success.main"}>
                          {card.validTill ? new Date(card.validTill).toLocaleDateString("en-IN") : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="View Card">
                            <IconButton size="small" onClick={() => handlePreview(card)} sx={{ bgcolor: "#e8f0fe", "&:hover": { bgcolor: "#c7d9fe" } }}>
                              <ViewIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download Front">
                            <IconButton size="small" onClick={async () => {
                              const img = card.cardImage || await drawIDCard(card, "front").catch(() => "");
                              if (!img) return;
                              const a = document.createElement("a");
                              a.href = img; a.download = `ID_${card.employeeId}_front.png`; a.click();
                            }} sx={{ bgcolor: "#f0fdf4", "&:hover": { bgcolor: "#dcfce7" } }}>
                              <DownloadIcon fontSize="small" color="success" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}
      </Paper>

      {/* Issue Dialog */}
      <Dialog open={genOpen} onClose={() => setGenOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${BRAND_BLUE}, #2a5298)`, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <BadgeIcon sx={{ color: BRAND_GOLD }} />
            <Typography fontWeight={700}>Issue Employee ID Card</Typography>
          </Box>
          <IconButton onClick={() => setGenOpen(false)} sx={{ color: "white" }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selEmp && (
            <>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
                <Avatar src={cardForm.photo || selEmp.photo} sx={{ width: 52, height: 52, bgcolor: BRAND_BLUE, fontSize: 18 }}>{selEmp.name?.[0]}</Avatar>
                <Box>
                  <Typography fontWeight={700}>{selEmp.name}</Typography>
                  <Typography fontSize={13} color="text.secondary">{selEmp.email}</Typography>
                  <Chip label={selEmp.source} size="small" sx={{ mt: 0.5, bgcolor: `${DEPT_COLORS[selEmp.source]}18`, color: DEPT_COLORS[selEmp.source], fontWeight: 600 }} />
                </Box>
              </Paper>
              <Typography variant="subtitle2" color="text.secondary" mb={1.5} textTransform="uppercase" letterSpacing={0.5} fontSize={11}>Card Details</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField label="Designation / Role" size="small" fullWidth value={cardForm.designation} onChange={(e) => setCardForm((p) => ({ ...p, designation: e.target.value }))} />
                <TextField label="Department" size="small" fullWidth value={cardForm.department} onChange={(e) => setCardForm((p) => ({ ...p, department: e.target.value }))} />
                <TextField label="Date of Birth" size="small" fullWidth type="date" value={cardForm.dateOfBirth} onChange={(e) => setCardForm((p) => ({ ...p, dateOfBirth: e.target.value }))} InputLabelProps={{ shrink: true }} />
                <TextField label="Valid Till" size="small" fullWidth type="date" value={cardForm.validTill} onChange={(e) => setCardForm((p) => ({ ...p, validTill: e.target.value }))} InputLabelProps={{ shrink: true }} />
                <TextField label="Location / City" size="small" fullWidth value={cardForm.location} onChange={(e) => setCardForm((p) => ({ ...p, location: e.target.value }))} sx={{ gridColumn: "1 / -1" }} />
                <PhotoUploadField value={cardForm.photo} onChange={(url) => setCardForm((p) => ({ ...p, photo: url }))} />
              </Box>
              <Paper sx={{ mt: 2, p: 2, bgcolor: "#fffbeb", borderRadius: 2, border: "1px solid #fcd34d" }}>
                <Typography fontSize={12} color="#92400e">ℹ️ An Employee ID will be auto-generated and the card image will be saved to the employee's dashboard.</Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setGenOpen(false)} sx={{ textTransform: "none" }} color="inherit">Cancel</Button>
          <Button variant="contained"
            startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            onClick={handleIssueCard} disabled={generating || !cardForm.photo}
            sx={{ textTransform: "none", bgcolor: BRAND_BLUE, "&:hover": { bgcolor: "#162d4a" }, borderRadius: 2, px: 3 }}>
            {generating ? "Generating…" : "Generate & Issue Card"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: "#0f172a" } }}>
        <DialogTitle sx={{ color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <BadgeIcon sx={{ color: BRAND_GOLD }} />
            <Typography fontWeight={700} color="white">ID Card Preview</Typography>
          </Box>
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: "rgba(255,255,255,0.6)" }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pb: 2 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            {["front", "back"].map((s) => (
              <Button key={s} variant={previewSide === s ? "contained" : "outlined"} size="small" onClick={() => setPreviewSide(s)}
                sx={{ textTransform: "capitalize", borderRadius: 2, bgcolor: previewSide === s ? BRAND_GOLD : "transparent", color: previewSide === s ? "#1a1a1a" : BRAND_GOLD, borderColor: BRAND_GOLD, "&:hover": { bgcolor: BRAND_GOLD, color: "#1a1a1a" } }}>
                {s === "front" ? "Front Side" : "Back Side"}
              </Button>
            ))}
          </Box>
          {currentPreviewImg ? (
            <Box sx={{ borderRadius: 2, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", border: `2px solid ${BRAND_GOLD}`, maxWidth: 360, width: "100%" }}>
              <img src={currentPreviewImg} alt="ID Card" style={{ width: "100%", display: "block" }} />
            </Box>
          ) : (
            <CircularProgress sx={{ color: BRAND_GOLD, my: 4 }} />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "center", gap: 2 }}>
          <Button variant="contained" size="large" startIcon={<DownloadIcon />} onClick={() => handleDownload("front")} disabled={!previewFront}
            sx={{ textTransform: "none", borderRadius: 2, px: 3, fontWeight: 700, background: `linear-gradient(135deg, ${BRAND_GOLD}, #b8860b)`, color: "#1a1a1a", "&:hover": { background: `linear-gradient(135deg, #ffd700, #b8860b)` } }}>
            Download Front
          </Button>
          <Button variant="outlined" size="large" startIcon={<DownloadIcon />} onClick={() => handleDownload("back")} disabled={!previewBack}
            sx={{ textTransform: "none", borderRadius: 2, px: 3, fontWeight: 700, borderColor: BRAND_GOLD, color: BRAND_GOLD, "&:hover": { bgcolor: `${BRAND_GOLD}18` } }}>
            Download Back
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AdminEmployeeIDCards;