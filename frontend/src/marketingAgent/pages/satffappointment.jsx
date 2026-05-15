import { useState, useEffect, useRef } from 'react'
import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/agent/referrals`,
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
  useMediaQuery, useTheme, Card, CardContent, Grid, Stepper, Step,
  StepLabel, LinearProgress, Divider, Alert
} from '@mui/material'
import {
  Add, Search, Close, NavigateNext, FilterList, Visibility,
  Person, School, ContactPhone, AttachFile, Send, HourglassEmpty,
  CheckCircle, Cancel, Pending
} from '@mui/icons-material'

const QUALIFICATION_LIST = [
  'High School (10th)', 'Intermediate (12th)', 'Diploma',
  'B.Sc', 'B.Com', 'B.A', 'B.Tech / B.E', 'BBA', 'BCA',
  'M.Sc', 'M.Com', 'M.A', 'M.Tech', 'MBA', 'MCA',
  'PhD', 'Other'
]
const STREAMS = ['Science', 'Commerce', 'Arts', 'Engineering', 'Medical', 'Management', 'IT / Computer Science', 'Other']
const RELATIONS = ['Friend', 'Relative', 'Colleague', 'Acquaintance', 'Other']
const GENDER_OPTIONS = ['Male', 'Female', 'Other']

const STATUS_CONFIG = {
  pending:  { color: 'warning', icon: <HourglassEmpty sx={{ fontSize: 14 }} />, label: 'Pending' },
  approved: { color: 'success', icon: <CheckCircle sx={{ fontSize: 14 }} />,    label: 'Approved' },
  rejected: { color: 'error',   icon: <Cancel sx={{ fontSize: 14 }} />,          label: 'Rejected' },
}

const STEPS = ['Personal Info', 'Education Details', 'Contact & Availability', 'Review & Submit']

const initForm = {
  // Personal
  fullName: '', gender: '', dob: '', fatherName: '', motherName: '',
  currentAddress: '', permanentAddress: '',
  // Education
  highestQualification: '', qualificationOther: '',
  stream: '', streamOther: '',
  institution: '', passingYear: '', percentage: '',
  additionalCourses: '',
  // Contact
  phone: '', whatsapp: '', alternatePhone: '',
  email: '', linkedin: '',
  // Referral meta
  relationWithCandidate: '', relationOther: '',
  referralNote: '',
  // Resume (file)
  resumeFile: null, resumeFileName: '',
}

const initErrors = {}

export default function AgentReferral() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const fileRef  = useRef()

  const [rows, setRows]       = useState([])
  const [search, setSearch]   = useState('')
  const [open, setOpen]       = useState(false)
  const [step, setStep]       = useState(0)
  const [form, setForm]       = useState(initForm)
  const [errors, setErrors]   = useState(initErrors)
  const [viewRow, setViewRow] = useState(null)
  const [saving, setSaving]   = useState(false)

  useEffect(() => { fetchReferrals() }, [])

  const fetchReferrals = async () => {
    try {
      const res = await API.get("/")
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
      setRows([])
    }
  }

  const filtered = rows.filter(r =>
    (r.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.phone || '').includes(search) ||
    (r.status || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setForm(initForm); setErrors({}); setStep(0); setOpen(true) }

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const onlyLetters = (val) => val.replace(/[^A-Za-z\s]/g, '')
  const onlyDigits  = (val) => val.replace(/\D/g, '')

  // Step validation
  const validateStep = (s) => {
    const errs = {}
    if (s === 0) {
      if (!form.fullName.trim()) errs.fullName = 'Required'
      if (!form.gender) errs.gender = 'Required'
      if (!form.dob) errs.dob = 'Required'
      if (!form.fatherName.trim()) errs.fatherName = 'Required'
      if (!form.currentAddress.trim()) errs.currentAddress = 'Required'
    }
    if (s === 1) {
      if (!form.highestQualification) errs.highestQualification = 'Required'
      if (form.highestQualification === 'Other' && !form.qualificationOther.trim()) errs.qualificationOther = 'Required'
      if (!form.institution.trim()) errs.institution = 'Required'
      if (!form.passingYear.trim()) errs.passingYear = 'Required'
      if (!form.percentage.trim()) errs.percentage = 'Required'
    }
    if (s === 2) {
      if (!form.phone.trim()) errs.phone = 'Required'
      else if (!/^\d{10,15}$/.test(form.phone)) errs.phone = '10–15 digits'
      if (!form.whatsapp.trim()) errs.whatsapp = 'Required'
      else if (!/^\d{10,15}$/.test(form.whatsapp)) errs.whatsapp = '10–15 digits'
      if (!form.email.trim()) errs.email = 'Required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
      if (!form.relationWithCandidate) errs.relationWithCandidate = 'Required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) setStep(s => s + 1)
  }
  const prevStep = () => setStep(s => s - 1)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return }
    f('resumeFile', file)
    f('resumeFileName', file.name)
  }

  const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);

    reader.onerror = (error) => reject(error);
  });
};

const handleSubmit = async () => {
  setSaving(true);

  try {
    let resumeBase64 = "";

    if (form.resumeFile) {
      resumeBase64 = await convertToBase64(form.resumeFile);
    }

    const payload = {
      ...form,
      resumeFile: undefined,
      resumeBase64,
    };

    await API.post("/", payload);

    fetchReferrals();
    setOpen(false);
  } catch (err) {
    console.error(err);
  } finally {
    setSaving(false);
  }
};

  const StatCard = ({ label, value, color, icon }) => (
    <Card sx={{ flex: 1, minWidth: 120, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `1.5px solid ${color}22` }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ color }}>{icon}</Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
        </Box>
        <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
      </CardContent>
    </Card>
  )

  const Field = ({ label, error, children }) => (
    <Box>
      {children}
      {error && <Typography color="error" fontSize={11} sx={{ mt: 0.3, ml: 1 }}>{error}</Typography>}
    </Box>
  )

  // ── Step content renderers ──────────────────────────────────
  const renderStep0 = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ borderRadius: 2, mb: 1 }}>
          Fill in the candidate's personal details accurately. All fields marked * are required.
        </Alert>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field error={errors.fullName}>
          <TextField fullWidth label="Full Name *" size="small" value={form.fullName}
            onChange={e => f('fullName', onlyLetters(e.target.value))}
            error={!!errors.fullName} helperText="Letters only" />
        </Field>
      </Grid>
      <Grid item xs={12} sm={6}>
  <TextField
    select
    fullWidth
    label="Gender *"
    size="small"
    value={form.gender}
    onChange={e => f('gender', e.target.value)}
    error={!!errors.gender}
    helperText={errors.gender}
  >
    {GENDER_OPTIONS.map((g) => (
      <MenuItem key={g} value={g}>
        {g}
      </MenuItem>
    ))}
  </TextField>
</Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Date of Birth *" type="date" size="small"
          value={form.dob} onChange={e => f('dob', e.target.value)}
          InputLabelProps={{ shrink: true }} error={!!errors.dob} helperText={errors.dob} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Father's Name *" size="small" value={form.fatherName}
          onChange={e => f('fatherName', onlyLetters(e.target.value))}
          error={!!errors.fatherName} helperText={errors.fatherName} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Mother's Name" size="small" value={form.motherName}
          onChange={e => f('motherName', onlyLetters(e.target.value))} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Current Address *" size="small" multiline rows={2}
          value={form.currentAddress} onChange={e => f('currentAddress', e.target.value)}
          error={!!errors.currentAddress} helperText={errors.currentAddress} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Permanent Address (if different)" size="small" multiline rows={2}
          value={form.permanentAddress} onChange={e => f('permanentAddress', e.target.value)} />
      </Grid>
    </Grid>
  )

  const renderStep1 = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small" error={!!errors.highestQualification}>
          <InputLabel>Highest Qualification *</InputLabel>
          <Select value={form.highestQualification} label="Highest Qualification *"
            onChange={e => f('highestQualification', e.target.value)}>
            {QUALIFICATION_LIST.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
          </Select>
          {errors.highestQualification && <Typography color="error" fontSize={11} sx={{ mt: 0.3, ml: 1.5 }}>{errors.highestQualification}</Typography>}
        </FormControl>
      </Grid>
      {form.highestQualification === 'Other' && (
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Specify Qualification *" size="small"
            value={form.qualificationOther} onChange={e => f('qualificationOther', e.target.value)}
            error={!!errors.qualificationOther} helperText={errors.qualificationOther} />
        </Grid>
      )}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Stream / Subject</InputLabel>
          <Select value={form.stream} label="Stream / Subject" onChange={e => f('stream', e.target.value)}>
            {STREAMS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      {form.stream === 'Other' && (
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Specify Stream *" size="small"
            value={form.streamOther} onChange={e => f('streamOther', e.target.value)} />
        </Grid>
      )}
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Institution / College / University *" size="small"
          value={form.institution} onChange={e => f('institution', e.target.value)}
          error={!!errors.institution} helperText={errors.institution} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Passing Year *" size="small"
          value={form.passingYear}
          onChange={e => f('passingYear', onlyDigits(e.target.value).slice(0, 4))}
          error={!!errors.passingYear} helperText={errors.passingYear || 'e.g. 2022'}
          inputProps={{ maxLength: 4 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Percentage / CGPA *" size="small"
          value={form.percentage} onChange={e => f('percentage', e.target.value)}
          error={!!errors.percentage} helperText={errors.percentage || 'e.g. 75% or 7.5 CGPA'} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Additional Courses / Certifications" size="small" multiline rows={2}
          value={form.additionalCourses} onChange={e => f('additionalCourses', e.target.value)}
          helperText="e.g. Tally, MS Office, Digital Marketing, etc." />
      </Grid>

      {/* Resume Upload */}
      <Grid item xs={12}>
        <Divider sx={{ mb: 1.5 }}><Typography variant="caption" color="text.secondary">Resume / CV</Typography></Divider>
        <Box sx={{ border: '2px dashed #cbd5e1', borderRadius: 2, p: 2.5, textAlign: 'center',
          cursor: 'pointer', bgcolor: '#f8fafc', transition: '0.2s',
          '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' } }}
          onClick={() => fileRef.current.click()}>
          <AttachFile sx={{ color: '#64748b', fontSize: 32, mb: 1 }} />
          <Typography variant="body2" fontWeight={600} color="#374151">
            {form.resumeFileName || 'Click to upload Resume / CV'}
          </Typography>
          <Typography variant="caption" color="text.secondary">PDF, DOC, DOCX — Max 5MB</Typography>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={handleFileChange} />
        </Box>
        {form.resumeFileName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 1, bgcolor: '#f0fdf4', borderRadius: 1 }}>
            <AttachFile sx={{ color: '#16a34a', fontSize: 16 }} />
            <Typography fontSize={12} color="#16a34a" fontWeight={600}>{form.resumeFileName}</Typography>
            <IconButton size="small" onClick={() => { f('resumeFile', null); f('resumeFileName', '') }} sx={{ ml: 'auto' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Grid>
    </Grid>
  )

  const renderStep2 = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Mobile Number *" size="small"
          value={form.phone} onChange={e => f('phone', onlyDigits(e.target.value).slice(0, 15))}
          error={!!errors.phone} helperText={errors.phone || '10–15 digits'} inputProps={{ maxLength: 15 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="WhatsApp Number *" size="small"
          value={form.whatsapp} onChange={e => f('whatsapp', onlyDigits(e.target.value).slice(0, 15))}
          error={!!errors.whatsapp} helperText={errors.whatsapp || 'WhatsApp-enabled number'}
          inputProps={{ maxLength: 15 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Alternate Phone" size="small"
          value={form.alternatePhone} onChange={e => f('alternatePhone', onlyDigits(e.target.value).slice(0, 15))}
          helperText="Optional" inputProps={{ maxLength: 15 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Email Address *" size="small" type="email"
          value={form.email} onChange={e => f('email', e.target.value)}
          error={!!errors.email} helperText={errors.email} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="LinkedIn Profile" size="small"
          value={form.linkedin} onChange={e => f('linkedin', e.target.value)}
          helperText="Optional — paste URL" />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ mb: 1.5 }}><Typography variant="caption" color="text.secondary">Your Referral Info</Typography></Divider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small" error={!!errors.relationWithCandidate}>
          <InputLabel>Your Relation with Candidate *</InputLabel>
          <Select value={form.relationWithCandidate} label="Your Relation with Candidate *"
            onChange={e => f('relationWithCandidate', e.target.value)}>
            {RELATIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
          {errors.relationWithCandidate && <Typography color="error" fontSize={11} sx={{ mt: 0.3, ml: 1.5 }}>{errors.relationWithCandidate}</Typography>}
        </FormControl>
      </Grid>
      {form.relationWithCandidate === 'Other' && (
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Specify Relation" size="small"
            value={form.relationOther} onChange={e => f('relationOther', e.target.value)} />
        </Grid>
      )}
      <Grid item xs={12}>
        <TextField fullWidth label="Why are you referring this candidate?" size="small" multiline rows={3}
          value={form.referralNote} onChange={e => f('referralNote', e.target.value)}
          helperText="Tell the admin what makes this candidate suitable" />
      </Grid>
    </Grid>
  )

  const renderStep3 = () => (
    <Box>
      <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
        Please review all details before submitting. Once submitted, admin will review your referral.
      </Alert>
      {[
        { section: ' Personal Info', rows: [
          ['Full Name', form.fullName], ['Gender', form.gender], ['Date of Birth', form.dob],
          ["Father's Name", form.fatherName], ["Mother's Name", form.motherName || '—'],
          ['Current Address', form.currentAddress],
        ]},
        { section: ' Education', rows: [
          ['Qualification', form.highestQualification === 'Other' ? form.qualificationOther : form.highestQualification],
          ['Stream', form.stream === 'Other' ? form.streamOther : (form.stream || '—')],
          ['Institution', form.institution], ['Passing Year', form.passingYear], ['Percentage', form.percentage],
          ['Extra Courses', form.additionalCourses || '—'],
          ['Resume', form.resumeFileName || 'Not uploaded'],
        ]},
        { section: ' Contact', rows: [
          ['Mobile', form.phone], ['WhatsApp', form.whatsapp],
          ['Alternate', form.alternatePhone || '—'], ['Email', form.email],
          ['LinkedIn', form.linkedin || '—'],
        ]},
        { section: ' Referral', rows: [
          ['Relation', form.relationWithCandidate === 'Other' ? form.relationOther : form.relationWithCandidate],
          ['Note', form.referralNote || '—'],
        ]},
      ].map(({ section, rows: srows }) => (
        <Box key={section} sx={{ mb: 2 }}>
          <Typography fontWeight={700} fontSize={13} color="#1d4ed8" sx={{ mb: 1 }}>{section}</Typography>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {srows.map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', px: 2, py: 1, borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
                <Typography fontSize={12} color="text.secondary" sx={{ width: 130, minWidth: 130 }}>{k}</Typography>
                <Typography fontSize={12} fontWeight={600} sx={{ wordBreak: 'break-word' }}>{v}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      ))}
    </Box>
  )

  const steps_content = [renderStep0, renderStep1, renderStep2, renderStep3]

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>

      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="#" sx={{ fontSize: 13 }}>HR & Staff</Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>Candidate Referrals</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.2, bgcolor: '#1d4ed8', borderRadius: 2, display: 'flex' }}>
            <Send sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a">Candidate Referrals</Typography>
            <Typography variant="body2" color="text.secondary">Refer a candidate — admin will review & approve</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd} sx={{ ml: { sm: 'auto' }, borderRadius: 2, bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}>
          Refer a Candidate
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total Referred"  value={rows.length}                                           color="#1d4ed8" icon={<Person />} />
        <StatCard label="Pending"         value={rows.filter(r => r.status === 'pending').length}        color="#d97706" icon={<HourglassEmpty />} />
        <StatCard label="Approved"        value={rows.filter(r => r.status === 'approved').length}       color="#16a34a" icon={<CheckCircle />} />
        <StatCard label="Rejected"        value={rows.filter(r => r.status === 'rejected').length}       color="#dc2626" icon={<Cancel />} />
      </Box>

      {/* Info Banner */}
      <Alert severity="info" icon={<Send />} sx={{ mb: 3, borderRadius: 3 }}>
        <Typography fontWeight={700} fontSize={13}>How Referrals Work</Typography>
        <Typography fontSize={12}>You can refer suitable candidates with their complete details. Admin reviews each referral and approves or rejects it. Approved candidates are added to the marketing team.</Typography>
      </Alert>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <TextField size="small" placeholder="Search by name, phone, status…"
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
          />
          <Tooltip title="Filter"><IconButton size="small"><FilterList /></IconButton></Tooltip>
        </Box>

        {isMobile ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(row => {
              const sc = STATUS_CONFIG[row.status] || STATUS_CONFIG.pending
              return (
                <Card key={row._id} sx={{ borderRadius: 2, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#1d4ed8', width: 40, height: 40, fontSize: 15, fontWeight: 700 }}>
                        {row.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700} fontSize={14}>{row.fullName}</Typography>
                        <Typography fontSize={12} color="text.secondary">{row.phone}</Typography>
                      </Box>
                      <Chip icon={sc.icon} label={sc.label} size="small" color={sc.color} />
                    </Box>
                    <Grid container spacing={1} sx={{ mb: 1.5 }}>
                      <Grid item xs={6}><Typography fontSize={11} color="text.secondary">Qualification</Typography><Typography fontSize={12} fontWeight={600}>{row.highestQualification}</Typography></Grid>
                      <Grid item xs={6}><Typography fontSize={11} color="text.secondary">WhatsApp</Typography><Typography fontSize={12} fontWeight={600}>{row.whatsapp}</Typography></Grid>
                      <Grid item xs={6}><Typography fontSize={11} color="text.secondary">Relation</Typography><Typography fontSize={12} fontWeight={600}>{row.relationWithCandidate}</Typography></Grid>
                      <Grid item xs={6}><Typography fontSize={11} color="text.secondary">Referred On</Typography><Typography fontSize={12} fontWeight={600}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}</Typography></Grid>
                      {row.status === 'approved' && row.designation && (
                        <Grid item xs={12}><Chip label={`Designation: ${row.designation}`} size="small" color="success" variant="outlined" /></Grid>
                      )}
                      {row.status === 'rejected' && row.rejectionReason && (
                        <Grid item xs={12}><Typography fontSize={11} color="error">Reason: {row.rejectionReason}</Typography></Grid>
                      )}
                    </Grid>
                    <IconButton size="small" onClick={() => setViewRow(row)} sx={{ bgcolor: '#f0f9ff', color: '#0ea5e9' }}><Visibility fontSize="small" /></IconButton>
                  </CardContent>
                </Card>
              )
            })}
            {filtered.length === 0 && <Box sx={{ py: 6, textAlign: 'center', color: '#94a3b8' }}>No referrals yet. Click "Refer a Candidate" to start.</Box>}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Candidate', 'Contact', 'WhatsApp', 'Qualification', 'Relation', 'Referred On', 'Status', 'Designation', 'Action'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => {
                  const sc = STATUS_CONFIG[row.status] || STATUS_CONFIG.pending
                  return (
                    <TableRow key={row._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: '#1d4ed8', fontSize: 11, fontWeight: 700 }}>
                            {row.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600} fontSize={13}>{row.fullName}</Typography>
                            <Typography fontSize={11} color="text.secondary">{row.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography fontSize={13}>{row.phone}</Typography></TableCell>
                      <TableCell><Typography fontSize={13}>{row.whatsapp}</Typography></TableCell>
                      <TableCell><Typography fontSize={13}>{row.highestQualification === 'Other' ? row.qualificationOther : row.highestQualification}</Typography></TableCell>
                      <TableCell><Typography fontSize={13}>{row.relationWithCandidate}</Typography></TableCell>
                      <TableCell><Typography fontSize={12} color="text.secondary">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}</Typography></TableCell>
                      <TableCell><Chip icon={sc.icon} label={sc.label} size="small" color={sc.color} /></TableCell>
                      <TableCell>
                        {row.status === 'approved' && row.designation
                          ? <Chip label={row.designation} size="small" color="success" variant="outlined" sx={{ fontSize: 11 }} />
                          : <Typography fontSize={12} color="text.secondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details"><IconButton size="small" onClick={() => setViewRow(row)} sx={{ color: '#0ea5e9' }}><Visibility fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8' }}>No referrals yet. Click "Refer a Candidate" to get started.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── ADD REFERRAL DIALOG ── */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>
          <Box>
            <Typography fontWeight={800} fontSize={17}>Refer a Candidate</Typography>
            <Typography fontSize={12} color="text.secondary">Step {step + 1} of {STEPS.length}: {STEPS[step]}</Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>

        {/* Stepper */}
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Stepper activeStep={step} alternativeLabel={!isMobile}>
            {STEPS.map((label, i) => (
              <Step key={label} completed={i < step}>
                <StepLabel><Typography fontSize={11}>{label}</Typography></StepLabel>
              </Step>
            ))}
          </Stepper>
          <LinearProgress variant="determinate" value={((step) / (STEPS.length - 1)) * 100}
            sx={{ mt: 1.5, borderRadius: 2, height: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#1d4ed8' } }} />
        </Box>

        <DialogContent sx={{ pt: 2 }}>
          {steps_content[step]()}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          {step > 0 && <Button onClick={prevStep} variant="outlined" sx={{ borderRadius: 2 }}>Back</Button>}
          {step < STEPS.length - 1
            ? <Button onClick={nextStep} variant="contained" sx={{ borderRadius: 2, bgcolor: '#1d4ed8' }}>Next →</Button>
            : <Button onClick={handleSubmit} disabled={saving} variant="contained" startIcon={<Send />}
                sx={{ borderRadius: 2, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
                {saving ? 'Submitting…' : 'Submit Referral'}
              </Button>
          }
        </DialogActions>
      </Dialog>

      {/* ── VIEW DIALOG ── */}
      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          Referral Details <IconButton onClick={() => setViewRow(null)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: '#1d4ed8', fontSize: 22, fontWeight: 700 }}>
                  {viewRow.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Avatar>
                <Box>
                  <Typography fontWeight={800} fontSize={18}>{viewRow.fullName}</Typography>
                  <Chip icon={(STATUS_CONFIG[viewRow.status] || STATUS_CONFIG.pending).icon}
                    label={(STATUS_CONFIG[viewRow.status] || STATUS_CONFIG.pending).label}
                    size="small" color={(STATUS_CONFIG[viewRow.status] || STATUS_CONFIG.pending).color} sx={{ mt: 0.5 }} />
                </Box>
              </Box>
              {[
                [' Personal', [
                  ['Gender', viewRow.gender], ['Date of Birth', viewRow.dob],
                  ["Father's Name", viewRow.fatherName], ["Mother's Name", viewRow.motherName || '—'],
                  ['Address', viewRow.currentAddress],
                ]],
                [' Education', [
                  ['Qualification', viewRow.highestQualification === 'Other' ? viewRow.qualificationOther : viewRow.highestQualification],
                  ['Stream', viewRow.stream || '—'], ['Institution', viewRow.institution],
                  ['Year', viewRow.passingYear], ['Percentage', viewRow.percentage],
                  ['Courses', viewRow.additionalCourses || '—'],
                  ['Resume', viewRow.resumeUrl ? 'Uploaded ✓' : 'Not uploaded'],
                ]],
                [' Contact', [
                  ['Mobile', viewRow.phone], ['WhatsApp', viewRow.whatsapp],
                  ['Alternate', viewRow.alternatePhone || '—'], ['Email', viewRow.email],
                  ['LinkedIn', viewRow.linkedin || '—'],
                ]],
                [' Referral', [
                  ['Relation', viewRow.relationWithCandidate],
                  ['Note', viewRow.referralNote || '—'],
                ]],
              ].map(([section, srows]) => (
                <Box key={section} sx={{ mb: 2 }}>
                  <Typography fontWeight={700} fontSize={12} color="#1d4ed8" sx={{ mb: 0.8 }}>{section}</Typography>
                  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    {srows.map(([k, v]) => (
                      <Box key={k} sx={{ display: 'flex', px: 2, py: 0.8, borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
                        <Typography fontSize={12} color="text.secondary" sx={{ width: 120, minWidth: 120 }}>{k}</Typography>
                        <Typography fontSize={12} fontWeight={600} sx={{ wordBreak: 'break-word' }}>{v}</Typography>
                      </Box>
                    ))}
                  </Paper>
                </Box>
              ))}
              {viewRow.status === 'approved' && viewRow.designation && (
                <Alert severity="success" sx={{ borderRadius: 2, mt: 1 }}>
                   Approved with designation: <strong>{viewRow.designation}</strong>
                </Alert>
              )}
              {viewRow.status === 'rejected' && viewRow.rejectionReason && (
                <Alert severity="error" sx={{ borderRadius: 2, mt: 1 }}>
                   Rejected: {viewRow.rejectionReason}
                </Alert>
              )}
              {viewRow.resumeUrl && (
                <Button variant="outlined" startIcon={<AttachFile />} href={viewRow.resumeUrl} target="_blank" sx={{ mt: 2, borderRadius: 2 }}>
                  Download Resume
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}