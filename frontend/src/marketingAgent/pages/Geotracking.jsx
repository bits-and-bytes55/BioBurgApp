import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getTrackingByDate,
  toggleGeoTracking,
  checkInGeo,
  checkOutGeo,
  addGeoVisit,
  verifyGeoVisit,
  deleteGeoVisit,
  pushGeoLocation,
  getGeoHistory,
} from '../../services/geoTrackingService.js'
import {
  Box, Paper, Grid, Typography, Button, Chip, Switch,
  FormControlLabel, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, IconButton, CircularProgress,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Tooltip, Divider,
  useMediaQuery, useTheme, List, ListItem, ListItemText,
  ListItemIcon, InputAdornment, Fade,
} from '@mui/material'
import {
  GpsFixed, LocationOn, CheckCircle, Schedule, Add,
  Delete, Refresh, FileDownload, MyLocation,
  AccessTime, DirectionsWalk, Verified, Search,
  Close, PlaceOutlined, WarningAmber,
} from '@mui/icons-material'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageShell from './Pageshell'

// ── Fix Leaflet default marker icons (Vite/webpack issue) ──
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Custom coloured visit marker ──
const createVisitIcon = (color = '#1d4ed8', verified = false) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;font-weight:800;
      border:3px solid #fff;
      box-shadow:0 3px 10px rgba(0,0,0,0.3);
      position:relative;
    ">
      ${verified
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
      }
    </div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 16],
    popupAnchor:[0, -18],
  })

// ── Auto-fit map bounds to all markers ──
function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length > 0) {
      try {
        const bounds = L.latLngBounds(positions)
        if (bounds.isValid()) {
  map.fitBounds(bounds, {
    padding: [40, 40],
    maxZoom: 15,
    animate: true,
    duration: 1,
  })
}
      } catch {}
    }
  }, [positions, map])
  return null
}

const BASE     = import.meta.env.VITE_API_BASE_URL;
// ── Activity meta ──
const ACTIVITY_META = {
  'Doctor Visit':      { contactLabel: 'Doctor Name',      locationLabel: 'Clinic / Chamber Name'  },
  'Hospital Round':    { contactLabel: 'Purchase Manager', locationLabel: 'Hospital Name'           },
  'Distributor Meet':  { contactLabel: 'Distributor Name', locationLabel: 'Distribution Centre'     },
  'Retailer Visit':    { contactLabel: 'Retailer Name',    locationLabel: 'Medical Store Name'      },
  'Stockist Visit':    { contactLabel: 'Stockist Name',    locationLabel: 'Stockist Office'         },
  'Path Lab Visit':    { contactLabel: 'Lab Manager',      locationLabel: 'Pathology Lab Name'      },
  'Diagnostic Centre': { contactLabel: 'Centre Manager',   locationLabel: 'Diagnostic Centre Name'  },
  'Medical Store':     { contactLabel: 'Pharmacist Name',  locationLabel: 'Medical Store Name'      },
  'Office Meeting':    { contactLabel: 'Meeting Host',     locationLabel: 'Office / Branch Name'    },
  'Training':          { contactLabel: 'Trainer Name',     locationLabel: 'Training Venue'          },
  'Other':             { contactLabel: 'Contact Person',   locationLabel: 'Location Name'           },
}
const ACTIVITY_OPTIONS = Object.keys(ACTIVITY_META)

const todayStr   = () => new Date().toISOString().slice(0, 10)
const emptyVisit = () => ({
  location: '', placeId: '', address: '', lat: '', lng: '',
  activity: '', contactPerson: '', contactNumber: '',
  clinicName: '', area: '', notes: '',
})

// ── Stat card ──
const StatCard = ({ label, value, sub, color, icon }) => (
  <Paper elevation={0} sx={{
    p: { xs: 1.8, sm: 2.5 }, borderRadius: 3,
    border: '1px solid', borderColor: 'divider',
    display: 'flex', alignItems: 'center', gap: 2, height: '100%',
  }}>
    <Box sx={{
      width: 44, height: 44, borderRadius: 2, flexShrink: 0,
      bgcolor: color + '18', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color,
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{
        fontSize: 10, fontWeight: 700, color: 'text.secondary',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: { xs: 20, sm: 24 }, fontWeight: 800,
        lineHeight: 1.1, color: 'text.primary',
      }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.2 }}>
          {sub}
        </Typography>
      )}
    </Box>
  </Paper>
)

// ── Google Places Autocomplete ──
// ── OpenStreetMap Places Search ──
async function searchPlaces(query) {
  if (!query || query.length < 3) return []

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`

  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
    },
  })

  const data = await res.json()

  return data.map(item => ({
    place_id: item.place_id,
    description: item.display_name,
    main_text: item.display_name.split(',')[0],
    secondary_text: item.display_name
      .split(',')
      .slice(1, 3)
      .join(',')
      .trim(),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }))
}

function PlacesSearchInput({
  label,
  placeholder,
  onSelect,
  error,
  helperText,
  defaultValue,
}) {
  const [query, setQuery] = useState(defaultValue || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)

  const debRef = useRef(null)

  useEffect(() => {
    setQuery(defaultValue || '')
  }, [defaultValue])

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.length < 3) {
      setSuggestions([])
      return
    }

    setFetching(true)

    try {
      const results = await searchPlaces(input)

      setSuggestions(results)

      setOpen(results.length > 0)
    } catch (_) {
      setSuggestions([])
    } finally {
      setFetching(false)
    }
  }, [])

  const handleChange = (e) => {
    const val = e.target.value

    setQuery(val)

    clearTimeout(debRef.current)

    debRef.current = setTimeout(() => {
      fetchSuggestions(val)
    }, 500)
  }

  const handleSelect = (pred) => {
    setQuery(pred.description)

    setOpen(false)

    setSuggestions([])

    onSelect?.({
      placeId: String(pred.place_id),
      placeName: pred.main_text,
      address: pred.description,
      lat: pred.lat,
      lng: pred.lng,
    })
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        size="small"
        label={label}
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        onFocus={() =>
          suggestions.length > 0 && setOpen(true)
        }
        onBlur={() =>
          setTimeout(() => setOpen(false), 250)
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {fetching ? (
                <CircularProgress size={14} />
              ) : (
                <Search
                  sx={{
                    fontSize: 18,
                    color: 'text.secondary',
                  }}
                />
              )}
            </InputAdornment>
          ),

          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onMouseDown={(e) => {
                  e.preventDefault()

                  setQuery('')

                  setSuggestions([])

                  onSelect?.(null)
                }}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      <Fade in={open && suggestions.length > 0}>
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            maxHeight: 260,
            overflowY: 'auto',
            borderRadius: 2,
            mt: 0.5,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <List dense disablePadding>
            {suggestions.map((s, i) => (
              <ListItem
                key={s.place_id || i}
                button
                onMouseDown={(e) => {
                  e.preventDefault()

                  handleSelect(s)
                }}
                sx={{
                  py: 1,
                  px: 1.5,

                  '&:hover': {
                    bgcolor: 'action.hover',
                  },

                  borderBottom:
                    i < suggestions.length - 1
                      ? '1px solid'
                      : 'none',

                  borderColor: 'divider',

                  cursor: 'pointer',
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PlaceOutlined
                    sx={{
                      fontSize: 18,
                      color: 'primary.main',
                    }}
                  />
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {s.main_text}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: 'text.secondary',
                      }}
                    >
                      {s.secondary_text}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Box
            sx={{
              px: 1.5,
              py: 0.8,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                color: 'text.disabled',
              }}
            >
              OpenStreetMap / Nominatim
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Box>
  )
}

//  MAIN COMPONENT
export default function GeoTracking() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [date,        setDate]        = useState(todayStr())
  const [tracking,    setTracking]    = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [addOpen,     setAddOpen]     = useState(false)
  const [visitForm,   setVisitForm]   = useState(emptyVisit())
  const [formErr,     setFormErr]     = useState({})
  const [gpsLoading,  setGpsLoading]  = useState(false)
  const [history,     setHistory]     = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)

  const meta = ACTIVITY_META[visitForm.activity] || ACTIVITY_META['Other']

  // ── Load record ──
  const loadTracking = useCallback(async () => {
  setLoading(true)
  setError('')

  try {
    const data = await getTrackingByDate(date)

    setTracking(data.tracking)
  } catch (e) {
    setError(e.message)
  } finally {
    setLoading(false)
  }
}, [date])
  useEffect(() => { loadTracking() }, [loadTracking])

  // ── Auto GPS push every 2 min ──
  const gpsRef = useRef(null)
  useEffect(() => {
    if (!tracking?.trackingEnabled) {
  if (gpsRef.current) {
    clearInterval(gpsRef.current)
  }

  return
}
    const push = () => {
  if (!navigator.geolocation) return

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      pushGeoLocation(date, {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      }).catch(console.error)
    },
    console.error,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  )
}
    push()
    gpsRef.current = setInterval(push, 120_000)
    return () => {
  if (gpsRef.current) {
    clearInterval(gpsRef.current)
  }
}
  }, [tracking?.trackingEnabled, date])

  // ── Toggle tracking ──
  const handleToggle = async (val) => {
  try {
    const data = await toggleGeoTracking(date, val)

    setTracking(data.tracking)
  } catch (e) {
    setError(e.message)
  }
}

  // ── Check in / out ──
  const checkInOut = async (type) => {
  setSaving(true)

  try {
    const data =
      type === 'checkin'
        ? await checkInGeo(date)
        : await checkOutGeo(date)

    setTracking(data.tracking)

    setSuccess(
      type === 'checkin'
        ? 'Checked in successfully'
        : 'Checked out successfully'
    )

    setTimeout(() => setSuccess(''), 3000)
  } catch (e) {
    setError(e.message)
  } finally {
    setSaving(false)
  }
}

  // ── GPS fill for visit form ──
  const fillGPS = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setVisitForm(p => ({
          ...p,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }))
        setGpsLoading(false)
      },
      () => { setError('Unable to get location'); setGpsLoading(false) }
    )
  }

  // ── Form validation ──
  const validate = () => {
    const e = {}
    if (!visitForm.location.trim())  e.location = `${meta.locationLabel} is required`
    if (!visitForm.activity)         e.activity = 'Activity is required'
    if (!visitForm.area.trim())      e.area     = 'Area / Territory is required'
    if (visitForm.lat && isNaN(Number(visitForm.lat))) e.lat = 'Must be a valid number'
    if (visitForm.lng && isNaN(Number(visitForm.lng))) e.lng = 'Must be a valid number'
    if (visitForm.contactNumber && !/^[0-9\s\-\+\(\)]{7,15}$/.test(visitForm.contactNumber))
      e.contactNumber = 'Enter a valid phone number'
    setFormErr(e)
    return Object.keys(e).length === 0
  }

  // ── Submit visit ──
  const handleAddVisit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const body = {
        ...visitForm,
        lat: visitForm.lat ? Number(visitForm.lat) : undefined,
        lng: visitForm.lng ? Number(visitForm.lng) : undefined,
      }
      const data = await addGeoVisit(date, body)
      setTracking(data.tracking)
      setSuccess('Visit logged successfully')
      setTimeout(() => setSuccess(''), 3000)
      setAddOpen(false); setVisitForm(emptyVisit()); setFormErr({})
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDeleteVisit = async (id) => {
    if (!window.confirm('Remove this visit?')) return
    try {
      const data = await deleteGeoVisit(date, id)
      setTracking(data.tracking)
    } catch (e) { setError(e.message) }
  }

  const handleVerify = async (id) => {
    try {
      const data = await verifyGeoVisit(date, id)
      setTracking(data.tracking)
    } catch (e) { setError(e.message) }
  }

  const loadHistory = async () => {
  try {
    const data = await getGeoHistory()

    setHistory(data.records || [])
    setHistoryOpen(true)
  } catch (e) {
    setError(e.message)
  }
}

  const exportCSV = () => {
    if (!logs.length) return
    const hdr  = ['Time','Location','Address','Latitude','Longitude','Activity','Contact','Phone','Area','Verified','Notes']
    const rows = logs.map(v => [
      v.time, v.location, v.address, v.lat, v.lng, v.activity,
      v.contactPerson, v.contactNumber, v.area,
      v.verified ? 'Yes' : 'No', v.notes,
    ].map(x => `"${(x||'').toString().replace(/"/g,'""')}"`).join(','))
    const blob = new Blob([[hdr.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `geo-tracking-${date}.csv`
    a.click()
  }

  // ── Derived ──
  const logs     = tracking?.visitLogs || []
  const verified = logs.filter(l => l.verified).length
  const distKm   = tracking?.totalDistanceKm ?? 0
  const mins     = tracking?.timeInFieldMins  ?? 0
  const timeStr  = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : mins ? `${mins}m` : '—'

  // ── Map data ──
  const routeCoords  = (tracking?.routeCoordinates || [])
    .filter(c => c.lat && c.lng)
    .map(c => [Number(c.lat), Number(c.lng)])

  const visitCoords  = logs
    .filter(v => v.lat && v.lng)
    .map(v => [Number(v.lat), Number(v.lng)])

  const allMapCoords = [...routeCoords, ...visitCoords]

  const mapCenter = allMapCoords.length > 0
  ? allMapCoords[allMapCoords.length - 1]
  : [20.5937, 78.9629]

  // ── Render ──
  if (loading && !tracking) {
  return (
    <Box
      sx={{
        height: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  )
}
  return (
    <PageShell
      title="Geo-Tracking"
      subtitle="Live location tracking & visit verification"
      breadcrumb={[{ label: 'Field Work' }, { label: 'Geo-Tracking' }]}
      action={
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" startIcon={<FileDownload />} onClick={exportCSV}>
            Export
          </Button>
          <Button size="small" variant="outlined" startIcon={<Schedule />} onClick={loadHistory}>
            History
          </Button>
          <Tooltip title="Reload">
            <IconButton size="small" onClick={loadTracking} disabled={loading}>
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ── Top controls ── */}
      <Paper elevation={0} sx={{
        p: { xs: 1.5, sm: 2 }, mb: 2.5,
        border: '1px solid', borderColor: 'divider', borderRadius: 3,
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small" type="date" label="Date" value={date}
            onChange={e => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <Chip
            icon={<GpsFixed sx={{ fontSize: 14 }} />}
            label={tracking?.trackingEnabled ? 'Tracking Active' : 'Tracking Off'}
            color={tracking?.trackingEnabled ? 'success' : 'default'}
            size="small"
          />
          <FormControlLabel
            control={
              <Switch
                checked={!!tracking?.trackingEnabled}
                onChange={e => handleToggle(e.target.checked)}
                size="small"
              />
            }
            label={<Typography sx={{ fontSize: 13 }}>Enable Tracking</Typography>}
            sx={{ m: 0 }}
          />
          <Box sx={{ display: 'flex', gap: 1, ml: { xs: 0, sm: 'auto' }, flexWrap: 'wrap' }}>
            <Button
              size="small" variant="contained" color="success"
              onClick={() => checkInOut('checkin')}
              disabled={saving || !!tracking?.checkInTime}
            >
              {tracking?.checkInTime ? `In: ${tracking.checkInTime}` : 'Check In'}
            </Button>
            <Button
              size="small" variant="outlined" color="error"
              onClick={() => checkInOut('checkout')}
              disabled={saving || !tracking?.checkInTime || !!tracking?.checkOutTime}
            >
              {tracking?.checkOutTime ? `Out: ${tracking.checkOutTime}` : 'Check Out'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── Stats ── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {[
          { label: 'Visits Today',    value: logs.length,    sub: `${verified} verified`,    color: '#1d4ed8', icon: <LocationOn /> },
          { label: 'Distance',        value: `${distKm} km`, sub: 'GPS tracked',             color: '#16a34a', icon: <DirectionsWalk /> },
          { label: 'Time in Field',   value: timeStr,        sub: 'Active field time',       color: '#d97706', icon: <AccessTime /> },
          { label: 'Verified Visits', value: verified,       sub: `of ${logs.length} total`, color: '#7c3aed', icon: <Verified /> },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* ── Live Map ── */}
      <Paper elevation={0} sx={{
        border: '1px solid', borderColor: 'divider',
        borderRadius: 3, overflow: 'hidden', mb: 2.5,
      }}>
        <Box sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GpsFixed sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 15 } }}>
              Live Map
            </Typography>
            {tracking?.trackingEnabled && (
              <Chip
                label="Live"
                size="small"
                color="success"
                sx={{ fontSize: 10, height: 20, animation: 'pulse 2s infinite',
                  '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } } }}
              />
            )}
          </Box>
          <Button
  size="small"
  variant="outlined"
  disabled={visitCoords.length === 0}
  onClick={() => {
    const first =
  visitCoords[visitCoords.length - 1]

    if (!first) return

    window.open(
      `https://www.google.com/maps?q=${first[0]},${first[1]}`,
      '_blank'
    )
  }}
>
  Open Google Maps
</Button>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {tracking?.routeCoordinates?.length || 0} GPS points &nbsp;·&nbsp; {visitCoords.length} visit{visitCoords.length !== 1 ? 's' : ''} plotted
          </Typography>
        </Box>

        {/* Leaflet Map */}
        <Box sx={{ height: { xs: 240, sm: 340, md: 420 }, width: '100%', position: 'relative' }}>
          <MapContainer
            center={mapCenter}
            zoom={allMapCoords.length > 0 ? 13 : 5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto-fit bounds when data loads */}
            {allMapCoords.length > 0 && <FitBounds positions={allMapCoords} />}

            {/* GPS route polyline (blue) */}
            {routeCoords.length > 1 && (
              <Polyline
                positions={routeCoords}
                color="#1d4ed8"
                weight={3}
                opacity={0.75}
              />
            )}

            {/* Visit markers */}
            {logs.map((v, i) =>
              v.lat && v.lng ? (
                <Marker
                  key={v._id || i}
                  position={[Number(v.lat), Number(v.lng)]}
                  icon={createVisitIcon(v.verified ? '#16a34a' : '#1d4ed8', v.verified)}
                >
                  <Popup minWidth={180}>
                    <Box sx={{ p: 0.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>
                        {v.location}
                      </Typography>
                      {v.activity && (
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.3 }}>
                          🏷️ {v.activity}
                        </Typography>
                      )}
                      {v.time && (
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.3 }}>
                          🕐 {v.time}
                        </Typography>
                      )}
                      {v.area && (
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.3 }}>
                          📍 {v.area}
                        </Typography>
                      )}
                      {v.contactPerson && (
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.3 }}>
                          👤 {v.contactPerson}
                          {v.contactNumber && ` · ${v.contactNumber}`}
                        </Typography>
                      )}
                      <Chip
                        label={v.verified ? 'Verified' : 'Pending'}
                        size="small"
                        color={v.verified ? 'success' : 'warning'}
                        sx={{ fontSize: 10, height: 18, mt: 0.5 }}
                      />
                    </Box>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>

          {/* Map legend */}
          <Box sx={{
            position: 'absolute', bottom: 10, right: 10, zIndex: 1000,
            bgcolor: 'background.paper', borderRadius: 2,
            p: 1, border: '1px solid', borderColor: 'divider',
            display: 'flex', flexDirection: 'column', gap: 0.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 16, height: 4, bgcolor: '#1d4ed8', borderRadius: 2 }} />
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>GPS Route</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#1d4ed8' }} />
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Visit</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#16a34a' }} />
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Verified</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* ── Visit Log ── */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 1,
        }}>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 15 } }}>
            Visit Log — {date}
          </Typography>
          <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}>
            Log Visit
          </Button>
        </Box>

        {loading
          ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )
          : logs.length === 0
            ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <LocationOn sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  No visits logged for this date
                </Typography>
              </Box>
            )
            : isMobile
              // ── Mobile cards ──
              ? (
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {logs.map((r, i) => (
                    <Paper key={r._id || i} elevation={0} sx={{
                      p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{
                            fontWeight: 700, fontSize: 13,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {r.location}
                          </Typography>
                          {r.address && (
                            <Typography sx={{
                              fontSize: 10, color: 'text.secondary',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {r.address}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={r.verified ? 'Verified' : 'Pending'}
                          size="small"
                          color={r.verified ? 'success' : 'warning'}
                          sx={{ ml: 1, flexShrink: 0 }}
                        />
                      </Box>
                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Time</Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{r.time}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Activity</Typography>
                          <Typography sx={{ fontSize: 12 }}>{r.activity}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Area</Typography>
                          <Typography sx={{ fontSize: 12 }}>{r.area}</Typography>
                        </Grid>
                        {r.contactPerson && (
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Contact</Typography>
                            <Typography sx={{ fontSize: 12 }}>{r.contactPerson}</Typography>
                          </Grid>
                        )}
                        {r.lat && r.lng && (
                          <Grid item xs={12}>
                            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                              {Number(r.lat).toFixed(4)}°N, {Number(r.lng).toFixed(4)}°E
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!r.verified && (
                          <Button
                            size="small" variant="outlined" color="success"
                            sx={{ fontSize: 11 }}
                            onClick={() => handleVerify(r._id)}
                          >
                            Verify
                          </Button>
                        )}
                        <IconButton size="small" color="error" onClick={() => handleDeleteVisit(r._id)}>
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )
              // ── Desktop table ──
              : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.default' }}>
                        {['Time','Location','Area','Coordinates','Activity','Contact','Status',''].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((r, i) => (
                        <TableRow key={r._id || i} hover>
                          <TableCell sx={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {r.time}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{r.location}</Typography>
                            {r.address && (
                              <Typography sx={{
                                fontSize: 10, color: 'text.secondary',
                                maxWidth: 200, overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {r.address}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{r.area}</TableCell>
                          <TableCell sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            {r.lat && r.lng
                              ? `${Number(r.lat).toFixed(4)}°N, ${Number(r.lng).toFixed(4)}°E`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip label={r.activity} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 12 }}>
                            {r.contactPerson
                              ? (
                                <Box>
                                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{r.contactPerson}</Typography>
                                  {r.contactNumber && (
                                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                                      {r.contactNumber}
                                    </Typography>
                                  )}
                                </Box>
                              )
                              : <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<CheckCircle sx={{ fontSize: 12 }} />}
                              label={r.verified ? 'Verified' : 'Pending'}
                              size="small"
                              color={r.verified ? 'success' : 'warning'}
                              sx={{ fontSize: 11 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {!r.verified && (
                                <Tooltip title="Verify">
                                  <IconButton size="small" color="success" onClick={() => handleVerify(r._id)}>
                                    <CheckCircle sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDeleteVisit(r._id)}>
                                  <Delete sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
        }
      </Paper>

      {/* ══════════ ADD VISIT DIALOG ══════════ */}
      <Dialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setVisitForm(emptyVisit()); setFormErr({}) }}
        maxWidth="sm" fullWidth fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn color="primary" /> Log New Visit
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>

            {/* Activity FIRST — drives dynamic labels */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth select size="small" label="Activity *"
                value={visitForm.activity}
                onChange={e => {
                  setVisitForm(p => ({ ...p, activity: e.target.value }))
                  setFormErr(p => ({ ...p, activity: '' }))
                }}
                error={!!formErr.activity} helperText={formErr.activity}
              >
                {ACTIVITY_OPTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>

            {/* Area */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label="Area / Territory *"
                placeholder="e.g. Andheri West, Bandra, Juhu"
                value={visitForm.area}
                onChange={e => {
                  setVisitForm(p => ({ ...p, area: e.target.value }))
                  setFormErr(p => ({ ...p, area: '' }))
                }}
                error={!!formErr.area} helperText={formErr.area}
              />
            </Grid>

            {/* Location — Google Maps search */}
            <Grid item xs={12}>
              <Typography sx={{
                fontSize: 11, fontWeight: 600, color: 'text.secondary',
                mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {meta.locationLabel} — Search on Google Maps *
              </Typography>
              <PlacesSearchInput
  label={meta.locationLabel}
  placeholder={`Search for ${meta.locationLabel}…`}
  defaultValue={visitForm.location || ''}
  onSelect={place => {
    if (!place) {
      setVisitForm(p => ({
        ...p,
        location: '',
        placeId: '',
        address: '',
        lat: '',
        lng: '',
      }))

      return
    }

    setVisitForm(p => ({
      ...p,
      location: place.placeName,
      placeId: place.placeId,
      address: place.address,
      lat: place.lat ? String(place.lat) : '',
      lng: place.lng ? String(place.lng) : '',
    }))

    setFormErr(p => ({
      ...p,
      location: '',
    }))
  }}
  error={!!formErr.location}
  helperText={formErr.location}
/>
                
              {visitForm.address && (
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
                   {visitForm.address}
                </Typography>
              )}
            </Grid>

            {/* Contact person */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label={meta.contactLabel}
                placeholder={`Enter ${meta.contactLabel}`}
                value={visitForm.contactPerson}
                onChange={e => setVisitForm(p => ({ ...p, contactPerson: e.target.value }))}
              />
            </Grid>

            {/* Contact number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label="Contact Number"
                placeholder="e.g. 9820012345"
                value={visitForm.contactNumber}
                onChange={e => {
                  setVisitForm(p => ({ ...p, contactNumber: e.target.value }))
                  setFormErr(p => ({ ...p, contactNumber: '' }))
                }}
                error={!!formErr.contactNumber}
                helperText={formErr.contactNumber
                  ? (
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'warning.main' }}>
                      <WarningAmber sx={{ fontSize: 13 }} />{formErr.contactNumber}
                    </Box>
                  )
                  : undefined}
              />
            </Grid>

            {/* GPS coordinates */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                  GPS Coordinates (auto-filled from map search)
                </Typography>
              </Divider>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <TextField
                  size="small" label="Latitude" value={visitForm.lat}
                  onChange={e => {
                    setVisitForm(p => ({ ...p, lat: e.target.value }))
                    setFormErr(p => ({ ...p, lat: '' }))
                  }}
                  error={!!formErr.lat} helperText={formErr.lat}
                  sx={{ flex: 1, minWidth: 120 }}
                />
                <TextField
                  size="small" label="Longitude" value={visitForm.lng}
                  onChange={e => {
                    setVisitForm(p => ({ ...p, lng: e.target.value }))
                    setFormErr(p => ({ ...p, lng: '' }))
                  }}
                  error={!!formErr.lng} helperText={formErr.lng}
                  sx={{ flex: 1, minWidth: 120 }}
                />
                <Button
                  variant="outlined" size="small"
                  startIcon={gpsLoading ? <CircularProgress size={14} /> : <MyLocation />}
                  onClick={fillGPS}
                  disabled={gpsLoading}
                  sx={{ whiteSpace: 'nowrap', alignSelf: 'flex-start', mt: 0.3 }}
                >
                  Use Device GPS
                </Button>
              </Box>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" multiline rows={2} label="Notes"
                placeholder="Visit summary, feedback, follow-up required…"
                value={visitForm.notes}
                onChange={e => setVisitForm(p => ({ ...p, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 2 }}>
          <Button onClick={() => { setAddOpen(false); setVisitForm(emptyVisit()); setFormErr({}) }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddVisit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} /> : <Add />}
          >
            Log Visit
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════ HISTORY DIALOG ══════════ */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md" fullWidth fullScreen={isMobile}
      >
        <DialogTitle>Visit History (Last 30 Days)</DialogTitle>
        <DialogContent dividers>
          {history.length === 0
            ? (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                No history found
              </Typography>
            )
            : history.map((rec, i) => (
              <Box key={i} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{rec.date}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${rec.visitLogs?.length || 0} visits`} size="small" />
                    <Chip label={`${rec.totalDistanceKm || 0} km`} size="small" color="primary" />
                    <Chip
                      label={rec.trackingEnabled ? 'Tracked' : 'Off'}
                      size="small"
                      color={rec.trackingEnabled ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
                {rec.visitLogs?.slice(0, 3).map((v, j) => (
                  <Typography key={j} sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {v.time} — {v.location} ({v.activity})
                  </Typography>
                ))}
                {(rec.visitLogs?.length || 0) > 3 && (
                  <Typography sx={{ fontSize: 11, color: 'primary.main' }}>
                    +{rec.visitLogs.length - 3} more
                  </Typography>
                )}
              </Box>
            ))
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}