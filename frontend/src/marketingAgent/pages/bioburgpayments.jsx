import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Box, Typography, Paper, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, IconButton, Divider
} from '@mui/material'
import {
  AccountBalance, Paid, HourglassTop, MonetizationOn,
  Close, Visibility, WorkspacePremium, Savings,
  EmojiEvents, CreditCard
} from '@mui/icons-material'

const BASE     = import.meta.env.VITE_API_BASE_URL
const API      = `${BASE}/api/sale-orders/agent/bioburg-payments`
const getToken = () => localStorage.getItem('agentToken')
const authHdr  = () => ({ Authorization: `Bearer ${getToken()}` })
const fmt      = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TYPE_META = {
  salary:        { label: 'Salary',        color: '#1d4ed8', bg: '#eff6ff',  icon: <AccountBalance sx={{ fontSize: 16 }} /> },
  incentive:     { label: 'Incentive',     color: '#7c3aed', bg: '#f5f3ff',  icon: <EmojiEvents sx={{ fontSize: 16 }} /> },
  reimbursement: { label: 'Reimbursement', color: '#0891b2', bg: '#ecfeff',  icon: <CreditCard sx={{ fontSize: 16 }} /> },
  advance:       { label: 'Advance',       color: '#d97706', bg: '#fffbeb',  icon: <Savings sx={{ fontSize: 16 }} /> },
  commission:    { label: 'Commission',    color: '#16a34a', bg: '#f0fdf4',  icon: <WorkspacePremium sx={{ fontSize: 16 }} /> },
  bonus:         { label: 'Bonus',         color: '#db2777', bg: '#fdf2f8',  icon: <MonetizationOn sx={{ fontSize: 16 }} /> },
  other:         { label: 'Other',         color: '#64748b', bg: '#f8fafc',  icon: <Paid sx={{ fontSize: 16 }} /> },
}

const STATUS_META = {
  paid:      { color: '#16a34a', bg: '#dcfce7', label: 'Paid'      },
  processed: { color: '#1d4ed8', bg: '#eff6ff', label: 'Processed' },
  pending:   { color: '#d97706', bg: '#fef3c7', label: 'Pending'   },
  failed:    { color: '#dc2626', bg: '#fee2e2', label: 'Failed'     },
}

function PaymentDetailDialog({ payment, open, onClose }) {
  if (!payment) return null
  const tm = TYPE_META[payment.paymentType] || TYPE_META.other
  const sm = STATUS_META[payment.status]    || STATUS_META.pending

  const rows = [
    { label: 'Payment Ref',    value: payment.paymentRef },
    { label: 'Type',           value: tm.label },
    { label: 'Amount',         value: fmt(payment.amount) },
    { label: 'Mode',           value: payment.mode?.toUpperCase() },
    { label: 'Status',         value: payment.status },
    { label: 'For Month',      value: payment.forMonth ? `${MONTHS[payment.forMonth - 1]} ${payment.forYear || ''}` : '—' },
    { label: 'Paid On',        value: payment.paidOn ? new Date(payment.paidOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
    { label: 'Bank',           value: payment.bankName || '—' },
    { label: 'Account',        value: payment.accountLast4 ? `XXXX XXXX ${payment.accountLast4}` : '—' },
    { label: 'Transaction Ref',value: payment.txnRef || '—' },
    { label: 'Cheque No',      value: payment.chequeNo || '—' },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        bgcolor: '#0f172a', color: 'white', py: 1.5, px: 2.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: 'rgba(255,255,255,0.7)' }}>{tm.icon}</Box>
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Payment Details</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {/* Amount spotlight */}
        <Box sx={{
          textAlign: 'center', p: 3, borderRadius: 3,
          background: `linear-gradient(135deg, ${tm.color}15, ${tm.color}08)`,
          border: `1px solid ${tm.color}25`, mb: 3,
        }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '14px',
            bgcolor: tm.bg, border: `2px solid ${tm.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tm.color, mx: 'auto', mb: 1.5,
          }}>
            {tm.icon}
          </Box>
          <Typography sx={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: tm.color, letterSpacing: '-0.02em' }}>
            {fmt(payment.amount)}
          </Typography>
          <Chip label={sm.label} size="small"
            sx={{ mt: 1, bgcolor: sm.bg, color: sm.color, fontWeight: 700, fontSize: 11 }} />
        </Box>

        {/* Details grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {rows.map(r => (
            <Box key={r.label} sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              py: 1, borderBottom: '1px solid #f1f5f9',
            }}>
              <Typography sx={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{r.label}</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#0f172a', maxWidth: 180, textAlign: 'right' }}>{r.value}</Typography>
            </Box>
          ))}
        </Box>

        {payment.remarks && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#fffbeb', borderRadius: 2, borderLeft: '3px solid #f59e0b' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', mb: 0.5 }}>REMARKS</Typography>
            <Typography sx={{ fontSize: 12, color: '#374151' }}>{payment.remarks}</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function BiourgPayments() {
  const [payments, setPayments] = useState([])
  const [summary,  setSummary]  = useState({ totalPaid: 0, totalPending: 0, count: 0 })
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)

  const [typeF,   setTypeF]   = useState('')
  const [statusF, setStatusF] = useState('')
  const [yearF,   setYearF]   = useState('')
  const [monthF,  setMonthF]  = useState('')

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' })
  const toast = (msg, severity = 'error') => setSnack({ open: true, msg, severity })

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeF)   params.set('type',   typeF)
      if (statusF) params.set('status', statusF)
      if (yearF)   params.set('year',   yearF)
      if (monthF)  params.set('month',  monthF)

      const { data } = await axios.get(`${API}?${params}`, { headers: authHdr() })
      if (data.success) { setPayments(data.payments); setSummary(data.summary) }
    } catch { toast('Failed to load payments') }
    setLoading(false)
  }

  useEffect(() => { load() }, [typeF, statusF, yearF, monthF])

  // Group by type for breakdown chart
  const byType = payments.reduce((acc, p) => {
    acc[p.paymentType] = (acc[p.paymentType] || 0) + p.amount
    return acc
  }, {})

  const yearOptions = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 3; y--) yearOptions.push(y)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* ── HEADER ── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 24, color: '#0f172a', letterSpacing: '-0.02em' }}>
          BioBurg Payments
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.3 }}>
          Salary, incentives, reimbursements and bonuses from BioBurg
        </Typography>
      </Box>

      {/* ── SUMMARY CARDS ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Total Received',   value: fmt(summary.totalPaid),    color: '#16a34a', bg: '#f0fdf4', icon: <Paid /> },
          { label: 'Pending Payments', value: fmt(summary.totalPending), color: '#d97706', bg: '#fffbeb', icon: <HourglassTop /> },
          { label: 'Total Records',    value: summary.count,             color: '#1d4ed8', bg: '#eff6ff', icon: <AccountBalance /> },
        ].map(card => (
          <Paper key={card.label} elevation={0} sx={{
            border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '14px',
              bgcolor: card.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: card.color, flexShrink: 0,
            }}>
              {card.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '-0.03em' }}>
                {card.value}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ── PAYMENT TYPE BREAKDOWN ── */}
      {Object.keys(byType).length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5, mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#334155', mb: 2 }}>Breakdown by Type</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {Object.entries(byType).map(([type, amount]) => {
              const tm = TYPE_META[type] || TYPE_META.other
              return (
                <Box key={type} sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  p: '8px 14px', borderRadius: '10px',
                  bgcolor: tm.bg, border: `1px solid ${tm.color}25`,
                }}>
                  <Box sx={{ color: tm.color }}>{tm.icon}</Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: tm.color, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>
                      {tm.label}
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                      {fmt(amount)}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Paper>
      )}

      {/* ── FILTERS ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Payment Type</InputLabel>
          <Select label="Payment Type" value={typeF} onChange={e => setTypeF(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="">All Types</MenuItem>
            {Object.entries(TYPE_META).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusF} onChange={e => setStatusF(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="">All</MenuItem>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select label="Year" value={yearF} onChange={e => setYearF(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="">All Years</MenuItem>
            {yearOptions.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select label="Month" value={monthF} onChange={e => setMonthF(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="">All Months</MenuItem>
            {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* ── TABLE ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: '#1d4ed8' }} /></Box>
        ) : payments.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <AccountBalance sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
            <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No payments found</Typography>
            <Typography sx={{ color: '#cbd5e1', fontSize: 13, mt: 0.5 }}>
              Payments from BioBurg will appear here once processed by admin
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Ref #', 'Type', 'Period', 'Amount', 'Mode', 'Status', 'Paid On', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', py: 1.5, whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map(p => {
                  const tm = TYPE_META[p.paymentType] || TYPE_META.other
                  const sm = STATUS_META[p.status]    || STATUS_META.pending
                  return (
                    <TableRow key={p._id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                      <TableCell>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#1d4ed8' }}>
                          {p.paymentRef}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<Box sx={{ color: `${tm.color} !important`, display: 'flex', alignItems: 'center' }}>{tm.icon}</Box>}
                          label={tm.label} size="small"
                          sx={{ fontSize: 10, height: 22, bgcolor: tm.bg, color: tm.color, fontWeight: 700, border: `1px solid ${tm.color}30` }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {p.forMonth ? `${MONTHS[p.forMonth - 1]} ${p.forYear || ''}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                          {fmt(p.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          {p.mode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={sm.label} size="small"
                          sx={{ fontSize: 10, height: 20, bgcolor: sm.bg, color: sm.color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {p.paidOn
                          ? new Date(p.paidOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <Typography component="span" sx={{ color: '#d97706', fontSize: 12, fontWeight: 600 }}>Pending</Typography>}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => { setSelected(p); setViewOpen(true) }}
                          sx={{ color: '#1d4ed8' }}>
                          <Visibility sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ── INFO BANNER ── */}
      <Box sx={{ mt: 3, p: 2.5, bgcolor: '#eff6ff', borderRadius: 3, border: '1px solid #bfdbfe' }}>
        <Typography sx={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600, mb: 0.5 }}>
          ℹ️ About BioBurg Payments
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#3b82f6', lineHeight: 1.7 }}>
          Payments listed here are processed by the BioBurg admin team. For any discrepancy or query, please raise a support ticket.
          Salary payments are typically processed on the 1st–5th of each month. Incentives are calculated based on your monthly targets.
        </Typography>
      </Box>

      <PaymentDetailDialog payment={selected} open={viewOpen} onClose={() => setViewOpen(false)} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}