// pages/NewDCR.jsx 
import { useState, useEffect } from 'react'
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Stepper, Step, StepLabel, CircularProgress, Alert, FormControl,
  InputLabel, Select, InputAdornment, Divider, Table, TableBody,
  TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Snackbar, IconButton, Tooltip,
} from '@mui/material'
import { CheckCircle, Add, Remove, DeleteOutline, Receipt, Print, Share } from '@mui/icons-material'
import PageShell from './Pageshell'

// Input sanitizers 
const onlyNumbers  = v => v.replace(/[^0-9.]/g, '')
const onlyLetters  = v => v.replace(/[^a-zA-Z\s\-'.]/g, '')
const onlyAlphaNum = v => v.replace(/[^a-zA-Z0-9\s\-'.,/()]/g, '')
const onlyPhone    = v => v.replace(/[^0-9+\-\s]/g, '')
const onlyPin      = v => v.replace(/[^0-9]/g, '').slice(0, 6)

// Options
const STATUS_OPTIONS = [
  'Responded - Positive','Responded - Neutral','Responded - Negative',
  'Not Available','Follow Up Required','No Response','Other',
]
const NEXT_ACTIONS = [
  'None Required','Follow Up Call','Send Samples',
  'Schedule Visit','Send Quotation','Escalate','Other',
]
const PLACE_TYPES = [
  'Hospital','Clinic','Medical Store','Distributor',
  'Diagnostic Centre','Path Lab','Nursing Home','Doctor Chamber',
  'Pharmacy','Corporate Office','School/College','Other',
]
const CONTACT_ROLES = [
  'Doctor','Physician','Chemist','Pharmacist','Manager',
  'Purchase Manager','Receptionist','Nurse','Lab Technician',
  'Owner','Administrator','Other',
]
const PAYMENT_MODES   = ['cash','upi','credit','cheque','online','other']
const PAYMENT_STATUSES = ['pending','partial','paid']

const steps = ['Visit Details', 'Products & Activity', 'Outcome']

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`

// Empty states 
const EMPTY_FORM = {
  placeName:'', placeType:'', placeTypeOther:'',
  state:'', district:'', city:'', pincode:'',
  address:'',contactPerson:'',contactRole:'',
  contactRoleOther:'',phone:'',alternatePhone:'',
  whatsappPhone:'',qualification:'',designation:'',
  dob:'',anniversary:'',
  responseStatus:'', responseStatusOther:'',
  productDiscussed:'', productDiscussedCustom:'',
  remarks:'', nextAction:'', nextActionOther:'',
  followUpDate:'', hasOrder:false, orderValue:'', notes:'',
}
const EMPTY_ERRORS = {
  placeName:'', placeType:'', placeTypeOther:'',
  contactPerson:'', contactRole:'', phone:'',
  responseStatus:'',
  nextAction:'', orderValue:'',
}
const EMPTY_ORDER = {
  customerName:'', customerPhone:'', customerAddress:'', customerGST:'',
  orderType:'challan',
  items:[], taxPercent:0, discount:0,
  paymentMode:'cash', payStatus:'pending', paidAmount:0, notes:'',
}

// Shared label style 
const SectionLabel = ({ children }) => (
  <Typography sx={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'0.08em', mb:1.5, mt:0.5 }}>
    {children}
  </Typography>
)

// DropWithOther component 
function DropWithOther({ label, fieldKey, otherKey, options, required, form, errors, setField }) {
  return (
    <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
      <FormControl
        size="small"
        fullWidth
        error={!!errors[fieldKey]}
        sx={{
          '& .MuiInputBase-root': { fontSize:13, minHeight:40 },
          '& .MuiInputLabel-root': { fontSize:13 },
          '& .MuiSelect-select': { minHeight:'1.4375em !important', py:'8.5px' },
        }}
      >
        <InputLabel>{label}{required ? ' *' : ''}</InputLabel>
        <Select
          label={`${label}${required ? ' *' : ''}`}
          value={form[fieldKey]}
          onChange={e => setField(fieldKey, e.target.value)}
          displayEmpty
        >
          {options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </Select>
        {errors[fieldKey] && (
          <Typography sx={{ fontSize:11, color:'#ef4444', mt:0.5, ml:1 }}>{errors[fieldKey]}</Typography>
        )}
      </FormControl>
      {form[fieldKey] === 'Other' && (
        <TextField
          fullWidth size="small"
          label={`Specify ${label} *`}
          value={form[otherKey] || ''}
          onChange={e => setField(otherKey, onlyAlphaNum(e.target.value))}
          error={!!errors[otherKey]}
          helperText={errors[otherKey] || 'Alphanumeric only'}
          placeholder={`Enter custom ${label.toLowerCase()}…`}
          sx={{ '& .MuiInputBase-root': { fontSize:13 }, '& .MuiInputLabel-root': { fontSize:13 } }}
        />
      )}
    </Box>
  )
}

// Inline mini-order builder (challan/bill/quote) 
function InlineOrderBuilder({ products, prefillCustomer, onOrderCreated }) {
  const [order, setOrder]         = useState({ ...EMPTY_ORDER, customerName: prefillCustomer || '' })
  const [prodSearch, setProdSearch] = useState('')
  const [prodDialog, setProdDialog] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(null)
  const [snack, setSnack]         = useState({ open:false, msg:'', severity:'success' })

  const toast = (msg, severity='success') => setSnack({ open:true, msg, severity })

  const set = (k, v) => setOrder(o => ({ ...o, [k]:v }))

  const subtotal    = order.items.reduce((s,i) => s + i.total, 0)
  const discountAmt = Math.round((subtotal * order.discount) / 100)
  const taxable     = subtotal - discountAmt
  const taxAmt      = Math.round((taxable * order.taxPercent) / 100)
  const grandTotal  = taxable + taxAmt

  const addProduct = prod => {
    const exists = order.items.find(i => i.productId === prod._id)
    if (exists) {
      set('items', order.items.map(i => i.productId === prod._id
        ? { ...i, qty: i.qty + 1, total:(i.qty+1)*i.price } : i))
    } else {
      set('items', [...order.items, {
        productId: prod._id,
        productName: prod.name || prod.title || 'Product',
        brandName: prod.brandName || '',
        mrp: prod.mrp, price: prod.price, qty:1, total: prod.price,
      }])
    }
    setProdDialog(false); setProdSearch('')
  }

  const addManual = () => {
    set('items', [...order.items, {
      productId: 'manual_' + Date.now(),
      productName:'', brandName:'', mrp:0, price:0, qty:1, total:0, isManual:true,
    }])
  }

  const updateItem = (idx, key, val) => {
    set('items', order.items.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, [key]: val }
      if (key === 'qty' || key === 'price') {
        const q = key === 'qty' ? Math.max(1, Number(val)) : it.qty
        const p = key === 'price' ? Math.max(0, Number(val)) : it.price
        return { ...updated, qty:q, price:p, total: q * p }
      }
      return updated
    }))
  }

  const removeItem = idx => set('items', order.items.filter((_,i) => i !== idx))

  const handleSubmit = async () => {
    if (!order.customerName.trim()) return toast('Customer name is required', 'warning')
    if (order.items.length === 0)   return toast('Add at least one product', 'warning')
    setSaving(true)
    try {
      const token = localStorage.getItem('agentToken')
      const res = await fetch(`${BASE}/api/sale-orders/agent/create`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          customerGST: order.customerGST,
          orderType: order.orderType,
          items: order.items,
          subtotal, discountAmt, taxAmt,
          taxPercent: order.taxPercent, grandTotal,
          paymentMode: order.paymentMode,
          paymentStatus: order.payStatus,
          paidAmount: order.payStatus==='paid' ? grandTotal : (order.payStatus==='partial' ? order.paidAmount : 0),
          notes: order.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      setSaved(data.order)
      onOrderCreated && onOrderCreated(data.order)
      toast(`${order.orderType === 'challan' ? 'Challan' : 'Order'} created — ${data.order?.orderNumber}`)
    } catch(e) { toast(e.message, 'error') }
    setSaving(false)
  }

  const handlePrint = () => {
    const el = document.getElementById('dcr-order-print')
    if (!el) return
    const win = window.open('','_blank')
    win.document.write(`<html><head><title>Order</title>
      <style>*{box-sizing:border-box}body{font-family:sans-serif;padding:24px;color:#111}
      table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px 10px;font-size:12px}
      th{background:#f1f5f9;font-weight:700;text-align:left}
      @media print{@page{margin:12mm}}</style>
      </head><body>${el.innerHTML}</body></html>`)
    win.document.close()
    setTimeout(()=>{ win.focus(); win.print(); win.close() }, 400)
  }

  const TYPE_COLORS = { challan:'#16a34a', bill:'#1d4ed8', quotation:'#7c3aed' }
  const tc = TYPE_COLORS[order.orderType] || '#1d4ed8'

  const filteredProds = products.filter(p =>
    !prodSearch ||
    p.title?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.brandName?.toLowerCase().includes(prodSearch.toLowerCase())
  )

  if (saved) return (
    <Box sx={{ p:2, bgcolor:'#f0fdf4', borderRadius:2, border:'1px solid #bbf7d0' }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1 }}>
        <CheckCircle sx={{ color:'#16a34a', fontSize:22 }} />
        <Box>
          <Typography sx={{ fontWeight:700, fontSize:13, color:'#14532d' }}>
            {order.orderType === 'challan' ? 'Delivery Challan' : 'Order'} Created
          </Typography>
          <Typography sx={{ fontSize:11, color:'#166534' }}>#{saved.orderNumber} · {fmt(saved.grandTotal)}</Typography>
        </Box>
        <Box sx={{ ml:'auto', display:'flex', gap:1 }}>
          <Button size="small" startIcon={<Print sx={{ fontSize:14 }}/>} onClick={handlePrint}
            sx={{ fontSize:11, borderColor:'#16a34a', color:'#16a34a' }} variant="outlined">
            Print
          </Button>
          <Button size="small" onClick={()=>setSaved(null)}
            sx={{ fontSize:11, color:'#64748b' }}>
            New
          </Button>
        </Box>
      </Box>
      {/* hidden print area */}
      <Box id="dcr-order-print" sx={{ display:'none' }}>
        <h2 style={{ color: tc }}>{order.orderType.toUpperCase()} — {saved.orderNumber}</h2>
        <p><b>Customer:</b> {saved.customerName} {saved.customerPhone && `· ${saved.customerPhone}`}</p>
        <table>
          <thead><tr><th>Product</th><th>Rate</th><th>Qty</th><th>Total</th></tr></thead>
          <tbody>
            {saved.items?.map((it,i)=>(
              <tr key={i}><td>{it.productName}</td><td>{fmt(it.price)}</td><td>{it.qty}</td><td>{fmt(it.total)}</td></tr>
            ))}
          </tbody>
        </table>
        <p style={{ textAlign:'right', marginTop:12 }}><b>Grand Total: {fmt(saved.grandTotal)}</b></p>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ border:'1px solid #e2e8f0', borderRadius:2, overflow:'hidden' }}>
      {/* Type switcher header */}
      <Box sx={{ bgcolor:'#f8fafc', borderBottom:'1px solid #e2e8f0', p:'10px 14px', display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
        <Typography sx={{ fontSize:12, fontWeight:700, color:'#334155', flex:1 }}>Create Order / Challan</Typography>
        {[['challan','Challan'],['bill','Bill'],['quotation','Quote']].map(([val,lbl])=>(
          <Button key={val} size="small" variant={order.orderType===val?'contained':'outlined'}
            onClick={() => set('orderType',val)}
            sx={{ fontSize:10, fontWeight:700, borderRadius:1.5, py:0.4, minWidth:0,
              ...(order.orderType===val
                ? { bgcolor: TYPE_COLORS[val], '&:hover':{ filter:'brightness(0.9)' } }
                : { borderColor:'#e2e8f0', color:'#64748b' }) }}>
            {lbl}
          </Button>
        ))}
      </Box>

      <Box sx={{ p:2, display:'flex', flexDirection:'column', gap:2 }}>
        {/* Customer */}
        <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1.5 }}>
          <TextField size="small" label="Customer / Business *" fullWidth
            value={order.customerName} onChange={e => set('customerName', e.target.value)} />
          <TextField size="small" label="Phone" fullWidth
            value={order.customerPhone} onChange={e => set('customerPhone', e.target.value)} />
          <TextField size="small" label="Address" fullWidth
            value={order.customerAddress} onChange={e => set('customerAddress', e.target.value)} />
          <TextField size="small" label="GST (optional)" fullWidth
            value={order.customerGST} onChange={e => set('customerGST', e.target.value)} />
        </Box>

        {/* Items */}
        <Box>
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
            <Typography sx={{ fontSize:11, fontWeight:700, color:'#64748b' }}>
              ITEMS ({order.items.length})
            </Typography>
            <Box sx={{ display:'flex', gap:1 }}>
              <Button size="small" onClick={addManual}
                sx={{ fontSize:10, color:'#64748b', borderColor:'#e2e8f0' }} variant="outlined">
                + Manual
              </Button>
              {products.length > 0 && (
                <Button size="small" onClick={() => setProdDialog(true)}
                  sx={{ fontSize:10, bgcolor: tc, color:'#fff', '&:hover':{ filter:'brightness(0.9)' } }} variant="contained">
                  + From Catalog
                </Button>
              )}
            </Box>
          </Box>

          {order.items.length === 0 ? (
            <Box sx={{ py:3, textAlign:'center', border:'2px dashed #e2e8f0', borderRadius:2 }}>
              <Typography sx={{ color:'#94a3b8', fontSize:12 }}>No items added. Use buttons above.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX:'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor:'#f8fafc' }}>
                    {['Product','Rate (₹)','Qty','Total',''].map(h=>(
                      <TableCell key={h} sx={{ fontSize:10, fontWeight:700, color:'#64748b', py:0.8, whiteSpace:'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item,i)=>(
                    <TableRow key={i}>
                      <TableCell>
                        {item.isManual ? (
                          <TextField size="small" placeholder="Product name" value={item.productName}
                            onChange={e => updateItem(i,'productName',e.target.value)}
                            sx={{ minWidth:120 }} inputProps={{ style:{ fontSize:12 } }} />
                        ) : (
                          <Box>
                            <Typography sx={{ fontSize:12, fontWeight:600 }}>{item.productName}</Typography>
                            {item.brandName && <Typography sx={{ fontSize:10, color:'#94a3b8' }}>{item.brandName}</Typography>}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField size="small" type="number" value={item.price}
                          onChange={e => updateItem(i,'price',e.target.value)}
                          sx={{ width:80 }} inputProps={{ min:0, style:{ fontSize:12 } }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                          <IconButton size="small" onClick={() => updateItem(i,'qty', Math.max(1,item.qty-1))}>
                            <Remove sx={{ fontSize:14 }} />
                          </IconButton>
                          <Typography sx={{ fontSize:12, fontWeight:700, minWidth:20, textAlign:'center' }}>{item.qty}</Typography>
                          <IconButton size="small" onClick={() => updateItem(i,'qty', item.qty+1)}>
                            <Add sx={{ fontSize:14 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight:700, fontSize:12 }}>{fmt(item.total)}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => removeItem(i)} sx={{ color:'#dc2626' }}>
                          <DeleteOutline sx={{ fontSize:16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>

        {/* Totals + payment */}
        {order.items.length > 0 && (
          <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
            {/* Left: discount + tax */}
            <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Typography sx={{ fontSize:11, color:'#64748b', minWidth:80 }}>Discount %</Typography>
                <TextField size="small" type="number" value={order.discount} sx={{ width:70 }}
                  onChange={e => set('discount', Math.min(100,Math.max(0,Number(e.target.value))))}
                  inputProps={{ min:0, max:100, style:{fontSize:11} }} />
                <Typography sx={{ fontSize:11, color:'#94a3b8' }}>−{fmt(discountAmt)}</Typography>
              </Box>
              {order.orderType === 'bill' && (
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Typography sx={{ fontSize:11, color:'#64748b', minWidth:80 }}>GST %</Typography>
                  <TextField size="small" type="number" value={order.taxPercent} sx={{ width:70 }}
                    onChange={e => set('taxPercent', Math.min(100,Math.max(0,Number(e.target.value))))}
                    inputProps={{ min:0, max:100, style:{fontSize:11} }} />
                  <Typography sx={{ fontSize:11, color:'#94a3b8' }}>+{fmt(taxAmt)}</Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                <Typography sx={{ fontWeight:700, fontSize:13 }}>Total</Typography>
                <Typography sx={{ fontWeight:800, fontSize:14, color: tc }}>{fmt(grandTotal)}</Typography>
              </Box>
            </Box>

            {/* Right: payment */}
            <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize:11 }}>Payment Mode</InputLabel>
                <Select label="Payment Mode" value={order.paymentMode}
                  onChange={e => set('paymentMode', e.target.value)}
                  sx={{ fontSize:11 }}>
                  {PAYMENT_MODES.map(m=><MenuItem key={m} value={m} sx={{ fontSize:12 }}>{m.charAt(0).toUpperCase()+m.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
              {order.orderType === 'bill' && (
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ fontSize:11 }}>Payment Status</InputLabel>
                  <Select label="Payment Status" value={order.payStatus}
                    onChange={e => set('payStatus', e.target.value)}
                    sx={{ fontSize:11 }}>
                    {PAYMENT_STATUSES.map(s=><MenuItem key={s} value={s} sx={{ fontSize:12 }}>{s.charAt(0).toUpperCase()+s.slice(1)}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
              {order.payStatus === 'partial' && (
                <TextField size="small" label="Amount Paid (₹)" type="number" fullWidth
                  value={order.paidAmount} onChange={e => set('paidAmount', Number(e.target.value))}
                  inputProps={{ style:{fontSize:11} }} />
              )}
            </Box>
          </Box>
        )}

        <Button variant="contained" onClick={handleSubmit} disabled={saving || order.items.length === 0}
          startIcon={saving ? <CircularProgress size={14} color="inherit"/> : <Receipt sx={{ fontSize:16 }}/>}
          sx={{ bgcolor: tc, '&:hover':{ filter:'brightness(0.9)' }, fontWeight:700, borderRadius:2, fontSize:13 }}>
          {saving ? 'Creating…' : `Save ${order.orderType === 'challan' ? 'Challan' : order.orderType === 'bill' ? 'Invoice' : 'Quotation'}`}
        </Button>
      </Box>

      {/* Product picker dialog */}
      <Dialog open={prodDialog} onClose={()=>{ setProdDialog(false); setProdSearch('') }}
        maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle sx={{ fontWeight:800, fontSize:15, borderBottom:'1px solid #f1f5f9', pb:2 }}>
          Select Product
        </DialogTitle>
        <DialogContent sx={{ pt:2 }}>
          <TextField fullWidth size="small" placeholder="Search by name or brand…"
            value={prodSearch} onChange={e => setProdSearch(e.target.value)} sx={{ mb:2 }} />
          <Box sx={{ maxHeight:300, overflowY:'auto', display:'flex', flexDirection:'column', gap:1 }}>
            {filteredProds.length === 0
              ? <Typography sx={{ color:'#94a3b8', textAlign:'center', py:3, fontSize:13 }}>No products found.</Typography>
              : filteredProds.map(p=>(
                <Box key={p._id} onClick={() => addProduct(p)}
                  sx={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    px:2, py:1.5, borderRadius:2, cursor:'pointer', border:'1px solid #f1f5f9',
                    '&:hover':{ bgcolor:'#eff6ff', border:'1px solid #bfdbfe' } }}>
                  <Box>
                    <Typography sx={{ fontSize:13, fontWeight:600 }}>{p.title}</Typography>
                    <Typography sx={{ fontSize:11, color:'#94a3b8' }}>{p.brandName}</Typography>
                  </Box>
                  <Typography sx={{ fontFamily:'monospace', fontWeight:700, fontSize:13, color: tc }}>{fmt(p.price)}</Typography>
                </Box>
              ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2 }}>
          <Button onClick={()=>{ setProdDialog(false); setProdSearch('') }} sx={{ color:'#64748b', fontWeight:600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000}
        onClose={()=>setSnack(s=>({...s,open:false}))}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius:2, fontWeight:600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}

export default function NewDCR() {
  const [step,     setStep]     = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [submitted,setSubmitted]= useState(false)
  const [products, setProducts] = useState([])
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [errors,   setErrors]   = useState(EMPTY_ERRORS)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [pinLoading,    setPinLoading]    = useState(false)
  const [pastCustomers, setPastCustomers] = useState([])   
  const [custSuggestions, setCustSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('agentToken')
    fetch(`${BASE}/api/agent/products`, {
      headers:{ Authorization:`Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.products) })
      .catch(() => {})
  }, [])

  useEffect(() => {
  const token = localStorage.getItem('agentToken')
  fetch(`${BASE}/api/agent/responses`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => r.json())
    .then(d => {
      if (d.success) {
        // Deduplicate by contactPerson + phone
        const seen = new Set()
        const unique = []
        d.responses.forEach(r => {
          const key = `${r.contactPerson}__${r.phone || ''}`
          if (!seen.has(key)) {
            seen.add(key)
            unique.push({
              contactPerson: r.contactPerson,
              contactRole:   r.contactRole   || '',
              phone:         r.phone         || '',
              placeName:     r.placeName     || '',
              placeType:     r.placeType     || '',
              state:         r.state         || '',
              district:      r.district      || '',
              city:          r.city          || '',
              pincode:       r.pincode       || '',
              address:       r.address       || '',
              designation:   r.designation   || '',
              dob:           r.dob           || '',
              anniversary:   r.anniversary   || '',
            })
          }
        })
        setPastCustomers(unique)
      }
    })
    .catch(() => {})
}, [])

  const setField = (key, value) => {
    setForm(p => ({ ...p, [key]:value }))
    setErrors(e => ({ ...e, [key]:'' }))
  }

  // Validation 
  const validateStep = s => {
    const errs = { ...EMPTY_ERRORS }; let ok = true

    if (s === 0) {
      if (!form.placeName.trim())  { errs.placeName = 'Required'; ok = false }
      if (!form.placeType)         { errs.placeType = 'Required'; ok = false }
      if (form.placeType === 'Other' && !form.placeTypeOther.trim()) { errs.placeTypeOther = 'Please specify'; ok = false }
      if (!form.contactPerson.trim()) { errs.contactPerson = 'Required'; ok = false }
      if (!form.contactRole)       { errs.contactRole = 'Required'; ok = false }
      if (form.phone && !/^\d{7,15}$/.test(form.phone.replace(/[\s+-]/g, ''))) {
        errs.phone = 'Invalid phone number'; ok = false
      }
    }

    if (s === 1) {
      if (!form.responseStatus)    { errs.responseStatus = 'Required'; ok = false }
      if (form.responseStatus === 'Other' && !form.responseStatusOther.trim()) { errs.responseStatusOther = 'Please specify'; ok = false }
    }

    if (s === 2) {
      if (!form.nextAction)        { errs.nextAction = 'Required'; ok = false }
      if (form.nextAction === 'Other' && !form.nextActionOther.trim()) { errs.nextActionOther = 'Please specify'; ok = false }
      if (form.hasOrder && !form.orderValue) { errs.orderValue = 'Required'; ok = false }
      if (form.hasOrder && form.orderValue && isNaN(parseFloat(form.orderValue))) { errs.orderValue = 'Must be a number'; ok = false }
    }

    setErrors(errs); return ok
  }
const handleSubmit = async () => {
  setLoading(true); setError('')
  try {
    const token = localStorage.getItem('agentToken')
    
    const payload = {
      placeName:        form.placeName,
      placeType:        form.placeType === 'Other' ? (form.placeTypeOther || 'Other') : form.placeType,
      address:          [form.address, form.city, form.district, form.state, form.pincode].filter(Boolean).join(', '),
      state:            form.state,
      district:         form.district,
      city:             form.city,
      pincode:          form.pincode,
      contactPerson:    form.contactPerson,
      contactRole:      form.contactRole === 'Other' ? (form.contactRoleOther || 'Other') : form.contactRole,
      phone:            form.phone,
      responseStatus:   form.responseStatus === 'Other' ? (form.responseStatusOther || 'Other') : form.responseStatus,
      productDiscussed: form.productDiscussed === '__other__' ? (form.productDiscussedCustom || 'Other') : form.productDiscussed,
      remarks:          form.remarks,
      nextAction:       form.nextAction === 'Other' ? (form.nextActionOther || 'Other') : form.nextAction,
      followUpDate:     form.followUpDate,
      hasOrder:         form.hasOrder,
      orderValue:       form.orderValue,
      linkedOrderId:    createdOrder?._id || null,
      alternatePhone:   form.alternatePhone,
      whatsappPhone:    form.whatsappPhone,
      qualification:    form.qualification,
    }

    console.log('Token:', token)
    console.log('Payload being sent:', payload)

    const res = await fetch(`${BASE}/api/agent/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })

    console.log('Response status:', res.status)
    const data = await res.json()
    console.log('Response data:', data)

    if (!res.ok) throw new Error(data.message || 'Submission failed')
    setSubmitted(true)

  } catch(err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
  const handleNext = () => {
    if (!validateStep(step)) return
    setError('')
    if (step === 2) { handleSubmit(); return }
    setStep(p => p + 1)
  }

  const reset = () => {
    setStep(0); setSubmitted(false); setError('')
    setForm(EMPTY_FORM); setErrors(EMPTY_ERRORS); setCreatedOrder(null)
  }

  //  Shared field props 
  const fieldSx = { '& .MuiInputBase-root': { fontSize:13 }, '& .MuiInputLabel-root': { fontSize:13 } }

  const handlePincodeChange = async (pin) => {
  setField('pincode', onlyPin(pin))
  if (pin.length !== 6) return
  setPinLoading(true)
  try {
    const res  = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
    const data = await res.json()
    if (data[0]?.Status === 'Success') {
      const po = data[0].PostOffice[0]
      setField('state',    po.State)
      setField('district', po.District)
      setField('city',     po.Division || po.Block || po.Taluk || '')
    }
  } catch (_) {}
  setPinLoading(false)
}

const handleContactSearch = (val) => {
  setField('contactPerson', onlyLetters(val))
  if (val.length >= 2) {
    const matches = pastCustomers.filter(c =>
      c.contactPerson.toLowerCase().includes(val.toLowerCase()) ||
      c.placeName.toLowerCase().includes(val.toLowerCase())
    )
    setCustSuggestions(matches.slice(0, 6))
    setShowSuggestions(matches.length > 0)
  } else {
    setShowSuggestions(false)
  }
}

const fillFromCustomer = (c) => {
  setForm(f => ({
    ...f,
    contactPerson:  c.contactPerson,
    contactRole:    c.contactRole   || '',
    phone:          c.phone         || '',
    placeName:      c.placeName     || '',
    placeType:      c.placeType     || '',
    state:          c.state         || '',
    district:       c.district      || '',
    city:           c.city          || '',
    pincode:        c.pincode       || '',
    address:        c.address       || '',
    designation:    c.designation   || '',
    dob:            c.dob           || '',
    anniversary:    c.anniversary   || '',
    alternatePhone: c.alternatePhone || '',
    whatsappPhone:  c.whatsappPhone  || '',
    qualification:  c.qualification  || '',
    // keep these at their current values:
    followUpDate:   f.followUpDate  || '',
    notes:          f.notes         || '',
  }))
  setShowSuggestions(false)
}
  return (
    <PageShell
      title="New DCR Entry"
      subtitle="Daily Call Report — record today's field visit"
      breadcrumb={[{ label:'Field Work' },{ label:'Daily Call Report' },{ label:'New Entry' }]}
    >
      <Paper elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:3, overflow:'hidden' }}>

        {/* Stepper */}
        <Box sx={{ p:3, bgcolor:'background.default', borderBottom:'1px solid', borderColor:'divider' }}>
          <Stepper activeStep={step} alternativeLabel>
            {steps.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>
        </Box>

        <Box sx={{ p:3 }}>
          {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

          {submitted ? (
            <Box sx={{ textAlign:'center', py:4 }}>
              <CheckCircle sx={{ fontSize:56, color:'success.main', mb:2 }} />
              <Typography variant="h6" sx={{ fontWeight:700, color:'success.main' }}>
                DCR Submitted Successfully
              </Typography>
              <Typography sx={{ color:'text.secondary', mt:1 }}>
                Your response has been saved and will appear on the Responses page.
              </Typography>
              {createdOrder && (
                <Chip label={`Linked Order: ${createdOrder.orderNumber}`}
                  sx={{ mt:1.5, bgcolor:'#eff6ff', color:'#1d4ed8', fontWeight:700 }} />
              )}
              <Button variant="contained" sx={{ mt:3 }} onClick={reset}>Log Another</Button>
            </Box>
          ) : (
            <>
              {/* ══ STEP 0: Visit Details ══ */}
              {step === 0 && (
  <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>

    <SectionLabel>PLACE INFORMATION</SectionLabel>

    {/* Row 1: Place Name + Place Type */}
    <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
      <TextField
        fullWidth label="Organisation / Place Name *" size="small" sx={fieldSx}
        value={form.placeName}
        onChange={e => setField('placeName', onlyAlphaNum(e.target.value))}
        error={!!errors.placeName}
        helperText={errors.placeName || 'Clinic / Hospital / Organisation name'}
      />
      <FormControl size="small" fullWidth error={!!errors.placeType} sx={fieldSx}>
        <InputLabel>Place Type *</InputLabel>
        <Select label="Place Type *" value={form.placeType}
          onChange={e => setField('placeType', e.target.value)}>
          {PLACE_TYPES.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </Select>
        {errors.placeType && (
          <Typography sx={{ fontSize:11, color:'#ef4444', mt:0.5, ml:1 }}>{errors.placeType}</Typography>
        )}
      </FormControl>
    </Box>

    {form.placeType === 'Other' && (
      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
        <TextField fullWidth size="small" label="Specify Place Type *" sx={fieldSx}
          value={form.placeTypeOther || ''}
          onChange={e => setField('placeTypeOther', onlyAlphaNum(e.target.value))}
          error={!!errors.placeTypeOther}
          helperText={errors.placeTypeOther || 'Alphanumeric only'} />
        <Box />
      </Box>
    )}

    {/* Row 2: Pincode FIRST → auto-fills State, District, City */}
    <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
      <TextField
        fullWidth label="Pincode" size="small" sx={fieldSx}
        value={form.pincode}
        onChange={e => handlePincodeChange(e.target.value)}
        helperText={pinLoading ? '⏳ Fetching location…' : 'Enter 6-digit pincode to auto-fill below'}
        inputProps={{ inputMode:'numeric', maxLength:6 }}
        InputProps={pinLoading ? { endAdornment: <CircularProgress size={14} /> } : {}}
      />
      <Box />
    </Box>

    {/* Row 3: State + District (auto-filled) */}
    <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
      <TextField fullWidth label="State" size="small" sx={fieldSx}
        value={form.state}
        onChange={e => setField('state', onlyLetters(e.target.value))}
        helperText="Auto-filled · edit if needed" />
      <TextField fullWidth label="District" size="small" sx={fieldSx}
        value={form.district}
        onChange={e => setField('district', onlyLetters(e.target.value))}
        helperText="Auto-filled · edit if needed" />
    </Box>

    {/* Row 4: City + Address */}
    <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
      <TextField fullWidth label="Tehsil / City" size="small" sx={fieldSx}
        value={form.city}
        onChange={e => setField('city', onlyLetters(e.target.value))}
        helperText="Auto-filled · edit if needed" />
      <TextField fullWidth label="Address / Area / Landmark" size="small" sx={fieldSx}
        value={form.address}
        onChange={e => setField('address', onlyAlphaNum(e.target.value))}
        helperText="Building, street, landmark" />
    </Box>

    <SectionLabel>CONTACT DETAILS</SectionLabel>

    {/* Contact Person with past-customer suggestions */}
    <Box sx={{ position:'relative' }}>
      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
        <Box sx={{ position:'relative' }}>
          <TextField
            fullWidth label="Contact Person *" size="small" sx={fieldSx}
            value={form.contactPerson}
            onChange={e => handleContactSearch(e.target.value)}
            onFocus={() => form.contactPerson.length >= 2 && setShowSuggestions(custSuggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
            error={!!errors.contactPerson}
            helperText={errors.contactPerson || 'Type to search past customers'}
          />
          {/* Suggestions dropdown */}
          {showSuggestions && (
            <Paper elevation={4} sx={{
              position:'absolute', top:'100%', left:0, right:0, zIndex:999,
              border:'1px solid #e2e8f0', borderRadius:2, overflow:'hidden', mt:0.5,
              maxHeight:220, overflowY:'auto',
            }}>
              <Box sx={{ px:1.5, py:0.75, bgcolor:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                <Typography sx={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em' }}>
                  PAST CUSTOMERS — click to auto-fill
                </Typography>
              </Box>
              {custSuggestions.map((c, i) => (
                <Box key={i} onMouseDown={() => fillFromCustomer(c)}
                  sx={{
                    px:2, py:1.25, cursor:'pointer', borderBottom:'1px solid #f8fafc',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    '&:hover':{ bgcolor:'#eff6ff' },
                  }}>
                  <Box>
                    <Typography sx={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{c.contactPerson}</Typography>
                    <Typography sx={{ fontSize:11, color:'#64748b' }}>
                      {c.placeName}{c.contactRole ? ` · ${c.contactRole}` : ''}
                    </Typography>
                  </Box>
                  {c.phone && (
                    <Typography sx={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace' }}>{c.phone}</Typography>
                  )}
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        <FormControl size="small" fullWidth error={!!errors.contactRole} sx={fieldSx}>
          <InputLabel>Contact Role *</InputLabel>
          <Select label="Contact Role *" value={form.contactRole}
            onChange={e => setField('contactRole', e.target.value)}>
            {CONTACT_ROLES.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </Select>
          {errors.contactRole && (
            <Typography sx={{ fontSize:11, color:'#ef4444', mt:0.5, ml:1 }}>{errors.contactRole}</Typography>
          )}
        </FormControl>
      </Box>
    </Box>

    {form.contactRole === 'Other' && (
      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
        <TextField fullWidth size="small" label="Specify Contact Role *" sx={fieldSx}
          value={form.contactRoleOther || ''}
          onChange={e => setField('contactRoleOther', onlyAlphaNum(e.target.value))}
          error={!!errors.contactRoleOther}
          helperText={errors.contactRoleOther || 'Alphanumeric only'} />
        <Box />
      </Box>
    )}

    {/* Phone + Designation */}
    {/* Phone + Alternate Phone */}
<Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
  <TextField
    fullWidth
    label="Primary Phone"
    size="small"
    sx={fieldSx}
    value={form.phone}
    onChange={e => setField('phone', onlyPhone(e.target.value))}
    error={!!errors.phone}
    helperText={errors.phone || 'Numbers only'}
    inputProps={{
      inputMode:'numeric',
      pattern:'[0-9+\\-\\s]*',
      maxLength:15,
    }}
  />

  <TextField
    fullWidth
    label="Alternate Phone Number"
    size="small"
    sx={fieldSx}
    value={form.alternatePhone || ''}
    onChange={e => setField('alternatePhone', onlyPhone(e.target.value))}
    helperText="Optional alternate contact number"
    inputProps={{
      inputMode:'numeric',
      pattern:'[0-9+\\-\\s]*',
      maxLength:15,
    }}
  />
</Box>

{/* WhatsApp + Qualification */}
<Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
  <TextField
    fullWidth
    label="WhatsApp Number"
    size="small"
    sx={fieldSx}
    value={form.whatsappPhone || ''}
    onChange={e => setField('whatsappPhone', onlyPhone(e.target.value))}
    helperText="WhatsApp contact number"
    inputProps={{
      inputMode:'numeric',
      pattern:'[0-9+\\-\\s]*',
      maxLength:15,
    }}
  />

  <TextField
    fullWidth
    label="Degree / Qualification"
    size="small"
    sx={fieldSx}
    value={form.qualification || ''}
    onChange={e => setField('qualification', onlyAlphaNum(e.target.value))}
    helperText="e.g. MBBS, MD, B.Pharm, MBA"
  />
</Box>

{/* Designation */}
<Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
  <TextField
    fullWidth
    label="Designation"
    size="small"
    sx={fieldSx}
    value={form.designation || ''}
    onChange={e => setField('designation', onlyAlphaNum(e.target.value))}
    helperText="e.g. Senior Doctor, Purchase Manager"
  />

  <Box />
</Box>
    {/* DOB + Anniversary */}
    <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
      <TextField fullWidth label="Date of Birth" size="small" type="date" sx={fieldSx}
        InputLabelProps={{ shrink:true }}
        value={form.dob || ''}
        onChange={e => setField('dob', e.target.value)}
        helperText="Contact's birthday (optional)"
        inputProps={{ max: new Date().toISOString().split('T')[0] }} />
      <TextField fullWidth label="Anniversary Date" size="small" type="date" sx={fieldSx}
        InputLabelProps={{ shrink:true }}
        value={form.anniversary || ''}
        onChange={e => setField('anniversary', e.target.value)}
        helperText="Work / personal anniversary (optional)" />
    </Box>

  </Box>
)}


              {/* ══ STEP 1: Products & Activity ══ */}
{step === 1 && (
  <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>

    <SectionLabel>PRODUCT DISCUSSED</SectionLabel>

    {/* Row 1: Product + Response Status */}
    <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
      <Box>
        {products.length > 0 ? (
          <FormControl size="small" fullWidth sx={fieldSx}>
            <InputLabel>Product / Service</InputLabel>
            <Select
              label="Product / Service"
              value={form.productDiscussed}
              onChange={e => setField('productDiscussed', e.target.value)}
            >
              <MenuItem value="">— None —</MenuItem>
              {products.map(p => (
                <MenuItem key={p._id} value={p.title}>{p.title}</MenuItem>
              ))}
              <MenuItem value="__other__">Other (type manually)</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <TextField
            fullWidth label="Product / Service Discussed" size="small" sx={fieldSx}
            value={form.productDiscussed}
            onChange={e => setField('productDiscussed', onlyAlphaNum(e.target.value))}
            helperText="Alphanumeric only"
          />
        )}
        {form.productDiscussed === '__other__' && (
          <TextField
            fullWidth size="small" label="Product Name *" sx={{ mt:1, ...fieldSx }}
            value={form.productDiscussedCustom || ''}
            onChange={e => setField('productDiscussedCustom', onlyAlphaNum(e.target.value))}
            helperText="Alphanumeric only"
          />
        )}
      </Box>

      <FormControl size="small" fullWidth error={!!errors.responseStatus} sx={fieldSx}>
        <InputLabel>Response Status *</InputLabel>
        <Select
          label="Response Status *"
          value={form.responseStatus}
          onChange={e => setField('responseStatus', e.target.value)}
        >
          {STATUS_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </Select>
        {errors.responseStatus && (
          <Typography sx={{ fontSize:11, color:'#ef4444', mt:0.5, ml:1 }}>{errors.responseStatus}</Typography>
        )}
      </FormControl>
    </Box>

    {form.responseStatus === 'Other' && (
      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
        <Box />
        <TextField
          fullWidth size="small" label="Specify Response Status *" sx={fieldSx}
          value={form.responseStatusOther || ''}
          onChange={e => setField('responseStatusOther', onlyAlphaNum(e.target.value))}
          error={!!errors.responseStatusOther}
          helperText={errors.responseStatusOther || 'Alphanumeric only'}
        />
      </Box>
    )}

    {/* Remarks */}
    <TextField
      fullWidth multiline rows={3} label="Remarks / Feedback" size="small" sx={fieldSx}
      value={form.remarks}
      onChange={e => setField('remarks', e.target.value)}
      helperText="Observations or feedback from the contact"
    />

    {/* Inline order / challan */}
    <SectionLabel>CREATE ORDER / CHALLAN (optional)</SectionLabel>
    <InlineOrderBuilder
      products={products}
      prefillCustomer={form.contactPerson}
      onOrderCreated={ord => setCreatedOrder(ord)}
    />
    {createdOrder && (
      <Typography sx={{ fontSize:11, color:'#16a34a', mt:1, fontWeight:600 }}>
        ✓ Order {createdOrder.orderNumber} will be linked to this DCR on submit.
      </Typography>
    )}

  </Box>
)}

              {/* ══ STEP 2: Outcome ══ */}
              {step === 2 && (
  <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>

    <SectionLabel>NEXT STEPS</SectionLabel>

    {/* Row 1: Next Action + Follow-up Date */}
    <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
      <FormControl size="small" fullWidth error={!!errors.nextAction} sx={fieldSx}>
        <InputLabel>Next Action *</InputLabel>
        <Select label="Next Action *" value={form.nextAction}
          onChange={e => setField('nextAction', e.target.value)}>
          {NEXT_ACTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </Select>
        {errors.nextAction && <Typography sx={{ fontSize:11, color:'#ef4444', mt:0.5, ml:1 }}>{errors.nextAction}</Typography>}
      </FormControl>
      <TextField fullWidth label="Follow-up Date" size="small" type="date" sx={fieldSx}
        InputLabelProps={{ shrink:true }}
        value={form.followUpDate || ''}
        onChange={e => setField('followUpDate', e.target.value)}
        inputProps={{ min: new Date().toISOString().split('T')[0] }} />
    </Box>

    {form.nextAction === 'Other' && (
      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
        <TextField fullWidth size="small" label="Specify Next Action *" sx={fieldSx}
          value={form.nextActionOther || ''}
          onChange={e => setField('nextActionOther', onlyAlphaNum(e.target.value))}
          error={!!errors.nextActionOther}
          helperText={errors.nextActionOther || 'Alphanumeric only'} />
        <Box />
      </Box>
    )}

    <TextField fullWidth multiline rows={2} label="Additional Notes" size="small" sx={fieldSx}
      value={form.notes}
      onChange={e => setField('notes', e.target.value)} />

    {/* Order placed toggle */}
    <Box onClick={() => setField('hasOrder', !form.hasOrder)}
      sx={{
        display:'flex', alignItems:'center', gap:1.5, p:2,
        cursor:'pointer', borderRadius:2,
        bgcolor: form.hasOrder ? '#f5f3ff' : '#f8fafc',
        border:`1px solid ${form.hasOrder ? '#ddd6fe' : '#e2e8f0'}`,
        transition:'all 0.2s',
        '&:hover':{ borderColor: form.hasOrder ? '#a78bfa' : '#cbd5e1' }
      }}>
      <Box sx={{
        width:20, height:20, borderRadius:1, flexShrink:0,
        border:`2px solid ${form.hasOrder ? '#7c3aed' : '#cbd5e1'}`,
        bgcolor: form.hasOrder ? '#7c3aed' : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s'
      }}>
        {form.hasOrder && <Box sx={{ width:8, height:8, bgcolor:'white', borderRadius:0.5 }} />}
      </Box>
      <Box>
        <Typography sx={{ fontSize:13, fontWeight:600, color: form.hasOrder ? '#5b21b6' : '#475569' }}>
          Order placed / received at this visit
        </Typography>
        <Typography sx={{ fontSize:11, color:'#94a3b8' }}>
          {createdOrder
            ? `Linked: ${createdOrder.orderNumber} · ${fmt(createdOrder.grandTotal)}`
            : 'Check if a purchase order was confirmed'}
        </Typography>
      </Box>
    </Box>

    {form.hasOrder && !createdOrder && (
      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
        <TextField fullWidth label="Order Value (₹) *" size="small" sx={fieldSx}
          value={form.orderValue}
          onChange={e => setField('orderValue', onlyNumbers(e.target.value))}
          error={!!errors.orderValue}
          helperText={errors.orderValue || 'Numbers only'}
          inputProps={{ inputMode:'decimal', pattern:'[0-9.]*' }}
          InputProps={{ startAdornment:<InputAdornment position="start">₹</InputAdornment> }} />
        <Box />
      </Box>
    )}

  </Box>
)}

              {/* Navigation */}
              <Box sx={{ mt:3, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Button
                  variant="outlined"
                  disabled={step === 0 || loading}
                  onClick={() => { setError(''); setStep(p => p - 1) }}
                  sx={{ borderRadius:2 }}
                >
                  ← Back
                </Button>
                <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                  <Typography sx={{ fontSize:12, color:'#94a3b8' }}>Step {step+1} of {steps.length}</Typography>
                  <Button
                    variant="contained"
                    color={step === 2 ? 'success' : 'primary'}
                    onClick={handleNext}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
                    sx={{ borderRadius:2, px:3, fontWeight:700 }}
                  >
                    {step === 2 ? 'Submit DCR' : 'Next →'}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </PageShell>
  )
}