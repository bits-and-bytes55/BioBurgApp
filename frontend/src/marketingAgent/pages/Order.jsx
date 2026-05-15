import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, TextField, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
  CircularProgress, FormControl, InputLabel, Select, MenuItem,
  Divider, Table, TableBody, TableCell, TableHead, TableRow,
  Avatar, InputAdornment, IconButton, Collapse,
} from '@mui/material'
import {
  Search, Close, CheckCircle, Person, StorefrontOutlined,
  ExpandMore, ExpandLess,
} from '@mui/icons-material'
import axios from 'axios'

const BASE         = import.meta.env.VITE_API_BASE_URL
const API          = `${BASE}/api/sale-orders/agent`
const PRODUCTS_API = `${BASE}/api/agent/products`
const RESPONSES_API = `${BASE}/api/agent/responses`
const getToken     = () => localStorage.getItem('agentToken')
const authHeader   = () => ({ Authorization: `Bearer ${getToken()}` })

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const PAYMENT_MODES = ['cash', 'upi', 'credit', 'cheque', 'online', 'other']

// ─── useKnownCustomers: pulls from /api/agent/responses and deduplicates ───
function useKnownCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    axios.get(RESPONSES_API, { headers: authHeader() })
      .then(({ data }) => {
        if (!data.success) return
        const map = {}
        data.responses.forEach(r => {
          const key = `${r.contactPerson}__${r.phone || ''}`
          if (!map[key]) {
            map[key] = {
  name: r.contactPerson || '',

  phone: r.phone || '',

  alternatePhone: r.alternatePhone || '',

  whatsappPhone: r.whatsappPhone || '',

  address: r.city
    ? `${r.city}${r.district ? ', ' + r.district : ''}`
    : (r.district || ''),

  area: r.city || r.district || '',

  placeName: r.placeName || '',

  role: r.contactRole || '',

  designation: r.designation || '',

  gst: r.gst || '',

  licenses: r.licenses || [],
}
          }
        })
        setCustomers(Object.values(map))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { customers, loading }
}

// ─── CustomerSection ───────────────────────────────────────────────────────
function CustomerSection({ customer, setCustomer }) {
  const { customers: knownCustomers, loading: fetchingCustomers } = useKnownCustomers()
  const [mode, setMode]         = useState('search')   // 'search' | 'pos'
  const [search, setSearch]     = useState('')
  const [focused, setFocused]   = useState(false)
  const [posForm, setPosForm] = useState({
  name: '',

  phone: '',
  alternatePhone: '',
  whatsappPhone: '',

  address: '',

  gst: '',

  licenses: [''],
})

  const filtered = knownCustomers.filter(c =>
    !search.trim() ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.placeName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.area || '').toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8)

  const selectKnown = (c) => {
    setCustomer({
  name: c.name,

  phone: c.phone,
  alternatePhone: c.alternatePhone || '',
  whatsappPhone: c.whatsappPhone || '',

  address: c.address || c.placeName || '',

  gst: c.gst || '',

  licenses: c.licenses || [],

  _source: 'existing',
})
    setSearch(''); setFocused(false)
  }

  const confirmPOS = () => {
    if (!posForm.name.trim()) return
    setCustomer({ ...posForm, _source: 'pos' })
  }

  // ── Already selected ──
  if (customer) return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, p: 1.75,
      bgcolor: customer._source === 'pos' ? '#fffbeb' : '#f0fdf4',
      border: `1.5px solid ${customer._source === 'pos' ? '#fcd34d' : '#86efac'}`,
      borderRadius: 2.5,
    }}>
      <Avatar sx={{
        width: 38, height: 38, fontWeight: 800, fontSize: 15,
        bgcolor: customer._source === 'pos' ? '#f59e0b' : '#16a34a',
      }}>
        {customer._source === 'pos'
          ? <StorefrontOutlined sx={{ fontSize: 18 }} />
          : customer.name?.[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{customer.name}</Typography>
        <Typography sx={{ fontSize: 11, color: '#64748b' }}>
          {customer.phone && `${customer.phone}`}
          {customer.address && ` · ${customer.address}`}
        </Typography>
      </Box>
      <Chip
        label={customer._source === 'pos' ? 'POS / New' : 'Existing'}
        size="small"
        sx={{
          fontSize: 9, height: 18, fontWeight: 700,
          bgcolor: customer._source === 'pos' ? '#fef9c3' : '#dbeafe',
          color:   customer._source === 'pos' ? '#854d0e'  : '#1d4ed8',
        }}
      />
      <IconButton size="small" onClick={() => setCustomer(null)} sx={{ color: '#94a3b8' }}>
        <Close sx={{ fontSize: 15 }} />
      </IconButton>
    </Box>
  )

  return (
    <Box>
      {/* Mode toggle */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {[
          { key: 'search', label: 'Existing Customer', icon: <Person sx={{ fontSize: 14 }} /> },
          { key: 'pos',    label: 'POS / New Entry',   icon: <StorefrontOutlined sx={{ fontSize: 14 }} /> },
        ].map(({ key, label, icon }) => (
          <Button
            key={key}
            size="small"
            variant={mode === key ? 'contained' : 'outlined'}
            startIcon={icon}
            onClick={() => setMode(key)}
            sx={{
              fontWeight: 700, borderRadius: 2, fontSize: 11,
              ...(mode === key
                ? { bgcolor: key === 'pos' ? '#d97706' : '#1d4ed8',
                    '&:hover': { bgcolor: key === 'pos' ? '#b45309' : '#1e40af' } }
                : { borderColor: '#e2e8f0', color: '#64748b' }),
            }}
          >
            {label}
          </Button>
        ))}
      </Box>

      {/* ── SEARCH MODE ── */}
      {mode === 'search' && (
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth size="small"
            placeholder={fetchingCustomers ? 'Loading customers…' : 'Search by name, phone, area…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 180)}
            disabled={fetchingCustomers}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {fetchingCustomers
                    ? <CircularProgress size={14} />
                    : <Search sx={{ fontSize: 16, color: '#94a3b8' }} />}
                </InputAdornment>
              ),
            }}
          />

          {/* Dropdown */}
          {(focused || search.trim()) && !fetchingCustomers && (
            <Paper elevation={6} sx={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              zIndex: 99999, borderRadius: 2, border: '1px solid #e2e8f0',
              maxHeight: 300, overflowY: 'auto',
            }}>
              <Box sx={{ px: 2, py: 0.75, bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em' }}>
                  {search.trim() ? `${filtered.length} RESULT(S)` : `ALL CUSTOMERS (${knownCustomers.length})`}
                </Typography>
              </Box>
              {filtered.length === 0 ? (
                <Box sx={{ px: 2, py: 2.5, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>No customers found</Typography>
                  <Button size="small" onClick={() => setMode('pos')}
                    sx={{ mt: 1, fontSize: 11, color: '#d97706', fontWeight: 700 }}>
                    Switch to POS / New Entry →
                  </Button>
                </Box>
              ) : filtered.map((c, i) => (
                <Box
                  key={i}
                  onMouseDown={() => selectKnown(c)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 2, py: 1.25, cursor: 'pointer',
                    borderBottom: '1px solid #f8fafc',
                    '&:hover': { bgcolor: '#f0f9ff' },
                  }}
                >
                  <Avatar sx={{ width: 28, height: 28, fontSize: 12, fontWeight: 700, bgcolor: '#dbeafe', color: '#1d4ed8' }}>
                    {c.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                      {c.role}{c.placeName ? ` · ${c.placeName}` : ''}{c.area ? ` · ${c.area}` : ''}
                    </Typography>
                  </Box>
                  {c.phone && (
                    <Typography sx={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{c.phone}</Typography>
                  )}
                  <CheckCircle sx={{ fontSize: 14, color: '#86efac', opacity: 0 }} />
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      )}

      {/* ── POS MODE ── */}
      {mode === 'pos' && (
        <Box sx={{
          p: 2.5, bgcolor: '#fffbeb', border: '1.5px solid #fcd34d',
          borderRadius: 2.5, display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorefrontOutlined sx={{ fontSize: 16, color: '#d97706' }} />
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#92400e', letterSpacing: '0.07em' }}>
              POS / WALK-IN CUSTOMER
            </Typography>
          </Box>
          <Box
  sx={{
    display:'grid',
    gridTemplateColumns:'1fr 1fr',
    gap:1.5,
  }}
>
  {/* Customer Name */}
  <TextField
    size="small"
    label="Customer Name *"
    value={posForm.name}
    onChange={e =>
      setPosForm(f => ({
        ...f,
        name: e.target.value,
      }))
    }
  />

  {/* Primary Phone */}
  <TextField
    size="small"
    label="Primary Phone"
    value={posForm.phone}
    inputProps={{ inputMode:'numeric' }}
    onChange={e =>
      setPosForm(f => ({
        ...f,
        phone: e.target.value
          .replace(/\D/g, '')
          .slice(0, 15),
      }))
    }
  />

  {/* Alternate Phone */}
  <TextField
    size="small"
    label="Alternate Phone"
    value={posForm.alternatePhone}
    inputProps={{ inputMode:'numeric' }}
    onChange={e =>
      setPosForm(f => ({
        ...f,
        alternatePhone: e.target.value
          .replace(/\D/g, '')
          .slice(0, 15),
      }))
    }
  />

  {/* WhatsApp */}
  <TextField
    size="small"
    label="WhatsApp Number"
    value={posForm.whatsappPhone}
    inputProps={{ inputMode:'numeric' }}
    onChange={e =>
      setPosForm(f => ({
        ...f,
        whatsappPhone: e.target.value
          .replace(/\D/g, '')
          .slice(0, 15),
      }))
    }
  />

  {/* Address */}
  <TextField
    size="small"
    label="Full Address"
    multiline
    minRows={2}
    value={posForm.address}
    onChange={e =>
      setPosForm(f => ({
        ...f,
        address: e.target.value,
      }))
    }
    sx={{ gridColumn:'1 / -1' }}
  />

  {/* GST */}
  <TextField
    size="small"
    label="GST Number"
    value={posForm.gst}
    onChange={e =>
      setPosForm(f => ({
        ...f,
        gst: e.target.value.toUpperCase(),
      }))
    }
  />

  <Box />

  {/* Licenses */}
  <Box sx={{ gridColumn:'1 / -1' }}>
    <Typography
      sx={{
        fontSize:11,
        fontWeight:700,
        color:'#92400e',
        mb:1,
        letterSpacing:'0.05em',
      }}
    >
      LICENSE NUMBERS
    </Typography>

    <Box
      sx={{
        display:'flex',
        flexDirection:'column',
        gap:1,
      }}
    >
      {posForm.licenses.map((lic, idx) => (
        <Box
          key={idx}
          sx={{
            display:'flex',
            gap:1,
          }}
        >
          <TextField
            fullWidth
            size="small"
            label={`License ${idx + 1}`}
            value={lic}
            onChange={e => {
              const updated = [...posForm.licenses]
              updated[idx] = e.target.value.toUpperCase()

              setPosForm(f => ({
                ...f,
                licenses: updated,
              }))
            }}
          />

          {posForm.licenses.length > 1 && (
            <Button
              color="error"
              variant="outlined"
              onClick={() => {
                setPosForm(f => ({
                  ...f,
                  licenses: f.licenses.filter((_, i) => i !== idx),
                }))
              }}
            >
              Remove
            </Button>
          )}
        </Box>
      ))}

      <Button
        size="small"
        variant="outlined"
        onClick={() =>
          setPosForm(f => ({
            ...f,
            licenses: [...f.licenses, ''],
          }))
        }
        sx={{
          alignSelf:'flex-start',
          fontWeight:700,
        }}
      >
        + Add License
      </Button>
    </Box>
  </Box>
</Box>
          <Button
            size="small" variant="contained" onClick={confirmPOS}
            disabled={!posForm.name.trim()}
            sx={{ alignSelf: 'flex-start', bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' },
              fontWeight: 700, fontSize: 11, borderRadius: 1.5 }}
          >
            Confirm & Continue →
          </Button>
        </Box>
      )}
    </Box>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function CreateOrder() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const defaultType = params.get('type') || 'bill'

  const [orderType,   setOrderType]   = useState(defaultType)
  const [products,    setProducts]    = useState([])
  const [loadingProd, setLoadingProd] = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [submitted,   setSubmitted]   = useState(null)
  const [prodSearch,  setProdSearch]  = useState('')
  const [prodDialog,  setProdDialog]  = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'warning' })

  // customer: { name, phone, address, gst, _source }
  const [customer,    setCustomer]    = useState(null)
  const [items,       setItems]       = useState([])
  const [taxPercent,  setTaxPercent]  = useState(0)
  const [discount,    setDiscount]    = useState(0)
  const [paymentMode, setPaymentMode] = useState('cash')
  const [payStatus,   setPayStatus]   = useState('pending')
  const [paidAmount,  setPaidAmount]  = useState(0)
  const [notes,       setNotes]       = useState('')
  const [visitArea,   setVisitArea]   = useState('')

  const toast = (msg, severity = 'warning') => setSnack({ open: true, msg, severity })

  useEffect(() => {
    axios.get(PRODUCTS_API, { headers: authHeader() })
      .then(({ data }) => { if (data.success) setProducts(data.products || []) })
      .catch(() => toast('Failed to load products'))
      .finally(() => setLoadingProd(false))
  }, [])

  /* ── Totals ── */
  const subtotal    = items.reduce((s, i) => s + i.total, 0)
  const discountAmt = Math.round((subtotal * discount) / 100)
  const taxable     = subtotal - discountAmt
  const taxAmt      = Math.round((taxable * taxPercent) / 100)
  const grandTotal  = taxable + taxAmt

  /* ── Items ── */
  const addProduct = (prod) => {
    const exists = items.find(i => i.productId === prod._id)
    if (exists) {
      setItems(items.map(i => i.productId === prod._id
        ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i))
    } else {
      const price = Number(prod.price ?? prod.mrp ?? 0)
      setItems([...items, {
        productId:   prod._id,
        productName: prod.title || prod.name || prod.brandName || 'Unknown Product',
        brandName:   prod.brandName || '',
        category:    prod.category || '',
        mrp:         Number(prod.mrp ?? 0),
        price,
        qty:         1,
        discount:    0,
        total:       price,
      }])
    }
    setProdDialog(false); setProdSearch('')
  }

  const updateQty       = (idx, qty)   => { const q = Math.max(1, Number(qty)); setItems(items.map((it, i) => i === idx ? { ...it, qty: q, total: q * it.price } : it)) }
  const updateItemPrice = (idx, price) => { const p = Math.max(0, Number(price)); setItems(items.map((it, i) => i === idx ? { ...it, price: p, total: it.qty * p } : it)) }
  const removeItem      = (idx)        => setItems(items.filter((_, i) => i !== idx))

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!customer?.name?.trim()) return toast('Select or enter a customer first')
    if (items.length === 0)      return toast('Add at least one product')

    setSaving(true)
    try {
      const { data } = await axios.post(`${API}/create`, {
        customerName: customer.name,

customerPhone:
  customer.phone || '',

customerAlternatePhone:
  customer.alternatePhone || '',

customerWhatsappPhone:
  customer.whatsappPhone || '',

customerAddress:
  customer.address || '',

customerGST:
  customer.gst || '',

customerLicenses:
  customer.licenses || [],
        orderType,
        items,
        subtotal, discountAmt, taxAmt, taxPercent, grandTotal,
        paymentMode,
        paymentStatus: payStatus,
        paidAmount: payStatus === 'paid' ? grandTotal : payStatus === 'partial' ? paidAmount : 0,
        notes, visitArea,
      }, { headers: { ...authHeader(), 'Content-Type': 'application/json' } })

      if (data.success) setSubmitted(data.order)
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to create order', 'error')
    }
    setSaving(false)
  }

  const filteredProds = products.filter(p =>
    !prodSearch ||
    p.title?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.brandName?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(prodSearch.toLowerCase())
  )

  const typeLabel = orderType === 'bill' ? 'Tax Invoice' : orderType === 'challan' ? 'Delivery Challan' : 'Quotation'
  const typeColor = orderType === 'bill' ? '#1d4ed8'    : orderType === 'challan'  ? '#16a34a'          : '#7c3aed'

  /* ── Success screen ── */
  if (submitted) return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 4, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#f0fdf4', border: '3px solid #bbf7d0',
          mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 28, color: '#16a34a' }}>✓</Typography>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#0f172a', mb: 0.5 }}>{typeLabel} Created!</Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b', mb: 3 }}>
          Order <strong style={{ color: typeColor }}>{submitted.orderNumber}</strong> saved successfully.
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
          <Button variant="contained"
            onClick={() => { setSubmitted(null); setItems([]); setCustomer(null) }}
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[['bill', 'Bill'], ['challan', 'Challan'], ['quotation', 'Quote']].map(([val, label]) => (
            <Button key={val} size="small" variant={orderType === val ? 'contained' : 'outlined'} onClick={() => setOrderType(val)}
              sx={{ fontWeight: 700, borderRadius: 2, fontSize: 12,
                ...(orderType === val
                  ? { bgcolor: typeColor, '&:hover': { filter: 'brightness(0.9)' } }
                  : { borderColor: '#e2e8f0', color: '#64748b' }) }}>
              {label}
            </Button>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 3 }}>
        {/* Left */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* ── Customer ── */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white', overflow: 'visible' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#334155', letterSpacing: '0.04em' }}>
                CUSTOMER
              </Typography>
              {customer && (
                <Chip
                  label={customer._source === 'pos' ? '⚡ POS Entry' : '✓ Auto-filled'}
                  size="small"
                  sx={{
                    fontSize: 10, height: 20, fontWeight: 700,
                    bgcolor: customer._source === 'pos' ? '#fef9c3' : '#dcfce7',
                    color:   customer._source === 'pos' ? '#854d0e'  : '#15803d',
                  }}
                />
              )}
            </Box>
            <CustomerSection customer={customer} setCustomer={setCustomer} />

            {/* Show auto-filled detail preview for existing customers */}
            {customer && customer._source === 'existing' && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', mb: 1 }}>
                  AUTO-FILLED DETAILS
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  {[
                    { label: 'Name',    value: customer.name },
                    { label: 'Phone',   value: customer.phone    || '—' },
                    { label: 'Address', value: customer.address  || '—' },
                    { label:'GST', value:customer.gst || '—' },
                    { label:'WhatsApp', value:customer.whatsappPhone || '—', },
                    { label:'Alternate', value:customer.alternatePhone || '—', },
                  ].map(({ label, value }) => (
                    <Box key={label}>
                      <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>{label}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          {/* ── Items ── */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#334155', letterSpacing: '0.04em' }}>
                ITEMS ({items.length})
              </Typography>
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
                          <TextField size="small" type="number" value={item.price ?? 0} sx={{ width: 90 }}
                            onChange={e => updateItemPrice(i, e.target.value)} inputProps={{ min: 0 }} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" type="number" value={item.qty ?? 1} sx={{ width: 70 }}
                            onChange={e => updateQty(i, e.target.value)} inputProps={{ min: 1 }} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{fmt(item.total)}</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => removeItem(i)}
                            sx={{ color: '#dc2626', minWidth: 'auto', p: '2px 6px', fontSize: 12 }}>✕</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>

          {/* ── Additional Info ── */}
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

        {/* Right */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Price Summary */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#334155', mb: 2, letterSpacing: '0.04em' }}>PRICE SUMMARY</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: '#64748b' }}>Subtotal</Typography>
                <Typography sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{fmt(subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 13, color: '#64748b', flex: 1 }}>Discount %</Typography>
                <TextField size="small" type="number" sx={{ width: 80 }} value={discount ?? 0}
                  onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                  inputProps={{ min: 0, max: 100 }} />
                <Typography sx={{ fontSize: 12, color: '#94a3b8', minWidth: 60, textAlign: 'right' }}>-{fmt(discountAmt)}</Typography>
              </Box>
              {orderType === 'bill' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 13, color: '#64748b', flex: 1 }}>GST %</Typography>
                  <TextField size="small" type="number" sx={{ width: 80 }} value={taxPercent ?? 0}
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
                      {['pending', 'partial', 'paid'].map(s => (
                        <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {payStatus === 'partial' && (
                    <TextField size="small" type="number" label="Amount Paid (₹)" fullWidth
                      value={paidAmount ?? 0} onChange={e => setPaidAmount(Number(e.target.value))} />
                  )}
                </>
              )}
            </Box>
          </Paper>

          {/* Submit */}
          <Button variant="contained" onClick={handleSubmit} disabled={saving || items.length === 0 || !customer}
            sx={{ bgcolor: typeColor, '&:hover': { filter: 'brightness(0.9)' }, fontWeight: 800,
              py: 1.5, borderRadius: 2, fontSize: 14, boxShadow: `0 4px 14px ${typeColor}35`,
              '&:disabled': { opacity: 0.5 } }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : `SAVE ${typeLabel.toUpperCase()}`}
          </Button>

          {(!customer || items.length === 0) && (
            <Typography sx={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', mt: -1 }}>
              {!customer ? 'Select or enter a customer first' : 'Add at least one product'}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Product Picker Dialog */}
      <Dialog open={prodDialog} onClose={() => { setProdDialog(false); setProdSearch('') }}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          Select Product
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth size="small" placeholder="Search by name, brand, category…"
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