import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Paper, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableHead, TableRow, Alert, Snackbar, InputAdornment,
  Tabs, Tab, Divider, CircularProgress, useMediaQuery, useTheme,
  IconButton, Menu, Tooltip, Badge, Avatar, LinearProgress,
  Collapse, Card, CardContent, Grid
} from '@mui/material'
import {
  Add, Search, FilterList, MoreVert, Edit, Delete, Visibility,
  Phone, WhatsApp, Email, LocationOn, Business, Person,
  TrendingUp, CheckCircle, AccessTime, Cancel, Refresh,
  ExpandMore, ExpandLess, FiberManualRecord, ArrowUpward,
  ArrowDownward, AttachMoney, Assignment, Flag, Schedule,
  CallMade, Note, Close
} from '@mui/icons-material'
import { API_URL } from '../../config/api.js'

const BASE_API = API_URL
const getToken = () => localStorage.getItem('agentToken')
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

// ── Constants ──
const LEAD_STAGES = [
  { value: 'New',          color: '#3b82f6', bg: '#eff6ff'},
  { value: 'Contacted',   color: '#8b5cf6', bg: '#f5f3ff'},
  { value: 'Qualified',   color: '#06b6d4', bg: '#ecfeff'},
  { value: 'Proposal',    color: '#f59e0b', bg: '#fffbeb'},
  { value: 'Negotiation', color: '#f97316', bg: '#fff7ed'},
  { value: 'Won',         color: '#10b981', bg: '#f0fdf4'},
  { value: 'Lost',        color: '#ef4444', bg: '#fef2f2'},
  { value: 'Follow Up',   color: '#64748b', bg: '#f8fafc'},
]

const PLACE_TYPES = [
  'Hospital', 'Clinic', 'Pharmacy', 'Medical Store', 'Nursing Home',
  'Diagnostic Centre', 'Doctor Chamber', 'Corporate Office',
  'Retail Shop', 'Wholesaler', 'Factory', 'School', 'Hotel', 'Other'
]

const SOURCES = [
  'DCR Visit', 'Response Log', 'Referral', 'Cold Call',
  'Campaign', 'Walk-in', 'Social Media', 'Email', 'Other'
]

const NEXT_ACTIONS = [
  'Call Tomorrow', 'Visit Again', 'Send Sample', 'Send Quotation',
  'Send Proposal', 'Demo Scheduled', 'Follow Up Next Week',
  'Escalate to Manager', 'None Required', 'Other'
]

const PRIORITIES = [
  { value: 'Low',    color: '#64748b', bg: '#f1f5f9' },
  { value: 'Medium', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'High',   color: '#ef4444', bg: '#fef2f2' },
  { value: 'Hot',    color: '#8b5cf6', bg: '#f5f3ff' },
]

const initialForm = {
  // Place
  placeName: '', placeType: 'Hospital', placeTypeOther: '',
  address: '', city: '',
  // Contact
  contactPerson: '', contactRole: '', contactRoleOther: '',
  phone: '', whatsapp: '', email: '',
  // Lead
  stage: 'New',
  source: 'DCR Visit', sourceOther: '',
  priority: 'Medium',
  productInterest: '', productInterestOther: '',
  estimatedValue: '',
  // Follow-up
  nextAction: 'Call Tomorrow', nextActionOther: '',
  followUpDate: '',
  // Notes
  notes: '',
  // Converted from response?
  fromResponseId: null,
}

const CONTACT_ROLES = [
  'Doctor', 'Pharmacist', 'Manager', 'Owner', 'Purchase Manager',
  'Lab Technician', 'Nurse', 'Receptionist', 'Director', 'CEO', 'Other'
]

export default function Leads() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const [tab, setTab] = useState(0)
  const [leads, setLeads] = useState([])
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [viewLead, setViewLead] = useState(null)
  const [stageDialog, setStageDialog] = useState({ open: false, lead: null })
  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuLead, setMenuLead] = useState(null)
  const [convertDialog, setConvertDialog] = useState(false)
  const [selectedResponses, setSelectedResponses] = useState([])

  const notify = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  const load = async () => {
    setLoading(true)
    try {
      const [lRes, rRes] = await Promise.all([
        fetch(`${BASE_API}/agent/leads-crm`, { headers: authHeaders() }),
        fetch(`${BASE_API}/agent/responses`, { headers: authHeaders() }),
      ])
      const lData = await lRes.json()
      const rData = await rRes.json()
      if (lData.success) setLeads(lData.leads || [])
      if (rData.success) setResponses(rData.responses || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // ── CRUD ──
  const openAdd = () => { setForm(initialForm); setEditingLead(null); setDialog(true) }
  const openEdit = (lead) => {
    setForm({
      placeName: lead.placeName || '',
      placeType: lead.placeType || 'Hospital',
      placeTypeOther: lead.placeTypeOther || '',
      address: lead.address || '',
      city: lead.city || '',
      contactPerson: lead.contactPerson || '',
      contactRole: lead.contactRole || '',
      contactRoleOther: lead.contactRoleOther || '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || '',
      email: lead.email || '',
      stage: lead.stage || 'New',
      source: lead.source || 'DCR Visit',
      sourceOther: lead.sourceOther || '',
      priority: lead.priority || 'Medium',
      productInterest: lead.productInterest || '',
      productInterestOther: lead.productInterestOther || '',
      estimatedValue: lead.estimatedValue || '',
      nextAction: lead.nextAction || 'Call Tomorrow',
      nextActionOther: lead.nextActionOther || '',
      followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
      notes: lead.notes || '',
      fromResponseId: lead.fromResponseId || null,
    })
    setEditingLead(lead)
    setDialog(true)
  }

  const handleSave = async () => {
    if (!form.placeName || !form.contactPerson) {
      notify('Place name and contact person are required', 'warning'); return
    }
    try {
      const url = editingLead
        ? `${BASE_API}/agent/leads-crm/${editingLead._id}`
        : `${BASE_API}/agent/leads-crm`
      const method = editingLead ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      if (editingLead) {
        setLeads(ls => ls.map(l => l._id === data.lead._id ? data.lead : l))
        notify('Lead updated!')
      } else {
        setLeads(ls => [data.lead, ...ls])
        notify('Lead added!')
      }
      setDialog(false)
    } catch (err) { notify(err.message, 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return
    try {
      await fetch(`${BASE_API}/agent/leads-crm/${id}`, { method: 'DELETE', headers: authHeaders() })
      setLeads(ls => ls.filter(l => l._id !== id))
      notify('Lead deleted')
    } catch (_) { notify('Delete failed', 'error') }
    setAnchorEl(null)
  }

  const handleStageUpdate = async (leadId, newStage) => {
    try {
      const res = await fetch(`${BASE_API}/agent/leads-crm/${leadId}/stage`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ stage: newStage })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setLeads(ls => ls.map(l => l._id === leadId ? data.lead : l))
      notify(`Stage updated to ${newStage}`)
    } catch (err) { notify(err.message, 'error') }
    setStageDialog({ open: false, lead: null })
  }

  // Convert response to lead
  const convertResponseToLead = async (response) => {
    const converted = {
      placeName: response.placeName,
      placeType: response.placeType || 'Hospital',
      address: response.address || '',
      contactPerson: response.contactPerson,
      contactRole: response.contactRole || '',
      phone: response.phone || '',
      stage: response.responseStatus?.includes('Positive') ? 'Qualified'
           : response.responseStatus?.includes('Order') ? 'Won'
           : 'New',
      source: 'Response Log',
      priority: response.responseStatus?.includes('Positive') ? 'High' : 'Medium',
      productInterest: response.productDiscussed || '',
      nextAction: response.nextAction || 'Call Tomorrow',
      followUpDate: response.followUpDate || '',
      notes: response.remarks || '',
      fromResponseId: response._id,
    }
    try {
      const res = await fetch(`${BASE_API}/agent/leads-crm`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(converted)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setLeads(ls => [data.lead, ...ls])
      notify('Response converted to lead!')
      setConvertDialog(false)
    } catch (err) { notify(err.message, 'error') }
  }

  // ── Stats ──
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.stage === 'New').length,
    qualified: leads.filter(l => l.stage === 'Qualified').length,
    won: leads.filter(l => l.stage === 'Won').length,
    lost: leads.filter(l => l.stage === 'Lost').length,
    hot: leads.filter(l => l.priority === 'Hot').length,
    followUp: leads.filter(l => l.stage === 'Follow Up').length,
    totalValue: leads.filter(l => l.estimatedValue).reduce((s, l) => s + parseFloat(l.estimatedValue || 0), 0),
  }

  // ── Filter ──
  const filtered = leads.filter(l => {
    const matchStage = filterStage === 'All' || l.stage === filterStage
    const matchPriority = filterPriority === 'All' || l.priority === filterPriority
    const q = search.toLowerCase()
    const matchSearch = !search
      || l.placeName?.toLowerCase().includes(q)
      || l.contactPerson?.toLowerCase().includes(q)
      || l.city?.toLowerCase().includes(q)
      || l.productInterest?.toLowerCase().includes(q)
    return matchStage && matchPriority && matchSearch
  })

  const tabFiltered = (() => {
    if (tab === 1) return filtered.filter(l => l.stage === 'New')
    if (tab === 2) return filtered.filter(l => ['Contacted', 'Qualified', 'Proposal', 'Negotiation'].includes(l.stage))
    if (tab === 3) return filtered.filter(l => l.stage === 'Won')
    if (tab === 4) return filtered.filter(l => ['Follow Up', 'Callback Requested'].includes(l.stage))
    if (tab === 5) return filtered.filter(l => l.stage === 'Lost')
    return filtered
  })()

  const getStageStyle = (val) => LEAD_STAGES.find(s => s.value === val) || { color: '#64748b', bg: '#f8fafc', icon: '•' }
  const getPriorityStyle = (val) => PRIORITIES.find(p => p.value === val) || { color: '#64748b', bg: '#f1f5f9' }

  // Form field helper
  const F = (key) => ({ value: form[key] || '', onChange: e => setForm(f => ({ ...f, [key]: e.target.value })) })

  const isOther = (val) => val === 'Other'

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: '#1d4ed8' }} />
      <Typography sx={{ color: '#64748b', fontSize: 14 }}>Loading leads...</Typography>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 1.5, md: 3 } }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: 20, md: 26 }, letterSpacing: '-0.02em' }}>
            Lead Management
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: 13, mt: 0.5, display: { xs: 'none', sm: 'block' } }}>
            Track, manage and convert your leads through the sales pipeline.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size={isMobile ? 'small' : 'medium'}
            onClick={() => setConvertDialog(true)}
            sx={{ borderColor: '#1d4ed8', color: '#1d4ed8', fontSize: 11, fontWeight: 700, borderRadius: 2, px: 2 }}>
            From Responses
          </Button>
          <Button variant="contained" onClick={openAdd} size={isMobile ? 'small' : 'medium'}
            sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, px: 2.5, py: 1, borderRadius: 2, fontWeight: 700, fontSize: 12, boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>
            + ADD LEAD
          </Button>
        </Box>
      </Box>

      {/* ── Stats ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3,1fr)', sm: 'repeat(4,1fr)', md: 'repeat(7,1fr)' }, gap: { xs: 1, md: 1.5 }, mb: 2.5 }}>
        {[
          { label: 'TOTAL', value: stats.total, color: '#1d4ed8' },
          { label: 'NEW', value: stats.new, color: '#3b82f6' },
          { label: 'QUALIFIED', value: stats.qualified, color: '#06b6d4' },
          { label: 'HOT', value: stats.hot, color: '#8b5cf6' },
          { label: 'WON', value: stats.won, color: '#10b981' },
          { label: 'FOLLOW UP', value: stats.followUp, color: '#f59e0b' },
          { label: 'LOST', value: stats.lost, color: '#ef4444' },
        ].map(s => (
          <Paper key={s.label} elevation={0} sx={{ border: '1px solid #e2e8f0', borderTop: `3px solid ${s.color}`, borderRadius: 2, p: { xs: 1.5, md: 2 }, bgcolor: 'white', cursor: 'pointer', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }, transition: 'all 0.15s' }}
            onClick={() => { setFilterStage(s.label === 'TOTAL' ? 'All' : s.label === 'HOT' ? 'All' : s.label.charAt(0) + s.label.slice(1).toLowerCase()); if (s.label === 'HOT') setFilterPriority('Hot') }}>
            <Typography sx={{ fontSize: { xs: 9, md: 10 }, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em' }}>{s.label}</Typography>
            <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 800, color: s.color, fontFamily: 'monospace', mt: 0.25 }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Pipeline Value Banner ── */}
      {stats.totalValue > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #ddd6fe', bgcolor: '#f5f3ff', borderRadius: 2, p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AttachMoney sx={{ color: '#7c3aed', fontSize: 20 }} />
          <Typography sx={{ fontSize: 13, color: '#5b21b6', fontWeight: 700 }}>
            Pipeline Value: ₹{stats.totalValue.toLocaleString('en-IN')}
          </Typography>
        </Paper>
      )}

      {/* ── Filters ── */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ color: '#94a3b8', fontSize: 18, mr: 0.5 }} /> }}
          sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }} />
        <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 6px)', sm: 160 } }}>
          <InputLabel>Stage</InputLabel>
          <Select label="Stage" value={filterStage} onChange={e => setFilterStage(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="All">All Stages</MenuItem>
            {LEAD_STAGES.map(s => <MenuItem key={s.value} value={s.value}>{s.icon} {s.value}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 6px)', sm: 140 } }}>
          <InputLabel>Priority</InputLabel>
          <Select label="Priority" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
            <MenuItem value="All">All</MenuItem>
            {PRIORITIES.map(p => <MenuItem key={p.value} value={p.value}>{p.value}</MenuItem>)}
          </Select>
        </FormControl>
        <IconButton onClick={load} size="small" sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Refresh sx={{ fontSize: 18, color: '#64748b' }} />
        </IconButton>
      </Box>

      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { fontSize: { xs: 10, md: 12 }, fontWeight: 700, minHeight: 40, textTransform: 'uppercase', minWidth: { xs: 60, sm: 'auto' } }, '& .Mui-selected': { color: '#1d4ed8' }, '& .MuiTabs-indicator': { bgcolor: '#1d4ed8', height: 3 } }}>
          {[
            { label: 'All', count: filtered.length },
            { label: 'New', count: stats.new },
            { label: 'In Progress', count: leads.filter(l => ['Contacted','Qualified','Proposal','Negotiation'].includes(l.stage)).length },
            { label: 'Won', count: stats.won },
            { label: 'Follow Up', count: stats.followUp },
            { label: 'Lost', count: stats.lost },
          ].map((t, i) => (
            <Tab key={t.label} label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {t.label}
                <Box sx={{ px: 0.75, py: 0.1, borderRadius: 10, bgcolor: tab === i ? '#eff6ff' : '#f1f5f9', fontSize: 9, fontWeight: 800, color: tab === i ? '#1d4ed8' : '#94a3b8', minWidth: 16, textAlign: 'center' }}>
                  {t.count}
                </Box>
              </Box>
            } />
          ))}
        </Tabs>
      </Box>

      {/* ── Content ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 16px 16px', overflow: 'hidden', bgcolor: 'white' }}>
        {tabFiltered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>No leads found.</Typography>
            <Button variant="outlined" onClick={openAdd} sx={{ mt: 2, borderRadius: 2, fontSize: 12 }}>Add First Lead</Button>
          </Box>
        ) : isMobile ? (
          /* ── MOBILE CARD ── */
          <Box>
            {tabFiltered.map(lead => {
              const stStyle = getStageStyle(lead.stage)
              const prStyle = getPriorityStyle(lead.priority)
              return (
                <Box key={lead._id} sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.placeName}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#64748b' }}>{lead.contactPerson} · {lead.placeType}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Chip label={lead.stage} size="small" sx={{ fontSize: 9, height: 20, bgcolor: stStyle.bg, color: stStyle.color, fontWeight: 700 }} />
                      <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setMenuLead(lead) }}>
                        <MoreVert sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip label={lead.priority} size="small" sx={{ fontSize: 9, height: 18, bgcolor: prStyle.bg, color: prStyle.color, fontWeight: 600 }} />
                    {lead.productInterest && <Typography sx={{ fontSize: 11, color: '#475569' }}>{lead.productInterest}</Typography>}
                    {lead.estimatedValue && <Typography sx={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>₹{parseInt(lead.estimatedValue).toLocaleString('en-IN')}</Typography>}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 1, alignItems: 'center' }}>
                    {lead.phone && (
                      <Tooltip title="Call">
                        <IconButton size="small" href={`tel:${lead.phone}`} sx={{ bgcolor: '#f0fdf4', color: '#16a34a', width: 28, height: 28 }}>
                          <Phone sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {lead.whatsapp && (
                      <Tooltip title="WhatsApp">
                        <IconButton size="small" href={`https://wa.me/${lead.whatsapp}`} target="_blank" sx={{ bgcolor: '#f0fdf4', color: '#16a34a', width: 28, height: 28 }}>
                          <WhatsApp sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Button size="small" onClick={() => setStageDialog({ open: true, lead })}
                      sx={{ fontSize: 9, py: 0.3, px: 1, borderRadius: 1, border: '1px solid #e2e8f0', color: '#475569', minWidth: 0 }}>
                      Update Stage
                    </Button>
                    {lead.followUpDate && (
                      <Typography sx={{ fontSize: 10, color: '#94a3b8', ml: 'auto' }}>{new Date(lead.followUpDate).toLocaleDateString('en-IN')}</Typography>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        ) : (
          /* ── DESKTOP TABLE ── */
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Place / Contact', 'Type', 'Stage', 'Priority', 'Product', 'Value', 'Source', 'Next Action', 'Follow Up', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tabFiltered.map(lead => {
                  const stStyle = getStageStyle(lead.stage)
                  const prStyle = getPriorityStyle(lead.priority)
                  return (
                    <TableRow key={lead._id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, borderBottom: '1px solid #f1f5f9' }}>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{lead.placeName}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#64748b' }}>{lead.contactPerson} {lead.contactRole && `· ${lead.contactRole}`}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {lead.phone && <IconButton size="small" href={`tel:${lead.phone}`} sx={{ p: 0.3, color: '#16a34a' }}><Phone sx={{ fontSize: 13 }} /></IconButton>}
                          {lead.whatsapp && <IconButton size="small" href={`https://wa.me/${lead.whatsapp}`} target="_blank" sx={{ p: 0.3, color: '#16a34a' }}><WhatsApp sx={{ fontSize: 13 }} /></IconButton>}
                          {lead.email && <IconButton size="small" href={`mailto:${lead.email}`} sx={{ p: 0.3, color: '#1d4ed8' }}><Email sx={{ fontSize: 13 }} /></IconButton>}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={lead.placeType} size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={`${stStyle.icon} ${lead.stage}`} size="small"
                          onClick={() => setStageDialog({ open: true, lead })}
                          sx={{ fontSize: 10, height: 22, bgcolor: stStyle.bg, color: stStyle.color, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={lead.priority} size="small" sx={{ fontSize: 10, height: 20, bgcolor: prStyle.bg, color: prStyle.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#475569', maxWidth: 120 }}>
                        <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110, fontSize: 12 }}>
                          {lead.productInterest || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {lead.estimatedValue
                          ? <Typography sx={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, fontFamily: 'monospace' }}>₹{parseInt(lead.estimatedValue).toLocaleString('en-IN')}</Typography>
                          : <Typography sx={{ fontSize: 11, color: '#cbd5e1' }}>—</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#64748b' }}>{lead.source || '—'}</TableCell>
                      <TableCell>
                        {lead.nextAction && lead.nextAction !== 'None Required'
                          ? <Chip label={lead.nextAction} size="small" sx={{ fontSize: 9, height: 18, bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 600 }} />
                          : <Typography sx={{ fontSize: 11, color: '#cbd5e1' }}>—</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString('en-IN') : '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => setViewLead(lead)} sx={{ color: '#1d4ed8' }}><Visibility sx={{ fontSize: 16 }} /></IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(lead)} sx={{ color: '#475569' }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(lead._id)} sx={{ color: '#ef4444' }}><Delete sx={{ fontSize: 16 }} /></IconButton>
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
      </Paper>

      {/* ── Mobile Context Menu ── */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setViewLead(menuLead); setAnchorEl(null) }}><Visibility sx={{ fontSize: 16, mr: 1 }} /> View</MenuItem>
        <MenuItem onClick={() => { openEdit(menuLead); setAnchorEl(null) }}><Edit sx={{ fontSize: 16, mr: 1 }} /> Edit</MenuItem>
        <MenuItem onClick={() => { setStageDialog({ open: true, lead: menuLead }); setAnchorEl(null) }}><TrendingUp sx={{ fontSize: 16, mr: 1 }} /> Update Stage</MenuItem>
        <MenuItem onClick={() => handleDelete(menuLead?._id)} sx={{ color: '#ef4444' }}><Delete sx={{ fontSize: 16, mr: 1 }} /> Delete</MenuItem>
      </Menu>

      {/* ── Stage Update Dialog ── */}
      <Dialog open={stageDialog.open} onClose={() => setStageDialog({ open: false, lead: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          Update Stage — {stageDialog.lead?.placeName}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 12, color: '#64748b', mb: 2 }}>Current: <strong>{stageDialog.lead?.stage}</strong></Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {LEAD_STAGES.map(s => (
              <Chip key={s.value}
                label={`${s.icon} ${s.value}`}
                onClick={() => handleStageUpdate(stageDialog.lead?._id, s.value)}
                sx={{
                  cursor: 'pointer', fontWeight: 700, fontSize: 12,
                  bgcolor: stageDialog.lead?.stage === s.value ? s.color : s.bg,
                  color: stageDialog.lead?.stage === s.value ? 'white' : s.color,
                  border: `1px solid ${s.color}33`,
                  '&:hover': { bgcolor: s.color, color: 'white' }, transition: 'all 0.15s'
                }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 2 }}>
          <Button onClick={() => setStageDialog({ open: false, lead: null })} sx={{ color: '#64748b' }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ── View Lead Dialog ── */}
      <Dialog open={Boolean(viewLead)} onClose={() => setViewLead(null)} maxWidth="sm" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
        {viewLead && (() => {
          const stStyle = getStageStyle(viewLead.stage)
          const prStyle = getPriorityStyle(viewLead.priority)
          return (
            <>
              <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  {viewLead.placeName}
                  <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>{viewLead.placeType}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`${stStyle.icon} ${viewLead.stage}`} sx={{ bgcolor: stStyle.bg, color: stStyle.color, fontWeight: 700 }} />
                  <IconButton size="small" onClick={() => setViewLead(null)}><Close /></IconButton>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  {[
                    { label: 'Contact', value: viewLead.contactPerson },
                    { label: 'Role', value: viewLead.contactRole || '—' },
                    { label: 'Phone', value: viewLead.phone || '—' },
                    { label: 'Email', value: viewLead.email || '—' },
                    { label: 'City', value: viewLead.city || '—' },
                    { label: 'Source', value: viewLead.source || '—' },
                    { label: 'Priority', value: viewLead.priority },
                    { label: 'Est. Value', value: viewLead.estimatedValue ? `₹${parseInt(viewLead.estimatedValue).toLocaleString('en-IN')}` : '—' },
                    { label: 'Product Interest', value: viewLead.productInterest || '—' },
                    { label: 'Next Action', value: viewLead.nextAction || '—' },
                    { label: 'Follow Up Date', value: viewLead.followUpDate ? new Date(viewLead.followUpDate).toLocaleDateString('en-IN') : '—' },
                  ].map(item => (
                    <Box key={item.label}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: 13, color: '#334155', fontWeight: 500, mt: 0.25 }}>{item.value}</Typography>
                    </Box>
                  ))}
                </Box>
                {viewLead.address && (
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Address</Typography>
                    <Typography sx={{ fontSize: 13, color: '#334155', mt: 0.25 }}>{viewLead.address}</Typography>
                  </Box>
                )}
                {viewLead.notes && (
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', mb: 0.5 }}>Notes</Typography>
                    <Typography sx={{ fontSize: 13, color: '#475569' }}>{viewLead.notes}</Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={() => { setViewLead(null); openEdit(viewLead) }} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>Edit</Button>
                <Button onClick={() => { setViewLead(null); setStageDialog({ open: true, lead: viewLead }) }} variant="contained" sx={{ bgcolor: '#1d4ed8', borderRadius: 2, fontWeight: 700 }}>Update Stage</Button>
              </DialogActions>
            </>
          )
        })()}
      </Dialog>

      {/* ── ADD / EDIT DIALOG ── */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, color: '#0f172a', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editingLead ? 'Edit Lead' : 'Add New Lead'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Place Details */}
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>PLACE DETAILS</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Place / Organisation Name *" size="small" sx={{ flex: 2, minWidth: { xs: '100%', sm: 200 } }} {...F('placeName')} />
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                <InputLabel>Place Type</InputLabel>
                <Select label="Place Type" {...F('placeType')}>
                  {PLACE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            {isOther(form.placeType) && <TextField label="Specify Place Type" size="small" fullWidth {...F('placeTypeOther')} />}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Address" size="small" sx={{ flex: 2, minWidth: { xs: '100%', sm: 200 } }} {...F('address')} />
              <TextField label="City / Area" size="small" sx={{ flex: 1, minWidth: { xs: '100%', sm: 140 } }} {...F('city')} />
            </Box>

            <Divider />
            {/* Contact Details */}
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>CONTACT DETAILS</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Contact Person *" size="small" sx={{ flex: 1, minWidth: { xs: '100%', sm: 160 } }} {...F('contactPerson')} />
              <FormControl size="small" sx={{ flex: 1, minWidth: { xs: 'calc(50% - 8px)', sm: 150 } }}>
                <InputLabel>Role</InputLabel>
                <Select label="Role" {...F('contactRole')}>
                  {CONTACT_ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Phone" size="small" sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 150 } }} {...F('phone')} />
            </Box>
            {isOther(form.contactRole) && <TextField label="Specify Role" size="small" sx={{ maxWidth: 280 }} {...F('contactRoleOther')} />}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="WhatsApp" size="small" sx={{ flex: 1, minWidth: { xs: 'calc(50% - 8px)', sm: 160 } }} {...F('whatsapp')} />
              <TextField label="Email" size="small" sx={{ flex: 2, minWidth: { xs: 'calc(50% - 8px)', sm: 200 } }} {...F('email')} />
            </Box>

            <Divider />
            {/* Lead Details */}
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>LEAD DETAILS</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 160 } }}>
                <InputLabel>Stage</InputLabel>
                <Select label="Stage" {...F('stage')}>
                  {LEAD_STAGES.map(s => <MenuItem key={s.value} value={s.value}>{s.icon} {s.value}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 140 } }}>
                <InputLabel>Priority</InputLabel>
                <Select label="Priority" {...F('priority')}>
                  {PRIORITIES.map(p => <MenuItem key={p.value} value={p.value}>{p.value}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1, minWidth: { xs: '100%', sm: 160 } }}>
                <InputLabel>Source</InputLabel>
                <Select label="Source" {...F('source')}>
                  {SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            {isOther(form.source) && <TextField label="Specify Source" size="small" sx={{ maxWidth: 280 }} {...F('sourceOther')} />}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Product / Service Interest" size="small" sx={{ flex: 2, minWidth: { xs: '100%', sm: 200 } }} {...F('productInterest')} />
              {isOther(form.productInterest) && <TextField label="Specify Product" size="small" sx={{ flex: 1 }} {...F('productInterestOther')} />}
              <TextField label="Estimated Value (₹)" size="small" type="number" sx={{ flex: 1, minWidth: { xs: 'calc(50% - 8px)', sm: 150 } }}
                {...F('estimatedValue')} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
            </Box>

            <Divider />
            {/* Follow-up */}
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>FOLLOW-UP</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}>
                <InputLabel>Next Action</InputLabel>
                <Select label="Next Action" {...F('nextAction')}>
                  {NEXT_ACTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </Select>
              </FormControl>
              {isOther(form.nextAction) && <TextField label="Specify Action" size="small" sx={{ flex: 1 }} {...F('nextActionOther')} />}
              <TextField label="Follow-up Date" size="small" type="date" sx={{ minWidth: { xs: '100%', sm: 170 } }}
                InputLabelProps={{ shrink: true }} {...F('followUpDate')} />
            </Box>
            <TextField label="Notes / Remarks" size="small" fullWidth multiline rows={2} {...F('notes')} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}
            sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, fontWeight: 700, px: 3, borderRadius: 2 }}>
            {editingLead ? 'UPDATE LEAD' : 'SAVE LEAD'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Convert Responses Dialog ── */}
      <Dialog open={convertDialog} onClose={() => setConvertDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          Convert Responses to Leads
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 12, color: '#64748b', mb: 2 }}>Select responses to convert into trackable leads:</Typography>
          {responses.length === 0 ? (
            <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>No responses found. Log responses first.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {responses.map(r => {
                const alreadyConverted = leads.some(l => l.fromResponseId === r._id)
                return (
                  <Box key={r._id} sx={{
                    p: 2, border: '1px solid', borderRadius: 2, cursor: alreadyConverted ? 'default' : 'pointer',
                    borderColor: alreadyConverted ? '#e2e8f0' : '#ddd6fe',
                    bgcolor: alreadyConverted ? '#f8fafc' : '#fafafe',
                    opacity: alreadyConverted ? 0.6 : 1,
                    '&:hover': alreadyConverted ? {} : { bgcolor: '#f5f3ff', borderColor: '#8b5cf6' },
                    transition: 'all 0.15s'
                  }} onClick={() => !alreadyConverted && convertResponseToLead(r)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{r.placeName}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#64748b' }}>{r.contactPerson} · {r.responseStatus}</Typography>
                        {r.productDiscussed && <Typography sx={{ fontSize: 11, color: '#475569', mt: 0.5 }}>{r.productDiscussed}</Typography>}
                      </Box>
                      {alreadyConverted
                        ? <Chip label="Already Converted" size="small" sx={{ fontSize: 9, bgcolor: '#f1f5f9', color: '#64748b' }} />
                        : <Button size="small" variant="contained" sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontSize: 10, borderRadius: 1.5, fontWeight: 700 }}>
                            Convert
                          </Button>}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 2 }}>
          <Button onClick={() => setConvertDialog(false)} sx={{ color: '#64748b' }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}