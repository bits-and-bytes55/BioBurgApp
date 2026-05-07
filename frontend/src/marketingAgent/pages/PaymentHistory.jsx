import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Box, Typography, Paper, Button, Chip, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Divider, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip
} from '@mui/material'
import {
  AccountBalance, TrendingUp, Warning, CheckCircle,
  Close, Receipt, Add, Search
} from '@mui/icons-material'

const BASE     = import.meta.env.VITE_API_BASE_URL
const API      = `${BASE}/api/sale-orders/agent`
const getToken = () => localStorage.getItem('agentToken')
const authHdr  = () => ({ Authorization: `Bearer ${getToken()}` })
const fmt      = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const STATUS_META = {
  paid:    { color: '#16a34a', bg: '#dcfce7', label: 'Paid'    },
  partial: { color: '#d97706', bg: '#fef3c7', label: 'Partial' },
  pending: { color: '#dc2626', bg: '#fee2e2', label: 'Pending' },
}

const MODE_COLORS = {
  cash:   '#16a34a', upi:    '#7c3aed', credit:  '#d97706',
  cheque: '#0891b2', online: '#1d4ed8', other:   '#64748b',
}

export default function PaymentHistory() {
  const [orders,  setOrders]  = useState([])
  const [summary, setSummary] = useState({ totalGrand: 0, totalPaid: 0, totalDue: 0, countOrders: 0 })
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)

  // Filters
  const [statusF, setStatusF] = useState('')
  const [modeF,   setModeF]   = useState('')
  const [fromD,   setFromD]   = useState('')
  const [toD,     setToD]     = useState('')

  // Record payment dialog
  const [payDialog, setPayDialog] = useState(false)
  const [selOrder,  setSelOrder]  = useState(null)
  const [payAmt,    setPayAmt]    = useState('')
  const [payMode,   setPayMode]   = useState('cash')
  const [payNote,   setPayNote]   = useState('')
  const [saving,    setSaving]    = useState(false)

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' })
  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 30 })
      if (statusF) params.set('status', statusF)
      if (modeF)   params.set('mode',   modeF)
      if (fromD)   params.set('from',   fromD)
      if (toD)     params.set('to',     toD)

      const { data } = await axios.get(`${API}/payments/history?${params}`, { headers: authHdr() })
      if (data.success) {
        setOrders(data.orders)
        setSummary(data.summary)
        setTotal(data.total)
      }
    } catch { toast('Failed to load payment history', 'error') }
    setLoading(false)
  }

  useEffect(() => { load(1); setPage(1) }, [statusF, modeF, fromD, toD])

  const openPayment = (order) => {
    setSelOrder(order)
    setPayAmt(order.dueAmount > 0 ? String(order.dueAmount) : '')
    setPayMode(order.paymentMode || 'cash')
    setPayNote('')
    setPayDialog(true)
  }

  const submitPayment = async () => {
    if (!payAmt || Number(payAmt) <= 0) return toast('Enter a valid amount', 'warning')
    setSaving(true)
    try {
      await axios.patch(`${API}/${selOrder._id}/payment`, {
        amount: Number(payAmt), mode: payMode, note: payNote,
      }, { headers: authHdr() })
      toast('Payment recorded successfully')
      setPayDialog(false)
      load(page)
    } catch (e) { toast(e.response?.data?.message || 'Failed', 'error') }
    setSaving(false)
  }

  const summaryCards = [
    {
      label: 'Total Invoiced', value: fmt(summary.totalGrand),
      icon: <TrendingUp />, color: '#1d4ed8', bg: '#eff6ff',
    },
    {
      label: 'Amount Collected', value: fmt(summary.totalPaid),
      icon: <CheckCircle />, color: '#16a34a', bg: '#f0fdf4',
    },
    {
      label: 'Outstanding Due', value: fmt(summary.totalDue),
      icon: <Warning />, color: '#dc2626', bg: '#fef2f2',
    },
    {
      label: 'Total Orders', value: summary.countOrders,
      icon: <Receipt />, color: '#7c3aed', bg: '#f5f3ff',
    },
  ]

  const collectionRate = summary.totalGrand > 0
    ? ((summary.totalPaid / summary.totalGrand) * 100).toFixed(1)
    : 0

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* ── HEADER ── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 24, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Payment History
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.3 }}>
          Track all customer payments and dues
        </Typography>
      </Box>

      {/* ── SUMMARY CARDS ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {summaryCards.map(card => (
          <Paper key={card.label} elevation={0} sx={{
            border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '12px',
              bgcolor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: card.color, flexShrink: 0,
            }}>
              {card.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
                {card.value}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Collection rate bar */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Collection Rate</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#1d4ed8' }}>{collectionRate}%</Typography>
        </Box>
        <Box sx={{ height: 8, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', borderRadius: 4,
            width: `${collectionRate}%`,
            background: collectionRate >= 80 ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                      : collectionRate >= 50 ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                      : 'linear-gradient(90deg, #dc2626, #f87171)',
            transition: 'width 0.6s ease',
          }} />
        </Box>
        <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.7 }}>
          {fmt(summary.totalPaid)} collected of {fmt(summary.totalGrand)} total
        </Typography>
      </Paper>

      {/* ── FILTERS ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusF} onChange={e => setStatusF(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="partial">Partial</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Mode</InputLabel>
          <Select label="Mode" value={modeF} onChange={e => setModeF(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="">All Modes</MenuItem>
            {['cash', 'upi', 'credit', 'cheque', 'online', 'other'].map(m => (
              <MenuItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
          value={fromD} onChange={e => setFromD(e.target.value)}
          sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
          value={toD} onChange={e => setToD(e.target.value)}
          sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        {(statusF || modeF || fromD || toD) && (
          <Button size="small" onClick={() => { setStatusF(''); setModeF(''); setFromD(''); setToD('') }}
            sx={{ color: '#dc2626', fontWeight: 600 }}>
            Clear Filters
          </Button>
        )}
      </Box>

      {/* ── TABLE ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: '#1d4ed8' }} /></Box>
        ) : orders.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <AccountBalance sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
            <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No payment records found</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Invoice #', 'Customer', 'Date', 'Total', 'Paid', 'Due', 'Mode', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', py: 1.5, whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map(o => {
                  const sm = STATUS_META[o.paymentStatus] || STATUS_META.pending
                  return (
                    <TableRow key={o._id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                      <TableCell>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#1d4ed8' }}>
                          {o.orderNumber}
                        </Typography>
                        <Typography sx={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{o.orderType}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{o.customerName}</Typography>
                        {o.visitArea && <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>{o.visitArea}</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{fmt(o.grandTotal)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>{fmt(o.paidAmount)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: 13, color: o.dueAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                          {fmt(o.dueAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={o.paymentMode?.toUpperCase()} size="small"
                          sx={{
                            fontSize: 9, height: 20, fontWeight: 700,
                            bgcolor: (MODE_COLORS[o.paymentMode] || '#64748b') + '18',
                            color: MODE_COLORS[o.paymentMode] || '#64748b',
                          }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={sm.label} size="small"
                          sx={{ fontSize: 10, height: 20, bgcolor: sm.bg, color: sm.color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        {o.paymentStatus !== 'paid' && (
                          <Tooltip title="Record Payment">
                            <Button size="small" variant="outlined" startIcon={<Add sx={{ fontSize: 14 }} />}
                              onClick={() => openPayment(o)}
                              sx={{ fontSize: 10, py: 0.4, borderColor: '#1d4ed8', color: '#1d4ed8', fontWeight: 700, borderRadius: 1.5 }}>
                              Pay
                            </Button>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        {total > 30 && (
          <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>Showing {orders.length} of {total}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}>Previous</Button>
              <Button size="small" disabled={orders.length < 30} onClick={() => { setPage(p => p + 1); load(page + 1) }}>Next</Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* ══ RECORD PAYMENT DIALOG ══ */}
      <Dialog open={payDialog} onClose={() => setPayDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #f1f5f9', pb: 2,
        }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Record Payment</Typography>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>{selOrder?.orderNumber} · {selOrder?.customerName}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setPayDialog(false)}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>TOTAL</Typography>
                <Typography sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{fmt(selOrder?.grandTotal)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>PAID</Typography>
                <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#16a34a' }}>{fmt(selOrder?.paidAmount)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>DUE</Typography>
                <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#dc2626' }}>{fmt(selOrder?.dueAmount)}</Typography>
              </Box>
            </Box>
            <TextField size="small" label="Amount Received (₹) *" type="number" fullWidth
              value={payAmt} onChange={e => setPayAmt(e.target.value)} />
            <FormControl size="small" fullWidth>
              <InputLabel>Payment Mode</InputLabel>
              <Select label="Payment Mode" value={payMode} onChange={e => setPayMode(e.target.value)}>
                {['cash', 'upi', 'credit', 'cheque', 'online', 'other'].map(m => (
                  <MenuItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="Note (optional)" fullWidth
              value={payNote} onChange={e => setPayNote(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <Button onClick={() => setPayDialog(false)} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={submitPayment} disabled={saving}
            sx={{ bgcolor: '#16a34a', fontWeight: 700, borderRadius: 2, '&:hover': { filter: 'brightness(0.9)' } }}>
            {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}