import { useState, useEffect } from 'react'
import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/agent/staff`,
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("agentToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  IconButton, Chip, Avatar, InputAdornment, Tooltip, Breadcrumbs, Link,
  useMediaQuery, useTheme, Card, CardContent, Grid
} from '@mui/material'
import {
  Add, Edit, Delete, Search, Close, Badge, NavigateNext,
  FilterList, Download, Visibility
} from '@mui/icons-material'

const DESIGNATIONS = ['Medical Representative', 'Senior MR', 'Area Manager', 'Regional Manager', 'Zonal Manager', 'Sales Officer', 'Other']
const DEPARTMENTS  = ['Sales', 'Marketing', 'Field Operations', 'HR', 'Finance', 'Other']
const STATUSES     = ['Active', 'Inactive', 'On Leave']
const STATUS_COLORS = { Active: 'success', Inactive: 'error', 'On Leave': 'warning' }

const initForm = {
  name: '', designation: '', designationOther: '',
  department: '', departmentOther: '',
  joiningDate: '', status: 'Active', salary: '',
  zone: '', phone: ''
}

const initErrors = {
  name: '', designation: '', designationOther: '',
  department: '', departmentOther: '',
  joiningDate: '', salary: '', zone: '', phone: ''
}

export default function Appointment() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isMd     = useMediaQuery(theme.breakpoints.down('md'))

  const [rows, setRows]         = useState([])
  const [search, setSearch]     = useState('')
  const [open, setOpen]         = useState(false)
  const [form, setForm]         = useState(initForm)
  const [errors, setErrors]     = useState(initErrors)
  const [editId, setEditId]     = useState(null)
  const [viewRow, setViewRow]   = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    try {
      const res = await API.get("/")
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
      setRows([])
    }
  }

  const resolvedForm = () => ({
    ...form,
    designation: form.designation === 'Other' ? form.designationOther : form.designation,
    department:  form.department  === 'Other' ? form.departmentOther  : form.department,
  })

  const filtered = rows.filter(r =>
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.empId || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.designation || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm(initForm); setErrors(initErrors); setEditId(null); setOpen(true) }
  const openEdit = (row) => {
    const knownDes = DESIGNATIONS.slice(0, -1).includes(row.designation)
    const knownDep = DEPARTMENTS.slice(0, -1).includes(row.department)
    setForm({
      ...row,
      designation:      knownDes ? row.designation : 'Other',
      designationOther: knownDes ? '' : row.designation,
      department:       knownDep ? row.department  : 'Other',
      departmentOther:  knownDep ? '' : row.department,
      zone:  row.zone  || '',
      phone: row.phone || '',
    })
    setErrors(initErrors)
    setEditId(row._id)
    setOpen(true)
  }

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const errs = { ...initErrors }
    let ok = true

    if (!form.name.trim()) {
      errs.name = 'Full name is required'; ok = false
    } else if (!/^[A-Za-z\s]+$/.test(form.name.trim())) {
      errs.name = 'Only letters are allowed'; ok = false
    }

    if (!form.designation) {
      errs.designation = 'Designation is required'; ok = false
    }
    if (form.designation === 'Other' && !form.designationOther.trim()) {
      errs.designationOther = 'Please specify designation'; ok = false
    }

    if (!form.department) {
      errs.department = 'Department is required'; ok = false
    }
    if (form.department === 'Other' && !form.departmentOther.trim()) {
      errs.departmentOther = 'Please specify department'; ok = false
    }

    if (!form.zone.trim()) {
      errs.zone = 'Zone is required'; ok = false
    } else if (!/^[A-Za-z\s\-/]+$/.test(form.zone.trim())) {
      errs.zone = 'Only letters are allowed'; ok = false
    }

    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required'; ok = false
    } else if (!/^\d{10,15}$/.test(form.phone.trim())) {
      errs.phone = 'Enter a valid phone number (10–15 digits)'; ok = false
    }

    if (!form.joiningDate) {
      errs.joiningDate = 'Joining date is required'; ok = false
    }

    if (!form.salary.trim()) {
      errs.salary = 'Salary is required'; ok = false
    } else if (!/^[\d,₹\s.]+$/.test(form.salary.trim())) {
      errs.salary = 'Enter a valid salary (numbers only)'; ok = false
    }

    setErrors(errs)
    return ok
  }

  const handleSave = async () => {
    if (!validate()) return
    const data = resolvedForm()
    try {
      editId ? await API.put(`/${editId}`, data) : await API.post("/", data)
      fetchStaff()
      setOpen(false)
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => {
    try {
      await API.delete(`/${deleteId}`)
      fetchStaff()
      setDeleteId(null)
    } catch (err) { console.error(err) }
  }

  // ── Field handlers with inline validation ────────────────────
  const handleNameChange = (e) => {
    const val = e.target.value.replace(/[^A-Za-z\s]/g, '')
    setForm(p => ({ ...p, name: val }))
    setErrors(p => ({ ...p, name: val.trim() ? '' : 'Full name is required' }))
  }

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 15)
    setForm(p => ({ ...p, phone: val }))
    if (!val) setErrors(p => ({ ...p, phone: 'Phone number is required' }))
    else if (val.length < 10) setErrors(p => ({ ...p, phone: 'Minimum 10 digits required' }))
    else setErrors(p => ({ ...p, phone: '' }))
  }

  const handleZoneChange = (e) => {
    const val = e.target.value.replace(/[^A-Za-z\s\-/]/g, '')
    setForm(p => ({ ...p, zone: val }))
    setErrors(p => ({ ...p, zone: val.trim() ? '' : 'Zone is required' }))
  }

  const handleSalaryChange = (e) => {
    const val = e.target.value.replace(/[^0-9,₹\s.]/g, '')
    setForm(p => ({ ...p, salary: val }))
    setErrors(p => ({ ...p, salary: val.trim() ? '' : 'Salary is required' }))
  }

  const StatCard = ({ label, value, color }) => (
    <Card sx={{ flex: 1, minWidth: 130, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
        <Typography variant="h4" fontWeight={800} color={color} mt={0.5}>{value}</Typography>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>

      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="#" sx={{ fontSize: 13 }}>HR & Staff</Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>Appointment / Designation</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.2, bgcolor: '#1d4ed8', borderRadius: 2, display: 'flex' }}>
            <Badge sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a">Appointment / Designation</Typography>
            <Typography variant="body2" color="text.secondary">Manage staff appointments and designations</Typography>
          </Box>
        </Box>
        <Box sx={{ ml: { sm: 'auto' }, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Download />} size="small" sx={{ borderRadius: 2 }}>Export</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}
            sx={{ borderRadius: 2, bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}>
            Add Staff
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total Staff" value={rows.length}                                          color="#1d4ed8" />
        <StatCard label="Active"      value={rows.filter(r => r.status === 'Active').length}       color="#16a34a" />
        <StatCard label="On Leave"    value={rows.filter(r => r.status === 'On Leave').length}     color="#d97706" />
        <StatCard label="Inactive"    value={rows.filter(r => r.status === 'Inactive').length}     color="#dc2626" />
      </Box>

      <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9' }}>
          <TextField size="small" placeholder="Search by name, ID, designation…"
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
          />
          <Tooltip title="Filter"><IconButton size="small"><FilterList /></IconButton></Tooltip>
        </Box>

        {isMobile ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(row => (
              <Card key={row._id} sx={{ borderRadius: 2, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#1d4ed8', width: 40, height: 40, fontSize: 15, fontWeight: 700 }}>
                      {row.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700} fontSize={14}>{row.name}</Typography>
                      <Typography fontSize={12} color="text.secondary">{row.empId}</Typography>
                    </Box>
                    <Chip label={row.status} size="small" color={STATUS_COLORS[row.status]} />
                  </Box>
                  <Grid container spacing={1} sx={{ mb: 1.5 }}>
                    <Grid item xs={6}><Typography fontSize={11} color="text.secondary">Designation</Typography><Typography fontSize={12} fontWeight={600}>{row.designation}</Typography></Grid>
                    <Grid item xs={6}><Typography fontSize={11} color="text.secondary">Department</Typography><Typography fontSize={12} fontWeight={600}>{row.department}</Typography></Grid>
                    <Grid item xs={6}><Typography fontSize={11} color="text.secondary">Zone</Typography><Typography fontSize={12} fontWeight={600}>{row.zone || '—'}</Typography></Grid>
                    <Grid item xs={6}><Typography fontSize={11} color="text.secondary">Phone</Typography><Typography fontSize={12} fontWeight={600}>{row.phone || '—'}</Typography></Grid>
                    <Grid item xs={6}><Typography fontSize={11} color="text.secondary">Joining Date</Typography><Typography fontSize={12} fontWeight={600}>{row.joiningDate}</Typography></Grid>
                    <Grid item xs={6}><Typography fontSize={11} color="text.secondary">Salary</Typography><Typography fontSize={12} fontWeight={600}>{row.salary}</Typography></Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => setViewRow(row)} sx={{ bgcolor: '#f0f9ff', color: '#0ea5e9' }}><Visibility fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => openEdit(row)} sx={{ bgcolor: '#f0fdf4', color: '#16a34a' }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDeleteId(row._id)} sx={{ bgcolor: '#fef2f2', color: '#dc2626' }}><Delete fontSize="small" /></IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size={isMd ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Emp ID','Name','Designation','Department','Zone','Phone','Joining Date','Salary','Status','Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => (
                  <TableRow key={row._id} hover>
                    <TableCell><Chip label={row.empId} size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 11 }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1d4ed8', fontSize: 12, fontWeight: 700 }}>
                          {row.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </Avatar>
                        <Typography fontWeight={600} fontSize={13}>{row.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography fontSize={13}>{row.designation}</Typography></TableCell>
                    <TableCell><Typography fontSize={13}>{row.department}</Typography></TableCell>
                    <TableCell><Typography fontSize={13}>{row.zone || '—'}</Typography></TableCell>
                    <TableCell><Typography fontSize={13}>{row.phone || '—'}</Typography></TableCell>
                    <TableCell><Typography fontSize={13}>{row.joiningDate}</Typography></TableCell>
                    <TableCell><Typography fontSize={13} fontWeight={600}>{row.salary}</Typography></TableCell>
                    <TableCell><Chip label={row.status} size="small" color={STATUS_COLORS[row.status]} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View"><IconButton size="small" onClick={() => setViewRow(row)} sx={{ color: '#0ea5e9' }}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)} sx={{ color: '#16a34a' }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(row._id)} sx={{ color: '#dc2626' }}><Delete fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6, color: '#94a3b8' }}>No records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, pb: 1 }}>
          {editId ? 'Edit Appointment' : 'Add New Staff'}
          <IconButton onClick={() => setOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>

            {/* Name — letters only */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Full Name *" value={form.name} onChange={handleNameChange}
                size="small" required
                error={!!errors.name} helperText={errors.name || 'Letters only'}
                inputProps={{ inputMode: 'text' }}
              />
            </Grid>

            {/* Phone — digits only */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Phone Number *" value={form.phone} onChange={handlePhoneChange}
                size="small" required
                error={!!errors.phone} helperText={errors.phone || '10–15 digits only'}
                inputProps={{ inputMode: 'numeric', maxLength: 15 }}
              />
            </Grid>

            {/* Designation */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={!!errors.designation} required>
                <InputLabel>Designation *</InputLabel>
                <Select value={form.designation} label="Designation *"
                  onChange={e => { setForm(p => ({ ...p, designation: e.target.value, designationOther: '' })); setErrors(p => ({ ...p, designation: '' })) }}>
                  {DESIGNATIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
                {errors.designation && <Typography color="error" fontSize={11} sx={{ mt: 0.5, ml: 1.5 }}>{errors.designation}</Typography>}
              </FormControl>
            </Grid>
            {form.designation === 'Other' && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Specify Designation *" size="small" value={form.designationOther}
                  onChange={e => { setForm(p => ({ ...p, designationOther: e.target.value })); setErrors(p => ({ ...p, designationOther: e.target.value.trim() ? '' : 'Required' })) }}
                  required error={!!errors.designationOther} helperText={errors.designationOther} />
              </Grid>
            )}

            {/* Department */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={!!errors.department} required>
                <InputLabel>Department *</InputLabel>
                <Select value={form.department} label="Department *"
                  onChange={e => { setForm(p => ({ ...p, department: e.target.value, departmentOther: '' })); setErrors(p => ({ ...p, department: '' })) }}>
                  {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
                {errors.department && <Typography color="error" fontSize={11} sx={{ mt: 0.5, ml: 1.5 }}>{errors.department}</Typography>}
              </FormControl>
            </Grid>
            {form.department === 'Other' && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Specify Department *" size="small" value={form.departmentOther}
                  onChange={e => { setForm(p => ({ ...p, departmentOther: e.target.value })); setErrors(p => ({ ...p, departmentOther: e.target.value.trim() ? '' : 'Required' })) }}
                  required error={!!errors.departmentOther} helperText={errors.departmentOther} />
              </Grid>
            )}

            {/* Zone — letters only */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Zone *" value={form.zone} onChange={handleZoneChange}
                size="small" required
                error={!!errors.zone} helperText={errors.zone || 'e.g. North, South-West'}
                inputProps={{ inputMode: 'text' }}
              />
            </Grid>

            {/* Joining Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Joining Date *" type="date" value={form.joiningDate}
                onChange={e => { setForm(p => ({ ...p, joiningDate: e.target.value })); setErrors(p => ({ ...p, joiningDate: e.target.value ? '' : 'Joining date is required' })) }}
                size="small" InputLabelProps={{ shrink: true }}
                required error={!!errors.joiningDate} helperText={errors.joiningDate}
              />
            </Grid>

            {/* Salary — numbers/symbols only */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Salary *" value={form.salary} onChange={handleSalaryChange}
                size="small" required
                error={!!errors.salary} helperText={errors.salary || 'e.g. ₹35000'}
                inputProps={{ inputMode: 'numeric' }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status"
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2, bgcolor: '#1d4ed8' }}>
            {editId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          Staff Details <IconButton onClick={() => setViewRow(null)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 1 }}>
              <Avatar sx={{ width: 72, height: 72, bgcolor: '#1d4ed8', fontSize: 26, fontWeight: 700 }}>
                {viewRow.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
              </Avatar>
              <Typography fontWeight={800} fontSize={18}>{viewRow.name}</Typography>
              <Chip label={viewRow.status} color={STATUS_COLORS[viewRow.status]} />
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  ['Emp ID', viewRow.empId],
                  ['Designation', viewRow.designation],
                  ['Department', viewRow.department],
                  ['Zone', viewRow.zone],
                  ['Phone', viewRow.phone],
                  ['Joining Date', viewRow.joiningDate],
                  ['Salary', viewRow.salary]
                ].map(([k, v]) => (
                  <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography fontSize={13} color="text.secondary">{k}</Typography>
                    <Typography fontSize={13} fontWeight={600}>{v || '—'}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to remove this staff record?</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}