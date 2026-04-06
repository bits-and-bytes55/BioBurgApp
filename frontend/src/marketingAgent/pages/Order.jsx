import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, TextField, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
  CircularProgress, FormControl, InputLabel, Select, MenuItem,
  Divider, Table, TableBody, TableCell, TableHead, TableRow,
  RadioGroup, FormControlLabel, Radio
} from '@mui/material'
import axios from 'axios'

const BASE       = import.meta.env.VITE_API_BASE_URL;
const API        = `${BASE}/api/sale-orders/agent`
const PRODUCTS_API = `${BASE}/api/agent/products/all`
const getToken   = () => localStorage.getItem('agentToken')
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` })

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const PAYMENT_MODES = ['cash', 'upi', 'credit', 'cheque', 'online', 'other']

export default function CreateOrder() {
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const defaultType  = params.get('type') || 'bill'  // bill | challan | quotation

  const [orderType,  setOrderType]  = useState(defaultType)
  const [products,   setProducts]   = useState([])
  const [loadingProd, setLoadingProd] = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [submitted,  setSubmitted]  = useState(null)
  const [prodSearch, setProdSearch] = useState('')
  const [prodDialog, setProdDialog] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'warning' })

  const toast = (msg, severity = 'warning') => setSnack({ open: true, msg, severity })

  /* form state */
  const [customer, setCustomer] = useState({
    name: '', phone: '', address: '', gst: ''
  })
  const [items,       setItems]       = useState([])
  const [taxPercent,  setTaxPercent]  = useState(0)
  const [discount,    setDiscount]    = useState(0)
  const [paymentMode, setPaymentMode] = useState('cash')
  const [payStatus,   setPayStatus]   = useState('pending')
  const [paidAmount,  setPaidAmount]  = useState(0)
  const [notes,       setNotes]       = useState('')
  const [visitArea,   setVisitArea]   = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(PRODUCTS_API, { headers: authHeader() })
        if (data.success) setProducts(data.products || [])
      } catch { toast('Failed to load products') }
      setLoadingProd(false)
    }
    load()
  }, [])

  /* ── computed totals ── */
  const subtotal    = items.reduce((s, i) => s + i.total, 0)
  const discountAmt = Math.round((subtotal * discount) / 100)
  const taxable     = subtotal - discountAmt
  const taxAmt      = Math.round((taxable * taxPercent) / 100)
  const grandTotal  = taxable + taxAmt

  /* ── add product to items ── */
  const addProduct = (prod) => {
    const exists = items.find(i => i.productId === prod._id)
    if (exists) {
      setItems(items.map(i => i.productId === prod._id
        ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price }
        : i))
    } else {
      setItems([...items, {
        productId:   prod._id,
        productName: prod.name || prod.title || "Unknown Product",
        brandName:   prod.brandName || '',
        category:    prod.category || '',
        mrp:         prod.mrp,
        price:       prod.price,
        qty:         1,
        discount:    0,
        total:       prod.price
      }])
    }
    setProdDialog(false)
    setProdSearch('')
  }

  const updateQty = (idx, qty) => {
    const q = Math.max(1, Number(qty))
    setItems(items.map((it, i) => i === idx ? { ...it, qty: q, total: q * it.price } : it))
  }

  const updateItemPrice = (idx, price) => {
    const p = Math.max(0, Number(price))
    setItems(items.map((it, i) => i === idx ? { ...it, price: p, total: it.qty * p } : it))
  }

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!customer.name.trim()) return toast('Customer name is required')
    if (items.length === 0)    return toast('Add at least one product')

    setSaving(true)
    try {
      const { data } = await axios.post(`${API}/create`, {
        customerName:    customer.name,
        customerPhone:   customer.phone,
        customerAddress: customer.address,
        customerGST:     customer.gst,
        orderType,
        items,
        subtotal, discountAmt, taxAmt, taxPercent, grandTotal,
        paymentMode, paymentStatus: payStatus,
        paidAmount: payStatus === 'paid' ? grandTotal : (payStatus === 'partial' ? paidAmount : 0),
        notes, visitArea
      }, { headers: { ...authHeader(), 'Content-Type': 'application/json' } })

      if (data.success) setSubmitted(data.order)
    } catch (e) { toast(e.response?.data?.message || 'Failed to create order', 'error') }
    setSaving(false)
  }

  const filteredProds = products.filter(p =>
    !prodSearch ||
    p.title?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.brandName?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(prodSearch.toLowerCase())
  )

  const typeLabel = orderType === 'bill' ? 'Tax Invoice' : orderType === 'challan' ? 'Delivery Challan' : 'Quotation'
  const typeColor = orderType === 'bill' ? '#1d4ed8' : orderType === 'challan' ? '#16a34a' : '#7c3aed'

  /* ── SUCCESS SCREEN ── */
  if (submitted) return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 4, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#f0fdf4', border: '3px solid #bbf7d0',
          mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 28, color: '#16a34a' }}>✓</Typography>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#0f172a', mb: 0.5 }}>{typeLabel} Created!</Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b', mb: 3 }}>
          Order <strong style={{ color: typeColor }}>{submitted.orderNumber}</strong> has been saved successfully.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3, textAlign: 'left' }}>
          {[
            { label: 'Customer', value: submitted.customerName },
            { label: 'Amount',   value: fmt(submitted.grandTotal) },
            { label: 'Payment',  value: submitted.paymentMode },
            { label: 'Status',   value: submitted.paymentStatus },
          ].map(x => (
            <Box key={x.label} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{x.label.toUpperCase()}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{x.value}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => navigate('/agent/orders/history')}
            sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#1d4ed8', color: '#1d4ed8' }}>
            View Orders
          </Button>
          <Button variant="contained" onClick={() => { setSubmitted(null); setItems([]); setCustomer({ name: '', phone: '', address: '', gst: '' }) }}
            sx={{ bgcolor: typeColor, '&:hover': { filter: 'brightness(0.9)' }, fontWeight: 700, borderRadius: 2 }}>
            New {typeLabel}
          </Button>
        </Box>
      </Paper>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Create {typeLabel}
            </Typography>
            <Chip label={orderType.toUpperCase()} size="small"
              sx={{ fontSize: 10, height: 22, bgcolor: typeColor + '18', color: typeColor, fontWeight: 700, border: `1px solid ${typeColor}40` }} />
          </Box>
          <Typography sx={{ color: '#64748b', fontSize: 14 }}>Fill in the details below to generate the {orderType}.</Typography>
        </Box>
        {/* Type switcher */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[['bill', 'Bill'], ['challan', 'Challan'], ['quotation', 'Quote']].map(([val, label]) => (
            <Button key={val} size="small" variant={orderType === val ? 'contained' : 'outlined'} onClick={() => setOrderType(val)}
              sx={{ fontWeight: 700, borderRadius: 2, fontSize: 12,
                ...(orderType === val ? { bgcolor: typeColor, '&:hover': { filter: 'brightness(0.9)' } } : { borderColor: '#e2e8f0', color: '#64748b' }) }}>
              {label}
            </Button>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 3 }}>
        {/* Left column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Customer */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#334155', mb: 2, letterSpacing: '0.04em' }}>CUSTOMER DETAILS</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField size="small" label="Customer / Business Name *" fullWidth
                value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
              <TextField size="small" label="Phone" fullWidth
                value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
              <TextField size="small" label="Address / Area" fullWidth
                value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} />
              <TextField size="small" label="GST Number (optional)" fullWidth
                value={customer.gst} onChange={e => setCustomer(c => ({ ...c, gst: e.target.value }))} />
            </Box>
          </Paper>

          {/* Items */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#334155', letterSpacing: '0.04em' }}>ITEMS ({items.length})</Typography>
              <Button size="small" variant="contained" onClick={() => setProdDialog(true)}
                sx={{ bgcolor: typeColor, '&:hover': { filter: 'brightness(0.9)' }, fontWeight: 700, borderRadius: 2, fontSize: 12 }}>
                + ADD PRODUCT
              </Button>
            </Box>

            {items.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: 2 }}>
                <Typography sx={{ color: '#94a3b8', fontSize: 13 }}>No items added yet. Click "Add Product" to begin.</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      {['Product', 'MRP', 'Rate', 'Qty', 'Total', ''].map(h => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', py: 1 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.productName}</Typography>
                          {item.brandName && <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{item.brandName}</Typography>}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{fmt(item.mrp)}</TableCell>
                        <TableCell>
                          <TextField size="small" type="number" value={item.price} sx={{ width: 90 }}
                            onChange={e => updateItemPrice(i, e.target.value)}
                            inputProps={{ min: 0 }} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" type="number" value={item.qty} sx={{ width: 70 }}
                            onChange={e => updateQty(i, e.target.value)}
                            inputProps={{ min: 1 }} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{fmt(item.total)}</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => removeItem(i)} sx={{ color: '#dc2626', minWidth: 'auto', p: '2px 6px', fontSize: 12 }}>✕</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>

          {/* Notes + Visit */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#334155', mb: 2, letterSpacing: '0.04em' }}>ADDITIONAL INFO</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField size="small" label="Visit Area" fullWidth
                value={visitArea} onChange={e => setVisitArea(e.target.value)} />
              <TextField size="small" label="Notes / Remarks" fullWidth multiline
                value={notes} onChange={e => setNotes(e.target.value)} />
            </Box>
          </Paper>
        </Box>

        {/* Right column — summary + payment */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Price summary */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#334155', mb: 2, letterSpacing: '0.04em' }}>PRICE SUMMARY</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: '#64748b' }}>Subtotal</Typography>
                <Typography sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{fmt(subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 13, color: '#64748b', flex: 1 }}>Discount %</Typography>
                <TextField size="small" type="number" sx={{ width: 80 }} value={discount}
                  onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                  inputProps={{ min: 0, max: 100 }} />
                <Typography sx={{ fontSize: 12, color: '#94a3b8', minWidth: 60, textAlign: 'right' }}>-{fmt(discountAmt)}</Typography>
              </Box>
              {orderType === 'bill' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 13, color: '#64748b', flex: 1 }}>GST %</Typography>
                  <TextField size="small" type="number" sx={{ width: 80 }} value={taxPercent}
                    onChange={e => setTaxPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    inputProps={{ min: 0, max: 100 }} />
                  <Typography sx={{ fontSize: 12, color: '#94a3b8', minWidth: 60, textAlign: 'right' }}>+{fmt(taxAmt)}</Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Grand Total</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 15, fontFamily: 'monospace', color: typeColor }}>{fmt(grandTotal)}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Payment */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#334155', mb: 2, letterSpacing: '0.04em' }}>PAYMENT</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select label="Payment Mode" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                  {PAYMENT_MODES.map(m => <MenuItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
              {orderType !== 'challan' && orderType !== 'quotation' && (
                <>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Payment Status</InputLabel>
                    <Select label="Payment Status" value={payStatus} onChange={e => setPayStatus(e.target.value)}>
                      {['pending','partial','paid'].map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {payStatus === 'partial' && (
                    <TextField size="small" type="number" label="Amount Paid (₹)" fullWidth
                      value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} />
                  )}
                </>
              )}
            </Box>
          </Paper>

          {/* Submit */}
          <Button variant="contained" onClick={handleSubmit} disabled={saving || items.length === 0}
            sx={{ bgcolor: typeColor, '&:hover': { filter: 'brightness(0.9)' }, fontWeight: 800,
              py: 1.5, borderRadius: 2, fontSize: 14, boxShadow: `0 4px 14px ${typeColor}35` }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : `SAVE ${typeLabel.toUpperCase()}`}
          </Button>
        </Box>
      </Box>

      {/* ══════════ PRODUCT PICKER ══════════ */}
      <Dialog open={prodDialog} onClose={() => { setProdDialog(false); setProdSearch('') }}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          Select Product
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth size="small" placeholder="Search by name, brand, category..."
            value={prodSearch} onChange={e => setProdSearch(e.target.value)}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          {loadingProd ? (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: '#1d4ed8' }} /></Box>
          ) : filteredProds.length === 0 ? (
            <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 4, fontSize: 14 }}>No products found.</Typography>
          ) : (
            <Box sx={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredProds.map(p => (
                <Box key={p._id} onClick={() => addProduct(p)}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 2, py: 1.5, borderRadius: 2, cursor: 'pointer', border: '1px solid #f1f5f9',
                    '&:hover': { bgcolor: '#eff6ff', border: '1px solid #bfdbfe' } }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.title}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{p.brandName} · {p.category}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: typeColor }}>{fmt(p.price)}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>MRP {fmt(p.mrp)}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setProdDialog(false); setProdSearch('') }} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}