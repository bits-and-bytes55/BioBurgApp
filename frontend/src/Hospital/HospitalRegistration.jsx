import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Box, Container, Paper, Typography, TextField, Button, Grid, FormControl,
  InputLabel, Select, MenuItem, FormControlLabel, Checkbox, FormGroup, Chip,
  Avatar, Stepper, Step, StepLabel, InputAdornment, IconButton, LinearProgress, Alert,
} from '@mui/material';
import {
  LocalHospital, Business, Person, Email, Phone, LocationOn, Lock,
  Visibility, VisibilityOff, CloudUpload, CheckCircle, Description,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const BASE_API = import.meta.env.VITE_API_BASE_URL || 'https://bioburglifescience-1.onrender.com';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4), borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
}));
const StyledButton = styled(Button)(() => ({
  padding: '12px 32px', borderRadius: 8, textTransform: 'none', fontWeight: 600, fontSize: '1rem',
}));

const indianStates = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Puducherry',
];

const specializations = [
  'Cardiology','Neurology','Orthopedics','Pediatrics','Gynecology','Dermatology',
  'ENT','Ophthalmology','General Medicine','Surgery','Oncology','Psychiatry',
  'Radiology','Emergency Medicine',
];

const steps = ['Hospital Details & Documents', 'Contact Information', 'Services & Security'];

//  Math CAPTCHA 
function useCaptcha() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [input, setInput] = useState('');
  const refresh = () => {
    setA(Math.floor(Math.random() * 9) + 1);
    setB(Math.floor(Math.random() * 9) + 1);
    setInput('');
  };
  useEffect(() => { refresh(); }, []);
  const valid = parseInt(input, 10) === a + b;
  return { a, b, input, setInput, valid, refresh };
}

function CaptchaBox({ a, b, input, setInput, valid, refresh }) {
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1.5px solid #e2e8f0' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Security Verification
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
        <Box sx={{
          px: 2.5, py: 1, bgcolor: '#0077a3', borderRadius: 1.5,
          fontFamily: 'monospace', fontSize: 18, fontWeight: 800,
          color: '#fff', letterSpacing: 4, userSelect: 'none', transform: 'skewX(-4deg)',
        }}>
          {a} + {b} = ?
        </Box>
        <TextField size="small" placeholder="SUM" value={input}
          onChange={e => setInput(e.target.value)}
          inputProps={{ maxLength: 3, style: { fontWeight: 700, textAlign: 'center', width: 56 } }}
          error={input.length > 0 && !valid} sx={{ width: 90 }} />
        <Button size="small" onClick={refresh} sx={{ minWidth: 0, color: '#64748b', fontSize: 18, p: 0.5 }}>↻</Button>
        {valid && <Typography sx={{ color: '#10b981', fontWeight: 700, fontSize: 20 }}>✓</Typography>}
      </Box>
    </Box>
  );
}

//  Image upload field 
function DocUpload({ label, required, value, onChange, uploading, docKey }) {
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(`${label}: only JPG and PNG images are allowed`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label}: max file size is 5 MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      onChange(docKey, null, true); // mark uploading
      try {
        // ← body field is "file" to match your existing uploadBase64Image controller
        const res = await axios.post(`${BASE_API}/api/upload`, { file: ev.target.result });
        if (res.data.url) {
          onChange(docKey, { url: res.data.url, public_id: res.data.public_id, name: file.name }, false);
          toast.success(`${label} uploaded`);
        } else {
          throw new Error(res.data.message || 'Upload failed');
        }
      } catch (err) {
        toast.error(`Upload failed: ${err.response?.data?.message || err.message}`);
        onChange(docKey, null, false);
      }
    };
    reader.readAsDataURL(file);
  };

  const isUploading = uploading[docKey];
  const uploaded    = value?.url;

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', mb: 0.5 }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </Typography>
      <label style={{ display: 'block' }}>
        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFile} style={{ display: 'none' }} disabled={isUploading} />
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
          border: `2px dashed ${uploaded ? '#10b981' : '#cbd5e1'}`,
          borderRadius: 2, cursor: isUploading ? 'wait' : 'pointer',
          bgcolor: uploaded ? '#f0fdf4' : '#f8fafc', transition: 'all 0.2s',
          '&:hover': !isUploading ? { borderColor: '#0077a3', bgcolor: '#e0f2fe' } : {},
        }}>
          {isUploading ? (
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, color: '#0077a3', fontWeight: 600, mb: 0.5 }}>Uploading…</Typography>
              <LinearProgress sx={{ borderRadius: 4 }} />
            </Box>
          ) : uploaded ? (
            <>
              <img src={value.url} alt={label}
                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircle sx={{ fontSize: 15 }} /> {value.name}
                </Typography>
                <Typography component="a" href={value.url} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  sx={{ fontSize: 11, color: '#0077a3', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  View uploaded image ↗
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', flexShrink: 0 }}>Click to replace</Typography>
            </>
          ) : (
            <>
              <CloudUpload sx={{ color: '#94a3b8', fontSize: 24 }} />
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Click to upload</Typography>
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>JPG, PNG — max 5 MB</Typography>
              </Box>
            </>
          )}
        </Box>
      </label>
    </Box>
  );
}

export default function HospitalRegistration() {
  const navigate = useNavigate();
  const captcha  = useCaptcha();

  const [loading,             setLoading]            = useState(false);
  const [activeStep,          setActiveStep]         = useState(0);
  const [showPassword,        setShowPassword]       = useState(false);
  const [showConfirmPassword, setShowConfirmPassword]= useState(false);
  const [errors,              setErrors]             = useState({});
  const [uploading,           setUploading]          = useState({});

  const [formData, setFormData] = useState({
    facilityName: '', facilityType: 'hospital',
    registrationNumber: '', licenseNumber: '', establishedYear: '',
    numberOfBeds: '', gstNumber: '', panNumber: '',
    // Document slots — filled with { url, public_id, name } after Cloudinary upload
    registrationCertDoc: null,
    licenseCertDoc:      null,
    ownerIdDoc:          null,
    buildingPermitDoc:   null,
    contactPerson: '', designation: '', email: '', phone: '', alternatePhone: '',
    address: '', city: '', state: '', pinCode: '',
    emergencyServices: false, ambulanceService: false, pharmacy24x7: false, homeDelivery: false,
    specializations: [],
    operatingHoursFrom: '09:00', operatingHoursTo: '18:00',
    password: '', confirmPassword: '', agreeToTerms: false,
  });

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('hospitalRegDraft');
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft._draftAt) {
          setFormData(f => ({ ...f, ...draft }));
          toast('Draft restored — continue where you left off', { icon: '📋' });
        }
      }
    } catch {}
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const handleDocChange = (key, value, isUploading) => {
    setUploading(u => ({ ...u, [key]: isUploading }));
    if (!isUploading) setFormData(f => ({ ...f, [key]: value }));
  };

  const handleSpecializationToggle = (spec) => {
    const arr = [...formData.specializations];
    const idx = arr.indexOf(spec);
    if (idx === -1) arr.push(spec); else arr.splice(idx, 1);
    setFormData(f => ({ ...f, specializations: arr }));
  };

  const saveDraft = () => {
    localStorage.setItem('hospitalRegDraft', JSON.stringify({ ...formData, _draftAt: new Date().toISOString() }));
    toast.success('Draft saved');
  };

  const validateStep = (step) => {
    const e = {};
    if (step === 0) {
      if (!formData.facilityName)        e.facilityName        = 'Hospital name is required';
      if (!formData.registrationNumber)  e.registrationNumber  = 'Registration number is required';
      if (!formData.licenseNumber)       e.licenseNumber       = 'License number is required';
      if (!formData.establishedYear)     e.establishedYear     = 'Established year is required';
      if (!formData.registrationCertDoc) e.registrationCertDoc = 'Registration certificate image is required';
      if (!formData.licenseCertDoc)      e.licenseCertDoc      = 'License certificate image is required';
      if (!formData.ownerIdDoc)          e.ownerIdDoc          = 'Owner / Director ID proof image is required';
    }
    if (step === 1) {
      if (!formData.contactPerson) e.contactPerson = 'Contact person is required';
      if (!formData.email)         e.email         = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email is invalid';
      if (!formData.phone)         e.phone         = 'Phone is required';
      else if (!/^\d{10}$/.test(formData.phone))     e.phone = 'Phone must be 10 digits';
      if (!formData.address) e.address = 'Address is required';
      if (!formData.city)    e.city    = 'City is required';
      if (!formData.state)   e.state   = 'State is required';
      if (!formData.pinCode) e.pinCode = 'Pin code is required';
      else if (!/^\d{6}$/.test(formData.pinCode)) e.pinCode = 'Must be 6 digits';
    }
    if (step === 2) {
      if (!formData.password)                             e.password        = 'Password is required';
      else if (formData.password.length < 6)              e.password        = 'Minimum 6 characters';
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!formData.agreeToTerms)                         e.agreeToTerms    = 'You must agree to terms';
      if (!captcha.valid)                                 e.captcha         = 'Please solve the security check';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep(activeStep)) setActiveStep(s => s + 1); };
  const handleBack = () => setActiveStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    setLoading(true);
    try {
      // Flatten doc objects → just the Cloudinary URL strings for the backend
      const payload = {
        ...formData,
        facilityType:        formData.facilityType || 'hospital',
        registrationCertUrl: formData.registrationCertDoc?.url || null,
        licenseCertUrl:      formData.licenseCertDoc?.url      || null,
        ownerIdDocUrl:       formData.ownerIdDoc?.url          || null,
        buildingPermitUrl:   formData.buildingPermitDoc?.url   || null,
        // Remove the object slots before sending
        registrationCertDoc: undefined,
        licenseCertDoc:      undefined,
        ownerIdDoc:          undefined,
        buildingPermitDoc:   undefined,
      };

      const response = await axios.post(`${BASE_API}/api/hospital/register`, payload);
      if (response.data.success) {
        localStorage.removeItem('hospitalRegDraft');
        toast.success('Registration submitted! Awaiting admin approval.');
        setTimeout(() => navigate('/hospital/login'), 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      captcha.refresh();
    } finally {
      setLoading(false);
    }
  };

  const renderStep = (step) => {
    if (step === 0) return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalHospital color="primary" /> Hospital Information
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Hospital Name *" name="facilityName" value={formData.facilityName}
            onChange={handleChange} error={!!errors.facilityName} helperText={errors.facilityName}
            InputProps={{ startAdornment: <InputAdornment position="start"><Business /></InputAdornment> }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Hospital Type</InputLabel>
            <Select name="facilityType" value={formData.facilityType} onChange={handleChange} label="Hospital Type">
              <MenuItem value="hospital">Hospital</MenuItem>
              <MenuItem value="clinic">Clinic</MenuItem>
              <MenuItem value="nursing-home">Nursing Home</MenuItem>
              <MenuItem value="both">Hospital with Pharmacy</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Registration Number *" name="registrationNumber"
            value={formData.registrationNumber} onChange={handleChange}
            error={!!errors.registrationNumber} helperText={errors.registrationNumber} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="License Number *" name="licenseNumber"
            value={formData.licenseNumber} onChange={handleChange}
            error={!!errors.licenseNumber} helperText={errors.licenseNumber} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Established Year *" name="establishedYear" type="number"
            value={formData.establishedYear} onChange={handleChange}
            error={!!errors.establishedYear} helperText={errors.establishedYear}
            inputProps={{ min: 1900, max: new Date().getFullYear() }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Number of Beds" name="numberOfBeds" type="number"
            value={formData.numberOfBeds} onChange={handleChange} inputProps={{ min: 1 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="GST Number (Optional)" name="gstNumber"
            value={formData.gstNumber} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="PAN Number (Optional)" name="panNumber"
            value={formData.panNumber} onChange={handleChange} />
        </Grid>

        {/* Document uploads */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Description color="primary" /> Required Documents
          </Typography>
          <Alert severity="info" sx={{ mt: 1, mb: 2, fontSize: 12 }}>
            Upload clear photos of your documents. JPG / PNG only, max 5 MB each.
            These are reviewed by admin before your account is approved.
          </Alert>
        </Grid>

        <Grid item xs={12} md={6}>
          <DocUpload label="Registration Certificate" required docKey="registrationCertDoc"
            value={formData.registrationCertDoc} onChange={handleDocChange} uploading={uploading} />
          {errors.registrationCertDoc && <Typography variant="caption" color="error">{errors.registrationCertDoc}</Typography>}
        </Grid>
        <Grid item xs={12} md={6}>
          <DocUpload label="License Certificate" required docKey="licenseCertDoc"
            value={formData.licenseCertDoc} onChange={handleDocChange} uploading={uploading} />
          {errors.licenseCertDoc && <Typography variant="caption" color="error">{errors.licenseCertDoc}</Typography>}
        </Grid>
        <Grid item xs={12} md={6}>
          <DocUpload label="Owner / Director ID Proof (Aadhaar / PAN photo)" required docKey="ownerIdDoc"
            value={formData.ownerIdDoc} onChange={handleDocChange} uploading={uploading} />
          {errors.ownerIdDoc && <Typography variant="caption" color="error">{errors.ownerIdDoc}</Typography>}
        </Grid>
        <Grid item xs={12} md={6}>
          <DocUpload label="Building / Fire Safety Permit (Optional)" docKey="buildingPermitDoc"
            value={formData.buildingPermitDoc} onChange={handleDocChange} uploading={uploading} />
        </Grid>
      </Grid>
    );

    if (step === 1) return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" /> Contact & Address
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Contact Person *" name="contactPerson" value={formData.contactPerson}
            onChange={handleChange} error={!!errors.contactPerson} helperText={errors.contactPerson}
            InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Designation" name="designation" value={formData.designation} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Email *" name="email" type="email" value={formData.email}
            onChange={handleChange} error={!!errors.email} helperText={errors.email}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Phone *" name="phone" value={formData.phone}
            onChange={handleChange} error={!!errors.phone} helperText={errors.phone}
            InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Alternate Phone" name="alternatePhone"
            value={formData.alternatePhone} onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Address *" name="address" value={formData.address} multiline rows={2}
            onChange={handleChange} error={!!errors.address} helperText={errors.address}
            InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment> }} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="City *" name="city" value={formData.city}
            onChange={handleChange} error={!!errors.city} helperText={errors.city} />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth error={!!errors.state}>
            <InputLabel>State *</InputLabel>
            <Select name="state" value={formData.state} onChange={handleChange} label="State *">
              {indianStates.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
            {errors.state && <Typography variant="caption" color="error">{errors.state}</Typography>}
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="Pin Code *" name="pinCode" value={formData.pinCode}
            onChange={handleChange} error={!!errors.pinCode} helperText={errors.pinCode} />
        </Grid>
      </Grid>
    );

    if (step === 2) return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6">Services Offered</Typography>
          <FormGroup>
            <Grid container spacing={2}>
              {[
                ['emergencyServices','24/7 Emergency Services'],
                ['ambulanceService', 'Ambulance Service'],
                ['pharmacy24x7',     '24/7 Pharmacy'],
                ['homeDelivery',     'Home Delivery'],
              ].map(([name, label]) => (
                <Grid item xs={12} sm={6} key={name}>
                  <FormControlLabel control={<Checkbox checked={formData[name]} onChange={handleChange} name={name} />} label={label} />
                </Grid>
              ))}
            </Grid>
          </FormGroup>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 1 }}>Specializations</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {specializations.map(spec => (
              <Chip key={spec} label={spec} onClick={() => handleSpecializationToggle(spec)}
                color={formData.specializations.includes(spec) ? 'primary' : 'default'}
                variant={formData.specializations.includes(spec) ? 'filled' : 'outlined'} />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 1 }}>Operating Hours</Typography>
          <Grid container spacing={2} mt={0}>
            <Grid item xs={6}>
              <TextField fullWidth label="From" name="operatingHoursFrom" type="time"
                value={formData.operatingHoursFrom} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="To" name="operatingHoursTo" type="time"
                value={formData.operatingHoursTo} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 1 }}>Account Security</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Password *" name="password"
            type={showPassword ? 'text' : 'password'} value={formData.password}
            onChange={handleChange} error={!!errors.password} helperText={errors.password}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Confirm Password *" name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword}
            onChange={handleChange} error={!!errors.confirmPassword} helperText={errors.confirmPassword}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(p => !p)}>
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }} />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Checkbox checked={formData.agreeToTerms} onChange={handleChange} name="agreeToTerms" />}
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <a href="/terms" target="_blank" style={{ color: '#0077a3' }}>Terms</a> and{' '}
                <a href="/privacy" target="_blank" style={{ color: '#0077a3' }}>Privacy Policy</a>
              </Typography>
            } />
          {errors.agreeToTerms && <Typography variant="caption" color="error" display="block">{errors.agreeToTerms}</Typography>}
        </Grid>

        <Grid item xs={12}>
          <CaptchaBox {...captcha} />
          {errors.captcha && <Typography variant="caption" color="error" display="block" mt={0.5}>{errors.captcha}</Typography>}
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', py: 6 }}>
      <Container maxWidth="md">
        <Box textAlign="center" mb={4}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#0077a3', margin: '0 auto 16px' }}>
            <LocalHospital sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={700} gutterBottom>Hospital Registration</Typography>
          <Typography variant="body1" color="text.secondary">
            Register your hospital in the Bioburg healthcare network
          </Typography>
        </Box>

        <StyledPaper>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          <form onSubmit={handleSubmit}>
            {renderStep(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, flexWrap: 'wrap', gap: 1 }}>
              <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined" sx={{ minWidth: 120 }}>
                Back
              </Button>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={saveDraft}
                  sx={{ minWidth: 130, color: '#64748b', borderColor: '#cbd5e1' }}>
                  Save Draft
                </Button>
                {activeStep === steps.length - 1 ? (
                  <>
                    <StyledButton variant="outlined" onClick={() => { saveDraft(); navigate('/'); }}
                      sx={{ minWidth: 140, color: '#64748b', borderColor: '#cbd5e1' }}>
                      Save &amp; Exit
                    </StyledButton>
                    <StyledButton type="submit" variant="contained"
                      disabled={loading || !captcha.valid}
                      sx={{ minWidth: 200, bgcolor: '#0077a3', '&:hover': { bgcolor: '#005f8a' }, '&:disabled': { bgcolor: '#94a3b8' } }}>
                      {loading ? 'Registering...' : 'Complete Registration'}
                    </StyledButton>
                  </>
                ) : (
                  <StyledButton variant="contained" onClick={handleNext}
                    sx={{ minWidth: 120, bgcolor: '#0077a3', '&:hover': { bgcolor: '#005f8a' } }}>
                    Next
                  </StyledButton>
                )}
              </Box>
            </Box>
          </form>
        </StyledPaper>

        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Already registered?{' '}
            <a href="/hospital/login" style={{ color: '#0077a3', fontWeight: 600 }}>Login here</a>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}