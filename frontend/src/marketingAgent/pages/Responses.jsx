import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableHead, TableRow, Alert, Snackbar, InputAdornment,
  Tabs, Tab, Divider, CircularProgress
} from '@mui/material'

import { API_URL } from '../../config/api.js' 
const BASE_API = API_URL 
const getToken = () => localStorage.getItem('agentToken')
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

const PLACE_TYPES = ['Hospital', 'Clinic', 'Pharmacy', 'Medical Store', 'Nursing Home', 'Diagnostic Centre',
  'Doctor Chamber', 'Corporate Office', 'Retail Shop', 'Wholesaler', 'Factory', 'School', 'Hotel', 'Other']

const RESPONSE_STATUSES = [
  { value: 'Responded - Positive', color: '#16a34a', bg: '#f0fdf4' },
  { value: 'Responded - Neutral', color: '#2563eb', bg: '#eff6ff' },
  { value: 'Responded - Negative', color: '#dc2626', bg: '#fef2f2' },
  { value: 'No Response', color: '#94a3b8', bg: '#f8fafc' },
  { value: 'Callback Requested', color: '#d97706', bg: '#fffbeb' },
  { value: 'Order Placed', color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'Follow Up Required', color: '#0891b2', bg: '#ecfeff' },
  { value: 'Not Available', color: '#64748b', bg: '#f1f5f9' },
]

const NEXT_ACTIONS = ['Call Tomorrow', 'Visit Again', 'Send Sample', 'Send Quotation', 'None Required', 'Escalate to Manager']

const initialForm = {
  placeName: '', placeType: 'Hospital', address: '',
  contactPerson: '', contactRole: '', phone: '',
  responseStatus: 'Responded - Positive',
  productDiscussed: '', remarks: '', nextAction: 'None Required',
  followUpDate: '', hasOrder: false, orderValue: ''
}

export default function Responses() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [responses, setResponses] = useState([])
  const [fetchingResponses, setFetchingResponses] = useState(true)

  useEffect(() => {
  const load = async () => {
    try {
      const res = await fetch(`${BASE_API}/agent/responses`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) {
        setResponses(
          data.responses.map(r => ({
            ...r,
            id: r._id,
            loggedAt: new Date(r.createdAt).toLocaleString('en-IN')
          }))
        )
      }
    } catch (_) {
      // silently fail — offline or token expired
    } finally {
      setFetchingResponses(false)
    }
  }
  load()
}, [])


  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [filterStatus, setFilterStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  const handleAdd = async () => {
    if (!form.placeName || !form.contactPerson) {
      setSnack({ open: true, msg: 'Place name and contact person are required', severity: 'warning' })
      return
    }
    try {
      const res = await fetch(`${BASE_API}/agent/responses`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save response')

      const entry = {
        ...data.response,
        id: data.response._id,
        loggedAt: new Date(data.response.createdAt).toLocaleString('en-IN')
      }
      setResponses(r => [entry, ...r])

      if (entry.hasOrder) {
        setSnack({ open: true, msg: 'Response logged! Order found — redirecting to Billing.', severity: 'success' })
        setTimeout(() => navigate('/agent/billing/invoices'), 2000)
      } else {
        setSnack({ open: true, msg: 'Response logged successfully.', severity: 'success' })
      }
      setForm(initialForm)
      setDialog(false)
    } catch (err) {
      setSnack({ open: true, msg: err.message, severity: 'error' })
    }
  }

  const getStatusStyle = (val) => RESPONSE_STATUSES.find(s => s.value === val) || { color: '#64748b', bg: '#f8fafc' }

  const filtered = responses.filter(r => {
    const matchStatus = filterStatus === 'All' || r.responseStatus === filterStatus
    const matchSearch = !search || r.placeName.toLowerCase().includes(search.toLowerCase()) ||
      r.contactPerson.toLowerCase().includes(search.toLowerCase()) || r.address?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    total: responses.length,
    positive: responses.filter(r => r.responseStatus === 'Responded - Positive').length,
    orders: responses.filter(r => r.hasOrder).length,
    followUp: responses.filter(r => r.nextAction !== 'None Required').length,
    noResponse: responses.filter(r => r.responseStatus === 'No Response').length,
  }

  // Tab: All | Positive | Orders | Follow Up | No Response
  const tabData = [
    { label: 'All', count: stats.total },
    { label: 'Positive', count: stats.positive },
    { label: 'Orders', count: stats.orders },
    { label: 'Follow Up', count: stats.followUp },
    { label: 'No Response', count: stats.noResponse },
  ]

  const tabFiltered = (() => {
    if (tab === 0) return filtered
    if (tab === 1) return filtered.filter(r => r.responseStatus === 'Responded - Positive')
    if (tab === 2) return filtered.filter(r => r.hasOrder)
    if (tab === 3) return filtered.filter(r => r.nextAction !== 'None Required')
    if (tab === 4) return filtered.filter(r => r.responseStatus === 'No Response')
    return filtered
  })()

  if (fetchingResponses) return (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
    <CircularProgress sx={{ color: '#1d4ed8' }} />
    <Typography sx={{ color: '#64748b', fontSize: 14 }}>Loading responses...</Typography>
  </Box>
)

  return (
    <Box sx={{ fontFamily: "'Crimson Pro', Georgia, serif", minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'Georgia, serif' }}>
            Responses
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: 14, mt: 0.5 }}>
            Track responses from every place you visit — hospitals, shops, offices, and more.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setDialog(true)}
          sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, px: 3, py: 1.2,
            borderRadius: 2, fontWeight: 700, fontSize: 13, letterSpacing: '0.03em',
            boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>
          + LOG RESPONSE
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(5,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'TOTAL LOGGED', value: stats.total, color: '#1d4ed8' },
          { label: 'POSITIVE', value: stats.positive, color: '#16a34a' },
          { label: 'ORDERS', value: stats.orders, color: '#7c3aed' },
          { label: 'FOLLOW UPS', value: stats.followUp, color: '#d97706' },
          { label: 'NO RESPONSE', value: stats.noResponse, color: '#dc2626' },
        ].map(s => (
          <Paper key={s.label} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5, bgcolor: 'white',
            borderTop: `3px solid ${s.color}` }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'monospace', mt: 0.5 }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filter Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search by place, person, location..." value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }} />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select label="Filter by Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="All">All Statuses</MenuItem>
            {RESPONSE_STATUSES.map(s => <MenuItem key={s.value} value={s.value}>{s.value}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 0, borderBottom: '1px solid #e2e8f0' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
          '& .MuiTab-root': { fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', minHeight: 44, textTransform: 'uppercase' },
          '& .Mui-selected': { color: '#1d4ed8' },
          '& .MuiTabs-indicator': { bgcolor: '#1d4ed8', height: 3 }
        }}>
          {tabData.map((t, i) => (
            <Tab key={t.label} label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {t.label}
                <Box sx={{ px: 1, py: 0.15, borderRadius: 10, bgcolor: tab === i ? '#eff6ff' : '#f1f5f9',
                  fontSize: 10, fontWeight: 800, color: tab === i ? '#1d4ed8' : '#94a3b8', minWidth: 20, textAlign: 'center' }}>
                  {t.count}
                </Box>
              </Box>
            } />
          ))}
        </Tabs>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 16px 16px', overflow: 'hidden', bgcolor: 'white' }}>
        {tabFiltered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>No responses found. Log your first response above.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Place', 'Type', 'Address', 'Contact', 'Response', 'Product', 'Next Action', 'Order', 'Logged At', 'Remarks'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', py: 1.5, whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tabFiltered.map(r => {
                  const style = getStatusStyle(r.responseStatus)
                  return (
                    <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, borderBottom: '1px solid #f1f5f9' }}>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.placeName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={r.placeType} size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#64748b', maxWidth: 130 }}>
                        <Typography sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                          {r.address || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{r.contactPerson}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{r.contactRole}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={r.responseStatus} size="small"
                          sx={{ fontSize: 10, height: 22, bgcolor: style.bg, color: style.color, fontWeight: 700, whiteSpace: 'nowrap' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#475569' }}>{r.productDiscussed || '—'}</TableCell>
                      <TableCell>
                        {r.nextAction !== 'None Required'
                          ? <Chip label={r.nextAction} size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 600 }} />
                          : <Typography sx={{ fontSize: 11, color: '#cbd5e1' }}>—</Typography>
                        }
                      </TableCell>
                      <TableCell>
                        {r.hasOrder ? (
                          <Box>
                            <Chip label="ORDER" size="small" onClick={() => navigate('/agent/billing/invoices')}
                              sx={{ fontSize: 10, height: 20, bgcolor: '#f5f3ff', color: '#7c3aed', fontWeight: 700, cursor: 'pointer', mb: 0.5 }} />
                            {r.orderValue && (
                              <Typography sx={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, fontFamily: 'monospace' }}>
                                ₹{parseInt(r.orderValue).toLocaleString('en-IN')}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: 11, color: '#cbd5e1' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {r.loggedAt}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 150 }}>
                        <Typography sx={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                          {r.remarks || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ── LOG RESPONSE DIALOG ── */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0f172a', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          Log a Response
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>PLACE DETAILS</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Place / Organisation Name *" size="small" sx={{ flex: 2, minWidth: 200 }}
                value={form.placeName} onChange={e => setForm(f => ({ ...f, placeName: e.target.value }))} />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Place Type</InputLabel>
                <Select label="Place Type" value={form.placeType} onChange={e => setForm(f => ({ ...f, placeType: e.target.value }))}>
                  {PLACE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <TextField label="Address / Location" size="small" fullWidth
              value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />

            <Divider />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>CONTACT DETAILS</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Contact Person *" size="small" sx={{ flex: 1, minWidth: 160 }}
                value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
              <TextField label="Role / Designation" size="small" sx={{ flex: 1, minWidth: 140 }}
                value={form.contactRole} onChange={e => setForm(f => ({ ...f, contactRole: e.target.value }))} />
              <TextField label="Phone" size="small" sx={{ width: 160 }}
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </Box>

            <Divider />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>VISIT OUTCOME</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Response Status</InputLabel>
                <Select label="Response Status" value={form.responseStatus} onChange={e => setForm(f => ({ ...f, responseStatus: e.target.value }))}>
                  {RESPONSE_STATUSES.map(s => (
                    <MenuItem key={s.value} value={s.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                        {s.value}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Product / Service Discussed" size="small" sx={{ flex: 1, minWidth: 180 }}
                value={form.productDiscussed} onChange={e => setForm(f => ({ ...f, productDiscussed: e.target.value }))} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Next Action</InputLabel>
                <Select label="Next Action" value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}>
                  {NEXT_ACTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Follow-up Date" size="small" type="date" sx={{ width: 180 }}
                InputLabelProps={{ shrink: true }}
                value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
            </Box>
            <TextField label="Remarks / Notes" size="small" fullWidth multiline rows={2}
              value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />

            {/* Order flag */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center',
              p: 2, bgcolor: form.hasOrder ? '#f5f3ff' : '#f8fafc',
              border: `1px solid ${form.hasOrder ? '#ddd6fe' : '#e2e8f0'}`, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
                onClick={() => setForm(f => ({ ...f, hasOrder: !f.hasOrder }))}>
                <Box sx={{ width: 18, height: 18, borderRadius: 1, border: `2px solid ${form.hasOrder ? '#7c3aed' : '#cbd5e1'}`,
                  bgcolor: form.hasOrder ? '#7c3aed' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {form.hasOrder && <Box sx={{ width: 8, height: 8, bgcolor: 'white', borderRadius: 0.5 }} />}
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: form.hasOrder ? '#5b21b6' : '#475569' }}>
                  Order received at this visit
                </Typography>
              </Box>
              {form.hasOrder && (
                <TextField label="Order Value (₹)" size="small" type="number" sx={{ width: 180 }}
                  value={form.orderValue} onChange={e => setForm(f => ({ ...f, orderValue: e.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              )}
              {form.hasOrder && (
                <Typography sx={{ fontSize: 12, color: '#7c3aed', fontStyle: 'italic' }}>
                  You will be redirected to Billing after saving.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}
            sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, fontWeight: 700, px: 3, borderRadius: 2 }}>
            SAVE RESPONSE
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}