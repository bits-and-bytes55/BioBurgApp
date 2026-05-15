import { useState, useEffect, useRef } from "react"
import axios from "axios"
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip,
  TextField, Avatar, Divider, CircularProgress, Paper,
  InputAdornment, IconButton, LinearProgress, Collapse,Rating,
} from "@mui/material"
import {
  Search, Close, CheckCircle, Send, Person, Inventory2,
  ThumbUp, StarRate, EmojiEvents, HelpOutline, Refresh,
  Star, StarBorder,
} from "@mui/icons-material"

const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const agentHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("agentToken")}`,
})

//  Rating options 
const RATINGS = [
  { value: "Satisfactory",   color: "#16a34a", bg: "#f0fdf4", border: "#86efac", icon: <CheckCircle    sx={{ fontSize:13 }} /> },
  { value: "Good",           color: "#16a34a", bg: "#f0fdf4", border: "#86efac", icon: <ThumbUp        sx={{ fontSize:13 }} /> },
  { value: "Better",         color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", icon: <StarRate       sx={{ fontSize:13 }} /> },
  { value: "Best",           color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", icon: <EmojiEvents    sx={{ fontSize:13 }} /> },
  { value: "Other",          color: "#d97706", bg: "#fffbeb", border: "#fcd34d", icon: <HelpOutline    sx={{ fontSize:13 }} /> },
]

//  Fetch hooks 
function useProducts() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`${BASE}/api/agent/products`, { headers: agentHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.products) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { products, loading }
}

function useCustomers() {
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    fetch(`${BASE}/api/agent/responses`, { headers: agentHeaders() })
      .then(r => r.json())
      .then(d => {
        if (!d.success) return
        const map = {}
        d.responses.forEach(r => {
          const key = `${r.contactPerson}__${r.phone || ""}`
          if (!map[key]) {
            map[key] = {
              name:        r.contactPerson,
              phone:       r.phone        || "",
              role:        r.contactRole  || "",
              designation: r.designation  || "",
              area:        r.city         || r.district || "",
              placeName:   r.placeName    || "",
            }
          }
        })
        setCustomers(Object.values(map))
      })
      .catch(() => {})
  }, [])

  return customers
}

//  Customer selector 
function CustomerSection({ customer, setCustomer }) {
  const allCustomers   = useCustomers()
  const [search,       setSearch]       = useState("")
  const [focused,      setFocused]      = useState(false)
  const [isNew,        setIsNew]        = useState(false)
  const [newForm,      setNewForm]      = useState({ name:"", phone:"", role:"", area:"", placeName:"" })

  const filtered = (focused || search.trim())
    ? allCustomers.filter(c =>
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.placeName.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : []

  const selectCustomer = (c) => {
    setCustomer({ ...c, isExisting: true })
    setSearch(""); setFocused(false)
  }

  const saveNew = () => {
    if (!newForm.name.trim()) return
    setCustomer({ ...newForm, isExisting: false })
    setIsNew(false)
  }

  if (customer) return (
    <Box sx={{ display:"flex", alignItems:"center", gap:1.5, p:1.5,
      bgcolor:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:2 }}>
      <Avatar sx={{ width:36, height:36, bgcolor:"#16a34a", fontSize:15, fontWeight:700 }}>
        {customer.name?.[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ flex:1, minWidth:0 }}>
        <Typography sx={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{customer.name}</Typography>
        <Typography sx={{ fontSize:11, color:"#64748b" }}>
          {customer.role}{customer.area ? ` · ${customer.area}` : ""}
          {customer.placeName ? ` · ${customer.placeName}` : ""}
        </Typography>
      </Box>
      {customer.phone && (
        <Typography sx={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{customer.phone}</Typography>
      )}
      <Chip label={customer.isExisting ? "Existing" : "New"} size="small"
        sx={{ fontSize:9, height:18, fontWeight:700,
          bgcolor: customer.isExisting ? "#dbeafe" : "#fef9c3",
          color:   customer.isExisting ? "#1d4ed8" : "#854d0e" }} />
      <IconButton size="small" onClick={() => setCustomer(null)} sx={{ color:"#94a3b8" }}>
        <Close sx={{ fontSize:14 }} />
      </IconButton>
    </Box>
  )

  return (
    <Box>
      {!isNew ? (
        <Box sx={{ position:"relative" }}>
          <TextField fullWidth size="small"
            placeholder="Search existing customer by name, phone, or place…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 180)}
            InputProps={{ startAdornment:
              <InputAdornment position="start">
                <Search sx={{ fontSize:16, color:"#94a3b8" }} />
              </InputAdornment>
            }}
          />

          {/* Dropdown */}
          {(focused || search.trim()) && (
            <Paper elevation={4} sx={{
              position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:99999,
              border:"1px solid #e2e8f0", borderRadius:2, overflow:"visible", maxHeight:280, overflowY:"auto",
            }}>
              <Box sx={{ px:2, py:0.75, bgcolor:"#f8fafc", borderBottom:"1px solid #f1f5f9",
                display:"flex", justifyContent:"space-between" }}>
                <Typography sx={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.07em" }}>
                  {search.trim() ? `${filtered.length} RESULT(S)` : `ALL CUSTOMERS (${allCustomers.length})`}
                </Typography>
              </Box>
              {filtered.length === 0 ? (
                <Box sx={{ px:2, py:2, textAlign:"center" }}>
                  <Typography sx={{ fontSize:12, color:"#94a3b8" }}>No customers found</Typography>
                </Box>
              ) : filtered.map((c, i) => (
                <Box key={i} onMouseDown={() => selectCustomer(c)}
                  sx={{ display:"flex", alignItems:"center", gap:1.5, px:2, py:1.25,
                    cursor:"pointer", borderBottom:"1px solid #f8fafc",
                    "&:hover":{ bgcolor:"#f8fafc" } }}>
                  <Avatar sx={{ width:28, height:28, fontSize:12, fontWeight:700, bgcolor:"#dbeafe", color:"#1d4ed8" }}>
                    {c.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex:1, minWidth:0 }}>
                    <Typography sx={{ fontSize:13, fontWeight:700, color:"#0f172a",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {c.name}
                    </Typography>
                    <Typography sx={{ fontSize:11, color:"#64748b" }}>
                      {c.role}{c.placeName ? ` · ${c.placeName}` : ""}{c.area ? ` · ${c.area}` : ""}
                    </Typography>
                  </Box>
                  {c.phone && (
                    <Typography sx={{ fontSize:10, color:"#94a3b8", fontFamily:"monospace" }}>{c.phone}</Typography>
                  )}
                </Box>
              ))}
            </Paper>
          )}

          <Box sx={{ mt:1, display:"flex", alignItems:"center", gap:1 }}>
            <Typography sx={{ fontSize:12, color:"#94a3b8" }}>New customer?</Typography>
            <Button size="small" onClick={() => setIsNew(true)}
              sx={{ fontSize:11, color:"#2563eb", fontWeight:700, minWidth:0, px:1, py:0.25 }}>
              Fill manually →
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display:"flex", flexDirection:"column", gap:1.5,
          p:2, bgcolor:"#fffbeb", border:"1px solid #fcd34d", borderRadius:2 }}>
          <Typography sx={{ fontSize:11, fontWeight:700, color:"#92400e", letterSpacing:"0.07em" }}>
            NEW CUSTOMER DETAILS
          </Typography>
          <Box sx={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1.5 }}>
            <TextField size="small" label="Name *" value={newForm.name}
              onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
            <TextField size="small" label="Phone" value={newForm.phone}
              onChange={e => setNewForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,"").slice(0,15) }))}
              inputProps={{ inputMode:"numeric" }} />
            <TextField size="small" label="Role / Designation" value={newForm.role}
              onChange={e => setNewForm(f => ({ ...f, role: e.target.value }))} />
            <TextField size="small" label="Area / City" value={newForm.area}
              onChange={e => setNewForm(f => ({ ...f, area: e.target.value }))} />
            <TextField size="small" label="Hospital / Place" value={newForm.placeName}
              onChange={e => setNewForm(f => ({ ...f, placeName: e.target.value }))}
              sx={{ gridColumn:"1 / -1" }} />
          </Box>
          <Box sx={{ display:"flex", gap:1 }}>
            <Button size="small" variant="contained" onClick={saveNew}
              disabled={!newForm.name.trim()}
              sx={{ bgcolor:"#d97706", "&:hover":{ bgcolor:"#b45309" }, fontWeight:700, fontSize:11, borderRadius:1.5 }}>
              Use This Customer
            </Button>
            <Button size="small" onClick={() => setIsNew(false)}
              sx={{ color:"#64748b", fontSize:11 }}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}

// Product rating card 
function ProductRatingCard({ product, rating, onRate, comment, onComment }) {
  const selected = RATINGS.find(r => r.value === rating)

  return (
    <Card sx={{
      border: selected ? `1.5px solid ${selected.border}` : "1.5px solid #e2e8f0",
      bgcolor: selected ? selected.bg : "#fff",
      borderRadius: 2.5,
      transition: "all 0.2s",
      boxShadow: selected ? `0 2px 12px ${selected.color}18` : "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <CardContent sx={{ p:"14px !important" }}>
        {/* Product info */}
        <Box sx={{ display:"flex", alignItems:"flex-start", gap:1.5, mb:1.5 }}>
          {product.image?.url ? (
            <Box component="img" src={product.image.url} alt={product.title}
              sx={{ width:44, height:44, borderRadius:1.5, objectFit:"cover", flexShrink:0 }} />
          ) : (
            <Avatar sx={{ width:44, height:44, borderRadius:1.5, bgcolor:"#e2e8f0", color:"#64748b" }}>
              <Inventory2 sx={{ fontSize:20 }} />
            </Avatar>
          )}
          <Box sx={{ flex:1, minWidth:0 }}>
            <Typography sx={{ fontSize:13, fontWeight:700, color:"#0f172a",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {product.title || product.name}
            </Typography>
            <Typography sx={{ fontSize:11, color:"#64748b" }}>
              {product.brandName || product.category || ""}
            </Typography>
            {product.price && (
              <Typography sx={{ fontSize:11, fontWeight:700, color:"#1d4ed8", fontFamily:"monospace" }}>
                ₹{Number(product.price).toLocaleString("en-IN")}
              </Typography>
            )}
          </Box>
          {selected && (
            <Chip label={selected.value} size="small"
              sx={{ fontSize:10, height:20, fontWeight:700,
                bgcolor: selected.bg, color: selected.color,
                border:`1px solid ${selected.border}` }} />
          )}
        </Box>

        {/* Rating chips */}
        <Box sx={{ display:"flex", gap:0.75, flexWrap:"wrap" }}>
          {RATINGS.map(r => (
            <Box key={r.value}
              onClick={() => onRate(rating === r.value ? null : r.value)}
              sx={{
                display:"flex", alignItems:"center", gap:0.5,
                px:1.25, py:0.5, borderRadius:1.5, cursor:"pointer",
                border:`1.5px solid ${rating === r.value ? r.color : "#e2e8f0"}`,
                bgcolor: rating === r.value ? r.bg : "#f8fafc",
                color: rating === r.value ? r.color : "#64748b",
                fontSize:11, fontWeight:700,
                transition:"all 0.15s",
                "&:hover":{ borderColor: r.color, bgcolor: r.bg, color: r.color },
              }}>
              {r.icon}
              <Typography sx={{ fontSize:11, fontWeight:700, color:"inherit" }}>{r.value}</Typography>
              {rating === r.value && <CheckCircle sx={{ fontSize:11 }} />}
            </Box>
          ))}
        </Box>

        {/* Other comment */}
        <Collapse in={rating === "Other"}>
          <TextField fullWidth size="small"
            placeholder="Please specify…"
            value={comment || ""}
            onChange={e => onComment(e.target.value)}
            sx={{ mt:1.25, "& .MuiInputBase-root":{ fontSize:12 } }}
          />
        </Collapse>
      </CardContent>
    </Card>
  )
}

//  MAIN COMPONENT 
export default function ProductFeedback() {
  const { products, loading: prodLoading } = useProducts()
  const [customer,    setCustomer]    = useState(null)
  const [ratings,     setRatings]     = useState({})   // { productId: "Good"|"Better"|"Best"|"Other"|null }
  const [comments,    setComments]    = useState({})   // { productId: "text" } for Other
  const [remarks,     setRemarks]     = useState("")
  const [search,      setSearch]      = useState("")
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [toast,       setToast]       = useState(null)
  const [overallRating, setOverallRating] = useState(0)
  // toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const ratedCount = Object.values(ratings).filter(Boolean).length

  const progress = Math.min(100, Math.round(
    ((customer ? 40 : 0) + (ratedCount > 0 ? Math.min(ratedCount * 10, 60) : 0))
  ))

  const filteredProducts = products.filter(p =>
    !search.trim() ||
    (p.title || p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.brandName || "").toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!customer) { setToast({ msg:"Please select or add a customer", type:"error" }); return }
    if (ratedCount === 0) { setToast({ msg:"Please rate at least one product", type:"error" }); return }

    const ratedProducts = Object.entries(ratings)
      .filter(([, v]) => v)
      .map(([productId, rating]) => {
        const prod = products.find(p => p._id === productId)
        return {
          productId,
          productName: prod?.title || prod?.name || productId,
          brandName:   prod?.brandName || "",
          rating,
          comment:     rating === "Other" ? (comments[productId] || "") : "",
        }
      })

    const payload = {
      customer: {
        name:       customer.name,
        phone:      customer.phone || "",
        role:       customer.role  || "",
        area:       customer.area  || "",
        placeName:  customer.placeName || "",
        isExisting: customer.isExisting,
      },
      products:    ratedProducts,
      remarks:     remarks || "",
      submittedAt: new Date().toISOString(),
    }

    setSubmitting(true)
    try {
      await axios.post(`${BASE}/api/public/product-feedback`, payload, {
        headers: agentHeaders(),
      })
      setSubmitted(true)
      setToast({ msg:"Feedback submitted successfully!", type:"success" })
    } catch (err) {
      const msg = err?.response?.data?.message || "Submission failed. Please try again."
      setToast({ msg, type:"error" })
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setCustomer(null); setRatings({}); setComments({})
    setRemarks(""); setSearch(""); setSubmitted(false)
  }

  // ── Success screen ──
  if (submitted) return (
    <Box sx={{ minHeight:"100vh", bgcolor:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", p:2 }}>
      <Paper elevation={0} sx={{ maxWidth:460, width:"100%", p:4, borderRadius:3,
        border:"1px solid #e2e8f0", textAlign:"center" }}>
        <Box sx={{ width:80, height:80, borderRadius:"50%", bgcolor:"#dcfce7",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:40, mx:"auto", mb:2.5,
          boxShadow:"0 0 0 12px rgba(34,197,94,0.1)" }}>
          ✓
        </Box>
        <Typography sx={{ fontSize:22, fontWeight:800, color:"#0f172a", mb:1 }}>
          Feedback Recorded!
        </Typography>
        <Typography sx={{ fontSize:13, color:"#64748b", mb:0.75, lineHeight:1.7 }}>
          Feedback for <strong style={{ color:"#1e3a8a" }}>{customer?.name}</strong> has been saved.
        </Typography>
        <Typography sx={{ fontSize:12, color:"#94a3b8", mb:3 }}>
          {ratedCount} product{ratedCount !== 1 ? "s" : ""} rated
        </Typography>
        <Button variant="contained" onClick={reset} fullWidth
          sx={{ bgcolor:"#1d4ed8", "&:hover":{ bgcolor:"#1e40af" }, fontWeight:700, borderRadius:2 }}>
          Submit Another
        </Button>
      </Paper>
    </Box>
  )

  // ── Main form ──
  return (
    <Box sx={{ minHeight:"100vh", bgcolor:"#f8fafc", pb:8 }}>

      {/* Header */}
      <Box sx={{ bgcolor:"#fff", borderBottom:"1px solid #e2e8f0", px:{ xs:2, md:4 }, py:2,
        position:"sticky", top:0, zIndex:100 }}>
        <Box sx={{ maxWidth:900, mx:"auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Box>
            <Typography sx={{ fontSize:{ xs:16, sm:20 }, fontWeight:800, color:"#0f172a" }}>
              Product Feedback
            </Typography>
            <Typography sx={{ fontSize:12, color:"#64748b" }}>
              Collect customer ratings for multiple products at once
            </Typography>
          </Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:2 }}>
            {ratedCount > 0 && (
              <Chip label={`${ratedCount} rated`} size="small"
                sx={{ fontWeight:700, bgcolor:"#eff6ff", color:"#1d4ed8" }} />
            )}
            <Button variant="contained" onClick={handleSubmit} disabled={submitting || !customer || ratedCount === 0}
              startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <Send sx={{ fontSize:14 }} />}
              sx={{ bgcolor:"#1d4ed8", "&:hover":{ bgcolor:"#1e40af" }, fontWeight:700,
                borderRadius:2, fontSize:13, px:2.5,
                "&:disabled":{ opacity:0.5 } }}>
              {submitting ? "Saving…" : "Submit"}
            </Button>
          </Box>
        </Box>

        {/* Progress bar */}
        <Box sx={{ maxWidth:900, mx:"auto", mt:1.5 }}>
          <LinearProgress variant="determinate" value={progress}
            sx={{ height:3, borderRadius:2, bgcolor:"#e2e8f0",
              "& .MuiLinearProgress-bar":{ bgcolor:"#1d4ed8", borderRadius:2 } }} />
        </Box>
      </Box>

      <Box sx={{ maxWidth:900, mx:"auto", px:{ xs:2, md:4 }, pt:3 }}>

        {/* ── Step 1: Customer ── */}
        <Paper elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:2.5, overflow:"visible", mb:2.5 }}>
          <Box sx={{ px:2.5, py:1.5, bgcolor:"#f8fafc", borderBottom:"1px solid #f1f5f9",
            display:"flex", alignItems:"center", gap:1 }}>
            <Box sx={{ width:22, height:22, borderRadius:"50%", bgcolor:"#1d4ed8",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Typography sx={{ fontSize:11, fontWeight:800, color:"#fff" }}>1</Typography>
            </Box>
            <Typography sx={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>
              Select Customer
            </Typography>
            {customer && <CheckCircle sx={{ fontSize:16, color:"#16a34a", ml:"auto" }} />}
          </Box>
          <Box sx={{ p:2.5 }}>
            <CustomerSection customer={customer} setCustomer={setCustomer} />
          </Box>
        </Paper>

        {/* ── Step 2: Products ── */}
        <Paper elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:2.5, overflow:"visible", mb:2.5 }}>
          <Box sx={{ px:2.5, py:1.5, bgcolor:"#f8fafc", borderBottom:"1px solid #f1f5f9",
            display:"flex", alignItems:"center", gap:1, flexWrap:"wrap" }}>
            <Box sx={{ width:22, height:22, borderRadius:"50%",
              bgcolor: ratedCount > 0 ? "#16a34a" : "#1d4ed8",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Typography sx={{ fontSize:11, fontWeight:800, color:"#fff" }}>2</Typography>
            </Box>
            <Typography sx={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>
              Rate Products
            </Typography>
            <Typography sx={{ fontSize:11, color:"#94a3b8", ml:0.5 }}>
              — select Satisfactory / Good / Better / Best / Other for each
            </Typography>
            {ratedCount > 0 && (
              <Chip label={`${ratedCount} / ${products.length} rated`} size="small"
                sx={{ ml:"auto", fontWeight:700, bgcolor:"#dcfce7", color:"#16a34a" }} />
            )}
          </Box>

          <Box sx={{ p:2.5 }}>
            {/* Search products */}
            <TextField fullWidth size="small" placeholder="Search products…"
              value={search} onChange={e => setSearch(e.target.value)}
              sx={{ mb:2, "& .MuiOutlinedInput-root":{ borderRadius:2 } }}
              InputProps={{ startAdornment:
                <InputAdornment position="start">
                  <Search sx={{ fontSize:16, color:"#94a3b8" }} />
                </InputAdornment>
              }} />

            {/* Rating legend */}
            <Box sx={{ display:"flex", gap:1, mb:2, flexWrap:"wrap" }}>
              {RATINGS.map(r => (
                <Box key={r.value} sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
                  <Box sx={{ width:8, height:8, borderRadius:"50%", bgcolor:r.color }} />
                  <Typography sx={{ fontSize:10, color:"#64748b" }}>{r.value}</Typography>
                </Box>
              ))}
              <Typography sx={{ fontSize:10, color:"#94a3b8", ml:0.5 }}>
                · Click same rating again to deselect
              </Typography>
            </Box>

            {prodLoading ? (
              <Box sx={{ py:6, textAlign:"center" }}>
                <CircularProgress size={28} sx={{ color:"#1d4ed8" }} />
                <Typography sx={{ fontSize:13, color:"#64748b", mt:1.5 }}>Loading products…</Typography>
              </Box>
            ) : filteredProducts.length === 0 ? (
              <Box sx={{ py:6, textAlign:"center", border:"2px dashed #e2e8f0", borderRadius:2 }}>
                <Typography sx={{ fontSize:13, color:"#94a3b8" }}>
                  {search ? "No products match your search" : "No products found"}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={1.5}>
                {filteredProducts.map(p => (
                  <Grid item xs={12} sm={6} md={4} key={p._id}>
                    <ProductRatingCard
                      product={p}
                      rating={ratings[p._id] || null}
                      onRate={val => setRatings(r => ({ ...r, [p._id]: val }))}
                      comment={comments[p._id] || ""}
                      onComment={val => setComments(c => ({ ...c, [p._id]: val }))}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Paper>

        {/* ── Step 3: Overall Rating ── */}
<Paper
  elevation={0}
  sx={{
    border:"1px solid #e2e8f0",
    borderRadius:2.5,
    overflow:"hidden",
    mb:2.5,
  }}
>
  <Box
    sx={{
      px:2.5,
      py:1.5,
      bgcolor:"#f8fafc",
      borderBottom:"1px solid #f1f5f9",
      display:"flex",
      alignItems:"center",
      gap:1,
    }}
  >
    <Box
      sx={{
        width:22,
        height:22,
        borderRadius:"50%",
        bgcolor:"#f59e0b",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
      }}
    >
      <Typography sx={{ fontSize:11, fontWeight:800, color:"#fff" }}>
        3
      </Typography>
    </Box>

    <Typography
      sx={{
        fontSize:13,
        fontWeight:700,
        color:"#0f172a",
      }}
    >
      Overall Experience Rating
    </Typography>

    <Typography
      sx={{
        fontSize:11,
        color:"#94a3b8",
      }}
    >
      — optional
    </Typography>
  </Box>

  <Box
    sx={{
      p:3,
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      gap:1.5,
    }}
  >
    <Rating
      name="overall-rating"
      value={overallRating}
      precision={0.5}
      size="large"
      onChange={(event, newValue) => {
        setOverallRating(newValue || 0)
      }}
      sx={{
        "& .MuiRating-iconFilled": {
          color:"#f59e0b",
        },

        "& .MuiRating-iconHover": {
          color:"#fbbf24",
        },

        fontSize:42,
      }}
    />

    <Typography
      sx={{
        fontSize:13,
        fontWeight:700,
        color:
          overallRating >= 4
            ? "#16a34a"
            : overallRating >= 3
            ? "#d97706"
            : "#64748b",
      }}
    >
      {overallRating > 0
        ? `${overallRating.toFixed(1)} / 5 Rating`
        : "Tap stars to rate"}
    </Typography>
  </Box>
</Paper>
        {/* ── Step 3: Remarks ── */}
        <Paper elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:2.5, overflow:"hidden", mb:3 }}>
          <Box sx={{ px:2.5, py:1.5, bgcolor:"#f8fafc", borderBottom:"1px solid #f1f5f9",
            display:"flex", alignItems:"center", gap:1 }}>
            <Box sx={{ width:22, height:22, borderRadius:"50%", bgcolor:"#64748b",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Typography sx={{ fontSize:11, fontWeight:800, color:"#fff" }}>3</Typography>
            </Box>
            <Typography sx={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>
              Overall Remarks
            </Typography>
            <Typography sx={{ fontSize:11, color:"#94a3b8" }}>— optional</Typography>
          </Box>
          <Box sx={{ p:2.5 }}>
            <TextField fullWidth multiline rows={3}
              placeholder="Any general feedback, observations, or suggestions from the customer…"
              value={remarks} onChange={e => setRemarks(e.target.value)}
              inputProps={{ maxLength:600 }}
              sx={{ "& .MuiInputBase-root":{ fontSize:13 } }} />
            <Typography sx={{ fontSize:11, color:"#94a3b8", textAlign:"right", mt:0.5 }}>
              {remarks.length} / 600
            </Typography>
          </Box>
        </Paper>

        {/* Submit */}
        <Button fullWidth variant="contained" onClick={handleSubmit}
          disabled={submitting || !customer || ratedCount === 0}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
          sx={{ py:1.5, bgcolor:"#1d4ed8", "&:hover":{ bgcolor:"#1e40af" },
            fontWeight:700, fontSize:15, borderRadius:2.5,
            "&:disabled":{ opacity:0.5 },
            boxShadow:"0 4px 14px rgba(29,78,216,0.3)" }}>
          {submitting ? "Submitting Feedback…" : "Submit Feedback"}
        </Button>

        {(!customer || ratedCount === 0) && (
          <Typography sx={{ fontSize:12, color:"#94a3b8", textAlign:"center", mt:1 }}>
            {!customer ? "Select a customer first" : "Rate at least one product to continue"}
          </Typography>
        )}

      </Box>

      {/* Toast */}
      {toast && (
        <Box sx={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          px:3, py:1.5, borderRadius:2, fontWeight:600, fontSize:13,
          zIndex:9999, whiteSpace:"nowrap", maxWidth:"90vw",
          bgcolor: toast.type === "success" ? "#15803d" : "#b91c1c",
          color:"#fff", boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
        }}>
          {toast.msg}
        </Box>
      )}

    </Box>
  )
}