// AgentTargetManagement.jsx — Product-linked Points + Over-Completion + Rupee Payout
import { useState, useEffect } from "react"
import {
  TrackChanges, TrendingUp, CheckCircle, EmojiEvents,
  BarChart as BarChartIcon, TableChart, Search, Refresh, Stars,
  MonetizationOn, Inventory2, TrendingDown,
} from "@mui/icons-material"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"

const API   = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")
const pct   = (a, t) => (!t ? 0 : Math.min(Math.round((a / t) * 100), 999))
const rawPct = (a, t) => (!t ? 0 : Math.round((a / t) * 100))
const clr   = (p)    => p >= 100 ? "#16a34a" : p >= 70 ? "#1d4ed8" : p >= 40 ? "#d97706" : "#dc2626"
const bgClr = (p)    => p >= 100 ? "#dcfce7" : p >= 70 ? "#dbeafe" : p >= 40 ? "#fef3c7" : "#fee2e2"
const lbl   = (p)    => p >= 100 ? "Achieved" : p >= 70 ? "On Track" : p >= 40 ? "At Risk" : "Critical"
const NK    = (t)    => t === "product" ? "product_name" : t === "area" ? "area_name" : t === "points" ? "name" : "month_name"
const SK    = (t)    => t === "product" ? "segment"      : t === "area" ? "region"    : t === "points" ? "deadline" : "year"
const norm  = (doc)  => ({ ...doc, id: doc._id ?? doc.id })

const agentHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("agentToken")}`,
})

const apiFetch = async (path) => {
  const res = await fetch(`${API}${path}`, { headers: agentHeaders() })
  if (!res.ok) { const m = await res.text().catch(() => res.statusText); throw new Error(m || `HTTP ${res.status}`) }
  return res.json()
}

const ProgressBar = ({ a, t, color, height = 8 }) => {
  const raw   = !t ? 0 : (a / t) * 100
  const capped = Math.min(raw, 100)
  const isOver = raw > 100
  return (
    <div style={{ background:"#f1f5f9", borderRadius:99, height, overflow:"hidden", position:"relative" }}>
      <div style={{ width:`${capped}%`, height:"100%", background:color, borderRadius:99, transition:"width .5s ease" }} />
      {isOver && (
        <div style={{ position:"absolute", right:0, top:0, height:"100%", width:Math.min(8, height+2)+"px", background:"#f59e0b", borderRadius:"0 99px 99px 0", animation:"blink 1s ease infinite" }} />
      )}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}

const Badge = ({ p }) => (
  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:bgClr(p), color:clr(p), whiteSpace:"nowrap" }}>{lbl(p)}</span>
)

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ flex:1, minWidth:150, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"17px 20px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, background:color+"18", color, display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</div>
      <div style={{ minWidth:0 }}>
        <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</p>
        <p style={{ margin:"3px 0 0", fontSize:24, fontWeight:900, color:"#0f172a", lineHeight:1 }}>{value}</p>
        {sub && <p style={{ margin:"3px 0 0", fontSize:12, color:"#64748b" }}>{sub}</p>}
      </div>
    </div>
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

function NoTargets({ tab }) {
  return (
    <div style={{ padding:"56px 24px", textAlign:"center" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
        {tab === "points" ? <Stars style={{ fontSize:30, color:"#94a3b8" }} /> : <TrackChanges style={{ fontSize:30, color:"#94a3b8" }} />}
      </div>
      <p style={{ margin:0, fontSize:15, fontWeight:700, color:"#475569" }}>No {tab} targets assigned yet</p>
      <p style={{ margin:"6px 0 0", fontSize:13, color:"#94a3b8" }}>Your admin hasn't set {tab} targets for you yet. Check back later.</p>
    </div>
  )
}

// ── Points Target Card (agent view) — with product link + over-completion + rupee payout ──
function PointsTargetCard({ row }) {
  const rawP       = rawPct(row.achieved, row.target)
  const p          = Math.min(rawP, 999)
  const isAchieved = rawP >= 100
  const isOver     = rawP > 100
  const overPct    = isOver ? rawP - 100 : 0
  const overUnits  = isOver ? Math.max(0, (row.achieved || 0) - (row.target || 0)) : 0
  const remaining  = Math.max(0, (row.target || 0) - (row.achieved || 0))

  // Rupee reward calc
  const rupeeEarned = isAchieved && row.rupeeReward > 0
    ? (row.rupeeRewardType === "per_unit_over"
        ? overUnits * row.rupeeReward
        : row.rupeeReward)
    : 0

  return (
    <div style={{
      background: isOver
        ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
        : isAchieved ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "#fff",
      border: `1.5px solid ${isOver ? "#fde68a" : isAchieved ? "#86efac" : "#e2e8f0"}`,
      borderRadius:16, padding:"20px", position:"relative", overflow:"hidden",
    }}>
      {/* ribbon */}
      {isOver && (
        <div style={{ position:"absolute", top:0, right:0, background:"#d97706", color:"#fff",
          fontSize:10, fontWeight:800, padding:"5px 14px", borderRadius:"0 14px 0 12px", letterSpacing:"0.06em" }}>
          🔥 +{overPct}% OVER TARGET
        </div>
      )}
      {isAchieved && !isOver && (
        <div style={{ position:"absolute", top:0, right:0, background:"#16a34a", color:"#fff",
          fontSize:10, fontWeight:800, padding:"5px 14px", borderRadius:"0 14px 0 12px", letterSpacing:"0.06em" }}>
          🏆 ACHIEVED
        </div>
      )}

      {/* header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:16 }}>
        <div style={{ width:40, height:40, borderRadius:12, flexShrink:0,
          background: isOver ? "#fef3c7" : isAchieved ? "#dcfce7" : "#faf5ff",
          border:`1.5px solid ${isOver?"#fde68a":isAchieved?"#86efac":"#e9d5ff"}`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          {row.linkedProductName
            ? <Inventory2 style={{ fontSize:20, color: isAchieved ? "#16a34a" : "#7c3aed" }} />
            : <Stars style={{ fontSize:20, color: isOver ? "#d97706" : isAchieved ? "#16a34a" : "#7c3aed" }}/>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:15, fontWeight:800, color:"#0f172a" }}>{row.name}</p>
          {/* Product link badge */}
          {row.linkedProductName && (
            <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3, marginBottom:2 }}>
              <Inventory2 style={{ fontSize:11, color:"#7c3aed" }} />
              <span style={{ fontSize:12, color:"#7c3aed", fontWeight:600 }}>{row.linkedProductName}</span>
              {row.pointsPerUnit > 0 && (
                <span style={{ fontSize:10, color:"#94a3b8" }}>· {row.pointsPerUnit} pts/unit billed</span>
              )}
            </div>
          )}
          {row.description && <p style={{ margin:"3px 0 0", fontSize:12, color:"#64748b" }}>{row.description}</p>}
          {row.deadline && (
            <p style={{ margin:"4px 0 0", fontSize:11, color:"#94a3b8" }}>
              Deadline: {new Date(row.deadline).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
            </p>
          )}
        </div>
        <Badge p={pct(row.achieved, row.target)} />
      </div>

      {/* big percentage */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:12, marginBottom:12 }}>
        <span style={{ fontSize:42, fontWeight:900, color: isOver ? "#d97706" : clr(pct(row.achieved, row.target)), lineHeight:1 }}>
          {rawP}%
        </span>
        <div style={{ paddingBottom:4 }}>
          <p style={{ margin:0, fontSize:12, color:"#64748b" }}>
            <strong style={{color: isOver ? "#d97706" : clr(pct(row.achieved, row.target))}}>
              {(row.achieved||0).toLocaleString()}
            </strong> / {(row.target||0).toLocaleString()} {row.linkedProductName ? "units" : "pts"} {row.linkedProductName ? "sold" : "earned"}
          </p>
          {!isAchieved && (
            <p style={{ margin:"2px 0 0", fontSize:11, color:"#94a3b8" }}>
              {remaining.toLocaleString()} {row.linkedProductName?"units":"pts"} to go
            </p>
          )}
          {isOver && (
            <p style={{ margin:"2px 0 0", fontSize:11, color:"#d97706", fontWeight:700 }}>
              +{overUnits} {row.linkedProductName?"units":"pts"} over target! 🔥
            </p>
          )}
        </div>
      </div>

      {/* progress bar */}
      <ProgressBar a={row.achieved} t={row.target} color={isOver ? "#d97706" : clr(pct(row.achieved, row.target))} height={10} />

      {/* over-completion detail */}
      {isOver && (
        <div style={{ marginTop:10, padding:"8px 12px", background:"#fff", border:"1px solid #fde68a", borderRadius:8, fontSize:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color:"#92400e", fontWeight:700 }}>Over-completion detail</span>
            <span style={{ color:"#d97706", fontWeight:800 }}>+{overPct}% ({overUnits} extra units)</span>
          </div>
          <div style={{ display:"flex", gap:14, marginTop:4 }}>
            <span style={{ fontSize:11, color:"#64748b" }}>Target: <strong>{row.target}</strong></span>
            <span style={{ fontSize:11, color:"#64748b" }}>Achieved: <strong style={{color:"#d97706"}}>{row.achieved}</strong></span>
            <span style={{ fontSize:11, color:"#64748b" }}>Extra: <strong style={{color:"#d97706"}}>+{overUnits}</strong></span>
          </div>
        </div>
      )}

      {/* reward pills */}
      <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:8 }}>
        {/* Bonus points */}
        {row.bonusPoints > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
            background: isAchieved ? "#f0fdf4" : "#faf5ff",
            border:`1px solid ${isAchieved?"#bbf7d0":"#e9d5ff"}`, borderRadius:10 }}>
            <span style={{ fontSize:16 }}>{isAchieved ? "✅" : "🎁"}</span>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color: isAchieved ? "#15803d" : "#6d28d9" }}>
                {isAchieved
                  ? `+${row.bonusPoints} bonus points credited!`
                  : `+${row.bonusPoints} bonus points on achievement`}
              </p>
              {isAchieved && <p style={{ margin:"2px 0 0", fontSize:11, color:"#64748b" }}>Check your Points & Payout activity</p>}
            </div>
          </div>
        )}

        {/* Rupee payout */}
        {row.rupeeReward > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
            background: isAchieved ? "#fffbeb" : "#fff",
            border:`1px solid ${isAchieved?"#fde68a":"#e2e8f0"}`, borderRadius:10 }}>
            <MonetizationOn style={{ fontSize:18, color: isAchieved ? "#d97706" : "#94a3b8" }} />
            <div style={{ flex:1 }}>
              {isAchieved ? (
                <>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#92400e" }}>
                    ₹{rupeeEarned > 0 ? rupeeEarned.toLocaleString() : row.rupeeReward} payout credited to your wallet!
                  </p>
                  {row.rupeeRewardType === "per_unit_over" && isOver && (
                    <p style={{ margin:"2px 0 0", fontSize:11, color:"#92400e" }}>
                      {overUnits} extra units × ₹{row.rupeeReward} = ₹{rupeeEarned.toLocaleString()}
                    </p>
                  )}
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#64748b" }}>Check your Points & Payout → Salary balance</p>
                </>
              ) : (
                <>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#6b7280" }}>
                    {row.rupeeRewardType === "per_unit_over"
                      ? `₹${row.rupeeReward} per unit sold beyond target`
                      : `₹${row.rupeeReward} payout on achievement`}
                  </p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#94a3b8" }}>Will be credited to your salary balance</p>
                </>
              )}
            </div>
            {isAchieved && <span style={{ fontSize:14, fontWeight:900, color:"#d97706" }}>₹{rupeeEarned>0?rupeeEarned.toLocaleString():row.rupeeReward}</span>}
          </div>
        )}

        {/* Points per unit info */}
        {row.linkedProductName && row.pointsPerUnit > 0 && !isAchieved && (
          <div style={{ padding:"8px 12px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, fontSize:11, color:"#64748b" }}>
            💡 Each unit of <strong>{row.linkedProductName}</strong> you bill = <strong style={{color:"#7c3aed"}}>{row.pointsPerUnit} pts</strong>. Sell {remaining} more units to hit target.
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════ MAIN ════════════════════════════
export default function TargetManagement() {
  const [products, setProducts] = useState([])
  const [areas,    setAreas]    = useState([])
  const [monthly,  setMonthly]  = useState([])
  const [points,   setPoints]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const [apiErr,   setApiErr]   = useState(null)
  const [tab,      setTab]      = useState("product")
  const [view,     setView]     = useState("table")
  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState("all")

  const data = tab==="product" ? products : tab==="area" ? areas : tab==="points" ? points : monthly
  const nk   = NK(tab)
  const sk   = SK(tab)

  const fetchTargets = async (type) => {
    try {
      setLoading(true); setApiErr(null)
      const rows      = await apiFetch(`/api/targets/my?type=${type}`)
      const formatted = (Array.isArray(rows) ? rows : (rows.targets||[])).map(norm)
      if (type==="product")      setProducts(formatted)
      else if (type==="area")    setAreas(formatted)
      else if (type==="points")  setPoints(formatted)
      else                       setMonthly(formatted)
    } catch(err) { setApiErr("Could not load targets. " + err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTargets(tab) }, [tab])

  const totTarget   = data.reduce((s,r)=>s+(r.target||0),0)
  const totAchieved = data.reduce((s,r)=>s+(r.achieved||0),0)
  const ovPct       = pct(totAchieved, totTarget)
  const shortfall   = Math.max(0, totTarget - totAchieved)
  const overItems   = data.filter(r => rawPct(r.achieved, r.target) > 100)

  const filtered = data.filter(r => {
    const q  = (r[nk]||"").toLowerCase().includes(search.toLowerCase())
    const p  = pct(r.achieved, r.target)
    const st = status==="all"?true:status==="achieved"?p>=100:status==="ontrack"?p>=70&&p<100:status==="atrisk"?p>=40&&p<70:p<40
    return q&&st
  })

  const switchTab = (t) => { setTab(t); setSearch(""); setStatus("all") }

  const chartData = tab!=="points" ? filtered.map(r=>({
    name:(r[nk]||"").length>11?(r[nk]||"").slice(0,11)+"…":(r[nk]||""),
    Target:r.target, Achieved:r.achieved, _pct:pct(r.achieved,r.target),
  })) : []

  const fTotT = filtered.reduce((s,r)=>s+(r.target||0),0)
  const fTotA = filtered.reduce((s,r)=>s+(r.achieved||0),0)
  const fAvg  = filtered.length ? Math.round(filtered.reduce((s,r)=>s+pct(r.achieved,r.target),0)/filtered.length) : 0

  // Points tab summaries
  const achievedTargets = points.filter(r => rawPct(r.achieved, r.target) >= 100).length
  const totalBonus      = points.filter(r => rawPct(r.achieved, r.target) >= 100).reduce((s,r)=>s+(r.bonusPoints||0),0)
  const totalRupee      = points.filter(r => rawPct(r.achieved, r.target) >= 100).reduce((s,r) => {
    if (!r.rupeeReward) return s
    if (r.rupeeRewardType === "per_unit_over") {
      const over = Math.max(0, (r.achieved||0) - (r.target||0))
      return s + over * r.rupeeReward
    }
    return s + r.rupeeReward
  }, 0)

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      {/* breadcrumb */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"11px 28px", display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:13, color:"#94a3b8" }}>Targets & Incentives</span>
        <span style={{ color:"#cbd5e1" }}>/</span>
        <span style={{ fontSize:13, fontWeight:700, color:"#1d4ed8" }}>My Targets</span>
      </div>

      <div style={{ padding:"24px 28px", maxWidth:1120, margin:"0 auto" }}>
        {/* header */}
        <div style={{ marginBottom:22, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:"#0f172a" }}>My Targets</h1>
            <p style={{ margin:"4px 0 0", fontSize:14, color:"#64748b" }}>
              {tab==="points" ? "Points milestones, product challenges & bonus rewards" : `Monthly targets vs achievement — ${tab} view`}
            </p>
          </div>
          <button onClick={()=>fetchTargets(tab)} style={{ padding:"8px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:"#475569" }}>
            <Refresh style={{fontSize:15}}/> Refresh
          </button>
        </div>

        {apiErr && (
          <div style={{ marginBottom:18, padding:"12px 18px", borderRadius:12, background:"#fee2e2", border:"1.5px solid #fca5a5", fontSize:13, color:"#991b1b", display:"flex", alignItems:"center", gap:10 }}>
            <span>⚠</span> {apiErr}
            <button onClick={()=>fetchTargets(tab)} style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:7, border:"none", background:"#dc2626", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Retry</button>
          </div>
        )}

        {/* over-achievement banner */}
        {tab !== "points" && overItems.length > 0 && (
          <div style={{ marginBottom:18, padding:"14px 18px", borderRadius:12, background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1.5px solid #fde68a", fontSize:13, color:"#92400e" }}>
            🔥 <strong>Great work! You've exceeded {overItems.length} target{overItems.length>1?"s":""}!</strong>
            {" "}{overItems.map(r => {
              const over = rawPct(r.achieved, r.target) - 100
              return `${r[nk]} (+${over}%)`
            }).join(", ")}
          </div>
        )}

        {/* stat cards */}
        {tab === "points" ? (
          <div style={{ display:"flex", gap:14, marginBottom:20, flexWrap:"wrap" }}>
            <StatCard label="Total Milestones"   value={points.length}              color="#7c3aed" icon={<Stars />} />
            <StatCard label="Achieved"            value={achievedTargets}             color="#16a34a" icon={<CheckCircle />} sub={`of ${points.length}`} />
            <StatCard label="Bonus Points Earned" value={`+${totalBonus}`}           color="#d97706" icon={<EmojiEvents />} sub="pts credited" />
            <StatCard label="Rupee Payouts"       value={`₹${totalRupee.toLocaleString()}`} color="#059669" icon={<MonetizationOn />} sub="earned" />
            <StatCard label="Overall Progress"    value={`${ovPct}%`}                color="#1d4ed8" icon={<TrackChanges />} />
          </div>
        ) : (
          <div style={{ display:"flex", gap:14, marginBottom:20, flexWrap:"wrap" }}>
            <StatCard label="Overall Achievement" value={`${ovPct}%`}                  color="#1d4ed8" icon={<TrackChanges />} />
            <StatCard label="Total Target"         value={totTarget.toLocaleString()}   color="#d97706" icon={<TrendingUp />}  sub="units" />
            <StatCard label="Total Achieved"       value={totAchieved.toLocaleString()} color="#16a34a" icon={<CheckCircle />} sub="orders logged" />
            <StatCard label="Shortfall"            value={shortfall.toLocaleString()}   color="#dc2626" icon={<EmojiEvents />} sub="units remaining" />
            {overItems.length > 0 && <StatCard label="Over-Achieved" value={overItems.length} color="#d97706" icon={<TrendingUp />} sub="targets" />}
          </div>
        )}

        {/* overall progress bar (non-points) */}
        {data.length > 0 && tab !== "points" && (
          <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16, padding:"18px 22px", marginBottom:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:8 }}>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#0f172a" }}>
                  {tab==="product"?"Product Portfolio":tab==="area"?"Area Coverage":"Monthly"} — Overall Progress
                </p>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>{totAchieved.toLocaleString()} / {totTarget.toLocaleString()} units</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Badge p={ovPct} />
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
          {/* tabs */}
          <div style={{ display:"flex", borderBottom:"1.5px solid #e2e8f0", padding:"0 14px", flexWrap:"wrap", alignItems:"center" }}>
            {[
              {key:"product", label:"Product Targets"},
              {key:"area",    label:"Area Targets"},
              {key:"monthly", label:"Monthly Targets"},
              {key:"points",  label:"Points Targets", icon:<Stars style={{fontSize:14,marginRight:4}}/>},
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
            {tab !== "points" && (
              <div style={{ marginLeft:"auto", padding:"8px 0" }}>
                <button onClick={()=>setView(v=>v==="table"?"chart":"table")} style={{ padding:"7px 14px", border:"1.5px solid #e2e8f0", borderRadius:9, background:"#f8fafc", cursor:"pointer", fontSize:12, fontWeight:600, color:"#475569", display:"flex", alignItems:"center", gap:5 }}>
                  {view==="table"?<><BarChartIcon style={{fontSize:15}}/> Chart</>:<><TableChart style={{fontSize:15}}/> Table</>}
                </button>
              </div>
            )}
          </div>

          {/* info bars */}
          {tab==="product" && (
            <div style={{ padding:"8px 16px", background:"#f0fdf4", borderBottom:"1px solid #bbf7d0", fontSize:12, color:"#166534" }}>
              ✓ Your achieved count updates each time you create a bill for that product. Over-completion is tracked.
            </div>
          )}
          {tab==="points" && (
            <div style={{ padding:"8px 16px", background:"#faf5ff", borderBottom:"1px solid #e9d5ff", fontSize:12, color:"#6b21a8", display:"flex", alignItems:"center", gap:6 }}>
              <Stars style={{fontSize:15}}/>
              <span>Product targets auto-track your billing. Hit milestones to earn <strong>bonus points + rupee payouts</strong>, both shown in Points & Payout.</span>
            </div>
          )}

          {/* search + filter (non-points) */}
          {tab !== "points" && (
            <div style={{ padding:"11px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ position:"relative", flex:1, minWidth:180 }}>
                <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#94a3b8" }} />
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder={`Search ${tab==="product"?"products":tab==="area"?"areas":"months"}…`}
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
          )}

          {loading && <Skeleton />}

          {/* ── Points targets grid ── */}
          {!loading && tab==="points" && (
            <div style={{ padding:"20px" }}>
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ position:"relative", flex:1, minWidth:180 }}>
                  <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#94a3b8" }} />
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search milestones…"
                    style={{ width:"100%", padding:"8px 12px 8px 33px", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, background:"#f8fafc", outline:"none", boxSizing:"border-box" }} />
                </div>
                <select value={status} onChange={e=>setStatus(e.target.value)} style={{ padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, background:"#f8fafc", color:"#475569", cursor:"pointer" }}>
                  <option value="all">All Status</option>
                  <option value="achieved">Achieved (100%+)</option>
                  <option value="ontrack">On Track (70–99%)</option>
                  <option value="atrisk">At Risk (40–69%)</option>
                  <option value="critical">Critical (&lt;40%)</option>
                </select>
              </div>

              {points.length === 0 ? <NoTargets tab="points" />
                : filtered.length === 0
                ? <p style={{ textAlign:"center", color:"#94a3b8", padding:"40px 0", fontSize:13 }}>No results for current filter.</p>
                : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                    {filtered.map(row => <PointsTargetCard key={row.id} row={row} />)}
                  </div>
                )
              }

              {filtered.length > 0 && (
                <div style={{ marginTop:16, padding:"10px 0", borderTop:"1px solid #f1f5f9", display:"flex", gap:22, fontSize:12, flexWrap:"wrap" }}>
                  <span style={{color:"#64748b"}}>Showing <strong style={{color:"#0f172a"}}>{filtered.length}</strong> milestones</span>
                  <span style={{color:"#64748b"}}>Achieved: <strong style={{color:"#16a34a"}}>{filtered.filter(r=>rawPct(r.achieved,r.target)>=100).length}</strong></span>
                  <span style={{color:"#64748b"}}>Bonus Pts: <strong style={{color:"#7c3aed"}}>+{filtered.filter(r=>rawPct(r.achieved,r.target)>=100).reduce((s,r)=>s+(r.bonusPoints||0),0)}</strong></span>
                  <span style={{color:"#64748b"}}>₹ Earned: <strong style={{color:"#d97706"}}>₹{totalRupee.toLocaleString()}</strong></span>
                  <span style={{color:"#64748b"}}>Over-achieved: <strong style={{color:"#d97706"}}>{filtered.filter(r=>rawPct(r.achieved,r.target)>100).length}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* ── Table view ── */}
          {!loading && view==="table" && tab!=="points" && (
            data.length===0 ? <NoTargets tab={tab} /> : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"#f8fafc" }}>
                      {[tab==="product"?"Product":tab==="area"?"Area":"Month",
                        tab==="product"?"Segment":tab==="area"?"Region":"Year",
                        "Target","Achieved","Progress","Status"].map(h=>(
                        <th key={h} style={{ padding:"10px 14px", fontWeight:700, fontSize:11, color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:"1.5px solid #e2e8f0", whiteSpace:"nowrap", textAlign:["Target","Achieved"].includes(h)?"right":"left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0 && (
                      <tr><td colSpan={6} style={{ textAlign:"center", padding:"40px", color:"#94a3b8", fontSize:13 }}>No results for current filter.</td></tr>
                    )}
                    {filtered.map((row,i)=>{
                      const p = pct(row.achieved, row.target)
                      const rp = rawPct(row.achieved, row.target)
                      const isOver = rp > 100
                      return (
                        <tr key={row.id} style={{ borderBottom:"1px solid #f1f5f9", background: isOver?"#fffbeb":i%2===0?"#fff":"#fafafa", transition:"background .1s" }}
                          onMouseEnter={e=>e.currentTarget.style.background= isOver?"#fef3c7":"#eff6ff"}
                          onMouseLeave={e=>e.currentTarget.style.background= isOver?"#fffbeb":i%2===0?"#fff":"#fafafa"}>
                          <td style={{ padding:"11px 14px", fontWeight:600, color:"#0f172a", whiteSpace:"nowrap" }}>
                            {row[nk]}
                            {tab==="product" && row.genericName && (
                              <p style={{ margin:"2px 0 0", fontSize:11, color:"#94a3b8", fontWeight:400 }}>{row.genericName}</p>
                            )}
                          </td>
                          <td style={{ padding:"11px 14px", color:"#64748b" }}>{row[sk]||"—"}</td>
                          <td style={{ padding:"11px 14px", textAlign:"right", fontWeight:600 }}>{(row.target||0).toLocaleString()}</td>
                          <td style={{ padding:"11px 14px", textAlign:"right", fontWeight:700, color:isOver?"#d97706":clr(p) }}>
                            {(row.achieved||0).toLocaleString()}
                            {tab==="product" && <span style={{ fontSize:10, color:"#94a3b8", fontWeight:400, marginLeft:4 }}>orders</span>}
                            {isOver && <p style={{ margin:"2px 0 0", fontSize:10, color:"#d97706", fontWeight:700 }}>+{rp-100}% over</p>}
                          </td>
                          <td style={{ padding:"11px 14px", minWidth:160 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ flex:1 }}><ProgressBar a={row.achieved} t={row.target} color={isOver?"#d97706":clr(p)}/></div>
                              <span style={{ fontSize:12, fontWeight:700, color:isOver?"#d97706":clr(p), minWidth:36, textAlign:"right" }}>{rp}%</span>
                            </div>
                          </td>
                          <td style={{ padding:"11px 14px" }}>
                            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                              <Badge p={p}/>
                              {isOver && <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:99, background:"#fef3c7", color:"#d97706" }}>🔥 Over</span>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ── Chart view ── */}
          {!loading && view==="chart" && tab!=="points" && (
            <div style={{ padding:"18px 20px" }}>
              {filtered.length===0 ? <NoTargets tab={tab} /> : (
                <>
                  <p style={{ margin:"0 0 18px", fontSize:13, fontWeight:700, color:"#0f172a" }}>Target vs Achievement</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{top:4,right:16,left:0,bottom:4}} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                      <XAxis dataKey="name" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12}} formatter={(v,n)=>[v.toLocaleString()+" units",n]}/>
                      <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:12}}/>
                      <Bar dataKey="Target" fill="#cbd5e1" radius={[5,5,0,0]}/>
                      <Bar dataKey="Achieved" radius={[5,5,0,0]}>{chartData.map((d,i)=><Cell key={i} fill={d._pct>100?"#d97706":clr(d._pct)}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginTop:20 }}>
                    {filtered.map(row=>{
                      const p=pct(row.achieved,row.target)
                      const rp=rawPct(row.achieved,row.target)
                      const isOver = rp > 100
                      return (
                        <div key={row.id} style={{ background: isOver?"#fffbeb":"#f8fafc", border:`1.5px solid ${isOver?"#fde68a":"#e2e8f0"}`, borderRadius:12, padding:"12px 14px" }}>
                          <p style={{ margin:"0 0 3px", fontSize:11, fontWeight:700, color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row[nk]}</p>
                          <p style={{ margin:"0 0 2px", fontSize:22, fontWeight:900, color:isOver?"#d97706":clr(p) }}>{rp}%</p>
                          {isOver && <p style={{ margin:"0 0 4px", fontSize:10, color:"#d97706", fontWeight:700 }}>+{rp-100}% over</p>}
                          <ProgressBar a={row.achieved} t={row.target} color={isOver?"#d97706":clr(p)}/>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {!loading && filtered.length>0 && view==="table" && tab!=="points" && (
            <div style={{ padding:"10px 20px", borderTop:"1px solid #f1f5f9", display:"flex", gap:22, background:"#f8fafc", fontSize:12, flexWrap:"wrap" }}>
              <span style={{color:"#64748b"}}>Showing <strong style={{color:"#0f172a"}}>{filtered.length}</strong> entries</span>
              <span style={{color:"#64748b"}}>Total Target: <strong style={{color:"#0f172a"}}>{fTotT.toLocaleString()}</strong></span>
              <span style={{color:"#64748b"}}>Total Achieved: <strong style={{color:"#16a34a"}}>{fTotA.toLocaleString()}</strong></span>
              <span style={{color:"#64748b"}}>Avg Achievement: <strong style={{color:"#1d4ed8"}}>{fAvg}%</strong></span>
              {overItems.length > 0 && <span style={{color:"#d97706"}}>🔥 {overItems.length} over target</span>}
            </div>
          )}
        </div>

        {/* legend */}
        <div style={{ marginTop:14, display:"flex", gap:16, flexWrap:"wrap" }}>
          {[["#16a34a","Achieved (≥100%)"],["#d97706","Over-achieved 🔥"],["#1d4ed8","On Track (70–99%)"],["#d97706","At Risk (40–69%)"],["#dc2626","Critical (<40%)"]].map(([c,l])=>(
            <span key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#64748b" }}>
              <span style={{ width:10, height:10, borderRadius:3, background:c, flexShrink:0 }}/>{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}