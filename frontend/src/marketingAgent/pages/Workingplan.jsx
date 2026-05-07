// pages/plan/WorkingPlan.jsx  – Fixed version
import { useState, useEffect, useCallback, useRef } from 'react'

//  Constants 
const ACTIVITIES = [
  'Doctor Visit - Clinic','Doctor Visit - Hospital','Doctor Visit - Chamber',
  'Face to Face Meeting','Virtual Meeting','Products Detailing','Products Addressing',
  'Sample Distribution','Literature Distribution','Hospital Round','Nursing Home',
  'Clinic Chain','Diagnostic Centre','Path Lab','Radiology Centre','Blood Bank',
  'Pharmacy College','Distributor Meeting','Stockist Visit','Retailer Visit',
  'Medical Store','Wholesaler','Chemist Shop','Pharmacy Chain','Office Meeting',
  'Team Meeting','Sales Review','Training Session','Coaching Session',
  'Joint Field Work','End of Day Reporting','Virtual Team Huddle','Morning Briefing',
  'Admin Task','HR Task','Marketing Task','Superior Assignment','Data Entry',
  'Report Submission','Compliance Task',
]

const STATUSES        = ['pending','in-progress','completed','cancelled','deferred']
const PRIORITIES      = ['low','medium','high']
const ACTION_STATUSES = ['satisfactory','successful','progress','revisit-required','order-placed','order-collected']
const TIMES           = ['06:00','07:00','08:00','09:00','10:00','10:30','11:00','11:30','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
const WEEK_DAYS       = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const PLAN_TYPES = {
  daily:       { label:'Daily Plan',          period:1  },
  weekly:      { label:'Weekly Plan',         period:7  },
  fortnightly: { label:'Fortnightly Plan',    period:14 },
  monthly:     { label:'Monthly Plan',        period:30 },
  station:     { label:'Journey Plan (PJP)',  period:1  },
  outstations: { label:'Tour Program (STP)',  period:7  },
}

const STATUS_COLORS = {
  pending:       { bg:'#EAF3DE', color:'#3B6D11' },
  'in-progress': { bg:'#FAEEDA', color:'#854F0B' },
  completed:     { bg:'#E1F5EE', color:'#0F6E56' },
  cancelled:     { bg:'#FCEBEB', color:'#A32D2D' },
  deferred:      { bg:'#E6F1FB', color:'#185FA5' },
}

const PRIORITY_COLORS = {
  low:    { bg:'#EAF3DE', color:'#3B6D11' },
  medium: { bg:'#FAEEDA', color:'#854F0B' },
  high:   { bg:'#FCEBEB', color:'#A32D2D' },
}

// ─────────────────────────────────────────────────────────────
//  FIX 1: toStr uses LOCAL timezone, not UTC
//  Original: d.toISOString().slice(0,10)  ← wrong for UTC+5:30
//  Fixed:    use getFullYear/getMonth/getDate (local time)
// ─────────────────────────────────────────────────────────────
const toStr = d => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const uid        = () => Date.now().toString(36) + Math.random().toString(36).slice(2)
const todayDate  = () => { const d = new Date(); d.setHours(0,0,0,0); return d }
const todayStr   = () => toStr(todayDate())
const getMonday  = d => { const t=new Date(d); const day=t.getDay()||7; t.setDate(t.getDate()-day+1); return t }
const getWeekNum = d => {
  const t=new Date(d); t.setHours(0,0,0,0); t.setDate(t.getDate()+4-(t.getDay()||7))
  const y=new Date(t.getFullYear(),0,1); return Math.ceil(((t-y)/86400000+1)/7)
}
const normalizeLocType = v => {
  if (!v) return 'in-station'
  const map = {
    'in-station':'in-station','out-station':'out-station',
    'In-Station':'in-station','Out-Station':'out-station',
  }
  return map[v] ?? v.toLowerCase().replace(/\s+/,'-')
}

const emptyTask = (date='') => ({
  id:uid(), date, activity:'', timeSlot:'', bufferFrom:'', bufferTo:'',
  dayOfWeek:'', location:'', locationType:'in-station', contactPerson:'',
  contactNumber:'', target:'', status:'pending', actionStatus:'progress',
  priority:'medium', revisitDate:'', orderDetails:'', notes:'',
  fieldCalls:0, faceToFace:0, virtualMeet:0, productDetail:0,
  coordination:0, jointWork:0, coaching:0, training:0,
  subActivity:'', assignedBy:'',
})

// ─────────────────────────────────────────────────────────────
//  FIX 2: localStorage helpers — always use local-timezone key
// ─────────────────────────────────────────────────────────────
const LS_PREFIX = 'wp_v2_'

const lsKey = (planType, startDate) => `${LS_PREFIX}${planType}_${startDate}`

const lsSave = (planType, startDate, payload) => {
  try {
    localStorage.setItem(lsKey(planType, startDate), JSON.stringify({
      ...payload,
      _savedAt: new Date().toISOString(),
    }))
  } catch (e) { /* quota exceeded — ignore */ }
}

const lsLoad = (planType, startDate) => {
  try {
    const raw = localStorage.getItem(lsKey(planType, startDate))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// Hooks
function useWindowSize() {
  const [size, setSize] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1280 })
  useEffect(() => {
    const h = () => setSize({ w: window.innerWidth })
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return size
}

function useApi() {
  const loadPlan = useCallback(async ({ planType, startDate, endDate }) => {
    const url = planType === 'daily'
      ? `/api/daily-plan/${startDate}`
      : `/api/daily-plan/${planType}/${startDate}/${endDate}`
    const token = localStorage.getItem('agentToken')
    const res = await fetch(
      import.meta.env.VITE_API_BASE_URL + url,
      { headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) } }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Load failed')
    return data.plan ?? null
  }, [])

  const savePlan = useCallback(async payload => {
    const token = localStorage.getItem('agentToken')
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/daily-plan/${payload.planType}/upsert`,
      {
        method:  'POST',
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body:    JSON.stringify(payload),
      }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Save failed')
    return data
  }, [])

  return { loadPlan, savePlan }
}

// Shared style primitives
const inputSt = {
  fontSize:12, padding:'6px 8px', border:'1px solid #d0d5dd',
  borderRadius:6, background:'#fff', color:'#222',
  fontFamily:'inherit', width:'100%', boxSizing:'border-box',
}
const btnPrimary = {
  fontSize:12, padding:'7px 14px', borderRadius:6, cursor:'pointer',
  background:'#378ADD', color:'#fff', border:'none',
  fontFamily:'inherit', fontWeight:600, whiteSpace:'nowrap',
}
const btnOutline = {
  fontSize:12, padding:'7px 12px', borderRadius:6, cursor:'pointer',
  background:'#fff', color:'#444', border:'1px solid #d0d5dd',
  fontFamily:'inherit', whiteSpace:'nowrap',
}
const btnDanger = {
  fontSize:12, padding:'7px 12px', borderRadius:6, cursor:'pointer',
  background:'#FCEBEB', color:'#A32D2D', border:'1px solid #F09595',
  fontFamily:'inherit',
}

// Sub-components
const FF = ({ label, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
    <label style={{ fontSize:10, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</label>
    {children}
  </div>
)

const BadgeLabel = ({ label, bg, color }) => (
  <span style={{ fontSize:9, padding:'2px 6px', borderRadius:3, fontWeight:700, background:bg, color, whiteSpace:'nowrap' }}>
    {label}
  </span>
)

// Mini Calendar
const MiniCalendar = ({ month, onPrev, onNext, onClickDay, rangeStart, rangeEnd, taskDates }) => {
  const y=month.getFullYear(), m=month.getMonth()
  const firstDow=(new Date(y,m,1).getDay()||7)-1
  const daysInMonth=new Date(y,m+1,0).getDate()
  const td=todayDate()
  const inRange=d=>rangeStart&&rangeEnd&&d>=rangeStart&&d<=rangeEnd
  const isStart=d=>rangeStart&&d.getTime()===rangeStart.getTime()
  const isEnd=d=>rangeEnd&&d.getTime()===rangeEnd.getTime()
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <button onClick={onPrev} style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#666',padding:'2px 6px' }}>‹</button>
        <span style={{ fontSize:11, fontWeight:700, color:'#333' }}>
          {new Date(y,m,1).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}
        </span>
        <button onClick={onNext} style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#666',padding:'2px 6px' }}>›</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1 }}>
        {['M','T','W','T','F','S','S'].map((l,i)=>(
          <div key={i} style={{ fontSize:9,textAlign:'center',color:'#bbb',padding:'2px 0',fontWeight:700 }}>{l}</div>
        ))}
        {Array(firstDow).fill(null).map((_,i)=><div key={'e'+i}/>)}
        {Array.from({length:daysInMonth},(_,i)=>{
          const dt=new Date(y,m,i+1), ds=toStr(dt)
          const isT=dt.getTime()===td.getTime()
          const s=isStart(dt), e=isEnd(dt), r=inRange(dt)
          const hasTasks=taskDates.has(ds)
          return (
            <div key={i} onClick={()=>onClickDay(dt)} style={{
              fontSize:10,textAlign:'center',padding:'3px 1px',borderRadius:4,cursor:'pointer',position:'relative',
              background:(s||e)?'#378ADD':r?'#dbeeff':isT?'#eaf3ff':'transparent',
              color:(s||e)?'#fff':isT?'#185FA5':'#444',
              fontWeight:(s||e||isT)?700:400,
            }}>
              {i+1}
              {hasTasks&&<span style={{ position:'absolute',bottom:1,left:'50%',transform:'translateX(-50%)',width:3,height:3,borderRadius:'50%',background:(s||e)?'#fff':'#378ADD' }}/>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Activity Form
const ActivityForm = ({ task, onSave, onDelete, onCancel, extraActivities, onAddActivity }) => {
  const [form, setForm] = useState({ ...emptyTask(task?.date||todayStr()), ...task })
  const [customAct, setCustomAct] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const allActivities = [...new Set([...ACTIVITIES, ...extraActivities])]
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSave = () => {
    if (!form.activity) { alert('Please select an activity'); return }
    if (!form.date) { alert('Please select a date'); return }
    onSave({ ...form, locationType: normalizeLocType(form.locationType) })
  }

  const addCustom = () => {
    if (!customAct.trim()) return
    onAddActivity(customAct.trim())
    set('activity', customAct.trim())
    setCustomAct(''); setShowCustom(false)
  }

  const r2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }
  const r3 = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }
  const r4 = { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={r2}>
        <FF label="Date *">
          <input type="date" value={form.date} onChange={e=>set('date',e.target.value)} style={inputSt}/>
        </FF>
        <FF label="Day of Week">
          <select value={form.dayOfWeek} onChange={e=>set('dayOfWeek',e.target.value)} style={inputSt}>
            <option value="">—</option>
            {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d=><option key={d}>{d}</option>)}
          </select>
        </FF>
      </div>

      <div style={r3}>
        <FF label="Time Slot"><select value={form.timeSlot} onChange={e=>set('timeSlot',e.target.value)} style={inputSt}><option value="">—</option>{TIMES.map(t=><option key={t}>{t}</option>)}</select></FF>
        <FF label="Buffer From"><select value={form.bufferFrom} onChange={e=>set('bufferFrom',e.target.value)} style={inputSt}><option value="">—</option>{TIMES.map(t=><option key={t}>{t}</option>)}</select></FF>
        <FF label="Buffer To"><select value={form.bufferTo} onChange={e=>set('bufferTo',e.target.value)} style={inputSt}><option value="">—</option>{TIMES.map(t=><option key={t}>{t}</option>)}</select></FF>
      </div>

      <FF label="Activity *">
        <div style={{ display:'flex', gap:6 }}>
          <select value={form.activity} onChange={e=>set('activity',e.target.value)} style={{...inputSt,flex:1}}>
            <option value="">Select activity…</option>
            {allActivities.map(a=><option key={a}>{a}</option>)}
          </select>
          <button onClick={()=>setShowCustom(s=>!s)} style={{ ...btnOutline, fontSize:11 }}>+ Custom</button>
        </div>
        {showCustom&&(
          <div style={{ display:'flex',gap:6,marginTop:4 }}>
            <input value={customAct} onChange={e=>setCustomAct(e.target.value)} placeholder="New activity name…"
              style={{...inputSt,flex:1}} onKeyDown={e=>e.key==='Enter'&&addCustom()}/>
            <button onClick={addCustom} style={{ ...btnPrimary, fontSize:11 }}>Add</button>
          </div>
        )}
      </FF>

      <FF label="Sub Activity"><input value={form.subActivity} onChange={e=>set('subActivity',e.target.value)} placeholder="Optional detail" style={inputSt}/></FF>

      <div style={r2}>
        <FF label="Location"><input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="Place name" style={inputSt}/></FF>
        <FF label="Location Type">
          <select value={form.locationType} onChange={e=>set('locationType',e.target.value)} style={inputSt}>
            <option value="in-station">In-Station</option>
            <option value="out-station">Out-Station</option>
          </select>
        </FF>
      </div>

      <div style={r2}>
        <FF label="Contact Person"><input value={form.contactPerson} onChange={e=>set('contactPerson',e.target.value)} style={inputSt}/></FF>
        <FF label="Contact Number"><input value={form.contactNumber} onChange={e=>set('contactNumber',e.target.value)} style={inputSt}/></FF>
      </div>

      <div style={r3}>
        <FF label="Status">
          <select value={form.status} onChange={e=>set('status',e.target.value)} style={inputSt}>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </FF>
        <FF label="Priority">
          <select value={form.priority} onChange={e=>set('priority',e.target.value)} style={inputSt}>
            {PRIORITIES.map(p=><option key={p}>{p}</option>)}
          </select>
        </FF>
        <FF label="Action Status">
          <select value={form.actionStatus} onChange={e=>set('actionStatus',e.target.value)} style={inputSt}>
            {ACTION_STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </FF>
      </div>

      {form.actionStatus==='revisit-required'&&(
        <FF label="Revisit Date"><input type="date" value={form.revisitDate} onChange={e=>set('revisitDate',e.target.value)} style={inputSt}/></FF>
      )}

      <div style={r4}>
        {[['fieldCalls','Field Calls'],['faceToFace','Face-to-Face'],['virtualMeet','Virtual'],['productDetail','Products']].map(([k,l])=>(
          <FF key={k} label={l}><input type="number" min="0" value={form[k]} onChange={e=>set(k,parseInt(e.target.value)||0)} style={inputSt}/></FF>
        ))}
      </div>

      <div style={r4}>
        {[['coordination','Coordination'],['jointWork','Joint Work'],['coaching','Coaching'],['training','Training']].map(([k,l])=>(
          <FF key={k} label={l}><input type="number" min="0" value={form[k]} onChange={e=>set(k,parseInt(e.target.value)||0)} style={inputSt}/></FF>
        ))}
      </div>

      <div style={r2}>
        <FF label="Target"><input value={form.target} onChange={e=>set('target',e.target.value)} placeholder="e.g. 5 visits" style={inputSt}/></FF>
        <FF label="Order / Revenue (₹)"><input value={form.orderDetails} onChange={e=>set('orderDetails',e.target.value)} placeholder="Product | 5000" style={inputSt}/></FF>
      </div>

      <FF label="Assigned By"><input value={form.assignedBy} onChange={e=>set('assignedBy',e.target.value)} placeholder="Manager / Admin / HR" style={inputSt}/></FF>

      <FF label="Notes">
        <textarea value={form.notes} onChange={e=>set('notes',e.target.value)}
          rows={3} placeholder="Summary, achievements, challenges…"
          style={{...inputSt,resize:'vertical',minHeight:60}}/>
      </FF>

      <div style={{ display:'flex', gap:8, paddingTop:4, flexWrap:'wrap' }}>
        {onDelete&&<button onClick={onDelete} style={btnDanger}>Delete</button>}
        <button onClick={onCancel} style={{ ...btnOutline, marginLeft:onDelete?0:'auto' }}>Cancel</button>
        <button onClick={handleSave} style={btnPrimary}>Save Activity</button>
      </div>
    </div>
  )
}

// Day Cell
const DayCell = ({ date, tasks, isCurrentMonth, isToday, isInRange, onClick, onTaskClick, compact }) => {
  const ds = toStr(date)
  const dayTasks = tasks.filter(t=>t.date===ds)
  const maxChips = compact ? 1 : 3
  return (
    <div
      onClick={()=>onClick(date)}
      style={{
        borderRight:'0.5px solid #ececec', minHeight:compact?58:90,
        padding:compact?'3px 2px':'4px', cursor:'pointer',
        background:isInRange?'rgba(55,138,221,0.04)':'#fff',
        opacity:isCurrentMonth?1:0.3, transition:'background 0.1s', overflow:'hidden',
      }}
      onMouseEnter={e=>e.currentTarget.style.background=isInRange?'rgba(55,138,221,0.09)':'#f7f9fc'}
      onMouseLeave={e=>e.currentTarget.style.background=isInRange?'rgba(55,138,221,0.04)':'#fff'}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
        <span style={{
          width:18, height:18, borderRadius:'50%', display:'flex',
          alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700,
          background:isToday?'#378ADD':'transparent', color:isToday?'#fff':'#555',
          flexShrink:0,
        }}>{date.getDate()}</span>
        {dayTasks.length>0&&(
          <span style={{ fontSize:9, color:'#378ADD', background:'#E6F1FB', borderRadius:3, padding:'0 3px', fontWeight:700 }}>
            {dayTasks.length}
          </span>
        )}
      </div>
      {dayTasks.slice(0,maxChips).map(t=>{
        const sc=STATUS_COLORS[t.status]||STATUS_COLORS.pending
        return (
          <div key={t.id} onClick={e=>{e.stopPropagation();onTaskClick(t)}} style={{
            fontSize:9, padding:'1px 4px', borderRadius:3, marginBottom:2,
            background:sc.bg, color:sc.color,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            cursor:'pointer', fontWeight:600,
          }} title={t.activity+(t.location?' @ '+t.location:'')}>
            {!compact&&t.timeSlot?t.timeSlot+' · ':''}{t.activity||'Untitled'}
          </div>
        )
      })}
      {dayTasks.length>maxChips&&(
        <div style={{ fontSize:9, color:'#bbb' }}>+{dayTasks.length-maxChips}</div>
      )}
    </div>
  )
}

// Slide Panel
const SlidePanel = ({ open, title, onClose, children, fullWidth }) => {
  const panelW = fullWidth ? '100vw' : Math.min(400, window.innerWidth)
  return (
    <>
      {open&&<div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.2)',zIndex:30 }}/>}
      <div style={{
        position:'fixed', right:0, top:0, bottom:0, width:panelW,
        background:'#fff', borderLeft:'1px solid #e0e0e0',
        display:'flex', flexDirection:'column', zIndex:40,
        transform:open?'translateX(0)':'translateX(100%)',
        transition:'transform 0.22s cubic-bezier(.4,0,.2,1)',
        boxShadow:open?'-4px 0 24px rgba(0,0,0,0.1)':'none',
      }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #ebebeb', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontWeight:700, fontSize:13, flex:1, color:'#222' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#888',lineHeight:1 }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>{children}</div>
      </div>
    </>
  )
}

// Toast
const Toast = ({ msg, type='success' }) => {
  if (!msg) return null
  const C = {
    success:{ bg:'#E1F5EE', color:'#0F6E56', border:'#9FE1CB' },
    error:  { bg:'#FCEBEB', color:'#A32D2D', border:'#F09595' },
    info:   { bg:'#E6F1FB', color:'#185FA5', border:'#B5D4F4' },
    warn:   { bg:'#FEF3C7', color:'#92400E', border:'#FCD34D' },
  }
  const c = C[type]||C.info
  return (
    <div style={{
      position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
      background:c.bg, color:c.color, border:`1px solid ${c.border}`,
      borderRadius:8, padding:'9px 20px', fontSize:12, fontWeight:600,
      zIndex:100, boxShadow:'0 4px 20px rgba(0,0,0,0.12)', pointerEvents:'none',
      whiteSpace:'nowrap',
    }}>{msg}</div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function WorkingPlan({ planTypeKey }) {
  const { w } = useWindowSize()
  const mob   = w < 640
  const tab   = w >= 640 && w < 1024
  const { loadPlan, savePlan } = useApi()

  // ── FIX 3: Read planTypeKey prop (was ignored before)
  const [planType, setPlanType] = useState(() => planTypeKey || 'daily')
  useEffect(() => {
    if (planTypeKey && planTypeKey !== planType) setPlanType(planTypeKey)
  }, [planTypeKey])

  const [tasks,           setTasks]           = useState([])
  const [extraActivities, setExtraActivities] = useState([])
  const [calMonth,        setCalMonth]        = useState(()=>{ const d=new Date(); d.setDate(1); return d })
  const [rangeStart,      setRangeStart]      = useState(todayDate)
  const [rangeEnd,        setRangeEnd]        = useState(todayDate)
  const [panelMode,       setPanelMode]       = useState(null)
  const [selectedDate,    setSelectedDate]    = useState(null)
  const [editTask,        setEditTask]        = useState(null)
  const [dayViewDate,     setDayViewDate]     = useState(null)
  const [searchQ,         setSearchQ]         = useState('')
  const [filterStatus,    setFilterStatus]    = useState('all')
  const [agentInfo,       setAgentInfo]       = useState({ name:'', id:'', region:'', manager:'' })
  const [loading,         setLoading]         = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [planExists,      setPlanExists]      = useState(false)
  const [toast,           setToast]           = useState({ msg:'', type:'success' })
  const [sidebarOpen,     setSidebarOpen]     = useState(!mob)
  const [weeklyMetrics,   setWeeklyMetrics]   = useState({ achievements:'', challenges:'', nextWeekPlan:'' })
  const [endOfDayReport,  setEndOfDayReport]  = useState('')
  const [superiorNotes,   setSuperiorNotes]   = useState('')
  const [dailyTarget,     setDailyTarget]     = useState({ calls:0, visits:0, conversions:0, revenue:0 })

  // ── FIX 4: Track unsaved changes
  const [hasUnsaved,      setHasUnsaved]      = useState(false)
  const [autoSaveStatus,  setAutoSaveStatus]  = useState('') // 'saved' | 'saving' | 'error'

  const toastTimer    = useRef(null)
  const autoSaveTimer = useRef(null)
  const isFirstLoad   = useRef(true)

  const flash = (msg, type='success') => {
    setToast({ msg, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(()=>setToast({ msg:'',type:'success' }), 3200)
  }

  useEffect(()=>setSidebarOpen(!mob), [mob])

  // ─────────────────────────────────────────────────────────────
  //  FIX 5: Compute rangeEnd and startDate SYNCHRONOUSLY,
  //  avoid the double-fetch caused by two separate useEffects.
  //  Instead of: effect1 → setRangeEnd → re-render → effect2 runs twice
  //  We compute rangeEnd inline when planType/rangeStart changes.
  // ─────────────────────────────────────────────────────────────
  const computedRangeEnd = (() => {
    const end = new Date(rangeStart)
    end.setDate(rangeStart.getDate() + PLAN_TYPES[planType].period - 1)
    return end
  })()
  const startDateStr = toStr(rangeStart)
  const endDateStr   = toStr(computedRangeEnd)

  // Keep rangeEnd state in sync (needed for calendar highlight)
  useEffect(() => {
    setRangeEnd(computedRangeEnd)
  }, [planType, startDateStr]) // eslint-disable-line

  // ─────────────────────────────────────────────────────────────
  //  FIX 6: fetchPlan now uses computed dates directly
  //  (no stale closure on rangeEnd)
  // ─────────────────────────────────────────────────────────────
  const fetchPlan = useCallback(async (pType, sDate, eDate) => {
    setLoading(true)

    // ── FIX 7: Load from localStorage IMMEDIATELY while API loads
    const cached = lsLoad(pType, sDate)
    if (cached?.tasks?.length) {
      setTasks(cached.tasks)
      setDailyTarget(cached.dailyTarget || { calls:0,visits:0,conversions:0,revenue:0 })
      setWeeklyMetrics(cached.weeklyMetrics || { achievements:'',challenges:'',nextWeekPlan:'' })
      setEndOfDayReport(cached.endOfDayReport || '')
      setSuperiorNotes(cached.superiorNotes || '')
      setExtraActivities(cached.extraActivities || [])
      setAgentInfo(cached.agentInfo || { name:'', id:'', region:'', manager:'' })
      setPlanExists(true)
    }

    try {
      const plan = await loadPlan({ planType: pType, startDate: sDate, endDate: eDate })
      if (plan) {
        setPlanExists(true)
        setAgentInfo({
          name: plan.agentName || '', id: plan.agentId || '',
          region: plan.agentRegion || '', manager: plan.reportingManager || ''
        })
        const serverTasks = (plan.tasks||[]).map(t=>({
          ...emptyTask(),
          ...t,
          id: t.id || t._id?.toString() || uid(),
          locationType: normalizeLocType(t.locationType),
        }))
        setTasks(serverTasks)
        setDailyTarget(plan.dailyTarget || { calls:0,visits:0,conversions:0,revenue:0 })
        setWeeklyMetrics(plan.weeklyMetrics || { achievements:'',challenges:'',nextWeekPlan:'' })
        setEndOfDayReport(plan.endOfDayReport || '')
        setSuperiorNotes(plan.superiorNotes || '')
        setExtraActivities(plan.extraActivities || [])
        setHasUnsaved(false)
        // Update localStorage with fresh server data
        lsSave(pType, sDate, { tasks: serverTasks, dailyTarget: plan.dailyTarget, weeklyMetrics: plan.weeklyMetrics, endOfDayReport: plan.endOfDayReport, superiorNotes: plan.superiorNotes, extraActivities: plan.extraActivities, agentInfo: { name:plan.agentName||'', id:plan.agentId||'', region:plan.agentRegion||'', manager:plan.reportingManager||'' } })
      } else if (!cached?.tasks?.length) {
        // Only clear if no cached data either
        setPlanExists(false)
        setTasks([])
      }
    } catch (err) {
      if (!cached?.tasks?.length) {
        flash('Could not reach server. ' + err.message, 'error')
      } else {
        flash('Offline — showing cached data', 'warn')
      }
    } finally {
      setLoading(false)
      isFirstLoad.current = false
    }
  }, [loadPlan])

  // ── Fetch whenever planType or startDate changes
  useEffect(() => {
    setHasUnsaved(false)
    fetchPlan(planType, startDateStr, endDateStr)
  }, [planType, startDateStr]) // eslint-disable-line

  // ─────────────────────────────────────────────────────────────
  //  FIX 8: Auto-save to localStorage whenever tasks change
  //  (debounced 800ms) — this is the main fix for data loss
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isFirstLoad.current) return   // don't auto-save on initial load
    if (tasks.length === 0 && !hasUnsaved) return  // nothing new to save

    setHasUnsaved(true)
    clearTimeout(autoSaveTimer.current)

    autoSaveTimer.current = setTimeout(() => {
      const payload = buildPayload()
      lsSave(planType, startDateStr, payload)
      setAutoSaveStatus('saved')
      setTimeout(()=>setAutoSaveStatus(''), 2000)
    }, 800)

    return () => clearTimeout(autoSaveTimer.current)
  }, [tasks, weeklyMetrics, endOfDayReport, superiorNotes, dailyTarget]) // eslint-disable-line

  // Build payload for both auto-save and server save
  const buildPayload = () => ({
    planType,
    startDate: startDateStr,
    endDate:   endDateStr,
    date:      startDateStr,
    agentName: agentInfo.name, agentId: agentInfo.id,
    agentRegion: agentInfo.region, reportingManager: agentInfo.manager,
    dailyTarget, weeklyMetrics, endOfDayReport, superiorNotes, extraActivities,
    agentInfo,
    tasks: tasks.map(t=>({ ...t, locationType: normalizeLocType(t.locationType) })),
  })

  const handleSavePlan = async () => {
    setSaving(true)
    const payload = buildPayload()
    lsSave(planType, startDateStr, payload)   // always cache first
    try {
      const result = await savePlan(payload)
      if (result?.plan?.tasks) {
        setTasks(result.plan.tasks.map(t=>({
          ...emptyTask(),
          ...t,
          id: t.id || t._id?.toString() || uid(),
          locationType: normalizeLocType(t.locationType),
        })))
      }
      setPlanExists(true)
      setHasUnsaved(false)
      flash('Plan saved to server ✓')
    } catch (err) {
      flash('Server error — saved locally. ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const upsertTask = task => setTasks(prev=>{
    const i=prev.findIndex(t=>t.id===task.id)
    return i>=0 ? prev.map(t=>t.id===task.id?task:t) : [...prev, task]
  })
  const removeTask = id => setTasks(prev=>prev.filter(t=>t.id!==id))

  const handleSaveTask = task => {
    upsertTask(task)
    flash(editTask ? 'Activity updated.' : 'Activity added.')
    setPanelMode(null); setEditTask(null)
  }
  const handleDeleteTask = () => {
    if (!editTask||!window.confirm('Delete this activity?')) return
    removeTask(editTask.id); flash('Activity deleted.'); setPanelMode(null); setEditTask(null)
  }

  const handleDayClick     = useCallback(date=>{ setDayViewDate(date); setSelectedDate(toStr(date)); setPanelMode('day') }, [])
  const handleTaskClick    = useCallback(task=>{ setEditTask(task); setPanelMode('edit') }, [])
  const handleMiniCalClick = date=>{ setRangeStart(new Date(date)); setCalMonth(new Date(date.getFullYear(),date.getMonth(),1)); setSelectedDate(toStr(date)) }

  const exportCSV = () => {
    const hdr=['Date','Day','Time Slot','Activity','Sub Activity','Location','Location Type','Contact Person','Contact Number','Target','Status','Action Status','Priority','Field Calls','Face-to-Face','Virtual Meet','Products','Coordination','Joint Work','Coaching','Training','Order Details','Notes']
    const rows=filtered.map(t=>[t.date,t.dayOfWeek,t.timeSlot,t.activity,t.subActivity,t.location,t.locationType,t.contactPerson,t.contactNumber,t.target,t.status,t.actionStatus,t.priority,t.fieldCalls,t.faceToFace,t.virtualMeet,t.productDetail,t.coordination,t.jointWork,t.coaching,t.training,t.orderDetails,t.notes].map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`).join(','))
    const blob=new Blob([[hdr.join(','),...rows].join('\n')],{type:'text/csv'})
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`working-plan-${startDateStr}.csv`; a.click()
  }

  // Derived
  const isInRange = d => d >= rangeStart && d <= computedRangeEnd
  const total     = tasks.length
  const completed = tasks.filter(t=>t.status==='completed').length
  const inProg    = tasks.filter(t=>t.status==='in-progress').length
  const pend      = tasks.filter(t=>t.status==='pending').length
  const calls     = tasks.reduce((s,t)=>s+(t.fieldCalls||0),0)
  const revenue   = tasks.reduce((s,t)=>{ const v=parseFloat((t.orderDetails||'').split('|')[1]); return s+(isNaN(v)?0:v) },0)
  const pct       = total>0?Math.round(completed/total*100):0
  const taskDates = new Set(tasks.map(t=>t.date))

  const filtered = tasks.filter(t=>{
    if (filterStatus!=='all'&&t.status!==filterStatus) return false
    if (searchQ&&!t.activity?.toLowerCase().includes(searchQ.toLowerCase())&&!t.location?.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  // Calendar grid
  const y=calMonth.getFullYear(), m=calMonth.getMonth()
  const gridStart=getMonday(new Date(y,m,1))
  const gridEnd=new Date(getMonday(new Date(y,m+1,0))); gridEnd.setDate(gridEnd.getDate()+6)
  const weeks=[]; let cur=new Date(gridStart)
  while(cur<=gridEnd){ const wk=[]; for(let i=0;i<7;i++){wk.push(new Date(cur));cur.setDate(cur.getDate()+1)} weeks.push(wk) }

  const planLabel    = PLAN_TYPES[planType].label
  const dateRangeStr = PLAN_TYPES[planType].period===1 ? startDateStr : `${startDateStr} → ${endDateStr}`
  const panelTitle   = panelMode==='edit'?'Edit Activity':panelMode==='add'?`Add — ${selectedDate||''}`:dayViewDate?toStr(dayViewDate):''
  const calCols      = `${mob?28:44}px repeat(7,1fr)`

  return (
    <div style={{ display:'flex', height:'100dvh', fontFamily:'system-ui,-apple-system,sans-serif', background:'#f4f5f8', color:'#222', overflow:'hidden', position:'relative' }}>
      <style>{`
        *{box-sizing:border-box}
        input:focus,select:focus,textarea:focus{outline:2px solid #378ADD;outline-offset:-1px;border-color:#378ADD!important}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#d0d5dd;border-radius:4px}
        button:active{transform:scale(0.97)}
      `}</style>

      {/* ── SIDEBAR ── */}
      {(sidebarOpen||!mob)&&(
        <>
          {mob&&<div onClick={()=>setSidebarOpen(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',zIndex:25 }}/>}
          <div style={{
            width:mob?Math.min(290,w*0.82):tab?220:252,
            background:'#fff', borderRight:'1px solid #e4e8ef',
            display:'flex', flexDirection:'column', overflowY:'auto',
            position:mob?'fixed':'relative',
            left:0, top:0, bottom:0, zIndex:mob?26:1, flexShrink:0,
          }}>

            {/* Agent */}
            <div style={{ padding:'12px 14px', borderBottom:'1px solid #ebebeb' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#bbb', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', justifyContent:'space-between' }}>
                Agent Info
                {mob&&<button onClick={()=>setSidebarOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#bbb',lineHeight:1 }}>×</button>}
              </div>
              {[['name','Agent Name'],['id','Agent ID'],['region','Region'],['manager','Manager']].map(([k,ph])=>(
                <input key={k} value={agentInfo[k]} onChange={e=>setAgentInfo(a=>({...a,[k]:e.target.value}))}
                  placeholder={ph} style={{ ...inputSt, marginBottom:5, fontSize:11, padding:'5px 7px' }}/>
              ))}
            </div>

            {/* Plan Type */}
            <div style={{ padding:'10px 14px', borderBottom:'1px solid #ebebeb' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#bbb', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Plan Type</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                {Object.entries(PLAN_TYPES).map(([k,v])=>(
                  <button key={k} onClick={()=>{ setPlanType(k); if(mob)setSidebarOpen(false) }} style={{
                    fontSize:10, padding:'5px 4px', border:'1px solid',
                    borderColor:planType===k?'#378ADD':'#e0e0e0',
                    borderRadius:6, cursor:'pointer', fontFamily:'inherit', textAlign:'center',
                    background:planType===k?'#E6F1FB':'#fff',
                    color:planType===k?'#185FA5':'#777',
                    fontWeight:planType===k?700:400,
                  }}>
                    {k==='station'?'PJP':k==='outstations'?'STP':v.label.replace(' Plan','').replace(' Program','')}
                  </button>
                ))}
              </div>
            </div>

            {/* Mini Cal */}
            {!mob&&(
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #ebebeb' }}>
                <MiniCalendar month={calMonth}
                  onPrev={()=>setCalMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}
                  onNext={()=>setCalMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}
                  onClickDay={handleMiniCalClick}
                  rangeStart={rangeStart} rangeEnd={computedRangeEnd} taskDates={taskDates}/>
              </div>
            )}

            {/* Targets */}
            <div style={{ padding:'10px 14px', borderBottom:'1px solid #ebebeb' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#bbb', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Targets</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[['calls','Calls'],['visits','Visits'],['conversions','Conversions'],['revenue','Revenue ₹']].map(([k,l])=>(
                  <FF key={k} label={l}>
                    <input type="number" min="0" value={dailyTarget[k]||0} onChange={e=>setDailyTarget(p=>({...p,[k]:Number(e.target.value)||0}))}
                      style={{ ...inputSt, fontSize:11, padding:'4px 6px' }}/>
                  </FF>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding:'10px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#bbb', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Summary</div>
              {[['Total',total,null],['Completed',completed,pct],['In Progress',inProg,null],['Pending',pend,null],['Field Calls',calls,null],['Revenue',`₹${revenue.toLocaleString('en-IN')}`,null]].map(([l,v,p])=>(
                <div key={l} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:10, color:'#999' }}>{l}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#333' }}>{v}{p!=null?` (${p}%)`:''}</span>
                  </div>
                  {p!=null&&<div style={{ height:3, background:'#eee', borderRadius:2 }}><div style={{ height:'100%',width:`${p}%`,background:'#378ADD',borderRadius:2,transition:'width 0.3s' }}/></div>}
                </div>
              ))}
            </div>

            {/* Period Report */}
            <div style={{ padding:'10px 14px', borderTop:'1px solid #ebebeb' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#bbb', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Period Notes</div>
              {[['achievements','Achievements'],['challenges','Challenges'],['nextWeekPlan','Next Period']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:6 }}>
                  <FF label={l}>
                    <textarea value={weeklyMetrics[k]} onChange={e=>setWeeklyMetrics(p=>({...p,[k]:e.target.value}))}
                      rows={2} style={{ ...inputSt, fontSize:11, resize:'vertical' }}/>
                  </FF>
                </div>
              ))}
              <div style={{ marginBottom:6 }}>
                <FF label="End of Period Summary">
                  <textarea value={endOfDayReport} onChange={e=>setEndOfDayReport(e.target.value)} rows={2} style={{ ...inputSt, fontSize:11, resize:'vertical' }}/>
                </FF>
              </div>
              <FF label="Superior Notes">
                <textarea value={superiorNotes} onChange={e=>setSuperiorNotes(e.target.value)} rows={2} style={{ ...inputSt, fontSize:11, resize:'vertical' }}/>
              </FF>
            </div>

            {/* Save */}
            <div style={{ padding:'10px 14px', borderTop:'1px solid #ebebeb' }}>
              <button onClick={handleSavePlan} disabled={saving} style={{ ...btnPrimary, width:'100%', padding:'9px', fontSize:13 }}>
                {saving ? 'Saving…' : planExists ? '↑ Update Plan on Server' : '↑ Save Plan to Server'}
              </button>

              {/* ── FIX: Save status indicators ── */}
              <div style={{ textAlign:'center', marginTop:5, fontSize:10 }}>
                {autoSaveStatus === 'saved' && (
                  <span style={{ color:'#0F6E56' }}>✓ Auto-saved locally</span>
                )}
                {hasUnsaved && autoSaveStatus !== 'saved' && (
                  <span style={{ color:'#854F0B' }}>● Unsaved changes — click Save to sync server</span>
                )}
                {!hasUnsaved && planExists && (
                  <span style={{ color:'#0F6E56' }}>✓ Synced with server</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Header */}
        <div style={{ padding:mob?'8px 10px':'10px 16px', background:'#fff', borderBottom:'1px solid #e4e8ef', display:'flex', alignItems:'center', gap:mob?6:10, flexWrap:'wrap', flexShrink:0 }}>
          {mob&&<button onClick={()=>setSidebarOpen(true)} style={{ ...btnOutline, padding:'6px 10px', fontSize:16 }}>☰</button>}
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:mob?12:14, fontWeight:700, color:'#222' }}>
              {planLabel}
              {planExists && !hasUnsaved && <span style={{ fontSize:9, background:'#E1F5EE', color:'#0F6E56', borderRadius:3, padding:'1px 6px', marginLeft:6, fontWeight:700 }}>SAVED</span>}
              {/* ── FIX: show unsaved badge ── */}
              {hasUnsaved && <span style={{ fontSize:9, background:'#FEF3C7', color:'#92400E', borderRadius:3, padding:'1px 6px', marginLeft:6, fontWeight:700 }}>UNSAVED</span>}
              {loading && <span style={{ fontSize:9, background:'#E6F1FB', color:'#185FA5', borderRadius:3, padding:'1px 6px', marginLeft:6, fontWeight:700 }}>LOADING…</span>}
            </div>
            <div style={{ fontSize:10, color:'#999', marginTop:1 }}>
              {agentInfo.name&&<span style={{ color:'#378ADD', fontWeight:700, marginRight:6 }}>{agentInfo.name}</span>}
              {dateRangeStr}
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button onClick={()=>setCalMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} style={{ ...btnOutline, padding:'5px 9px' }}>‹</button>
            <span style={{ fontSize:12, fontWeight:700, minWidth:mob?80:110, textAlign:'center', color:'#333' }}>
              {calMonth.toLocaleDateString('en-IN',{month:mob?'short':'long',year:'numeric'})}
            </span>
            <button onClick={()=>setCalMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} style={{ ...btnOutline, padding:'5px 9px' }}>›</button>
          </div>

          {!mob&&<button onClick={()=>setCalMonth(new Date(todayDate().getFullYear(),todayDate().getMonth(),1))} style={{ ...btnOutline, fontSize:11 }}>Today</button>}
          {!mob&&<button onClick={exportCSV} style={{ ...btnOutline, fontSize:11 }}>Export CSV</button>}
          <button onClick={()=>{ setSelectedDate(selectedDate||todayStr()); setEditTask(null); setPanelMode('add') }}
            style={{ ...btnPrimary, fontSize:mob?11:12, padding:mob?'6px 10px':'7px 14px' }}>
            {mob?'+ Add':'+ Add Activity'}
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ padding:mob?'6px 10px':'7px 16px', background:'#f9fafc', borderBottom:'1px solid #ebebeb', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', flexShrink:0 }}>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder={mob?'Search…':'Search activity or location…'}
            style={{ ...inputSt, width:mob?110:180, fontSize:11, padding:'5px 8px' }}/>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            style={{ ...inputSt, width:mob?100:140, fontSize:11, padding:'5px 7px' }}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
          <span style={{ fontSize:10, color:'#bbb' }}>{filtered.length}/{total}</span>
          {!mob&&(
            <button onClick={()=>{ if(window.confirm('Clear all activities?')){ setTasks([]); flash('Cleared.') } }}
              style={{ ...btnOutline, fontSize:11, marginLeft:'auto', color:'#A32D2D', borderColor:'#F09595' }}>Clear All</button>
          )}
        </div>

        {/* Calendar */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:calCols, background:'#f9fafc', borderBottom:'1px solid #e4e8ef', position:'sticky', top:0, zIndex:3, minWidth:mob?380:undefined }}>
            <div style={{ borderRight:'0.5px solid #ececec', padding:'6px 2px', fontSize:9, color:'#ccc', textAlign:'center' }}>Wk</div>
            {WEEK_DAYS.map(d=>(
              <div key={d} style={{ borderRight:'0.5px solid #ececec', padding:'6px 2px', fontSize:mob?9:10, fontWeight:700, color:'#777', textAlign:'center' }}>{d}</div>
            ))}
          </div>
          <div style={{ minWidth:mob?380:undefined }}>
            {weeks.map((week,wi)=>(
              <div key={wi} style={{ display:'grid', gridTemplateColumns:calCols, borderBottom:'0.5px solid #ececec' }}>
                <div style={{ borderRight:'0.5px solid #ececec', padding:'6px 2px', fontSize:9, color:'#ccc', textAlign:'center', paddingTop:8 }}>W{getWeekNum(week[0])}</div>
                {week.map((date,di)=>{
                  const td2=todayDate()
                  return <DayCell key={di} date={date} tasks={filtered} isCurrentMonth={date.getMonth()===m} isToday={date.getTime()===td2.getTime()} isInRange={isInRange(date)} onClick={handleDayClick} onTaskClick={handleTaskClick} compact={mob||tab}/>
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ padding:'6px 16px', background:'#fff', borderTop:'1px solid #ebebeb', display:'flex', gap:8, alignItems:'center', fontSize:10, color:'#999', flexShrink:0 }}>
          <span>{total} activit{total===1?'y':'ies'} · {completed} completed · {calls} calls · ₹{revenue.toLocaleString('en-IN')}</span>
          {mob&&<button onClick={exportCSV} style={{ ...btnOutline, fontSize:10, marginLeft:'auto', padding:'4px 10px' }}>Export</button>}
          {/* ── FIX: mobile quick-save button ── */}
          {mob&&hasUnsaved&&(
            <button onClick={handleSavePlan} disabled={saving}
              style={{ ...btnPrimary, fontSize:10, padding:'4px 10px', background:'#d97706' }}>
              {saving?'…':'Save ↑'}
            </button>
          )}
        </div>
      </div>

      {/* Slide Panel */}
      <SlidePanel open={!!panelMode} title={panelTitle} onClose={()=>{ setPanelMode(null); setEditTask(null) }} fullWidth={mob}>
        {panelMode==='day'&&dayViewDate&&(()=>{
          const ds=toStr(dayViewDate)
          const dayTasks=tasks.filter(t=>t.date===ds)
          return (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontSize:12, color:'#777' }}>{dayTasks.length} activit{dayTasks.length===1?'y':'ies'}</span>
                <button onClick={()=>{ setSelectedDate(ds); setEditTask(null); setPanelMode('add') }} style={{ ...btnPrimary, fontSize:11 }}>+ Add</button>
              </div>
              {dayTasks.length===0?(
                <div style={{ textAlign:'center', color:'#ccc', fontSize:12, padding:'40px 0' }}>
                  No activities.<br/>
                  <button onClick={()=>{ setSelectedDate(ds); setEditTask(null); setPanelMode('add') }} style={{ ...btnPrimary, marginTop:12, fontSize:11 }}>Add Activity</button>
                </div>
              ):dayTasks.map(t=>{
                const sc=STATUS_COLORS[t.status]||STATUS_COLORS.pending
                const pc=PRIORITY_COLORS[t.priority]||PRIORITY_COLORS.medium
                return (
                  <div key={t.id} onClick={()=>handleTaskClick(t)} style={{
                    padding:'10px 12px', border:'1px solid #e8e8e8', borderRadius:8,
                    marginBottom:8, cursor:'pointer', background:'#fff',
                  }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='#378ADD'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='#e8e8e8'}
                  >
                    <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:700, fontSize:12, flex:1 }}>{t.activity||'Untitled'}</span>
                      <BadgeLabel label={t.priority} {...pc}/> <BadgeLabel label={t.status} {...sc}/>
                    </div>
                    <div style={{ fontSize:10, color:'#999', display:'flex', gap:8, flexWrap:'wrap' }}>
                      {t.timeSlot&&<span>🕐 {t.timeSlot}</span>}
                      {t.location&&<span>📍 {t.location}</span>}
                      {t.contactPerson&&<span>👤 {t.contactPerson}</span>}
                    </div>
                    {t.notes&&<div style={{ fontSize:10, color:'#bbb', marginTop:4, fontStyle:'italic' }}>{t.notes.slice(0,80)}{t.notes.length>80?'…':''}</div>}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {(panelMode==='add'||panelMode==='edit')&&(
          <ActivityForm
            task={panelMode==='edit'?editTask:{ ...emptyTask(selectedDate||todayStr()) }}
            onSave={handleSaveTask}
            onDelete={panelMode==='edit'?handleDeleteTask:null}
            onCancel={()=>{ setPanelMode(null); setEditTask(null) }}
            extraActivities={extraActivities}
            onAddActivity={a=>setExtraActivities(x=>[...new Set([...x,a])])}
          />
        )}
      </SlidePanel>

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  )
}