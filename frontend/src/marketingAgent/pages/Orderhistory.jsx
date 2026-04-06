import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Divider,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, Alert, Snackbar
} from '@mui/material'
import axios from 'axios'

const BASE       = import.meta.env.VITE_API_BASE_URL;
const API        = `${BASE}/api/sale-orders/agent`
const getToken   = () => localStorage.getItem('agentToken')
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` })

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—'

const typeColor = (t) =>
  t === 'bill'    ? { bg: '#eff6ff', color: '#1d4ed8' } :
  t === 'challan' ? { bg: '#f0fdf4', color: '#16a34a' } :
                    { bg: '#fdf4ff', color: '#7c3aed' }

const payColor = (s) =>
  s === 'paid'    ? { bg: '#f0fdf4', color: '#16a34a' } :
  s === 'partial' ? { bg: '#fffbeb', color: '#d97706' } :
                    { bg: '#fef2f2', color: '#dc2626' }

export default function AgentOrderHistory() {
  const navigate  = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [typeF,   setTypeF]   = useState('all')
  const [payF,    setPayF]    = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' })

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (typeF !== 'all') params.type = typeF
      if (payF  !== 'all') params.paymentStatus = payF
      if (fromDate) params.from = fromDate
      if (toDate)   params.to   = toDate
      const { data } = await axios.get(`${API}/my-orders`, { headers: authHeader(), params })
      if (data.success) setOrders(data.orders)
    } catch { setSnack({ open: true, msg: 'Failed to load orders', severity: 'error' }) }
    setLoading(false)
  }
  useEffect(() => { fetchOrders() }, [typeF, payF])

  const totalValue = orders.reduce((s, o) => s + (o.grandTotal || 0), 0)
  const paidValue  = orders.reduce((s, o) => s + (o.paidAmount  || 0), 0)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>My Orders</Typography>
          <Typography sx={{ color: '#64748b', fontSize: 14, mt: 0.5 }}>Bills, challans and quotations you have raised.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[['bill', 'Create Bill'], ['challan', 'Create Challan'], ['quotation', 'Quotation']].map(([type, label]) => (
            <Button key={type} variant="outlined" size="small"
              onClick={() => navigate(`/agent/orders/create?type=${type}`)}
              sx={{ fontWeight: 700, borderRadius: 2, fontSize: 12, borderColor: '#1d4ed8', color: '#1d4ed8' }}>
              + {label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'TOTAL ORDERS', value: orders.length,              color: '#1d4ed8' },
          { label: 'TOTAL VALUE',  value: fmt(totalValue),            color: '#7c3aed' },
          { label: 'COLLECTED',    value: fmt(paidValue),             color: '#16a34a' },
          { label: 'OUTSTANDING',  value: fmt(totalValue - paidValue), color: '#dc2626' },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            sx={{ border: '1px solid #e2e8f0', borderTop: `3px solid ${s.color}`, borderRadius: 3, p: 2.5, bgcolor: 'white' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace', mt: 0.5 }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={typeF} onChange={e => setTypeF(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="all">All Types</MenuItem>
            {['bill','challan','quotation'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Payment</InputLabel>
          <Select label="Payment" value={payF} onChange={e => setPayF(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="all">All Payments</MenuItem>
            {['pending','partial','paid'].map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
          value={fromDate} onChange={e => setFromDate(e.target.value)} sx={{ bgcolor: 'white' }} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
          value={toDate} onChange={e => setToDate(e.target.value)} sx={{ bgcolor: 'white' }} />
        <Button variant="outlined" size="small" onClick={fetchOrders}
          sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#1d4ed8', color: '#1d4ed8' }}>Apply</Button>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', bgcolor: 'white' }}>
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: '#1d4ed8' }} /></Box>
        ) : orders.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: 14, mb: 2 }}>No orders yet.</Typography>
            <Button variant="contained" onClick={() => navigate('/agent/orders/create')}
              sx={{ bgcolor: '#1d4ed8', fontWeight: 700, borderRadius: 2 }}>Create Your First Bill</Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Order #', 'Date', 'Customer', 'Type', 'Amount', 'Payment', 'Status', ''].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map(o => {
                  const tc = typeColor(o.orderType)
                  const pc = payColor(o.paymentStatus)
                  return (
                    <TableRow key={o._id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, borderBottom: '1px solid #f1f5f9' }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>{o.orderNumber}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(o.createdAt)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{o.customerName}</Typography>
                        {o.visitArea && <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{o.visitArea}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip label={o.orderType} size="small" sx={{ fontSize: 10, height: 20, bgcolor: tc.bg, color: tc.color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{fmt(o.grandTotal)}</TableCell>
                      <TableCell>
                        <Chip label={o.paymentStatus} size="small" sx={{ fontSize: 10, height: 20, bgcolor: pc.bg, color: pc.color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#475569' }}>{o.status}</TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => setViewOrder(o)}
                          sx={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', minWidth: 'auto' }}>VIEW</Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* VIEW DIALOG */}
      <Dialog open={!!viewOrder} onClose={() => setViewOrder(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {viewOrder && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: 17, borderBottom: '1px solid #f1f5f9', pb: 2, display: 'flex', justifyContent: 'space-between' }}>
              {viewOrder.orderNumber}
              <Chip label={viewOrder.orderType} size="small" sx={{ fontSize: 10, height: 20, ...typeColor(viewOrder.orderType), fontWeight: 700 }} />
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                {[
                  { label: 'Date',     value: fmtDate(viewOrder.createdAt) },
                  { label: 'Customer', value: viewOrder.customerName },
                  { label: 'Phone',    value: viewOrder.customerPhone || '—' },
                  { label: 'Area',     value: viewOrder.visitArea || '—' },
                  { label: 'Payment',  value: viewOrder.paymentMode },
                  { label: 'Status',   value: viewOrder.status },
                ].map(x => (
                  <Box key={x.label}>
                    <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>{x.label.toUpperCase()}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{x.value}</Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {viewOrder.items?.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.productName}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Qty: {item.qty} × {fmt(item.price)}</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{fmt(item.total)}</Typography>
                </Box>
              ))}
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Grand Total</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 14, fontFamily: 'monospace', color: '#1d4ed8' }}>{fmt(viewOrder.grandTotal)}</Typography>
                </Box>
                {viewOrder.paidAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography sx={{ fontSize: 13, color: '#64748b' }}>Paid</Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: '#16a34a', fontWeight: 700 }}>{fmt(viewOrder.paidAmount)}</Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setViewOrder(null)} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}