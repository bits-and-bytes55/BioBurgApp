// pages/agent/Invoices.jsx
import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Paper, Chip, CircularProgress,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Alert, Snackbar, useMediaQuery, useTheme
} from '@mui/material'
import axios from 'axios'

const BASE     = import.meta.env.VITE_API_BASE_URL
const API      = `${BASE}/api/sale-orders/agent`
const getToken = () => localStorage.getItem('agentToken')
const auth     = () => ({ Authorization: `Bearer ${getToken()}` })

const fmt      = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

const TYPE_META = {
  bill:      { label:'Tax Invoice',      color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe' },
  challan:   { label:'Delivery Challan', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  quotation: { label:'Quotation',        color:'#7c3aed', bg:'#fdf4ff', border:'#e9d5ff' },
}
const PAY_META = {
  paid:    { color:'#16a34a', bg:'#f0fdf4' },
  partial: { color:'#d97706', bg:'#fffbeb' },
  pending: { color:'#dc2626', bg:'#fef2f2' },
}

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
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#fff;color:#0f172a;padding:40px}@media print{body{padding:20px}}</style>
  </head><body>
    <div style="max-width:720px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid ${meta.border}">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:${meta.color};text-transform:uppercase;margin-bottom:4px">BioBurg Life Science</div>
          <div style="font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${meta.label}</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px">${fmtDate(order.createdAt)}</div>
        </div>
        <div style="text-align:right">
          <div style="display:inline-block;padding:6px 14px;background:${meta.bg};border:1px solid ${meta.border};border-radius:6px;font-size:13px;font-weight:700;color:${meta.color}">${order.orderNumber}</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead><tr style="background:#f8fafc">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Product</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#64748b">MRP</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#64748b">Rate</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#64748b">Amount</th>
        </tr></thead>
        <tbody>${items}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
        <div style="width:260px">
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:800;color:#0f172a;border-top:2px solid #e2e8f0">
            <span>Grand Total</span><span style="color:${meta.color}">₹${Number(order.grandTotal||0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      <div style="text-align:center;padding-top:24px;border-top:1px solid #f1f5f9">
        <div style="font-size:12px;color:#94a3b8">Thank you for your business · BioBurg Life Science</div>
      </div>
    </div>
    <script>window.onload=()=>{window.print()}</script>
  </body></html>`)
  win.document.close()
}

export default function Invoices() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [typeF,     setTypeF]     = useState('all')
  const [search,    setSearch]    = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [snack,     setSnack]     = useState({ open:false, msg:'', sev:'error' })

  const toast = (msg, sev='error') => setSnack({ open:true, msg, sev })

  useEffect(() => {
    const load = async () => {
      try {
        const params = {}
        if (typeF !== 'all') params.type = typeF
        const { data } = await axios.get(`${API}/my-orders`, { headers:auth(), params })
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
    <Box sx={{ minHeight:'100vh', bgcolor:'#f8fafc', p:{ xs:1.5, md:3 } }}>

      {/* Header */}
      <Box sx={{ mb:2.5 }}>
        <Typography variant="h5" sx={{ fontWeight:800, color:'#0f172a', fontSize:{ xs:20, md:26 } }}>
          Invoices
        </Typography>
        <Typography sx={{ color:'#64748b', fontSize:13, mt:0.5, display:{ xs:'none', sm:'block' } }}>
          All bills, challans and quotations.
        </Typography>
      </Box>

      {/* Stat strip */}
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:{ xs:1, md:2 }, mb:2.5 }}>
        {[
          { label:'TOTAL', value:filtered.length, color:'#1d4ed8' },
          { label:'VALUE', value:fmt(totalValue),  color:'#7c3aed' },
          { label:'TYPE',  value:typeF === 'all' ? 'All' : TYPE_META[typeF]?.label, color:'#0f172a' },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            sx={{ border:'1px solid #e2e8f0', borderTop:`3px solid ${s.color}`, borderRadius:2.5, p:{ xs:1.5, md:2 }, bgcolor:'white' }}>
            <Typography sx={{ fontSize:{ xs:9, md:10 }, fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em' }}>{s.label}</Typography>
            <Typography sx={{ fontSize:{ xs:16, md:20 }, fontWeight:800, color:s.color, mt:0.25 }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display:'flex', gap:1.5, mb:2, flexWrap:'wrap' }}>
        <TextField size="small" placeholder="Search order #, customer..."
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ flex:1, minWidth:{ xs:'100%', sm:200 }, bgcolor:'white', '& .MuiOutlinedInput-root':{ borderRadius:2 } }} />
        <FormControl size="small" sx={{ minWidth:{ xs:'100%', sm:150 } }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={typeF} onChange={e => setTypeF(e.target.value)} sx={{ bgcolor:'white', borderRadius:2 }}>
            <MenuItem value="all">All Types</MenuItem>
            {Object.entries(TYPE_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Content */}
      <Paper elevation={0} sx={{ border:'1px solid #e2e8f0', borderRadius:3, overflow:'hidden', bgcolor:'white' }}>
        {loading ? (
          <Box sx={{ py:8, display:'flex', justifyContent:'center' }}><CircularProgress sx={{ color:'#1d4ed8' }} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py:8, textAlign:'center' }}><Typography sx={{ color:'#94a3b8', fontSize:14 }}>No invoices found.</Typography></Box>
        ) : isMobile ? (
          /* ── MOBILE CARD LIST ── */
          <Box>
            {filtered.map(o => {
              const tm = TYPE_META[o.orderType] || TYPE_META.bill
              const pm = PAY_META[o.paymentStatus] || PAY_META.pending
              return (
                <Box key={o._id} sx={{ p:2, borderBottom:'1px solid #f1f5f9' }}
                  onClick={() => setViewOrder(o)}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:0.75 }}>
                    <Box>
                      <Typography sx={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'#1d4ed8' }}>{o.orderNumber}</Typography>
                      <Typography sx={{ fontSize:12, fontWeight:600, color:'#0f172a', mt:0.25 }}>{o.customerName}</Typography>
                      {o.visitArea && <Typography sx={{ fontSize:11, color:'#94a3b8' }}>{o.visitArea}</Typography>}
                    </Box>
                    <Typography sx={{ fontFamily:'monospace', fontWeight:800, fontSize:15, color:'#0f172a' }}>{fmt(o.grandTotal)}</Typography>
                  </Box>
                  <Box sx={{ display:'flex', gap:1, alignItems:'center', flexWrap:'wrap' }}>
                    <Chip label={tm.label} size="small" sx={{ fontSize:9, height:18, bgcolor:tm.bg, color:tm.color, fontWeight:700, border:`1px solid ${tm.border}` }} />
                    <Chip label={o.paymentStatus} size="small" sx={{ fontSize:9, height:18, bgcolor:pm.bg, color:pm.color, fontWeight:700 }} />
                    <Typography sx={{ fontSize:10, color:'#94a3b8', ml:'auto' }}>{fmtDate(o.createdAt)}</Typography>
                  </Box>
                  <Box sx={{ display:'flex', gap:1, mt:1 }}>
                    <Button size="small" onClick={e => { e.stopPropagation(); printInvoice(o) }}
                      sx={{ fontSize:10, fontWeight:700, color:'#16a34a', px:1, py:0.25, minWidth:'auto',
                        border:'1px solid #bbf7d0', borderRadius:1.5, bgcolor:'#f0fdf4' }}>
                      🖨 Print
                    </Button>
                  </Box>
                </Box>
              )
            })}
          </Box>
        ) : (
          /* ── DESKTOP TABLE ── */
          <Box sx={{ overflowX:'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor:'#f8fafc' }}>
                  {['Invoice #','Date','Customer','Type','Items','Amount','Payment','Actions'].map(h => (
                    <TableCell key={h} sx={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', py:1.5, whiteSpace:'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(o => {
                  const tm = TYPE_META[o.orderType] || TYPE_META.bill
                  const pm = PAY_META[o.paymentStatus] || PAY_META.pending
                  return (
                    <TableRow key={o._id} sx={{ cursor:'pointer', '&:hover':{ bgcolor:'#f8fafc' }, borderBottom:'1px solid #f1f5f9' }}
                      onClick={() => setViewOrder(o)}>
                      <TableCell sx={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#1d4ed8' }}>{o.orderNumber}</TableCell>
                      <TableCell sx={{ fontSize:12, color:'#64748b', whiteSpace:'nowrap' }}>{fmtDate(o.createdAt)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{o.customerName}</Typography>
                        {o.visitArea && <Typography sx={{ fontSize:11, color:'#94a3b8' }}>{o.visitArea}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip label={tm.label} size="small" sx={{ fontSize:10, height:20, bgcolor:tm.bg, color:tm.color, fontWeight:700, border:`1px solid ${tm.border}` }} />
                      </TableCell>
                      <TableCell sx={{ fontSize:13, color:'#475569', fontWeight:600 }}>
                        {o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell sx={{ fontFamily:'monospace', fontWeight:700, fontSize:13 }}>{fmt(o.grandTotal)}</TableCell>
                      <TableCell>
                        <Chip label={o.paymentStatus} size="small" sx={{ fontSize:10, height:20, bgcolor:pm.bg, color:pm.color, fontWeight:700 }} />
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Box sx={{ display:'flex', gap:0.5 }}>
                          <Button size="small" onClick={() => setViewOrder(o)} sx={{ fontSize:11, fontWeight:700, color:'#1d4ed8', minWidth:'auto', px:1 }}>VIEW</Button>
                          <Button size="small" onClick={() => printInvoice(o)} sx={{ fontSize:11, fontWeight:700, color:'#16a34a', minWidth:'auto', px:1 }}>PRINT</Button>
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

      {/* Invoice Preview Dialog */}
      <Dialog open={!!viewOrder} onClose={() => setViewOrder(null)} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx:{ borderRadius: isMobile ? 0 : 3 } }}>
        {viewOrder && (() => {
          const tm      = TYPE_META[viewOrder.orderType] || TYPE_META.bill
          const pm      = PAY_META[viewOrder.paymentStatus] || PAY_META.pending
          const balance = (viewOrder.grandTotal || 0) - (viewOrder.paidAmount || 0)
          return (
            <>
              <DialogTitle sx={{ borderBottom:'1px solid #f1f5f9', pb:2 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight:800, fontSize:{ xs:15, md:18 }, color:'#0f172a' }}>{tm.label}</Typography>
                    <Typography sx={{ fontSize:11, color:'#94a3b8', mt:0.25 }}>{fmtDate(viewOrder.createdAt)}</Typography>
                  </Box>
                  <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', justifyContent:'flex-end' }}>
                    <Chip label={viewOrder.orderNumber} size="small"
                      sx={{ fontFamily:'monospace', fontWeight:700, fontSize:11, bgcolor:tm.bg, color:tm.color, border:`1px solid ${tm.border}` }} />
                    <Chip label={viewOrder.paymentStatus} size="small" sx={{ fontWeight:700, fontSize:10, bgcolor:pm.bg, color:pm.color }} />
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ pt:2.5 }}>
                <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', sm:'1fr 1fr' }, gap:2, mb:2.5 }}>
                  <Box sx={{ p:2, bgcolor:'#f8fafc', borderRadius:2 }}>
                    <Typography sx={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', mb:1 }}>BILL TO</Typography>
                    <Typography sx={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>{viewOrder.customerName}</Typography>
                    {viewOrder.customerPhone && <Typography sx={{ fontSize:13, color:'#475569', mt:0.5 }}>{viewOrder.customerPhone}</Typography>}
                    {viewOrder.customerAddress && <Typography sx={{ fontSize:13, color:'#475569', mt:0.5 }}>{viewOrder.customerAddress}</Typography>}
                  </Box>
                  <Box sx={{ p:2, bgcolor:'#f8fafc', borderRadius:2 }}>
                    <Typography sx={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.1em', mb:1 }}>PAYMENT</Typography>
                    {[['Mode', viewOrder.paymentMode], ['Status', viewOrder.paymentStatus]].map(([k, v]) => (
                      <Box key={k} sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                        <Typography sx={{ fontSize:12, color:'#64748b' }}>{k}</Typography>
                        <Typography sx={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{v}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box sx={{ border:'1px solid #e2e8f0', borderRadius:2, overflow:'hidden', mb:2.5 }}>
                  <Box sx={{ overflowX:'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor:'#f8fafc' }}>
                          {['Product','Qty','MRP','Rate','Total'].map(h => (
                            <TableCell key={h} sx={{ fontSize:11, fontWeight:700, color:'#64748b', py:1.5, whiteSpace:'nowrap' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(viewOrder.items || []).map((it, i) => (
                          <TableRow key={i} sx={{ '&:last-child td':{ border:0 } }}>
                            <TableCell>
                              <Typography sx={{ fontSize:13, fontWeight:600 }}>{it.productName}</Typography>
                              {it.brandName && <Typography sx={{ fontSize:11, color:'#94a3b8' }}>{it.brandName}</Typography>}
                            </TableCell>
                            <TableCell sx={{ fontSize:13 }}>{it.qty}</TableCell>
                            <TableCell sx={{ fontSize:12, color:'#94a3b8', fontFamily:'monospace' }}>{fmt(it.mrp)}</TableCell>
                            <TableCell sx={{ fontSize:13, fontFamily:'monospace' }}>{fmt(it.price)}</TableCell>
                            <TableCell sx={{ fontSize:13, fontFamily:'monospace', fontWeight:700 }}>{fmt(it.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>

                <Box sx={{ display:'flex', justifyContent:'flex-end' }}>
                  <Box sx={{ width:260 }}>
                    <Divider sx={{ mb:1 }} />
                    <Box sx={{ display:'flex', justifyContent:'space-between', py:0.5 }}>
                      <Typography sx={{ fontWeight:800, fontSize:14 }}>Grand Total</Typography>
                      <Typography sx={{ fontWeight:800, fontSize:14, fontFamily:'monospace', color:tm.color }}>{fmt(viewOrder.grandTotal)}</Typography>
                    </Box>
                    {viewOrder.paidAmount > 0 && (
                      <Box sx={{ display:'flex', justifyContent:'space-between', pt:0.5 }}>
                        <Typography sx={{ fontSize:13, color:'#16a34a' }}>Paid</Typography>
                        <Typography sx={{ fontSize:13, fontFamily:'monospace', color:'#16a34a', fontWeight:700 }}>{fmt(viewOrder.paidAmount)}</Typography>
                      </Box>
                    )}
                    {balance > 0 && (
                      <Box sx={{ display:'flex', justifyContent:'space-between', pt:0.5 }}>
                        <Typography sx={{ fontSize:13, color:'#dc2626' }}>Balance Due</Typography>
                        <Typography sx={{ fontSize:13, fontFamily:'monospace', color:'#dc2626', fontWeight:700 }}>{fmt(balance)}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px:3, pb:2.5, gap:1 }}>
                <Button onClick={() => setViewOrder(null)} sx={{ color:'#64748b', fontWeight:600 }}>Close</Button>
                <Button variant="outlined" onClick={() => printInvoice(viewOrder)}
                  sx={{ fontWeight:700, borderRadius:2, borderColor:'#1d4ed8', color:'#1d4ed8', fontSize:{ xs:12, md:14 } }}>
                  🖨 Print
                </Button>
              </DialogActions>
            </>
          )
        })()}
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open:false }))}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity={snack.sev} sx={{ borderRadius:2, fontWeight:600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}