import { useState, useEffect } from 'react'
import axios from "axios"
import {
  Box, Typography, Button, Grid, Card, CardContent, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, IconButton, Chip, Avatar,
  InputAdornment, Breadcrumbs, Link, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  useMediaQuery, useTheme
} from '@mui/material'
import {
  Search, Close, NavigateNext, Edit, CheckCircle,
  Cancel, AccessTime, Pause, Today, WifiTethering
} from '@mui/icons-material'

const API = axios.create({ baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/agent/staff` })
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("agentToken")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const WORK_STATUSES = ['Active', 'On Leave', 'Absent', 'Holiday', 'Suspended', 'Resigned']
const STATUS_CONFIG = {
  'Active':    { color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
  'On Leave':  { color: '#d97706', bg: '#fffbeb', icon: <Pause sx={{ fontSize: 16 }} /> },
  'Absent':    { color: '#dc2626', bg: '#fef2f2', icon: <Cancel sx={{ fontSize: 16 }} /> },
  'Holiday':   { color: '#7c3aed', bg: '#f5f3ff', icon: <Today sx={{ fontSize: 16 }} /> },
  'Suspended': { color: '#b45309', bg: '#fff7ed', icon: <AccessTime sx={{ fontSize: 16 }} /> },
  'Resigned':  { color: '#475569', bg: '#f8fafc', icon: <Cancel sx={{ fontSize: 16 }} /> },
}

export default function WorkingStatus() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isMd     = useMediaQuery(theme.breakpoints.down('md'))

  const [rows, setRows]                 = useState([])
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editRow, setEditRow]           = useState(null)
  const [editStatus, setEditStatus]     = useState('')
  const [statusError, setStatusError]   = useState('')

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    try {
      const res = await API.get("/")
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch (err) { console.error(err); setRows([]) }
  }

  const handleStatusUpdate = async () => {
    if (!editStatus) {
      setStatusError('Please select a status')
      return
    }
    setStatusError('')
    try {
      await API.put(`/${editRow._id}`, { ...editRow, status: editStatus })
      fetchStaff()
      setEditRow(null)
    } catch (err) { console.error(err) }
  }

  // Search: only allow letters/digits for name and area search (block special chars from search box)
  const handleSearchChange = (e) => {
    // Allow alphanumeric + spaces for search
    const val = e.target.value.replace(/[^A-Za-z0-9\s]/g, '')
    setSearch(val)
  }

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = (r.name||'').toLowerCase().includes(q) || (r.empId||'').toLowerCase().includes(q) || (r.area||'').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const summaryCards = [
    { label: 'Total Staff',  value: rows.length,                                          color: '#1d4ed8', bg: '#eff6ff' },
    { label: 'Active Today', value: rows.filter(r => r.status === 'Active').length,       color: '#16a34a', bg: '#f0fdf4' },
    { label: 'On Leave',     value: rows.filter(r => r.status === 'On Leave').length,     color: '#d97706', bg: '#fffbeb' },
    { label: 'Absent',       value: rows.filter(r => r.status === 'Absent').length,       color: '#dc2626', bg: '#fef2f2' },
  ]

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>

      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="#" sx={{ fontSize: 13 }}>HR & Staff</Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>Working Status</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.2, bgcolor: '#16a34a', borderRadius: 2, display: 'flex', position: 'relative' }}>
            <WifiTethering sx={{ color: 'white', fontSize: 24 }} />
            <Box sx={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, bgcolor: '#86efac', borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a">Working Status</Typography>
            <Typography variant="body2" color="text.secondary">Field staff status overview</Typography>
          </Box>
        </Box>
        <Chip label="● LIVE" size="small" sx={{ ml: { sm: 'auto' }, bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 11, border: '1px solid #bbf7d0' }} />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map(c => (
          <Grid item xs={6} sm={3} key={c.label}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', bgcolor: c.bg, border: `1px solid ${c.color}22` }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography fontSize={11} fontWeight={600} color={c.color} textTransform="uppercase" letterSpacing={0.5}>{c.label}</Typography>
                <Typography fontSize={28} fontWeight={900} color={c.color}>{c.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search staff, area…" value={search} onChange={handleSearchChange}
          sx={{ flex: 1, minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          inputProps={{ inputMode: 'text' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="All">All Status</MenuItem>
            {WORK_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Paper>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(row => {
            const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG['Absent']
            return (
              <Card key={row._id} sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderLeft: `4px solid ${cfg.color}` }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#1d4ed8', width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
                      {row.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700} fontSize={14}>{row.name}</Typography>
                      <Typography fontSize={11} color="text.secondary">{row.designation} · {row.empId}</Typography>
                    </Box>
                    <Chip label={row.status} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 10, border: `1px solid ${cfg.color}44` }} />
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={6}><Typography fontSize={10} color="text.secondary">Department</Typography><Typography fontSize={12} fontWeight={600}>{row.department || '—'}</Typography></Grid>
                    <Grid item xs={6}><Typography fontSize={10} color="text.secondary">Area</Typography><Typography fontSize={12} fontWeight={600}>{row.area || '—'}</Typography></Grid>
                    <Grid item xs={6}><Typography fontSize={10} color="text.secondary">Joining Date</Typography><Typography fontSize={12} fontWeight={600}>{row.joiningDate || '—'}</Typography></Grid>
                    <Grid item xs={6}><Typography fontSize={10} color="text.secondary">Salary</Typography><Typography fontSize={12} fontWeight={600}>{row.salary || '—'}</Typography></Grid>
                  </Grid>
                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" variant="outlined" startIcon={<Edit sx={{ fontSize: 13 }} />}
                      onClick={() => { setEditRow(row); setEditStatus(row.status); setStatusError('') }}
                      sx={{ borderRadius: 2, fontSize: 11, py: 0.3 }}>
                      Update Status
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
          {filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}>
              <WifiTethering sx={{ fontSize: 60, opacity: 0.3 }} />
              <Typography mt={2}>No records found</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <TableContainer>
            <Table size={isMd ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Staff','Designation','Department','Area','Phone','Joining Date','Status','Action'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => {
                  const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG['Absent']
                  return (
                    <TableRow key={row._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#1d4ed8', fontSize: 11, fontWeight: 700 }}>
                            {row.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </Avatar>
                          <Box>
                            <Typography fontSize={13} fontWeight={600}>{row.name}</Typography>
                            <Typography fontSize={10} color="text.secondary">{row.empId}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.designation || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.department || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.area || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.phone || '—'}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.joiningDate || '—'}</TableCell>
                      <TableCell>
                        <Chip icon={cfg.icon} label={row.status} size="small"
                          sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, border: `1px solid ${cfg.color}33`, '& .MuiChip-icon': { color: cfg.color } }} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => { setEditRow(row); setEditStatus(row.status); setStatusError('') }}
                          sx={{ color: '#1d4ed8', bgcolor: '#eff6ff' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>No records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Update Status Dialog */}
      <Dialog open={!!editRow} onClose={() => { setEditRow(null); setStatusError('') }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          Update Working Status
          <IconButton onClick={() => { setEditRow(null); setStatusError('') }} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editRow && (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Avatar sx={{ bgcolor: '#1d4ed8', fontWeight: 700 }}>{editRow.name?.split(' ').map(n => n[0]).join('').slice(0,2)}</Avatar>
                <Box>
                  <Typography fontWeight={700}>{editRow.name}</Typography>
                  <Typography fontSize={12} color="text.secondary">{editRow.designation} · {editRow.empId}</Typography>
                </Box>
              </Box>
              <FormControl fullWidth size="small" error={!!statusError} required>
                <InputLabel>New Status *</InputLabel>
                <Select value={editStatus} label="New Status *"
                  onChange={e => { setEditStatus(e.target.value); setStatusError('') }}>
                  {WORK_STATUSES.map(s => {
                    const cfg = STATUS_CONFIG[s]
                    return (
                      <MenuItem key={s} value={s}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
                          <Typography fontSize={13}>{s}</Typography>
                        </Box>
                      </MenuItem>
                    )
                  })}
                </Select>
                {statusError && <Typography color="error" fontSize={11} sx={{ mt: 0.5, ml: 1.5 }}>{statusError}</Typography>}
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => { setEditRow(null); setStatusError('') }} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained" sx={{ borderRadius: 2, bgcolor: '#1d4ed8' }}>Update Status</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}