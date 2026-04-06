import React, { useState } from 'react'
import {
  Box,
  TextField,
  Typography,
  Paper,
  Button,
  Grid,
  MenuItem,
  Container,
  InputAdornment,
  LinearProgress,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  Checkbox,
  FormGroup
} from '@mui/material'
import toast from 'react-hot-toast'
import {
  Person,
  Email,
  Phone,
  Lock,
  Store,
  Receipt,
  Home,
  AccountBalance,
  CloudUpload,
  Badge,
  CheckCircle,
  LocationCity,
  Map,
  PinDrop,
  Visibility,
  VisibilityOff,
  PhoneAndroid,
  CameraAlt,
  Business,
  AccountCircle,
  Security,
  LocalAtm,
  Assignment,
  CalendarMonth,
  Psychology,
  RateReview,
  Place
} from '@mui/icons-material'
import { ArrowBack, ArrowForward } from '@mui/icons-material'

import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const BASE_API = 'https://bioburglifescience-1.onrender.com';
// const BASE_API = import.meta.env.VITE_API_BASE_URL;


export default function VendorRegister() {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  // --- STEPS DEFINITION (Updated to 5 to fit new data) ---
  const steps = [
    'Personal Details',
    'Business Legal',
    'Wholesaler Strategy', 
    'Bank Details',
    'Documents'
  ]

  // --- FORM STATE ---
  const [form, setForm] = useState({
    // 1. Personal
    fullName: '',
    gender: 'Male',
    dob: '', // Added
    mobile: '', // Renamed from phone for consistency with text, mapped to API
    email: '',
    password: '',
    confirmPassword: '',
    altPhone: '',

    // 2. Business Legal
    businessName: '',
    businessType: '',
    registrationType: '',
    gstNumber: '',
    panNumber: '',
    drugLicenseNumber1: '',
    drugLicenseNumber2: '',
    drugLicenseNumber3: '',
    drugLicenseNumber4: '',
    address: '',
    city: '',
    state: '',
    pincode: '',

    // 3. Wholesaler Strategy (NEW FIELDS)
    isWholesaler: 'Yes',
    businessInterest: '', // Homoeopathy, Ayurveda etc.
    investmentBandwidth: '',
    agreementRating: '',
    additionalSupport: [], // Multi-select
    otherSupportText: '',
    existingStoreDetails: '',
    challenges: [], // Multi-select
    otherChallengeText: '',
    businessModel: '', // VOCO / VOSO
    investmentTimeline: '',
    roiExpectation: '',
    investmentCapacity: '',
    interestMultipleWholesaler: 'No',
    numStoresPlanning: '',
    
    // Feedback & Location
    appealingAspects: [], // Multi-select
    otherAppealingText: '',
    nearbyCompetition: '',
    whyInterested: '',
    legalDisputes: '',
    citiesOfInterest: '',
    locality: '',
    marketConnect: 'No',
    locationType: '',
    comments: '',

    // 4. Bank
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: ''
  })

  // --- DOCUMENTS STATE ---
  const [documents, setDocuments] = useState({
    gstCertificate: null,
    drugLicense1: null,
    drugLicense2: null,
    drugLicense3: null,
    drugLicense4: null,
    businessLogo: null,
    ownerPhoto: null,
    pancard: null,
    aadharCard: null,
    voterId: null,
    educationCertificate: null,
    shopPhoto1: null,
    shopPhoto2: null,
    shopPhoto3: null,
    shopPhoto4: null,
    shopPhoto5: null,
    shopVideo: null,
    additionalDocument: null  
  })

  // --- HANDLERS ---
  const handleChange = e => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: '' })
  }

  // Handle Multi-Select Checkboxes
  const handleCheckboxChange = (e, fieldName, limit = null) => {
    const { value, checked } = e.target;
    let updatedArray = [...form[fieldName]];

    if (checked) {
      if (limit && updatedArray.length >= limit) {
        toast.error(`Please select at most ${limit} options.`);
        return;
      }
      updatedArray.push(value);
    } else {
      updatedArray = updatedArray.filter((item) => item !== value);
    }

    setForm({ ...form, [fieldName]: updatedArray });
  };

  const handleFileChange = e => {
    setDocuments({ ...documents, [e.target.name]: e.target.files[0] })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleClickShowPassword = () => setShowPassword(!showPassword)

  // --- VALIDATION ---
  const validateStep = step => {
    let newErrors = {}
    let isValid = true

    // Personal
    if (step === 0) {
      if (!form.fullName) newErrors.fullName = 'Required'
      if (!form.mobile) newErrors.mobile = 'Required'
      if (!form.email) newErrors.email = 'Required'
      if (!form.password) newErrors.password = 'Required'
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Mismatch'
    }

    // Business Legal
    if (step === 1) {
      if (!form.businessName) newErrors.businessName = 'Required'
      if (!form.gstNumber) newErrors.gstNumber = 'Required'
      if (!form.address) newErrors.address = 'Required'
    }

    // Wholesaler Strategy (Basic checks)
    if (step === 2) {
      if (!form.investmentBandwidth) newErrors.investmentBandwidth = 'Required'
      if (!form.businessModel) newErrors.businessModel = 'Required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      isValid = false
      toast.error('Please fill all required fields')
    }
    return isValid
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
    window.scrollTo(0, 0)
  }

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
})
  // --- SUBMIT ---
const handleSubmit = async () => {
  setLoading(true)
  try {
    // Convert all selected files to base64
    const base64Docs = {}
    for (const [key, file] of Object.entries(documents)) {
      if (file) {
        base64Docs[key] = await toBase64(file)
      }
    }

    // Send as JSON — NOT FormData
    const res = await axios.post(`${BASE_API}/api/vendor/register`, {
      ...form,
      ...base64Docs,
    })

    if (res.data.success) {
      toast.success('Registration Successful!')
      navigate('/vendor/login')
    } else {
      toast.error(res.data.message || 'Failed')
    }
  } catch (error) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Something went wrong!')
  }
  setLoading(false)
}

  // --- FILE UPLOAD BOX COMPONENT ---
  const FileUploadBox = ({ label, name, file, isVideo = false, required = false }) => (
    <Card sx={{ height: '100%', cursor: 'pointer', border: file ? '2px solid #4caf50' : '2px dashed #e0e0e0', borderRadius: 2, position: 'relative', '&:hover': { borderColor: '#1976d2', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' } }}>
      <input type='file' name={name} accept={isVideo ? 'video/*' : 'image/*,application/pdf'} onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', zIndex: 2, cursor: 'pointer' }} />
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: file ? '#e8f5e9' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          {isVideo ? <CameraAlt sx={{ color: file ? '#2e7d32' : '#757575' }} /> : <CloudUpload sx={{ color: file ? '#2e7d32' : '#757575' }} />}
        </Box>
        <Typography variant='body2' fontWeight='bold' align='center'>{label} {required && <span style={{ color: 'red' }}>*</span>}</Typography>
        <Typography variant='caption' color='text.secondary' align='center'>{file ? 'File Selected' : 'Click to upload'}</Typography>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 4 }}>
      <Container maxWidth='lg'>
        {/* Progress */}
        <Box sx={{ mb: 3 }}>
          <Typography variant='caption' color='text.secondary'>Step {activeStep + 1} of {steps.length}</Typography>
          <LinearProgress variant='determinate' value={((activeStep + 1) / steps.length) * 100} sx={{ height: 6, borderRadius: 3, mt: 1 }} />
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e0e0e0', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
          {/* Header */}
          <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4, px: 3, textAlign: 'center', position: 'relative' }}>
             <Typography variant='h4' fontWeight='800'>Bioburg Wholesaler Registration</Typography>
             <Typography variant='body1' sx={{ opacity: 0.9 }}>Join our B2B Pharmaceutical Marketplace</Typography>
          </Box>

          {/* Stepper */}
          <Box sx={{ bgcolor: '#f8f9fa', py: 2, px: 1, borderBottom: '1px solid #eee' }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>
          </Box>

          <Box sx={{ p: { xs: 3, md: 4 } }}>
            {/* --- STEP 1: PERSONAL INFORMATION --- */}
            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}><Typography variant="h6" color="primary" gutterBottom><Person sx={{verticalAlign:'middle', mr:1}}/>Personal Information</Typography></Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Full Name *' name='fullName' value={form.fullName} onChange={handleChange} error={!!errors.fullName} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField type="date" fullWidth label='Date of Birth' name='dob' InputLabelProps={{shrink:true}} value={form.dob} onChange={handleChange} />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl component='fieldset'>
                    <FormLabel component="legend">Gender *</FormLabel>
                    <RadioGroup row name='gender' value={form.gender} onChange={handleChange}>
                      {['Male', 'Female', 'Other'].map(g => <FormControlLabel key={g} value={g} control={<Radio />} label={g} />)}
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Mobile Number *' name='mobile' value={form.mobile} onChange={handleChange} error={!!errors.mobile} InputProps={{ startAdornment: <InputAdornment position='start'><Phone/></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Email ID *' name='email' type="email" value={form.email} onChange={handleChange} error={!!errors.email} InputProps={{ startAdornment: <InputAdornment position='start'><Email/></InputAdornment> }} />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                   <TextField fullWidth label='Password *' name='password' type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} InputProps={{ endAdornment: <IconButton onClick={handleClickShowPassword}>{showPassword ? <VisibilityOff/> : <Visibility/>}</IconButton> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                   <TextField fullWidth label='Confirm Password *' name='confirmPassword' type="password" value={form.confirmPassword} onChange={handleChange} error={!!errors.confirmPassword} />
                </Grid>
              </Grid>
            )}

            {/* --- STEP 2: BUSINESS LEGAL --- */}
            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}><Typography variant="h6" color="primary" gutterBottom><Business sx={{verticalAlign:'middle', mr:1}}/>Business Legal Information</Typography></Grid>
                
                <Grid item xs={12} sm={6}>
                   <TextField fullWidth label='Business / Shop Name *' name='businessName' value={form.businessName} onChange={handleChange} error={!!errors.businessName} />
                </Grid>
                 <Grid item xs={12} sm={6}>
                    <TextField select fullWidth label='Registration Type' name='registrationType' value={form.registrationType} onChange={handleChange}>
                        {['Proprietorship', 'Partnership', 'Pvt Ltd', 'LLP', 'Other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                   <TextField fullWidth label='GST Number *' name='gstNumber' value={form.gstNumber} onChange={handleChange} error={!!errors.gstNumber} />
                </Grid>
                <Grid item xs={12} sm={6}>
                   <TextField fullWidth label='PAN Number' name='panNumber' value={form.panNumber} onChange={handleChange} />
                </Grid>

                {[1, 2, 3, 4].map(num => (
                   <Grid item xs={12} sm={6} key={num}>
                      <TextField fullWidth label={`Drug License ${num}`} name={`drugLicenseNumber${num}`} value={form[`drugLicenseNumber${num}`]} onChange={handleChange} />
                   </Grid>
                ))}

                <Grid item xs={12}>
                   <TextField fullWidth multiline rows={3} label='Business Address *' name='address' value={form.address} onChange={handleChange} error={!!errors.address} />
                </Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label='City' name='city' value={form.city} onChange={handleChange} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label='State' name='state' value={form.state} onChange={handleChange} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label='Pincode' name='pincode' value={form.pincode} onChange={handleChange} /></Grid>
              </Grid>
            )}

            {/* --- STEP 3: WHOLESALER STRATEGY (NEW) --- */}
            {activeStep === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Alert severity="info" icon={<Psychology/>}>Gaining Clarity on Aspirations & Goals</Alert>
                </Grid>

                {/* General Info */}
                <Grid item xs={12}>
                    <FormLabel>Are you interested for B2B Wholesaler?</FormLabel>
                    <RadioGroup row name='isWholesaler' value={form.isWholesaler} onChange={handleChange}>
                        <FormControlLabel value="Yes" control={<Radio/>} label="Yes"/>
                        <FormControlLabel value="No" control={<Radio/>} label="No"/>
                    </RadioGroup>
                </Grid>

                <Grid item xs={12}>
                    <FormLabel>Interest in Your Business</FormLabel>
                    <RadioGroup row name='businessInterest' value={form.businessInterest} onChange={handleChange}>
                        {['Homoeopathy', 'Ayurveda', 'Unani', 'Allopathy'].map(opt => <FormControlLabel key={opt} value={opt} control={<Radio/>} label={opt}/>)}
                    </RadioGroup>
                </Grid>

                {/* Investment */}
                <Grid item xs={12}>
                     <Typography variant="subtitle2" fontWeight="bold" mt={2}>What is your Investment Bandwidth?</Typography>
                     <RadioGroup name='investmentBandwidth' value={form.investmentBandwidth} onChange={handleChange}>
                        <FormControlLabel value="< INR 25 Lakhs" control={<Radio/>} label="< INR 25 Lakhs"/>
                        <FormControlLabel value="INR 25-50 Lakhs" control={<Radio/>} label="INR 25-50 Lakhs"/>
                        <FormControlLabel value="> INR 50 Lakhs" control={<Radio/>} label="> INR 50 Lakhs"/>
                     </RadioGroup>
                </Grid>

                {/* Needs */}
                <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" mt={2}>Rate agreement: "Being a wholesaler and your choice is your Business Online"</Typography>
                    <TextField select fullWidth size="small" name="agreementRating" value={form.agreementRating} onChange={handleChange} sx={{mt:1}}>
                        {['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </TextField>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold">Additional support features desired? (Max 2)</Typography>
                    <FormGroup row>
                        {['Financial assistance', 'Marketing support', 'Training programs', 'Inventory management', 'Centralized Ordering', 'Other'].map(opt => (
                            <FormControlLabel key={opt} control={<Checkbox checked={form.additionalSupport.includes(opt)} value={opt} onChange={(e)=>handleCheckboxChange(e, 'additionalSupport', 2)} />} label={opt} />
                        ))}
                    </FormGroup>
                    {form.additionalSupport.includes('Other') && <TextField fullWidth size="small" placeholder="Specify Other" name="otherSupportText" value={form.otherSupportText} onChange={handleChange}/>}
                </Grid>

                <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} label="Do you own/operate similar business? Details" name="existingStoreDetails" value={form.existingStoreDetails} onChange={handleChange} />
                </Grid>

                {/* Challenges */}
                <Grid item xs={12}>
                     <Typography variant="subtitle2" fontWeight="bold">Primary challenges in integrating B2B? (Max 2)</Typography>
                     <FormGroup row>
                        {['IT and Infrastructure', 'Regulatory Compliance', 'High Initial Investment', 'Managing Additional Staff', 'Space Constraints', 'Other'].map(opt => (
                            <FormControlLabel key={opt} control={<Checkbox checked={form.challenges.includes(opt)} value={opt} onChange={(e)=>handleCheckboxChange(e, 'challenges', 2)} />} label={opt} />
                        ))}
                    </FormGroup>
                     {form.challenges.includes('Other') && <TextField fullWidth size="small" placeholder="Specify Other Challenge" name="otherChallengeText" value={form.otherChallengeText} onChange={handleChange}/>}
                </Grid>

                {/* Business Model */}
                <Grid item xs={12}>
                    <Card variant="outlined" sx={{p:2, mt:2, bgcolor:'#f8fbff'}}>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">Business Model Preference *</Typography>
                        <RadioGroup name='businessModel' value={form.businessModel} onChange={handleChange}>
                            <FormControlLabel value="VOCO" control={<Radio/>} label={
                                <Box>
                                    <Typography fontWeight="bold">VOCO : Vendor Owned, Company Operated</Typography>
                                    <Typography variant="caption">Vendor (You) owns business, Bioburg responsible for Operations.</Typography>
                                </Box>
                            } sx={{mb:1}}/>
                             <FormControlLabel value="VOSO" control={<Radio/>} label={
                                <Box>
                                    <Typography fontWeight="bold">VOSO : Vendor Owned, Self Operated</Typography>
                                    <Typography variant="caption">Vendor (You) owns business and Operations.</Typography>
                                </Box>
                            }/>
                        </RadioGroup>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="bold">How soon can you invest?</Typography>
                    <TextField select fullWidth size="small" name="investmentTimeline" value={form.investmentTimeline} onChange={handleChange}>
                        {['Immediately', 'Within 2-3 Months', 'Within 3-6 Months'].map(o=><MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="bold">ROI Expectations</Typography>
                    <TextField select fullWidth size="small" name="roiExpectation" value={form.roiExpectation} onChange={handleChange}>
                        {['Less than 1 year', '1-2 years', '2-3 years', 'More than 3 years'].map(o=><MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </TextField>
                </Grid>

                <Grid item xs={12}>
                    <FormLabel>Investment Capacity</FormLabel>
                    <RadioGroup row name='investmentCapacity' value={form.investmentCapacity} onChange={handleChange}>
                        <FormControlLabel value="Own Money" control={<Radio/>} label="My own money"/>
                        <FormControlLabel value="Partners" control={<Radio/>} label="With partners"/>
                    </RadioGroup>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormLabel>Multiple Wholesaler Interest?</FormLabel>
                    <RadioGroup row name='interestMultipleWholesaler' value={form.interestMultipleWholesaler} onChange={handleChange}>
                        <FormControlLabel value="Yes" control={<Radio/>} label="Yes"/>
                        <FormControlLabel value="No" control={<Radio/>} label="No"/>
                    </RadioGroup>
                </Grid>
                 <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Number of stores planned?" name="numStoresPlanning" value={form.numStoresPlanning} onChange={handleChange}/>
                </Grid>

                {/* Location & Feedback */}
                <Grid item xs={12}>
                     <Typography variant="h6" color="primary" mt={2}><Place sx={{verticalAlign:'middle'}}/> Location & Feedback</Typography>
                </Grid>
                 <Grid item xs={12}>
                     <Typography variant="subtitle2" fontWeight="bold">Most appealing aspects? (Select all)</Typography>
                     <FormGroup row>
                        {['Brand Reputation', 'Product Range', 'Financial Terms', 'Support and Training', 'Other'].map(opt => (
                            <FormControlLabel key={opt} control={<Checkbox checked={form.appealingAspects.includes(opt)} value={opt} onChange={(e)=>handleCheckboxChange(e, 'appealingAspects')} />} label={opt} />
                        ))}
                    </FormGroup>
                     {form.appealingAspects.includes('Other') && <TextField fullWidth size="small" placeholder="Specify" name="otherAppealingText" value={form.otherAppealingText} onChange={handleChange}/>}
                </Grid>
                
                <Grid item xs={12}>
                    <TextField fullWidth label="Nearby Competition (Brands/Numbers)" name="nearbyCompetition" value={form.nearbyCompetition} onChange={handleChange}/>
                </Grid>
                <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} label="Why interested in Bioburg?" name="whyInterested" value={form.whyInterested} onChange={handleChange}/>
                </Grid>
                 <Grid item xs={12}>
                    <TextField fullWidth label="Any Legal Disputes?" name="legalDisputes" value={form.legalDisputes} onChange={handleChange}/>
                </Grid>
                 <Grid item xs={12}>
                    <TextField fullWidth label="Cities of Interest" name="citiesOfInterest" value={form.citiesOfInterest} onChange={handleChange}/>
                </Grid>
                 <Grid item xs={12}>
                    <TextField fullWidth label="Locality for Store" name="locality" value={form.locality} onChange={handleChange}/>
                </Grid>
                <Grid item xs={12}>
                    <FormLabel>Local Market Connect?</FormLabel>
                     <RadioGroup row name='marketConnect' value={form.marketConnect} onChange={handleChange}>
                        <FormControlLabel value="Yes" control={<Radio/>} label="Yes"/>
                        <FormControlLabel value="No" control={<Radio/>} label="No"/>
                    </RadioGroup>
                </Grid>
                 <Grid item xs={12}>
                    <FormLabel>Property Type</FormLabel>
                     <RadioGroup row name='locationType' value={form.locationType} onChange={handleChange}>
                        <FormControlLabel value="Rental Space" control={<Radio/>} label="Rental Space"/>
                        <FormControlLabel value="Own Space" control={<Radio/>} label="Own Space"/>
                        <FormControlLabel value="Convert Clinic" control={<Radio/>} label="Convert Clinic"/>
                    </RadioGroup>
                </Grid>
                <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} label="Comments" name="comments" value={form.comments} onChange={handleChange}/>
                </Grid>

              </Grid>
            )}

            {/* --- STEP 4: BANK DETAILS --- */}
            {activeStep === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12}><Typography variant="h6" color="primary" gutterBottom><AccountBalance sx={{verticalAlign:'middle', mr:1}}/>Bank Details</Typography></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label='Account Holder Name' name='accountHolderName' value={form.accountHolderName} onChange={handleChange} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label='Account Number' name='accountNumber' value={form.accountNumber} onChange={handleChange} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label='IFSC Code' name='ifscCode' value={form.ifscCode} onChange={handleChange} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label='Branch Name' name='branchName' value={form.branchName} onChange={handleChange} /></Grid>
              </Grid>
            )}

            {/* --- STEP 5: DOCUMENTS --- */}
            {activeStep === 4 && (

              <Box>

                <Card sx={{ bgcolor: '#f8f9fa', mb: 4 }}>

                  <CardContent>

                    <Alert severity='warning' sx={{ mt: 2, borderRadius: 2 }}>

                      Maximum file size: 5MB per file. Supported formats: JPG,

                      PNG, PDF, MP4

                    </Alert>

                  </CardContent>

                </Card>



                {/* 1. SHOP PHOTOS (5) + VIDEO (1) */}

                <Card variant='outlined' sx={{ mb: 4, borderRadius: 2 }}>

                  <CardContent>

                    <Typography

                      variant='subtitle1'

                      fontWeight='bold'

                      sx={{ mb: 3, display: 'flex', alignItems: 'center' }}

                    >

                      <CameraAlt sx={{ mr: 1, color: '#1976d2' }} />

                      Shopscape (Business Premises with Nameplate)

                      <Chip

                        label='Required'

                        color='primary'

                        size='small'

                        sx={{ ml: 2 }}

                      />

                    </Typography>

                    <Grid container spacing={2}>

                      {[1, 2, 3, 4, 5].map(num => (

                        <Grid item xs={6} sm={4} md={2.4} key={num}>

                          <FileUploadBox

                            label={`Shop Photo ${num}`}

                            name={`shopPhoto${num}`}

                            file={documents[`shopPhoto${num}`]}

                            required={num === 1}

                          />

                        </Grid>

                      ))}

                      <Grid item xs={12} sm={6} md={2.4}>

                        <FileUploadBox

                          label='Shop Video'

                          name='shopVideo'

                          file={documents.shopVideo}

                          isVideo={true}

                        />

                      </Grid>

                    </Grid>

                  </CardContent>

                </Card>



                {/* 2. ID PROOFS & EDUCATION */}

                <Card variant='outlined' sx={{ mb: 4, borderRadius: 2 }}>

                  <CardContent>

                    <Typography

                      variant='subtitle1'

                      fontWeight='bold'

                      sx={{ mb: 3, display: 'flex', alignItems: 'center' }}

                    >

                      <Badge sx={{ mr: 1, color: '#1976d2' }} />

                      Identification & Education

                    </Typography>

                    <Grid container spacing={2}>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Aadhar Card'

                          name='aadharCard'

                          file={documents.aadharCard}

                          required

                        />

                      </Grid>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Voter ID'

                          name='voterId'

                          file={documents.voterId}

                        />

                      </Grid>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Education Certificate'

                          name='educationCertificate'

                          file={documents.educationCertificate}

                        />

                      </Grid>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Owner Photo'

                          name='ownerPhoto'

                          file={documents.ownerPhoto}

                          required

                        />

                      </Grid>

                    </Grid>

                  </CardContent>

                </Card>



                {/* 3. BUSINESS DOCS */}

                <Card variant='outlined' sx={{ mb: 4, borderRadius: 2 }}>

                  <CardContent>

                    <Typography

                      variant='subtitle1'

                      fontWeight='bold'

                      sx={{ mb: 3, display: 'flex', alignItems: 'center' }}

                    >

                      <Business sx={{ mr: 1, color: '#1976d2' }} />

                      Legal Documents

                      <Chip

                        label='Required'

                        color='primary'

                        size='small'

                        sx={{ ml: 2 }}

                      />

                    </Typography>

                    <Grid container spacing={2}>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='GST Certificate'

                          name='gstCertificate'

                          file={documents.gstCertificate}

                          required

                        />

                      </Grid>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='PAN Card'

                          name='pancard'

                          file={documents.pancard}

                          required

                        />

                      </Grid>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Business Logo'

                          name='businessLogo'

                          file={documents.businessLogo}

                        />

                      </Grid>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Drug License 1'

                          name='drugLicense1'

                          file={documents.drugLicense1}

                          required

                        />

                      </Grid>

                      {/* Optional DLs */}

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Drug License 2'

                          name='drugLicense2'

                          file={documents.drugLicense2}

                        />

                      </Grid>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Drug License 3'

                          name='drugLicense3'

                          file={documents.drugLicense3}

                        />

                      </Grid>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Drug License 4'

                          name='drugLicense4'

                          file={documents.drugLicense4}

                        />

                      </Grid>

                      <Grid item xs={6} sm={4} md={3}>

                        <FileUploadBox

                          label='Additional Document'

                          name='additionalDocument'

                          file={documents.additionalDocument}

                        />

                      </Grid>

                    </Grid>

                  </CardContent>

                </Card>

              </Box>

            )}

            {/* --- NAVIGATION BUTTONS --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 3, borderTop: '1px solid #eee' }}>
              <Button disabled={activeStep === 0} onClick={handleBack} variant='outlined' startIcon={<ArrowBack />} sx={{ borderRadius: 2, px: 4 }}>Back</Button>
              
              {activeStep === steps.length - 1 ? (
                <Button variant='contained' onClick={handleSubmit} disabled={loading} startIcon={<CheckCircle />} sx={{ borderRadius: 2, px: 6, background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)' }}>
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              ) : (
                <Button variant='contained' onClick={handleNext} endIcon={<ArrowForward />} sx={{ borderRadius: 2, px: 6 }}>Next</Button>
              )}
            </Box>
            
            <Box sx={{ mt: 4, textAlign: 'center' }}>
               <Typography variant='caption' color='text.secondary'>By submitting, you agree to our Terms & Privacy Policy</Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}