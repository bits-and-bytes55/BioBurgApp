// AdminTargetManagement.jsx — Product-linked Points Targets + Multi-Agent + Rupee Payout
import { useState, useEffect, useRef } from "react"
import {
  TrackChanges, TrendingUp, CheckCircle, EmojiEvents,
  Add, Edit, Delete, Close, Save, BarChart as BarChartIcon,
  TableChart, Search, ExpandMore, AddCircleOutline,
  Person, ArrowBack, Refresh, Stars, Group,
  MonetizationOn, Inventory2, CheckBox, CheckBoxOutlineBlank,
  IndeterminateCheckBox,
} from "@mui/icons-material"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"

const API   = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")
const pct   = (a, t) => (!t ? 0 : Math.min(Math.round((a / t) * 100), 999))
const clr   = (p)    => p >= 100 ? "#16a34a" : p >= 70 ? "#1d4ed8" : p >= 40 ? "#d97706" : "#dc2626"
const bgClr = (p)    => p >= 100 ? "#dcfce7" : p >= 70 ? "#dbeafe" : p >= 40 ? "#fef3c7" : "#fee2e2"
const lbl   = (p)    => p >= 100 ? "Achieved" : p >= 70 ? "On Track" : p >= 40 ? "At Risk" : "Critical"
const NK    = (t)    => t === "product" ? "product_name" : t === "area" ? "area_name" : t === "points" ? "name" : "month_name"
const SK    = (t)    => t === "product" ? "segment" : t === "area" ? "region" : t === "points" ? "deadline" : "year"
const SKIP  = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End",".",","]
const numGuard = (e) => { if (!/[0-9]/.test(e.key) && !SKIP.includes(e.key)) e.preventDefault() }
const txtGuard = (e) => { if (/[0-9]/.test(e.key)) e.preventDefault() }
const norm  = (doc)  => ({ ...doc, id: doc._id ?? doc.id })

const ALL_AGENTS_OBJ = { _id: "all", name: "All Agents", assignedArea: "Global Target", isAll: true }

const adminHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
})

const apiFetch = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, { headers: adminHeaders(), ...opts })
  if (!res.ok) { const m = await res.text().catch(() => res.statusText); throw new Error(m || `HTTP ${res.status}`) }
  return res.json()
}

// ── Toast ──
function Toast({ msg, type }) {
  return (
    <div style={{
      position:"fixed", top:20, right:20, zIndex:9999, padding:"12px 22px",
      borderRadius:12, fontSize:13, fontWeight:700, color:"#fff",
      boxShadow:"0 8px 32px rgba(0,0,0,0.18)",
      background: type === "del" ? "#dc2626" : "#16a34a", animation:"tin .22s ease",
    }}>
      {msg}
      <style>{`@keyframes tin{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}

const ProgressBar = ({ a, t, color, height=8 }) => {
  const raw = !t ? 0 : (a / t) * 100
  const capped = Math.min(raw, 100)
  const over = raw > 100
  return (
    <div style={{ background:"#f1f5f9", borderRadius:99, height, overflow:"hidden", position:"relative" }}>
      <div style={{ width:`${capped}%`, height:"100%", background:color, borderRadius:99, transition:"width .5s ease" }} />
      {over && (
        <div style={{ position:"absolute", right:0, top:0, height:"100%", width:"6px", background:"#f59e0b", borderRadius:"0 99px 99px 0", animation:"blink 1s ease infinite" }} />
      )}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}

const Badge = ({ p }) => (
  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:bgClr(p), color:clr(p), whiteSpace:"nowrap" }}>{lbl(p)}</span>
)

const OverBadge = ({ p }) => {
  if (p <= 100) return null
  const over = p - 100
  return (
    <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:99, background:"#fef3c7", color:"#d97706", whiteSpace:"nowrap", marginLeft:4 }}>
      +{over}% over
    </span>
  )
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ flex:1, minWidth:155, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"17px 20px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, background:color+"18", color, display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</div>
      <div style={{ minWidth:0 }}>
        <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</p>
        <p style={{ margin:"3px 0 0", fontSize:24, fontWeight:900, color:"#0f172a", lineHeight:1 }}>{value}</p>
        {sub && <p style={{ margin:"3px 0 0", fontSize:12, color:"#64748b" }}>{sub}</p>}
      </div>
    </div>
  )
}

const Backdrop = ({ children, onClick }) => (
  <div onClick={onClick} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.48)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>{children}</div>
)
const Xbtn = ({ onClick }) => (
  <button onClick={onClick} style={{ background:"#f1f5f9", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
    <Close style={{ fontSize:17, color:"#64748b" }} />
  </button>
)
const Btn = ({ children, onClick, ghost, danger, disabled, small, color }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "6px 14px" : "9px 20px", borderRadius:10,
    cursor:disabled?"not-allowed":"pointer", fontSize:small?12:13,
    fontWeight:700, display:"flex", alignItems:"center", gap:6, border:"none",
    opacity:disabled?0.6:1,
    background: ghost?"#fff" : danger?"#dc2626" : color||"#1d4ed8",
    color:      ghost?"#475569":"#fff",
    outline:    ghost?"1.5px solid #e2e8f0":"none",
  }}>{children}</button>
)
const Err = ({ msg }) => <p style={{ margin:"4px 0 0", fontSize:11, color:"#dc2626" }}>{msg}</p>
const LS  = { fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:5 }
const IS  = { width:"100%", padding:"9px 12px", borderRadius:10, fontSize:13, border:"1.5px solid #e2e8f0", background:"#f8fafc", outline:"none", boxSizing:"border-box" }

// ── Product Picker (from catalogue, for product tab) ──
function ProductPicker({ value, productId, genericName, mrp, onSelect, hasError }) {
  const [open, setOpen]         = useState(false)
  const [search, setSearch]     = useState("")
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    setLoading(true)
    apiFetch("/api/products/for-targets")
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn)
  }, [])

  const filtered = products.filter(p =>
    !search ||
    (p.brandName || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.genericName || p.genericCompositions || "").toLowerCase().includes(search.toLowerCase())
  )

  const clear = () => onSelect({ product_name:"", productId:"", genericName:"", mrp:"" })

  return (
    <div>
      <label style={LS}>Product (from active catalogue) *</label>
      {value ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#eff6ff", border:"1.5px solid #bfdbfe", borderRadius:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#1d4ed8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
            {genericName && <p style={{ margin:"2px 0 0", fontSize:11, color:"#64748b" }}>{genericName}</p>}
            {mrp && <p style={{ margin:"1px 0 0", fontSize:11, color:"#94a3b8" }}>MRP: ₹{mrp}</p>}
          </div>
          <button type="button" onClick={clear} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:20, lineHeight:1, flexShrink:0 }}>×</button>
        </div>
      ) : (
        <div ref={ref} style={{ position:"relative" }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
            placeholder="Search by brand or generic name…" style={{ ...IS, borderColor: hasError ? "#fca5a5" : "#e2e8f0" }} />
          {open && (
            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:1600, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12, boxShadow:"0 10px 38px rgba(0,0,0,0.14)", maxHeight:240, overflowY:"auto" }}>
              {loading && <p style={{ margin:0, padding:"12px 14px", fontSize:12, color:"#94a3b8" }}>Loading products…</p>}
              {!loading && filtered.length === 0 && <p style={{ margin:0, padding:"12px 14px", fontSize:12, color:"#94a3b8" }}>No active products found.</p>}
              {!loading && filtered.map(prod => (
                <div key={prod._id} onClick={() => { onSelect({ product_name:prod.brandName, productId:prod._id, genericName:prod.genericName||prod.genericCompositions||"", mrp:String(prod.mrp||"") }); setSearch(""); setOpen(false) }}
                  style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f1f5f9" }}
                  onMouseEnter={e => e.currentTarget.style.background="#f0f9ff"}
                  onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#0f172a" }}>{prod.brandName}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#64748b" }}>
                    {prod.genericName||prod.genericCompositions||"—"}
                    {prod.mrp ? ` · MRP ₹${prod.mrp}` : ""}
                    {prod.stocks != null ? ` · Stock: ${prod.stocks}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {hasError && <Err msg="Please select a product from the catalogue" />}
    </div>
  )
}

function PointsProductPicker({ value, onSelect, productTargets = [] }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef(null)

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn)
  }, [])

  const filtered = productTargets.filter(p =>
    !search ||
    (p.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.genericName  || "").toLowerCase().includes(search.toLowerCase())
  )

  const clear = () => onSelect({ linkedProductName:"", linkedProductId:"", linkedProductMrp:"" })

  return (
    <div>
      <label style={LS}>Link to Product (from this agent's product targets)</label>
      {value ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#faf5ff", border:"1.5px solid #e9d5ff", borderRadius:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Inventory2 style={{ fontSize:14, color:"#7c3aed", flexShrink:0 }} />
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#7c3aed", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
            </div>
            <p style={{ margin:"3px 0 0", fontSize:11, color:"#94a3b8" }}>Sales of this product will auto-count toward this points target</p>
          </div>
          <button type="button" onClick={clear} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:20, lineHeight:1, flexShrink:0 }}>×</button>
        </div>
      ) : (
        <div ref={ref} style={{ position:"relative" }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={productTargets.length === 0 ? "No product targets added yet…" : "Search from assigned products…"}
            disabled={productTargets.length === 0}
            style={{ ...IS, opacity: productTargets.length === 0 ? 0.5 : 1 }}
          />
          {open && productTargets.length > 0 && (
            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:1600,
              background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12,
              boxShadow:"0 10px 38px rgba(0,0,0,0.14)", maxHeight:220, overflowY:"auto" }}>
              {filtered.length === 0 && (
                <p style={{ margin:0, padding:"12px 14px", fontSize:12, color:"#94a3b8" }}>No matching products.</p>
              )}
              {filtered.map(prod => (
                <div key={prod.id || prod._id}
                  onClick={() => {
  onSelect({
    linkedProductName:   prod.product_name,
    linkedProductId:     prod.productId || prod._id || "",
    linkedProductMrp:    String(prod.mrp || ""),
    linkedProductTarget: String(prod.target || ""),  // ← carry over the units
  })
  setSearch(""); setOpen(false)
}}
                  style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f1f5f9" }}
                  onMouseEnter={e => e.currentTarget.style.background="#faf5ff"}
                  onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#0f172a" }}>{prod.product_name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#64748b" }}>
  {prod.genericName || "—"}
  {prod.segment ? ` · ${prod.segment}` : ""}
  {prod.target
    ? <span style={{ color:"#7c3aed", fontWeight:700 }}> · {prod.target} units target</span>
    : ""}
</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {productTargets.length === 0 && (
        <p style={{ margin:"5px 0 0", fontSize:11, color:"#f59e0b" }}>
          ⚠ Add product targets first — then link them here for auto-tracking.
        </p>
      )}
    </div>
  )
}

// ── Custom Select ──
function CustomSelect({ optKey, allOptions, setAllOptions, value, onChange, placeholder, hasError }) {
  const [open, setOpen]     = useState(false)
  const [newVal, setNewVal] = useState("")
  const [adding, setAdding] = useState(false)
  const ref  = useRef(null)
  const opts = allOptions[optKey] ?? []

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn)
  }, [])

  const select = (v) => { onChange(v); setOpen(false) }

  const addNew = async () => {
    const v = newVal.trim(); if (!v || adding) return
    const exists = opts.find(o => o.toLowerCase() === v.toLowerCase())
    if (exists) { select(exists); setNewVal(""); return }
    try {
      setAdding(true)
      await apiFetch(`/api/targets/options/${optKey}`, { method:"POST", body:JSON.stringify({ value:v }) })
      setAllOptions(prev => ({ ...prev, [optKey]: [...(prev[optKey]??[]), v] }))
      select(v); setNewVal("")
    } catch(err) { console.error("addOption:", err) }
    finally { setAdding(false) }
  }

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button type="button" onClick={() => setOpen(o=>!o)} style={{
        width:"100%", padding:"9px 12px", borderRadius:10, textAlign:"left",
        border:`1.5px solid ${hasError?"#fca5a5":open?"#1d4ed8":"#e2e8f0"}`,
        background:"#f8fafc", fontSize:13, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        color: value?"#0f172a":"#94a3b8",
      }}>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value||placeholder}</span>
        <ExpandMore style={{ fontSize:17, color:"#94a3b8", flexShrink:0, transform:open?"rotate(180deg)":"none", transition:"transform .15s" }} />
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 5px)", left:0, right:0, zIndex:1500, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:13, boxShadow:"0 10px 38px rgba(0,0,0,0.14)", overflow:"hidden" }}>
          <div style={{ maxHeight:198, overflowY:"auto" }}>
            {opts.length===0 && <p style={{ margin:0, padding:"11px 14px", fontSize:12, color:"#94a3b8" }}>No options yet — add one below.</p>}
            {opts.map(opt => (
              <button key={opt} type="button" onClick={() => select(opt)} style={{
                display:"block", width:"100%", textAlign:"left", padding:"9px 15px", border:"none", cursor:"pointer",
                fontSize:13, fontWeight:value===opt?700:400, background:value===opt?"#eff6ff":"#fff", color:value===opt?"#1d4ed8":"#0f172a",
              }}
              onMouseEnter={e=>{ if(value!==opt) e.currentTarget.style.background="#f8fafc" }}
              onMouseLeave={e=>{ if(value!==opt) e.currentTarget.style.background="#fff" }}>{opt}</button>
            ))}
          </div>
          <div style={{ borderTop:"1px solid #f1f5f9", padding:"9px 10px", background:"#fafafa", display:"flex", gap:7, alignItems:"center" }}>
            <AddCircleOutline style={{ fontSize:16, color:"#94a3b8", flexShrink:0 }} />
            <input value={newVal} onKeyDown={txtGuard}
              onChange={e=>{ if(!/[0-9]/.test(e.target.value)) setNewVal(e.target.value) }}
              onKeyUp={e=>{ if(e.key==="Enter") addNew() }}
              placeholder="Add custom option…"
              style={{ flex:1, padding:"7px 10px", borderRadius:8, fontSize:12, border:"1.5px solid #e2e8f0", background:"#fff", outline:"none" }} />
            <button type="button" onClick={addNew} disabled={!newVal.trim()||adding} style={{
              padding:"7px 13px", border:"none", borderRadius:8, fontSize:12, fontWeight:700,
              cursor:(newVal.trim()&&!adding)?"pointer":"not-allowed",
              background:(newVal.trim()&&!adding)?"#1d4ed8":"#e2e8f0",
              color:(newVal.trim()&&!adding)?"#fff":"#94a3b8",
            }}>{adding?"…":"Add"}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal ──
function Modal({ tab, mode, form, setForm, errors, onSave, onClose, saving, allOptions, setAllOptions, agentName, productTargets }) {
  const nf = (key, label, ph) => (
    <div>
      <label style={LS}>{label}</label>
      <input type="text" inputMode="numeric" value={form[key]??""} onKeyDown={numGuard}
        onChange={e=>{ if(!/[^0-9]/.test(e.target.value)) setForm(p=>({...p,[key]:e.target.value})) }}
        placeholder={ph} style={{...IS, borderColor:errors[key]?"#fca5a5":"#e2e8f0"}} />
      {errors[key] && <Err msg={errors[key]} />}
    </div>
  )
  const tf = (key, label, ph) => (
    <div>
      <label style={LS}>{label}</label>
      <input type="text" value={form[key]??""} onKeyDown={txtGuard}
        onChange={e=>{ if(!/[0-9]/.test(e.target.value)) setForm(p=>({...p,[key]:e.target.value})) }}
        placeholder={ph} style={{...IS, borderColor:errors[key]?"#fca5a5":"#e2e8f0"}} />
      {errors[key] && <Err msg={errors[key]} />}
    </div>
  )
  const sf = (key, label, optKey, ph) => (
    <div>
      <label style={LS}>{label}</label>
      <CustomSelect optKey={optKey} allOptions={allOptions} setAllOptions={setAllOptions}
        value={form[key]??""} onChange={v=>setForm(p=>({...p,[key]:v}))} placeholder={ph} hasError={!!errors[key]} />
      {errors[key] && <Err msg={errors[key]} />}
    </div>
  )
  const dfField = (key, label) => (
    <div>
      <label style={LS}>{label}</label>
      <input type="date" value={form[key]??""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
        style={{...IS, borderColor:errors[key]?"#fca5a5":"#e2e8f0"}} />
      {errors[key] && <Err msg={errors[key]} />}
    </div>
  )

  return (
    <Backdrop onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:20, padding:28, width:"100%",
        maxWidth:520, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a" }}>
            {mode==="add"?"Add Entry":"Edit Entry"} — {tab==="product"?"Product":tab==="area"?"Area":tab==="points"?"Points Target":"Monthly"}
          </h2>
          <Xbtn onClick={onClose} />
        </div>
        <p style={{ margin:"0 0 18px", fontSize:12, color:"#64748b" }}>
          Agent: <strong style={{ color:"#1d4ed8" }}>{agentName}</strong>
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:15 }}>
          {tab==="product" && (
            <>
              <ProductPicker value={form.product_name||""} productId={form.productId||""} genericName={form.genericName||""} mrp={form.mrp||""}
                hasError={!!errors.product_name} onSelect={fields => setForm(f => ({ ...f, ...fields }))} />
              {sf("segment","Segment","segments","Select or add segment…")}
              {nf("target","Monthly Target (units)","e.g. 200")}
              <div style={{ padding:"10px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, fontSize:12, color:"#166534" }}>
                ✓ Achieved units are auto-tracked from agent's billing orders for this product.
              </div>
            </>
          )}
          {tab==="area" && (
            <>{tf("area_name","Area / Territory","e.g. Bandra")}
              {sf("region","Region","regions","Select or add region…")}
              {nf("target","Target (units)","e.g. 80")}
              {nf("achieved","Achieved (units)","e.g. 72")}</>
          )}
          {tab==="monthly" && (
            <>{sf("month_name","Month","months","Select or add month…")}
              {sf("year","Year","years","Select or add year…")}
              {nf("target","Monthly Target","e.g. 750")}
              {nf("achieved","Achieved","e.g. 620")}</>
          )}
          {tab==="points" && (
            <>
              <div>
                <label style={LS}>Target Name *</label>
                <input type="text" value={form.name??""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  placeholder="e.g. Q1 Sales Challenge"
                  style={{...IS, borderColor:errors.name?"#fca5a5":"#e2e8f0"}} />
                {errors.name && <Err msg={errors.name} />}
              </div>
              <div>
                <label style={LS}>Description (optional)</label>
                <textarea value={form.description??""} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                  placeholder="Describe the challenge…" rows={2}
                  style={{...IS, resize:"vertical"}} />
              </div>

              {/* Link a real product */}
              <PointsProductPicker
  value={form.linkedProductName||""}
  productId={form.linkedProductId||""}
  productTargets={productTargets}
  onSelect={fields => setForm(f => ({
    ...f,
    ...fields,
    // auto-fill target from the product target's units — no need to re-enter
    target: fields.linkedProductTarget || f.target || "",
  }))}
/>

              {nf("target", form.linkedProductName ? "Quantity Target (units to sell)" : "Points Target (to earn)", "e.g. 500")}

              {/* Points per unit sold */}
              {form.linkedProductName && (
                <div>
                  <label style={LS}>Points Per Unit Sold</label>
                  <input type="text" inputMode="numeric" value={form.pointsPerUnit??""} onKeyDown={numGuard}
                    onChange={e=>{ if(!/[^0-9]/.test(e.target.value)) setForm(p=>({...p,pointsPerUnit:e.target.value})) }}
                    placeholder="e.g. 10 (points credited per unit billed)"
                    style={IS} />
                  <p style={{ margin:"4px 0 0", fontSize:11, color:"#64748b" }}>
                    Sell {form.target||"N"} units × {form.pointsPerUnit||"N"} pts = {form.target&&form.pointsPerUnit ? Number(form.target)*Number(form.pointsPerUnit) : "?"} total pts earnable
                  </p>
                </div>
              )}

              {nf("bonusPoints","Bonus Points on Achievement","e.g. 50")}

              {/* Rupee payout on achievement */}
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:12, padding:"14px" }}>
                <label style={{...LS, color:"#92400e", marginBottom:10}}>
                  <MonetizationOn style={{fontSize:14, verticalAlign:"middle", marginRight:4}}/>
                  Rupee Payout on Achievement (optional)
                </label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={{...LS, fontSize:11}}>Payout Amount (₹)</label>
                    <input type="text" inputMode="numeric" value={form.rupeeReward??""} onKeyDown={numGuard}
                      onChange={e=>{ if(!/[^0-9]/.test(e.target.value)) setForm(p=>({...p,rupeeReward:e.target.value})) }}
                      placeholder="e.g. 500"
                      style={{...IS, borderColor:"#fde68a", background:"#fff"}} />
                  </div>
                  <div>
                    <label style={{...LS, fontSize:11}}>Payout Type</label>
                    <select value={form.rupeeRewardType||"one_time"} onChange={e=>setForm(p=>({...p,rupeeRewardType:e.target.value}))}
                      style={{...IS, borderColor:"#fde68a", background:"#fff", cursor:"pointer"}}>
                      <option value="one_time">One-Time on Achieve</option>
                      <option value="per_unit_over">Per Unit Over Target</option>
                    </select>
                  </div>
                </div>
                {form.rupeeReward && (
                  <p style={{ margin:"8px 0 0", fontSize:11, color:"#92400e" }}>
                    {form.rupeeRewardType==="per_unit_over"
                      ? `₹${form.rupeeReward} credited for every unit sold beyond the target`
                      : `₹${form.rupeeReward} credited once when target is achieved`
                    }
                  </p>
                )}
              </div>

              {dfField("deadline","Deadline (optional)")}

              <div style={{ padding:"10px 14px", background:"#faf5ff", border:"1px solid #e9d5ff", borderRadius:10, fontSize:12, color:"#6b21a8", display:"flex", alignItems:"center", gap:8 }}>
                <Stars style={{fontSize:16}}/>
                <span>
                  When achieved: <strong>{form.bonusPoints||"N"} bonus pts</strong> credited
                  {form.rupeeReward ? ` + ₹${form.rupeeReward} payout` : ""}. Over-completion is tracked and shown.
                </span>
              </div>
            </>
          )}
        </div>

        <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"flex-end" }}>
          <Btn ghost onClick={onClose}>Cancel</Btn>
          <Btn onClick={onSave} disabled={saving}><Save style={{fontSize:15}}/>{saving?"Saving…":"Save"}</Btn>
        </div>
      </div>
    </Backdrop>
  )
}

// ── Delete Confirm ──
function Confirm({ name, onClose, onConfirm, deleting }) {
  return (
    <Backdrop onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:18, padding:30, width:340, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", textAlign:"center" }}>
        <div style={{ width:52, height:52, borderRadius:"50%", background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
          <Delete style={{ color:"#dc2626", fontSize:24 }} />
        </div>
        <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:800, color:"#0f172a" }}>Delete Entry?</h3>
        <p style={{ margin:"0 0 22px", fontSize:13, color:"#64748b" }}>Remove <strong>{name}</strong>? This cannot be undone.</p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <Btn ghost onClick={onClose}>Cancel</Btn>
          <Btn danger onClick={onConfirm} disabled={deleting}>{deleting?"Deleting…":"Delete"}</Btn>
        </div>
      </div>
    </Backdrop>
  )
}

function Skeleton() {
  return (
    <div style={{ padding:"24px 16px" }}>
      {[1,2,3,4].map(i=>(
        <div key={i} style={{ height:44, background:"#f1f5f9", borderRadius:8, marginBottom:10, animation:"pulse 1.4s ease-in-out infinite", animationDelay:`${i*0.1}s` }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}

// ── Points Target Card (Admin view) ──
function PointsTargetCard({ row, onEdit, onDelete }) {
  const p = pct(row.achieved, row.target)
  const isAchieved = p >= 100
  const isOver = p > 100
  const overPct = isOver ? p - 100 : 0
  const overUnits = isOver ? Math.round(((p - 100) / 100) * row.target) : 0

  return (
    <div style={{ background:"#fff", border:`1.5px solid ${isAchieved?"#bbf7d0":"#e2e8f0"}`, borderRadius:16, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
      {isAchieved && (
        <div style={{ position:"absolute", top:0, right:0, background:isOver?"#d97706":"#16a34a", color:"#fff", fontSize:10, fontWeight:800, padding:"4px 12px", borderRadius:"0 14px 0 10px", letterSpacing:"0.06em" }}>
          {isOver ? `🔥 +${overPct}% OVER` : "🏆 ACHIEVED"}
        </div>
      )}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"#faf5ff", border:"1.5px solid #e9d5ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {row.linkedProductName ? <Inventory2 style={{ fontSize:16, color:"#7c3aed" }} /> : <Stars style={{ fontSize:16, color:"#7c3aed" }} />}
            </div>
            <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.name}</p>
          </div>
          {row.linkedProductName && (
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
              <Inventory2 style={{ fontSize:11, color:"#7c3aed" }} />
              <p style={{ margin:0, fontSize:11, color:"#7c3aed", fontWeight:600 }}>{row.linkedProductName}</p>
              {row.pointsPerUnit && <span style={{ fontSize:10, color:"#94a3b8" }}>· {row.pointsPerUnit} pts/unit</span>}
            </div>
          )}
          {row.description && <p style={{ margin:"0 0 4px", fontSize:12, color:"#64748b" }}>{row.description}</p>}
          {row.deadline && <p style={{ margin:0, fontSize:11, color:"#94a3b8" }}>Deadline: {new Date(row.deadline).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>}
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <button onClick={()=>onEdit(row)} style={{ padding:"5px 10px", border:"1.5px solid #dbeafe", borderRadius:8, background:"#eff6ff", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#1d4ed8" }}>
            <Edit style={{fontSize:13}}/> Edit
          </button>
          <button onClick={()=>onDelete(row)} style={{ padding:"5px 8px", border:"1.5px solid #fecaca", borderRadius:8, background:"#fff5f5", cursor:"pointer", display:"flex", alignItems:"center", color:"#dc2626" }}>
            <Delete style={{fontSize:13}}/>
          </button>
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
        <div style={{ flex:1 }}><ProgressBar a={row.achieved} t={row.target} color={clr(p)} /></div>
        <span style={{ fontSize:20, fontWeight:900, color:clr(p), minWidth:52, textAlign:"right" }}>{p}%</span>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
        <div style={{ display:"flex", gap:14 }}>
          <span style={{ fontSize:12, color:"#64748b" }}>Target: <strong style={{color:"#0f172a"}}>{(row.target||0).toLocaleString()} {row.linkedProductName?"units":"pts"}</strong></span>
          <span style={{ fontSize:12, color:"#64748b" }}>Achieved: <strong style={{color:clr(p)}}>{(row.achieved||0).toLocaleString()} {row.linkedProductName?"units":"pts"}</strong></span>
          {isOver && <span style={{ fontSize:12, color:"#d97706", fontWeight:700 }}>+{overUnits} extra units</span>}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {row.bonusPoints > 0 && (
            <div style={{ padding:"3px 10px", background:isAchieved?"#dcfce7":"#faf5ff", border:`1px solid ${isAchieved?"#86efac":"#e9d5ff"}`, borderRadius:99, fontSize:11, fontWeight:700, color:isAchieved?"#15803d":"#7c3aed" }}>
              {isAchieved ? "✓" : "🎁"} +{row.bonusPoints} pts
            </div>
          )}
          {row.rupeeReward > 0 && (
            <div style={{ padding:"3px 10px", background:isAchieved?"#fffbeb":"#fff", border:`1px solid ${isAchieved?"#fde68a":"#e2e8f0"}`, borderRadius:99, fontSize:11, fontWeight:700, color:isAchieved?"#d97706":"#94a3b8" }}>
              <MonetizationOn style={{fontSize:12, verticalAlign:"middle"}}/> ₹{row.rupeeReward}
              {row.rupeeRewardType==="per_unit_over" ? "/extra" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Multi-Agent Picker ──
function AgentPicker({ agents, loadingAgents, onSelect, onSelectMultiple }) {
  const [search, setSearch]     = useState("")
  const [checked, setChecked]   = useState(new Set())
  const [mode, setMode]         = useState("single") // "single" | "multi"

  const filtered = agents.filter(a =>
    !search.trim() ||
    (a.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (a.assignedArea||"").toLowerCase().includes(search.toLowerCase()) ||
    (a.phone||"").includes(search)
  )

  const toggleAll = () => {
    if (checked.size === filtered.length) setChecked(new Set())
    else setChecked(new Set(filtered.map(a => a._id)))
  }

  const toggleOne = (id) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id); else next.add(id)
    setChecked(next)
  }

  const allChecked   = filtered.length > 0 && checked.size === filtered.length
  const someChecked  = checked.size > 0 && !allChecked
  const selectedList = agents.filter(a => checked.has(a._id))

  return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 16px" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"#eff6ff", border:"2px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <Person style={{ fontSize:32, color:"#1d4ed8" }} />
        </div>
        <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:"#0f172a" }}>Select Agent(s)</h2>
        <p style={{ margin:"8px 0 0", fontSize:14, color:"#64748b" }}>Choose one agent, multiple, or all agents</p>
      </div>

      {loadingAgents ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, color:"#64748b" }}>
          <div style={{ width:20, height:20, border:"2.5px solid #1d4ed8", borderTop:"2.5px solid transparent", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
          Loading agents…
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ width:"100%", maxWidth:600 }}>
          {/* Mode toggle */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {[["single","Single Agent"],["multi","Multi-Select"]].map(([k,l])=>(
              <button key={k} onClick={()=>{ setMode(k); setChecked(new Set()) }} style={{
                padding:"7px 16px", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
                background: mode===k?"#1d4ed8":"#f1f5f9", color: mode===k?"#fff":"#475569",
              }}>{l}</button>
            ))}
          </div>

          {/* All Agents */}
          <div onClick={()=>onSelect(ALL_AGENTS_OBJ)}
            style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", background:"linear-gradient(135deg,#1e1b4b,#312e81)", border:"none", borderRadius:14, cursor:"pointer", marginBottom:12 }}
            onMouseEnter={e=>{ e.currentTarget.style.opacity="0.9" }}
            onMouseLeave={e=>{ e.currentTarget.style.opacity="1" }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,0.15)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Group style={{fontSize:20}}/>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#fff" }}>All Agents</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#a5b4fc" }}>Set global targets for all agents simultaneously</p>
            </div>
            <div style={{ fontSize:12, color:"#a5b4fc", fontWeight:700 }}>Select →</div>
          </div>

          <div style={{ position:"relative", marginBottom:10 }}>
            <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#94a3b8" }} />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name, area, phone…"
              style={{ width:"100%", padding:"10px 12px 10px 36px", border:"1.5px solid #e2e8f0", borderRadius:12, fontSize:13, background:"#f8fafc", outline:"none", boxSizing:"border-box" }} />
          </div>

          {/* Multi-select toolbar */}
          {mode==="multi" && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"#f8fafc", borderRadius:10, marginBottom:8, border:"1px solid #e2e8f0" }}>
              <button onClick={toggleAll} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:"#1d4ed8" }}>
                {allChecked ? <CheckBox style={{fontSize:18, color:"#1d4ed8"}}/>
                  : someChecked ? <IndeterminateCheckBox style={{fontSize:18, color:"#1d4ed8"}}/>
                  : <CheckBoxOutlineBlank style={{fontSize:18, color:"#94a3b8"}}/>}
                {allChecked ? "Deselect All" : `Select All (${filtered.length})`}
              </button>
              {checked.size > 0 && (
                <>
                  <span style={{ fontSize:12, color:"#64748b", marginLeft:"auto" }}>{checked.size} selected</span>
                  <button onClick={()=>onSelectMultiple(selectedList)} style={{ padding:"6px 14px", border:"none", borderRadius:8, background:"#1d4ed8", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    Set Targets for {checked.size} →
                  </button>
                </>
              )}
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:360, overflowY:"auto" }}>
            {filtered.length === 0 && <p style={{ textAlign:"center", color:"#94a3b8", padding:24, fontSize:13 }}>No agents found.</p>}
            {filtered.map(agent => {
              const initial = (agent.name||"?")[0].toUpperCase()
              const isChecked = checked.has(agent._id)
              return (
                <div key={agent._id}
                  onClick={()=> mode==="multi" ? toggleOne(agent._id) : onSelect(agent)}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", background: isChecked?"#eff6ff":"#fff", border:`1.5px solid ${isChecked?"#93c5fd":"#e2e8f0"}`, borderRadius:14, cursor:"pointer", transition:"all .15s" }}
                  onMouseEnter={e=>{ if(!isChecked){e.currentTarget.style.border="1.5px solid #93c5fd"; e.currentTarget.style.background="#f0f9ff"} }}
                  onMouseLeave={e=>{ if(!isChecked){e.currentTarget.style.border="1.5px solid #e2e8f0"; e.currentTarget.style.background="#fff"} }}>
                  {mode==="multi" && (
                    <div style={{ flexShrink:0 }}>
                      {isChecked ? <CheckBox style={{fontSize:20, color:"#1d4ed8"}}/> : <CheckBoxOutlineBlank style={{fontSize:20, color:"#cbd5e1"}}/>}
                    </div>
                  )}
                  <div style={{ width:40, height:40, borderRadius:"50%", background:"#1d4ed8", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, flexShrink:0 }}>{initial}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#0f172a" }}>{agent.name}</p>
                    <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>
                      {agent.assignedArea||agent.area||"No area"}{agent.phone?` · ${agent.phone}`:""}
                    </p>
                  </div>
                  {mode==="single" && <div style={{ fontSize:12, color:"#1d4ed8", fontWeight:700 }}>Select →</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN ──
export default function AdminTargetManagement() {
  const [agents,        setAgents]        = useState([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [multiAgents,   setMultiAgents]   = useState([]) // for multi-select mode

  const [products,   setProducts]   = useState([])
  const [areas,      setAreas]      = useState([])
  const [monthly,    setMonthly]    = useState([])
  const [points,     setPoints]     = useState([])
  const [allOptions, setAllOptions] = useState({ segments:[], regions:[], months:[], years:[] })

  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [apiErr,   setApiErr]   = useState(null)

  const [tab,    setTab]    = useState("product")
  const [view,   setView]   = useState("table")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  const [modal,  setModal]  = useState(null)
  const [editId, setEditId] = useState(null)
  const [form,   setForm]   = useState({})
  const [errors, setErrors] = useState({})
  const [delRow, setDelRow] = useState(null)
  const [toast,  setToast]  = useState(null)

  const data    = tab==="product" ? products : tab==="area" ? areas : tab==="points" ? points : monthly
  const setData = tab==="product" ? setProducts : tab==="area" ? setAreas : tab==="points" ? setPoints : setMonthly
  const nk = NK(tab); const sk = SK(tab)

  const fire = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),2600) }

  useEffect(() => {
    apiFetch("/api/admin/marketing-agents")
      .then(d => setAgents(Array.isArray(d) ? d : (d.agents||d.data||[])))
      .catch(()=>setAgents([]))
      .finally(()=>setLoadingAgents(false))
  }, [])

  useEffect(() => {
    apiFetch("/api/targets/options/all").then(d=>setAllOptions(d)).catch(()=>{})
  }, [])

  const fetchTargets = async (type, agentId) => {
    if (!agentId) return
    try {
      setLoading(true); setApiErr(null)
      const rows = await apiFetch(`/api/targets?type=${type}&agentId=${agentId}`)
      const formatted = (Array.isArray(rows) ? rows : (rows.targets||[])).map(norm)
      if (type==="product")      setProducts(formatted)
      else if (type==="area")    setAreas(formatted)
      else if (type==="points")  setPoints(formatted)
      else                       setMonthly(formatted)
    } catch(err) { setApiErr("Could not load data. " + err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (selectedAgent) fetchTargets(tab, selectedAgent._id) }, [tab, selectedAgent])

  const totTarget   = data.reduce((s,r)=>s+(r.target||0),0)
  const totAchieved = data.reduce((s,r)=>s+(r.achieved||0),0)
  const ovPct       = pct(totAchieved, totTarget)
  const shortfall   = Math.max(0, totTarget - totAchieved)
  const overItems   = data.filter(r => pct(r.achieved, r.target) > 100)

  const filtered = data.filter(r => {
    const q  = (r[nk]||"").toLowerCase().includes(search.toLowerCase())
    const p  = pct(r.achieved, r.target)
    const st = status==="all"?true:status==="achieved"?p>=100:status==="ontrack"?p>=70&&p<100:status==="atrisk"?p>=40&&p<70:p<40
    return q&&st
  })

  const validate = () => {
    const e = {}
    if (tab==="product") {
      if (!form.product_name?.trim()) e.product_name="Please select a product from the catalogue"
      if (!form.segment?.trim())      e.segment="Segment is required"
    } else if (tab==="area") {
      if (!form.area_name?.trim())    e.area_name="Area name is required"
      if (!form.region?.trim())       e.region="Region is required"
    } else if (tab==="points") {
      if (!form.name?.trim())         e.name="Target name is required"
      if (!form.target||Number(form.target)<=0) e.target="Enter a valid target (> 0)"
    } else {
      if (!form.month_name?.trim())   e.month_name="Month is required"
      if (!form.year?.trim())         e.year="Year is required"
    }
    if (tab!=="points" && (!form.target||Number(form.target)<=0)) e.target="Enter a valid target (> 0)"
    if (tab!=="product" && tab!=="points") {
      if (form.achieved===""||form.achieved===undefined||Number(form.achieved)<0)
        e.achieved="Enter valid achieved units (≥ 0)"
    }
    setErrors(e); return Object.keys(e).length===0
  }

  const openAdd  = () => {
    setForm({ target:"", achieved:"", bonusPoints:"", name:"", description:"", deadline:"",
      linkedProductName:"", linkedProductId:"", linkedProductMrp:"",
      pointsPerUnit:"", rupeeReward:"", rupeeRewardType:"one_time" })
    setErrors({}); setModal("add")
  }
  const openEdit = (row) => {
    setForm({ ...row, target:String(row.target||""), achieved:String(row.achieved||""),
      bonusPoints:String(row.bonusPoints||""), rupeeReward:String(row.rupeeReward||""),
      pointsPerUnit:String(row.pointsPerUnit||""), rupeeRewardType:row.rupeeRewardType||"one_time" })
    setErrors({}); setEditId(row.id); setModal("edit")
  }

  // Save for single agent
  const handleSave = async () => {
    if (!validate()) return
    const agentIds = multiAgents.length > 0
      ? multiAgents.map(a => a._id)
      : [selectedAgent._id]

    const payload = {
      ...form,
      target:       Number(form.target),
      achieved:     (tab==="product"||tab==="points") ? undefined : Number(form.achieved),
      bonusPoints:  Number(form.bonusPoints||0),
      rupeeReward:  Number(form.rupeeReward||0),
      rupeeRewardType: form.rupeeRewardType||"one_time",
      pointsPerUnit: Number(form.pointsPerUnit||0),
      linkedProductId:   form.linkedProductId||undefined,
      linkedProductName: form.linkedProductName||undefined,
      linkedProductMrp:  form.linkedProductMrp||undefined,
    }

    try {
      setSaving(true)
      if (modal==="add") {
        if (agentIds.length > 1) {
          // bulk save for multi-agent
          await apiFetch("/api/targets/bulk", { method:"POST", body:JSON.stringify({ agentIds, type:tab, ...payload }) })
          fire(`Target added for ${agentIds.length} agents`)
        } else {
          const created = await apiFetch("/api/targets", { method:"POST", body:JSON.stringify({...payload, agentId:agentIds[0], type:tab}) })
          setData(prev=>[norm(created),...prev])
          fire("Entry added successfully")
        }
      } else {
        const updated = await apiFetch(`/api/targets/${editId}`, { method:"PUT", body:JSON.stringify({...payload, agentId:selectedAgent._id}) })
        setData(prev=>prev.map(r=>r.id===editId?norm(updated):r))
        fire("Entry updated successfully")
      }
      setModal(null)
    } catch(err) { fire("Save failed — "+err.message, "del") }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await apiFetch(`/api/targets/${delRow.id}`, { method:"DELETE" })
      setData(prev=>prev.filter(r=>r.id!==delRow.id))
      fire("Entry deleted", "del")
    } catch(err) { fire("Delete failed", "del") }
    finally { setDeleting(false); setDelRow(null) }
  }

  const switchTab = (t) => { setTab(t); setSearch(""); setStatus("all") }

  const chartData = tab!=="points" ? filtered.map(r=>({
    name:(r[nk]||"").length>11?(r[nk]||"").slice(0,11)+"…":(r[nk]||""),
    Target:r.target, Achieved:r.achieved, _pct:pct(r.achieved,r.target),
  })) : []

  const fTotT = filtered.reduce((s,r)=>s+(r.target||0),0)
  const fTotA = filtered.reduce((s,r)=>s+(r.achieved||0),0)
  const fAvg  = filtered.length ? Math.round(filtered.reduce((s,r)=>s+pct(r.achieved,r.target),0)/filtered.length) : 0

  const displayName = selectedAgent
    ? (multiAgents.length > 1 ? `${multiAgents.length} Agents` : selectedAgent.isAll ? "All Agents" : selectedAgent.name)
    : ""

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"11px 28px", display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:13, color:"#94a3b8" }}>Marketing Zone</span>
        <span style={{ color:"#cbd5e1" }}>/</span>
        <span style={{ fontSize:13, fontWeight:700, color:"#1d4ed8" }}>Target Management</span>
        {selectedAgent && (<><span style={{ color:"#cbd5e1" }}>/</span>
          <span style={{ fontSize:13, fontWeight:700, color:"#7c3aed" }}>{displayName}</span></>)}
      </div>

      <div style={{ padding:"24px 28px", maxWidth:1180, margin:"0 auto" }}>
        <div style={{ marginBottom:22, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:"#0f172a" }}>Target Management</h1>
            <p style={{ margin:"4px 0 0", fontSize:14, color:"#64748b" }}>
              {selectedAgent ? `Managing targets for ${displayName}` : "Select agent(s) to manage their targets"}
            </p>
          </div>
          {selectedAgent && (
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", background:"#f5f3ff", border:"1.5px solid #ddd6fe", borderRadius:12 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background:"#7c3aed", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800 }}>
                  {multiAgents.length > 1 ? multiAgents.length : selectedAgent.isAll ? <Group style={{fontSize:16}}/> : (selectedAgent.name||"?")[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#6d28d9" }}>{displayName}</p>
                  <p style={{ margin:0, fontSize:11, color:"#64748b" }}>{selectedAgent.isAll?"Global Targets":multiAgents.length>1?"Multiple Agents":selectedAgent.assignedArea||"No area"}</p>
                </div>
              </div>
              <Btn ghost small onClick={()=>{ setSelectedAgent(null); setMultiAgents([]); setProducts([]); setAreas([]); setMonthly([]); setPoints([]) }}>
                <ArrowBack style={{fontSize:14}}/> Change
              </Btn>
              <button onClick={()=>fetchTargets(tab,selectedAgent._id)} style={{ padding:"7px 10px", border:"1.5px solid #e2e8f0", borderRadius:9, background:"#f8fafc", cursor:"pointer" }}>
                <Refresh style={{ fontSize:16, color:"#64748b" }} />
              </button>
            </div>
          )}
        </div>

        {!selectedAgent && (
          <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, overflow:"hidden" }}>
            <AgentPicker
              agents={agents}
              loadingAgents={loadingAgents}
              onSelect={agent => { setSelectedAgent(agent); setMultiAgents([]) }}
              onSelectMultiple={agentList => {
                // For multi: use first agent as "primary" to view but track all
                setSelectedAgent(agentList[0])
                setMultiAgents(agentList)
              }}
            />
          </div>
        )}

        {selectedAgent && (
          <>
            {apiErr && (
              <div style={{ marginBottom:18, padding:"12px 18px", borderRadius:12, background:"#fee2e2", border:"1.5px solid #fca5a5", fontSize:13, color:"#991b1b", display:"flex", alignItems:"center", gap:10 }}>
                <span>⚠</span> {apiErr}
                <button onClick={()=>fetchTargets(tab,selectedAgent._id)} style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:7, border:"none", background:"#dc2626", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Retry</button>
              </div>
            )}

            {selectedAgent.isAll && (
              <div style={{ marginBottom:18, padding:"12px 18px", borderRadius:12, background:"#f5f3ff", border:"1.5px solid #ddd6fe", fontSize:13, color:"#5b21b6", display:"flex", alignItems:"center", gap:10 }}>
                <Group style={{fontSize:18}}/>
                <span>You are setting <strong>global targets</strong> visible to all agents.</span>
              </div>
            )}

            {multiAgents.length > 1 && (
              <div style={{ marginBottom:18, padding:"12px 18px", borderRadius:12, background:"#eff6ff", border:"1.5px solid #bfdbfe", fontSize:13, color:"#1d4ed8", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <Group style={{fontSize:18}}/>
                <span><strong>{multiAgents.length} agents selected.</strong> New targets will be assigned to all of them simultaneously.</span>
                <div style={{ display:"flex", gap:6, marginLeft:8, flexWrap:"wrap" }}>
                  {multiAgents.slice(0,5).map(a=>(
                    <span key={a._id} style={{ fontSize:11, background:"#dbeafe", color:"#1d4ed8", borderRadius:99, padding:"2px 8px", fontWeight:700 }}>{a.name}</span>
                  ))}
                  {multiAgents.length > 5 && <span style={{ fontSize:11, color:"#64748b" }}>+{multiAgents.length-5} more</span>}
                </div>
              </div>
            )}

            {/* Stat cards */}
            <div style={{ display:"flex", gap:14, marginBottom:20, flexWrap:"wrap" }}>
              <StatCard label="Overall Achievement" value={`${ovPct}%`}                  color="#1d4ed8" icon={<TrackChanges />} />
              <StatCard label="Total Target"         value={totTarget.toLocaleString()}   color="#d97706" icon={<TrendingUp />}  sub={tab==="points"?"pts/units":"units"} />
              <StatCard label="Total Achieved"       value={totAchieved.toLocaleString()} color="#16a34a" icon={<CheckCircle />} sub={tab==="points"?"pts/units":"units"} />
              <StatCard label="Shortfall"            value={shortfall.toLocaleString()}   color="#dc2626" icon={<EmojiEvents />} sub="remaining" />
              {overItems.length > 0 && (
                <StatCard label="Over-Achievers" value={overItems.length} color="#d97706" icon={<TrendingUp />} sub={`targets exceeded`} />
              )}
            </div>

            {/* Over-completion banner */}
            {overItems.length > 0 && (
              <div style={{ marginBottom:18, padding:"12px 18px", borderRadius:12, background:"#fffbeb", border:"1.5px solid #fde68a", fontSize:13, color:"#92400e" }}>
                🔥 <strong>{overItems.length} target{overItems.length>1?"s":""} exceeded!</strong>
                {" "}{overItems.map(r=>r[nk]).join(", ")} — consider increasing future targets.
              </div>
            )}

            {data.length > 0 && tab!=="points" && (
              <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"18px 22px", marginBottom:22 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#0f172a" }}>
                      {tab==="product"?"Product Portfolio":tab==="area"?"Area Coverage":"Monthly"} — Overall Progress
                    </p>
                    <p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>{totAchieved.toLocaleString()} / {totTarget.toLocaleString()} units</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <Badge p={ovPct} /><OverBadge p={ovPct} />
                    <span style={{ fontSize:28, fontWeight:900, color:clr(ovPct) }}>{ovPct}%</span>
                  </div>
                </div>
                <ProgressBar a={totAchieved} t={totTarget} color={clr(ovPct)} height={10} />
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>Achieved: {totAchieved.toLocaleString()}</span>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>Target: {totTarget.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, overflow:"visible" }}>
              {/* Tabs */}
              <div style={{ display:"flex", borderBottom:"1.5px solid #e2e8f0", padding:"0 14px", flexWrap:"wrap", alignItems:"center" }}>
                {[
                  {key:"product",label:"Product Targets"},
                  {key:"area",   label:"Area Targets"},
                  {key:"monthly",label:"Monthly Targets"},
                  {key:"points", label:"Points Targets", icon:<Stars style={{fontSize:14,marginRight:4}}/>},
                ].map(t=>(
                  <button key={t.key} onClick={()=>switchTab(t.key)} style={{
                    padding:"14px 16px", border:"none", background:"none", cursor:"pointer", fontSize:13,
                    fontWeight:tab===t.key?800:500,
                    color:tab===t.key?(t.key==="points"?"#7c3aed":"#1d4ed8"):"#64748b",
                    borderBottom:tab===t.key?`2.5px solid ${t.key==="points"?"#7c3aed":"#1d4ed8"}`:"2.5px solid transparent",
                    transition:"all .15s", display:"flex", alignItems:"center",
                  }}>
                    {t.icon||null}{t.label}
                    {t.key==="points" && points.length>0 && (
                      <span style={{ marginLeft:6, background:"#7c3aed", color:"#fff", borderRadius:99, fontSize:10, fontWeight:800, padding:"1px 6px" }}>{points.length}</span>
                    )}
                  </button>
                ))}
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, padding:"8px 0" }}>
                  {tab!=="points" && (
                    <button onClick={()=>setView(v=>v==="table"?"chart":"table")} style={{ padding:"7px 14px", border:"1.5px solid #e2e8f0", borderRadius:9, background:"#f8fafc", cursor:"pointer", fontSize:12, fontWeight:600, color:"#475569", display:"flex", alignItems:"center", gap:5 }}>
                      {view==="table"?<><BarChartIcon style={{fontSize:15}}/> Chart</>:<><TableChart style={{fontSize:15}}/> Table</>}
                    </button>
                  )}
                  <button onClick={openAdd} style={{ padding:"7px 16px", border:"none", borderRadius:9, background:tab==="points"?"#7c3aed":"#1d4ed8", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                    <Add style={{fontSize:16}}/> Add Entry{multiAgents.length>1?` (${multiAgents.length} agents)`:""}
                  </button>
                </div>
              </div>

              {/* Info bars */}
              {tab==="product" && (
                <div style={{ padding:"8px 16px", background:"#f0fdf4", borderBottom:"1px solid #bbf7d0", fontSize:12, color:"#166534" }}>
                  ✓ Product achieved counts are auto-tracked from agent's billing orders. Over-completion is tracked.
                </div>
              )}
              {tab==="points" && (
                <div style={{ padding:"8px 16px", background:"#faf5ff", borderBottom:"1px solid #e9d5ff", fontSize:12, color:"#6b21a8", display:"flex", alignItems:"center", gap:6 }}>
                  <Stars style={{fontSize:15}}/>
                  <span>Link real products to auto-track via billing. Set rupee payouts + bonus points on achievement. Over-completion shown as percentage.</span>
                </div>
              )}

              {/* Search/filter */}
              <div style={{ padding:"11px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ position:"relative", flex:1, minWidth:180 }}>
                  <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#94a3b8" }} />
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search…"
                    style={{ width:"100%", padding:"8px 12px 8px 33px", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, background:"#f8fafc", outline:"none", boxSizing:"border-box" }} />
                </div>
                <select value={status} onChange={e=>setStatus(e.target.value)} style={{ padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, background:"#f8fafc", color:"#475569", cursor:"pointer" }}>
                  <option value="all">All Status</option>
                  <option value="achieved">Achieved (100%+)</option>
                  <option value="ontrack">On Track (70–99%)</option>
                  <option value="atrisk">At Risk (40–69%)</option>
                  <option value="critical">Critical (&lt;40%)</option>
                </select>
                <span style={{ fontSize:12, color:"#94a3b8" }}>{filtered.length} result{filtered.length!==1?"s":""}</span>
              </div>

              {loading && <Skeleton />}

              {/* Points grid */}
              {!loading && tab==="points" && (
                <div style={{ padding:"18px 20px" }}>
                  {filtered.length===0 ? (
                    <div style={{ textAlign:"center", padding:"40px 20px" }}>
                      <Stars style={{ fontSize:40, color:"#e2e8f0" }}/>
                      <p style={{ margin:"12px 0 0", fontSize:15, fontWeight:700, color:"#475569" }}>No points targets yet</p>
                      <p style={{ margin:"6px 0 0", fontSize:13, color:"#94a3b8" }}>Click "Add Entry" to create a points milestone. You can link real products for auto-tracking!</p>
                    </div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:14 }}>
                      {filtered.map(row=>(
                        <PointsTargetCard key={row.id} row={row} onEdit={openEdit} onDelete={setDelRow} />
                      ))}
                    </div>
                  )}
                  {filtered.length>0 && (
                    <div style={{ marginTop:16, padding:"10px 0", borderTop:"1px solid #f1f5f9", display:"flex", gap:22, fontSize:12, flexWrap:"wrap" }}>
                      <span style={{color:"#64748b"}}>Total Target: <strong style={{color:"#0f172a"}}>{fTotT.toLocaleString()}</strong></span>
                      <span style={{color:"#64748b"}}>Total Achieved: <strong style={{color:"#7c3aed"}}>{fTotA.toLocaleString()}</strong></span>
                      <span style={{color:"#64748b"}}>Avg: <strong style={{color:"#7c3aed"}}>{fAvg}%</strong></span>
                      <span style={{color:"#64748b"}}>Bonus Unlocked: <strong style={{color:"#16a34a"}}>{filtered.filter(r=>pct(r.achieved,r.target)>=100).reduce((s,r)=>s+(r.bonusPoints||0),0)} pts</strong></span>
                      <span style={{color:"#64748b"}}>₹ Payouts: <strong style={{color:"#d97706"}}>₹{filtered.filter(r=>pct(r.achieved,r.target)>=100&&r.rupeeReward>0).reduce((s,r)=>s+(r.rupeeReward||0),0)}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* Table view */}
              {!loading && view==="table" && tab!=="points" && (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"#f8fafc" }}>
                        {[tab==="product"?"Product":tab==="area"?"Area":"Month",
                          tab==="product"?"Segment":tab==="area"?"Region":"Year",
                          "Target","Achieved","Progress","Status","Actions"].map(h=>(
                          <th key={h} style={{ padding:"10px 14px", fontWeight:700, fontSize:11, color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:"1.5px solid #e2e8f0", whiteSpace:"nowrap", textAlign:["Target","Achieved"].includes(h)?"right":["Status","Actions"].includes(h)?"center":"left" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length===0 && (
                        <tr><td colSpan={7} style={{ textAlign:"center", padding:"40px", color:"#94a3b8", fontSize:13 }}>No results.</td></tr>
                      )}
                      {filtered.map((row,i)=>{
                        const p=pct(row.achieved,row.target)
                        const isOver = p > 100
                        return (
                          <tr key={row.id} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"#fff":"#fafafa" }}
                            onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"}
                            onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafafa"}>
                            <td style={{ padding:"11px 14px", fontWeight:600, color:"#0f172a", whiteSpace:"nowrap" }}>
                              {row[nk]}
                              {tab==="product" && row.genericName && (
                                <p style={{ margin:"2px 0 0", fontSize:11, color:"#94a3b8", fontWeight:400 }}>{row.genericName}</p>
                              )}
                            </td>
                            <td style={{ padding:"11px 14px", color:"#64748b" }}>{row[sk]||"—"}</td>
                            <td style={{ padding:"11px 14px", textAlign:"right", fontWeight:600 }}>{(row.target||0).toLocaleString()}</td>
                            <td style={{ padding:"11px 14px", textAlign:"right", fontWeight:700, color:clr(p) }}>
                              {(row.achieved||0).toLocaleString()}
                              {tab==="product" && <p style={{ margin:"2px 0 0", fontSize:10, color:"#94a3b8", fontWeight:400 }}>orders</p>}
                              {isOver && <p style={{ margin:"2px 0 0", fontSize:10, color:"#d97706", fontWeight:700 }}>+{p-100}% over</p>}
                            </td>
                            <td style={{ padding:"11px 14px", minWidth:160 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ flex:1 }}><ProgressBar a={row.achieved} t={row.target} color={clr(p)} /></div>
                                <span style={{ fontSize:12, fontWeight:700, color:clr(p), minWidth:36, textAlign:"right" }}>{p}%</span>
                              </div>
                            </td>
                            <td style={{ padding:"11px 14px", textAlign:"center" }}>
                              <div style={{ display:"flex", gap:4, justifyContent:"center", alignItems:"center" }}>
                                <Badge p={p} />
                                {isOver && <OverBadge p={p} />}
                              </div>
                            </td>
                            <td style={{ padding:"11px 14px", textAlign:"center" }}>
                              <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                                <button onClick={()=>openEdit(row)} style={{ padding:"5px 12px", border:"1.5px solid #dbeafe", borderRadius:8, background:"#eff6ff", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600, color:"#1d4ed8" }}>
                                  <Edit style={{fontSize:13}}/> Edit
                                </button>
                                <button onClick={()=>setDelRow(row)} style={{ padding:"5px 10px", border:"1.5px solid #fecaca", borderRadius:8, background:"#fff5f5", cursor:"pointer", display:"flex", alignItems:"center", color:"#dc2626" }}>
                                  <Delete style={{fontSize:14}}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Chart view */}
              {!loading && view==="chart" && tab!=="points" && (
                <div style={{ padding:"18px 20px" }}>
                  {filtered.length===0
                    ? <p style={{ textAlign:"center", color:"#94a3b8", padding:40 }}>No data to chart.</p>
                    : <>
                      <p style={{ margin:"0 0 18px", fontSize:13, fontWeight:700, color:"#0f172a" }}>Target vs Achievement — {displayName}</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{top:4,right:16,left:0,bottom:4}} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                          <XAxis dataKey="name" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                          <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12}} formatter={(v,n)=>[v.toLocaleString()+" units",n]}/>
                          <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:12}}/>
                          <Bar dataKey="Target" fill="#cbd5e1" radius={[5,5,0,0]}/>
                          <Bar dataKey="Achieved" radius={[5,5,0,0]}>{chartData.map((d,i)=><Cell key={i} fill={clr(d._pct)}/>)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginTop:20 }}>
                        {filtered.map(row=>{
                          const p=pct(row.achieved,row.target)
                          return (
                            <div key={row.id} style={{ background:"#f8fafc", border:`1.5px solid ${p>100?"#fde68a":"#e2e8f0"}`, borderRadius:12, padding:"12px 14px" }}>
                              <p style={{ margin:"0 0 3px", fontSize:11, fontWeight:700, color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row[nk]}</p>
                              <p style={{ margin:"0 0 2px", fontSize:22, fontWeight:900, color:clr(p) }}>{p}%</p>
                              {p > 100 && <p style={{ margin:"0 0 4px", fontSize:10, color:"#d97706", fontWeight:700 }}>+{p-100}% over target</p>}
                              <ProgressBar a={row.achieved} t={row.target} color={clr(p)}/>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  }
                </div>
              )}

              {!loading && filtered.length>0 && view==="table" && tab!=="points" && (
                <div style={{ padding:"10px 20px", borderTop:"1px solid #f1f5f9", display:"flex", gap:22, background:"#f8fafc", fontSize:12, flexWrap:"wrap" }}>
                  <span style={{color:"#64748b"}}>Showing <strong style={{color:"#0f172a"}}>{filtered.length}</strong> entries</span>
                  <span style={{color:"#64748b"}}>Total Target: <strong style={{color:"#0f172a"}}>{fTotT.toLocaleString()}</strong></span>
                  <span style={{color:"#64748b"}}>Total Achieved: <strong style={{color:"#16a34a"}}>{fTotA.toLocaleString()}</strong></span>
                  <span style={{color:"#64748b"}}>Avg Achievement: <strong style={{color:"#1d4ed8"}}>{fAvg}%</strong></span>
                </div>
              )}
            </div>

            <div style={{ marginTop:14, display:"flex", gap:16, flexWrap:"wrap" }}>
              {[["#16a34a","Achieved (≥100%)"],["#d97706","Over-achieved"],["#1d4ed8","On Track (70–99%)"],["#d97706","At Risk (40–69%)"],["#dc2626","Critical (<40%)"]].map(([c,l])=>(
                <span key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#64748b" }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:c, flexShrink:0 }}/>{l}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {modal && (
  <Modal tab={tab} mode={modal} form={form} setForm={setForm} errors={errors} saving={saving}
    onSave={handleSave} onClose={()=>{ if(!saving) setModal(null) }}
    allOptions={allOptions} setAllOptions={setAllOptions}
    productTargets={products}
    agentName={multiAgents.length>1?`${multiAgents.length} Agents`:selectedAgent?.isAll?"All Agents":selectedAgent?.name||"—"} />
)}
      {delRow && (
        <Confirm name={delRow[nk]} deleting={deleting}
          onClose={()=>{ if(!deleting) setDelRow(null) }}
          onConfirm={handleDelete} />
      )}
    </div>
  )
}