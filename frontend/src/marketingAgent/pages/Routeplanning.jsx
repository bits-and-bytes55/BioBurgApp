import { useState, useEffect, useCallback, useRef } from 'react'

import {
  getRouteByDate,
  saveRoutePlan,
  updateRouteStopStatus,
  deleteRouteStop,
} from '../../services/routePlanningService.js'
import {
  Box, Paper, Grid, Typography, Button, Chip, TextField, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  IconButton, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Tooltip, Divider,
  useMediaQuery, useTheme, List, ListItem, ListItemText,
  ListItemIcon, InputAdornment, Fade, LinearProgress,
} from '@mui/material'
import {
  Add, Delete, Save, FileDownload, Route, LocationOn,
  Schedule, Edit, ArrowUpward, ArrowDownward,
  PlaceOutlined, Search, Close,
  DirectionsCar, DirectionsWalk, DirectionsTransit, WarningAmber,
} from '@mui/icons-material'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_COLORS = {
  pending: '#1d4ed8',
  visited: '#16a34a',
  skipped: '#ef4444',
  rescheduled: '#d97706',
}

const createStopIcon = (num, status = 'pending') => {
  const bg = STATUS_COLORS[status] || '#1d4ed8'
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);">${num}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

const createEndpointIcon = (letter, color) =>
  L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);">${letter}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length > 0) {
      try {
        const bounds = L.latLngBounds(positions)
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 })
      } catch (_) {}
    }
  }, [positions, map])
  return null
}

const ACTIVITY_META = {
  'Doctor Visit': { contactLabel: 'Doctor Name', locationLabel: 'Clinic / Chamber' },
  'Hospital Round': { contactLabel: 'Purchase Manager', locationLabel: 'Hospital Name' },
  'Distributor Meet': { contactLabel: 'Distributor Name', locationLabel: 'Distribution Centre' },
  'Retailer Visit': { contactLabel: 'Retailer Name', locationLabel: 'Medical Store' },
  'Stockist Visit': { contactLabel: 'Stockist Name', locationLabel: 'Stockist Office' },
  'Path Lab Visit': { contactLabel: 'Lab Manager', locationLabel: 'Pathology Lab' },
  'Diagnostic Centre': { contactLabel: 'Centre Manager', locationLabel: 'Diagnostic Centre' },
  'Medical Store': { contactLabel: 'Pharmacist', locationLabel: 'Medical Store' },
  'Office Meeting': { contactLabel: 'Meeting Host', locationLabel: 'Office / Branch' },
  'Training': { contactLabel: 'Trainer', locationLabel: 'Training Venue' },
  'Other': { contactLabel: 'Contact Person', locationLabel: 'Location Name' },
}
const ACTIVITY_OPTIONS = Object.keys(ACTIVITY_META)

const TRAVEL_MODES = [
  { value: 'driving', label: 'Driving', icon: <DirectionsCar sx={{ fontSize: 18 }} /> },
  { value: 'walking', label: 'Walking', icon: <DirectionsWalk sx={{ fontSize: 18 }} /> },
  { value: 'transit', label: 'Transit', icon: <DirectionsTransit sx={{ fontSize: 18 }} /> },
]

const STOP_STATUSES = ['pending', 'visited', 'skipped', 'rescheduled']
const STATUS_COLOR = { pending: 'default', visited: 'success', skipped: 'error', rescheduled: 'warning' }

const todayStr = () => new Date().toISOString().slice(0, 10)

const emptyStop = (order) => ({
  _localId: Date.now() + Math.random(),
  order,
  placeId: '',
  placeName: '',
  address: '',
  lat: null,
  lng: null,
  activity: '',
  contactPerson: '',
  contactNumber: '',
  estimatedTime: '',
  durationMins: 30,
  status: 'pending',
  notes: '',
})

// --- Nominatim search (free, no key) ---
async function searchPlaces(query) {
  if (!query || query.length < 3) return []
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  const data = await res.json()
  return data.map(item => ({
    place_id: item.place_id,
    description: item.display_name,
    main_text: item.display_name.split(',')[0],
    secondary_text: item.display_name.split(',').slice(1, 3).join(',').trim(),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }))
}

function PlacesSearchInput({ label, placeholder, onSelect, error, helperText, defaultValue }) {
  const [query, setQuery] = useState(defaultValue || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const debRef = useRef(null)

  useEffect(() => {
  setQuery(defaultValue || '')
}, [defaultValue])

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.length < 3) { setSuggestions([]); return }
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
    debRef.current = setTimeout(() => fetchSuggestions(val), 500)
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
        fullWidth size="small" label={label} value={query}
        onChange={handleChange} placeholder={placeholder}
        error={error} helperText={helperText}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 250)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {fetching
                ? <CircularProgress size={14} />
                : <Search sx={{ fontSize: 18, color: 'text.secondary' }} />}
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton size="small" onMouseDown={(e) => {
                e.preventDefault()
                setQuery('')
                setSuggestions([])
                onSelect?.(null)
              }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
      <Fade in={open && suggestions.length > 0}>
        <Paper elevation={8} sx={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          maxHeight: 260, overflowY: 'auto', borderRadius: 2, mt: 0.5,
          border: '1px solid', borderColor: 'divider',
        }}>
          <List dense disablePadding>
            {suggestions.map((s, i) => (
              <ListItem
                key={s.place_id || i}
                button
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
                sx={{
                  py: 1, px: 1.5,
                  '&:hover': { bgcolor: 'action.hover' },
                  borderBottom: i < suggestions.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  cursor: 'pointer',
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PlaceOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{s.main_text}</Typography>
                  }
                  secondary={
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{s.secondary_text}</Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
          <Box sx={{ px: 1.5, py: 0.8, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
            <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>OpenStreetMap / Nominatim</Typography>
          </Box>
        </Paper>
      </Fade>
    </Box>
  )
}

const StatCard = ({ label, value, sub, color }) => (
  <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
    <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, color: color || 'text.primary', lineHeight: 1.1 }}>
      {value}
    </Typography>
    {sub && <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.2 }}>{sub}</Typography>}
  </Paper>
)

export default function RoutePlanning() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [date, setDate] = useState(todayStr())
  const [loading, setLoading] = useState(false)
  const [stops, setStops] = useState([])
  const [travelMode, setTravelMode] = useState('driving')
  const [title, setTitle] = useState('Daily Route')
  const [routeStatus, setRouteStatus] = useState('draft')
  const [notes, setNotes] = useState('')
  const [startLoc, setStartLoc] = useState(null)
  const [endLoc, setEndLoc] = useState(null)
  const [success, setSuccess] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editStop, setEditStop] = useState(null)
  const [statusDialog, setStatusDialog] = useState(null)
  const [newStatus, setNewStatus] = useState('visited')
  const [arrivedAt, setArrivedAt] = useState('')
  const [leftAt, setLeftAt] = useState('')
  const [stopNotes, setStopNotes] = useState('')

const fetchRoute = async (selectedDate) => {
  try {
    setLoading(true)

    const res = await getRouteByDate(selectedDate)

    const route = res.route

    setStops(route.stops || [])
    setTravelMode(route.travelMode || 'driving')
    setTitle(route.title || 'Daily Route')
    setRouteStatus(route.status || 'draft')
    setNotes(route.notes || '')

    setStartLoc(
  route.startLocation?.placeName
    ? route.startLocation
    : null
)

setEndLoc(
  route.endLocation?.placeName
    ? route.endLocation
    : null
)
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchRoute(date)
}, [date])

  const handleSave = async () => {
  try {
    setLoading(true)

    await saveRoutePlan({
      date,
      title,
      travelMode,
      status: routeStatus,
      notes,
      startLocation: startLoc,
      endLocation: endLoc,
      stops,
    })

    setSuccess('Route saved successfully')

    setTimeout(() => setSuccess(''), 3000)
  } catch (err) {
    console.error(err)

    setSuccess('Failed to save route')
  } finally {
    setLoading(false)
  }
}

  const handleSaveStop = async (stopData) => {
  let updatedStops = []

  if (editStop !== null) {
    updatedStops = stops.map((s, i) =>
      i === editStop ? { ...s, ...stopData } : s
    )

    setEditStop(null)
  } else {
    updatedStops = [
      ...stops,
      {
        ...emptyStop(stops.length + 1),
        ...stopData,
        order: stops.length + 1,
      },
    ]
  }

  setStops(updatedStops)

  setAddOpen(false)

  try {
    await saveRoutePlan({
      date,
      title,
      travelMode,
      status: routeStatus,
      notes,
      startLocation: startLoc,
      endLocation: endLoc,
      stops: updatedStops,
    })
  } catch (err) {
    console.error(err)
  }
}

  const handleDeleteStop = async (idx) => {
  try {
    if (!window.confirm('Remove this stop?')) return

    const stop = stops[idx]

    if (stop._id) {
      const res = await deleteRouteStop(date, stop._id)

      setStops(res.route.stops)
    } else {
      setStops(p =>
        p
          .filter((_, i) => i !== idx)
          .map((s, i) => ({
            ...s,
            order: i + 1,
          }))
      )
    }
  } catch (err) {
    console.error(err)
  }
}

  const moveStop = async (idx, dir) => {
  const next = [...stops]

  const swap = idx + dir

  if (swap < 0 || swap >= next.length) return

  ;[next[idx], next[swap]] = [next[swap], next[idx]]

  const reordered = next.map((s, i) => ({
    ...s,
    order: i + 1,
  }))

  setStops(reordered)

  try {
    await saveRoutePlan({
      date,
      title,
      travelMode,
      status: routeStatus,
      notes,
      startLocation: startLoc,
      endLocation: endLoc,
      stops: reordered,
    })
  } catch (err) {
    console.error(err)
  }
}

  const handleStatusSave = async () => {
  try {
    const { stop } = statusDialog

    const payload = {
      status: newStatus,
      arrivedAt,
      leftAt,
      notes: stopNotes,
    }

    const res = await updateRouteStopStatus(
      date,
      stop._id,
      payload
    )

    setStops(res.route.stops)

    setStatusDialog(null)
  } catch (err) {
    console.error(err)
  }
}

  const exportCSV = () => {
    const hdr = ['Order', 'Location', 'Address', 'Activity', 'Contact', 'Phone', 'Est Time', 'Duration (min)', 'Status', 'Notes']
    const rows = stops.map(s =>
      [s.order, s.placeName, s.address, s.activity, s.contactPerson, s.contactNumber, s.estimatedTime, s.durationMins, s.status, s.notes]
        .map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')
    )
    const blob = new Blob([[hdr.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `route-plan-${date}.csv`
    a.click()
  }

  const openInMaps = () => {
    if (stops.length < 1) return
    const origin = startLoc?.address || stops[0]?.address || ''
    const dest = endLoc?.address || stops[stops.length - 1]?.address || ''
    const wps = stops.slice(0, -1).map(s => s.address || s.placeName).join('|')
    const url = `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(dest)}` +
      (wps ? `&waypoints=${encodeURIComponent(wps)}` : '') +
      `&travelmode=${travelMode}`
    window.open(url, '_blank')
  }

  const visited = stops.filter(s => s.status === 'visited').length
  const pending = stops.filter(s => s.status === 'pending').length
  const totalMins = stops.reduce((s, st) => s + (st.durationMins || 0), 0)
  const progress = stops.length ? Math.round((visited / stops.length) * 100) : 0

  const stopsWithCoords = stops.filter(s => s.lat && s.lng)
  const allMapPositions = [
    startLoc?.lat && startLoc?.lng ? [Number(startLoc.lat), Number(startLoc.lng)] : null,
    ...stopsWithCoords.map(s => [Number(s.lat), Number(s.lng)]),
    endLoc?.lat && endLoc?.lng ? [Number(endLoc.lat), Number(endLoc.lng)] : null,
  ].filter(Boolean)

  const routePolyline = allMapPositions
  const mapCenter = allMapPositions.length > 0 ? allMapPositions[0] : [20.5937, 78.9629]

  return (
    <>
    {loading && (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <CircularProgress />
      </Box>
      
    )}

    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Route Planning</Typography>
          <Typography variant="body2" color="text.secondary">Plan and optimise your daily field route</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" startIcon={<FileDownload />} onClick={exportCSV}>Export</Button>
          <Button size="small" variant="outlined" startIcon={<Route />} onClick={openInMaps} disabled={stops.length < 1}>Open in Maps</Button>
          <Button size="small" variant="contained" startIcon={<Save />} onClick={handleSave}>Save Route</Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Header controls */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="date" label="Date" value={date}
              onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Route Title" value={title} onChange={e => setTitle(e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" select label="Travel Mode" value={travelMode} onChange={e => setTravelMode(e.target.value)}>
              {TRAVEL_MODES.map(m => (
                <MenuItem key={m.value} value={m.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{m.icon}{m.label}</Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" select label="Status" value={routeStatus} onChange={e => setRouteStatus(e.target.value)}>
              {['draft', 'active', 'completed'].map(s => (
                <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Start / End */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1.5 }}>Start &amp; End Location</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <PlacesSearchInput
  label="Start Location"
  placeholder="Search start point…"
  defaultValue={startLoc?.placeName || ''}
  onSelect={place => setStartLoc(place)}
/>
            {startLoc?.address && (
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}> {startLoc.address}</Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <PlacesSearchInput
  label="End Location"
  placeholder="Search end point…"
  defaultValue={endLoc?.placeName || ''}
  onSelect={place => setEndLoc(place)}
/>
            {endLoc?.address && (
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>{endLoc.address}</Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}><StatCard label="Total Stops" value={stops.length} color="#1d4ed8" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Visited" value={visited} color="#16a34a" sub={`${progress}% complete`} /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Pending" value={pending} color="#d97706" /></Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Est. Duration" value={`${Math.floor(totalMins / 60)}h ${totalMins % 60}m`} color="#7c3aed" />
        </Grid>
      </Grid>

      {/* Progress */}
      {stops.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Route Progress</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{visited}/{stops.length} stops</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }}
            color={progress === 100 ? 'success' : 'primary'} />
        </Box>
      )}

      {/* Map */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{
          p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Route sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 15 } }}>Route Map</Typography>
            <Chip label={`${stopsWithCoords.length} / ${stops.length} stops plotted`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
          </Box>
          <Button size="small" variant="outlined" startIcon={<Route />} onClick={openInMaps} disabled={stops.length < 1}>
            Open Google Maps
          </Button>
        </Box>
        <Box sx={{ height: { xs: 260, sm: 360, md: 440 }, width: '100%', position: 'relative' }}>
          <MapContainer center={mapCenter} zoom={allMapPositions.length > 0 ? 12 : 5} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {allMapPositions.length > 0 && <FitBounds positions={allMapPositions} />}
            {routePolyline.length > 1 && (
              <Polyline positions={routePolyline} color="#1d4ed8" weight={3} dashArray="8 5" opacity={0.8} />
            )}
            {startLoc?.lat && startLoc?.lng && (
              <Marker position={[Number(startLoc.lat), Number(startLoc.lng)]} icon={createEndpointIcon('S', '#16a34a')}>
                <Popup minWidth={160}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.3 }}>🟢 Start</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{startLoc.address}</Typography>
                </Popup>
              </Marker>
            )}
            {endLoc?.lat && endLoc?.lng && (
              <Marker position={[Number(endLoc.lat), Number(endLoc.lng)]} icon={createEndpointIcon('E', '#ef4444')}>
                <Popup minWidth={160}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.3 }}>🔴 End</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{endLoc.address}</Typography>
                </Popup>
              </Marker>
            )}
            {stops.map((stop, idx) =>
              stop.lat && stop.lng ? (
                <Marker key={stop._localId || idx} position={[Number(stop.lat), Number(stop.lng)]} icon={createStopIcon(stop.order, stop.status)}>
                  <Popup minWidth={190}>
                    <Box sx={{ p: 0.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.4 }}>#{stop.order} — {stop.placeName}</Typography>
                      {stop.activity && <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.3 }}>🏷️ {stop.activity}</Typography>}
                      {stop.estimatedTime && <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.3 }}>🕐 {stop.estimatedTime} · {stop.durationMins}min</Typography>}
                      {stop.contactPerson && <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.3 }}>👤 {stop.contactPerson}{stop.contactNumber && ` · ${stop.contactNumber}`}</Typography>}
                      <Chip label={stop.status} size="small" color={STATUS_COLOR[stop.status]} sx={{ fontSize: 10, height: 18, textTransform: 'capitalize' }} />
                    </Box>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
          {/* Legend */}
          <Box sx={{
            position: 'absolute', bottom: 10, right: 10, zIndex: 1000,
            bgcolor: 'background.paper', borderRadius: 2, p: 1,
            border: '1px solid', borderColor: 'divider',
            display: 'flex', flexDirection: 'column', gap: 0.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {[
              { color: '#16a34a', label: 'Start (S)' },
              { color: '#1d4ed8', label: 'Pending' },
              { color: '#16a34a', label: 'Visited' },
              { color: '#ef4444', label: 'Skipped / End (E)' },
              { color: '#d97706', label: 'Rescheduled' },
            ].map(({ color, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{label}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 0.3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 22, height: 0, border: '2px dashed #1d4ed8', borderRadius: 1 }} />
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Route</Typography>
            </Box>
          </Box>
          
        </Box>
      </Paper>

      {/* Stops list */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{
          p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1,
        }}>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 15 } }}>Planned Stops ({stops.length})</Typography>
          <Button size="small" variant="contained" startIcon={<Add />} onClick={() => { setEditStop(null); setAddOpen(true) }}>
            Add Stop
          </Button>
        </Box>

        {stops.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Route sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>No stops planned yet. Add your first stop.</Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {stops.map((stop, idx) => (
              <Paper key={stop._localId || idx} elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%',
                    bgcolor: STATUS_COLORS[stop.status] || 'primary.main',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, flexShrink: 0, mt: 0.2,
                  }}>
                    {stop.order}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stop.placeName}
                    </Typography>
                    {stop.address && (
                      <Typography sx={{ fontSize: 10, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stop.address}
                      </Typography>
                    )}
                  </Box>
                  <Chip label={stop.status} size="small" color={STATUS_COLOR[stop.status]} sx={{ flexShrink: 0, textTransform: 'capitalize' }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                  <Button size="small" variant="outlined" sx={{ fontSize: 11 }}
                    onClick={() => { setStatusDialog({ stop, idx }); setNewStatus(stop.status); setArrivedAt(stop.arrivedAt || ''); setLeftAt(stop.leftAt || ''); setStopNotes(stop.notes || '') }}>
                    Status
                  </Button>
                  <Button size="small" variant="outlined" sx={{ fontSize: 11 }} onClick={() => { setEditStop(idx); setAddOpen(true) }}>Edit</Button>
                  <IconButton size="small" color="error" onClick={() => handleDeleteStop(idx)}><Delete sx={{ fontSize: 16 }} /></IconButton>
                  <IconButton size="small" disabled={idx === 0} onClick={() => moveStop(idx, -1)}><ArrowUpward sx={{ fontSize: 16 }} /></IconButton>
                  <IconButton size="small" disabled={idx === stops.length - 1} onClick={() => moveStop(idx, 1)}><ArrowDownward sx={{ fontSize: 16 }} /></IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  {['#', 'Location', 'Activity', 'Contact', 'Est. Time', 'Duration', 'Status', ''].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {stops.map((stop, idx) => (
                  <TableRow key={stop._localId || idx} hover sx={{ verticalAlign: 'top' }}>
                    <TableCell>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%',
                        bgcolor: STATUS_COLORS[stop.status] || 'primary.main',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
                      }}>
                        {stop.order}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{stop.placeName}</Typography>
                      {stop.address && (
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {stop.address}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={stop.activity || '—'} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      {stop.contactPerson ? (
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{stop.contactPerson}</Typography>
                          {stop.contactNumber && <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{stop.contactNumber}</Typography>}
                        </Box>
                      ) : <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{stop.estimatedTime || '—'}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{stop.durationMins}m</TableCell>
                    <TableCell>
                      <Chip
                        label={stop.status} size="small" color={STATUS_COLOR[stop.status]}
                        onClick={() => { setStatusDialog({ stop, idx }); setNewStatus(stop.status); setArrivedAt(stop.arrivedAt || ''); setLeftAt(stop.leftAt || ''); setStopNotes(stop.notes || '') }}
                        sx={{ cursor: 'pointer', fontSize: 11, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.3 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setEditStop(idx); setAddOpen(true) }}><Edit sx={{ fontSize: 15 }} /></IconButton>
                        </Tooltip>
                        <Tooltip title="Move Up"><span><IconButton size="small" disabled={idx === 0} onClick={() => moveStop(idx, -1)}><ArrowUpward sx={{ fontSize: 15 }} /></IconButton></span></Tooltip>
                        <Tooltip title="Move Down"><span><IconButton size="small" disabled={idx === stops.length - 1} onClick={() => moveStop(idx, 1)}><ArrowDownward sx={{ fontSize: 15 }} /></IconButton></span></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteStop(idx)}><Delete sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Route Notes */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mt: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}>Route Notes</Typography>
        <TextField fullWidth multiline rows={2} size="small" value={notes}
          onChange={e => setNotes(e.target.value)} placeholder="General notes, special instructions, area details…" />
      </Paper>

      {/* Add/Edit Stop Dialog */}
      <StopDialog
        open={addOpen}
        editData={editStop !== null ? stops[editStop] : null}
        onClose={() => { setAddOpen(false); setEditStop(null) }}
        onSave={handleSaveStop}
        isMobile={isMobile}
      />

      {/* Status Dialog */}
      <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Update Stop Status</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" select label="Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STOP_STATUSES.map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="time" label="Arrived At" value={arrivedAt}
                onChange={e => setArrivedAt(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="time" label="Left At" value={leftAt}
                onChange={e => setLeftAt(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Notes" value={stopNotes}
                onChange={e => setStopNotes(e.target.value)} placeholder="Visit outcome, feedback…" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusSave}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  )
}

function StopDialog({ open, editData, onClose, onSave, isMobile }) {
  const [form, setForm] = useState({
    placeName: '', placeId: '', address: '', lat: null, lng: null,
    activity: '', contactPerson: '', contactNumber: '', estimatedTime: '', durationMins: 30, notes: '',
  })
  const [formErr, setFormErr] = useState({})

  useEffect(() => {
    if (editData) setForm({ ...editData })
    else setForm({ placeName: '', placeId: '', address: '', lat: null, lng: null, activity: '', contactPerson: '', contactNumber: '', estimatedTime: '', durationMins: 30, notes: '' })
    setFormErr({})
  }, [editData, open])

  const meta = ACTIVITY_META[form.activity] || ACTIVITY_META['Other']

  const validate = () => {
    const e = {}
    if (!form.placeName.trim()) e.placeName = `${meta.locationLabel} is required`
    if (!form.activity) e.activity = 'Activity is required'
    if (form.contactNumber && !/^[0-9\s\-+()]{7,15}$/.test(form.contactNumber)) e.contactNumber = 'Enter a valid phone number'
    setFormErr(e)
    return Object.keys(e).length === 0
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocationOn color="primary" /> {editData ? 'Edit Stop' : 'Add Stop'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select size="small" label="Activity *" value={form.activity}
              onChange={e => { setForm(p => ({ ...p, activity: e.target.value })); setFormErr(p => ({ ...p, activity: '' })) }}
              error={!!formErr.activity} helperText={formErr.activity}>
              {ACTIVITY_OPTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="time" label="Est. Time" value={form.estimatedTime}
              onChange={e => setForm(p => ({ ...p, estimatedTime: e.target.value }))} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" type="number" label="Duration (min)" value={form.durationMins}
              onChange={e => setForm(p => ({ ...p, durationMins: Number(e.target.value) || 30 }))} />
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {meta.locationLabel} — Search on Maps *
            </Typography>
            <PlacesSearchInput
              label={meta.locationLabel}
              placeholder={`Search for ${meta.locationLabel}…`}
              defaultValue={form.placeName}
              onSelect={place => {
                if (!place) { setForm(p => ({ ...p, placeName: '', placeId: '', address: '', lat: null, lng: null })); return }
                setForm(p => ({ ...p, placeName: place.placeName, placeId: place.placeId, address: place.address, lat: place.lat, lng: place.lng }))
                setFormErr(p => ({ ...p, placeName: '' }))
              }}
              error={!!formErr.placeName}
              helperText={formErr.placeName}
            />
            {form.address && (
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}> {form.address}</Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label={meta.contactLabel} placeholder={`Enter ${meta.contactLabel}`}
              value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Contact Number" placeholder="e.g. 9820012345"
              value={form.contactNumber}
              onChange={e => { setForm(p => ({ ...p, contactNumber: e.target.value })); setFormErr(p => ({ ...p, contactNumber: '' })) }}
              error={!!formErr.contactNumber}
              helperText={formErr.contactNumber ? (
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'warning.main' }}>
                  <WarningAmber sx={{ fontSize: 13 }} />{formErr.contactNumber}
                </Box>
              ) : undefined}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" multiline rows={2} label="Notes"
              placeholder="Purpose of visit, products to detail…"
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => { if (validate()) onSave(form) }}>
          {editData ? 'Update Stop' : 'Add Stop'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}