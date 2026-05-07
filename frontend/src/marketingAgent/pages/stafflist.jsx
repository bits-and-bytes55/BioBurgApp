import { useState, useEffect } from 'react'
import axios from "axios"
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  IconButton, Chip, Avatar, InputAdornment, Tooltip, Breadcrumbs, Link,
  useMediaQuery, useTheme, Card, CardContent, Grid
} from '@mui/material'
import {
  Add, Edit, Delete, Search, Close, NavigateNext, People,
  Download, Visibility, Phone, LocationOn, WorkHistory, GridView, TableRows
} from '@mui/icons-material'

const API = axios.create({ baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/agent/staff` })
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("agentToken")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const DESIGNATIONS = ['Medical Representative','Senior MR','Area Manager','Regional Manager','Zonal Manager','Sales Officer','Other']
const DEPARTMENTS  = ['Sales','Marketing','Field Operations','HR','Finance','Other']
const STATUS_COLORS = { Active: 'success', Inactive: 'error', 'On Leave': 'warning' }

const initForm = {
  name: '', designation: '', designationOther: '',
  department: '', departmentOther: '',
  phone: '', email: '', area: '',
  joiningDate: '', status: 'Active', salary: ''
}

const initErrors = {
  name: '', designation: '', designationOther: '',
  department: '', departmentOther: '',
  phone: '', email: '', area: '',
  joiningDate: '', salary: ''
}

export default function StaffList() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isMd     = useMediaQuery(theme.breakpoints.down('md'))

  const [rows, setRows]                 = useState([])
  const [search, setSearch]             = useState('')
  const [deptFilter, setDeptFilter]     = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [open, setOpen]                 = useState(false)
  const [form, setForm]                 = useState(initForm)
  const [errors, setErrors]             = useState(initErrors)
  const [editId, setEditId]             = useState(null)
  const [viewRow, setViewRow]           = useState(null)
  const [deleteId, setDeleteId]         = useState(null)
  const [viewMode, setViewMode]         = useState('grid')

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    try {
      const res = await API.get("/")
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch (err) { console.error(err); setRows([]) }
  }

  const resolvedForm = () => ({
    ...form,
    designation: form.designation === 'Other' ? form.designationOther : form.designation,
    department:  form.department  === 'Other' ? form.departmentOther  : form.department,
  })

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = (r.name||'').toLowerCase().includes(q) || (r.empId||'').toLowerCase().includes(q) || (r.area||'').toLowerCase().includes(q)
    const matchDept   = deptFilter === 'All' || r.department === deptFilter
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    return matchSearch && matchDept && matchStatus
  })

  const openAdd  = () => { setForm(initForm); setErrors(initErrors); setEditId(null); setOpen(true) }
  const openEdit = (row) => {
    const knownDes = DESIGNATIONS.slice(0,-1).includes(row.designation)
    const knownDep = DEPARTMENTS.slice(0,-1).includes(row.department)
    setForm({
      ...row,
      designation:      knownDes ? row.designation : 'Other',
      designationOther: knownDes ? '' : (row.designation || ''),
      department:       knownDep ? row.department  : 'Other',
      departmentOther:  knownDep ? '' : (row.department || ''),
    })
    setErrors(initErrors)
    setEditId(row._id); setOpen(true)
  }

  // ── Validation ────────────────────────────────────────────────
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

    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required'; ok = false
    } else if (!/^\d{10,15}$/.test(form.phone.trim())) {
      errs.phone = 'Enter 10–15 digits only'; ok = false
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address'; ok = false
    }

    if (!form.area.trim()) {
      errs.area = 'Area / Territory is required'; ok = false
    } else if (!/^[A-Za-z\s\-/,]+$/.test(form.area.trim())) {
      errs.area = 'Only letters are allowed'; ok = false
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
      fetchStaff(); setOpen(false)
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => {
    try {
      await API.delete(`/${deleteId}`)
      fetchStaff(); setDeleteId(null)
    } catch (err) { console.error(err) }
  }

  // ── Field handlers ─────────────────────────────────────────────
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

  const handleEmailChange = (e) => {
    const val = e.target.value
    setForm(p => ({ ...p, email: val }))
    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) setErrors(p => ({ ...p, email: 'Invalid email' }))
    else setErrors(p => ({ ...p, email: '' }))
  }

  const handleAreaChange = (e) => {
    const val = e.target.value.replace(/[^A-Za-z\s\-/,]/g, '')
    setForm(p => ({ ...p, area: val }))
    setErrors(p => ({ ...p, area: val.trim() ? '' : 'Area is required' }))
  }

  const handleSalaryChange = (e) => {
    const val = e.target.value.replace(/[^0-9,₹\s.]/g, '')
    setForm(p => ({ ...p, salary: val }))
    setErrors(p => ({ ...p, salary: val.trim() ? '' : 'Salary is required' }))
  }

  const StaffCard = ({ row }) => (
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 52, height: 52, bgcolor: '#1d4ed8', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
            {row.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} fontSize={14} noWrap>{row.name}</Typography>
            <Typography fontSize={12} color="text.secondary" noWrap>{row.designation}</Typography>
            <Chip label={row.empId} size="small" sx={{ mt: 0.5, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 10 }} />
          </Box>
          <Chip label={row.status} size="small" color={STATUS_COLORS[row.status]} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkHistory sx={{ fontSize: 13, color: '#94a3b8' }} />
            <Typography fontSize={12} color="text.secondary">{row.department || '—'}</Typography>
          </Box>
          {row.area && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ fontSize: 13, color: '#94a3b8' }} />
            <Typography fontSize={12} color="text.secondary">{row.area}</Typography>
          </Box>}
          {row.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone sx={{ fontSize: 13, color: '#94a3b8' }} />
            <Typography fontSize={12} color="text.secondary">{row.phone}</Typography>
          </Box>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <IconButton size="small" onClick={() => setViewRow(row)} sx={{ bgcolor: '#f0f9ff', color: '#0ea5e9' }}><Visibility fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => openEdit(row)} sx={{ bgcolor: '#f0fdf4', color: '#16a34a' }}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setDeleteId(row._id)} sx={{ bgcolor: '#fef2f2', color: '#dc2626' }}><Delete fontSize="small" /></IconButton>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>

      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="#" sx={{ fontSize: 13 }}>HR & Staff</Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>Staff List</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.2, bgcolor: '#1d4ed8', borderRadius: 2, display: 'flex' }}><People sx={{ color: 'white', fontSize: 24 }} /></Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a">Staff List</Typography>
            <Typography variant="body2" color="text.secondary">{rows.length} total staff members</Typography>
          </Box>
        </Box>
        <Box sx={{ ml: { sm: 'auto' }, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => setViewMode(v => v === 'grid' ? 'table' : 'grid')}
            sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2 }}>
            {viewMode === 'grid' ? <TableRows /> : <GridView />}
          </IconButton>
          <Button variant="outlined" startIcon={<Download />} size="small" sx={{ borderRadius: 2 }}>Export</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd} sx={{ borderRadius: 2, bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}>Add Staff</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search name, ID, area…" value={search} onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Department</InputLabel>
          <Select value={deptFilter} label="Department" onChange={e => setDeptFilter(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="All">All Depts</MenuItem>
            {DEPARTMENTS.slice(0,-1).map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
            {['All','Active','Inactive','On Leave'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Paper>

      {viewMode === 'grid' ? (
        <Grid container spacing={2.5}>
          {filtered.map(row => (
            <Grid item xs={12} sm={6} lg={4} key={row._id}><StaffCard row={row} /></Grid>
          ))}
          {filtered.length === 0 && (
            <Grid item xs={12}><Box sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}><People sx={{ fontSize: 60, opacity: 0.3 }} /><Typography mt={2}>No staff found</Typography></Box></Grid>
          )}
        </Grid>
      ) : (
        <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <TableContainer>
            <Table size={isMd ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Emp ID','Name','Designation','Department','Area','Phone','Status','Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => (
                  <TableRow key={row._id} hover>
                    <TableCell><Chip label={row.empId} size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 11 }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: '#1d4ed8', fontSize: 11, fontWeight: 700 }}>{row.name?.split(' ').map(n => n[0]).join('').slice(0,2)}</Avatar>
                        <Typography fontSize={13} fontWeight={600}>{row.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{row.designation}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{row.department}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{row.area || '—'}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{row.phone || '—'}</TableCell>
                    <TableCell><Chip label={row.status} size="small" color={STATUS_COLORS[row.status]} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => setViewRow(row)} sx={{ color: '#0ea5e9' }}><Visibility fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: '#16a34a' }}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteId(row._id)} sx={{ color: '#dc2626' }}><Delete fontSize="small" /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>No staff found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          {editId ? 'Edit Staff' : 'Add New Staff'} <IconButton onClick={() => setOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>

            {/* Name — letters only */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name *" size="small" value={form.name}
                onChange={handleNameChange} required
                error={!!errors.name} helperText={errors.name || 'Letters only'} />
            </Grid>

            {/* Phone — digits only */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone *" size="small" value={form.phone || ''}
                onChange={handlePhoneChange} required
                error={!!errors.phone} helperText={errors.phone || '10–15 digits only'}
                inputProps={{ inputMode: 'numeric', maxLength: 15 }} />
            </Grid>

            {/* Email — format validated */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" size="small" value={form.email || ''}
                onChange={handleEmailChange}
                error={!!errors.email} helperText={errors.email || 'Optional'} />
            </Grid>

            {/* Area — letters only */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Area / Territory *" size="small" value={form.area || ''}
                onChange={handleAreaChange} required
                error={!!errors.area} helperText={errors.area || 'Letters only'} />
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

            {/* Joining Date */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Joining Date *" type="date" size="small" value={form.joiningDate || ''}
                onChange={e => { setForm(p => ({ ...p, joiningDate: e.target.value })); setErrors(p => ({ ...p, joiningDate: e.target.value ? '' : 'Required' })) }}
                InputLabelProps={{ shrink: true }} required
                error={!!errors.joiningDate} helperText={errors.joiningDate} />
            </Grid>

            {/* Salary — numbers only */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Salary *" size="small" value={form.salary || ''}
                onChange={handleSalaryChange} required
                error={!!errors.salary} helperText={errors.salary || 'e.g. ₹35000'}
                inputProps={{ inputMode: 'numeric' }} />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {['Active','Inactive','On Leave'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2, bgcolor: '#1d4ed8' }}>{editId ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          Staff Profile <IconButton onClick={() => setViewRow(null)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 1 }}>
              <Avatar sx={{ width: 72, height: 72, bgcolor: '#1d4ed8', fontSize: 26, fontWeight: 700 }}>{viewRow.name?.split(' ').map(n => n[0]).join('').slice(0,2)}</Avatar>
              <Typography fontWeight={800} fontSize={18}>{viewRow.name}</Typography>
              <Typography color="text.secondary" fontSize={13}>{viewRow.designation}</Typography>
              <Chip label={viewRow.status} color={STATUS_COLORS[viewRow.status]} size="small" />
              <Box sx={{ width: '100%', mt: 1 }}>
                {[['Emp ID',viewRow.empId],['Department',viewRow.department],['Area',viewRow.area],['Phone',viewRow.phone],['Email',viewRow.email],['Joining Date',viewRow.joiningDate],['Salary',viewRow.salary]].map(([k, v]) => (
                  <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography fontSize={12} color="text.secondary">{k}</Typography>
                    <Typography fontSize={12} fontWeight={600}>{v || '—'}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Remove Staff</DialogTitle>
        <DialogContent><Typography>Are you sure you want to remove this staff member?</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}