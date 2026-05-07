// pages/NewDCR.jsx
import { useState, useEffect } from 'react'
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Button,
  Stepper, Step, StepLabel, CircularProgress, Alert, FormControl,
  InputLabel, Select, InputAdornment,
} from '@mui/material'
import { CheckCircle } from '@mui/icons-material'
import PageShell from './Pageshell'

// ── Input sanitizers ───────────────────────────────────────────────────────
const onlyNumbers = (v) => v.replace(/[^0-9.]/g, '')
const onlyLetters = (v) => v.replace(/[^a-zA-Z\s\-'.]/g, '')
const onlyAlphaNum = (v) => v.replace(/[^a-zA-Z0-9\s\-'.,/()]/g, '')
const onlyPhone = (v) => v.replace(/[^0-9+\-\s]/g, '')

// ── Options ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  'Responded - Positive', 'Responded - Neutral', 'Responded - Negative',
  'Not Available', 'Follow Up Required', 'No Response', 'Other',
]

const NEXT_ACTIONS = [
  'None Required', 'Follow Up Call', 'Send Samples',
  'Schedule Visit', 'Send Quotation', 'Escalate', 'Other',
]

const PLACE_TYPES = [
  'Hospital', 'Clinic', 'Medical Store', 'Distributor',
  'Diagnostic Centre', 'Path Lab', 'Nursing Home', 'Doctor Chamber',
  'Pharmacy', 'Corporate Office', 'School/College', 'Other',
]

const CONTACT_ROLES = [
  'Doctor', 'Physician', 'Chemist', 'Pharmacist', 'Manager',
  'Purchase Manager', 'Receptionist', 'Nurse', 'Lab Technician',
  'Owner', 'Administrator', 'Other',
]

const steps = ['Visit Details', 'Activity & Products', 'Outcome']

const BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''

const EMPTY_FORM = {
  placeName: '', placeType: '', placeTypeOther: '',
  address: '',
  contactPerson: '', contactRole: '', contactRoleOther: '', phone: '',
  responseStatus: '', responseStatusOther: '',
  productDiscussed: '',
  remarks: '', nextAction: '', nextActionOther: '',
  followUpDate: '', hasOrder: false, orderValue: '', notes: '',
}

const EMPTY_ERRORS = {
  placeName: '', placeType: '', placeTypeOther: '',
  contactPerson: '', contactRole: '', phone: '',
  responseStatus: '', productDiscussed: '',
  nextAction: '', orderValue: '',
}

export default function NewDCR() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState(EMPTY_ERRORS)

  useEffect(() => {
    const token = localStorage.getItem('agentToken')
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    fetch(`${apiBase}/api/agent/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.products) })
      .catch(() => {})
  }, [])

  const setField = (key, value) => {
    setForm(p => ({ ...p, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  // ── Validate step ──────────────────────────────────────────────────────
  const validateStep = (s) => {
    const errs = { ...EMPTY_ERRORS }; let ok = true

    if (s === 0) {
      if (!form.placeName.trim()) { errs.placeName = 'Place name is required'; ok = false }
      if (!form.placeType) { errs.placeType = 'Place type is required'; ok = false }
      if (form.placeType === 'Other' && !form.placeTypeOther.trim()) { errs.placeTypeOther = 'Please specify the place type'; ok = false }
      if (!form.contactPerson.trim()) { errs.contactPerson = 'Contact person is required'; ok = false }
      if (!form.contactRole) { errs.contactRole = 'Contact role is required'; ok = false }
      if (form.contactRole === 'Other' && !form.contactRoleOther.trim()) { errs.contactRoleOther = 'Please specify the role'; ok = false }
      if (form.phone && !/^\d{7,15}$/.test(form.phone.replace(/[\s+\-]/g, ''))) { errs.phone = 'Enter a valid phone number'; ok = false }
    }

    if (s === 1) {
      if (!form.responseStatus) { errs.responseStatus = 'Response status is required'; ok = false }
      if (form.responseStatus === 'Other' && !form.responseStatusOther.trim()) { errs.responseStatusOther = 'Please specify the status'; ok = false }
    }

    if (s === 2) {
      if (!form.nextAction) { errs.nextAction = 'Next action is required'; ok = false }
      if (form.nextAction === 'Other' && !form.nextActionOther.trim()) { errs.nextActionOther = 'Please specify the next action'; ok = false }
      if (form.hasOrder && !form.orderValue) { errs.orderValue = 'Order value is required'; ok = false }
      if (form.hasOrder && form.orderValue && isNaN(parseFloat(form.orderValue))) { errs.orderValue = 'Must be a number'; ok = false }
    }

    setErrors(errs)
    return ok
  }

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const token = localStorage.getItem('agentToken')
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const payload = {
        placeName:        form.placeName,
        placeType:        form.placeType === 'Other' ? (form.placeTypeOther || 'Other') : form.placeType,
        address:          form.address,
        contactPerson:    form.contactPerson,
        contactRole:      form.contactRole === 'Other' ? (form.contactRoleOther || 'Other') : form.contactRole,
        phone:            form.phone,
        responseStatus:   form.responseStatus === 'Other' ? (form.responseStatusOther || 'Other') : form.responseStatus,
        productDiscussed: form.productDiscussed,
        remarks:          form.remarks,
        nextAction:       form.nextAction === 'Other' ? (form.nextActionOther || 'Other') : form.nextAction,
        followUpDate:     form.followUpDate,
        hasOrder:         form.hasOrder,
        orderValue:       form.orderValue,
      }
      const res = await fetch(`${apiBase}/api/agent/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Submission failed')
      setSubmitted(true)
    } catch (err) {
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
    setForm(EMPTY_FORM); setErrors(EMPTY_ERRORS)
  }

  // ── Reusable dropdown with "Other" text field ─────────────────────────
  const DropWithOther = ({ label, fieldKey, otherKey, options, required, helperText }) => (
    <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
      <FormControl size="small" fullWidth error={!!errors[fieldKey]}>
        <InputLabel>{label}{required ? ' *' : ''}</InputLabel>
        <Select
          label={`${label}${required ? ' *' : ''}`}
          value={form[fieldKey]}
          onChange={e => setField(fieldKey, e.target.value)}
        >
          {options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </Select>
        {errors[fieldKey] && (
          <Typography sx={{ fontSize:11, color:'#ef4444', mt:0.5, ml:1 }}>{errors[fieldKey]}</Typography>
        )}
        {helperText && !errors[fieldKey] && (
          <Typography sx={{ fontSize:11, color:'#94a3b8', mt:0.5, ml:1 }}>{helperText}</Typography>
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
          sx={{ mt: 0.5 }}
        />
      )}
    </Box>
  )

  return (
    <PageShell
      title="New DCR Entry"
      subtitle="Daily Call Report — record today's field visit"
      breadcrumb={[{ label: 'Field Work' }, { label: 'Daily Call Report' }, { label: 'New Entry' }]}
    >
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stepper activeStep={step} alternativeLabel>
            {steps.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>
        </Box>

        <Box sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {submitted ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                DCR Submitted Successfully
              </Typography>
              <Typography sx={{ color: 'text.secondary', mt: 1 }}>
                Your response has been saved and will appear on the Responses page.
              </Typography>
              <Button variant="contained" sx={{ mt: 3 }} onClick={reset}>Log Another</Button>
            </Box>
          ) : (
            <>
              {/* ── STEP 0: Visit Details ── */}
              {step === 0 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:'0.08em', mb:1 }}>
                      PLACE INFORMATION
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Place Name *" size="small"
                      value={form.placeName}
                      onChange={e => setField('placeName', onlyAlphaNum(e.target.value))}
                      error={!!errors.placeName} helperText={errors.placeName || 'Alphanumeric characters only'}
                      inputProps={{ pattern:'[a-zA-Z0-9 \\-\'.,/()]*' }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DropWithOther
                      label="Place Type" fieldKey="placeType" otherKey="placeTypeOther"
                      options={PLACE_TYPES} required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Address / Location" size="small"
                      value={form.address}
                      onChange={e => setField('address', onlyAlphaNum(e.target.value))}
                      helperText="Alphanumeric characters only"
                      inputProps={{ pattern:'[a-zA-Z0-9 \\-\'.,/()]*' }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography sx={{ fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:'0.08em', mb:1, mt:1 }}>
                      CONTACT DETAILS
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Contact Person *" size="small"
                      value={form.contactPerson}
                      onChange={e => setField('contactPerson', onlyLetters(e.target.value))}
                      error={!!errors.contactPerson} helperText={errors.contactPerson || 'Letters only — no numbers'}
                      inputProps={{ pattern:'[a-zA-Z \\-\'.]*' }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DropWithOther
                      label="Contact Role" fieldKey="contactRole" otherKey="contactRoleOther"
                      options={CONTACT_ROLES} required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Phone" size="small"
                      value={form.phone}
                      onChange={e => setField('phone', onlyPhone(e.target.value))}
                      error={!!errors.phone} helperText={errors.phone || 'Numbers only'}
                      inputProps={{ inputMode:'numeric', pattern:'[0-9+\\-\\s]*', maxLength: 15 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start" sx={{ fontSize:13, color:'#94a3b8' }}></InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
              )}

              {/* ── STEP 1: Activity & Products ── */}
              {step === 1 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:'0.08em', mb:1 }}>
                      VISIT OUTCOME
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DropWithOther
                      label="Response Status" fieldKey="responseStatus" otherKey="responseStatusOther"
                      options={STATUS_OPTIONS} required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    {products.length > 0 ? (
                      <FormControl size="small" fullWidth>
                        <InputLabel>Product Discussed</InputLabel>
                        <Select
                          label="Product Discussed"
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
                        fullWidth label="Product / Service Discussed" size="small"
                        value={form.productDiscussed}
                        onChange={e => setField('productDiscussed', onlyAlphaNum(e.target.value))}
                        helperText="Alphanumeric only"
                      />
                    )}
                    {form.productDiscussed === '__other__' && (
                      <TextField
                        fullWidth size="small" label="Product Name *" sx={{ mt: 1 }}
                        value={form.productDiscussedCustom || ''}
                        onChange={e => { setField('productDiscussedCustom', onlyAlphaNum(e.target.value)); setField('productDiscussed', '__other__') }}
                        helperText="Alphanumeric only"
                      />
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth multiline rows={3} label="Remarks / Feedback" size="small"
                      value={form.remarks}
                      onChange={e => setField('remarks', e.target.value)}
                      helperText="Enter any observations or feedback from the contact"
                    />
                  </Grid>
                </Grid>
              )}

              {/* ── STEP 2: Outcome ── */}
              {step === 2 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:'0.08em', mb:1 }}>
                      NEXT STEPS
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DropWithOther
                      label="Next Action" fieldKey="nextAction" otherKey="nextActionOther"
                      options={NEXT_ACTIONS} required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Follow-up Date" size="small" type="date"
                      InputLabelProps={{ shrink: true }}
                      value={form.followUpDate}
                      onChange={e => setField('followUpDate', e.target.value)}
                      inputProps={{ min: new Date().toISOString().split('T')[0] }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth multiline rows={2} label="Additional Notes" size="small"
                      value={form.notes}
                      onChange={e => setField('notes', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box
                      onClick={() => setField('hasOrder', !form.hasOrder)}
                      sx={{
                        display:'flex', alignItems:'center', gap:1.5, p:2,
                        cursor:'pointer', borderRadius:2,
                        bgcolor: form.hasOrder ? '#f5f3ff' : '#f8fafc',
                        border: `1px solid ${form.hasOrder ? '#ddd6fe' : '#e2e8f0'}`,
                        transition:'all 0.2s',
                        '&:hover': { borderColor: form.hasOrder ? '#a78bfa' : '#cbd5e1' }
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
                          Check if a purchase order was confirmed
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {form.hasOrder && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth label="Order Value (₹) *" size="small"
                        value={form.orderValue}
                        onChange={e => setField('orderValue', onlyNumbers(e.target.value))}
                        error={!!errors.orderValue}
                        helperText={errors.orderValue || 'Numbers only — no letters'}
                        inputProps={{ inputMode:'decimal', pattern:'[0-9.]*' }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
                <Button
                  variant="outlined"
                  disabled={step === 0 || loading}
                  onClick={() => { setError(''); setStep(p => p - 1) }}
                  sx={{ borderRadius:2 }}
                >
                  ← Back
                </Button>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Typography sx={{ fontSize:12, color:'#94a3b8' }}>Step {step + 1} of {steps.length}</Typography>
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