import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  Box, Typography, Paper, Button, Chip, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  Tooltip, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Alert,
  Snackbar, Badge, Tabs, Tab
} from '@mui/material'
import {
  Search, Print, Share, Visibility, FilterList,
  Receipt, Assignment, LocalShipping, Close, Download,
  WhatsApp, ContentCopy, CheckCircle, Cancel
} from '@mui/icons-material'

const BASE      = import.meta.env.VITE_API_BASE_URL
const API       = `${BASE}/api/sale-orders/agent`
const getToken  = () => localStorage.getItem('agentToken')
const authHdr   = () => ({ Authorization: `Bearer ${getToken()}` })
const fmt       = n  => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const TYPE_META = {
  bill:      { label: 'Tax Invoice',       color: '#1d4ed8', bg: '#eff6ff', icon: <Receipt sx={{ fontSize: 14 }} /> },
  challan:   { label: 'Delivery Challan',  color: '#16a34a', bg: '#f0fdf4', icon: <LocalShipping sx={{ fontSize: 14 }} /> },
  quotation: { label: 'Quotation',         color: '#7c3aed', bg: '#f5f3ff', icon: <Assignment sx={{ fontSize: 14 }} /> },
}

const STATUS_META = {
  paid:    { color: '#16a34a', bg: '#dcfce7', label: 'Paid' },
  partial: { color: '#d97706', bg: '#fef3c7', label: 'Partial' },
  pending: { color: '#dc2626', bg: '#fee2e2', label: 'Pending' },
}

/* INVOICE PRINT TEMPLATE */
function InvoicePrintTemplate({ order }) {
  if (!order) return null
  const meta  = TYPE_META[order.orderType]  || TYPE_META.bill
  const sDate = new Date(order.invoiceDate || order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
  const dDate = order.dueDate
    ? new Date(order.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <Box id="invoice-print-area" sx={{
      fontFamily: '"DM Sans", "Segoe UI", sans-serif',
      color: '#111827',
      bgcolor: 'white',
      p: '36px 40px',
      minHeight: '100%',
    }}>
      {/* ── HEADER ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        {/* Left – Invoice title */}
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 900, color: meta.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {meta.label.toUpperCase()}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6b7280', mt: 0.5 }}>
            # {order.orderNumber}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
            <Box>
              <Typography sx={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Date</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{sDate}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Due Date</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{dDate}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Right – Bioburg branding */}
        <Box sx={{
          textAlign: 'right',
          border: '2px solid #1d4ed8',
          borderRadius: '12px',
          p: '12px 20px',
          minWidth: 200,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mb: 0.5 }}>
            {/* Logo mark */}
            <Box sx={{
              width: 32, height: 32, borderRadius: '8px',
              bgcolor: '#1d4ed8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: 'white', fontWeight: 900, fontSize: 14, letterSpacing: '-0.05em' }}>BB</Typography>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16, color: '#1d4ed8', letterSpacing: '-0.02em' }}>
              BioBurg
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Lifesciences Pvt. Ltd.
          </Typography>
          <Divider sx={{ my: 1, borderColor: '#dbeafe' }} />
          <Typography sx={{ fontSize: 10, color: '#6b7280', lineHeight: 1.8 }}>
            www.bioburglifesciences.in<br />
            support@bioburglifesciences.in<br />
            GSTIN: 09AABCB1234A1Z5
          </Typography>
        </Box>
      </Box>

      {/* ── BILL FROM / BILL TO ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
        <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: '8px', borderLeft: `3px solid ${meta.color}` }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', mb: 1 }}>From</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>BioBurg Lifesciences Pvt. Ltd.</Typography>
          <Typography sx={{ fontSize: 11, color: '#6b7280', mt: 0.3, lineHeight: 1.7 }}>
            Field Agent: {order.agentName || '—'}<br />
            Area: {order.visitArea || '—'}
          </Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: '8px', borderLeft: `3px solid ${meta.color}` }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', mb: 1 }}>Bill To</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{order.customerName}</Typography>
          <Typography sx={{ fontSize: 11, color: '#6b7280', mt: 0.3, lineHeight: 1.7 }}>
            {order.customerPhone && <>{order.customerPhone}<br /></>}
            {order.customerAddress && <>{order.customerAddress}<br /></>}
            {order.customerGST && <>GSTIN: {order.customerGST}</>}
          </Typography>
        </Box>
      </Box>

      {/* ── ITEMS TABLE ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          bgcolor: meta.color, color: 'white',
          borderRadius: '8px 8px 0 0', p: '10px 12px',
        }}>
          {['Product', 'MRP', 'Rate', 'Qty', 'Total'].map(h => (
            <Typography key={h} sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</Typography>
          ))}
        </Box>
        {order.items.map((item, i) => (
          <Box key={i} sx={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
            p: '10px 12px',
            bgcolor: i % 2 === 0 ? 'white' : '#f9fafb',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{item.productName}</Typography>
              {item.brandName && <Typography sx={{ fontSize: 10, color: '#9ca3af' }}>{item.brandName}</Typography>}
            </Box>
            <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>{fmt(item.mrp)}</Typography>
            <Typography sx={{ fontSize: 12 }}>{fmt(item.price)}</Typography>
            <Typography sx={{ fontSize: 12 }}>{item.qty}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{fmt(item.total)}</Typography>
          </Box>
        ))}
        <Box sx={{ borderRadius: '0 0 8px 8px', border: '1px solid #f3f4f6', borderTop: 0 }}>
          {/* Summary rows */}
          {[
            { label: 'Subtotal', value: fmt(order.subtotal) },
            ...(order.discountAmt > 0 ? [{ label: `Discount`, value: `- ${fmt(order.discountAmt)}` }] : []),
            ...(order.taxAmt > 0 ? [{ label: `GST (${order.taxPercent}%)`, value: `+ ${fmt(order.taxAmt)}` }] : []),
          ].map(row => (
            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, px: 2, py: 0.8 }}>
              <Typography sx={{ fontSize: 12, color: '#6b7280', minWidth: 130, textAlign: 'right' }}>{row.label}</Typography>
              <Typography sx={{ fontSize: 12, fontFamily: 'monospace', minWidth: 90, textAlign: 'right' }}>{row.value}</Typography>
            </Box>
          ))}
          <Box sx={{
            display: 'flex', justifyContent: 'flex-end', gap: 4,
            px: 2, py: 1.2, borderTop: `2px solid ${meta.color}`,
            bgcolor: meta.bg, borderRadius: '0 0 8px 8px',
          }}>
            <Typography sx={{ fontWeight: 800, fontSize: 14, color: meta.color, minWidth: 130, textAlign: 'right' }}>Grand Total</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: 14, fontFamily: 'monospace', color: meta.color, minWidth: 90, textAlign: 'right' }}>{fmt(order.grandTotal)}</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── PAYMENT STATUS ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
        <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: '8px' }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', mb: 1 }}>Payment Info</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7 }}>
            {[
              { l: 'Mode',    v: order.paymentMode?.charAt(0).toUpperCase() + order.paymentMode?.slice(1) },
              { l: 'Status',  v: STATUS_META[order.paymentStatus]?.label || order.paymentStatus },
              { l: 'Paid',    v: fmt(order.paidAmount) },
              { l: 'Balance', v: fmt(order.dueAmount) },
            ].map(r => (
              <Box key={r.l} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 11, color: '#6b7280' }}>{r.l}</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{r.v}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        {order.notes && (
          <Box sx={{ p: 2, bgcolor: '#fffbeb', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', mb: 1 }}>Notes</Typography>
            <Typography sx={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }}>{order.notes}</Typography>
          </Box>
        )}
      </Box>

      {/* ── FOOTER ── */}
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 10, color: '#9ca3af' }}>
          This is a computer-generated {TYPE_META[order.orderType]?.label || 'document'}. No signature required.
        </Typography>
        <Typography sx={{ fontSize: 10, color: '#9ca3af' }}>
          Generated by BioBurg Field Portal
        </Typography>
      </Box>
    </Box>
  )
}

/* MAIN INVOICES PAGE */
export default function Invoices() {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [typeTab,  setTypeTab]  = useState('all')
  const [statusF,  setStatusF]  = useState('')
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)

  const [selected, setSelected] = useState(null)   // order being viewed
  const [viewOpen, setViewOpen] = useState(false)
  const [snack,    setSnack]    = useState({ open: false, msg: '', severity: 'info' })

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (typeTab !== 'all') params.set('type', typeTab)
      if (statusF)           params.set('status', statusF)
      if (search)            params.set('search', search)

      const { data } = await axios.get(`${API}/list?${params}`, { headers: authHdr() })
      if (data.success) { setOrders(data.orders); setTotal(data.total) }
    } catch { toast('Failed to load invoices', 'error') }
    setLoading(false)
  }

  useEffect(() => { load(1); setPage(1) }, [typeTab, statusF])
  useEffect(() => {
    const t = setTimeout(() => { load(1); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const openView = (order) => { setSelected(order); setViewOpen(true) }

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-area')
    if (!printContent) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head>
        <title>${selected?.orderNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', 'Segoe UI', sans-serif; background: white; }
          @page { margin: 15mm; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head><body>${printContent.innerHTML}</body></html>
    `)
    win.document.close()
    setTimeout(() => { win.focus(); win.print(); win.close() }, 500)
  }

  const handleShare = () => {
    if (!selected) return
    const text = `*${TYPE_META[selected.orderType]?.label}*\n` +
      `No: ${selected.orderNumber}\n` +
      `Customer: ${selected.customerName}\n` +
      `Amount: ${fmt(selected.grandTotal)}\n` +
      `Status: ${STATUS_META[selected.paymentStatus]?.label}\n` +
      `From: BioBurg Lifesciences`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(selected?.orderNumber || '')
    toast('Order number copied!')
  }

  const tabCounts = { all: total }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* ── HEADER ── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 24, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Invoices & Documents
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.3 }}>
          Manage all bills, challans, and quotations
        </Typography>
      </Box>

      {/* ── TABS ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, mb: 3 }}>
        <Tabs
          value={typeTab}
          onChange={(_, v) => setTypeTab(v)}
          sx={{
            px: 2,
            '& .MuiTab-root': { fontSize: 13, fontWeight: 600, textTransform: 'none', minHeight: 48 },
            '& .Mui-selected': { color: '#1d4ed8' },
            '& .MuiTabs-indicator': { bgcolor: '#1d4ed8' },
          }}
        >
          <Tab value="all"       label="All Documents" />
          <Tab value="bill"      label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Receipt sx={{ fontSize: 16 }} /> Tax Invoices</Box>} />
          <Tab value="challan"   label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LocalShipping sx={{ fontSize: 16 }} /> Challans</Box>} />
          <Tab value="quotation" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Assignment sx={{ fontSize: 16 }} /> Quotations</Box>} />
        </Tabs>
      </Paper>

      {/* ── FILTERS ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search by order#, customer, phone…"
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94a3b8', fontSize: 18 }} /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Payment Status</InputLabel>
          <Select label="Payment Status" value={statusF} onChange={e => setStatusF(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="partial">Partial</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* ── TABLE ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#1d4ed8' }} />
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Receipt sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
            <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No documents found</Typography>
            <Typography sx={{ color: '#cbd5e1', fontSize: 13, mt: 0.5 }}>Create a bill, challan or quote from Orders</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Document #', 'Type', 'Customer', 'Date', 'Amount', 'Payment', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map(o => {
                  const tm = TYPE_META[o.orderType] || TYPE_META.bill
                  const sm = STATUS_META[o.paymentStatus] || STATUS_META.pending
                  return (
                    <TableRow key={o._id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, cursor: 'pointer' }}
                      onClick={() => openView(o)}>
                      <TableCell>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#1d4ed8' }}>
                          {o.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={tm.icon}
                          label={tm.label}
                          size="small"
                          sx={{ fontSize: 10, height: 22, bgcolor: tm.bg, color: tm.color, fontWeight: 700, border: `1px solid ${tm.color}30` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{o.customerName}</Typography>
                        {o.customerPhone && <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{o.customerPhone}</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{fmt(o.grandTotal)}</Typography>
                        {o.dueAmount > 0 && <Typography sx={{ fontSize: 10, color: '#dc2626' }}>Due: {fmt(o.dueAmount)}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip label={sm.label} size="small"
                          sx={{ fontSize: 10, height: 20, bgcolor: sm.bg, color: sm.color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => openView(o)} sx={{ color: '#1d4ed8' }}>
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton size="small" onClick={() => { setSelected(o); setTimeout(handlePrint, 50) }} sx={{ color: '#64748b' }}>
                              <Print sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Share on WhatsApp">
                            <IconButton size="small" onClick={() => { setSelected(o); setTimeout(handleShare, 50) }} sx={{ color: '#16a34a' }}>
                              <WhatsApp sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Pagination footer */}
        {total > 20 && (
          <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>Showing {orders.length} of {total}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}
                sx={{ fontSize: 12 }}>Previous</Button>
              <Button size="small" disabled={orders.length < 20} onClick={() => { setPage(p => p + 1); load(page + 1) }}
                sx={{ fontSize: 12 }}>Next</Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* ══ INVOICE VIEW DIALOG ══ */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          bgcolor: '#0f172a', color: 'white', py: 1.5, px: 2.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt sx={{ fontSize: 18 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
              {selected?.orderNumber}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Print Invoice">
              <IconButton onClick={handlePrint} size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <Print sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share via WhatsApp">
              <IconButton onClick={handleShare} size="small" sx={{ color: '#4ade80', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <WhatsApp sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy Order #">
              <IconButton onClick={handleCopyLink} size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <ContentCopy sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => setViewOpen(false)} size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          <InvoicePrintTemplate order={selected} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9', gap: 1.5 }}>
          <Button onClick={() => setViewOpen(false)} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
          <Button variant="outlined" startIcon={<WhatsApp />} onClick={handleShare}
            sx={{ borderColor: '#16a34a', color: '#16a34a', fontWeight: 700, borderRadius: 2 }}>
            Share on WhatsApp
          </Button>
          <Button variant="contained" startIcon={<Print />} onClick={handlePrint}
            sx={{ bgcolor: '#1d4ed8', fontWeight: 700, borderRadius: 2, '&:hover': { filter: 'brightness(0.9)' } }}>
            Print / Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden print area when triggered from table row */}
      {selected && !viewOpen && (
        <Box sx={{ display: 'none' }}>
          <InvoicePrintTemplate order={selected} />
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}