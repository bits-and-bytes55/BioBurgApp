// adminpanel/MarketingAgent/AdminExpenseManager.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Typography, Grid, TextField, Button, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Collapse, Tooltip, Divider, LinearProgress,
  Tab, Tabs, MenuItem, InputAdornment,
} from '@mui/material'
import {
  CheckCircle, Cancel, ExpandMore, ExpandLess,
  Refresh, FilterList, AttachMoney, Receipt, Tune,
  AccountBalanceWallet, PersonAdd, Public, Save,
} from '@mui/icons-material'

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const fmt       = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const now       = new Date()
const STATUS_COLOR = { draft: 'default', submitted: 'primary', approved: 'success', rejected: 'error' }

export default function AdminExpenseManager() {
  const [mainTab, setMainTab] = useState(0)       
  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [filter,  setFilter]  = useState('all')

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null })
  const [rejectReason, setRejectReason] = useState('')
  const [actioning,    setActioning]    = useState(null)
  const [expanded,     setExpanded]     = useState({})

  // Budget state
  const [agents,        setAgents]        = useState([])
  const [budgets,       setBudgets]       = useState([])
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [globalLimit,   setGlobalLimit]   = useState('')
  const [agentBudgets,  setAgentBudgets]  = useState({})   
  const [savingBudget,  setSavingBudget]  = useState(null)

  const token   = localStorage.getItem('adminToken')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  //  Load expense records 
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${BASE}/api/expenses/admin/all/${year}/${month}`, { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load')
      setRecords(data.records || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { load() }, [load])

  // Load budgets & agents 
  const loadBudgets = useCallback(async () => {
    setBudgetLoading(true)
    try {
      const [bRes, aRes] = await Promise.all([
        fetch(`${BASE}/api/expenses/admin/budgets`, { headers }),
        fetch(`${BASE}/api/points/admin/agents`,    { headers }),
      ])
      const [bData, aData] = await Promise.all([bRes.json(), aRes.json()])
      const budgetList = bData.budgets || []
      setBudgets(budgetList)
      setAgents(aData.data || aData || [])
      // Pre-fill local budget map
      const map = {}
      budgetList.forEach(b => { map[b.agentId] = String(b.monthlyLimit || '') })
      setAgentBudgets(map)
      const global = budgetList.find(b => b.isGlobal)
      if (global) setGlobalLimit(String(global.monthlyLimit || ''))
    } catch {}
    finally { setBudgetLoading(false) }
  }, [])

  useEffect(() => { if (mainTab === 1) loadBudgets() }, [mainTab, loadBudgets])

  //  Approve 
  const handleApprove = async (id) => {
    setActioning(id)
    try {
      const res  = await fetch(`${BASE}/api/expenses/admin/${id}/approve`, { method: 'PATCH', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRecords(r => r.map(x => x._id === id ? data.expense : x))
      setSuccess('Expense approved — amount added to agent salary balance')
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) { setError(e.message) }
    finally { setActioning(null) }
  }

  // Reject 
  const handleReject = async () => {
    const id = rejectDialog.id
    setActioning(id)
    try {
      const res  = await fetch(`${BASE}/api/expenses/admin/${id}/reject`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ reason: rejectReason || 'Rejected by admin' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRecords(r => r.map(x => x._id === id ? data.expense : x))
      setSuccess('Expense rejected')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setError(e.message) }
    finally {
      setActioning(null)
      setRejectDialog({ open: false, id: null })
      setRejectReason('')
    }
  }

  // Save global budget 
  const handleSaveGlobalBudget = async () => {
    const limit = parseFloat(globalLimit)
    if (!limit || limit <= 0) { setError('Enter a valid budget amount'); return }
    setSavingBudget('global')
    try {
      const res  = await fetch(`${BASE}/api/expenses/admin/budget`, {
        method: 'POST', headers,
        body: JSON.stringify({ monthlyLimit: limit, isGlobal: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setSuccess('Global budget set for all agents')
      setTimeout(() => setSuccess(''), 3000)
      loadBudgets()
    } catch (e) { setError(e.message) }
    finally { setSavingBudget(null) }
  }

  //  Save per-agent budget 
  const handleSaveAgentBudget = async (agentId) => {
    const limit = parseFloat(agentBudgets[agentId] || '')
    if (!limit || limit <= 0) { setError('Enter a valid budget amount'); return }
    setSavingBudget(agentId)
    try {
      const res  = await fetch(`${BASE}/api/expenses/admin/budget`, {
        method: 'POST', headers,
        body: JSON.stringify({ agentId, monthlyLimit: limit }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setSuccess(`Budget updated for agent`)
      setTimeout(() => setSuccess(''), 3000)
      loadBudgets()
    } catch (e) { setError(e.message) }
    finally { setSavingBudget(null) }
  }

  const filtered    = records.filter(r => filter === 'all' || r.status === filter)
  const monthLabel  = (y, m) => new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const prevMonth   = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextMonth   = () => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  const stats = {
    total:       records.length,
    submitted:   records.filter(r => r.status === 'submitted').length,
    approved:    records.filter(r => r.status === 'approved').length,
    rejected:    records.filter(r => r.status === 'rejected').length,
    totalAmt:    records.reduce((s, r) => s + (r.totalAmount || 0), 0),
    approvedAmt: records.filter(r => r.status === 'approved').reduce((s, r) => s + (r.totalAmount || 0), 0),
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Agent Expense Management</Typography>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
        Review expense reports, approve reimbursements, and manage agent budgets
      </Typography>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ── Main Tabs ── */}
      <Paper elevation={0} sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab label="Expense Approvals" icon={<Receipt sx={{ fontSize: 16 }} />} iconPosition="start"
            sx={{ fontSize: 13, fontWeight: 700, minHeight: 48 }} />
          <Tab label="Budget Management" icon={<Tune sx={{ fontSize: 16 }} />} iconPosition="start"
            sx={{ fontSize: 13, fontWeight: 700, minHeight: 48 }} />
        </Tabs>
      </Paper>

      {/* TAB 0 — EXPENSE APPROVALS*/}
      {mainTab === 0 && (
        <>
          {/* Month selector */}
          <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" onClick={prevMonth} sx={{ minWidth: 36 }}>‹</Button>
            <Typography sx={{ fontWeight: 700, minWidth: 160, textAlign: 'center' }}>{monthLabel(year, month)}</Typography>
            <Button size="small" variant="outlined" onClick={nextMonth} sx={{ minWidth: 36 }}>›</Button>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Reload"><IconButton size="small" onClick={load} disabled={loading}><Refresh sx={{ fontSize: 18 }} /></IconButton></Tooltip>
          </Paper>

          {/* Stat cards */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {[
              { label: 'Total Submitted',  value: stats.submitted,          color: '#1d4ed8', sub: 'Pending review' },
              { label: 'Approved',         value: stats.approved,           color: '#16a34a', sub: fmt(stats.approvedAmt) },
              { label: 'Rejected',         value: stats.rejected,           color: '#dc2626', sub: 'Needs revision' },
              { label: 'Total This Month', value: fmt(stats.totalAmt),      color: '#7c3aed', sub: `${stats.total} records` },
            ].map(c => (
              <Grid item xs={6} sm={3} key={c.label}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</Typography>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: c.color, lineHeight: 1.2 }}>{c.value}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{c.sub}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Approval note */}
          <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet sx={{ fontSize: 16, color: '#1d4ed8' }} />
            <Typography sx={{ fontSize: 12, color: '#1e40af' }}>
              <strong>Salary Integration:</strong> Approving an expense automatically credits the amount to the agent's salary balance, visible in their Payout page.
            </Typography>
          </Paper>

          {/* Filter chips */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterList sx={{ fontSize: 16, color: 'text.secondary' }} />
            {['all', 'submitted', 'approved', 'rejected', 'draft'].map(f => (
              <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} size="small"
                variant={filter === f ? 'filled' : 'outlined'}
                color={filter === f ? 'primary' : 'default'}
                onClick={() => setFilter(f)}
                sx={{ fontSize: 11, cursor: 'pointer' }} />
            ))}
            <Typography sx={{ fontSize: 11, color: 'text.secondary', ml: 'auto' }}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {/* Table */}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            {loading
              ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
              : filtered.length === 0
                ? <Box sx={{ p: 6, textAlign: 'center' }}><Typography sx={{ color: 'text.secondary' }}>No expense records for this period</Typography></Box>
                : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                          {['Agent', 'Date', 'Amount', 'Entries', 'Status', 'Submitted', 'Actions', ''].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filtered.map(rec => (
                          <>
                            <TableRow key={rec._id} sx={{ verticalAlign: 'middle', '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell>
                                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{rec.agent?.name || '—'}</Typography>
                                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{rec.agent?.assignedArea || rec.agent?.email}</Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{rec.date}</TableCell>
                              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#1d4ed8' }}>{fmt(rec.totalAmount)}</TableCell>
                              <TableCell><Chip label={`${rec.entries?.length || 0} items`} size="small" sx={{ fontSize: 10 }} /></TableCell>
                              <TableCell>
                                <Chip label={rec.status} size="small" color={STATUS_COLOR[rec.status] || 'default'} sx={{ fontSize: 10, textTransform: 'capitalize' }} />
                              </TableCell>
                              <TableCell sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                {rec.submittedAt ? new Date(rec.submittedAt).toLocaleDateString('en-IN') : '—'}
                              </TableCell>
                              <TableCell>
                                {rec.status === 'submitted' && (
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Tooltip title="Approve & credit to salary">
                                      <IconButton size="small" color="success" disabled={actioning === rec._id} onClick={() => handleApprove(rec._id)}>
                                        {actioning === rec._id ? <CircularProgress size={14} color="inherit" /> : <CheckCircle sx={{ fontSize: 18 }} />}
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject">
                                      <IconButton size="small" color="error" disabled={actioning === rec._id} onClick={() => setRejectDialog({ open: true, id: rec._id })}>
                                        <Cancel sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                                {rec.status === 'approved' && (
                                  <Box>
                                    <Typography sx={{ fontSize: 11, color: 'success.main', fontWeight: 600 }}>✓ {rec.approvedBy || 'Admin'}</Typography>
                                    <Typography sx={{ fontSize: 10, color: '#16a34a', mt: 0.3 }}>+ Salary credited</Typography>
                                  </Box>
                                )}
                                {rec.status === 'rejected' && (
                                  <Tooltip title={rec.rejectedReason || 'Rejected'}>
                                    <Typography sx={{ fontSize: 11, color: 'error.main', fontWeight: 600, cursor: 'help' }}>✗ Rejected</Typography>
                                  </Tooltip>
                                )}
                              </TableCell>
                              <TableCell>
                                <IconButton size="small" onClick={() => setExpanded(e => ({ ...e, [rec._id]: !e[rec._id] }))}>
                                  {expanded[rec._id] ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                                </IconButton>
                              </TableCell>
                            </TableRow>

                            {/* Expanded detail */}
                            {expanded[rec._id] && (
                              <TableRow key={rec._id + '-detail'}>
                                <TableCell colSpan={8} sx={{ p: 0, bgcolor: '#f8fafc' }}>
                                  <Collapse in={expanded[rec._id]} timeout="auto" unmountOnExit>
                                    <Box sx={{ p: 2 }}>
                                      <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1.5, color: '#475569' }}>
                                        EXPENSE BREAKDOWN — {rec.agent?.name} — {rec.date}
                                      </Typography>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                            {['Category', 'Amount', 'Description', 'Vendor', 'Bill No.', 'Receipt'].map(h => (
                                              <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, py: 0.8 }}>{h}</TableCell>
                                            ))}
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {rec.entries?.map((e, i) => (
                                            <TableRow key={i}>
                                              <TableCell sx={{ fontSize: 12 }}>{e.category}</TableCell>
                                              <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{fmt(e.amount)}</TableCell>
                                              <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{e.description || '—'}</TableCell>
                                              <TableCell sx={{ fontSize: 12 }}>{e.vendor || '—'}</TableCell>
                                              <TableCell sx={{ fontSize: 12 }}>{e.billNumber || '—'}</TableCell>
                                              <TableCell>
                                                <Chip label={e.hasReceipt ? 'Attached' : 'No Receipt'} size="small"
                                                  color={e.hasReceipt ? 'success' : 'default'} sx={{ fontSize: 10 }} />
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                          <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                            <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Total</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: 14, color: '#1d4ed8' }}>{fmt(rec.totalAmount)}</TableCell>
                                            <TableCell colSpan={4} />
                                          </TableRow>
                                        </TableBody>
                                      </Table>

                                      {rec.notes && (
                                        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #fef08a' }}>
                                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#854d0e', mb: 0.3 }}>NOTES</Typography>
                                          <Typography sx={{ fontSize: 12, color: '#713f12' }}>{rec.notes}</Typography>
                                        </Box>
                                      )}

                                      {rec.status === 'submitted' && (
                                        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                                          <Button size="small" variant="contained" color="success"
                                            startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                                            disabled={actioning === rec._id} onClick={() => handleApprove(rec._id)}>
                                            Approve & Credit Salary
                                          </Button>
                                          <Button size="small" variant="outlined" color="error"
                                            startIcon={<Cancel sx={{ fontSize: 14 }} />}
                                            disabled={actioning === rec._id} onClick={() => setRejectDialog({ open: true, id: rec._id })}>
                                            Reject
                                          </Button>
                                        </Box>
                                      )}
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
          </Paper>
        </>
      )}

      {/* TAB 1 — BUDGET MANAGEMENT */}
      {mainTab === 1 && (
        <>
          {budgetLoading
            ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            : (
              <>
                {/* Global Budget Card */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, border: '2px solid', borderColor: 'primary.main', borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 40, height: 40, bgcolor: '#eff6ff', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Public sx={{ color: '#1d4ed8', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Global Monthly Budget</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Applied to all agents who don't have a custom budget</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <TextField
                      size="small" label="Monthly Limit (₹)" type="number"
                      value={globalLimit} onChange={e => setGlobalLimit(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      sx={{ width: 220 }} placeholder="e.g. 5000"
                    />
                    <Button variant="contained" startIcon={savingBudget === 'global' ? <CircularProgress size={14} color="inherit" /> : <Save />}
                      onClick={handleSaveGlobalBudget} disabled={savingBudget === 'global'}>
                      Apply to All Agents
                    </Button>
                  </Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1.5 }}>
                    Setting this will override budgets for all agents without a custom limit. Agents with individual budgets are unaffected.
                  </Typography>
                </Paper>

                {/* Per-Agent Budget Table */}
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAdd sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Per-Agent Custom Budgets</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', ml: 1 }}>Override the global budget for specific agents</Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                          {['Agent', 'Area', 'Current Budget', 'Set Custom Budget', ''].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {agents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>No agents found</TableCell>
                          </TableRow>
                        )}
                        {agents.map(agent => {
                          const aid = agent.agentId || agent._id
                          const existing = budgets.find(b => b.agentId === aid && !b.isGlobal)
                          return (
                            <TableRow key={aid} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell>
                                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{agent.name}</Typography>
                                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{agent.phone}</Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{agent.assignedArea || '—'}</TableCell>
                              <TableCell>
                                {existing
                                  ? <Chip label={fmt(existing.monthlyLimit)} size="small" color="primary" sx={{ fontSize: 11 }} />
                                  : <Chip label="Using global" size="small" variant="outlined" sx={{ fontSize: 11 }} />
                                }
                              </TableCell>
                              <TableCell sx={{ minWidth: 200 }}>
                                <TextField
                                  size="small" type="number" placeholder="Custom limit"
                                  value={agentBudgets[aid] || ''}
                                  onChange={e => setAgentBudgets(prev => ({ ...prev, [aid]: e.target.value }))}
                                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                  sx={{ width: 180 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant="outlined"
                                  startIcon={savingBudget === aid ? <CircularProgress size={12} color="inherit" /> : <Save sx={{ fontSize: 14 }} />}
                                  disabled={savingBudget === aid}
                                  onClick={() => handleSaveAgentBudget(aid)}>
                                  Save
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Budget summary */}
                {budgets.filter(b => !b.isGlobal).length > 0 && (
                  <Paper elevation={0} sx={{ mt: 2.5, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1.5 }}>Custom Budget Overview</Typography>
                    <Grid container spacing={1.5}>
                      {budgets.filter(b => !b.isGlobal).map(b => (
                        <Grid item xs={6} sm={4} md={3} key={b.agentId}>
                          <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{b.agentName || b.agentId}</Typography>
                            <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>{fmt(b.monthlyLimit)}/mo</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}
              </>
            )
          }
        </>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Expense</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth size="small" label="Reason for rejection"
            value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            multiline rows={3} sx={{ mt: 1 }}
            placeholder="e.g. Missing receipts, amount exceeds policy limit…" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRejectDialog({ open: false, id: null }); setRejectReason('') }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={actioning === rejectDialog.id}>
            {actioning === rejectDialog.id ? <CircularProgress size={14} color="inherit" /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}