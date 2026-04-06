import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Paper, TextField, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableHead, TableRow, Select, MenuItem, FormControl,
  InputLabel, Alert, Snackbar, CircularProgress, Divider, Tabs, Tab,
  LinearProgress
} from '@mui/material'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL;
const API  = `${BASE}/api/sale-orders/admin`

const ORDER_TYPES    = ['all', 'bill', 'challan', 'quotation']
const ORDER_STATUSES = ['confirmed', 'dispatched', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'partial', 'paid']

const typeColor = (t) =>
  t === 'bill'      ? { bg: '#eff6ff', color: '#1d4ed8' } :
  t === 'challan'   ? { bg: '#f0fdf4', color: '#16a34a' } :
                      { bg: '#fdf4ff', color: '#7c3aed' }

const statusColor = (s) =>
  s === 'delivered'  ? { bg: '#f0fdf4', color: '#16a34a' } :
  s === 'dispatched' ? { bg: '#fffbeb', color: '#d97706' } :
  s === 'cancelled'  ? { bg: '#fef2f2', color: '#dc2626' } :
                       { bg: '#eff6ff', color: '#1d4ed8' }

const payColor = (s) =>
  s === 'paid'    ? { bg: '#f0fdf4', color: '#16a34a' } :
  s === 'partial' ? { bg: '#fffbeb', color: '#d97706' } :
                    { bg: '#fef2f2', color: '#dc2626' }

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—'

export default function AdminMarketingOrders() {
  const [tab, setTab]         = useState(0)
  const [orders, setOrders]   = useState([])
  const [summary, setSummary] = useState([])
  const [stats, setStats]     = useState({})
  const [loading, setLoading] = useState(true)

  const [search,    setSearch]    = useState('')
  const [typeF,     setTypeF]     = useState('all')
  const [statusF,   setStatusF]   = useState('all')
  const [fromDate,  setFromDate]  = useState('')
  const [toDate,    setToDate]    = useState('')

  const [viewOrder,   setViewOrder]   = useState(null)
  const [editOrder,   setEditOrder]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editForm, setEditForm] = useState({ status: '', paymentStatus: '', paidAmount: '', notes: '' })
  const [saving, setSaving]   = useState(false)
  const [snack, setSnack]     = useState({ open: false, msg: '', severity: 'success' })

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)           params.search = search
      if (typeF !== 'all')  params.type   = typeF
      if (statusF !== 'all') params.status = statusF
      if (fromDate) params.from = fromDate
      if (toDate)   params.to   = toDate

      const [ordRes, sumRes] = await Promise.all([
        axios.get(`${API}/all`, { params }),
        axios.get(`${API}/agent-summary`)
      ])
      if (ordRes.data.success) { setOrders(ordRes.data.orders); setStats(ordRes.data.stats || {}) }
      if (sumRes.data.success)   setSummary(sumRes.data.summary)
    } catch { toast('Failed to load orders', 'error') }
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [typeF, statusF])

  const handleSearch = (e) => { if (e.key === 'Enter') fetchOrders() }

  const openEdit = (order) => {
    setEditOrder(order)
    setEditForm({ status: order.status, paymentStatus: order.paymentStatus, paidAmount: order.paidAmount, notes: order.notes || '' })
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const { data } = await axios.patch(`${API}/${editOrder._id}`, editForm)
      if (data.success) { toast('Order updated'); setEditOrder(null); fetchOrders() }
    } catch { toast('Update failed', 'error') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/${deleteTarget._id}`)
      toast('Order deleted'); setDeleteTarget(null); fetchOrders()
    } catch { toast('Delete failed', 'error') }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Orders Management
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: 14, mt: 0.5 }}>
          View and manage all bills, challans, and quotations raised by marketing agents.
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'TOTAL ORDERS',  value: stats.total     || 0,  color: '#1d4ed8', sub: `${stats.bills||0} bills · ${stats.challans||0} challans` },
          { label: 'TOTAL VALUE',   value: fmt(stats.totalValue), color: '#7c3aed', sub: `${fmt(stats.paidValue)} collected` },
          { label: 'PAYMENT PENDING', value: stats.pending   || 0,  color: '#dc2626', sub: 'orders pending' },
          { label: 'QUOTATIONS',    value: stats.quotations || 0,  color: '#d97706', sub: 'to be converted' },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            sx={{ border: '1px solid #e2e8f0', borderTop: `3px solid ${s.color}`, borderRadius: 3, p: 2.5, bgcolor: 'white' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace', mt: 0.5 }}>{s.value}</Typography>
            <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.3 }}>{s.sub}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
          '& .MuiTab-root': { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
          '& .Mui-selected': { color: '#1d4ed8' },
          '& .MuiTabs-indicator': { bgcolor: '#1d4ed8', height: 3 }
        }}>
          <Tab label="All Orders" />
          <Tab label="Agent Summary" />
        </Tabs>
      </Box>

      {/* ── TAB 0: ALL ORDERS ── */}
      {tab === 0 && (
        <Box sx={{ pt: 3 }}>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" placeholder="Search order, customer, agent..." value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch}
              sx={{ width: { xs: '100%', sm: 280 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }} />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={typeF} onChange={e => setTypeF(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
                {ORDER_TYPES.map(t => <MenuItem key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={statusF} onChange={e => setStatusF(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
                <MenuItem value="all">All Status</MenuItem>
                {ORDER_STATUSES.map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
              value={fromDate} onChange={e => setFromDate(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }} />
            <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
              value={toDate} onChange={e => setToDate(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }} />
            <Button variant="outlined" size="small" onClick={fetchOrders}
              sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#1d4ed8', color: '#1d4ed8' }}>
              Apply
            </Button>
          </Box>

          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', bgcolor: 'white' }}>
            {loading ? (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: '#1d4ed8' }} /></Box>
            ) : orders.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>No orders found.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      {['Order #', 'Date', 'Agent', 'Customer', 'Type', 'Amount', 'Payment', 'Status', 'Actions'].map(h => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map(o => {
                      const tc = typeColor(o.orderType)
                      const sc = statusColor(o.status)
                      const pc = payColor(o.paymentStatus)
                      return (
                        <TableRow key={o._id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, borderBottom: '1px solid #f1f5f9' }}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>{o.orderNumber}</TableCell>
                          <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(o.createdAt)}</TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{o.agentName}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{o.customerName}</Typography>
                            {o.customerPhone && <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{o.customerPhone}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Chip label={o.orderType} size="small" sx={{ fontSize: 10, height: 20, bgcolor: tc.bg, color: tc.color, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{fmt(o.grandTotal)}</Typography>
                            {o.paidAmount > 0 && o.paidAmount < o.grandTotal && (
                              <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{fmt(o.paidAmount)} paid</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label={o.paymentStatus} size="small" sx={{ fontSize: 10, height: 20, bgcolor: pc.bg, color: pc.color, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={o.status} size="small" sx={{ fontSize: 10, height: 20, bgcolor: sc.bg, color: sc.color, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Button size="small" onClick={() => setViewOrder(o)}
                                sx={{ fontSize: 11, fontWeight: 700, color: '#475569', minWidth: 'auto', px: 1 }}>VIEW</Button>
                              <Button size="small" onClick={() => openEdit(o)}
                                sx={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', minWidth: 'auto', px: 1 }}>EDIT</Button>
                              <Button size="small" onClick={() => setDeleteTarget(o)}
                                sx={{ fontSize: 11, fontWeight: 700, color: '#dc2626', minWidth: 'auto', px: 1 }}>DEL</Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* ── TAB 1: AGENT SUMMARY ── */}
      {tab === 1 && (
        <Box sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {summary.length === 0 ? (
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 6, textAlign: 'center', bgcolor: 'white' }}>
              <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>No orders placed yet.</Typography>
            </Paper>
          ) : summary.map((s, i) => {
            const collected = s.paidValue || 0
            const total     = s.totalValue || 0
            const pct       = total > 0 ? Math.round((collected / total) * 100) : 0
            return (
              <Paper key={i} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{s._id.agentName}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Marketing Agent</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 20, color: '#1d4ed8' }}>{fmt(total)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                  {[
                    { label: 'TOTAL ORDERS', value: s.totalOrders },
                    { label: 'BILLS',        value: s.bills },
                    { label: 'CHALLANS',     value: s.challans },
                    { label: 'QUOTATIONS',   value: s.quotations },
                    { label: 'COLLECTED',    value: fmt(collected) },
                    { label: 'PENDING',      value: fmt(total - collected) },
                  ].map(x => (
                    <Box key={x.label}>
                      <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>{x.label}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>{x.value}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Collection rate</Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{pct}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={pct}
                    sx={{ height: 5, borderRadius: 3, bgcolor: '#fee2e2',
                      '& .MuiLinearProgress-bar': { bgcolor: pct >= 70 ? '#16a34a' : '#d97706', borderRadius: 3 } }} />
                </Box>
              </Paper>
            )
          })}
        </Box>
      )}

      {/*  VIEW ORDER DIALOG */}
      <Dialog open={!!viewOrder} onClose={() => setViewOrder(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {viewOrder && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: 17, borderBottom: '1px solid #f1f5f9', pb: 2, display: 'flex', justifyContent: 'space-between' }}>
              {viewOrder.orderNumber}
              <Chip label={viewOrder.orderType} size="small"
                sx={{ fontSize: 10, height: 20, ...typeColor(viewOrder.orderType), fontWeight: 700 }} />
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                {[
                  { label: 'Agent',     value: viewOrder.agentName },
                  { label: 'Date',      value: fmtDate(viewOrder.createdAt) },
                  { label: 'Customer',  value: viewOrder.customerName },
                  { label: 'Phone',     value: viewOrder.customerPhone || '—' },
                  { label: 'Area',      value: viewOrder.visitArea || '—' },
                  { label: 'Payment',   value: viewOrder.paymentMode },
                ].map(x => (
                  <Box key={x.label}>
                    <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>{x.label.toUpperCase()}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{x.value}</Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', mb: 1.5, letterSpacing: '0.07em' }}>ITEMS</Typography>
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
                {[
                  { label: 'Subtotal',  value: fmt(viewOrder.subtotal) },
                  viewOrder.discountAmt > 0 && { label: 'Discount', value: `-${fmt(viewOrder.discountAmt)}` },
                  viewOrder.taxAmt > 0 && { label: `Tax (${viewOrder.taxPercent}%)`, value: fmt(viewOrder.taxAmt) },
                ].filter(Boolean).map(x => (
                  <Box key={x.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography sx={{ fontSize: 13, color: '#64748b' }}>{x.label}</Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: '#334155' }}>{x.value}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #e2e8f0', mt: 0.5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Grand Total</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: '#1d4ed8' }}>{fmt(viewOrder.grandTotal)}</Typography>
                </Box>
              </Box>
              {viewOrder.notes && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fffbeb', borderRadius: 2, border: '1px solid #fde68a' }}>
                  <Typography sx={{ fontSize: 12, color: '#92400e' }}>Notes: {viewOrder.notes}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setViewOrder(null)} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
              <Button variant="outlined" onClick={() => { setViewOrder(null); openEdit(viewOrder) }}
                sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#1d4ed8', color: '#1d4ed8' }}>Edit</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/*  EDIT STATUS DIALOG  */}
      <Dialog open={!!editOrder} onClose={() => setEditOrder(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {editOrder && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: 16, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
              Update Order — {editOrder.orderNumber}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Order Status</InputLabel>
                  <Select label="Order Status" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    {ORDER_STATUSES.map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select label="Payment Status" value={editForm.paymentStatus} onChange={e => setEditForm(f => ({ ...f, paymentStatus: e.target.value }))}>
                    {PAYMENT_STATUSES.map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" type="number" label="Amount Paid (₹)" fullWidth
                  value={editForm.paidAmount} onChange={e => setEditForm(f => ({ ...f, paidAmount: e.target.value }))} />
                <TextField size="small" label="Admin Notes" multiline rows={2} fullWidth
                  value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={() => setEditOrder(null)} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
              <Button variant="contained" onClick={handleUpdate} disabled={saving}
                sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, fontWeight: 700, px: 3, borderRadius: 2 }}>
                {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'UPDATE'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/*  DELETE  */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16, color: '#dc2626' }}>Delete Order</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#334155' }}>
            Delete order <strong>{deleteTarget?.orderNumber}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, fontWeight: 700, px: 3, borderRadius: 2 }}>DELETE</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}