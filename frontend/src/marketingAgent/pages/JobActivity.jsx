// frontend/src/marketingAgent/pages/JobActivity.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableHead, TableRow, LinearProgress, Alert, Snackbar,
  CircularProgress, IconButton, Tooltip,
} from '@mui/material'
import {
  Edit, Delete, OpenInNew,
} from '@mui/icons-material'

const API_BASE  = `${import.meta.env.VITE_API_BASE_URL}/api`
const getToken  = () => localStorage.getItem('agentToken')
const authHdr   = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

//  Validation helpers
const onlyNumbers  = (v) => v.replace(/[^0-9.]/g, '')
const onlyLetters  = (v) => v.replace(/[^a-zA-Z\s\-'.]/g, '')
const onlyAlphaNum = (v) => v.replace(/[^a-zA-Z0-9\s\-'.,/]/g, '')

//  Constants
const VISIT_TYPES = [
  'Hospital','Clinic','Pharmacy','Medical Store','Nursing Home',
  'Diagnostic Centre','Doctor Chamber','Corporate Office',
  'Retail Shop','Wholesaler','Factory','School','Hotel','Other'
]

const LEAD_STATUSES = [
  'Interested','Not Interested','Follow Up','Order Placed','No Response','Callback Requested'
]

const LEAD_COLOR = {
  'Interested':         { bg: '#f0fdf4', color: '#16a34a' },
  'Not Interested':     { bg: '#fef2f2', color: '#dc2626' },
  'Follow Up':          { bg: '#fffbeb', color: '#d97706' },
  'Order Placed':       { bg: '#f5f3ff', color: '#7c3aed' },
  'No Response':        { bg: '#f8fafc', color: '#64748b' },
  'Callback Requested': { bg: '#ecfeff', color: '#0891b2' },
}

const PLACE_LABEL = {
  Hospital:'Hospital Name', Clinic:'Clinic Name', Pharmacy:'Pharmacy Name',
  'Medical Store':'Medical Store Name', 'Nursing Home':'Nursing Home Name',
  'Diagnostic Centre':'Centre Name', 'Doctor Chamber':"Doctor's Name",
  'Corporate Office':'Company Name', 'Retail Shop':'Shop Name',
  Wholesaler:'Wholesaler Name', Factory:'Factory Name', School:'School/College Name',
  Hotel:'Hotel Name', Other:'Place Name',
}

const EMPTY_VISIT = {
  specificName:'', type:'Hospital', customType:'',
  fromLocation:'', toLocation:'', kmAtArrival:'',
  contactPerson:'', contactRole:'', phone:'',
  notes:'', leadStatus:'Interested', hasOrder:false, orderValue:'',
}

const VISIT_ERRORS_INIT = {
  specificName:'', type:'', fromLocation:'', toLocation:'',
  kmAtArrival:'', contactPerson:'', phone:'', orderValue:'', customType:'',
}

const fmt = (ms) => {
  if (!ms || ms < 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
}
const fmtTime = (ts) => ts
  ? new Date(ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
  : '--:--:--'
const fmtShort = (ts) => ts
  ? new Date(ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
  : '--:--'

export default function JobActivity() {
  const navigate = useNavigate()

  const [jobStatus,     setJobStatus]     = useState('idle')
  const [jobStartTime,  setJobStartTime]  = useState(null)
  const [jobEndTime,    setJobEndTime]    = useState(null)
  const [pauseStart,    setPauseStart]    = useState(null)
  const [totalPausedMs, setTotalPausedMs] = useState(0)
  const [elapsed,       setElapsed]       = useState(0)
  const timerRef = useRef(null)

  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [startKm,   setStartKm]   = useState('')
  const [currentKm, setCurrentKm] = useState('')

  const [visits,      setVisits]      = useState([])
  const [visitDialog, setVisitDialog] = useState(false)
  const [visitForm,   setVisitForm]   = useState(EMPTY_VISIT)
  const [visitErrors, setVisitErrors] = useState(VISIT_ERRORS_INIT)
  const [editVisitIdx,setEditVisitIdx]= useState(null)

  const [summaryDialog, setSummaryDialog] = useState(false)
  const [snack,         setSnack]         = useState({ open:false, msg:'', severity:'success' })
  const [now,           setNow]           = useState(new Date())

  const [gpsStatus, setGpsStatus] = useState('idle')
  const [gpsCoords, setGpsCoords] = useState(null)
  const locationWatchRef  = useRef(null)
  const locationSyncRef   = useRef(null)

  const [requirements, setRequirements] = useState({ requireLocation:true, requireImage:false })
  const [proofImageFile,    setProofImageFile]    = useState(null)
  const [proofImagePreview, setProofImagePreview] = useState(null)
  const proofImageRef = useRef(null)
  const [geofenceAlert, setGeofenceAlert] = useState(null)

  const toast = (msg, severity='success') => setSnack({ open:true, msg, severity })

  useEffect(() => {
    const c = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(c)
  }, [])

  const persist = useCallback((patch) => {
    const prev = JSON.parse(localStorage.getItem('agentJobState') || '{}')
    localStorage.setItem('agentJobState', JSON.stringify({ ...prev, ...patch }))
  }, [])

  //  Boot
  useEffect(() => {
    const boot = async () => {
      const saved = JSON.parse(localStorage.getItem('agentJobState') || '{}')
      if (saved.jobStatus && saved.jobStatus !== 'idle') {
        setJobStatus(saved.jobStatus)
        setJobStartTime(saved.jobStartTime)
        setJobEndTime(saved.jobEndTime || null)
        setTotalPausedMs(saved.totalPausedMs || 0)
        setPauseStart(saved.pauseStart || null)
        setStartKm(saved.startKm || '')
        setCurrentKm(saved.currentKm || '')
        if (saved.elapsed) setElapsed(saved.elapsed)
      }
      if (saved.visits?.length) setVisits(saved.visits)
      if (saved.gpsCoords)      setGpsCoords(saved.gpsCoords)

      try {
        const res  = await fetch(`${API_BASE}/agent/job-status`, { headers: authHdr() })
        const data = await res.json()
        if (data.success && data.isOnJob) {
          const backendStart = data.currentJob?.jobStartTime
            ? new Date(data.currentJob.jobStartTime).getTime()
            : saved.jobStartTime
          if (!saved.jobStatus || saved.jobStatus === 'idle') {
            setJobStatus('active')
            setJobStartTime(backendStart)
            persist({ jobStatus:'active', jobStartTime:backendStart, totalPausedMs:0 })
          }
          if (!saved.startKm && data.currentJob?.startKm)
            setStartKm(String(data.currentJob.startKm))
        }
      } catch (err) {
        console.log('job-status fetch error:', err)
      }

      try {
        const res  = await fetch(`${API_BASE}/agent/responses`, { headers: authHdr() })
        const data = await res.json()
        if (data.success && data.responses?.length) {
          const today = new Date().toDateString()
          const todayVisits = data.responses
            .filter(r => r.placeType !== 'EOD' && new Date(r.createdAt).toDateString() === today)
            .map(v => ({
              id:            v._id,
              place:         v.placeName,
              resolvedType:  v.placeType || 'Hospital',
              type:          v.placeType || 'Hospital',
              fromLocation:  v.fromLocation || '',
              toLocation:    v.address || '',
              kmAtArrival:   v.kmAtArrival || '',
              contactPerson: v.contactPerson || '',
              contactRole:   v.contactRole || '',
              phone:         v.phone || '',
              notes:         v.remarks || '',
              leadStatus:    v.responseStatus === 'Responded - Positive' ? 'Interested'
                             : v.responseStatus === 'Responded - Negative' ? 'Not Interested'
                             : v.responseStatus === 'Order Placed' ? 'Order Placed'
                             : v.responseStatus === 'No Response' ? 'No Response'
                             : v.responseStatus === 'Callback Requested' ? 'Callback Requested'
                             : 'Follow Up',
              hasOrder:      v.hasOrder || false,
              orderValue:    v.orderValue || '',
              time:          fmtShort(v.createdAt),
            }))
          if (todayVisits.length > 0) {
            setVisits(todayVisits)
            persist({ visits: todayVisits })
          }
        }
      } catch (err) {
        console.log('responses fetch error:', err)
      }

      try {
        const res  = await fetch(`${API_BASE}/agent/job-requirements`, { headers: authHdr() })
        const data = await res.json()
        if (data.success)
          setRequirements(data.requirements || { requireLocation:true, requireImage:false })
      } catch (err) {
        console.log('job-requirements fetch error:', err)
      }

      setLoading(false)
    }
    boot()
  }, [])

  //  GPS
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('error'); return }
    setGpsStatus('requesting')
    locationWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c = { latitude:pos.coords.latitude, longitude:pos.coords.longitude, accuracy:pos.coords.accuracy, speed:pos.coords.speed||0 }
        setGpsCoords(c); setGpsStatus('granted'); persist({ gpsCoords:c })
      },
      (err) => setGpsStatus(err.code===1 ? 'denied' : 'error'),
      { enableHighAccuracy:true, timeout:15000, maximumAge:5000 }
    )
    return () => {
      if (locationWatchRef.current != null)
        navigator.geolocation.clearWatch(locationWatchRef.current)
    }
  }, [])

  useEffect(() => {
    clearInterval(locationSyncRef.current)
    if (jobStatus==='active' && gpsCoords) {
      const sync = async () => {
        try {
          const res  = await fetch(`${API_BASE}/agent/location/update`, {
            method:'POST', headers:authHdr(),
            body: JSON.stringify({
              latitude:gpsCoords.latitude, longitude:gpsCoords.longitude,
              accuracy:gpsCoords.accuracy, speed:gpsCoords.speed, distanceJumpKm:0
            })
          })
          const data = await res.json()
          setGeofenceAlert(data.geofenceAlert?.outside ? data.geofenceAlert : null)
        } catch (err) {
          console.log('location sync error:', err)
        }
      }
      sync()
      locationSyncRef.current = setInterval(sync, 30000)
    }
    return () => clearInterval(locationSyncRef.current)
  }, [jobStatus, gpsCoords])

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(timerRef.current)
    if (jobStatus==='active' && jobStartTime) {
      timerRef.current = setInterval(() => {
        const e = Date.now() - jobStartTime - totalPausedMs
        setElapsed(e); persist({ elapsed: e })
      }, 1000)
    } else if (jobStatus==='paused' && jobStartTime) {
      const frozenAt = pauseStart || Date.now()
      setElapsed(frozenAt - jobStartTime - totalPausedMs)
    }
    return () => clearInterval(timerRef.current)
  }, [jobStatus, jobStartTime, totalPausedMs, pauseStart])

  const totalKm = () => Math.max(0, (parseFloat(currentKm)||0) - (parseFloat(startKm)||0)).toFixed(1)

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result.split(',')[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })

  // ── START ─────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!startKm || isNaN(parseFloat(startKm))) return toast('Enter a valid starting odometer reading', 'warning')
    if (requirements.requireLocation && (gpsStatus!=='granted' || !gpsCoords)) return toast('Location access required before starting a job', 'warning')
    if (requirements.requireImage && !proofImageFile) return toast('Start-of-job photo is required', 'warning')
    setSubmitting(true)
    try {
      let b64=null, mime=null
      if (proofImageFile) { b64 = await fileToBase64(proofImageFile); mime = proofImageFile.type }
      const res  = await fetch(`${API_BASE}/agent/start-job`, {
        method:'POST', headers:authHdr(),
        body: JSON.stringify({
          latitude: gpsCoords?.latitude, longitude: gpsCoords?.longitude,
          locationAccuracy: gpsCoords?.accuracy||10,
          state:'', district:'', area:'', address:'',
          startKm: parseFloat(startKm),
          startProofImageBase64: b64, startProofImageMimeType: mime,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to start job')
      const t = Date.now()
      setJobStartTime(t); setJobStatus('active')
      setElapsed(0); setTotalPausedMs(0); setVisits([])
      setProofImageFile(null); setProofImagePreview(null)
      persist({ jobStatus:'active', jobStartTime:t, totalPausedMs:0, pauseStart:null, startKm, currentKm:'', visits:[], elapsed:0 })
      toast('Job started successfully.')
    } catch (err) {
      toast(err.message, 'error')
    }
    setSubmitting(false)
  }

  const handlePause = () => {
    const ps = Date.now(); setPauseStart(ps); setJobStatus('paused')
    persist({ jobStatus:'paused', pauseStart:ps }); toast('Job paused.', 'info')
  }

  const handleResume = () => {
    const extra = Date.now() - pauseStart; const np = totalPausedMs + extra
    setTotalPausedMs(np); setPauseStart(null); setJobStatus('active')
    persist({ jobStatus:'active', totalPausedMs:np, pauseStart:null }); toast('Job resumed.')
  }

  const handleEnd = async () => {
    if (!currentKm || isNaN(parseFloat(currentKm))) return toast('Update current odometer before ending', 'warning')
    if (parseFloat(currentKm) < parseFloat(startKm)) return toast('Current reading cannot be less than start reading', 'warning')
    setSubmitting(true)
    try {
      const res  = await fetch(`${API_BASE}/agent/close-job`, {
        method:'POST', headers:authHdr(),
        body: JSON.stringify({ totalDistanceKm: parseFloat(totalKm()) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to close job')
      clearInterval(timerRef.current)
      const endT = Date.now()
      setJobEndTime(endT); setJobStatus('ended'); setGeofenceAlert(null)
      persist({ jobStatus:'ended', jobEndTime:endT, currentKm })
      setSummaryDialog(true); toast('Job completed!')
    } catch (err) {
      toast(err.message, 'error')
    }
    setSubmitting(false)
  }

  // ── Visit Validation ──────────────────────────────────────────────────────
  const validateVisit = () => {
    const errs = { ...VISIT_ERRORS_INIT }; let ok = true
    if (!visitForm.specificName.trim()) { errs.specificName = 'Place name is required'; ok=false }
    if (!visitForm.type) { errs.type = 'Type is required'; ok=false }
    if (visitForm.type==='Other' && !visitForm.customType.trim()) { errs.customType='Describe the type'; ok=false }
    if (!visitForm.fromLocation.trim()) { errs.fromLocation = 'From location required'; ok=false }
    if (!visitForm.toLocation.trim())   { errs.toLocation   = 'To location required'; ok=false }
    if (visitForm.kmAtArrival && isNaN(parseFloat(visitForm.kmAtArrival))) { errs.kmAtArrival = 'Must be a number'; ok=false }
    if (visitForm.contactPerson && /\d/.test(visitForm.contactPerson)) { errs.contactPerson = 'Name should not contain numbers'; ok=false }
    if (visitForm.phone && !/^\d{0,15}$/.test(visitForm.phone.replace(/\s/g,''))) { errs.phone = 'Phone must be numeric'; ok=false }
    if (visitForm.hasOrder && visitForm.orderValue && isNaN(parseFloat(visitForm.orderValue))) { errs.orderValue = 'Order value must be a number'; ok=false }
    setVisitErrors(errs); return ok
  }

  // ── Save Visit ────────────────────────────────────────────────────────────
  const handleSaveVisit = async () => {
    if (!validateVisit()) return
    const resolvedType = visitForm.type==='Other' ? (visitForm.customType.trim() || 'Other') : visitForm.type
    const entry = {
      ...visitForm, resolvedType,
      place: visitForm.specificName.trim(),
      id: editVisitIdx !== null ? visits[editVisitIdx].id : Date.now(),
      time: fmtShort(Date.now()),
    }

    const responseStatusMap = {
      'Interested':         'Responded - Positive',
      'Not Interested':     'Responded - Negative',
      'Follow Up':          'Follow Up Required',
      'Order Placed':       'Order Placed',
      'No Response':        'No Response',
      'Callback Requested': 'Callback Requested',
    }

    let updated
    if (editVisitIdx !== null) {
      updated = visits.map((v,i) => i===editVisitIdx ? entry : v)
    } else {
      updated = [...visits, entry]
    }
    setVisits(updated)
    if (entry.kmAtArrival) { setCurrentKm(entry.kmAtArrival); persist({ currentKm:entry.kmAtArrival }) }
    persist({ visits: updated })

    // Save to backend as a response only (removed job/save call that was causing 500 error)
    try {
      const responsePayload = {
        placeName:        entry.place,
        placeType:        resolvedType,
        address:          entry.toLocation,
        contactPerson:    entry.contactPerson || 'N/A',
        contactRole:      entry.contactRole,
        phone:            entry.phone,
        responseStatus:   responseStatusMap[entry.leadStatus] || 'Responded - Positive',
        productDiscussed: '',
        remarks:          entry.notes,
        nextAction:       entry.leadStatus === 'Follow Up' ? 'Visit Again' : 'None Required',
        hasOrder:         entry.hasOrder,
        orderValue:       entry.orderValue,
        fromLocation:     entry.fromLocation,
        kmAtArrival:      entry.kmAtArrival,
      }

      const res = await fetch(`${API_BASE}/agent/responses`, {
        method:'POST', headers:authHdr(), body: JSON.stringify(responsePayload)
      })
      const data = await res.json()
      if (data.success && data.response && data.response._id) {
        entry.responseId = data.response._id
        const finalUpdated = editVisitIdx !== null
          ? visits.map((v,i) => i===editVisitIdx ? entry : v)
          : [...visits.slice(0,-1), entry]
        setVisits(finalUpdated)
        persist({ visits: finalUpdated })
      }
    } catch (err) {
      console.log('Save response error:', err)
    }

    if (entry.hasOrder && editVisitIdx===null) {
      toast('Visit logged. Redirecting to Billing...')
      setTimeout(() => navigate('/agent/billing/invoices'), 2000)
    } else {
      toast(editVisitIdx!==null ? 'Visit updated.' : 'Visit logged.')
    }
    setVisitForm(EMPTY_VISIT); setVisitErrors(VISIT_ERRORS_INIT)
    setVisitDialog(false); setEditVisitIdx(null)
  }

  const handleDeleteVisit = async (idx) => {
    const updated = visits.filter((v,i) => i!==idx)
    setVisits(updated); persist({ visits:updated }); toast('Visit removed.')
  }

  const handleEditVisit = (idx) => {
    const v = visits[idx]
    const baseTypes = VISIT_TYPES.filter(t => t!=='Other')
    const isCustom  = !baseTypes.includes(v.type) && v.type!=='Other'
    setVisitForm({
      specificName:  v.place || v.specificName || '',
      type:          isCustom ? 'Other' : (v.type || 'Hospital'),
      customType:    isCustom ? v.type : (v.customType||''),
      fromLocation:  v.fromLocation||'',
      toLocation:    v.toLocation||'',
      kmAtArrival:   v.kmAtArrival||'',
      contactPerson: v.contactPerson||'',
      contactRole:   v.contactRole||'',
      phone:         v.phone||'',
      notes:         v.notes||'',
      leadStatus:    v.leadStatus||'Interested',
      hasOrder:      v.hasOrder||false,
      orderValue:    v.orderValue||'',
    })
    setVisitErrors(VISIT_ERRORS_INIT); setEditVisitIdx(idx); setVisitDialog(true)
  }

  const handleNewJob = () => {
    setJobStatus('idle'); setJobStartTime(null); setJobEndTime(null)
    setPauseStart(null); setTotalPausedMs(0); setElapsed(0)
    setStartKm(''); setCurrentKm(''); setVisits([])
    localStorage.removeItem('agentJobState')
  }

  const statusBadge = () => {
    const map = { idle:'Not Started', active:'Active', paused:'Paused', ended:'Completed' }
    const col = { idle:'#1d4ed8', active:'#16a34a', paused:'#d97706', ended:'#64748b' }
    return (
      <Box sx={{ display:'inline-flex', alignItems:'center', gap:1, px:2, py:0.5, borderRadius:20,
        bgcolor:col[jobStatus]+'18', border:`1.5px solid ${col[jobStatus]}40` }}>
        <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:col[jobStatus],
          animation:jobStatus==='active'?'pulse 1.5s infinite':'none',
          '@keyframes pulse':{'0%,100%':{opacity:1},'50%':{opacity:0.3}} }} />
        <Typography sx={{ fontSize:12, fontWeight:700, color:col[jobStatus], letterSpacing:'0.08em' }}>
          {map[jobStatus].toUpperCase()}
        </Typography>
      </Box>
    )
  }

  const canStart = jobStatus==='idle' &&
    (!requirements.requireLocation || gpsStatus==='granted') &&
    (!requirements.requireImage || proofImageFile)

  if (loading) return (
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:2 }}>
      <CircularProgress sx={{ color:'#1d4ed8' }} />
      <Typography sx={{ color:'#64748b', fontSize:14 }}>Checking job status...</Typography>
    </Box>
  )

  return (
    <Box sx={{ minHeight:'100vh', bgcolor:'#f8fafc', p:{ xs:1.5, md:3 } }}>
      <style>{`
        @keyframes gpspulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(22,163,74,.4);}70%{box-shadow:0 0 0 6px rgba(22,163,74,0);}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
      `}</style>

      {/* Header */}
      <Box sx={{ mb:3, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em', fontSize:{xs:22,md:28} }}>
            Job Activity
          </Typography>
          <Typography sx={{ color:'#64748b', fontSize:13, mt:0.5 }}>
            {now.toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </Typography>
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:2, flexWrap:'wrap' }}>
          {statusBadge()}
          <Typography sx={{ fontFamily:'monospace', fontSize:13, color:'#475569',
            bgcolor:'#f1f5f9', px:2, py:0.75, borderRadius:2, border:'1px solid #e2e8f0' }}>
            {now.toLocaleTimeString('en-IN')}
          </Typography>
          {visits.length > 0 && (
            <Button size="small" variant="outlined" startIcon={<OpenInNew fontSize="small"/>}
              onClick={() => navigate('/agent/responses')}
              sx={{ borderColor:'#7c3aed', color:'#7c3aed', fontSize:11, fontWeight:700, borderRadius:2, '&:hover':{ bgcolor:'#f5f3ff' } }}>
              View Responses
            </Button>
          )}
        </Box>
      </Box>

      {/* GPS Banner */}
      {gpsStatus==='granted' && gpsCoords ? (
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, p:'10px 14px', borderRadius:2, mb:2,
          bgcolor:'#f0fdf4', border:'1px solid #bbf7d0', fontSize:13, color:'#15803d', fontWeight:500 }}>
          <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:'#16a34a', animation:'gpspulse 1.5s infinite', flexShrink:0 }} />
          <Typography sx={{ fontSize:13, color:'#15803d', fontWeight:500 }}>
            Location active · {gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)}
            <span style={{ color:'#86efac', marginLeft:6, fontSize:11 }}>±{Math.round(gpsCoords.accuracy||0)}m</span>
          </Typography>
        </Box>
      ) : gpsStatus==='requesting' ? (
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, p:'10px 14px', borderRadius:2, mb:2, bgcolor:'#fffbeb', border:'1px solid #fde68a' }}>
          <CircularProgress size={14} sx={{ color:'#d97706' }} />
          <Typography sx={{ fontSize:13, color:'#92400e' }}>Requesting location permission...</Typography>
        </Box>
      ) : gpsStatus==='denied' ? (
        <Box sx={{ p:'12px 14px', borderRadius:2, mb:2, bgcolor:'#fef2f2', border:'1px solid #fecaca' }}>
          <Typography sx={{ fontSize:13, color:'#dc2626', fontWeight:600 }}>
            Location access denied. Enable location in browser settings.
            <Button size="small" onClick={() => {
              setGpsStatus('requesting')
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setGpsCoords({ latitude:pos.coords.latitude, longitude:pos.coords.longitude, accuracy:pos.coords.accuracy, speed:0 })
                  setGpsStatus('granted')
                },
                () => setGpsStatus('denied'),
                { enableHighAccuracy:true }
              )
            }} sx={{ ml:1.5, fontSize:11, color:'#dc2626', border:'1px solid #fca5a5', borderRadius:1, px:1, py:0.3 }}>
              Try Again
            </Button>
          </Typography>
        </Box>
      ) : null}

      {/* Geofence Alert */}
      {geofenceAlert && geofenceAlert.outside && (
        <Box sx={{ p:'12px 16px', borderRadius:2, mb:2, bgcolor:'#fef2f2', border:'2px solid #fca5a5', display:'flex', alignItems:'center', gap:1.5 }}>
          <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:'#dc2626', animation:'gpspulse 1s infinite', flexShrink:0 }} />
          <Typography sx={{ fontSize:13, color:'#dc2626', fontWeight:600 }}>
            You are outside your assigned area.
            <span style={{ fontWeight:400, marginLeft:6 }}>{geofenceAlert.distanceKm} km from zone center (limit: {geofenceAlert.radiusKm} km).</span>
          </Typography>
        </Box>
      )}

      {/* Pre-start requirements */}
      {jobStatus==='idle' && (requirements.requireLocation || requirements.requireImage) && (
        <Paper elevation={0} sx={{ border:'1px solid #e2e8f0', borderRadius:3, p:2.5, mb:3, bgcolor:'white' }}>
          <Typography sx={{ fontWeight:700, fontSize:11, color:'#475569', mb:2, letterSpacing:'0.06em' }}>REQUIRED BEFORE STARTING</Typography>
          <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
            {requirements.requireLocation && (
              <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
                <Box sx={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                  bgcolor:gpsStatus==='granted'?'#f0fdf4':'#fef2f2',
                  border:`1px solid ${gpsStatus==='granted'?'#bbf7d0':'#fecaca'}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                  {gpsStatus==='granted' ? <span style={{color:'#16a34a',fontWeight:700}}>✓</span> : <span style={{color:'#dc2626',fontWeight:700}}>!</span>}
                </Box>
                <Box>
                  <Typography sx={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>Location</Typography>
                  <Typography sx={{ fontSize:11, color:gpsStatus==='granted'?'#16a34a':'#dc2626' }}>
                    {gpsStatus==='granted' ? 'GPS active' : 'Waiting for location permission'}
                  </Typography>
                </Box>
              </Box>
            )}
            {requirements.requireImage && (
              <Box sx={{ display:'flex', alignItems:'flex-start', gap:2 }}>
                <Box sx={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                  bgcolor:proofImageFile?'#f0fdf4':'#fef2f2',
                  border:`1px solid ${proofImageFile?'#bbf7d0':'#fecaca'}`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {proofImageFile ? <span style={{color:'#16a34a',fontWeight:700}}>✓</span> : <span style={{color:'#dc2626',fontWeight:700}}>!</span>}
                </Box>
                <Box sx={{ flex:1 }}>
                  <Typography sx={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>Start-of-Job Photo</Typography>
                  {proofImagePreview ? (
                    <Box sx={{ position:'relative', display:'inline-block', mt:1 }}>
                      <img src={proofImagePreview} alt="proof" style={{ width:120, height:80, objectFit:'cover', borderRadius:8, border:'1px solid #e2e8f0', display:'block' }} />
                      <button onClick={() => { setProofImageFile(null); setProofImagePreview(null) }}
                        style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#ef4444', border:'none', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700 }}>×</button>
                    </Box>
                  ) : (
                    <button onClick={() => proofImageRef.current && proofImageRef.current.click()}
                      style={{ marginTop:6, padding:'7px 14px', borderRadius:8, border:'1px dashed #cbd5e1', background:'#f8fafc', color:'#475569', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                      Choose Photo
                    </button>
                  )}
                  <input ref={proofImageRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0]
                      if (f) {
                        setProofImageFile(f)
                        const r = new FileReader()
                        r.onload = (ev) => setProofImagePreview(ev.target.result)
                        r.readAsDataURL(f)
                      }
                    }} />
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Odometer */}
      <Paper elevation={0} sx={{ border:'1px solid #e2e8f0', borderRadius:3, p:2.5, mb:3, bgcolor:'white' }}>
        <Typography sx={{ fontWeight:700, fontSize:11, color:'#475569', mb:2, letterSpacing:'0.06em' }}>ODOMETER READING</Typography>
        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'flex-end' }}>
          <TextField label="Start Reading (km)" size="small" type="text" inputMode="decimal"
            value={startKm} disabled={jobStatus!=='idle'}
            onChange={(e) => { const v=onlyNumbers(e.target.value); setStartKm(v); persist({startKm:v}) }}
            sx={{ width:180 }} />
          <TextField label="Current Reading (km)" size="small" type="text" inputMode="decimal"
            value={currentKm} disabled={jobStatus==='idle'||jobStatus==='ended'}
            onChange={(e) => { const v=onlyNumbers(e.target.value); setCurrentKm(v); persist({currentKm:v}) }}
            sx={{ width:180 }} />
          <Box sx={{ px:2.5, py:1, bgcolor:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:2 }}>
            <Typography sx={{ fontSize:11, color:'#16a34a', fontWeight:600, letterSpacing:'0.05em' }}>TOTAL TRAVELLED</Typography>
            <Typography sx={{ fontSize:22, fontWeight:800, color:'#15803d', fontFamily:'monospace' }}>
              {totalKm()} <span style={{ fontSize:13, fontWeight:500 }}>km</span>
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Timer Card */}
      <Paper elevation={0} sx={{ border:'1px solid #e2e8f0', borderRadius:3, p:3, mb:3, bgcolor:'white' }}>
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:3 }}>
          <Box>
            <Typography sx={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', mb:1 }}>ACTIVE WORK TIME</Typography>
            <Typography sx={{ fontFamily:'monospace', fontSize:{xs:38,md:52}, fontWeight:800, lineHeight:1,
              color:jobStatus==='active'?'#1d4ed8':jobStatus==='paused'?'#d97706':'#64748b' }}>
              {fmt(elapsed)}
            </Typography>
            <Box sx={{ display:'flex', gap:3, mt:1.5, flexWrap:'wrap' }}>
              {[
                { label:'START',  val:fmtTime(jobStartTime) },
                jobStatus==='ended' ? { label:'END', val:fmtTime(jobEndTime) } : null,
                { label:'PAUSED', val:fmt(totalPausedMs) },
                { label:'VISITS', val:visits.length },
              ].filter(Boolean).map(x => (
                <Box key={x.label}>
                  <Typography sx={{ fontSize:10, color:'#94a3b8' }}>{x.label}</Typography>
                  <Typography sx={{ fontSize:13, fontWeight:600, color:'#334155', fontFamily:'monospace' }}>{x.val}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ display:'flex', gap:1.5, flexWrap:'wrap' }}>
            {jobStatus==='idle' && (
              <Button variant="contained" onClick={handleStart} disabled={submitting||!canStart}
                sx={{ bgcolor:canStart?'#16a34a':'#94a3b8', '&:hover':{ bgcolor:canStart?'#15803d':'#94a3b8' },
                  px:3.5, py:1.2, borderRadius:2, fontWeight:700, fontSize:13,
                  boxShadow:canStart?'0 4px 14px rgba(22,163,74,0.3)':'none' }}>
                {submitting ? <CircularProgress size={18} sx={{ color:'white' }} /> : 'START JOB'}
              </Button>
            )}
            {(jobStatus==='active'||jobStatus==='paused') && (
              <>
                {jobStatus==='active'
                  ? <Button variant="outlined" onClick={handlePause}
                      sx={{ borderColor:'#d97706', color:'#d97706', '&:hover':{ bgcolor:'#fffbeb' }, px:3, py:1.2, borderRadius:2, fontWeight:700, fontSize:13 }}>PAUSE</Button>
                  : <Button variant="contained" onClick={handleResume}
                      sx={{ bgcolor:'#16a34a', '&:hover':{ bgcolor:'#15803d' }, px:3, py:1.2, borderRadius:2, fontWeight:700, fontSize:13 }}>RESUME</Button>
                }
                <Button variant="outlined"
                  onClick={() => { setVisitForm(EMPTY_VISIT); setVisitErrors(VISIT_ERRORS_INIT); setEditVisitIdx(null); setVisitDialog(true) }}
                  sx={{ borderColor:'#1d4ed8', color:'#1d4ed8', '&:hover':{ bgcolor:'#eff6ff' }, px:3, py:1.2, borderRadius:2, fontWeight:700, fontSize:13 }}>
                  LOG VISIT
                </Button>
                <Button variant="contained" onClick={handleEnd} disabled={submitting}
                  sx={{ bgcolor:'#dc2626', '&:hover':{ bgcolor:'#b91c1c' }, px:3, py:1.2, borderRadius:2, fontWeight:700, fontSize:13 }}>
                  {submitting ? <CircularProgress size={18} sx={{ color:'white' }} /> : 'END JOB'}
                </Button>
              </>
            )}
            {jobStatus==='ended' && (
              <Box sx={{ display:'flex', gap:1.5 }}>
                <Button variant="outlined" onClick={() => setSummaryDialog(true)}
                  sx={{ borderColor:'#64748b', color:'#64748b', px:3, py:1.2, borderRadius:2, fontWeight:700, fontSize:13 }}>VIEW SUMMARY</Button>
                <Button variant="contained" onClick={handleNewJob}
                  sx={{ bgcolor:'#1d4ed8', '&:hover':{ bgcolor:'#1e40af' }, px:3, py:1.2, borderRadius:2, fontWeight:700, fontSize:13 }}>NEW JOB</Button>
              </Box>
            )}
          </Box>
        </Box>

        {jobStatus==='active' && (
          <Box sx={{ mt:2.5 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
              <Typography sx={{ fontSize:11, color:'#94a3b8' }}>8-hour workday progress</Typography>
              <Typography sx={{ fontSize:11, color:'#94a3b8' }}>{Math.min(100, Math.floor(elapsed/(8*3600000)*100))}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={Math.min(100,(elapsed/(8*3600000))*100)}
              sx={{ height:6, borderRadius:3, bgcolor:'#e2e8f0', '& .MuiLinearProgress-bar':{ bgcolor:'#1d4ed8', borderRadius:3 } }} />
          </Box>
        )}
      </Paper>

      {/* Stats */}
      <Box sx={{ display:'grid', gridTemplateColumns:{xs:'repeat(2,1fr)',md:'repeat(4,1fr)'}, gap:2, mb:3 }}>
        {[
          { label:'DISTANCE',   value:`${totalKm()} km`,  sub:`${startKm||0} → ${currentKm||startKm||0}` },
          { label:'VISITS',     value:visits.length,       sub:`${visits.filter(v=>v.hasOrder).length} with orders` },
          { label:'LEADS',      value:visits.filter(v=>v.leadStatus==='Interested').length, sub:'Interested' },
          { label:'AVG/VISIT',  value:visits.length>0?fmt(elapsed/visits.length):'--:--:--', sub:'time per visit' },
        ].map(s => (
          <Paper key={s.label} elevation={0} sx={{ border:'1px solid #e2e8f0', borderRadius:3, p:2.5, bgcolor:'white' }}>
            <Typography sx={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', mb:0.5 }}>{s.label}</Typography>
            <Typography sx={{ fontSize:22, fontWeight:800, color:'#0f172a', fontFamily:'monospace' }}>{s.value}</Typography>
            <Typography sx={{ fontSize:11, color:'#94a3b8', mt:0.3 }}>{s.sub}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Visit Log Table */}
      <Paper elevation={0} sx={{ border:'1px solid #e2e8f0', borderRadius:3, overflow:'hidden', bgcolor:'white' }}>
        <Box sx={{ px:3, py:2.5, borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:1 }}>
          <Box>
            <Typography sx={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Today's Visit Log</Typography>
            <Typography sx={{ fontSize:12, color:'#94a3b8' }}>{visits.length} visit{visits.length!==1?'s':''} recorded · synced to Responses</Typography>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            {visits.length>0 && (
              <Button size="small" variant="outlined" onClick={() => navigate('/agent/responses')}
                sx={{ borderColor:'#7c3aed', color:'#7c3aed', fontSize:11, fontWeight:700, borderRadius:2 }}>ALL RESPONSES</Button>
            )}
            {(jobStatus==='active'||jobStatus==='paused') && (
              <Button size="small" variant="outlined"
                onClick={() => { setVisitForm(EMPTY_VISIT); setVisitErrors(VISIT_ERRORS_INIT); setEditVisitIdx(null); setVisitDialog(true) }}
                sx={{ borderColor:'#1d4ed8', color:'#1d4ed8', fontSize:11, fontWeight:700, borderRadius:2 }}>+ ADD VISIT</Button>
            )}
          </Box>
        </Box>
        {visits.length===0 ? (
          <Box sx={{ py:6, textAlign:'center' }}>
            <Typography sx={{ color:'#94a3b8', fontSize:14 }}>No visits logged yet.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX:'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor:'#f8fafc' }}>
                  {['#','Time','Place','Type','Route','KM','Contact','Lead Status','Order','Notes',''].map(h => (
                    <TableCell key={h} sx={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', py:1.5, whiteSpace:'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visits.map((v,i) => (
                  <TableRow key={v.id||i} sx={{ '&:hover':{ bgcolor:'#f8fafc' }, borderBottom:'1px solid #f1f5f9' }}>
                    <TableCell sx={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>{i+1}</TableCell>
                    <TableCell sx={{ fontSize:12, fontFamily:'monospace', color:'#334155', whiteSpace:'nowrap' }}>{v.time}</TableCell>
                    <TableCell sx={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{v.place}</TableCell>
                    <TableCell>
                      <Chip label={v.resolvedType||v.type} size="small" sx={{ fontSize:10, height:20, bgcolor:'#eff6ff', color:'#1d4ed8', fontWeight:600 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize:12, color:'#475569', whiteSpace:'nowrap' }}>{v.fromLocation} → {v.toLocation}</TableCell>
                    <TableCell sx={{ fontSize:12, fontFamily:'monospace', color:'#334155' }}>{v.kmAtArrival ? `${v.kmAtArrival} km` : '—'}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize:13, fontWeight:600, color:'#334155' }}>{v.contactPerson||'—'}</Typography>
                      {v.contactRole && <Typography sx={{ fontSize:10, color:'#94a3b8' }}>{v.contactRole}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip label={v.leadStatus} size="small" sx={{
                        fontSize:10, height:20, fontWeight:600,
                        bgcolor:LEAD_COLOR[v.leadStatus] ? LEAD_COLOR[v.leadStatus].bg : '#f8fafc',
                        color:LEAD_COLOR[v.leadStatus] ? LEAD_COLOR[v.leadStatus].color : '#64748b',
                      }} />
                    </TableCell>
                    <TableCell>
                      {v.hasOrder
                        ? <Box>
                            <Chip label="ORDER" size="small" onClick={() => navigate('/agent/billing/invoices')}
                              sx={{ fontSize:10, height:20, bgcolor:'#fef9c3', color:'#92400e', fontWeight:700, cursor:'pointer' }} />
                            {v.orderValue && <Typography sx={{ fontSize:10, color:'#7c3aed', fontWeight:600, fontFamily:'monospace', mt:0.3 }}>₹{parseInt(v.orderValue).toLocaleString('en-IN')}</Typography>}
                          </Box>
                        : <Typography sx={{ fontSize:11, color:'#cbd5e1' }}>—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize:12, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>
                        {v.notes||'—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace:'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditVisit(i)} sx={{ color:'#1d4ed8' }}>
                          <Edit sx={{ fontSize:14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteVisit(i)} sx={{ color:'#ef4444' }}>
                          <Delete sx={{ fontSize:14 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Log / Edit Visit Dialog */}
      <Dialog open={visitDialog}
        onClose={() => { setVisitDialog(false); setVisitForm(EMPTY_VISIT); setVisitErrors(VISIT_ERRORS_INIT); setEditVisitIdx(null) }}
        maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle sx={{ fontWeight:800, fontSize:17, color:'#0f172a', borderBottom:'1px solid #f1f5f9', pb:2 }}>
          {editVisitIdx!==null ? 'Edit Visit' : 'Log a Visit'}
        </DialogTitle>
        <DialogContent sx={{ pt:2.5 }}>
          <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>

            {/* Place Type */}
            <FormControl size="small" fullWidth error={!!visitErrors.type}>
              <InputLabel>Place Type *</InputLabel>
              <Select label="Place Type *" value={visitForm.type}
                onChange={(e) => setVisitForm(f => ({ ...f, type:e.target.value, specificName:'', customType:'' }))}>
                {VISIT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
              {visitErrors.type && <Typography sx={{ fontSize:11, color:'#ef4444', mt:0.5, ml:1 }}>{visitErrors.type}</Typography>}
            </FormControl>

            {/* Custom type field */}
            {visitForm.type==='Other' && (
              <TextField fullWidth size="small" label="Describe type of place *"
                value={visitForm.customType}
                onChange={(e) => setVisitForm(f => ({ ...f, customType:onlyAlphaNum(e.target.value) }))}
                error={!!visitErrors.customType} helperText={visitErrors.customType}
                placeholder='e.g. NGO, Government Office, Research Lab'
                inputProps={{ pattern:'[a-zA-Z0-9 \\-\'.,/]*' }} />
            )}

            {/* Place name */}
            <TextField fullWidth size="small"
              label={`${PLACE_LABEL[visitForm.type]||'Place Name'} *`}
              value={visitForm.specificName}
              onChange={(e) => setVisitForm(f => ({ ...f, specificName:onlyAlphaNum(e.target.value) }))}
              error={!!visitErrors.specificName} helperText={visitErrors.specificName} />

            {/* From / To */}
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              <TextField sx={{ flex:1, minWidth:140 }} label="From Location *" size="small"
                value={visitForm.fromLocation}
                onChange={(e) => setVisitForm(f => ({ ...f, fromLocation:onlyAlphaNum(e.target.value) }))}
                error={!!visitErrors.fromLocation} helperText={visitErrors.fromLocation} />
              <TextField sx={{ flex:1, minWidth:140 }} label="To Location *" size="small"
                value={visitForm.toLocation}
                onChange={(e) => setVisitForm(f => ({ ...f, toLocation:onlyAlphaNum(e.target.value) }))}
                error={!!visitErrors.toLocation} helperText={visitErrors.toLocation} />
            </Box>

            {/* Odometer & Contact */}
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              <TextField label="Odometer at Arrival (km)" size="small" sx={{ width:210 }}
                value={visitForm.kmAtArrival} inputMode="decimal"
                onChange={(e) => setVisitForm(f => ({ ...f, kmAtArrival:onlyNumbers(e.target.value) }))}
                error={!!visitErrors.kmAtArrival} helperText={visitErrors.kmAtArrival||'Numbers only'}
                inputProps={{ inputMode:'decimal', pattern:'[0-9.]*' }} />
              <TextField sx={{ flex:1, minWidth:140 }} label="Contact Person" size="small"
                value={visitForm.contactPerson}
                onChange={(e) => setVisitForm(f => ({ ...f, contactPerson:onlyLetters(e.target.value) }))}
                error={!!visitErrors.contactPerson} helperText={visitErrors.contactPerson||'Letters only'}
                inputProps={{ pattern:'[a-zA-Z \\-\'.]*' }} />
            </Box>

            {/* Role & Phone */}
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              <TextField sx={{ flex:1, minWidth:140 }} label="Role / Designation" size="small"
                value={visitForm.contactRole}
                onChange={(e) => setVisitForm(f => ({ ...f, contactRole:onlyAlphaNum(e.target.value) }))} />
              <TextField sx={{ width:160 }} label="Phone" size="small" inputMode="numeric"
                value={visitForm.phone}
                onChange={(e) => setVisitForm(f => ({ ...f, phone:onlyNumbers(e.target.value) }))}
                error={!!visitErrors.phone} helperText={visitErrors.phone||'Numbers only'}
                inputProps={{ inputMode:'numeric', pattern:'[0-9]*', maxLength:15 }} />
            </Box>

            {/* Lead Status */}
            <FormControl size="small" fullWidth>
              <InputLabel>Lead Status</InputLabel>
              <Select label="Lead Status" value={visitForm.leadStatus}
                onChange={(e) => setVisitForm(f => ({ ...f, leadStatus:e.target.value }))}>
                {LEAD_STATUSES.map(s => (
                  <MenuItem key={s} value={s}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:LEAD_COLOR[s] ? LEAD_COLOR[s].color : '#64748b' }} />
                      {s}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Notes */}
            <TextField fullWidth label="Notes / Observations" size="small" multiline rows={2}
              value={visitForm.notes}
              onChange={(e) => setVisitForm(f => ({ ...f, notes:e.target.value }))} />

            {/* Order flag */}
            <Box onClick={() => setVisitForm(f => ({ ...f, hasOrder:!f.hasOrder }))}
              sx={{ display:'flex', alignItems:'center', gap:1.5, p:2, cursor:'pointer',
                bgcolor:visitForm.hasOrder?'#fef9c3':'#f8fafc',
                border:`1px solid ${visitForm.hasOrder?'#fde68a':'#e2e8f0'}`, borderRadius:2 }}>
              <Box sx={{ width:18, height:18, borderRadius:1, flexShrink:0,
                border:`2px solid ${visitForm.hasOrder?'#ca8a04':'#cbd5e1'}`,
                bgcolor:visitForm.hasOrder?'#ca8a04':'transparent',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {visitForm.hasOrder && <Box sx={{ width:8, height:8, bgcolor:'white', borderRadius:0.5 }} />}
              </Box>
              <Typography sx={{ fontSize:13, fontWeight:600, color:visitForm.hasOrder?'#92400e':'#475569' }}>
                Order received — will redirect to Billing
              </Typography>
            </Box>

            {visitForm.hasOrder && (
              <TextField label="Order Value (₹)" size="small" inputMode="decimal"
                value={visitForm.orderValue}
                onChange={(e) => setVisitForm(f => ({ ...f, orderValue:onlyNumbers(e.target.value) }))}
                error={!!visitErrors.orderValue} helperText={visitErrors.orderValue||'Numbers only'}
                inputProps={{ inputMode:'decimal', pattern:'[0-9.]*' }}
                sx={{ width:200 }} />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2.5, gap:1 }}>
          <Button onClick={() => { setVisitDialog(false); setVisitForm(EMPTY_VISIT); setVisitErrors(VISIT_ERRORS_INIT); setEditVisitIdx(null) }}
            sx={{ color:'#64748b', fontWeight:600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVisit}
            sx={{ bgcolor:'#1d4ed8', '&:hover':{ bgcolor:'#1e40af' }, fontWeight:700, px:3, borderRadius:2 }}>
            {editVisitIdx!==null ? 'UPDATE VISIT' : 'LOG VISIT'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={summaryDialog} onClose={() => setSummaryDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle sx={{ fontWeight:800, fontSize:17, borderBottom:'1px solid #f1f5f9', pb:2 }}>Job Summary</DialogTitle>
        <DialogContent sx={{ pt:3 }}>
          <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2, mb:3 }}>
            {[
              { label:'Date',             value:new Date().toLocaleDateString('en-IN') },
              { label:'Start Time',       value:fmtTime(jobStartTime) },
              { label:'End Time',         value:fmtTime(jobEndTime) },
              { label:'Active Duration',  value:fmt(elapsed) },
              { label:'Total Paused',     value:fmt(totalPausedMs) },
              { label:'Distance Covered', value:`${totalKm()} km` },
              { label:'Total Visits',     value:visits.length },
              { label:'Orders Received',  value:visits.filter(v=>v.hasOrder).length },
            ].map(s => (
              <Box key={s.label} sx={{ p:2, bgcolor:'#f8fafc', borderRadius:2 }}>
                <Typography sx={{ fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:'0.07em' }}>{s.label.toUpperCase()}</Typography>
                <Typography sx={{ fontSize:16, fontWeight:700, color:'#0f172a', mt:0.3, fontFamily:'monospace' }}>{s.value}</Typography>
              </Box>
            ))}
          </Box>
          <Typography sx={{ fontWeight:700, fontSize:13, color:'#475569', mb:1.5 }}>LEAD BREAKDOWN</Typography>
          {LEAD_STATUSES.map(status => {
            const count = visits.filter(v=>v.leadStatus===status).length
            return count>0 ? (
              <Box key={status} sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', py:0.75, borderBottom:'1px solid #f1f5f9' }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:LEAD_COLOR[status] ? LEAD_COLOR[status].color : '#64748b' }} />
                  <Typography sx={{ fontSize:13, color:'#334155' }}>{status}</Typography>
                </Box>
                <Typography sx={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{count}</Typography>
              </Box>
            ) : null
          })}
          {visits.length>0 && (
            <Button fullWidth variant="outlined" sx={{ mt:3, borderColor:'#7c3aed', color:'#7c3aed', fontWeight:700, borderRadius:2 }}
              onClick={() => { setSummaryDialog(false); navigate('/agent/responses') }}>
              VIEW ALL RESPONSES
            </Button>
          )}
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2.5 }}>
          <Button onClick={() => setSummaryDialog(false)} sx={{ color:'#64748b', fontWeight:600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s=>({...s,open:false}))}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius:2, fontWeight:600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}