// pages/DCRHistory.jsx
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Chip, IconButton,
  InputAdornment, Typography, Button, Grid, CircularProgress,
  Alert, Collapse, Tooltip, Tabs, Tab,
} from '@mui/material'
import { Search, FileDownload, ExpandMore, ExpandLess } from '@mui/icons-material'
import PageShell from './Pageshell'

const BASE = import.meta.env.VITE_API_BASE_URL

const STATUS_COLOR = {
  completed:     'success',
  'in-progress': 'warning',
  cancelled:     'error',
  pending:       'default',
}
const STATUS_LABEL = {
  completed:     'Completed',
  'in-progress': 'In Progress',
  cancelled:     'Cancelled',
  pending:       'Pending',
}

// Map response status string → MUI color
const RESP_COLOR = (s = '') => {
  if (s.includes('Positive') || s === 'Order Placed') return 'success'
  if (s.includes('Negative') || s === 'Not Available') return 'error'
  if (s.includes('Follow') || s === 'Callback Requested') return 'warning'
  return 'default'
}

export default function DCRHistory() {
  const [jobs,       setJobs]       = useState([])
  const [responses,  setResponses]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [respFilter,   setRespFilter]   = useState('All')
  const [expanded,   setExpanded]   = useState(null)
  const [tab,        setTab]        = useState(0) // 0 = jobs, 1 = responses

  const token   = localStorage.getItem('agentToken')
  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [jobRes, respRes] = await Promise.all([
        fetch(`${BASE}/api/agent/job-history`, { headers }),
        fetch(`${BASE}/api/agent/responses`,   { headers }),
      ])
      const jobData  = await jobRes.json()
      const respData = await respRes.json()
      if (!jobRes.ok)  throw new Error(jobData.message  || 'Failed to load job history')
      if (!respRes.ok) throw new Error(respData.message || 'Failed to load responses')
      setJobs(jobData.jobs || [])
      // Filter out EOD entries from responses list
      setResponses((respData.responses || []).filter(r => r.placeType !== 'EOD'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportJobsCSV = () => {
    const rows = [
      ['Date', 'Time', 'Area', 'Distance', 'Status', 'Start Km', 'Close Km'],
      ...filteredJobs.map(j => [
        j.dutyDate ? new Date(j.dutyDate).toLocaleDateString('en-IN') : '—',
        j.dutyTime || '—',
        [j.area, j.district].filter(Boolean).join(', ') || '—',
        j.totalDistanceKm != null ? `${j.totalDistanceKm} km` : '—',
        STATUS_LABEL[j.status] || j.status,
        j.startKm ?? '—',
        j.closeKm  ?? '—',
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'dcr-job-history.csv'
    a.click()
  }

  const exportResponsesCSV = () => {
    const rows = [
      ['Date', 'Place', 'Type', 'Address', 'Contact', 'Role', 'Phone', 'Response', 'Product', 'Order', 'Order Value', 'Next Action', 'Remarks'],
      ...filteredResponses.map(r => [
        r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—',
        r.placeName, r.placeType || '—', r.address || '—',
        r.contactPerson, r.contactRole || '—', r.phone || '—',
        r.responseStatus || '—', r.productDiscussed || '—',
        r.hasOrder ? 'Yes' : 'No', r.orderValue || '—',
        r.nextAction || '—', r.remarks || '—',
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'dcr-responses.csv'
    a.click()
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredJobs = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchQ = !q || (j.area||'').toLowerCase().includes(q) || (j.district||'').toLowerCase().includes(q)
    const matchS = statusFilter === 'All' || j.status === statusFilter
    return matchQ && matchS
  })

  const filteredResponses = responses.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q ||
      (r.placeName||'').toLowerCase().includes(q) ||
      (r.contactPerson||'').toLowerCase().includes(q) ||
      (r.address||'').toLowerCase().includes(q) ||
      (r.placeType||'').toLowerCase().includes(q)
    const matchS = respFilter === 'All' || r.responseStatus === respFilter
    return matchQ && matchS
  })

  // Unique response statuses for filter dropdown
  const uniqueRespStatuses = ['All', ...new Set(responses.map(r => r.responseStatus).filter(Boolean))]

  // ── Stats for responses ───────────────────────────────────────────────────
  const respStats = {
    total:    responses.length,
    positive: responses.filter(r => r.responseStatus?.includes('Positive')).length,
    orders:   responses.filter(r => r.hasOrder).length,
    followUp: responses.filter(r => r.nextAction && r.nextAction !== 'None Required').length,
  }

  return (
    <PageShell
      title="DCR History"
      subtitle="All submitted daily call reports and field responses"
      breadcrumb={[{ label: 'Field Work' }, { label: 'DCR History' }]}
    >
      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ '& .Mui-selected': { color:'#1d4ed8' }, '& .MuiTabs-indicator': { bgcolor:'#1d4ed8' } }}>
          <Tab label={`Job History (${jobs.length})`} sx={{ fontWeight:700, fontSize:13 }} />
          <Tab label={`Responses (${responses.length})`} sx={{ fontWeight:700, fontSize:13 }} />
        </Tabs>
      </Box>

      {/* Response Stats (only on responses tab) */}
      {tab === 1 && (
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, mb:2 }}>
          {[
            { label:'TOTAL',     value:respStats.total,    color:'#1d4ed8' },
            { label:'POSITIVE',  value:respStats.positive, color:'#16a34a' },
            { label:'ORDERS',    value:respStats.orders,   color:'#7c3aed' },
            { label:'FOLLOW UP', value:respStats.followUp, color:'#d97706' },
          ].map(s => (
            <Paper key={s.label} elevation={0}
              sx={{ border:'1px solid #e2e8f0', borderRadius:2.5, p:2, bgcolor:'white', borderTop:`3px solid ${s.color}` }}>
              <Typography sx={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em' }}>{s.label}</Typography>
              <Typography sx={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:'monospace', mt:0.25 }}>{s.value}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small"
              placeholder={tab === 0 ? 'Search area, district…' : 'Search place, contact, address…'}
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize:18 }} /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            {tab === 0 ? (
              <TextField fullWidth select size="small" label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {['All', 'completed', 'in-progress', 'cancelled', 'pending'].map(s => (
                  <MenuItem key={s} value={s}>{s === 'All' ? 'All Statuses' : STATUS_LABEL[s]}</MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField fullWidth select size="small" label="Response Status" value={respFilter} onChange={e => setRespFilter(e.target.value)}>
                {uniqueRespStatuses.map(s => (
                  <MenuItem key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</MenuItem>
                ))}
              </TextField>
            )}
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display:'flex', justifyContent:{ xs:'flex-start', sm:'flex-end' } }}>
            <Button
              startIcon={<FileDownload />} variant="outlined" size="small"
              onClick={tab === 0 ? exportJobsCSV : exportResponsesCSV}
              sx={{ borderRadius:2, fontWeight:700, fontSize:12 }}
            >
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={fetchData}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : tab === 0 ? (
        /* ── JOB HISTORY TABLE ── */
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                {['Date', 'Time', 'Area / District', 'Distance', 'Start Km', 'Status', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
  {filteredJobs.length === 0 ? (
    <TableRow>
      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary', fontSize: 13 }}>
        No job records found
      </TableCell>
    </TableRow>
  ) : filteredJobs.map(j => (
    <React.Fragment key={j._id}>
      <TableRow hover>
        <TableCell sx={{ fontSize: 12 }}>
          {j.dutyDate ? new Date(j.dutyDate).toLocaleDateString('en-IN') : '—'}
        </TableCell>
        <TableCell sx={{ fontSize: 12 }}>{j.dutyTime || '—'}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>
          {[j.area, j.district].filter(Boolean).join(', ') || '—'}
        </TableCell>
        <TableCell sx={{ fontSize: 12 }}>
          {j.totalDistanceKm != null ? `${j.totalDistanceKm} km` : '—'}
        </TableCell>
        <TableCell sx={{ fontSize: 12 }}>
          {j.startKm != null ? `${j.startKm} km` : '—'}
        </TableCell>
        <TableCell>
          <Chip label={STATUS_LABEL[j.status] || j.status} size="small"
            color={STATUS_COLOR[j.status] || 'default'} sx={{ fontSize: 11 }} />
        </TableCell>
        <TableCell>
          <Tooltip title={expanded === j._id ? 'Collapse' : 'Expand details'}>
            <IconButton size="small" onClick={() => setExpanded(expanded === j._id ? null : j._id)}>
              {expanded === j._id ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded === j._id} unmountOnExit>
            <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', mb: 1.5 }}>
                JOB DETAILS
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1.5 }}>
                {[
                  ['Hospital / Place', j.hospitalName],
                  ['State',            j.state],
                  ['Address',          j.address],
                  ['Start Km',         j.startKm != null ? `${j.startKm} km` : null],
                  ['Close Km',         j.closeKm  != null ? `${j.closeKm} km` : null],
                  ['Job Start',        j.jobStartTime ? new Date(j.jobStartTime).toLocaleTimeString('en-IN') : null],
                  ['Job End',          j.jobEndTime   ? new Date(j.jobEndTime).toLocaleTimeString('en-IN') : null],
                ].filter(([, val]) => val).map(([label, val]) => (
                  <Box key={label} sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#0f172a', mt: 0.25 }}>{val}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  ))}
</TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* ── RESPONSES TABLE ── */
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                {['Date', 'Place', 'Type', 'Contact', 'Phone', 'Response', 'Product', 'Order', 'Next Action', 'Remarks'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResponses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4, color: 'text.secondary', fontSize: 13 }}>
                    No responses found
                  </TableCell>
                </TableRow>
              ) : filteredResponses.map((r, idx) => (
                <TableRow key={r._id || idx} hover>
                  <TableCell sx={{ fontSize: 11, color:'#64748b', whiteSpace:'nowrap' }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color:'#0f172a' }}>{r.placeName}</Typography>
                    {r.address && <Typography sx={{ fontSize:10, color:'#94a3b8', mt:0.2 }}>{r.address}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip label={r.placeType || '—'} size="small"
                      sx={{ fontSize:10, height:20, bgcolor:'#f1f5f9', color:'#475569', fontWeight:600 }} />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.contactPerson}</Typography>
                    {r.contactRole && <Typography sx={{ fontSize:10, color:'#94a3b8' }}>{r.contactRole}</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color:'#334155' }}>{r.phone || '—'}</TableCell>
                  <TableCell>
                    <Chip label={r.responseStatus || '—'} size="small"
                      color={RESP_COLOR(r.responseStatus)}
                      sx={{ fontSize: 10, maxWidth:160, whiteSpace:'nowrap' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color:'#475569', maxWidth:120 }}>
                    <Typography sx={{ fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:110 }}>
                      {r.productDiscussed || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {r.hasOrder ? (
                      <Box>
                        <Chip label="ORDER" size="small"
                          sx={{ fontSize:10, height:20, bgcolor:'#f5f3ff', color:'#7c3aed', fontWeight:700 }} />
                        {r.orderValue && (
                          <Typography sx={{ fontSize:10, color:'#7c3aed', fontWeight:600, fontFamily:'monospace', mt:0.3 }}>
                            ₹{parseInt(r.orderValue).toLocaleString('en-IN')}
                          </Typography>
                        )}
                      </Box>
                    ) : <Typography sx={{ fontSize:11, color:'#cbd5e1' }}>—</Typography>}
                  </TableCell>
                  <TableCell>
                    {r.nextAction && r.nextAction !== 'None Required' ? (
                      <Chip label={r.nextAction} size="small"
                        sx={{ fontSize:10, height:20, bgcolor:'#fff7ed', color:'#c2410c', fontWeight:600 }} />
                    ) : <Typography sx={{ fontSize:11, color:'#cbd5e1' }}>—</Typography>}
                  </TableCell>
                  <TableCell sx={{ maxWidth:160 }}>
                    <Typography sx={{ fontSize:12, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:150 }}>
                      {r.remarks || '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography sx={{ mt: 1.5, fontSize: 12, color: 'text.secondary' }}>
        Showing {tab === 0 ? `${filteredJobs.length} job records` : `${filteredResponses.length} responses`}
      </Typography>
    </PageShell>
  )
}