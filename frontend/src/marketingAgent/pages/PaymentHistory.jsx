import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Paper, Chip, CircularProgress,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Alert, Snackbar, LinearProgress
} from '@mui/material'
import axios from 'axios'

const BASE     = import.meta.env.VITE_API_BASE_URL
const API      = `${BASE}/api/sale-orders/agent`
const getToken = () => localStorage.getItem('agentToken')
const auth     = () => ({ Authorization: `Bearer ${getToken()}` })

const fmt     = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const PAY_META = {
  paid:    { label: 'Paid',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  partial: { label: 'Partial', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  pending: { label: 'Pending', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

const MODE_ICONS = {
  cash:   '',
  upi:    '',
  credit: '',
  cheque: '',
  online: '',
  other:  '',
}

export default function PaymentHistory() {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [payF,     setPayF]     = useState('all')
  const [modeF,    setModeF]    = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')
  const [search,   setSearch]   = useState('')
  const [detail,   setDetail]   = useState(null)
  const [snack,    setSnack]    = useState({ open: false, msg: '', sev: 'error' })

  const toast = (msg, sev = 'error') => setSnack({ open: true, msg, sev })

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (payF !== 'all') params.paymentStatus = payF
      if (fromDate) params.from = fromDate
      if (toDate)   params.to   = toDate
      const { data } = await axios.get(`${API}/my-orders`, { headers: auth(), params })
      if (data.success) setOrders(data.orders || [])
    } catch { toast('Failed to load payment history') }
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [payF])

  /* ── filtered + mode filter (client side) ── */
  const filtered = orders.filter(o => {
    if (modeF !== 'all' && o.paymentMode !== modeF) return false
    if (search && !(
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase())
    )) return false
    return true
  })

  /* ── summary stats ── */
  const totalValue    = filtered.reduce((s, o) => s + (o.grandTotal  || 0), 0)
  const totalCollected= filtered.reduce((s, o) => s + (o.paidAmount  || 0), 0)
  const totalPending  = filtered.reduce((s, o) => s + Math.max(0, (o.grandTotal || 0) - (o.paidAmount || 0)), 0)
  const collectedPct  = totalValue > 0 ? Math.round((totalCollected / totalValue) * 100) : 0

  /* ── mode breakdown ── */
  const modeBreakdown = filtered.reduce((acc, o) => {
    const mode = o.paymentMode || 'other'
    if (!acc[mode]) acc[mode] = { count: 0, amount: 0 }
    acc[mode].count  += 1
    acc[mode].amount += (o.paidAmount || 0)
    return acc
  }, {})

  const allModes = [...new Set(orders.map(o => o.paymentMode).filter(Boolean))]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Payment History
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: 14, mt: 0.5 }}>
          Track collections, outstanding dues, and payment mode breakdowns.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'TOTAL BILLED',   value: fmt(totalValue),     color: '#1d4ed8', sub: `${filtered.length} orders` },
          { label: 'COLLECTED',      value: fmt(totalCollected),  color: '#16a34a', sub: `${collectedPct}% of total` },
          { label: 'OUTSTANDING',    value: fmt(totalPending),    color: '#dc2626', sub: `Balance due` },
          { label: 'COLLECTION RATE',value: `${collectedPct}%`,  color: collectedPct >= 80 ? '#16a34a' : collectedPct >= 50 ? '#d97706' : '#dc2626', sub: 'of billed amount' },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            sx={{ border: '1px solid #e2e8f0', borderTop: `3px solid ${s.color}`, borderRadius: 3, p: 2.5, bgcolor: 'white' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace', mt: 0.5 }}>{s.value}</Typography>
            <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.25 }}>{s.sub}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Collection progress bar */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5, mb: 3, bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Collection Progress</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: collectedPct >= 80 ? '#16a34a' : '#d97706' }}>{collectedPct}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={collectedPct}
          sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9',
            '& .MuiLinearProgress-bar': { bgcolor: collectedPct >= 80 ? '#16a34a' : collectedPct >= 50 ? '#d97706' : '#dc2626', borderRadius: 4 } }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Collected: {fmt(totalCollected)}</Typography>
          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Pending: {fmt(totalPending)}</Typography>
        </Box>
      </Paper>

      {/* Mode breakdown chips */}
      {Object.keys(modeBreakdown).length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2, mb: 3, bgcolor: 'white' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', mb: 1.5, letterSpacing: '0.05em' }}>PAYMENT MODE BREAKDOWN</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {Object.entries(modeBreakdown).map(([mode, data]) => (
              <Box key={mode} sx={{ display: 'flex', alignItems: 'center', gap: 1,
                px: 2, py: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 16 }}>{MODE_ICONS[mode] || '🔄'}</Typography>
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'capitalize' }}>{mode}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{data.count} orders · {fmt(data.amount)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search order # or customer..."
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ bgcolor: 'white', minWidth: 230, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Payment Status</InputLabel>
          <Select label="Payment Status" value={payF} onChange={e => setPayF(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="all">All Statuses</MenuItem>
            {Object.entries(PAY_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Mode</InputLabel>
          <Select label="Mode" value={modeF} onChange={e => setModeF(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="all">All Modes</MenuItem>
            {allModes.map(m => <MenuItem key={m} value={m} sx={{ textTransform: 'capitalize' }}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
          value={fromDate} onChange={e => setFromDate(e.target.value)} sx={{ bgcolor: 'white' }} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
          value={toDate} onChange={e => setToDate(e.target.value)} sx={{ bgcolor: 'white' }} />
        <Button variant="outlined" size="small" onClick={fetchOrders}
          sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#1d4ed8', color: '#1d4ed8', height: 40 }}>
          Apply
        </Button>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', bgcolor: 'white' }}>
        {loading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#1d4ed8' }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>No payment records found.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Order #', 'Date', 'Customer', 'Mode', 'Grand Total', 'Paid', 'Balance', 'Status', ''].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(o => {
                  const pm      = PAY_META[o.paymentStatus] || PAY_META.pending
                  const balance = Math.max(0, (o.grandTotal || 0) - (o.paidAmount || 0))
                  const pct     = o.grandTotal > 0 ? Math.round(((o.paidAmount || 0) / o.grandTotal) * 100) : 0
                  return (
                    <TableRow key={o._id}
                      sx={{ '&:hover': { bgcolor: '#f8fafc' }, borderBottom: '1px solid #f1f5f9' }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>
                        {o.orderNumber}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {fmtDate(o.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{o.customerName}</Typography>
                        {o.visitArea && <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{o.visitArea}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography sx={{ fontSize: 14 }}>{MODE_ICONS[o.paymentMode] || '🔄'}</Typography>
                          <Typography sx={{ fontSize: 12, color: '#475569', textTransform: 'capitalize' }}>{o.paymentMode || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        {fmt(o.grandTotal)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                        {fmt(o.paidAmount)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13, color: balance > 0 ? '#dc2626' : '#94a3b8', fontWeight: balance > 0 ? 700 : 400 }}>
                        {balance > 0 ? fmt(balance) : '—'}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip label={pm.label} size="small"
                            sx={{ fontSize: 10, height: 20, bgcolor: pm.bg, color: pm.color, fontWeight: 700, border: `1px solid ${pm.border}`, mb: 0.5 }} />
                          {o.paymentStatus === 'partial' && (
                            <Box>
                              <LinearProgress variant="determinate" value={pct}
                                sx={{ height: 3, borderRadius: 2, bgcolor: '#f1f5f9',
                                  '& .MuiLinearProgress-bar': { bgcolor: '#d97706' } }} />
                              <Typography sx={{ fontSize: 10, color: '#94a3b8', mt: 0.25 }}>{pct}% paid</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => setDetail(o)}
                          sx={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', minWidth: 'auto', px: 1 }}>
                          DETAILS
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Footer totals row */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1.5,
              bgcolor: '#f8fafc', borderTop: '2px solid #e2e8f0', gap: 4 }}>
              <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                Showing <strong>{filtered.length}</strong> records
              </Typography>
              <Typography sx={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>
                Total: {fmt(totalValue)}
              </Typography>
              <Typography sx={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#16a34a' }}>
                Collected: {fmt(totalCollected)}
              </Typography>
              <Typography sx={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>
                Pending: {fmt(totalPending)}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* ── Detail Dialog ── */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        {detail && (() => {
          const pm      = PAY_META[detail.paymentStatus] || PAY_META.pending
          const balance = Math.max(0, (detail.grandTotal || 0) - (detail.paidAmount || 0))
          return (
            <>
              <DialogTitle sx={{ fontWeight: 800, fontSize: 17, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
                Payment Details — {detail.orderNumber}
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
                  {[
                    { label: 'Customer',  value: detail.customerName },
                    { label: 'Date',      value: fmtDate(detail.createdAt) },
                    { label: 'Order Type',value: detail.orderType },
                    { label: 'Visit Area',value: detail.visitArea || '—' },
                  ].map(x => (
                    <Box key={x.label} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>{x.label.toUpperCase()}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mt: 0.25, textTransform: 'capitalize' }}>{x.value}</Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Payment breakdown */}
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', mb: 1.5, letterSpacing: '0.05em' }}>PAYMENT BREAKDOWN</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 13, color: '#64748b' }}>Grand Total</Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{fmt(detail.grandTotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 13, color: '#16a34a' }}>Amount Paid</Typography>
                      <Typography sx={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>
                        ({MODE_ICONS[detail.paymentMode] || ''} {detail.paymentMode})
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#16a34a' }}>{fmt(detail.paidAmount)}</Typography>
                  </Box>
                  {balance > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#fef2f2', borderRadius: 2 }}>
                      <Typography sx={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Balance Due</Typography>
                      <Typography sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: '#dc2626' }}>{fmt(balance)}</Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Chip label={`STATUS: ${pm.label.toUpperCase()}`}
                    sx={{ fontWeight: 800, fontSize: 12, bgcolor: pm.bg, color: pm.color, border: `1px solid ${pm.border}`, px: 1 }} />
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={() => setDetail(null)} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
              </DialogActions>
            </>
          )
        })()}
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}