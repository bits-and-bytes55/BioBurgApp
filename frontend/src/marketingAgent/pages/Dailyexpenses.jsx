// pages/DailyExpenses.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Grid, TextField, MenuItem, Button, Typography,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  IconButton, Chip, CircularProgress, Alert, LinearProgress,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, useMediaQuery, useTheme,
} from '@mui/material'
import { Add, Delete, AttachMoney, Receipt, FileDownload, Refresh, Save, Send, CheckCircle, Cancel, History, WarningAmber, ArrowBackIos, ArrowForwardIos } from '@mui/icons-material'
import PageShell from './Pageshell'

const BASE = import.meta.env.VITE_API_BASE_URL;

const DEFAULT_CATEGORIES = [
  'Travel (Auto / Cab)', 'Travel (Train / Bus)', 'Travel (Flight)',
  'Fuel / Petrol', 'Food & Meals', 'Accommodation / Hotel',
  'Samples Courier', 'Stationery & Printing', 'Phone / Internet',
  'Doctor Gift / Promo Material', 'Parking / Toll', 'Miscellaneous',
]

const STATUS_COLOR = { draft:'default', submitted:'primary', approved:'success', rejected:'error' }
const STATUS_LABEL = { draft:'Draft', submitted:'Submitted', approved:'Approved', rejected:'Rejected' }

const todayStr   = () => new Date().toISOString().slice(0, 10)
const monthLabel = (y, m) => new Date(y, m - 1).toLocaleString('en-IN', { month:'long', year:'numeric' })
const formatINR  = (n) => `₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const emptyEntry = () => ({ _localId: Date.now()+Math.random(), category:'', amount:'', description:'', hasReceipt:false, vendor:'', billNumber:'' })

const StatCard = ({ label, value, sub, color, icon }) => (
  <Paper elevation={0} sx={{ p:{xs:1.8,sm:2.5}, borderRadius:3, border:'1px solid', borderColor:'divider', display:'flex', alignItems:'center', gap:2, height:'100%' }}>
    <Box sx={{ width:44, height:44, borderRadius:2, flexShrink:0, bgcolor:color+'18', display:'flex', alignItems:'center', justifyContent:'center', color }}>{icon}</Box>
    <Box>
      <Typography sx={{ fontSize:10, fontWeight:700, color:'text.secondary', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</Typography>
      <Typography sx={{ fontSize:{xs:16,sm:20}, fontWeight:800, lineHeight:1.1, color:'text.primary' }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize:11, color:'text.secondary', mt:0.2 }}>{sub}</Typography>}
    </Box>
  </Paper>
)

export default function DailyExpenses() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [date,      setDate]      = useState(todayStr())
  const [record,    setRecord]    = useState(null)
  const [entries,   setEntries]   = useState([emptyEntry()])
  const [notes,     setNotes]     = useState('')
  const [status,    setStatus]    = useState('draft')

  const now = new Date()
  const [year,      setYear]      = useState(now.getFullYear())
  const [month,     setMonth]     = useState(now.getMonth()+1)
  const [summary,   setSummary]   = useState(null)   
  const [monthRecs, setMonthRecs] = useState([])

  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [categories,  setCategories]  = useState(DEFAULT_CATEGORIES)
  const [addCatOpen,  setAddCatOpen]  = useState(false)
  const [newCat,      setNewCat]      = useState('')
  const [entryErrors, setEntryErrors] = useState({})

  const token   = localStorage.getItem('agentToken')
  const headers = { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }

  //  Load day's expense 
  const loadExpense = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${BASE}/api/expenses/${date}`, { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      const r = data.expense
      setRecord(r)
      setEntries(r.entries?.length
        ? r.entries.map(e => ({ ...e, _localId: e._id || Date.now()+Math.random() }))
        : [emptyEntry()])
      setNotes(r.notes || '')
      setStatus(r.status || 'draft')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [date])

  // Load month summary — budget comes from here (real DB value) 
  const loadSummary = useCallback(async () => {
    try {
      const [sumRes, recRes] = await Promise.all([
        fetch(`${BASE}/api/expenses/summary/${year}/${month}`, { headers }),
        fetch(`${BASE}/api/expenses/month/${year}/${month}`,   { headers }),
      ])
      const [sumData, recData] = await Promise.all([sumRes.json(), recRes.json()])
      if (sumData.success) setSummary(sumData.summary)
      setMonthRecs(recData.records || [])
    } catch {}
  }, [year, month])

useEffect(() => { loadExpense() }, [loadExpense])
useEffect(() => { loadSummary() }, [loadSummary])

useEffect(() => {
  if (status !== 'submitted') return
  const interval = setInterval(() => {
    loadExpense()
    loadSummary()
  }, 30000)
  return () => clearInterval(interval)
}, [status, loadExpense, loadSummary])

  //  Entry helpers 
  const addEntry    = () => setEntries(p => [...p, emptyEntry()])
  const removeEntry = (id) => setEntries(p => p.filter(e => e._localId !== id))
  const updateEntry = (id, k, v) => setEntries(p => p.map(e => e._localId === id ? {...e,[k]:v} : e))

  const todayTotal  = entries.reduce((s,e) => s+(parseFloat(e.amount)||0), 0)
  const monthSpent  = summary?.totalSpent    ?? 0
  const budget      = summary?.monthlyLimit  ?? 0    
  const budgetPct   = summary?.budgetPct     ?? 0    
  const balanceLeft = summary?.balanceLeft   ?? 0  
  const isSubmitted = status === 'submitted' || status === 'approved'

  //  Validation 
  const validateAll = () => {
    const all = {}
    entries.forEach(e => {
      const errs = {}
      if (!e.category)                                    errs.category = 'Category required'
      if (!e.amount || isNaN(e.amount) || e.amount <= 0) errs.amount   = 'Valid amount required'
      if (Object.keys(errs).length) all[e._localId] = errs
    })
    setEntryErrors(all)
    return Object.keys(all).length === 0
  }

  // ── Save draft ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validateAll()) { setError('Please fix the highlighted fields before saving'); return }
    setSaving(true); setError('')
    try {
      const body = JSON.stringify({
        date, notes,
        entries: entries.map(({ _localId,...rest }) => ({ ...rest, amount: parseFloat(rest.amount)||0 })),
      })
      const res  = await fetch(`${BASE}/api/expenses/upsert`, { method:'POST', headers, body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRecord(data.expense); setStatus(data.expense.status)
      setSuccess('Expenses saved as draft')
      setTimeout(() => setSuccess(''), 3000)
      loadSummary()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  // ── Submit for approval ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateAll()) { setError('Please fix the highlighted fields before submitting'); return }
    setSaving(true); setError('')
    try {
      const saveBody = JSON.stringify({
        date, notes,
        entries: entries.map(({ _localId,...rest }) => ({ ...rest, amount: parseFloat(rest.amount)||0 })),
      })
      const saveRes  = await fetch(`${BASE}/api/expenses/upsert`, { method:'POST', headers, body: saveBody })
      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.message)

      const subRes  = await fetch(`${BASE}/api/expenses/${date}/submit`, { method:'POST', headers })
      const subData = await subRes.json()
      if (!subRes.ok) throw new Error(subData.message)

      setRecord(subData.expense); setStatus(subData.expense.status)
      setSuccess('Expenses submitted for approval!')
      setTimeout(() => setSuccess(''), 4000)
      loadSummary()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const exportCSV = () => {
    const hdr  = ['Date','Category','Amount (₹)','Description','Vendor','Bill No.','Receipt','Status']
    const rows = entries.map(e => [
      date, e.category, e.amount, e.description, e.vendor, e.billNumber,
      e.hasReceipt?'Yes':'No', status,
    ].map(x => `"${(x||'').toString().replace(/"/g,'""')}"`).join(','))
    const blob = new Blob([[hdr.join(','),...rows].join('\n')], { type:'text/csv' })
    const a    = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `expenses-${date}.csv`; a.click()
  }

  const prevMonth = () => { if (month===1){setYear(y=>y-1);setMonth(12)} else setMonth(m=>m-1) }
  const nextMonth = () => { if (month===12){setYear(y=>y+1);setMonth(1)} else setMonth(m=>m+1) }

  const handleAddCategory = () => {
    const t = newCat.trim()
    if (!t) return
    if (!categories.includes(t)) setCategories(p => [...p, t])
    setNewCat(''); setAddCatOpen(false)
  }

  return (
    <PageShell
      title="Daily Expenses"
      subtitle={`Date: ${new Date(date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`}
      breadcrumb={[{label:'Field Work'},{label:'Daily Expenses'}]}
      action={
        <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
          <Button size="small" variant="outlined" startIcon={<FileDownload />} onClick={exportCSV}>Export</Button>
          <Button size="small" variant="outlined" startIcon={<History />} onClick={() => setHistoryOpen(true)}>History</Button>
          <Tooltip title="Reload"><IconButton size="small" onClick={() => {loadExpense();loadSummary()}} disabled={loading}><Refresh sx={{fontSize:18}}/></IconButton></Tooltip>
        </Box>
      }
    >
      {error   && <Alert severity="error"   sx={{mb:2}} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{mb:2}} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ── Date + Status ── */}
      <Paper elevation={0} sx={{p:{xs:1.5,sm:2},mb:2.5,border:'1px solid',borderColor:'divider',borderRadius:3}}>
        <Box sx={{display:'flex',gap:2,alignItems:'center',flexWrap:'wrap'}}>
          <TextField size="small" type="date" label="Expense Date" value={date}
            onChange={e => setDate(e.target.value)} InputLabelProps={{shrink:true}}
            sx={{width:170}} disabled={isSubmitted} />
          <Chip label={STATUS_LABEL[status]||status} size="small" color={STATUS_COLOR[status]||'default'} />
          {record?.submittedAt && (
            <Typography sx={{fontSize:12,color:'text.secondary'}}>
              Submitted: {new Date(record.submittedAt).toLocaleDateString('en-IN')}
            </Typography>
          )}
          {record?.rejectedReason && (
            <Box sx={{display:'flex',alignItems:'center',gap:0.5}}>
              <WarningAmber sx={{fontSize:16,color:'error.main'}}/>
              <Typography sx={{fontSize:12,color:'error.main'}}>{record.rejectedReason}</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* ── Stat cards — budget from real DB ── */}
      <Grid container spacing={2} sx={{mb:2.5}}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Today's Total"  value={formatINR(todayTotal)} sub={`${entries.length} ${entries.length===1?'entry':'entries'}`} color="#1d4ed8" icon={<AttachMoney/>} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Monthly Budget" value={budget>0 ? formatINR(budget) : '—'} sub={budget>0 ? 'Approved limit' : 'Not set by HR'} color="#16a34a" icon={<Receipt/>} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Month Spent"    value={formatINR(monthSpent)} sub={budget>0 ? `${budgetPct}% of budget` : monthLabel(year,month)} color={budgetPct>90?'#dc2626':'#d97706'} icon={<AttachMoney/>} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Balance Left"   value={budget>0 ? formatINR(balanceLeft) : '—'} sub={monthLabel(year,month)} color="#7c3aed" icon={<Receipt/>} />
        </Grid>
      </Grid>

      {/* ── Budget progress — only shown when budget is set ── */}
      {budget > 0 && (
        <Paper elevation={0} sx={{p:{xs:1.5,sm:2},mb:2.5,border:'1px solid',borderColor:'divider',borderRadius:3}}>
          <Box sx={{display:'flex',justifyContent:'space-between',mb:0.8}}>
            <Typography sx={{fontSize:13,fontWeight:600}}>Monthly Budget Usage</Typography>
            <Typography sx={{fontSize:13,fontWeight:700,color:budgetPct>90?'error.main':'text.primary'}}>
              {formatINR(monthSpent)} / {formatINR(budget)}
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={budgetPct} sx={{height:10,borderRadius:5}}
            color={budgetPct>90?'error':budgetPct>70?'warning':'primary'} />
          {budgetPct>90 && (
            <Box sx={{display:'flex',alignItems:'center',gap:0.5,mt:0.8}}>
              <WarningAmber sx={{fontSize:14,color:'error.main'}}/>
              <Typography sx={{fontSize:11,color:'error.main'}}>
                Near budget limit — only {formatINR(balanceLeft)} remaining
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Expense Entries ── */}
      <Paper elevation={0} sx={{border:'1px solid',borderColor:'divider',borderRadius:3,overflow:'hidden',mb:2.5}}>
        <Box sx={{p:{xs:1.5,sm:2},borderBottom:'1px solid',borderColor:'divider',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:1}}>
          <Typography sx={{fontWeight:700,fontSize:{xs:13,sm:15}}}>Expense Entries</Typography>
          <Box sx={{display:'flex',gap:1}}>
            <Button size="small" variant="outlined" onClick={() => setAddCatOpen(true)}>+ Category</Button>
            <Button size="small" variant="contained" startIcon={<Add/>} onClick={addEntry} disabled={isSubmitted}>Add Entry</Button>
          </Box>
        </Box>

        {loading
          ? <Box sx={{p:4,display:'flex',justifyContent:'center'}}><CircularProgress/></Box>
          : isMobile
            // ── Mobile cards ─────────────────────────────────────────
            ? <Box sx={{p:1.5,display:'flex',flexDirection:'column',gap:1.5}}>
                {entries.map((e,idx) => (
                  <Paper key={e._localId} elevation={0} sx={{p:1.8,border:'1px solid',borderColor:entryErrors[e._localId]?'error.main':'divider',borderRadius:2}}>
                    <Box sx={{display:'flex',justifyContent:'space-between',mb:1.5}}>
                      <Typography sx={{fontWeight:700,fontSize:13}}>Entry #{idx+1}</Typography>
                      <IconButton size="small" color="error" onClick={() => removeEntry(e._localId)} disabled={isSubmitted||entries.length===1}><Delete sx={{fontSize:16}}/></IconButton>
                    </Box>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" select label="Category *" value={e.category}
                          onChange={ev => updateEntry(e._localId,'category',ev.target.value)}
                          error={!!entryErrors[e._localId]?.category} helperText={entryErrors[e._localId]?.category}
                          disabled={isSubmitted}>
                          {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Amount (₹) *" type="number"
                          value={e.amount} onChange={ev => updateEntry(e._localId,'amount',ev.target.value)}
                          error={!!entryErrors[e._localId]?.amount} helperText={entryErrors[e._localId]?.amount}
                          disabled={isSubmitted}/>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Vendor" value={e.vendor||''}
                          onChange={ev => updateEntry(e._localId,'vendor',ev.target.value)} disabled={isSubmitted}/>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Description" value={e.description}
                          onChange={ev => updateEntry(e._localId,'description',ev.target.value)}
                          placeholder="Brief description…" disabled={isSubmitted}/>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Bill No." value={e.billNumber||''}
                          onChange={ev => updateEntry(e._localId,'billNumber',ev.target.value)} disabled={isSubmitted}/>
                      </Grid>
                      <Grid item xs={6} sx={{display:'flex',alignItems:'center'}}>
                        <Chip label={e.hasReceipt?'✓ Receipt':'No Receipt'} size="small"
                          color={e.hasReceipt?'success':'default'}
                          onClick={() => !isSubmitted && updateEntry(e._localId,'hasReceipt',!e.hasReceipt)}
                          sx={{cursor:isSubmitted?'default':'pointer',fontSize:11,width:'100%'}}/>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Paper elevation={0} sx={{p:2,border:'2px solid',borderColor:'primary.main',borderRadius:3,textAlign:'center'}}>
                  <Typography sx={{fontSize:11,color:'text.secondary',fontWeight:600}}>TODAY'S TOTAL</Typography>
                  <Typography sx={{fontSize:26,fontWeight:800,color:'primary.main'}}>{formatINR(todayTotal)}</Typography>
                </Paper>
              </Box>

            // Desktop table 
            : <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{bgcolor:'background.default'}}>
                      {['Category *','Amount (₹) *','Description','Vendor','Bill No.','Receipt',''].map(h => (
                        <TableCell key={h} sx={{fontWeight:700,fontSize:12,whiteSpace:'nowrap'}}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.map(e => (
                      <TableRow key={e._localId} sx={{verticalAlign:'top',bgcolor:entryErrors[e._localId]?'rgba(211,47,47,0.04)':'inherit'}}>
                        <TableCell sx={{p:0.8,minWidth:210}}>
                          <TextField select fullWidth size="small" value={e.category}
                            onChange={ev => updateEntry(e._localId,'category',ev.target.value)}
                            error={!!entryErrors[e._localId]?.category} helperText={entryErrors[e._localId]?.category}
                            disabled={isSubmitted}>
                            {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                          </TextField>
                        </TableCell>
                        <TableCell sx={{p:0.8,minWidth:120}}>
                          <TextField fullWidth size="small" type="number" placeholder="0.00"
                            value={e.amount} onChange={ev => updateEntry(e._localId,'amount',ev.target.value)}
                            error={!!entryErrors[e._localId]?.amount} helperText={entryErrors[e._localId]?.amount}
                            disabled={isSubmitted}/>
                        </TableCell>
                        <TableCell sx={{p:0.8,minWidth:180}}>
                          <TextField fullWidth size="small" placeholder="Brief description…"
                            value={e.description} onChange={ev => updateEntry(e._localId,'description',ev.target.value)}
                            disabled={isSubmitted}/>
                        </TableCell>
                        <TableCell sx={{p:0.8,minWidth:130}}>
                          <TextField fullWidth size="small" placeholder="Vendor name"
                            value={e.vendor||''} onChange={ev => updateEntry(e._localId,'vendor',ev.target.value)}
                            disabled={isSubmitted}/>
                        </TableCell>
                        <TableCell sx={{p:0.8,minWidth:120}}>
                          <TextField fullWidth size="small" placeholder="Bill / Invoice No."
                            value={e.billNumber||''} onChange={ev => updateEntry(e._localId,'billNumber',ev.target.value)}
                            disabled={isSubmitted}/>
                        </TableCell>
                        <TableCell sx={{p:0.8}}>
                          <Chip label={e.hasReceipt?'Attached':'No Receipt'} size="small"
                            color={e.hasReceipt?'success':'default'}
                            onClick={() => !isSubmitted && updateEntry(e._localId,'hasReceipt',!e.hasReceipt)}
                            sx={{cursor:isSubmitted?'default':'pointer',fontSize:11}}/>
                        </TableCell>
                        <TableCell sx={{p:0.8}}>
                          <IconButton size="small" color="error" onClick={() => removeEntry(e._localId)}
                            disabled={isSubmitted||entries.length===1}><Delete sx={{fontSize:16}}/></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{bgcolor:'action.selected'}}>
                      <TableCell sx={{fontWeight:800,fontSize:14,py:1.5}}>Total</TableCell>
                      <TableCell sx={{fontWeight:800,fontSize:16,color:'primary.main',py:1.5}}>{formatINR(todayTotal)}</TableCell>
                      <TableCell colSpan={5}/>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
        }
      </Paper>

      {/* ── Notes ── */}
      <Paper elevation={0} sx={{p:{xs:1.5,sm:2},mb:2.5,border:'1px solid',borderColor:'divider',borderRadius:3}}>
        <Typography sx={{fontWeight:700,fontSize:13,mb:1}}>Notes</Typography>
        <TextField fullWidth size="small" multiline rows={2} value={notes}
          onChange={e => setNotes(e.target.value)} disabled={isSubmitted}
          placeholder="Additional notes, justification for expenses…"/>
      </Paper>

      {/* ── Actions ── */}
      <Box sx={{display:'flex',justifyContent:'flex-end',gap:1.5,flexWrap:'wrap'}}>
        {!isSubmitted && (
          <>
            <Button variant="outlined" startIcon={saving?<CircularProgress size={14}/>:<Save/>}
              onClick={handleSave} disabled={saving}>Save Draft</Button>
            <Button variant="contained" size="large"
              startIcon={saving?<CircularProgress size={14}/>:<Send/>}
              onClick={handleSubmit} disabled={saving}>Submit for Approval</Button>
          </>
        )}
        {isSubmitted && (
  <Box sx={{
    display:'flex', alignItems:'center', gap:1.5, px:2.5, py:1.5,
    borderRadius:2, border:'1px solid',
    bgcolor: status === 'approved' ? '#f0fdf4' : status === 'rejected' ? '#fef2f2' : '#eff6ff',
    borderColor: status === 'approved' ? '#bbf7d0' : status === 'rejected' ? '#fecaca' : '#bfdbfe',
  }}>
    {status === 'approved' && <CheckCircle sx={{color:'#16a34a', fontSize:20}}/>}
    {status === 'rejected' && <Cancel sx={{color:'#dc2626', fontSize:20}}/>}
    {status === 'submitted' && <CircularProgress size={16} sx={{color:'#1d4ed8'}}/>}
    <Box>
      <Typography sx={{
        fontWeight:700, fontSize:14,
        color: status==='approved' ? '#16a34a' : status==='rejected' ? '#dc2626' : '#1d4ed8'
      }}>
        {status === 'approved' && 'Expense Approved ✓'}
        {status === 'rejected' && 'Expense Rejected'}
        {status === 'submitted' && 'Submitted — awaiting approval'}
      </Typography>
      {status === 'approved' && record?.approvedAt && (
        <Typography sx={{fontSize:11, color:'#15803d'}}>
          Approved on {new Date(record.approvedAt).toLocaleDateString('en-IN', {day:'numeric', month:'long', year:'numeric'})}
        </Typography>
      )}
      {status === 'rejected' && record?.rejectedReason && (
        <Typography sx={{fontSize:11, color:'#dc2626'}}>
          Reason: {record.rejectedReason}
        </Typography>
      )}
    </Box>
    {/* Manual refresh button */}
    <IconButton size="small" onClick={() => { loadExpense(); loadSummary() }}
      sx={{ml:'auto', color: status==='approved' ? '#16a34a' : '#64748b'}}>
      <Refresh sx={{fontSize:16}}/>
    </IconButton>
  </Box>
)}
      </Box>

      {/* HISTORY DIALOG  */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:1}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1}}><History/> Monthly Expense History</Box>
          <Box sx={{display:'flex',alignItems:'center',gap:1}}>
            <IconButton size="small" onClick={prevMonth}><ArrowBackIos sx={{fontSize:14}}/></IconButton>
            <Typography sx={{fontWeight:700,minWidth:160,textAlign:'center'}}>{monthLabel(year,month)}</Typography>
            <IconButton size="small" onClick={nextMonth}><ArrowForwardIos sx={{fontSize:14}}/></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* Summary row */}
          {summary && (
            <Box sx={{mb:2,p:2,bgcolor:'background.default',borderRadius:2,display:'flex',gap:3,flexWrap:'wrap'}}>
              <Box><Typography sx={{fontSize:11,color:'text.secondary'}}>Total Spent</Typography><Typography sx={{fontWeight:800,fontSize:16,color:'primary.main'}}>{formatINR(summary.totalSpent)}</Typography></Box>
              <Box><Typography sx={{fontSize:11,color:'text.secondary'}}>Budget</Typography><Typography sx={{fontWeight:800,fontSize:16}}>{budget>0?formatINR(budget):'Not set'}</Typography></Box>
              <Box><Typography sx={{fontSize:11,color:'text.secondary'}}>Balance</Typography><Typography sx={{fontWeight:800,fontSize:16,color:'success.main'}}>{budget>0?formatINR(balanceLeft):'—'}</Typography></Box>
              <Box><Typography sx={{fontSize:11,color:'text.secondary'}}>Usage</Typography><Typography sx={{fontWeight:800,fontSize:16,color:budgetPct>90?'error.main':'text.primary'}}>{budgetPct}%</Typography></Box>
            </Box>
          )}

          {/* Category breakdown */}
          {summary?.breakdown && Object.keys(summary.breakdown).length > 0 && (
            <Box sx={{mb:2}}>
              <Typography sx={{fontWeight:700,mb:1,fontSize:13}}>Category Breakdown</Typography>
              <Grid container spacing={1}>
                {Object.entries(summary.breakdown).sort((a,b)=>b[1]-a[1]).map(([cat,amt]) => (
                  <Grid item xs={6} sm={4} key={cat}>
                    <Box sx={{p:1.2,bgcolor:'background.default',borderRadius:2,border:'1px solid',borderColor:'divider'}}>
                      <Typography sx={{fontSize:11,color:'text.secondary',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat}</Typography>
                      <Typography sx={{fontWeight:700,fontSize:15}}>{formatINR(amt)}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{my:2}}/>
            </Box>
          )}

          {/* Day-wise list */}
          {monthRecs.length===0
            ? <Typography sx={{textAlign:'center',color:'text.secondary',py:4}}>No expense records for this month</Typography>
            : monthRecs.map(r => (
                <Box key={r.date} sx={{mb:1.5,p:1.8,bgcolor:'background.default',borderRadius:2,border:'1px solid',borderColor:'divider'}}>
                  <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.5,flexWrap:'wrap',gap:1}}>
                    <Typography sx={{fontWeight:700,fontSize:13}}>{r.date}</Typography>
                    <Box sx={{display:'flex',gap:1}}>
                      <Typography sx={{fontWeight:700,color:'primary.main'}}>{formatINR(r.totalAmount)}</Typography>
                      <Chip label={STATUS_LABEL[r.status]||r.status} size="small" color={STATUS_COLOR[r.status]||'default'} sx={{fontSize:10}}/>
                    </Box>
                  </Box>
                  <Typography sx={{fontSize:11,color:'text.secondary'}}>
                    {r.entries?.length||0} entries · {r.entries?.filter(e=>e.hasReceipt).length||0} receipts
                  </Typography>
                </Box>
              ))
          }
        </DialogContent>
        <DialogActions><Button onClick={() => setHistoryOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* ══════════ ADD CATEGORY DIALOG ══════════ */}
      <Dialog open={addCatOpen} onClose={() => setAddCatOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Custom Category</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth size="small" label="Category Name" value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleAddCategory()}
            sx={{mt:1}} placeholder="e.g. Conference Registration"/>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCatOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCategory}>Add</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}