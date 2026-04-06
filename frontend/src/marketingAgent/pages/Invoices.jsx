import { useState, useEffect} from 'react'
import {
  Box, Typography, Button, Paper, Chip, CircularProgress,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Alert, Snackbar
} from '@mui/material'
import axios from 'axios'

const BASE     = import.meta.env.VITE_API_BASE_URL
const API      = `${BASE}/api/sale-orders/agent`
const getToken = () => localStorage.getItem('agentToken')
const auth     = () => ({ Authorization: `Bearer ${getToken()}` })

const fmt      = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const TYPE_META = {
  bill:      { label: 'Tax Invoice',        color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  challan:   { label: 'Delivery Challan',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  quotation: { label: 'Quotation',          color: '#7c3aed', bg: '#fdf4ff', border: '#e9d5ff' },
}

const PAY_META = {
  paid:    { color: '#16a34a', bg: '#f0fdf4' },
  partial: { color: '#d97706', bg: '#fffbeb' },
  pending: { color: '#dc2626', bg: '#fef2f2' },
}

/* ─── Print helper ─── */
function printInvoice(order) {
  const meta  = TYPE_META[order.orderType] || TYPE_META.bill
  const items = (order.items || []).map(it => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">
        <div style="font-weight:600;color:#0f172a;font-size:13px">${it.productName || '—'}</div>
        ${it.brandName ? `<div style="font-size:11px;color:#94a3b8">${it.brandName}</div>` : ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px">${it.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;color:#64748b">₹${Number(it.mrp||0).toLocaleString('en-IN')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px">₹${Number(it.price||0).toLocaleString('en-IN')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;font-size:13px">₹${Number(it.total||0).toLocaleString('en-IN')}</td>
    </tr>`).join('')

  const win = window.open('', '_blank', 'width=800,height=900')
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${meta.label} - ${order.orderNumber}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;background:#fff;color:#0f172a;padding:40px}
      @media print{body{padding:20px}}
    </style>
  </head><body>
    <div style="max-width:720px;margin:0 auto">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid ${meta.border}">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:${meta.color};text-transform:uppercase;margin-bottom:4px">BioBurg Life Science</div>
          <div style="font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${meta.label}</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px">${fmtDate(order.createdAt)}</div>
        </div>
        <div style="text-align:right">
          <div style="display:inline-block;padding:6px 14px;background:${meta.bg};border:1px solid ${meta.border};border-radius:6px;font-size:13px;font-weight:700;color:${meta.color}">${order.orderNumber}</div>
          <div style="margin-top:8px;font-size:12px;color:#64748b">Status: <strong style="color:#0f172a">${order.paymentStatus || '—'}</strong></div>
        </div>
      </div>

      <!-- Bill To -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px">
        <div style="padding:16px;background:#f8fafc;border-radius:8px">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Bill To</div>
          <div style="font-weight:700;font-size:15px;color:#0f172a">${order.customerName || '—'}</div>
          ${order.customerPhone ? `<div style="font-size:13px;color:#475569;margin-top:3px">${order.customerPhone}</div>` : ''}
          ${order.customerAddress ? `<div style="font-size:13px;color:#475569;margin-top:3px">${order.customerAddress}</div>` : ''}
          ${order.customerGST ? `<div style="font-size:12px;color:#94a3b8;margin-top:4px">GST: ${order.customerGST}</div>` : ''}
        </div>
        <div style="padding:16px;background:#f8fafc;border-radius:8px">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Payment Info</div>
          <div style="font-size:13px;color:#475569">Mode: <strong style="color:#0f172a">${order.paymentMode || '—'}</strong></div>
          <div style="font-size:13px;color:#475569;margin-top:4px">Status: <strong style="color:#0f172a">${order.paymentStatus || '—'}</strong></div>
          ${order.visitArea ? `<div style="font-size:13px;color:#475569;margin-top:4px">Area: <strong style="color:#0f172a">${order.visitArea}</strong></div>` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Product</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">MRP</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Rate</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Amount</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>

      <!-- Totals -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
        <div style="width:260px">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b">
            <span>Subtotal</span><span>₹${Number(order.subtotal||0).toLocaleString('en-IN')}</span>
          </div>
          ${(order.discountAmt > 0) ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b"><span>Discount</span><span style="color:#dc2626">-₹${Number(order.discountAmt||0).toLocaleString('en-IN')}</span></div>` : ''}
          ${(order.taxAmt > 0) ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b"><span>GST (${order.taxPercent||0}%)</span><span>+₹${Number(order.taxAmt||0).toLocaleString('en-IN')}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:800;color:#0f172a;border-top:2px solid #e2e8f0;margin-top:4px">
            <span>Grand Total</span><span style="color:${meta.color}">₹${Number(order.grandTotal||0).toLocaleString('en-IN')}</span>
          </div>
          ${(order.paidAmount > 0) ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#16a34a"><span>Paid</span><span>₹${Number(order.paidAmount||0).toLocaleString('en-IN')}</span></div>` : ''}
          ${(order.grandTotal - order.paidAmount > 0) ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#dc2626"><span>Balance Due</span><span>₹${Number((order.grandTotal||0)-(order.paidAmount||0)).toLocaleString('en-IN')}</span></div>` : ''}
        </div>
      </div>

      ${order.notes ? `<div style="padding:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px"><div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Notes</div><div style="font-size:13px;color:#78350f">${order.notes}</div></div>` : ''}

      <!-- Footer -->
      <div style="text-align:center;padding-top:24px;border-top:1px solid #f1f5f9">
        <div style="font-size:12px;color:#94a3b8">Thank you for your business · BioBurg Life Science</div>
      </div>
    </div>
    <script>window.onload=()=>{window.print()}</script>
  </body></html>`)
  win.document.close()
}

/* ═══════════════════════════════════════════════════════ */
export default function Invoices() {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [typeF,    setTypeF]    = useState('all')
  const [search,   setSearch]   = useState('')
  const [viewOrder,setViewOrder]= useState(null)
  const [snack,    setSnack]    = useState({ open: false, msg: '', sev: 'error' })

  const toast = (msg, sev = 'error') => setSnack({ open: true, msg, sev })

  useEffect(() => {
    const load = async () => {
      try {
        const params = {}
        if (typeF !== 'all') params.type = typeF
        const { data } = await axios.get(`${API}/my-orders`, { headers: auth(), params })
        if (data.success) setOrders(data.orders || [])
      } catch { toast('Failed to load invoices') }
      setLoading(false)
    }
    load()
  }, [typeF])

  const filtered = orders.filter(o =>
    !search ||
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.visitArea?.toLowerCase().includes(search.toLowerCase())
  )

  const totalValue = filtered.reduce((s, o) => s + (o.grandTotal || 0), 0)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Invoices
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: 14, mt: 0.5 }}>
          All bills, challans and quotations — click any row to preview & print.
        </Typography>
      </Box>

      {/* Stat strip */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, mb: 3 }}>
        {[
          { label: 'TOTAL INVOICES', value: filtered.length,       color: '#1d4ed8' },
          { label: 'TOTAL VALUE',    value: fmt(totalValue),        color: '#7c3aed' },
          { label: 'THIS VIEW',      value: `${typeF === 'all' ? 'All Types' : TYPE_META[typeF]?.label}`, color: '#0f172a' },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            sx={{ border: '1px solid #e2e8f0', borderTop: `3px solid ${s.color}`, borderRadius: 3, p: 2, bgcolor: 'white' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: s.color, mt: 0.5 }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search order #, customer, area..."
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ bgcolor: 'white', minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={typeF} onChange={e => setTypeF(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="all">All Types</MenuItem>
            {Object.entries(TYPE_META).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', bgcolor: 'white' }}>
        {loading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#1d4ed8' }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>No invoices found.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Invoice #', 'Date', 'Customer', 'Type', 'Items', 'Amount', 'Payment', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(o => {
                  const tm = TYPE_META[o.orderType] || TYPE_META.bill
                  const pm = PAY_META[o.paymentStatus] || PAY_META.pending
                  return (
                    <TableRow key={o._id}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' }, borderBottom: '1px solid #f1f5f9' }}
                      onClick={() => setViewOrder(o)}>
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
                        <Chip label={tm.label} size="small"
                          sx={{ fontSize: 10, height: 20, bgcolor: tm.bg, color: tm.color, fontWeight: 700, border: `1px solid ${tm.border}` }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                        {o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        {fmt(o.grandTotal)}
                      </TableCell>
                      <TableCell>
                        <Chip label={o.paymentStatus} size="small"
                          sx={{ fontSize: 10, height: 20, bgcolor: pm.bg, color: pm.color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button size="small" onClick={() => setViewOrder(o)}
                            sx={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', minWidth: 'auto', px: 1 }}>
                            VIEW
                          </Button>
                          <Button size="small" onClick={() => printInvoice(o)}
                            sx={{ fontSize: 11, fontWeight: 700, color: '#16a34a', minWidth: 'auto', px: 1 }}>
                            PRINT
                          </Button>
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

      {/* ── Invoice Preview Dialog ── */}
      <Dialog open={!!viewOrder} onClose={() => setViewOrder(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        {viewOrder && (() => {
          const tm = TYPE_META[viewOrder.orderType] || TYPE_META.bill
          const pm = PAY_META[viewOrder.paymentStatus] || PAY_META.pending
          const balance = (viewOrder.grandTotal || 0) - (viewOrder.paidAmount || 0)
          return (
            <>
              <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{tm.label}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 0.25 }}>{fmtDate(viewOrder.createdAt)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip label={viewOrder.orderNumber} size="small"
                      sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, bgcolor: tm.bg, color: tm.color, border: `1px solid ${tm.border}` }} />
                    <Chip label={viewOrder.paymentStatus} size="small"
                      sx={{ fontWeight: 700, fontSize: 11, bgcolor: pm.bg, color: pm.color }} />
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent sx={{ pt: 3 }}>
                {/* Customer + Payment grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', mb: 1 }}>BILL TO</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{viewOrder.customerName}</Typography>
                    {viewOrder.customerPhone && <Typography sx={{ fontSize: 13, color: '#475569', mt: 0.5 }}>{viewOrder.customerPhone}</Typography>}
                    {viewOrder.customerAddress && <Typography sx={{ fontSize: 13, color: '#475569', mt: 0.5 }}>{viewOrder.customerAddress}</Typography>}
                    {viewOrder.customerGST && <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 0.5 }}>GST: {viewOrder.customerGST}</Typography>}
                  </Box>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', mb: 1 }}>PAYMENT</Typography>
                    {[
                      ['Mode', viewOrder.paymentMode],
                      ['Status', viewOrder.paymentStatus],
                      viewOrder.visitArea && ['Area', viewOrder.visitArea],
                    ].filter(Boolean).map(([k, v]) => (
                      <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: 12, color: '#64748b' }}>{k}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{v}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Items */}
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        {['Product', 'Qty', 'MRP', 'Rate', 'Total'].map(h => (
                          <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', py: 1.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(viewOrder.items || []).map((it, i) => (
                        <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{it.productName}</Typography>
                            {it.brandName && <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{it.brandName}</Typography>}
                          </TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{it.qty}</TableCell>
                          <TableCell sx={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{fmt(it.mrp)}</TableCell>
                          <TableCell sx={{ fontSize: 13, fontFamily: 'monospace' }}>{fmt(it.price)}</TableCell>
                          <TableCell sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{fmt(it.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                {/* Totals */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Box sx={{ width: 260 }}>
                    {[
                      ['Subtotal', fmt(viewOrder.subtotal)],
                      viewOrder.discountAmt > 0 && [`Discount`, `-${fmt(viewOrder.discountAmt)}`],
                      viewOrder.taxAmt > 0 && [`GST (${viewOrder.taxPercent}%)`, `+${fmt(viewOrder.taxAmt)}`],
                    ].filter(Boolean).map(([k, v]) => (
                      <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography sx={{ fontSize: 13, color: '#64748b' }}>{k}</Typography>
                        <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: k.startsWith('Discount') ? '#dc2626' : '#475569' }}>{v}</Typography>
                      </Box>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Grand Total</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 15, fontFamily: 'monospace', color: tm.color }}>{fmt(viewOrder.grandTotal)}</Typography>
                    </Box>
                    {viewOrder.paidAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
                        <Typography sx={{ fontSize: 13, color: '#16a34a' }}>Paid</Typography>
                        <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: '#16a34a', fontWeight: 700 }}>{fmt(viewOrder.paidAmount)}</Typography>
                      </Box>
                    )}
                    {balance > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
                        <Typography sx={{ fontSize: 13, color: '#dc2626' }}>Balance Due</Typography>
                        <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: '#dc2626', fontWeight: 700 }}>{fmt(balance)}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {viewOrder.notes && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#92400e', mb: 0.5 }}>NOTES</Typography>
                    <Typography sx={{ fontSize: 13, color: '#78350f' }}>{viewOrder.notes}</Typography>
                  </Box>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={() => setViewOrder(null)} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
                <Button variant="outlined" onClick={() => printInvoice(viewOrder)}
                  sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#1d4ed8', color: '#1d4ed8' }}>
                  🖨 Print / Download PDF
                </Button>
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