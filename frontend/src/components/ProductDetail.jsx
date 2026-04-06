// ProductDetail.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Typography, Button, IconButton, Chip, Divider, Box, Rating,
  LinearProgress, Breadcrumbs, Link, Tabs, Tab, Card, CardContent,
  Avatar, Alert, Container, Dialog, DialogContent, DialogTitle,
  DialogActions, CircularProgress, TextField, Accordion,
  AccordionSummary, AccordionDetails, Tooltip,
} from "@mui/material";
import {
  Add as AddIcon, Remove as RemoveIcon, ShoppingCart, Favorite, QrCode2 as QrCode2Icon,
  FavoriteBorder, Share, VerifiedUser, HealthAndSafety, CheckCircle,
  Warning, Receipt, Description, Medication, Shield, ArrowRightAlt,
  FlashOn, Close, ZoomIn, PlayCircle, ChevronLeft, ChevronRight,
  ContentCopy, ExpandMore, Star, Percent, Verified, LocalShipping,
  AssignmentReturn, Security, SupportAgent, Edit, Person as PersonIcon,
  CalendarToday as CalendarIcon, OpenInNew, ThumbUp, ThumbDown,
  WorkOutline, School, LinkedIn, AccessTime, LocalOffer, AddShoppingCart,
  Recommend as RecommendIcon, PhotoCamera, Videocam, DeleteOutline,
  Groups as GroupsIcon, TrendingDown, BrokenImage,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../context/useCart";
import { getActiveToken, isLoggedIn } from "../api/authHelpers";
import PrescriptionUploadModal from "../components/PrescriptionUploadModal";
import ProductQRCode from "../components/ProductQRCode";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return "0";
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
};

function resolveImg(img) {
  if (!img) return "";
  if (typeof img === "string") return img.startsWith("http") || img.startsWith("data:") ? img : "";
  if (img.secure_url) return img.secure_url;
  if (img.url)        return img.url;
  if (img.imageUrl)   return img.imageUrl; 
  return "";
}

function getAuthorPhoto(a) {
  if (!a) return "";
  if (typeof a.imageUrl === "string" && a.imageUrl.startsWith("http")) return a.imageUrl;
  return resolveImg(a.image);
}

function getVideoUrl(v) {
  if (!v) return null;
  if (typeof v === "string" && v.trim()) return v.trim();
  if (v?.url) return v.url;
  if (v?.secure_url) return v.secure_url;
  return null;
}

async function verifyOrderForProduct(rawOrderId, productId) {
  const cleanId = rawOrderId.replace(/^#/, "").trim();
  if (!cleanId) throw new Error("Please enter a valid order ID");
  const token = getActiveToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let res;
  try {
    res = await axios.get(`${API_BASE}/api/orders/${encodeURIComponent(cleanId)}`, { headers, timeout: 10000 });
  } catch (e) {
    const s = e.response?.status;
    if (s === 404) throw new Error("Order not found. Please check your order ID.");
    if (s === 401 || s === 403) throw new Error("Please login to verify your order.");
    throw new Error("Could not reach the server — please try again later.");
  }
  const order = res.data?.order || res.data?.data || res.data;
  if (!order?._id) throw new Error("Order not found.");
  const items = order.items || order.products || order.orderItems || [];
  const has = items.some((item) => {
    const pid = item.productId?._id || item.productId || item.product?._id || item.product;
    return String(pid) === String(productId);
  });
  if (!has) throw new Error("This product was not found in that order.");
  return order;
}

//Cloudinary upload
async function uploadToCloudinary(file, resourceType = "image") {
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) throw new Error("Cloudinary not configured");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  fd.append("folder", "review_media");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id, resourceType };
}

//Countdown
function CountdownTimer({ expiryDate }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiryDate) - new Date();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000),
        m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 86400000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiryDate]);
  if (!timeLeft || timeLeft === "Expired") return null;
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, bgcolor: urgent ? "#fef2f2" : "#fff7ed", border: `1px solid ${urgent ? "#fca5a5" : "#fed7aa"}`, borderRadius: 1, px: 1, py: 0.25 }}>
      <AccessTime sx={{ fontSize: 11, color: urgent ? "#dc2626" : "#ea580c" }} />
      <Typography variant="caption" fontWeight={700} color={urgent ? "#dc2626" : "#ea580c"} sx={{ animation: urgent ? "blink 1s infinite" : "none" }}>
        Ends in {timeLeft}
      </Typography>
    </Box>
  );
}

function FlashOffer({ text, flashing }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, bgcolor: flashing ? "#fff3e0" : "#f5f5f5", border: `1px solid ${flashing ? "#ff9800" : "#e0e0e0"}`, borderRadius: 1.5, px: 1.5, py: 0.5 }}>
      {flashing && <FlashOn sx={{ fontSize: 14, color: "#ff9800", animation: "blink 1s infinite" }} />}
      <Typography variant="caption" fontWeight={600} color={flashing ? "#e65100" : "text.secondary"}>{text}</Typography>
    </Box>
  );
}

function CouponChip({ code, discount, type, expiryDate, onApply }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onApply?.(code);
  };
  return (
    <Box onClick={handle} sx={{ display: "inline-flex", flexDirection: "column", gap: 0.25, border: "1.5px dashed #1565c0", borderRadius: 2, px: 1.5, py: 0.75, cursor: "pointer", bgcolor: "#f0f7ff", "&:hover": { bgcolor: "#dbeafe" } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Percent sx={{ fontSize: 14, color: "#1565c0" }} />
        <Typography variant="caption" fontWeight={700} color="#1565c0">{code}</Typography>
        <Typography variant="caption" color="text.secondary">{type === "percent" ? `${discount}% off` : `₹${discount} off`}</Typography>
        <ContentCopy sx={{ fontSize: 12, color: copied ? "green" : "#999" }} />
      </Box>
      {expiryDate && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <LocalOffer sx={{ fontSize: 10, color: "#ea580c" }} />
          <Typography variant="caption" color="#ea580c" fontWeight={600} sx={{ fontSize: 10 }}>Limited · </Typography>
          <CountdownTimer expiryDate={expiryDate} />
        </Box>
      )}
    </Box>
  );
}

//Image Gallery
function ImageGallery({ images = [], video, discount }) {
  const [idx, setIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const imgRef = useRef(null);
  const mainSrc = images[idx]?.url || "/no-image.png";
  const videoUrl = getVideoUrl(video);
  const handleMouseMove = (e) => {
    if (!imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  return (
    <Box>
      <Box sx={{ position: "relative", border: "1px solid #e5e7eb", borderRadius: 3, overflow: "hidden", bgcolor: "#fff", mb: 1.5 }}>
        {discount > 0 && (
          <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 2, bgcolor: "#dc2626", color: "white", borderRadius: 1, px: 1, py: 0.25, fontSize: 12, fontWeight: 700 }}>
            {discount}% OFF
          </Box>
        )}
        <Box ref={imgRef} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} onMouseMove={handleMouseMove} onClick={() => setLightbox(true)}
          sx={{ height: { xs: 220, sm: 300, md: 360 }, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-in", overflow: "hidden" }}>
          <img src={mainSrc} alt="Product" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: hovering ? "scale(1.6)" : "scale(1)", transition: hovering ? "none" : "transform .3s" }} />
          <Box sx={{ position: "absolute", bottom: 8, right: 8, bgcolor: "rgba(0,0,0,0.45)", color: "white", borderRadius: 1, px: 1, py: 0.25, display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 0.5, fontSize: 11 }}>
            <ZoomIn sx={{ fontSize: 14 }} /> Hover to zoom
          </Box>
        </Box>
        {images.length > 1 && (
          <>
            <IconButton onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)} sx={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,.9)", width: 32, height: 32 }}><ChevronLeft fontSize="small" /></IconButton>
            <IconButton onClick={() => setIdx((i) => (i + 1) % images.length)} sx={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,.9)", width: 32, height: 32 }}><ChevronRight fontSize="small" /></IconButton>
          </>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5 }}>
        {images.map((img, i) => (
          <Box key={i} onClick={() => setIdx(i)} sx={{ flexShrink: 0, width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 }, borderRadius: 1.5, border: idx === i ? "2px solid #1565c0" : "1.5px solid #e5e7eb", overflow: "hidden", cursor: "pointer" }}>
            <img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          </Box>
        ))}
        {videoUrl && (
          <Box onClick={() => setShowVideo(true)} sx={{ flexShrink: 0, width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 }, borderRadius: 1.5, border: "1.5px solid #e5e7eb", bgcolor: "#000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <PlayCircle sx={{ color: "white", fontSize: 22 }} />
          </Box>
        )}
      </Box>
      <Dialog open={lightbox} onClose={() => setLightbox(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0, bgcolor: "#000", position: "relative" }}>
          <IconButton onClick={() => setLightbox(false)} sx={{ position: "absolute", top: 8, right: 8, color: "white", zIndex: 1 }}><Close /></IconButton>
          <img src={mainSrc} style={{ width: "100%", maxHeight: "85vh", objectFit: "contain" }} alt="" />
        </DialogContent>
      </Dialog>
      {videoUrl && (
        <Dialog open={showVideo} onClose={() => setShowVideo(false)} maxWidth="md" fullWidth>
          <DialogContent sx={{ p: 0, position: "relative" }}>
            <IconButton onClick={() => setShowVideo(false)} sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}><Close /></IconButton>
            <video controls autoPlay style={{ width: "100%", display: "block" }} src={videoUrl} />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}

// ─── Author popup ─────────────────────────────────────────────────────────────
function AuthorProfilePopup({ author, open, onClose }) {
  if (!author) return null;
  const photo = getAuthorPhoto(author);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", mx: { xs: 1, sm: 2 } } }}>
      <Box sx={{ background: "linear-gradient(135deg,#1565c0,#0d47a1)", pb: 5, pt: 3, px: { xs: 2, sm: 3 }, position: "relative" }}>
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, color: "white" }}><Close /></IconButton>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar src={photo || undefined} sx={{ width: 90, height: 90, border: "4px solid white", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", mb: 1.5, bgcolor: "#1976d2" }}>
            <PersonIcon sx={{ fontSize: 44 }} />
          </Avatar>
          <Typography variant="h6" fontWeight={800} color="white" textAlign="center">{author.name}</Typography>
          {author.designation && <Typography variant="body2" color="rgba(255,255,255,0.85)" textAlign="center">{author.designation}</Typography>}
          <Chip label={author.role} size="small" sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600, fontSize: 11 }} />
          {author.experience_years && <Typography variant="caption" color="rgba(255,255,255,0.7)" sx={{ mt: 0.5 }}>{author.experience_years} Years Experience</Typography>}
        </Box>
      </Box>
      <DialogContent sx={{ pt: 0, px: 0 }}>
        {author.linkedin && (
          <Box sx={{ px: 3, py: 1.5, bgcolor: "#f0f9ff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 1 }}>
            <LinkedIn sx={{ color: "#0077b5", fontSize: 20 }} />
            <Typography variant="caption" color="#0077b5" fontWeight={600} component="a" href={author.linkedin} target="_blank" rel="noopener noreferrer">View LinkedIn Profile</Typography>
          </Box>
        )}
        <Box sx={{ mx: { xs: 2, sm: 3 }, mt: 2.5, mb: 2, bgcolor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 2, p: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.75}>
            <VerifiedUser sx={{ fontSize: 18, color: "#0284c7" }} />
            <Typography variant="subtitle2" fontWeight={700} color="#0284c7">Verified {author.role}</Typography>
          </Box>
          <Typography variant="body2" color="#374151">
            All content {author.role === "Written By" ? "written by" : "reviewed by"} {author.name?.split(" ")[0]} undergoes our editorial review process.
          </Typography>
        </Box>
        {author.about && (
          <Box sx={{ px: { xs: 2, sm: 3 }, mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1} color="#111827">About</Typography>
            <Typography variant="body2" color="#374151" sx={{ lineHeight: 1.8 }}>{author.about}</Typography>
          </Box>
        )}
        {(author.education || []).length > 0 && (
          <Box sx={{ px: { xs: 2, sm: 3 }, mb: 2.5 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}><School sx={{ color: "#1565c0", fontSize: 18 }} /><Typography variant="subtitle2" fontWeight={700} color="#111827">Education</Typography></Box>
            {author.education.map((e, i) => (
              <Box key={i} sx={{ pl: 1, borderLeft: "3px solid #bfdbfe", mb: 1.5 }}>
                <Typography variant="body2" fontWeight={700}>{e.degree}</Typography>
                <Typography variant="caption" color="#1565c0" display="block">{e.institution}</Typography>
                {e.year && <Typography variant="caption" color="text.secondary" display="block">{e.year}</Typography>}
              </Box>
            ))}
          </Box>
        )}
        {(author.experience || []).length > 0 && (
          <Box sx={{ px: { xs: 2, sm: 3 }, mb: 2.5 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}><WorkOutline sx={{ color: "#1565c0", fontSize: 18 }} /><Typography variant="subtitle2" fontWeight={700} color="#111827">Experience</Typography></Box>
            {author.experience.map((ex, i) => (
              <Box key={i} sx={{ pl: 1, borderLeft: "3px solid #bbf7d0", mb: 1.5 }}>
                <Typography variant="body2" fontWeight={700}>{ex.role}</Typography>
                <Typography variant="caption" color="#16a34a" display="block">{ex.organization}</Typography>
                {ex.period && <Typography variant="caption" color="text.secondary" display="block">{ex.period}</Typography>}
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ mx: { xs: 2, sm: 3 }, mb: 2, p: 1.5, bgcolor: "#fffbeb", borderRadius: 2, border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="caption" color="#92400e" fontWeight={600}>Issue with this content?</Typography>
          <Button size="small" color="warning" variant="outlined" sx={{ fontSize: 11 }}>Report Problem</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── Author Sidebar — FIXED image resolution ──────────────────────────────────
function AuthorSidebar({ authors = [], lastUpdated, marketerName, marketerAddress, countryOfOrigin }) {
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  if (!authors.length && !marketerName && !lastUpdated) return null;
  return (
    <>
      <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          {authors.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Author Details</Typography>
              {authors.map((a, i) => {
                const photo = getAuthorPhoto(a);
                return (
                  <Box key={i} onClick={() => setSelectedAuthor(a)} display="flex" alignItems="center" gap={1.5} mb={1.5}
                    sx={{ cursor: "pointer", p: 1, borderRadius: 2, border: "1px solid transparent", "&:hover": { border: "1px solid #bfdbfe", bgcolor: "#f0f7ff" }, transition: "all .15s" }}>
                    <Avatar
                      src={photo || undefined}
                      sx={{ width: 44, height: 44, bgcolor: "#1565c0", flexShrink: 0, border: "2px solid #e3f2fd" }}
                    >
                      {/* fallback icon shown when no valid photo */}
                      <PersonIcon />
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="caption" color="text.secondary" display="block">{a.role}</Typography>
                      <Typography variant="body2" fontWeight={700} color="#1565c0" noWrap>{a.name}</Typography>
                      {a.designation && <Typography variant="caption" color="text.secondary" noWrap>{a.designation}</Typography>}
                    </Box>
                    <OpenInNew sx={{ fontSize: 14, color: "#9ca3af", flexShrink: 0 }} />
                  </Box>
                );
              })}
            </>
          )}
          {lastUpdated && (
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <CalendarIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
              <Typography variant="caption" color="text.secondary">Last updated: <strong>{lastUpdated}</strong></Typography>
            </Box>
          )}
          {(marketerName || marketerAddress || countryOfOrigin) && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Marketer Details</Typography>
              {marketerName && <Typography variant="body2" fontWeight={600}>{marketerName}</Typography>}
              {marketerAddress && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{marketerAddress}</Typography>}
              {countryOfOrigin && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Origin: <strong>{countryOfOrigin}</strong></Typography>}
            </>
          )}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle sx={{ fontSize: 18, color: "#16a34a" }} />
            <Box>
              <Typography variant="caption" fontWeight={700} color="#15803d" display="block">LegitScript Certified</Typography>
              <Typography variant="caption" color="#166534">Click to Know More</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <AuthorProfilePopup author={selectedAuthor} open={!!selectedAuthor} onClose={() => setSelectedAuthor(null)} />
    </>
  );
}

function RecommendationsSidebar({ recommendations = [] }) {
  const [expanded, setExpanded] = useState(false);
  if (!recommendations.length) return null;
  const visible = expanded ? recommendations : recommendations.slice(0, 2);
  return (
    <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <RecommendIcon sx={{ color: "#16a34a", fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={700}>Doctor Recommendations</Typography>
        </Box>
        {visible.map((rec, i) => {
          const photo = resolveImg(rec.image);
          return (
            <Box key={rec.id || i} display="flex" alignItems="center" gap={1.5} mb={1.5} sx={{ p: 1, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              {photo ? (
                <Box component="img" src={photo} sx={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #16a34a" }} />
              ) : (
                <Avatar sx={{ width: 40, height: 40, bgcolor: "#e8f5e9", flexShrink: 0 }}><PersonIcon sx={{ color: "#16a34a" }} /></Avatar>
              )}
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={700} color="#15803d" noWrap>{rec.label}</Typography>
                {rec.description && <Typography variant="caption" color="text.secondary" noWrap>{rec.description}</Typography>}
              </Box>
              <CheckCircle sx={{ fontSize: 16, color: "#16a34a", flexShrink: 0 }} />
            </Box>
          );
        })}
        {recommendations.length > 2 && (
          <Button size="small" onClick={() => setExpanded((e) => !e)} sx={{ color: "#16a34a", fontSize: 11, p: 0 }}>
            {expanded ? "Show less ▲" : `+${recommendations.length - 2} more ▼`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Certifications — FIXED image resolution ──────────────────────────────────
function CertificationsBadges({ certifications = [] }) {
  if (!certifications.length) return null;
  return (
    <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <Verified sx={{ color: "#1565c0", fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={700}>Certifications & Quality</Typography>
        </Box>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {certifications.map((cert, i) => {
            const logo = resolveImg(cert.image);
            return (
              <Box key={cert.id || i} sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.75, borderRadius: 2, bgcolor: "#f0f7ff", border: "1px solid #bfdbfe", "&:hover": { bgcolor: "#dbeafe", boxShadow: 1 } }}>
                {logo ? (
                  <Box component="img" src={logo} sx={{ width: 28, height: 28, objectFit: "contain" }}
                    onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <Verified sx={{ fontSize: 18, color: "#1565c0" }} />
                )}
                <Box>
                  <Typography variant="caption" fontWeight={700} color="#1565c0" display="block" sx={{ lineHeight: 1.2 }}>{cert.label}</Typography>
                  {cert.issuedBy && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{cert.issuedBy}</Typography>}
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── B2B Pricing Comparison ────────────────────────────────────────────────────
/**
 * Shows when user is NOT a standard customer (role !== "customer" / "b2c").
 * Displays: normal B2C price  →  your price  +  how much you save vs B2C
 */
function B2BPricingBanner({ rolePrice, productMrp }) {
  if (!rolePrice) return null;
  const role = (rolePrice.role || "").toLowerCase();
  // Only show for non-B2C roles that actually have a different price
  const isB2C = role === "customer" || role === "b2c" || role === "";
  if (isB2C) return null;

  const customerPrice = parseFloat(rolePrice.customerPrice || productMrp || 0);
  const myPrice = parseFloat(rolePrice.finalRate || productMrp || 0);
  const saving = customerPrice > myPrice ? customerPrice - myPrice : 0;
  const savingPct = customerPrice > 0 && saving > 0 ? Math.round((saving / customerPrice) * 100) : 0;

  if (myPrice >= customerPrice) return null; // no special deal — nothing to show

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Box sx={{ mb: 2, p: 0, borderRadius: 2, overflow: "hidden", border: "1.5px solid #a855f7" }}>
      {/* header */}
      <Box sx={{ bgcolor: "#7e22ce", px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <GroupsIcon sx={{ color: "white", fontSize: 18 }} />
        <Typography variant="caption" fontWeight={700} color="white">{roleLabel} Exclusive Pricing</Typography>
        <Chip label={`Save ${savingPct}% vs retail`} size="small" sx={{ ml: "auto", bgcolor: "#fde68a", color: "#78350f", fontWeight: 700, height: 20, fontSize: 10 }} />
      </Box>
      {/* body */}
      <Box sx={{ bgcolor: "#faf5ff", px: 2, py: 1.5 }}>
        <Box sx={{ display: "flex", gap: { xs: 2, sm: 4 }, alignItems: "center", flexWrap: "wrap" }}>
          {/* Normal customer price */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>Normal Customer Price</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ textDecoration: "line-through", color: "#9ca3af" }}>₹{fmt(customerPrice)}</Typography>
          </Box>
          <TrendingDown sx={{ color: "#7e22ce", fontSize: 28, display: { xs: "none", sm: "block" } }} />
          {/* My price */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="#7e22ce" display="block" fontWeight={700}>Your {roleLabel} Price</Typography>
            <Typography variant="h5" fontWeight={800} color="#7e22ce">₹{fmt(myPrice)}</Typography>
          </Box>
          {/* Savings badge */}
          <Box sx={{ ml: { xs: 0, sm: "auto" }, bgcolor: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 2, px: 2, py: 1, textAlign: "center" }}>
            <Typography variant="caption" color="#15803d" fontWeight={700} display="block">You Save</Typography>
            <Typography variant="h6" fontWeight={800} color="#15803d">₹{fmt(saving)}</Typography>
            <Typography variant="caption" color="#16a34a">vs regular price</Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="#6b21a8" sx={{ display: "block", mt: 1, fontStyle: "italic" }}>
          * This price is exclusive to {roleLabel} accounts and not available to general customers.
        </Typography>
      </Box>
    </Box>
  );
}

// ─── ProductCombos ────────────────────────────────────────────────────────────
function ProductCombos({ combos = [], currentProductId, onAddBundle }) {
  const navigate = useNavigate();
  if (!Array.isArray(combos) || combos.length === 0) return null;
  const activeCombos = combos.filter((combo) => {
    if (combo.active === false) return false;
    const allIds = [
      ...(Array.isArray(combo.products) ? combo.products.map((p) => String(p?._id || p?.productId || p)) : []),
      ...(Array.isArray(combo.productIds) ? combo.productIds.map((id) => String(id)) : []),
    ].filter(Boolean);
    return allIds.includes(String(currentProductId).trim());
  });
  if (activeCombos.length === 0) return null;
  return (
    <Card sx={{ borderRadius: 2, border: "2px solid #e0e7ff", mb: 2 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AddShoppingCart sx={{ color: "#1565c0" }} />
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: 15, sm: 18 } }}>Frequently Bought Together</Typography>
        </Box>
        {activeCombos.map((combo, idx) => {
          const comboPrice = parseFloat(combo.comboPrice || combo.price || 0);
          const originalPrice = parseFloat(combo.originalPrice || combo.mrp || 0);
          const saving = originalPrice > comboPrice ? originalPrice - comboPrice : 0;
          const comboProducts = Array.isArray(combo.products) ? combo.products : [];
          return (
            <Box key={combo._id || combo.id || idx} sx={{ mb: 2, p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid #c7d2fe", bgcolor: "#f5f3ff" }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>{combo.name || `Bundle ${idx + 1}`}</Typography>
              {comboProducts.length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={1} mb={1.5} alignItems="center">
                  {comboProducts.map((p, i) => {
                    const name = p?.brandName || p?.name || `Product ${i + 1}`;
                    const img = resolveImg(p?.images?.[0]) || p?.images?.[0]?.url;
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && <Typography variant="h6" color="text.secondary">+</Typography>}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "white", borderRadius: 1.5, border: "1px solid #e0e7ff", px: 1.5, py: 0.75 }}>
                          {img && <img src={img} style={{ width: 36, height: 36, objectFit: "contain" }} alt="" />}
                          <Box>
                            <Typography variant="caption" fontWeight={700} display="block">{name}</Typography>
                            {p?.mrp && <Typography variant="caption" color="text.secondary">₹{fmt(p.mrp)}</Typography>}
                          </Box>
                        </Box>
                      </React.Fragment>
                    );
                  })}
                </Box>
              )}
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Box>
                  <Box display="flex" alignItems="baseline" gap={1}>
                    <Typography variant="h6" fontWeight={800} color="#1565c0">₹{fmt(comboPrice)}</Typography>
                    {saving > 0 && <Typography variant="caption" sx={{ textDecoration: "line-through", color: "#9ca3af" }}>₹{fmt(originalPrice)}</Typography>}
                  </Box>
                  {saving > 0 && <Typography variant="caption" color="#16a34a" fontWeight={700}>You save ₹{fmt(saving)}</Typography>}
                </Box>
                <Button variant="contained" startIcon={<AddShoppingCart />} onClick={() => onAddBundle?.(combo)} sx={{ borderRadius: 2, fontWeight: 700, fontSize: { xs: 12, sm: 14 } }}>Add Bundle</Button>
              </Box>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Product Voting ───────────────────────────────────────────────────────────
function ProductVoting({ product, onVoted }) {
  const thumbsUp = product.thumbsUp || 0;
  const thumbsDown = product.thumbsDown || 0;
  const total = thumbsUp + thumbsDown;
  const likesPct = total > 0 ? Math.round((thumbsUp / total) * 100) : null;
  const [open, setOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const openVote = (type) => {
    if (!isLoggedIn()) { toast.error("Please login to vote"); return; }
    setPendingVote(type); setOrderId(""); setOrderError(""); setVerifiedOrder(null); setOpen(true);
  };
  const handleVerify = async () => {
    setVerifying(true); setOrderError(""); setVerifiedOrder(null);
    try { setVerifiedOrder(await verifyOrderForProduct(orderId, product._id)); }
    catch (e) { setOrderError(e.message); }
    finally { setVerifying(false); }
  };
  const handleSubmit = async () => {
    if (!verifiedOrder) { setOrderError("Please verify your order first"); return; }
    setSubmitting(true);
    try {
      const token = getActiveToken();
      await axios.post(`${API_BASE}/api/products/${product._id}/vote`, { type: pendingVote, orderId: verifiedOrder._id }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(pendingVote === "up" ? "Thanks!" : "Thanks!");
      setOpen(false); onVoted?.();
    } catch (e) {
      if (e.response?.status === 409) toast.error("Already voted.");
      else toast.error(e.response?.data?.message || "Failed");
    } finally { setSubmitting(false); }
  };
  return (
    <>
      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #f3f4f6" }}>
        <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
          <Typography variant="caption" fontWeight={700} color="text.secondary">Was this product helpful?</Typography>
          {likesPct !== null && <Chip label={`${likesPct}% liked`} size="small" color={likesPct >= 70 ? "success" : likesPct >= 40 ? "warning" : "error"} sx={{ height: 18, fontSize: 10 }} />}
        </Box>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Box onClick={() => openVote("up")} sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1, borderRadius: 2, cursor: "pointer", border: "1.5px solid #d1fae5", bgcolor: "#f0fdf4", "&:hover": { bgcolor: "#dcfce7" } }}>
            <ThumbUp sx={{ fontSize: 18, color: "#16a34a" }} /><Typography variant="body2" fontWeight={700} color="#15803d">{thumbsUp}</Typography>
          </Box>
          <Box onClick={() => openVote("down")} sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1, borderRadius: 2, cursor: "pointer", border: "1.5px solid #fee2e2", bgcolor: "#fff5f5", "&:hover": { bgcolor: "#fee2e2" } }}>
            <ThumbDown sx={{ fontSize: 18, color: "#dc2626" }} /><Typography variant="body2" fontWeight={700} color="#b91c1c">{thumbsDown}</Typography>
          </Box>
          {total > 0 && (
            <Box flex={1} minWidth={100} sx={{ ml: 0.5 }}>
              <LinearProgress variant="determinate" value={likesPct} sx={{ height: 8, borderRadius: 4, bgcolor: "#fee2e2", "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 4 } }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, mt: 0.25, display: "block" }}>{total} vote{total !== 1 ? "s" : ""}</Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
          <Box display="flex" alignItems="center" gap={1}>
            {pendingVote === "up" ? <ThumbUp sx={{ color: "#16a34a" }} /> : <ThumbDown sx={{ color: "#dc2626" }} />}
            {pendingVote === "up" ? "I like this product" : "I don't recommend this"}
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Alert severity="info" sx={{ py: 0.75 }}><Typography variant="caption">Verify a purchase containing <strong>{product.brandName}</strong> to vote.</Typography></Alert>
            <Box sx={{ p: 2, bgcolor: "#f9fafb", borderRadius: 2, border: "1px solid #e5e7eb" }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Verify Your Purchase</Typography>
              <Box display="flex" gap={1} alignItems="flex-start">
                <TextField size="small" label="Order ID" value={orderId} onChange={(e) => { setOrderId(e.target.value); setOrderError(""); setVerifiedOrder(null); }} error={!!orderError} helperText={orderError || "e.g. ABC12345"} placeholder="Order number" sx={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && !verifying && handleVerify()} />
                <Button variant="outlined" size="small" onClick={handleVerify} disabled={verifying || !orderId.trim()} sx={{ mt: 0.5, minWidth: 72, flexShrink: 0 }}>
                  {verifying ? <CircularProgress size={16} /> : "Verify"}
                </Button>
              </Box>
              {verifiedOrder && <Alert severity="success" sx={{ mt: 1, py: 0.5 }}><Typography variant="caption"><strong>✓ Order verified!</strong></Typography></Alert>}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!verifiedOrder || submitting} color={pendingVote === "up" ? "success" : "error"} startIcon={pendingVote === "up" ? <ThumbUp /> : <ThumbDown />}>
            {submitting ? <CircularProgress size={18} color="inherit" /> : pendingVote === "up" ? "Submit Like" : "Submit Dislike"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function VariantSelector({ variants = [], selectedIdx, onSelect, discountPct = 0 }) {
  if (!variants.length) return null;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Select Pack Size</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {variants.map((v, i) => {
          const out = v.stock !== undefined && v.stock <= 0;
          const sel = selectedIdx === i;
          return (
            <Box key={i} onClick={() => !out && onSelect(i)} sx={{ border: sel ? "2px solid #1565c0" : "1.5px solid #d1d5db", borderRadius: 2, px: 2, py: 1, cursor: out ? "not-allowed" : "pointer", bgcolor: sel ? "#eff6ff" : out ? "#f9fafb" : "white", opacity: out ? 0.5 : 1, "&:hover": !out ? { borderColor: "#1565c0" } : {}, minWidth: 80, textAlign: "center" }}>
              <Typography variant="body2" fontWeight={sel ? 700 : 500} color={sel ? "#1565c0" : "#374151"}>{v.name}</Typography>
              {v.price && <>
                <Typography variant="caption" color={sel ? "#1565c0" : "text.secondary"} fontWeight={700}>
                  ₹{fmt(discountPct > 0 ? parseFloat((parseFloat(v.price) * (1 - discountPct / 100)).toFixed(2)) : v.price)}
                </Typography>
                {discountPct > 0 && <Typography variant="caption" sx={{ textDecoration: "line-through", color: "#9ca3af", fontSize: 10 }}>₹{fmt(v.price)}</Typography>}
              </>}
              {out && <Typography variant="caption" color="error" display="block" sx={{ fontSize: 9 }}>Out of stock</Typography>}
              {!out && v.stock !== undefined && v.stock <= 5 && <Typography variant="caption" color="warning.main" display="block" sx={{ fontSize: 9 }}>Only {v.stock} left</Typography>}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function CombinationSelector({ combinations = [], selectedIdx, onSelect }) {
  if (!combinations.length) return null;
  const attrKeys = combinations[0]?.attributes ? Object.keys(combinations[0].attributes) : [];
  if (!attrKeys.length) return null;
  const selected = selectedIdx !== null ? combinations[selectedIdx] : null;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Select Variant</Typography>
      {attrKeys.map((key) => {
        const vals = [...new Set(combinations.map((c) => c.attributes?.[key]).filter(Boolean))];
        return (
          <Box key={key} sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>{key}: <strong>{selected?.attributes?.[key] || "—"}</strong></Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {vals.map((val) => {
                const mIdx = combinations.findIndex((c) => c.attributes?.[key] === val && attrKeys.filter((k) => k !== key).every((k) => !selected || c.attributes?.[k] === selected.attributes?.[k]));
                const match = mIdx >= 0 ? combinations[mIdx] : null;
                const out = match?.stock !== undefined && match.stock <= 0;
                const sel = selected?.attributes?.[key] === val;
                return (
                  <Box key={val} onClick={() => !out && mIdx >= 0 && onSelect(mIdx)} sx={{ border: sel ? "2px solid #1565c0" : "1.5px solid #d1d5db", borderRadius: 2, px: 1.5, py: 0.75, cursor: out || mIdx < 0 ? "not-allowed" : "pointer", bgcolor: sel ? "#eff6ff" : out ? "#f9fafb" : "white", opacity: out || mIdx < 0 ? 0.5 : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                    {match?.image?.url && <Box component="img" src={match.image.url} sx={{ width: 40, height: 40, objectFit: "cover", borderRadius: 1, mb: 0.5 }} />}
                    <Typography variant="body2" fontWeight={sel ? 700 : 500} color={sel ? "#1565c0" : "#374151"}>{val}</Typography>
                    {match?.price && <Typography variant="caption" fontWeight={700} color={sel ? "#1565c0" : "text.secondary"}>₹{fmt(match.price)}</Typography>}
                    {out && <Typography variant="caption" color="error" sx={{ fontSize: 9 }}>Out of stock</Typography>}
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function SpecificationsPanel({ specifications = [] }) {
  const [open, setOpen] = useState(false);
  if (!specifications.length) return <Typography variant="body2" color="text.secondary">No specifications added yet.</Typography>;
  return (
    <Box>
      <Box sx={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
          <tbody>
            {specifications.slice(0, 5).map((s, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "10px 16px 10px 0", color: "#6b7280", fontWeight: 600, fontSize: 13, width: "40%", verticalAlign: "top" }}>{s.key}</td>
                <td style={{ padding: "10px 0", fontSize: 13 }}>{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
      {specifications.length > 5 && <Button size="small" onClick={() => setOpen(true)} endIcon={<ExpandMore />} sx={{ mt: 1, color: "#1565c0" }}>View all {specifications.length} specifications</Button>}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", fontWeight: 700 }}>
          All Specifications<IconButton onClick={() => setOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 300 }}>
              <tbody>
                {specifications.map((s, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ padding: "12px 24px", color: "#374151", fontWeight: 600, fontSize: 14, width: "40%" }}>{s.key}</td>
                    <td style={{ padding: "12px 24px", fontSize: 14, color: "#374151" }}>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button variant="contained" onClick={() => setOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW MEDIA UPLOADER — Amazon-style: max 3 photos (5 MB each) + 1 video (50 MB)
// ═══════════════════════════════════════════════════════════════════════════════
const MAX_PHOTOS = 3;
const MAX_VIDEO = 1;

function ReviewMediaUploader({ mediaFiles, setMediaFiles, uploading, setUploading }) {
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const photos = mediaFiles.filter((m) => m.resourceType === "image");
  const videos = mediaFiles.filter((m) => m.resourceType === "video");

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_PHOTOS} photos allowed`); return; }
    const toUpload = files.slice(0, remaining);
    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5 MB`); continue; }
      setUploading(true);
      try {
        const uploaded = await uploadToCloudinary(file, "image");
        setMediaFiles((prev) => [...prev, { ...uploaded, localPreview: URL.createObjectURL(file) }]);
        toast.success("Photo uploaded");
      } catch { toast.error("Photo upload failed"); }
      finally { setUploading(false); }
    }
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (videos.length >= MAX_VIDEO) { toast.error("Only 1 video allowed"); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("Video must be under 50 MB"); return; }
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file, "video");
      setMediaFiles((prev) => [...prev, { ...uploaded, localPreview: URL.createObjectURL(file) }]);
      toast.success("Video uploaded");
    } catch { toast.error("Video upload failed"); }
    finally { setUploading(false); }
  };

  const removeMedia = (idx) => setMediaFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Add Photos & Video</Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
        Up to {MAX_PHOTOS} photos (5 MB each) · 1 video (50 MB) — stored securely, visible to all customers
      </Typography>

      {/* Previews */}
      {mediaFiles.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
          {mediaFiles.map((m, i) => (
            <Box key={i} sx={{ position: "relative", width: 72, height: 72, borderRadius: 2, overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
              {m.resourceType === "video" ? (
                <Box sx={{ width: "100%", height: "100%", bgcolor: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PlayCircle sx={{ color: "white", fontSize: 28 }} />
                </Box>
              ) : (
                <img src={m.localPreview || m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <IconButton size="small" onClick={() => removeMedia(i)}
                sx={{ position: "absolute", top: 2, right: 2, bgcolor: "rgba(0,0,0,0.6)", color: "white", p: 0.25, "&:hover": { bgcolor: "rgba(220,38,38,0.85)" } }}>
                <Close sx={{ fontSize: 12 }} />
              </IconButton>
              {/* uploaded tick */}
              <Box sx={{ position: "absolute", bottom: 2, left: 2, bgcolor: "#16a34a", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle sx={{ fontSize: 12, color: "white" }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Upload buttons */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <input ref={photoInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoSelect} />
        <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoSelect} />

        <Button variant="outlined" size="small" startIcon={uploading ? <CircularProgress size={14} /> : <PhotoCamera sx={{ fontSize: 16 }} />}
          disabled={uploading || photos.length >= MAX_PHOTOS}
          onClick={() => photoInputRef.current?.click()}
          sx={{ borderRadius: 2, fontSize: 12, borderColor: "#bfdbfe", color: "#1565c0", bgcolor: "#f0f7ff", "&:hover": { bgcolor: "#dbeafe" } }}>
          Photo ({photos.length}/{MAX_PHOTOS})
        </Button>

        <Button variant="outlined" size="small" startIcon={uploading ? <CircularProgress size={14} /> : <Videocam sx={{ fontSize: 16 }} />}
          disabled={uploading || videos.length >= MAX_VIDEO}
          onClick={() => videoInputRef.current?.click()}
          sx={{ borderRadius: 2, fontSize: 12, borderColor: "#d1fae5", color: "#16a34a", bgcolor: "#f0fdf4", "&:hover": { bgcolor: "#dcfce7" } }}>
          Video ({videos.length}/{MAX_VIDEO})
        </Button>
      </Box>
    </Box>
  );
}

//Review Media Display (shown in review cards)
function ReviewMediaDisplay({ media = [] }) {
  const [lightbox, setLightbox] = useState(null); // {url, type}
  if (!media.length) return null;
  return (
    <>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5, mb: 0.5 }}>
        {media.map((m, i) => (
          <Box key={i} onClick={() => setLightbox(m)}
            sx={{ width: { xs: 60, sm: 72 }, height: { xs: 60, sm: 72 }, borderRadius: 1.5, overflow: "hidden", border: "1.5px solid #e5e7eb", cursor: "pointer", position: "relative", "&:hover": { boxShadow: 3 } }}>
            {m.resourceType === "video" ? (
              <Box sx={{ width: "100%", height: "100%", bgcolor: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PlayCircle sx={{ color: "white", fontSize: 24 }} />
              </Box>
            ) : (
              <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </Box>
        ))}
      </Box>
      <Dialog open={!!lightbox} onClose={() => setLightbox(null)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: "#000", mx: { xs: 1, sm: 2 } } }}>
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <IconButton onClick={() => setLightbox(null)} sx={{ position: "absolute", top: 8, right: 8, color: "white", zIndex: 1 }}><Close /></IconButton>
          {lightbox?.resourceType === "video" ? (
            <video controls autoPlay style={{ width: "100%", maxHeight: "85vh", display: "block" }} src={lightbox?.url} />
          ) : (
            <img src={lightbox?.url} style={{ width: "100%", maxHeight: "85vh", objectFit: "contain" }} alt="" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Reviews Tab — updated with media 
function ReviewsTab({ product, onReviewAdded }) {
  const reviews = product.reviews || [];
  const [filterStar, setFilterStar] = useState(0);
  const [allOpen, setAllOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [form, setForm] = useState({ rating: 0, comment: "", user: "" });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [submitting, setSubm] = useState(false);
  const [formError, setFormError] = useState("");

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : product.rating;
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => Math.round(r.rating) === s).length,
    pct: reviews.length ? Math.round((reviews.filter((r) => Math.round(r.rating) === s).length / reviews.length) * 100) : 0,
  }));
  const filtered = filterStar === 0 ? reviews : reviews.filter((r) => Math.round(r.rating) === filterStar);
  const starColor = (n) => n >= 4 ? "#f59e0b" : n >= 3 ? "#f97316" : "#ef4444";

  const handleVerify = async () => {
    setVerifying(true); setOrderError(""); setVerifiedOrder(null);
    try {
      const order = await verifyOrderForProduct(orderId, product._id);
      setVerifiedOrder(order);
      const name = order.customer?.name || order.user?.name || "";
      if (name) setForm((f) => ({ ...f, user: name }));
    } catch (e) { setOrderError(e.message); }
    finally { setVerifying(false); }
  };

  const submitReview = async () => {
  if (!verifiedOrder) { setFormError("Please verify your order ID first to submit a review"); return; }
  if (!form.rating)   { setFormError("Please select a rating"); return; }
  if (!form.comment.trim()) { setFormError("Please write a review"); return; }
  if (mediaUploading) { setFormError("Please wait for media to finish uploading"); return; }
  setSubm(true); setFormError("");
  try {
    const token = getActiveToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await axios.post(`${API_BASE}/api/products/${product._id}/reviews`, {
      rating: form.rating,
      comment: form.comment,
      user: form.user || "Guest",
      verified: true,                       
      orderId: verifiedOrder._id,              
      media: mediaFiles.map((m) => ({ url: m.url, publicId: m.publicId, resourceType: m.resourceType })),
    }, { headers });
    toast.success("Review submitted!");
    setWriteOpen(false);
    setForm({ rating: 0, comment: "", user: "" });
    setMediaFiles([]); setVerifiedOrder(null); setOrderId("");
    onReviewAdded?.();
  } catch (err) {
    if (err.response?.status === 409) setFormError("You have already reviewed this product.");
    else setFormError(err.response?.data?.message || "Submission failed.");
  } finally { setSubm(false); }
};

  const handleThumb = async (reviewId, type) => {
    try {
      const token = getActiveToken();
      if (!token) { toast.error("Please login"); return; }
      await axios.post(`${API_BASE}/api/products/${product._id}/reviews/${reviewId}/vote`, { type }, { headers: { Authorization: `Bearer ${token}` } });
      onReviewAdded?.();
    } catch { toast.error("Failed"); }
  };

  const ReviewCard = ({ r }) => (
    <Box sx={{ borderBottom: "1px solid #f3f4f6", pb: 2.5, mb: 2.5 }}>
      <Box display="flex" alignItems="flex-start" gap={1.5} mb={1}>
        <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: "#1565c0", fontWeight: 700, flexShrink: 0 }}>
          {(r.user || "U")[0].toUpperCase()}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="body2" fontWeight={700}>{r.user || "Verified User"}</Typography>
            {r.verified && <Chip label="Verified Purchase" size="small" color="success" sx={{ height: 18, fontSize: 10 }} />}
            <Typography variant="caption" color="text.secondary">{r.date}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} sx={{ fontSize: 16, color: s <= r.rating ? starColor(r.rating) : "#e5e7eb" }} />)}
            <Typography variant="caption" fontWeight={700} color={starColor(r.rating)} sx={{ ml: 0.5 }}>{r.rating}/5</Typography>
          </Box>
        </Box>
      </Box>
      {r.comment && <Typography variant="body2" color="#374151" sx={{ ml: { xs: 0, sm: 6 }, lineHeight: 1.7 }}>{r.comment}</Typography>}

      {/* ── Review media ── */}
      {(r.media?.length > 0) && (
        <Box sx={{ ml: { xs: 0, sm: 6 } }}>
          <ReviewMediaDisplay media={r.media} />
        </Box>
      )}

      <Box display="flex" alignItems="center" gap={2} sx={{ ml: { xs: 0, sm: 6 }, mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">Helpful?</Typography>
        <Box display="flex" alignItems="center" gap={0.5}>
          <IconButton size="small" onClick={() => handleThumb(r._id, "up")} sx={{ color: r.thumbsUp > 0 ? "#16a34a" : "#9ca3af", p: 0.5 }}><ThumbUp sx={{ fontSize: 14 }} /></IconButton>
          {r.thumbsUp > 0 && <Typography variant="caption" color="#16a34a" fontWeight={600}>{r.thumbsUp}</Typography>}
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <IconButton size="small" onClick={() => handleThumb(r._id, "down")} sx={{ color: r.thumbsDown > 0 ? "#dc2626" : "#9ca3af", p: 0.5 }}><ThumbDown sx={{ fontSize: 14 }} /></IconButton>
          {r.thumbsDown > 0 && <Typography variant="caption" color="#dc2626" fontWeight={600}>{r.thumbsDown}</Typography>}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* Rating summary */}
      <Box sx={{ display: "flex", gap: { xs: 2, sm: 3 }, mb: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
        <Box sx={{ textAlign: "center", minWidth: 80 }}>
          <Typography variant="h2" fontWeight={800} color="#111827" lineHeight={1} sx={{ fontSize: { xs: "2.5rem", sm: "3.75rem" } }}>{avgRating || "—"}</Typography>
          <Rating value={parseFloat(avgRating) || 0} readOnly precision={0.5} size="small" sx={{ mt: 0.5 }} />
          <Typography variant="caption" color="text.secondary" display="block">{reviews.length} rating{reviews.length !== 1 ? "s" : ""}</Typography>
        </Box>
        <Box flex={1} minWidth={160}>
          {starCounts.map(({ star, count, pct }) => (
            <Box key={star} display="flex" alignItems="center" gap={1} mb={0.5} onClick={() => setFilterStar(filterStar === star ? 0 : star)}
              sx={{ cursor: "pointer", borderRadius: 1, px: 0.5, py: 0.25, "&:hover": { bgcolor: "#f3f4f6" }, bgcolor: filterStar === star ? "#eff6ff" : "transparent" }}>
              <Typography variant="caption" sx={{ minWidth: 8 }}>{star}</Typography>
              <Star sx={{ fontSize: 11, color: "#f59e0b" }} />
              <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: "#f3f4f6", "& .MuiLinearProgress-bar": { bgcolor: star >= 4 ? "#f59e0b" : star === 3 ? "#f97316" : "#ef4444", borderRadius: 5 } }} />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>{count}</Typography>
            </Box>
          ))}
          {filterStar > 0 && <Button size="small" onClick={() => setFilterStar(0)} sx={{ mt: 0.5, fontSize: 11, color: "#1565c0" }}>Clear ×</Button>}
        </Box>
      </Box>

      {filtered.length > 0 ? (
        <>
          {filtered.slice(0, 4).map((r, i) => <ReviewCard key={i} r={r} />)}
          {filtered.length > 4 && <Button variant="outlined" fullWidth onClick={() => setAllOpen(true)} sx={{ mt: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>See all {filtered.length} reviews</Button>}
        </>
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Star sx={{ fontSize: 48, color: "#e5e7eb", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">{filterStar > 0 ? `No ${filterStar}-star reviews yet` : "No reviews yet"}</Typography>
        </Box>
      )}

      <Button variant="contained" startIcon={<Edit />} onClick={() => setWriteOpen(true)} sx={{ mt: 2, borderRadius: 2, background: "linear-gradient(135deg,#1565c0,#0d47a1)" }}>
        Write a Review
      </Button>

      {/* Write review dialog */}
      <Dialog open={writeOpen} onClose={() => setWriteOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
          Write a Review<IconButton onClick={() => setWriteOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Order verify (optional) */}
            <Box sx={{ p: 2, bgcolor: "#f9fafb", borderRadius: 2, border: "1px solid #e5e7eb" }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1} color="#374151">
                Verify Purchase *
              </Typography>
              <Box display="flex" gap={1} alignItems="flex-start">
                <TextField size="small" label="Order ID*" value={orderId} onChange={(e) => { setOrderId(e.target.value); setOrderError(""); setVerifiedOrder(null); }} error={!!orderError} helperText={orderError || "e.g. ABC12345"} placeholder="Order number" sx={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && !verifying && handleVerify()} />
                <Button variant="outlined" size="small" onClick={handleVerify} disabled={verifying || !orderId.trim()} sx={{ mt: 0.5, minWidth: 72, flexShrink: 0 }}>
                  {verifying ? <CircularProgress size={16} /> : "Verify"}
                </Button>
              </Box>
              {verifiedOrder && <Alert severity="success" sx={{ mt: 1, py: 0.5 }}><Typography variant="caption"><strong>✓ Verified!</strong></Typography></Alert>}
            </Box>

            {!isLoggedIn() && (
              <TextField label="Your Name" size="small" fullWidth value={form.user} onChange={(e) => setForm((f) => ({ ...f, user: e.target.value }))} />
            )}

            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Your Rating *</Typography>
              <Rating size="large" value={form.rating} onChange={(_, v) => setForm((f) => ({ ...f, rating: v }))} />
            </Box>

            <TextField label="Your Review *" multiline rows={4} fullWidth value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Share your experience with this product..." />

            {/* ── Media uploader ── */}
            <Box sx={{ p: 2, bgcolor: "#f9fafb", borderRadius: 2, border: "1px solid #e5e7eb" }}>
              <ReviewMediaUploader mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} uploading={mediaUploading} setUploading={setMediaUploading} />
            </Box>

            {formError && <Alert severity="error" sx={{ py: 0.5 }}>{formError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setWriteOpen(false)}>Cancel</Button>
          <Button
  variant="contained"
  onClick={submitReview}
  disabled={submitting || mediaUploading || !verifiedOrder || !form.rating || !form.comment.trim()}
>
  {submitting ? <CircularProgress size={18} /> : "Submit Review"}
</Button>
        </DialogActions>
      </Dialog>

      {/* All reviews dialog */}
      <Dialog open={allOpen} onClose={() => setAllOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "92vh", mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, bgcolor: "white", zIndex: 1 }}>
          <Box>
            <Typography fontWeight={700} variant="h6">Customer Reviews</Typography>
            <Typography variant="caption" color="text.secondary">{reviews.length} total</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {[0, 5, 4, 3, 2, 1].map((s) => (
                <Chip key={s} label={s === 0 ? "All" : `${s}★`} size="small" color={filterStar === s ? "primary" : "default"} onClick={() => setFilterStar(s)} sx={{ cursor: "pointer", fontWeight: 600, fontSize: 11 }} />
              ))}
            </Box>
            <IconButton onClick={() => setAllOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {filtered.length > 0 ? filtered.map((r, i) => <ReviewCard key={i} r={r} />) : (
            <Box textAlign="center" py={4}><Typography color="text.secondary">No reviews yet.</Typography></Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

//Related Products
function RelatedProducts({ currentId, category, sections = [] }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const go = async () => {
      setLoading(true);
      try {
        const url = sections?.length > 0
          ? `${API_BASE}/api/products/filter?section=${encodeURIComponent(sections[0])}`
          : category?.title
            ? `${API_BASE}/api/products/filter?categoryName=${encodeURIComponent(category.title)}`
            : "";
        if (!url) { setLoading(false); return; }
        const r = await axios.get(url);
        setProducts((r.data.products || []).filter((p) => p._id !== currentId).slice(0, 6));
      } catch {}
      setLoading(false);
    };
    go();
  }, [category, sections, currentId]);

  if (loading) return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={800} mb={2}>Customers Also Viewed</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 2 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => <Box key={i} sx={{ height: 170, bgcolor: "#f3f4f6", borderRadius: 2 }} />)}
      </Box>
    </Box>
  );
  if (!products.length) return null;
  return (
    <Box sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={800}>Customers Also Viewed</Typography>
        {category?.title && <Button variant="text" endIcon={<ArrowRightAlt />} size="small" onClick={() => navigate(`/category/${category.title}`)}>View All</Button>}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: { xs: 1.5, sm: 2 } }}>
        {products.map((p) => {
          const img = resolveImg(p.images?.[0]) || p.images?.[0]?.url;
          const price = p.rolePrice?.finalRate || p.mrp || 0;
          const disc = p.mrp && price < p.mrp ? Math.round(((p.mrp - price) / p.mrp) * 100) : 0;
          return (
            <Card key={p._id} onClick={() => navigate(`/product-details/${p._id}`)} sx={{ borderRadius: 2, border: "1px solid #e5e7eb", cursor: "pointer", "&:hover": { boxShadow: 4 }, transition: "box-shadow .2s" }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box display="flex" justifyContent="center" mb={1.5} sx={{ height: 68 }}>
                  {img ? <img src={img} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} alt="" />
                    : <Avatar sx={{ width: 52, height: 52, bgcolor: "#f0f9ff" }}><Medication sx={{ color: "#1565c0", fontSize: 26 }} /></Avatar>}
                </Box>
                <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5, overflow: "hidden", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", display: "-webkit-box" }}>{p.brandName}</Typography>
                {p.rating && (
                  <Box sx={{ bgcolor: "#16a34a", color: "white", borderRadius: 0.5, px: 0.75, py: 0.1, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 0.25, mb: 0.75 }}>
                    {p.rating} <Star sx={{ fontSize: 10 }} />
                  </Box>
                )}
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={800}>₹{fmt(price)}</Typography>
                  {disc > 0 && <Chip label={`${disc}% off`} size="small" color="success" sx={{ height: 18, fontSize: 10 }} />}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

function WhyChooseUs() {
  const pts = [
    { icon: <Shield sx={{ fontSize: 22, color: "#1565c0" }} />, title: "100% Genuine", desc: "Sourced from licensed manufacturers" },
    { icon: <LocalShipping sx={{ fontSize: 22, color: "#16a34a" }} />, title: "Fast Delivery", desc: "Same-day delivery in select cities" },
    { icon: <Security sx={{ fontSize: 22, color: "#7c3aed" }} />, title: "Secure Payments", desc: "256-bit SSL on all transactions" },
    { icon: <SupportAgent sx={{ fontSize: 22, color: "#d97706" }} />, title: "24/7 Support", desc: "Pharmacists available round the clock" },
    { icon: <AssignmentReturn sx={{ fontSize: 22, color: "#dc2626" }} />, title: "Easy Returns", desc: "No questions asked within 7 days" },
    { icon: <VerifiedUser sx={{ fontSize: 22, color: "#059669" }} />, title: "CDSCO Licensed", desc: "Compliant with Indian pharma regulations" },
  ];
  return (
    <Box sx={{ mt: 4, py: 3, px: { xs: 2, sm: 2.5 }, bgcolor: "white", borderRadius: 3, border: "1px solid #e5e7eb" }}>
      <Typography variant="h6" fontWeight={800} textAlign="center" mb={0.5}>Why Choose BioBurg?</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={2.5}>India's most trusted pharmaceutical marketplace</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3,1fr)", md: "repeat(auto-fill,minmax(180px,1fr))" }, gap: 1.5 }}>
        {pts.map((p, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", p: 1.5, borderRadius: 2, "&:hover": { bgcolor: "#f9fafb" } }}>
            <Box sx={{ flexShrink: 0, mt: 0.25 }}>{p.icon}</Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: 12, sm: 14 } }}>{p.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 10, sm: 12 } }}>{p.desc}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function RecentlyViewed({ currentId }) {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
      setItems(v.filter((p) => p._id !== currentId).slice(0, 5));
    } catch {}
  }, [currentId]);
  if (!items.length) return null;
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={800} mb={2}>Recently Viewed</Typography>
      <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 2 }, overflowX: "auto", pb: 1 }}>
        {items.map((p) => (
          <Card key={p._id} onClick={() => navigate(`/product-details/${p._id}`)} sx={{ minWidth: 120, maxWidth: 145, flexShrink: 0, borderRadius: 2, border: "1px solid #e5e7eb", cursor: "pointer", "&:hover": { boxShadow: 3 } }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                {p.image ? <img src={p.image} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} alt="" /> : <Medication sx={{ color: "#9ca3af", fontSize: 30 }} />}
              </Box>
              <Typography variant="caption" fontWeight={700} display="block" noWrap>{p.name}</Typography>
              {p.price && <Typography variant="caption" color="primary" fontWeight={700}>₹{fmt(p.price)}</Typography>}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

// Sidebar content
function SidebarContent({ product, qty, basePrice, displayMrp, finalTotal, couponSaving, stock, addingToCart, handleAddToCart, handleBuyNow, recommendations, certifications }) {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Card sx={{ borderRadius: 2, border: "1px solid #d1d5db" }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Order Summary</Typography>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">Price ({qty} unit{qty > 1 ? "s" : ""})</Typography>
            <Typography variant="body2" fontWeight={600}>₹{fmt(basePrice * qty)}</Typography>
          </Box>
          {couponSaving > 0 && (
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="#16a34a">Coupon discount</Typography>
              <Typography variant="body2" color="#16a34a" fontWeight={600}>−₹{fmt(couponSaving)}</Typography>
            </Box>
          )}
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">Delivery</Typography>
            <Typography variant="body2" color="#16a34a" fontWeight={600}>FREE</Typography>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
            <Typography variant="h6" fontWeight={800}>₹{fmt(finalTotal)}</Typography>
          </Box>
          {displayMrp > 0 && finalTotal < displayMrp * qty && (
            <Box sx={{ bgcolor: "#dcfce7", borderRadius: 1.5, p: 1.25, mb: 2 }}>
              <Typography variant="body2" color="#166534" fontWeight={600} textAlign="center">You save ₹{fmt(displayMrp * qty - finalTotal)} on this order</Typography>
            </Box>
          )}
          <Button variant="contained" fullWidth size="large" onClick={handleAddToCart} disabled={stock <= 0 || addingToCart}
            sx={{ borderRadius: 2, fontWeight: 700, bgcolor: "#ff9900", "&:hover": { bgcolor: "#f59000" }, color: "#111", mb: 1 }}>
            {addingToCart ? <CircularProgress size={18} sx={{ color: "#111" }} /> : <><ShoppingCart sx={{ mr: 1, fontSize: 18 }} /> Add to Cart</>}
          </Button>
          <Button variant="contained" fullWidth onClick={handleBuyNow} disabled={stock <= 0 || addingToCart} sx={{ borderRadius: 2, fontWeight: 700 }}>Buy Now</Button>
        </CardContent>
      </Card>
      <AuthorSidebar authors={product.authors || []} lastUpdated={product.lastUpdated} marketerName={product.marketerName} marketerAddress={product.marketerAddress} countryOfOrigin={product.countryOfOrigin} />
      <RecommendationsSidebar recommendations={recommendations} />
      <CertificationsBadges certifications={certifications} />
      {product.isOTC === false && (
        <Card sx={{ borderRadius: 2, border: "1.5px solid #fde68a", bgcolor: "#fffbeb" }}>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Description sx={{ color: "#d97706" }} />
              <Typography variant="subtitle2" fontWeight={700} color="#92400e">Need Prescription?</Typography>
            </Box>
            <Button variant="outlined" fullWidth size="small" color="warning" onClick={() => (isLoggedIn() ? null : navigate("/login"))}>Upload Prescription</Button>
          </CardContent>
        </Card>
      )}
      <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Return & Refund Policy</Typography>
          {["Unopened medicines returnable within 7 days", "Damaged/wrong product — full refund", "Prescription medicines: non-returnable if opened"].map((t, i) => (
            <Box key={i} display="flex" gap={1} mb={0.75}>
              <CheckCircle sx={{ fontSize: 14, color: "#16a34a", mt: 0.25, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">{t}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}

// MAIN
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedVariantIdx, setVariantIdx] = useState(null);
  const [selectedComboIdx, setComboIdx] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [prescriptionModal, setPrescModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [tabPopup, setTabPopup] = useState(null);
  const [answerMap, setAnswerMap] = useState({});
  const [answeringId, setAnsweringId] = useState(null);
  const isAdmin = !!localStorage.getItem("adminToken");

  const loadProduct = () => {
    setLoading(true);
    axios.get(`${API_BASE}/api/products/get/${id}`)
      .then((r) => {
        if (r.data?.product) {
          setProduct(r.data.product);
          try {
            const p = r.data.product;
            const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
            const entry = { _id: p._id, name: p.brandName, image: p.images?.[0]?.url, price: p.rolePrice?.finalRate || p.mrp };
            localStorage.setItem("recentlyViewed", JSON.stringify([entry, ...viewed.filter((x) => x._id !== p._id)].slice(0, 10)));
          } catch {}
        }
      })
      .catch((err) => console.error("Product load error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProduct(); }, [id]);
  useEffect(() => {
    if (!product?._id) return;
    axios.get(`${API_BASE}/api/questions/product/${product._id}`).then((r) => setQuestions(r.data.data || [])).catch(() => {});
  }, [product]);

  const productMrp = parseFloat(product?.mrp) || 0;
  const discountPct = product?.rolePrice?.discountPercent || 0;
  const selectedVariant = selectedVariantIdx !== null ? product?.variants?.[selectedVariantIdx] : null;
  const selectedCombo = selectedComboIdx !== null ? product?.combinations?.[selectedComboIdx] : null;
  const isRx = product?.isOTC === false;

  const displayMrp = selectedCombo?.price ? parseFloat(selectedCombo.price) : selectedVariant?.price ? parseFloat(selectedVariant.price) : productMrp;
  const basePrice = (() => {
    if (!product) return 0;
    if (selectedVariant?.price) { const vp = parseFloat(selectedVariant.price); return discountPct > 0 ? parseFloat((vp * (1 - discountPct / 100)).toFixed(2)) : vp; }
    if (selectedCombo?.price) { const cp = parseFloat(selectedCombo.price); return discountPct > 0 ? parseFloat((cp * (1 - discountPct / 100)).toFixed(2)) : cp; }
    if (product?.rolePrice?.finalRate) return parseFloat(product.rolePrice.finalRate);
    return productMrp;
  })();
  const discount = displayMrp > basePrice ? Math.round(((displayMrp - basePrice) / displayMrp) * 100) : 0;
  const productCoupons = (product?.coupons || []).filter((c) => c.code && c.discount && c.active !== false);
  const couponSaving = appliedCoupon ? appliedCoupon.type === "percent" ? parseFloat(((basePrice * qty * appliedCoupon.discount) / 100).toFixed(2)) : parseFloat(appliedCoupon.discount) || 0 : 0;
  const finalTotal = Math.max(0, basePrice * qty - couponSaving);

  const applyCoupon = (codeStr) => {
    const code = (codeStr || couponInput).trim().toUpperCase();
    const found = productCoupons.find((c) => c.code.toUpperCase() === code);
    if (!found) { setCouponError("Invalid or expired coupon code"); setAppliedCoupon(null); return; }
    const minOrder = parseFloat(found.minOrder) || 0;
    if (minOrder > 0 && basePrice * qty < minOrder) { setCouponError(`Minimum order ₹${fmt(minOrder)} required`); setAppliedCoupon(null); return; }
    setAppliedCoupon(found); setCouponError(""); setCouponInput(code);
    toast.success("Coupon applied!");
  };

  const handleAddToCart = async () => {
    if (isRx) { toast.error("Upload a prescription to order this medicine"); return; }
    setAddingToCart(true);
    try { await addToCart(product, qty, selectedVariant || selectedCombo); }
    finally { setAddingToCart(false); }
  };

  const handleBuyNow = async () => {
    if (isRx) { toast.error("Upload a prescription to order this medicine"); return; }
    setAddingToCart(true);
    try {
      await addToCart(product, qty, selectedVariant || selectedCombo);
      if (!isLoggedIn()) { toast("Login to complete your purchase",); navigate("/login"); return; }
      navigate("/cart");
    } finally { setAddingToCart(false); }
  };

  const handleAskQuestion = async () => {
    const token = getActiveToken();
    if (!token) { toast.error("Please login"); navigate("/login"); return; }
    if (!newQuestion.trim()) return;
    try {
      await axios.post(`${API_BASE}/api/questions/add`, { productId: product._id, question: newQuestion }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Question submitted!");
      setNewQuestion("");
      const r = await axios.get(`${API_BASE}/api/questions/product/${product._id}`);
      setQuestions(r.data.data || []);
    } catch { toast.error("Failed to submit"); }
  };

  const handleSubmitAnswer = async (qId) => {
    const answer = answerMap[qId] || "";
    if (!answer.trim()) return;
    try {
      const token = localStorage.getItem("adminToken") || getActiveToken();
      await axios.patch(`${API_BASE}/api/questions/${qId}/answer`, { answer }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Answer posted!");
      setAnsweringId(null);
      const r = await axios.get(`${API_BASE}/api/questions/product/${product._id}`);
      setQuestions(r.data.data || []);
    } catch { toast.error("Failed to post answer"); }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>
  );
  if (!product) return <Box p={4}><Typography>Product not found.</Typography></Box>;

  const stock = selectedCombo?.stock ?? selectedVariant?.stock ?? product.totalStocks ?? product.stocks ?? 0;
  const images = product.images || [];
  const userRole = product.rolePrice?.role || "customer";
  const offers = (product.offersWithIcon || []).filter((o) => !o.userType || o.userType === "all" || o.userType === userRole);
  const recommendations = product.recommendations || [];
  const certifications = product.certifications || [];
  const allCombos = Array.isArray(product.combos) ? product.combos : product.combos?.data || product.combos?.combos || [];

  const tabPopups = {
    specs: { title: "Specifications", content: <SpecificationsPanel specifications={product.specifications || []} /> },
    desc: {
      title: "Description",
      content: (
        <Box>
          {product.fullDescription && <Box mb={2}><Typography variant="subtitle2" fontWeight={700} mb={1}>About this product</Typography><Typography variant="body2" color="#374151" sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}>{product.fullDescription}</Typography></Box>}
          {product.shortDescription && <Box mb={2}><Typography variant="subtitle2" fontWeight={700} mb={1}>More Information</Typography><Typography variant="body2" color="#374151" sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}>{product.shortDescription}</Typography></Box>}
          {product.disclaimer && <Alert severity="warning" sx={{ mt: 2 }}><Typography variant="caption" fontWeight={700}>Disclaimer: </Typography><Typography variant="caption">{product.disclaimer}</Typography></Alert>}
          {!product.fullDescription && !product.shortDescription && !product.disclaimer && <Typography variant="body2" color="text.secondary">No description available.</Typography>}
        </Box>
      ),
    },
    reviews: { title: "Reviews", content: <ReviewsTab product={product} onReviewAdded={loadProduct} />, wide: true },
    qa: {
      title: "Q&A",
      content: (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Ask a Question</Typography>
            <Box display="flex" gap={1} flexWrap={{ xs: "wrap", sm: "nowrap" }}>
              <TextField fullWidth size="small" placeholder="Type your question..." value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()} />
              <Button variant="contained" size="small" onClick={handleAskQuestion} sx={{ flexShrink: 0 }}>Ask</Button>
            </Box>
          </Box>
          {questions.map((q, i) => (
            <Box key={i} sx={{ mb: 2.5, pl: 2, borderLeft: "3px solid #1565c0", pr: 1 }}>
              <Typography variant="body2" fontWeight={700} color="#1565c0" mb={0.5}>Q: {q.question}</Typography>
              {q.answer ? (
                <Box sx={{ mt: 0.5, pl: 1.5, borderLeft: "2px solid #16a34a" }}>
                  <Typography variant="caption" fontWeight={700} color="#15803d">A (Admin):</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5, display: "inline" }}> {q.answer}</Typography>
                </Box>
              ) : <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>No answer yet.</Typography>}
              {isAdmin && (answeringId === q._id ? (
                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                  <TextField size="small" fullWidth multiline rows={2} placeholder="Type your answer..." value={answerMap[q._id] || ""} onChange={(e) => setAnswerMap((m) => ({ ...m, [q._id]: e.target.value }))} />
                  <Box display="flex" flexDirection={{ xs: "row", sm: "column" }} gap={0.5}>
                    <Button size="small" variant="contained" color="success" onClick={() => handleSubmitAnswer(q._id)}>Post</Button>
                    <Button size="small" onClick={() => setAnsweringId(null)}>Cancel</Button>
                  </Box>
                </Box>
              ) : (
                <Button size="small" sx={{ mt: 0.5, fontSize: 11, color: "#4f46e5" }} onClick={() => setAnsweringId(q._id)}>{q.answer ? "Edit Answer" : "Answer"}</Button>
              ))}
            </Box>
          ))}
          {!questions.length && <Typography variant="body2" color="text.secondary">No questions yet. Be the first!</Typography>}
        </Box>
      ),
    },
  };

  const tabDefs = [
    { key: "specs", label: "Specifications" },
    { key: "desc", label: "Description" },
    { key: "reviews", label: `Reviews${product.reviews?.length ? ` (${product.reviews.length})` : ""}` },
    { key: "qa", label: "Q&A" },
  ];

  const sidebarProps = { product, qty, basePrice, displayMrp, finalTotal, couponSaving, stock, addingToCart, handleAddToCart, handleBuyNow, recommendations, certifications };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Breadcrumb */}
      <Box sx={{ bgcolor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <Breadcrumbs sx={{ fontSize: { xs: 11, sm: 13 } }}>
            <Link href="/" color="inherit" underline="hover" sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "inherit" }}>
              <HealthAndSafety sx={{ fontSize: 16 }} /> BioBurg
            </Link>
            {product.category?.title && <Link href={`/category/${product.category.title}`} color="inherit" underline="hover" sx={{ fontSize: "inherit" }}>{product.category.title}</Link>}
            <Typography sx={{ fontSize: "inherit", color: "#374151", maxWidth: { xs: 150, sm: 300 }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.brandName}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      {/* Rx banner */}
      {isRx && (
        <Box sx={{ bgcolor: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
          <Container maxWidth="xl" sx={{ py: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Warning sx={{ color: "#d97706", fontSize: 18 }} />
                <Typography variant="body2" fontWeight={700} color="#92400e" sx={{ fontSize: { xs: 12, sm: 14 } }}>PRESCRIPTION REQUIRED</Typography>
              </Box>
              <Button size="small" variant="contained" color="warning" onClick={() => isLoggedIn() ? setPrescModal(true) : navigate("/login")} startIcon={<Receipt sx={{ fontSize: 14 }} />}>
                Upload Prescription
              </Button>
            </Box>
          </Container>
        </Box>
      )}

      <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2.5 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
        {/* 3-col grid: image | content | sidebar */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px 1fr", lg: "330px 1fr 270px" }, gap: { xs: 1.5, sm: 2, md: 2.5 } }}>

          {/* ── COL 1: Image + product details card ── */}
          <Box sx={{ position: { md: "sticky" }, top: 72, alignSelf: "start" }}>
            <ImageGallery images={selectedCombo?.image?.url ? [selectedCombo.image, ...images] : images} video={product.video} discount={discount} />
            <Card sx={{ mt: 1.5, borderRadius: 2, border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Product Details</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                  {[
                    { label: "Brand", value: product.brandName },
                    { label: "Manufacturer", value: product.manufacturer },
                    { label: "Category", value: product.category?.title },
                    { label: "HSN Code", value: product.hsn },
                    { label: "Batch No.", value: product.batchNumber },
                    { label: "Expiry", value: product.expiryDate },
                    { label: "Package", value: product.packageType },
                    { label: "Weight", value: product.productWeight ? `${product.productWeight}g` : null },
                    { label: "GST", value: product.gst_igst ? `${product.gst_igst}%` : null },
                  ].filter((d) => d.value).map((d, i) => (
                    <Box key={i}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: 10, sm: 12 } }}>{d.label}</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ fontSize: { xs: 11, sm: 13 } }}>{d.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* ── COL 2: Main content ── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Title card */}
            <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" gap={0.75} flexWrap="wrap" mb={1}>
                      {product.category?.title && <Chip label={product.category.title} color="primary" size="small" sx={{ height: 22, fontSize: 11 }} />}
                      {product.subCategory?.title && <Chip label={product.subCategory.title} variant="outlined" size="small" sx={{ height: 22, fontSize: 11 }} />}
                      <Chip label={product.isOTC ? "OTC" : "Rx"} color={product.isOTC ? "success" : "error"} size="small" sx={{ height: 22, fontSize: 11 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={800} sx={{ color: "#111827", mb: 0.5, lineHeight: 1.2, fontSize: { xs: "1.2rem", sm: "1.5rem" } }}>{product.brandName}</Typography>
                    {product.genericCompositions && <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: 12, sm: 14 } }}>{product.genericCompositions}</Typography>}
                    {product.manufacturer && <Typography variant="body2" sx={{ fontSize: { xs: 12, sm: 14 } }}><span style={{ color: "#6b7280" }}>Mfr: </span><strong style={{ color: "#1565c0" }}>{product.manufacturer}</strong></Typography>}
                  </Box>
                  <Box display="flex" gap={0.5} flexShrink={0}>
  {/* QR Code button */}
  <Tooltip title="View QR Code" arrow>
    <IconButton size="small" onClick={() => setQrDialogOpen(true)}>
      <QrCode2Icon sx={{ fontSize: 20 }} />
    </IconButton>
  </Tooltip>
  <IconButton size="small" onClick={() => setIsWishlisted((w) => !w)}>
    {isWishlisted ? <Favorite sx={{ color: "#ef4444" }} /> : <FavoriteBorder />}
  </IconButton>
  <IconButton size="small" onClick={() => { if (navigator.share) navigator.share({ title: product.brandName, url: window.location.href }); else { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied!"); } }}>
    <Share sx={{ fontSize: 20 }} />
  </IconButton>
</Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                {product.rating && (
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Box sx={{ bgcolor: "#16a34a", color: "white", borderRadius: 1, px: 1, py: 0.25, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="body2" fontWeight={700}>{product.rating}</Typography>
                      <Star sx={{ fontSize: 14 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "#1565c0" } }} onClick={() => setTabPopup("reviews")}>
                      {product.reviews?.length ? `${product.reviews.length} reviews` : "ratings"}
                    </Typography>
                  </Box>
                )}
                <ProductVoting product={product} onVoted={loadProduct} />
              </CardContent>
            </Card>

            {/* Pricing card */}
            <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>

                {/* ── B2B pricing comparison banner ── */}
                <B2BPricingBanner rolePrice={product.rolePrice} productMrp={productMrp} />

                <Box sx={{ bgcolor: "#f0f9ff", borderRadius: 2, p: { xs: 1.5, sm: 2 }, mb: 2 }}>
                  <Box display="flex" alignItems="baseline" gap={2} flexWrap="wrap">
                    <Typography variant="h3" fontWeight={800} color="#111827" sx={{ fontSize: { xs: "1.75rem", sm: "3rem" } }}>₹{fmt(basePrice)}</Typography>
                    {displayMrp > basePrice && (
                      <>
                        <Typography variant="h6" sx={{ textDecoration: "line-through", color: "#9ca3af", fontSize: { xs: "1rem", sm: "1.25rem" } }}>₹{fmt(displayMrp)}</Typography>
                        <Box sx={{ bgcolor: "#dc2626", color: "white", borderRadius: 1, px: 1, py: 0.25, fontSize: 13, fontWeight: 700 }}>Save ₹{fmt(displayMrp - basePrice)}</Box>
                      </>
                    )}
                  </Box>
                  <Typography variant="caption" color="#16a34a" fontWeight={600}>Inclusive of all taxes{product.gst_igst ? ` (GST: ${product.gst_igst}%)` : ""}</Typography>
                </Box>

                {/* Offers */}
                {(offers.length > 0 || product.scheme1 || product.scheme2 || product.additionalOffers) && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Available Offers</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {offers.map((o, i) => <FlashOffer key={i} text={o.text} flashing={o.flashing} />)}
                      {product.scheme1 && <FlashOffer text={product.scheme1} />}
                      {product.scheme2 && <FlashOffer text={product.scheme2} />}
                      {product.additionalOffers && <FlashOffer text={product.additionalOffers} />}
                    </Box>
                  </Box>
                )}

                {/* Coupons */}
                {productCoupons.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Apply Coupon</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
                      {productCoupons.map((c, i) => <CouponChip key={i} code={c.code} discount={c.discount} type={c.type} expiryDate={c.expiryDate} onApply={applyCoupon} />)}
                    </Box>
                    <Box display="flex" gap={1} flexWrap={{ xs: "wrap", sm: "nowrap" }}>
                      <TextField size="small" placeholder="Enter coupon code" value={couponInput} onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }} error={!!couponError} helperText={couponError} sx={{ flex: 1, minWidth: 140 }} onKeyDown={(e) => e.key === "Enter" && applyCoupon()} />
                      <Button variant="outlined" size="small" onClick={() => applyCoupon()} sx={{ flexShrink: 0 }}>Apply</Button>
                      {appliedCoupon && <Button size="small" color="error" onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} sx={{ flexShrink: 0 }}>Remove</Button>}
                    </Box>
                    {appliedCoupon && <Alert severity="success" sx={{ mt: 1, py: 0.5 }}><strong>{appliedCoupon.code}</strong> applied — saves ₹{fmt(couponSaving)}</Alert>}
                  </Box>
                )}

                {/* Stock */}
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.75}>
                    <Typography variant="body2" fontWeight={600}>Stock</Typography>
                    <Typography variant="body2" fontWeight={700} color={stock > 10 ? "#16a34a" : stock > 0 ? "#d97706" : "#dc2626"}>
                      {stock > 0 ? `In Stock (${stock} units)` : "Out of Stock"}
                    </Typography>
                  </Box>
                  {stock > 0 && <LinearProgress variant="determinate" value={Math.min((stock / Math.max(product.totalStocks || 100, stock)) * 100, 100)} color={stock < 10 ? "warning" : "success"} sx={{ height: 6, borderRadius: 3 }} />}
                </Box>

                {product.combinations?.length > 0 && <CombinationSelector combinations={product.combinations} selectedIdx={selectedComboIdx} onSelect={(i) => { setComboIdx(i === selectedComboIdx ? null : i); setVariantIdx(null); }} />}
                {product.variants?.filter((v) => v.name)?.length > 0 && <VariantSelector variants={product.variants} selectedIdx={selectedVariantIdx} onSelect={(i) => { setVariantIdx(i === selectedVariantIdx ? null : i); setComboIdx(null); }} discountPct={discountPct} />}

                {/* Quantity */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Quantity</Typography>
                  <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <Box sx={{ display: "flex", alignItems: "center", border: "1.5px solid #d1d5db", borderRadius: 2, overflow: "hidden" }}>
                      <IconButton size="small" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} sx={{ borderRadius: 0 }}><RemoveIcon sx={{ fontSize: 18 }} /></IconButton>
                      <Typography sx={{ px: 2.5, fontWeight: 700, minWidth: 40, textAlign: "center" }}>{qty}</Typography>
                      <IconButton size="small" onClick={() => setQty((q) => q + 1)} disabled={isRx && qty >= 3} sx={{ borderRadius: 0 }}><AddIcon sx={{ fontSize: 18 }} /></IconButton>
                    </Box>
                    {isRx && <Typography variant="caption" color="text.secondary">Max 3 per prescription</Typography>}
                  </Box>
                </Box>

                {/* CTA buttons */}
                <Box display="flex" gap={{ xs: 1, sm: 2 }}>
                  <Button variant="contained" size="large" fullWidth startIcon={<ShoppingCart />} onClick={handleAddToCart} disabled={stock <= 0 || addingToCart}
                    sx={{ borderRadius: 2, py: { xs: 1, sm: 1.5 }, fontWeight: 700, bgcolor: "#ff9900", "&:hover": { bgcolor: "#f59000" }, color: "#111", fontSize: { xs: 12, sm: 15 } }}>
                    {addingToCart ? <CircularProgress size={20} sx={{ color: "#111" }} /> : "Add to Cart"}
                  </Button>
                  <Button variant="contained" size="large" fullWidth onClick={handleBuyNow} disabled={stock <= 0 || addingToCart}
                    sx={{ borderRadius: 2, py: { xs: 1, sm: 1.5 }, fontWeight: 700, fontSize: { xs: 13, sm: 15 } }}>
                    Buy Now
                  </Button>
                </Box>

                {!isLoggedIn() && (
                  <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
                    <Typography variant="caption">Shopping as guest — <strong onClick={() => navigate("/login")} style={{ cursor: "pointer", textDecoration: "underline" }}>Login</strong> for member prices</Typography>
                  </Alert>
                )}

                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #f3f4f6", display: "flex", gap: { xs: 1.5, sm: 3 }, flexWrap: "wrap" }}>
                  {[{ icon: <LocalShipping sx={{ fontSize: 18, color: "#1565c0" }} />, text: "Free Delivery" }, { icon: <AssignmentReturn sx={{ fontSize: 18, color: "#1565c0" }} />, text: "Easy Returns" }, { icon: <Security sx={{ fontSize: 18, color: "#1565c0" }} />, text: "Secure Payment" }].map((item, i) => (
                    <Box key={i} display="flex" alignItems="center" gap={0.75}>
                      {item.icon}
                      <Typography variant="caption" fontWeight={600} sx={{ fontSize: { xs: 10, sm: 12 } }}>{item.text}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Combos */}
            <ProductCombos combos={allCombos} currentProductId={product._id} onAddBundle={async (bundle) => {
              const comboPrice = parseFloat(bundle.comboPrice || bundle.price || 0);
              const firstProduct = bundle.products?.[0];
              if (!firstProduct?._id) { toast.error("Invalid bundle"); return; }
              await addToCart(firstProduct, 1, { name: bundle.name || "Bundle", price: comboPrice, isBundleItem: true, bundleProducts: bundle.products?.map((p) => ({ id: p._id, name: p.brandName || p.name, image: p.images?.[0]?.url || null, mrp: p.mrp || 0 })) });
              toast.success("Bundle added to cart!");
            }} />

            {/* Mobile sidebar accordion */}
            <Box sx={{ display: { xs: "flex", lg: "none" }, flexDirection: "column", gap: 0 }}>
              <Accordion disableGutters elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: "8px !important", mb: 1.5, "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8faff", borderRadius: "8px" }}>
                  <Typography variant="subtitle2" fontWeight={700}>Order Summary & More</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <SidebarContent {...sidebarProps} />
                </AccordionDetails>
              </Accordion>
            </Box>

            {/* Tabs */}
            <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto"
                sx={{ px: { xs:0.5, sm: 2 }, pt: 1, borderBottom: "1px solid #e5e7eb", "& .MuiTab-root": { fontSize: { xs: 11, sm: 13 }, minWidth: { xs: 55, sm: 90 }, px: { xs: 1, sm: 2 } } }}>
                {tabDefs.map((t, i) => <Tab key={t.key} label={t.label} sx={{ fontSize: "inherit" }} onClick={() => { setTabValue(i); setTabPopup(t.key); }} />)}
              </Tabs>
              <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                <Box sx={{ maxHeight: 110, overflow: "hidden", maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)" }}>
                  {tabValue === 0 && <SpecificationsPanel specifications={(product.specifications || []).slice(0, 2)} />}
                  {tabValue === 1 && <Typography variant="body2" color="#374151" sx={{ lineHeight: 1.8 }}>{(product.fullDescription || product.shortDescription || "No description available.").substring(0, 200)}...</Typography>}
                  {tabValue === 2 && <Typography variant="body2" color="text.secondary">Showing {product.reviews?.length || 0} reviews.</Typography>}
                  {tabValue === 3 && <Typography variant="body2" color="text.secondary">{questions.length} question{questions.length !== 1 ? "s" : ""} answered.</Typography>}
                </Box>
                <Box sx={{ pt: 1, textAlign: "center" }}>
                  <Button variant="text" color="primary" onClick={() => setTabPopup(tabDefs[tabValue].key)} endIcon={<OpenInNew sx={{ fontSize: 14 }} />} sx={{ fontWeight: 600, fontSize: 13 }}>
                    View Full {tabDefs[tabValue].label}
                  </Button>
                </Box>
              </Box>
            </Card>

            {/* Tab popups */}
            {tabDefs.map((t) => (
              <Dialog key={t.key} open={tabPopup === t.key} onClose={() => setTabPopup(null)} maxWidth={tabPopups[t.key]?.wide ? "md" : "sm"} fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "92vh", mx: { xs: 1, sm: 2 } } }}>
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, bgcolor: "white", zIndex: 1, fontWeight: 700 }}>
                  {tabPopups[t.key]?.title}
                  <IconButton onClick={() => setTabPopup(null)}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>{tabPopups[t.key]?.content}</DialogContent>
              </Dialog>
            ))}
          </Box>

          {/* ── COL 3: Desktop sidebar ── */}
          <Box sx={{ display: { xs: "none", lg: "block" } }}>
            <Box sx={{ position: "sticky", top: 72 }}>
              <SidebarContent {...sidebarProps} />
            </Box>
          </Box>
        </Box>

        <RelatedProducts currentId={product._id} category={product.category} sections={product.sections} />
        <RecentlyViewed currentId={product._id} />
        <WhyChooseUs />
        <Box sx={{ mt: 4, p: { xs: 1.5, sm: 2 }, bgcolor: "#fef9c3", borderRadius: 2, border: "1px solid #fde68a" }}>
          <Typography variant="caption" color="#92400e">
            <strong>Disclaimer:</strong> Information provided is for educational purposes only. Always consult your doctor or pharmacist before starting any medication.
          </Typography>
        </Box>
      </Container>

{/* QR Code Dialog */}
{product && (
  <Dialog
    open={qrDialogOpen}
    onClose={() => setQrDialogOpen(false)}
    maxWidth="xs"
    fullWidth
    PaperProps={{ sx: { borderRadius: 3, mx: { xs: 1, sm: 2 } } }}
  >
    <DialogTitle sx={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", borderBottom: "1px solid #f3f4f6", pb: 1.5
    }}>
      <Box display="flex" alignItems="center" gap={1}>
        <QrCode2Icon color="primary" />
        <Typography fontWeight={700}>Product QR Code</Typography>
      </Box>
      <IconButton size="small" onClick={() => setQrDialogOpen(false)}>
        <Close />
      </IconButton>
    </DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      <ProductQRCode
        product={product}
        productUrl={`${window.location.protocol}//${window.location.host}/product-details/${product._id}`}
      />
    </DialogContent>
  </Dialog>
)}
      {product && <PrescriptionUploadModal open={prescriptionModal} onClose={() => setPrescModal(false)} product={product} qty={qty} variant={selectedVariant || selectedCombo} />}
    </Box>
  );
}