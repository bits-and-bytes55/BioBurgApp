import { useState, useEffect, useRef } from "react"
import {
  TrackChanges, TrendingUp, CheckCircle, EmojiEvents,
  Add, Edit, Delete, Close, Save, BarChart as BarChartIcon,
  TableChart, Search, ExpandMore, AddCircleOutline,
} from "@mui/icons-material"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"

//  env 
const API = import.meta.env.VITE_API_BASE_URL ?? ""

//  pure helpers 
const pct   = (a, t) => (!t ? 0 : Math.min(Math.round((a / t) * 100), 999))
const clr   = (p)    => p >= 100 ? "#16a34a" : p >= 70 ? "#1d4ed8" : p >= 40 ? "#d97706" : "#dc2626"
const bgClr = (p)    => p >= 100 ? "#dcfce7" : p >= 70 ? "#dbeafe" : p >= 40 ? "#fef3c7" : "#fee2e2"
const lbl   = (p)    => p >= 100 ? "Achieved" : p >= 70 ? "On Track" : p >= 40 ? "At Risk" : "Critical"
const NK    = (t)    => t === "product" ? "product_name" : t === "area" ? "area_name" : "month_name"
const SK    = (t)    => t === "product" ? "segment"      : t === "area" ? "region"    : "year"

// numeric-only keydown guard — allows backspace, arrows, decimal, etc.
const SKIP = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End",".",","]
const numGuard = (e) => { if (!/[0-9]/.test(e.key) && !SKIP.includes(e.key)) e.preventDefault() }
const txtGuard = (e) => { if (/[0-9]/.test(e.key)) e.preventDefault() }

// normalise mongo doc → local row (id guaranteed)
const norm = (doc) => ({ ...doc, id: doc._id ?? doc.id })

// api helpers 
const apiFetch = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return res.json()
}

// Toast 
function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      padding: "12px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700,
      color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      background: type === "del" ? "#dc2626" : "#16a34a",
      animation: "tin .22s ease",
    }}>
      {msg}
      <style>{`@keyframes tin{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}

// CustomSelect 
function CustomSelect({ optKey, allOptions, setAllOptions, value, onChange, placeholder, hasError }) {
  const [open,   setOpen]   = useState(false)
  const [newVal, setNewVal] = useState("")
  const [adding, setAdding] = useState(false)
  const ref  = useRef(null)
  const opts = allOptions[optKey] ?? []

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  const select = (v) => { onChange(v); setOpen(false) }

  const addNew = async () => {
    const v = newVal.trim()
    if (!v || adding) return
    const exists = opts.find(o => o.toLowerCase() === v.toLowerCase())
    if (exists) { select(exists); setNewVal(""); return }
    try {
      setAdding(true)
      await apiFetch(`/api/targets/options/${optKey}`, {
        method: "POST",
        body: JSON.stringify({ value: v }),
      })
      setAllOptions(prev => ({ ...prev, [optKey]: [...(prev[optKey] ?? []), v] }))
      select(v)
      setNewVal("")
    } catch (err) {
      console.error("addOption:", err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 10, textAlign: "left",
          border: `1.5px solid ${hasError ? "#fca5a5" : open ? "#1d4ed8" : "#e2e8f0"}`,
          background: "#f8fafc", fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          color: value ? "#0f172a" : "#94a3b8",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || placeholder}
        </span>
        <ExpandMore style={{
          fontSize: 17, color: "#94a3b8", flexShrink: 0,
          transform: open ? "rotate(180deg)" : "none", transition: "transform .15s",
        }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, zIndex: 1500,
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 13,
          boxShadow: "0 10px 38px rgba(0,0,0,0.14)", overflow: "hidden",
        }}>
          <div style={{ maxHeight: 198, overflowY: "auto" }}>
            {opts.length === 0 && (
              <p style={{ margin: 0, padding: "11px 14px", fontSize: 12, color: "#94a3b8" }}>
                No options yet — add one below.
              </p>
            )}
            {opts.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => select(opt)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "9px 15px", border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: value === opt ? 700 : 400,
                  background: value === opt ? "#eff6ff" : "#fff",
                  color:      value === opt ? "#1d4ed8" : "#0f172a",
                }}
                onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = "#f8fafc" }}
                onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = "#fff" }}
              >
                {opt}
              </button>
            ))}
          </div>
          <div style={{
            borderTop: "1px solid #f1f5f9", padding: "9px 10px",
            background: "#fafafa", display: "flex", gap: 7, alignItems: "center",
          }}>
            <AddCircleOutline style={{ fontSize: 16, color: "#94a3b8", flexShrink: 0 }} />
            <input
              value={newVal}
              onKeyDown={txtGuard}
              onChange={e => { if (!/[0-9]/.test(e.target.value)) setNewVal(e.target.value) }}
              onKeyUp={e => { if (e.key === "Enter") addNew() }}
              placeholder="Add custom option…"
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 12,
                border: "1.5px solid #e2e8f0", background: "#fff", outline: "none",
              }}
            />
            <button
              type="button"
              onClick={addNew}
              disabled={!newVal.trim() || adding}
              style={{
                padding: "7px 13px", border: "none", borderRadius: 8,
                fontSize: 12, fontWeight: 700,
                cursor: (newVal.trim() && !adding) ? "pointer" : "not-allowed",
                background: (newVal.trim() && !adding) ? "#1d4ed8" : "#e2e8f0",
                color:      (newVal.trim() && !adding) ? "#fff"    : "#94a3b8",
              }}
            >
              {adding ? "…" : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// micro components
const ProgressBar = ({ a, t, color }) => (
  <div style={{ background: "#f1f5f9", borderRadius: 99, height: 8, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min((!t ? 0 : (a / t)) * 100, 100)}%`,
      height: "100%", background: color, borderRadius: 99, transition: "width .5s ease",
    }} />
  </div>
)

const Badge = ({ p }) => (
  <span style={{
    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
    background: bgClr(p), color: clr(p), whiteSpace: "nowrap",
  }}>{lbl(p)}</span>
)

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      flex: 1, minWidth: 155, background: "#fff",
      border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "17px 20px",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: color + "18", color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
        <p style={{ margin: "3px 0 0", fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{sub}</p>}
      </div>
    </div>
  )
}

const Backdrop = ({ children, onClick }) => (
  <div onClick={onClick} style={{
    position: "fixed", inset: 0, background: "rgba(15,23,42,0.48)",
    zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  }}>{children}</div>
)
const Xbtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    background: "#f1f5f9", border: "none", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <Close style={{ fontSize: 17, color: "#64748b" }} />
  </button>
)
const Btn = ({ children, onClick, ghost, danger, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "9px 20px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, border: "none",
    opacity: disabled ? 0.6 : 1,
    background: ghost ? "#fff" : danger ? "#dc2626" : "#1d4ed8",
    color:      ghost ? "#475569" : "#fff",
    outline:    ghost ? "1.5px solid #e2e8f0" : "none",
  }}>{children}</button>
)
const Err  = ({ msg }) => <p style={{ margin: "4px 0 0", fontSize: 11, color: "#dc2626" }}>{msg}</p>
const LS   = { fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }
const IS   = {
  width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 13,
  border: "1.5px solid #e2e8f0", background: "#f8fafc", outline: "none", boxSizing: "border-box",
}

// Modal
function Modal({ tab, mode, form, setForm, errors, onSave, onClose, saving, allOptions, setAllOptions }) {
  const nf = (key, label, ph) => (
    <div>
      <label style={LS}>{label}</label>
      <input
        type="text" inputMode="numeric" value={form[key] ?? ""}
        onKeyDown={numGuard}
        onChange={e => { if (!/[^0-9]/.test(e.target.value)) setForm(p => ({ ...p, [key]: e.target.value })) }}
        placeholder={ph}
        style={{ ...IS, borderColor: errors[key] ? "#fca5a5" : "#e2e8f0" }}
      />
      {errors[key] && <Err msg={errors[key]} />}
    </div>
  )
  const tf = (key, label, ph) => (
    <div>
      <label style={LS}>{label}</label>
      <input
        type="text" value={form[key] ?? ""}
        onKeyDown={txtGuard}
        onChange={e => { if (!/[0-9]/.test(e.target.value)) setForm(p => ({ ...p, [key]: e.target.value })) }}
        placeholder={ph}
        style={{ ...IS, borderColor: errors[key] ? "#fca5a5" : "#e2e8f0" }}
      />
      {errors[key] && <Err msg={errors[key]} />}
    </div>
  )
  const sf = (key, label, optKey, ph) => (
    <div>
      <label style={LS}>{label}</label>
      <CustomSelect
        optKey={optKey} allOptions={allOptions} setAllOptions={setAllOptions}
        value={form[key] ?? ""} onChange={v => setForm(p => ({ ...p, [key]: v }))}
        placeholder={ph} hasError={!!errors[key]}
      />
      {errors[key] && <Err msg={errors[key]} />}
    </div>
  )

  return (
    <Backdrop onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, padding: 28,
        width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
            {mode === "add" ? "Add Entry" : "Edit Entry"} — {tab === "product" ? "Product" : tab === "area" ? "Area" : "Monthly"}
          </h2>
          <Xbtn onClick={onClose} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {tab === "product" && <>{tf("product_name","Product Name","e.g. Biocef 500mg")}{sf("segment","Segment","segments","Select or add segment…")}{nf("target","Monthly Target (units)","e.g. 200")}{nf("achieved","Achieved (units)","e.g. 178")}</>}
          {tab === "area"    && <>{tf("area_name","Area / Territory","e.g. Bandra")}{sf("region","Region","regions","Select or add region…")}{nf("target","Target (units)","e.g. 80")}{nf("achieved","Achieved (units)","e.g. 72")}</>}
          {tab === "monthly" && <>{sf("month_name","Month","months","Select or add month…")}{sf("year","Year","years","Select or add year…")}{nf("target","Monthly Target","e.g. 750")}{nf("achieved","Achieved","e.g. 620")}</>}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <Btn ghost onClick={onClose}>Cancel</Btn>
          <Btn onClick={onSave} disabled={saving}>
            <Save style={{ fontSize: 15 }} /> {saving ? "Saving…" : "Save"}
          </Btn>
        </div>
      </div>
    </Backdrop>
  )
}

// Delete confirm
function Confirm({ name, onClose, onConfirm, deleting }) {
  return (
    <Backdrop onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 18, padding: 30, width: 340,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", background: "#fee2e2",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
        }}>
          <Delete style={{ color: "#dc2626", fontSize: 24 }} />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Delete Entry?</h3>
        <p style={{ margin: "0 0 22px", fontSize: 13, color: "#64748b" }}>
          Remove <strong>{name}</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn ghost onClick={onClose}>Cancel</Btn>
          <Btn danger onClick={onConfirm} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</Btn>
        </div>
      </div>
    </Backdrop>
  )
}

// Loading skeleton
function Skeleton() {
  return (
    <div style={{ padding: "24px 16px" }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          height: 44, background: "#f1f5f9", borderRadius: 8, marginBottom: 10,
          animation: "pulse 1.4s ease-in-out infinite",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}

// Main Page 
export default function TargetManagement() {
  const [products, setProducts] = useState([])
  const [areas,    setAreas]    = useState([])
  const [monthly,  setMonthly]  = useState([])
  const [allOptions, setAllOptions] = useState({ segments:[], regions:[], months:[], years:[] })

  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [deleting,setDeleting]= useState(false)
  const [apiErr,  setApiErr]  = useState(null)

  const [tab,    setTab]    = useState("product")
  const [view,   setView]   = useState("table")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  const [modal,  setModal]  = useState(null)   // "add" | "edit" | null
  const [editId, setEditId] = useState(null)
  const [form,   setForm]   = useState({})
  const [errors, setErrors] = useState({})
  const [delRow, setDelRow] = useState(null)
  const [toast,  setToast]  = useState(null)

  const data    = tab === "product" ? products : tab === "area" ? areas : monthly
  const setData = tab === "product" ? setProducts : tab === "area" ? setAreas : setMonthly
  const nk = NK(tab)
  const sk = SK(tab)

  const fire = (msg, type = "ok") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }

  // fetch targets
  const fetchTargets = async (type) => {
    try {
      setLoading(true)
      setApiErr(null)
      const rows = await apiFetch(`/api/targets?type=${type}`)
      const formatted = rows.map(norm)
      if (type === "product") setProducts(formatted)
      else if (type === "area") setAreas(formatted)
      else setMonthly(formatted)
    } catch (err) {
      console.error("fetchTargets:", err)
      setApiErr("Could not load data. Check your API server is running.")
    } finally {
      setLoading(false)
    }
  }

  // fetch dropdown options
  const fetchOptions = async () => {
    try {
      const data = await apiFetch("/api/targets/options/all")
      setAllOptions(data)
    } catch (err) {
      console.error("fetchOptions:", err)
    }
  }

  useEffect(() => { fetchTargets(tab) }, [tab])
  useEffect(() => { fetchOptions() }, [])

  // totals
  const totTarget   = data.reduce((s, r) => s + (r.target   || 0), 0)
  const totAchieved = data.reduce((s, r) => s + (r.achieved || 0), 0)
  const ovPct       = pct(totAchieved, totTarget)
  const shortfall   = Math.max(0, totTarget - totAchieved)

  // filtering
  const filtered = data.filter(r => {
    const q  = (r[nk] || "").toLowerCase().includes(search.toLowerCase())
    const p  = pct(r.achieved, r.target)
    const st = status === "all"      ? true
             : status === "achieved" ? p >= 100
             : status === "ontrack"  ? p >= 70 && p < 100
             : status === "atrisk"   ? p >= 40 && p < 70
             : p < 40
    return q && st
  })

  // validation
  const validate = () => {
    const e = {}
    if (tab === "product") {
      if (!form.product_name?.trim()) e.product_name = "Product name is required"
      if (!form.segment?.trim())      e.segment       = "Segment is required"
    } else if (tab === "area") {
      if (!form.area_name?.trim())    e.area_name     = "Area name is required"
      if (!form.region?.trim())       e.region        = "Region is required"
    } else {
      if (!form.month_name?.trim())   e.month_name    = "Month is required"
      if (!form.year?.trim())         e.year          = "Year is required"
    }
    if (!form.target   || Number(form.target)   <= 0)  e.target   = "Enter a valid target (> 0)"
    if (form.achieved === "" || form.achieved === undefined || Number(form.achieved) < 0)
                                                        e.achieved = "Enter valid achieved units (≥ 0)"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // open add / edit
  const openAdd = () => {
    setForm({ target: "", achieved: "" })
    setErrors({})
    setModal("add")
  }

  const openEdit = (row) => {
    setForm({ ...row, target: String(row.target), achieved: String(row.achieved) })
    setErrors({})
    setEditId(row.id)
    setModal("edit")
  }

  // save 
  const handleSave = async () => {
    if (!validate()) return
    const payload = { ...form, target: Number(form.target), achieved: Number(form.achieved) }
    try {
      setSaving(true)
      if (modal === "add") {
        const created = await apiFetch("/api/targets", {
          method: "POST",
          body: JSON.stringify({ ...payload, type: tab }),
        })
        setData(prev => [norm(created), ...prev])
        fire("Entry added successfully")
      } else {
        const updated = await apiFetch(`/api/targets/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        setData(prev => prev.map(r => r.id === editId ? norm(updated) : r))
        fire("Entry updated successfully")
      }
      setModal(null)
    } catch (err) {
      console.error("handleSave:", err)
      fire("Save failed — check console", "del")
    } finally {
      setSaving(false)
    }
  }

  // delete
  const handleDelete = async () => {
    try {
      setDeleting(true)
      await apiFetch(`/api/targets/${delRow.id}`, { method: "DELETE" })
      setData(prev => prev.filter(r => r.id !== delRow.id))
      fire("Entry deleted", "del")
    } catch (err) {
      console.error("handleDelete:", err)
      fire("Delete failed — check console", "del")
    } finally {
      setDeleting(false)
      setDelRow(null)
    }
  }

  const switchTab = (t) => { setTab(t); setSearch(""); setStatus("all") }

  // chart data
  const chartData = filtered.map(r => ({
    name:     (r[nk] || "").length > 11 ? (r[nk] || "").slice(0, 11) + "…" : (r[nk] || ""),
    Target:   r.target,
    Achieved: r.achieved,
    _pct:     pct(r.achieved, r.target),
  }))

  const fTotT = filtered.reduce((s, r) => s + (r.target   || 0), 0)
  const fTotA = filtered.reduce((s, r) => s + (r.achieved || 0), 0)
  const fAvg  = filtered.length
    ? Math.round(filtered.reduce((s, r) => s + pct(r.achieved, r.target), 0) / filtered.length)
    : 0

  // render
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "11px 28px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>Targets & Incentives</span>
        <span style={{ color: "#cbd5e1" }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>Target Management</span>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1120, margin: "0 auto" }}>

        {/* page header */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" }}>Target Management</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Monthly targets vs achievement — {tab} view
          </p>
        </div>

        {/* api error banner */}
        {apiErr && (
          <div style={{
            marginBottom: 18, padding: "12px 18px", borderRadius: 12,
            background: "#fee2e2", border: "1.5px solid #fca5a5",
            fontSize: 13, color: "#991b1b", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>⚠</span> {apiErr}
            <button
              onClick={() => fetchTargets(tab)}
              style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 7, border: "none", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* stat cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <StatCard label="Overall Achievement" value={`${ovPct}%`}                  color="#1d4ed8" icon={<TrackChanges />} />
          <StatCard label="Total Target"         value={totTarget.toLocaleString()}   color="#d97706" icon={<TrendingUp />} sub="units" />
          <StatCard label="Total Achieved"       value={totAchieved.toLocaleString()} color="#16a34a" icon={<CheckCircle />} sub="units delivered" />
          <StatCard label="Shortfall"            value={shortfall.toLocaleString()}   color="#dc2626" icon={<EmojiEvents />} sub="units remaining" />
        </div>

        {/* overall progress banner */}
        {data.length > 0 && (
          <div style={{
            background: "#fff", border: "1.5px solid #e2e8f0",
            borderRadius: 16, padding: "18px 22px", marginBottom: 22,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {tab === "product" ? "Product Portfolio" : tab === "area" ? "Area Coverage" : "Monthly"} — Overall Progress
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  {totAchieved.toLocaleString()} / {totTarget.toLocaleString()} units
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Badge p={ovPct} />
                <span style={{ fontSize: 28, fontWeight: 900, color: clr(ovPct) }}>{ovPct}%</span>
              </div>
            </div>
            <ProgressBar a={totAchieved} t={totTarget} color={clr(ovPct)} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Achieved: {totAchieved.toLocaleString()}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Target: {totTarget.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* main card */}
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, overflow: "visible" }}>

          {/* tabs + actions */}
          <div style={{ display: "flex", borderBottom: "1.5px solid #e2e8f0", padding: "0 14px", flexWrap: "wrap", alignItems: "center" }}>
            {[
              { key: "product", label: "Product Targets" },
              { key: "area",    label: "Area Targets"    },
              { key: "monthly", label: "Monthly Targets" },
            ].map(t => (
              <button key={t.key} onClick={() => switchTab(t.key)} style={{
                padding: "14px 16px", border: "none", background: "none", cursor: "pointer",
                fontSize: 13, fontWeight: tab === t.key ? 800 : 500,
                color: tab === t.key ? "#1d4ed8" : "#64748b",
                borderBottom: tab === t.key ? "2.5px solid #1d4ed8" : "2.5px solid transparent",
                transition: "all .15s",
              }}>{t.label}</button>
            ))}

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
              <button
                onClick={() => setView(v => v === "table" ? "chart" : "table")}
                style={{
                  padding: "7px 14px", border: "1.5px solid #e2e8f0", borderRadius: 9,
                  background: "#f8fafc", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  color: "#475569", display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {view === "table"
                  ? <><BarChartIcon style={{ fontSize: 15 }} /> Chart</>
                  : <><TableChart   style={{ fontSize: 15 }} /> Table</>
                }
              </button>
              <button onClick={openAdd} style={{
                padding: "7px 16px", border: "none", borderRadius: 9,
                background: "#1d4ed8", color: "#fff", cursor: "pointer",
                fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5,
              }}>
                <Add style={{ fontSize: 16 }} /> Add Entry
              </button>
            </div>
          </div>

          {/* search + filter bar */}
          <div style={{
            padding: "11px 16px", borderBottom: "1px solid #f1f5f9",
            display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
          }}>
            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94a3b8" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${tab === "product" ? "products" : tab === "area" ? "areas" : "months"}…`}
                style={{ width: "100%", padding: "8px 12px 8px 33px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 13, background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 13, background: "#f8fafc", color: "#475569", cursor: "pointer" }}
            >
              <option value="all">All Status</option>
              <option value="achieved">Achieved (100%+)</option>
              <option value="ontrack">On Track (70–99%)</option>
              <option value="atrisk">At Risk (40–69%)</option>
              <option value="critical">Critical (&lt;40%)</option>
            </select>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* loading */}
          {loading && <Skeleton />}

          {/* table view */}
          {!loading && view === "table" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      tab === "product" ? "Product" : tab === "area" ? "Area"   : "Month",
                      tab === "product" ? "Segment" : tab === "area" ? "Region" : "Year",
                      "Target", "Achieved", "Progress", "Status", "Actions",
                    ].map(h => (
                      <th key={h} style={{
                        padding: "10px 14px", fontWeight: 700, fontSize: 11, color: "#475569",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        borderBottom: "1.5px solid #e2e8f0", whiteSpace: "nowrap",
                        textAlign: ["Target","Achieved"].includes(h) ? "right" : ["Status","Actions"].includes(h) ? "center" : "left",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 13 }}>
                        No results. Try adjusting your search or filter.
                      </td>
                    </tr>
                  )}
                  {filtered.map((row, i) => {
                    const p = pct(row.achieved, row.target)
                    return (
                      <tr
                        key={row.id}
                        style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa", transition: "background .1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"}
                      >
                        <td style={{ padding: "11px 14px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{row[nk]}</td>
                        <td style={{ padding: "11px 14px", color: "#64748b" }}>{row[sk] || "—"}</td>
                        <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600 }}>{(row.target || 0).toLocaleString()}</td>
                        <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: clr(p) }}>{(row.achieved || 0).toLocaleString()}</td>
                        <td style={{ padding: "11px 14px", minWidth: 160 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1 }}><ProgressBar a={row.achieved} t={row.target} color={clr(p)} /></div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: clr(p), minWidth: 36, textAlign: "right" }}>{p}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}><Badge p={p} /></td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button onClick={() => openEdit(row)} style={{
                              padding: "5px 12px", border: "1.5px solid #dbeafe", borderRadius: 8,
                              background: "#eff6ff", cursor: "pointer", display: "flex", alignItems: "center",
                              gap: 4, fontSize: 12, fontWeight: 600, color: "#1d4ed8",
                            }}>
                              <Edit style={{ fontSize: 13 }} /> Edit
                            </button>
                            <button onClick={() => setDelRow(row)} style={{
                              padding: "5px 10px", border: "1.5px solid #fecaca", borderRadius: 8,
                              background: "#fff5f5", cursor: "pointer", display: "flex", alignItems: "center", color: "#dc2626",
                            }}>
                              <Delete style={{ fontSize: 14 }} />
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

          {/* chart view */}
          {!loading && view === "chart" && (
            <div style={{ padding: "18px 20px" }}>
              {filtered.length === 0
                ? <p style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No data to chart.</p>
                : <>
                  <p style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Target vs Achievement</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(v, n) => [v.toLocaleString() + " units", n]}
                      />
                      <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Target"   fill="#cbd5e1" radius={[5,5,0,0]} />
                      <Bar dataKey="Achieved" radius={[5,5,0,0]}>
                        {chartData.map((d, i) => <Cell key={i} fill={clr(d._pct)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginTop: 20 }}>
                    {filtered.map(row => {
                      const p = pct(row.achieved, row.target)
                      return (
                        <div key={row.id} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "12px 14px" }}>
                          <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row[nk]}</p>
                          <p style={{ margin: "0 0 7px", fontSize: 22, fontWeight: 900, color: clr(p) }}>{p}%</p>
                          <ProgressBar a={row.achieved} t={row.target} color={clr(p)} />
                        </div>
                      )
                    })}
                  </div>
                </>
              }
            </div>
          )}

          {/* footer summary */}
          {!loading && filtered.length > 0 && view === "table" && (
            <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 22, background: "#f8fafc", fontSize: 12, flexWrap: "wrap" }}>
              <span style={{ color: "#64748b" }}>Showing <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> entries</span>
              <span style={{ color: "#64748b" }}>Total Target: <strong style={{ color: "#0f172a" }}>{fTotT.toLocaleString()}</strong></span>
              <span style={{ color: "#64748b" }}>Total Achieved: <strong style={{ color: "#16a34a" }}>{fTotA.toLocaleString()}</strong></span>
              <span style={{ color: "#64748b" }}>Avg Achievement: <strong style={{ color: "#1d4ed8" }}>{fAvg}%</strong></span>
            </div>
          )}
        </div>

        {/* legend */}
        <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[["#16a34a","Achieved (≥100%)"],["#1d4ed8","On Track (70–99%)"],["#d97706","At Risk (40–69%)"],["#dc2626","Critical (<40%)"]].map(([c, l]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* modals */}
      {modal && (
        <Modal
          tab={tab} mode={modal}
          form={form} setForm={setForm}
          errors={errors} saving={saving}
          onSave={handleSave}
          onClose={() => { if (!saving) setModal(null) }}
          allOptions={allOptions} setAllOptions={setAllOptions}
        />
      )}
      {delRow && (
        <Confirm
          name={delRow[nk]}
          deleting={deleting}
          onClose={() => { if (!deleting) setDelRow(null) }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}