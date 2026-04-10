import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableHead, TableRow, LinearProgress, Alert, Snackbar, CircularProgress
} from '@mui/material'

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;
const getToken = () => localStorage.getItem('agentToken')
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

const VISIT_TYPES = ['Hospital', 'Clinic', 'Pharmacy', 'Office', 'Shop', 'Factory', 'Hotel', 'School', 'Other']

const PLACE_NAME_LABEL = {
  Hospital: 'Hospital Name', Clinic: 'Clinic Name',
  Pharmacy: 'Pharmacy / Medical Store Name', Office: 'Office / Company Name',
  Shop: 'Shop Name', Factory: 'Factory Name', Hotel: 'Hotel Name',
  School: 'School / College Name', Other: 'Place Name'
}

const PLACE_PLACEHOLDER = {
  Hospital: 'e.g. City General Hospital', Clinic: 'e.g. Dr. Sharma Clinic',
  Pharmacy: 'e.g. Sunrise Pharmacy', Office: 'e.g. Head Office',
  Shop: 'e.g. Health & Wellness Store', Factory: 'e.g. ABC Pharmaceuticals',
  Hotel: 'e.g. Taj Hotel', School: 'e.g. DPS School', Other: 'Enter the place name'
}

const LEAD_STATUSES = ['Interested', 'Not Interested', 'Follow Up', 'Order Placed', 'No Response', 'Callback Requested']

const EMPTY_VISIT = {
  specificName: '', type: '', customType: '',
  fromLocation: '', toLocation: '', kmAtArrival: '',
  contactPerson: '', notes: '', leadStatus: 'Interested', hasOrder: false
}

const fmt = (ms) => {
  if (!ms || ms < 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const fmtTime = (ts) => ts
  ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  : '--:--:--'

export default function JobActivity() {
  const navigate = useNavigate()

  const [jobStatus, setJobStatus] = useState('idle')
  const [jobStartTime, setJobStartTime] = useState(null)
  const [jobEndTime, setJobEndTime] = useState(null)
  const [pauseStart, setPauseStart] = useState(null)
  const [totalPausedMs, setTotalPausedMs] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [startKm, setStartKm] = useState('')
  const [currentKm, setCurrentKm] = useState('')

  const [visits, setVisits] = useState([])
  const [visitDialog, setVisitDialog] = useState(false)
  const [visitForm, setVisitForm] = useState(EMPTY_VISIT)

  const [summaryDialog, setSummaryDialog] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })
  const [now, setNow] = useState(new Date())

  // GPS
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [gpsCoords, setGpsCoords] = useState(null)
  const locationWatchRef = useRef(null)
  const locationSyncRef = useRef(null)

  // Job requirements from backend
  const [requirements, setRequirements] = useState({ requireLocation: true, requireImage: false })
  const [ setGeofence] = useState({ enabled: false })

  // Proof image
  const [proofImageFile, setProofImageFile] = useState(null)
  const [proofImagePreview, setProofImagePreview] = useState(null)
  const proofImageRef = useRef(null)

  // Geofence alert
  const [geofenceAlert, setGeofenceAlert] = useState(null)

  useEffect(() => {
    const c = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(c)
  }, [])

  const persist = useCallback((patch) => {
    const prev = JSON.parse(localStorage.getItem('agentJobState') || '{}')
    localStorage.setItem('agentJobState', JSON.stringify({ ...prev, ...patch }))
  }, [])

  // Fetch job requirements
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/agent/job-requirements`, { headers: authHeaders() })
        const data = await res.json()
        if (data.success) {
          setRequirements(data.requirements || { requireLocation: true, requireImage: false })
          setGeofence(data.geofence || { enabled: false })
        }
      } catch (_) { }
    })()
  }, [])

  // Boot: restore state
  useEffect(() => {
    const boot = async () => {
      const saved = JSON.parse(localStorage.getItem('agentJobState') || '{}')
      if (saved.jobStatus && saved.jobStatus !== 'idle' && saved.jobStatus !== 'ended') {
        setJobStatus(saved.jobStatus)
        setJobStartTime(saved.jobStartTime)
        setTotalPausedMs(saved.totalPausedMs || 0)
        setPauseStart(saved.pauseStart || null)
        setStartKm(saved.startKm || '')
        setCurrentKm(saved.currentKm || '')
      }
      if (saved.visits) setVisits(saved.visits)
      if (saved.gpsCoords) setGpsCoords(saved.gpsCoords)

      try {
        const res = await fetch(`${API_BASE}/agent/job-status`, { headers: authHeaders() })
        const data = await res.json()
        if (data.success && data.isOnJob) {
          const backendStart = data.currentJob?.jobStartTime
            ? new Date(data.currentJob.jobStartTime).getTime()
            : saved.jobStartTime
          if (!saved.jobStatus || saved.jobStatus === 'idle') {
            setJobStatus('active')
            setJobStartTime(backendStart)
            persist({ jobStatus: 'active', jobStartTime: backendStart, totalPausedMs: 0 })
          }
          if (!saved.startKm && data.currentJob?.startKm)
            setStartKm(String(data.currentJob.startKm))
        }
      } catch (_) { }

      setLoading(false)
    }
    boot()
  }, [])

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('requesting')

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed || 0,
        }
        setGpsCoords(coords)
        setGpsStatus('granted')
        persist({ gpsCoords: coords })
      },
      (err) => {
        setGpsStatus(err.code === 1 ? 'denied' : 'error')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )

    return () => {
      if (locationWatchRef.current != null)
        navigator.geolocation.clearWatch(locationWatchRef.current)
    }
  }, [])

  // Sync location every 30s — also handles geofence alert from backend
  useEffect(() => {
    clearInterval(locationSyncRef.current)

    if (jobStatus === 'active' && gpsCoords) {
      const syncLocation = async () => {
        try {
          const res = await fetch(`${API_BASE}/agent/location/update`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              latitude: gpsCoords.latitude,
              longitude: gpsCoords.longitude,
              accuracy: gpsCoords.accuracy,
              speed: gpsCoords.speed,
              distanceJumpKm: 0,
            })
          })
          const data = await res.json()
          if (data.geofenceAlert?.outside) {
            setGeofenceAlert(data.geofenceAlert)
          } else {
            setGeofenceAlert(null)
          }
        } catch (_) { }
      }

      syncLocation()
      locationSyncRef.current = setInterval(syncLocation, 30000)
    }

    return () => clearInterval(locationSyncRef.current)
  }, [jobStatus, gpsCoords])

  // Timer
  useEffect(() => {
    clearInterval(timerRef.current)
    if (jobStatus === 'active' && jobStartTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - jobStartTime - totalPausedMs)
      }, 1000)
    } else if (jobStatus === 'paused' && jobStartTime) {
      const frozenAt = pauseStart || Date.now()
      setElapsed(frozenAt - jobStartTime - totalPausedMs)
    }
    return () => clearInterval(timerRef.current)
  }, [jobStatus, jobStartTime, totalPausedMs, pauseStart])

  const totalKm = () => Math.max(0, (parseFloat(currentKm) || 0) - (parseFloat(startKm) || 0)).toFixed(1)

  // Convert file to base64
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  // GPS banner
  const GpsBanner = () => {
    if (gpsStatus === 'granted' && gpsCoords) return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 10, marginBottom: 12,
        background: '#f0fdf4', border: '1px solid #bbf7d0',
        fontSize: 13, color: '#15803d', fontWeight: 500,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#16a34a',
          animation: 'gpspulse 1.5s infinite', flexShrink: 0
        }} />
        <span>
          Location active · {gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)}
          <span style={{ color: '#86efac', marginLeft: 6, fontSize: 11 }}>
            ±{Math.round(gpsCoords.accuracy || 0)}m
          </span>
        </span>
      </div>
    )
    if (gpsStatus === 'requesting') return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 10, marginBottom: 12,
        background: '#fffbeb', border: '1px solid #fde68a',
        fontSize: 13, color: '#92400e',
      }}>
        <CircularProgress size={14} sx={{ color: '#d97706' }} />
        Requesting location permission...
      </div>
    )
    if (gpsStatus === 'denied') return (
      <div style={{
        padding: '12px 14px', borderRadius: 10, marginBottom: 12,
        background: '#fef2f2', border: '1px solid #fecaca',
        fontSize: 13, color: '#dc2626',
      }}>
        <strong>Location access denied.</strong> Enable location in browser settings.
        <button
          onClick={() => {
            setGpsStatus('requesting')
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setGpsCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, speed: 0 })
                setGpsStatus('granted')
              },
              () => setGpsStatus('denied'),
              { enableHighAccuracy: true }
            )
          }}
          style={{ marginLeft: 10, padding: '3px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
        >
          Try Again
        </button>
      </div>
    )
    if (gpsStatus === 'error') return (
      <div style={{
        padding: '10px 14px', borderRadius: 10, marginBottom: 12,
        background: '#fef2f2', border: '1px solid #fecaca',
        fontSize: 13, color: '#dc2626',
      }}>
        GPS not available on this device.
      </div>
    )
    return null
  }

  // Geofence alert banner
  const GeofenceAlert = () => {
    if (!geofenceAlert?.outside) return null
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: 12,
        background: '#fef2f2', border: '2px solid #fca5a5',
        fontSize: 13, color: '#dc2626', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#dc2626',
          animation: 'gpspulse 1s infinite', flexShrink: 0
        }} />
        <div>
          You are outside your assigned area.
          <span style={{ fontWeight: 400, marginLeft: 6 }}>
            You are {geofenceAlert.distanceKm} km from your zone center (limit: {geofenceAlert.radiusKm} km).
          </span>
        </div>
      </div>
    )
  }

  // START JOB
  const handleStart = async () => {
    if (!startKm) return setSnack({ open: true, msg: 'Enter starting odometer reading', severity: 'warning' })

    if (requirements.requireLocation && (gpsStatus !== 'granted' || !gpsCoords)) {
      return setSnack({ open: true, msg: 'Location access required before starting a job', severity: 'warning' })
    }

    if (requirements.requireImage && !proofImageFile) {
      return setSnack({ open: true, msg: 'Start-of-job photo is required', severity: 'warning' })
    }

    setSubmitting(true)
    try {
      let startProofImageBase64 = null
      let startProofImageMimeType = null

      if (proofImageFile) {
        startProofImageBase64 = await fileToBase64(proofImageFile)
        startProofImageMimeType = proofImageFile.type
      }

      const res = await fetch(`${API_BASE}/agent/start-job`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          latitude: gpsCoords?.latitude,
          longitude: gpsCoords?.longitude,
          locationAccuracy: gpsCoords?.accuracy || 10,
          state: '', district: '', area: '', address: '',
          startKm: parseFloat(startKm),
          startProofImageBase64,
          startProofImageMimeType,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to start job')

      const t = Date.now()
      setJobStartTime(t)
      setJobStatus('active')
      setElapsed(0)
      setTotalPausedMs(0)
      setVisits([])
      setProofImageFile(null)
      setProofImagePreview(null)
      persist({ jobStatus: 'active', jobStartTime: t, totalPausedMs: 0, pauseStart: null, startKm, currentKm: '', visits: [] })
      setSnack({ open: true, msg: 'Job started successfully.', severity: 'success' })
    } catch (e) {
      setSnack({ open: true, msg: e.message, severity: 'error' })
    }
    setSubmitting(false)
  }

  // PAUSE
  const handlePause = () => {
    const ps = Date.now()
    setPauseStart(ps)
    setJobStatus('paused')
    persist({ jobStatus: 'paused', pauseStart: ps })
    setSnack({ open: true, msg: 'Job paused.', severity: 'info' })
  }

  // RESUME
  const handleResume = () => {
    const extra = Date.now() - pauseStart
    const newPaused = totalPausedMs + extra
    setTotalPausedMs(newPaused)
    setPauseStart(null)
    setJobStatus('active')
    persist({ jobStatus: 'active', totalPausedMs: newPaused, pauseStart: null })
    setSnack({ open: true, msg: 'Job resumed.', severity: 'success' })
  }

  // END
  const handleEnd = async () => {
    if (!currentKm) return setSnack({ open: true, msg: 'Update current odometer before ending', severity: 'warning' })
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/agent/close-job`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ totalDistanceKm: parseFloat(totalKm()) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to close job')
      clearInterval(timerRef.current)
      setJobEndTime(Date.now())
      setJobStatus('ended')
      setGeofenceAlert(null)
      localStorage.removeItem('agentJobState')
      setSummaryDialog(true)
    } catch (e) {
      setSnack({ open: true, msg: e.message, severity: 'error' })
    }
    setSubmitting(false)
  }

  // ADD VISIT
  const handleAddVisit = () => {
    const resolvedType = visitForm.type === 'Other'
      ? (visitForm.customType.trim() || 'Other')
      : visitForm.type

    if (!visitForm.specificName.trim() || !visitForm.fromLocation || !visitForm.toLocation) {
      return setSnack({ open: true, msg: 'Place name, from and to location are required', severity: 'warning' })
    }

    const entry = {
      ...visitForm, resolvedType,
      place: visitForm.specificName.trim(),
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
    const updated = [...visits, entry]
    setVisits(updated)
    if (entry.kmAtArrival) { setCurrentKm(entry.kmAtArrival); persist({ currentKm: entry.kmAtArrival }) }
    persist({ visits: updated })

    fetch(`${API_BASE}/agent/job/save`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ hospitalName: entry.place, area: entry.toLocation, address: entry.toLocation })
    }).catch(() => { })

    if (entry.hasOrder) {
      setSnack({ open: true, msg: 'Visit logged. Redirecting to Billing...', severity: 'success' })
      setTimeout(() => navigate('/agent/billing/invoices'), 2000)
    } else {
      setSnack({ open: true, msg: 'Visit logged.', severity: 'success' })
    }
    setVisitForm(EMPTY_VISIT)
    setVisitDialog(false)
  }

  const statusBadge = () => {
    const map = { idle: 'Not Started', active: 'Active', paused: 'Paused', ended: 'Completed' }
    const col = { idle: '#1d4ed8', active: '#16a34a', paused: '#d97706', ended: '#64748b' }
    return (
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: 20,
        bgcolor: col[jobStatus] + '18', border: `1.5px solid ${col[jobStatus]}40`
      }}>
        <Box sx={{
          width: 8, height: 8, borderRadius: '50%', bgcolor: col[jobStatus],
          animation: jobStatus === 'active' ? 'pulse 1.5s infinite' : 'none',
          '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } }
        }} />
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: col[jobStatus], letterSpacing: '0.08em' }}>
          {map[jobStatus].toUpperCase()}
        </Typography>
      </Box>
    )
  }

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: '#1d4ed8' }} />
      <Typography sx={{ color: '#64748b', fontSize: 14 }}>Checking job status...</Typography>
    </Box>
  )

  const canStart = jobStatus === 'idle' &&
    (!requirements.requireLocation || gpsStatus === 'granted') &&
    (!requirements.requireImage || proofImageFile)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>
      <style>{`
        @keyframes gpspulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(22,163,74,0.4);} 70%{box-shadow:0 0 0 6px rgba(22,163,74,0);} }
      `}</style>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Job Activity
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: 14, mt: 0.5 }}>
            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {statusBadge()}
          <Typography sx={{
            fontFamily: 'monospace', fontSize: 13, color: '#475569',
            bgcolor: '#f1f5f9', px: 2, py: 0.75, borderRadius: 2, border: '1px solid #e2e8f0'
          }}>
            {now.toLocaleTimeString('en-IN')}
          </Typography>
        </Box>
      </Box>

      {/* GPS Banner */}
      <GpsBanner />

      {/* Geofence Alert */}
      <GeofenceAlert />

      {/* Pre-start requirements card — shown only when idle */}
      {jobStatus === 'idle' && (requirements.requireLocation || requirements.requireImage) && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5, mb: 3, bgcolor: 'white' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#475569', mb: 2, letterSpacing: '0.06em' }}>
            REQUIRED BEFORE STARTING
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {requirements.requireLocation && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  bgcolor: gpsStatus === 'granted' ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${gpsStatus === 'granted' ? '#bbf7d0' : '#fecaca'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>
                  {gpsStatus === 'granted' ? (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>!</span>
                  )}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Location</Typography>
                  <Typography sx={{ fontSize: 11, color: gpsStatus === 'granted' ? '#16a34a' : '#dc2626' }}>
                    {gpsStatus === 'granted' ? 'GPS active' : 'Waiting for location permission'}
                  </Typography>
                </Box>
              </Box>
            )}

            {requirements.requireImage && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  bgcolor: proofImageFile ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${proofImageFile ? '#bbf7d0' : '#fecaca'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>
                  {proofImageFile ? (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>!</span>
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    Start-of-Job Photo
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#94a3b8', mb: 1 }}>
                    Upload a photo from your current location (auto-deleted after 24h)
                  </Typography>

                  {proofImagePreview ? (
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={proofImagePreview}
                        alt="Proof preview"
                        style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', display: 'block' }}
                      />
                      <button
                        onClick={() => { setProofImageFile(null); setProofImagePreview(null) }}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#ef4444', border: 'none', color: '#fff',
                          cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    </Box>
                  ) : (
                    <button
                      onClick={() => proofImageRef.current?.click()}
                      style={{
                        padding: '7px 14px', borderRadius: 8,
                        border: '1px dashed #cbd5e1', background: '#f8fafc',
                        color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}
                    >
                      Choose Photo
                    </button>
                  )}

                  <input
                    ref={proofImageRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setProofImageFile(file)
                        const reader = new FileReader()
                        reader.onload = (ev) => setProofImagePreview(ev.target.result)
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Odometer */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5, mb: 3, bgcolor: 'white' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#475569', mb: 2, letterSpacing: '0.06em' }}>
          ODOMETER READING
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <TextField
            label="Start Reading (km)" size="small" type="number"
            value={startKm} disabled={jobStatus !== 'idle'}
            onChange={e => { setStartKm(e.target.value); persist({ startKm: e.target.value }) }}
            sx={{ width: 180 }}
          />
          <TextField
            label="Current Reading (km)" size="small" type="number"
            value={currentKm} disabled={jobStatus === 'idle' || jobStatus === 'ended'}
            onChange={e => { setCurrentKm(e.target.value); persist({ currentKm: e.target.value }) }}
            sx={{ width: 180 }}
          />
          <Box sx={{ px: 2.5, py: 1, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
            <Typography sx={{ fontSize: 11, color: '#16a34a', fontWeight: 600, letterSpacing: '0.05em' }}>
              TOTAL TRAVELLED
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>
              {totalKm()} <span style={{ fontSize: 13, fontWeight: 500 }}>km</span>
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Timer Card */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, mb: 3, bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', mb: 1 }}>
              ACTIVE WORK TIME
            </Typography>
            <Typography sx={{
              fontFamily: 'monospace', fontSize: { xs: 38, md: 52 }, fontWeight: 800, lineHeight: 1,
              color: jobStatus === 'active' ? '#1d4ed8' : jobStatus === 'paused' ? '#d97706' : '#64748b'
            }}>
              {fmt(elapsed)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
              {[
                { label: 'START', val: fmtTime(jobStartTime) },
                jobStatus === 'ended' ? { label: 'END', val: fmtTime(jobEndTime) } : null,
                { label: 'PAUSED', val: fmt(totalPausedMs) },
                { label: 'VISITS', val: visits.length },
              ].filter(Boolean).map(x => (
                <Box key={x.label}>
                  <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>{x.label}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>{x.val}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {jobStatus === 'idle' && (
              <Button
                variant="contained"
                onClick={handleStart}
                disabled={submitting || !canStart}
                title={
                  !canStart
                    ? requirements.requireImage && !proofImageFile
                      ? 'Upload start photo first'
                      : 'Location access required'
                    : ''
                }
                sx={{
                  bgcolor: canStart ? '#16a34a' : '#94a3b8',
                  '&:hover': { bgcolor: canStart ? '#15803d' : '#94a3b8' },
                  px: 3.5, py: 1.2, borderRadius: 2, fontWeight: 700, fontSize: 13,
                  boxShadow: canStart ? '0 4px 14px rgba(22,163,74,0.3)' : 'none'
                }}
              >
                {submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'START JOB'}
              </Button>
            )}
            {(jobStatus === 'active' || jobStatus === 'paused') && (
              <>
                {jobStatus === 'active'
                  ? <Button variant="outlined" onClick={handlePause}
                    sx={{ borderColor: '#d97706', color: '#d97706', '&:hover': { bgcolor: '#fffbeb' }, px: 3, py: 1.2, borderRadius: 2, fontWeight: 700, fontSize: 13 }}>
                    PAUSE
                  </Button>
                  : <Button variant="contained" onClick={handleResume}
                    sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, px: 3, py: 1.2, borderRadius: 2, fontWeight: 700, fontSize: 13 }}>
                    RESUME
                  </Button>
                }
                <Button variant="outlined" onClick={() => setVisitDialog(true)}
                  sx={{ borderColor: '#1d4ed8', color: '#1d4ed8', '&:hover': { bgcolor: '#eff6ff' }, px: 3, py: 1.2, borderRadius: 2, fontWeight: 700, fontSize: 13 }}>
                  LOG VISIT
                </Button>
                <Button variant="contained" onClick={handleEnd} disabled={submitting}
                  sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, px: 3, py: 1.2, borderRadius: 2, fontWeight: 700, fontSize: 13 }}>
                  {submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'END JOB'}
                </Button>
              </>
            )}
            {jobStatus === 'ended' && (
              <Button variant="outlined" onClick={() => setSummaryDialog(true)}
                sx={{ borderColor: '#64748b', color: '#64748b', px: 3, py: 1.2, borderRadius: 2, fontWeight: 700, fontSize: 13 }}>
                VIEW SUMMARY
              </Button>
            )}
          </Box>
        </Box>

        {jobStatus === 'active' && (
          <Box sx={{ mt: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>8-hour workday progress</Typography>
              <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                {Math.min(100, Math.floor(elapsed / (8 * 3600000) * 100))}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (elapsed / (8 * 3600000)) * 100)}
              sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#1d4ed8', borderRadius: 3 } }}
            />
          </Box>
        )}
      </Paper>

      {/* Stats Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'DISTANCE', value: `${totalKm()} km`, sub: `${startKm || 0} to ${currentKm || startKm || 0}` },
          { label: 'VISITS', value: visits.length, sub: `${visits.filter(v => v.hasOrder).length} with orders` },
          { label: 'LEADS', value: visits.filter(v => v.leadStatus === 'Interested').length, sub: 'Interested' },
          { label: 'AVG / VISIT', value: visits.length > 0 ? fmt(elapsed / visits.length) : '--:--:--', sub: 'time per visit' }
        ].map(s => (
          <Paper key={s.label} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5, bgcolor: 'white' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', mb: 0.5 }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{s.value}</Typography>
            <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.3 }}>{s.sub}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Visit Log */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', bgcolor: 'white' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Today's Visit Log</Typography>
          {(jobStatus === 'active' || jobStatus === 'paused') && (
            <Button size="small" variant="outlined" onClick={() => setVisitDialog(true)}
              sx={{ borderColor: '#1d4ed8', color: '#1d4ed8', fontSize: 12, fontWeight: 700 }}>
              ADD VISIT
            </Button>
          )}
        </Box>
        {visits.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>No visits logged yet.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['#', 'Time', 'Place', 'Type', 'Route', 'KM', 'Contact', 'Lead Status', 'Order', 'Notes'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', py: 1.5, whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visits.map((v, i) => (
                  <TableRow key={v.id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, borderBottom: '1px solid #f1f5f9' }}>
                    <TableCell sx={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{i + 1}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', color: '#334155' }}>{v.time}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v.place}</TableCell>
                    <TableCell>
                      <Chip label={v.resolvedType || v.type} size="small"
                        sx={{ fontSize: 10, height: 20, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                      {v.fromLocation} to {v.toLocation}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', color: '#334155' }}>
                      {v.kmAtArrival ? `${v.kmAtArrival} km` : '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#475569' }}>{v.contactPerson || '—'}</TableCell>
                    <TableCell>
                      <Chip label={v.leadStatus} size="small" sx={{
                        fontSize: 10, height: 20, fontWeight: 600,
                        bgcolor: v.leadStatus === 'Interested' ? '#f0fdf4' : v.leadStatus === 'Order Placed' ? '#fef9c3' : v.leadStatus === 'No Response' ? '#fef2f2' : '#f8fafc',
                        color: v.leadStatus === 'Interested' ? '#16a34a' : v.leadStatus === 'Order Placed' ? '#ca8a04' : v.leadStatus === 'No Response' ? '#dc2626' : '#475569'
                      }} />
                    </TableCell>
                    <TableCell>
                      {v.hasOrder
                        ? <Chip label="ORDER" size="small"
                          sx={{ fontSize: 10, height: 20, bgcolor: '#fef9c3', color: '#92400e', fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => navigate('/agent/billing/invoices')} />
                        : <Typography sx={{ fontSize: 11, color: '#cbd5e1' }}>—</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                        {v.notes || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Log Visit Dialog */}
      <Dialog open={visitDialog} onClose={() => { setVisitDialog(false); setVisitForm(EMPTY_VISIT) }}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, color: '#0f172a', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          Log a Visit
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Place Type</InputLabel>
              <Select label="Place Type" value={visitForm.type}
                onChange={e => setVisitForm(f => ({ ...f, type: e.target.value, specificName: '', customType: '' }))}>
                {VISIT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth size="small"
              label={PLACE_NAME_LABEL[visitForm.type] || 'Place Name'}
              placeholder={PLACE_PLACEHOLDER[visitForm.type] || 'Enter place name'}
              value={visitForm.specificName}
              onChange={e => setVisitForm(f => ({ ...f, specificName: e.target.value }))} />
            {visitForm.type === 'Other' && (
              <TextField fullWidth size="small"
                label="Describe the type of place"
                value={visitForm.customType}
                onChange={e => setVisitForm(f => ({ ...f, customType: e.target.value }))} />
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="From Location" size="small"
                value={visitForm.fromLocation}
                onChange={e => setVisitForm(f => ({ ...f, fromLocation: e.target.value }))} />
              <TextField fullWidth label="To Location" size="small"
                value={visitForm.toLocation}
                onChange={e => setVisitForm(f => ({ ...f, toLocation: e.target.value }))} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Odometer at Arrival (km)" size="small" type="number" sx={{ width: 210 }}
                value={visitForm.kmAtArrival}
                onChange={e => setVisitForm(f => ({ ...f, kmAtArrival: e.target.value }))} />
              <TextField fullWidth label="Contact Person" size="small"
                value={visitForm.contactPerson}
                onChange={e => setVisitForm(f => ({ ...f, contactPerson: e.target.value }))} />
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Lead Status</InputLabel>
              <Select label="Lead Status" value={visitForm.leadStatus}
                onChange={e => setVisitForm(f => ({ ...f, leadStatus: e.target.value }))}>
                {LEAD_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Notes / Observations" size="small" multiline rows={2}
              value={visitForm.notes}
              onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))} />
            <Box
              onClick={() => setVisitForm(f => ({ ...f, hasOrder: !f.hasOrder }))}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 2, cursor: 'pointer',
                bgcolor: visitForm.hasOrder ? '#fef9c3' : '#f8fafc',
                border: `1px solid ${visitForm.hasOrder ? '#fde68a' : '#e2e8f0'}`, borderRadius: 2
              }}>
              <Box sx={{
                width: 18, height: 18, borderRadius: 1, flexShrink: 0,
                border: `2px solid ${visitForm.hasOrder ? '#ca8a04' : '#cbd5e1'}`,
                bgcolor: visitForm.hasOrder ? '#ca8a04' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {visitForm.hasOrder && <Box sx={{ width: 8, height: 8, bgcolor: 'white', borderRadius: 0.5 }} />}
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: visitForm.hasOrder ? '#92400e' : '#475569' }}>
                Order received at this visit — will redirect to Billing
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setVisitDialog(false); setVisitForm(EMPTY_VISIT) }}
            sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddVisit}
            sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, fontWeight: 700, px: 3, borderRadius: 2 }}>
            LOG VISIT
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={summaryDialog} onClose={() => setSummaryDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          Job Summary
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            {[
              { label: 'Date', value: new Date().toLocaleDateString('en-IN') },
              { label: 'Start Time', value: fmtTime(jobStartTime) },
              { label: 'End Time', value: fmtTime(jobEndTime) },
              { label: 'Active Duration', value: fmt(elapsed) },
              { label: 'Total Paused', value: fmt(totalPausedMs) },
              { label: 'Distance Covered', value: `${totalKm()} km` },
              { label: 'Total Visits', value: visits.length },
              { label: 'Orders Received', value: visits.filter(v => v.hasOrder).length },
            ].map(s => (
              <Box key={s.label} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>
                  {s.label.toUpperCase()}
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a', mt: 0.3, fontFamily: 'monospace' }}>
                  {s.value}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#475569', mb: 1.5 }}>LEAD BREAKDOWN</Typography>
          {LEAD_STATUSES.map(status => {
            const count = visits.filter(v => v.leadStatus === status).length
            return count > 0 ? (
              <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ fontSize: 13, color: '#334155' }}>{status}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{count}</Typography>
              </Box>
            ) : null
          })}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSummaryDialog(false)} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}