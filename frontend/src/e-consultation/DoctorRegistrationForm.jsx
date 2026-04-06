import React, { useState, useEffect } from "react"; 
import axios from "axios";
import {
  Box,
  Container,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormGroup,
  Checkbox,
  Button,
  Paper,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
  InputLabel,
  Divider,
  Snackbar, 
  Alert    
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';

// THEME COLOR (Blue)
const THEME_COLOR = "#1976d2";
const THEME_COLOR_DARK = "#115293";

// Component defined OUTSIDE to prevent focus loss
const SectionCard = ({ title, children, required = false, subtitle = "" }) => (
  <Paper
    elevation={2}
    sx={{
      p: 3,
      mb: 3,
      borderLeft: `5px solid ${THEME_COLOR}`, 
      borderRadius: 2,
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
      {title} {required && <span style={{ color: "red" }}>*</span>}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {subtitle}
      </Typography>
    )}
    <Box sx={{ mt: 2 }}>{children}</Box>
  </Paper>
);

const steps = [
  "Personal & Professional Info",
  "Consultation Details",
  "Documents Upload",
  "Review & Submit"
];

const SPECIALIZATIONS = [
  "General Physician", "Pediatrician", "Gynecologist", "Dermatologist",
  "Cardiologist", "Orthopedic", "ENT Specialist", "Psychiatrist",
  "Neurologist", "Gastroenterologist", "Physiotherapist",
  "Ayurvedic Doctor", "Homeopathy Doctor", "Dentist", "Other"
];

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

export default function DoctorRegistrationForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false); 

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    gender: "",
    qualification: "",
    specialization: "",
    regNumber: "",
    experience: "",
    affiliation: "",
    consultationModes: [],
    consultationFee: "",
    availability: "",
    notes: "",
    
    // Files
    regCertificate: null,
    degreeCertificate: null,
    idProof: null,
    profilePhoto: null,

    consent: false,
  });

  useEffect(() => {
    // 1. Check LocalStorage for Saved Draft
    const savedDraft = localStorage.getItem("doctorRegistrationDraft");
    
    if (savedDraft) {
      console.log("Found saved draft, loading...");
      const parsedData = JSON.parse(savedDraft);
      setFormData((prev) => ({
        ...prev,
        ...parsedData, // Load text data
        // Note: Files cannot be loaded from localStorage for security reasons, user must re-upload
      }));
    }

    // 2. (Optional) Agar API se data lana ho (Edit Profile Case):
    /*
    const fetchProfile = async () => {
       try {
         const res = await axios.get("/api/doctor/profile");
         setFormData(res.data);
       } catch (err) { console.log(err); }
    }
    fetchProfile();
    */
  }, []); // [] ka matlab yeh sirf page load hone par ek baar chalega

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxGroup = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      let currentArray = prev.consultationModes;
      let newArray;
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter((item) => item !== value);
      }
      return { ...prev, consultationModes: newArray };
    });
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  const handleConsentChange = (e) => {
    setFormData((prev) => ({ ...prev, consent: e.target.checked }));
  };

  // Navigation
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSaveDraft = () => {
    const dataToSave = { ...formData };
    delete dataToSave.regCertificate;
    delete dataToSave.degreeCertificate;
    delete dataToSave.idProof;
    delete dataToSave.profilePhoto;

    localStorage.setItem("doctorRegistrationDraft", JSON.stringify(dataToSave));
    setOpenSnackbar(true); // Show success message
  };
const handleSubmit = async () => {
  if (!formData.password || formData.password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }
  if (!formData.consent) {
    alert("Please confirm the details to proceed.");
    return;
  }

  try {
    // Convert files to base64
    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

    const payload = {
      fullName: formData.fullName,
      mobile: formData.mobile,
      email: formData.email,
      password: formData.password,
      gender: formData.gender,
      qualification: formData.qualification,
      specialization: formData.specialization,
      regNumber: formData.regNumber,
      experience: formData.experience,
      affiliation: formData.affiliation,
      consultationFee: formData.consultationFee,
      availability: formData.availability,
      notes: formData.notes,
      consultationModes: formData.consultationModes,

      documents: {
        regCertificate: formData.regCertificate ? await toBase64(formData.regCertificate) : "",
        degreeCertificate: formData.degreeCertificate ? await toBase64(formData.degreeCertificate) : "",
        idProof: formData.idProof ? await toBase64(formData.idProof) : "",
        profilePhoto: formData.profilePhoto ? await toBase64(formData.profilePhoto) : "",
      },
    };

    await axios.post(
      // "https://bioburglifescience-1.onrender.com/api/doctor/register",
      "https://bioburglifescience-1.onrender.com/api/doctor/register",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    localStorage.removeItem("doctorRegistrationDraft");
    alert("Registration successful. Please login.");
    window.location.href = "/login/doctor";

  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Registration failed");
  }
};

  // --- STEPS RENDER ---

  const renderStep1 = () => (
    <SectionCard title="Personal & Professional Information" required>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label="Full Name" variant="standard" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Mobile Number" variant="standard" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Email" variant="standard" name="email" value={formData.email} onChange={handleInputChange} required />
        </Grid>
        <Grid item xs={12} md={6}>
  <TextField
    fullWidth
    type="password"
    label="Create Password"
    variant="standard"
    name="password"
    value={formData.password}
    onChange={handleInputChange}
    required
    helperText="Minimum 6 characters"
  />
</Grid>

        <Grid item xs={12} md={6}>
            <FormControl component="fieldset" required>
                <FormLabel component="legend">Gender</FormLabel>
                <RadioGroup row name="gender" value={formData.gender} onChange={handleInputChange}>
                    <FormControlLabel value="Male" control={<Radio />} label="Male" />
                    <FormControlLabel value="Female" control={<Radio />} label="Female" />
                    <FormControlLabel value="Other" control={<Radio />} label="Other" />
                </RadioGroup>
            </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
           <TextField fullWidth label="Qualification" variant="standard" name="qualification" value={formData.qualification} onChange={handleInputChange} required />
        </Grid>
        <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="standard" required>
                <InputLabel>Specialization</InputLabel>
                <Select name="specialization" value={formData.specialization} onChange={handleInputChange}>
                    {SPECIALIZATIONS.map((spec) => (
                        <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
           <TextField fullWidth label="Registration Number (Medical Council)" variant="standard" name="regNumber" value={formData.regNumber} onChange={handleInputChange} required />
        </Grid>
        <Grid item xs={12} md={6}>
           <TextField fullWidth type="number" label="Years of Experience" variant="standard" name="experience" value={formData.experience} onChange={handleInputChange} required />
        </Grid>
      </Grid>
    </SectionCard>
  );

  const renderStep2 = () => (
    <>
      <SectionCard title="Consultation Details" required>
         <TextField fullWidth label="Clinic / Hospital Affiliation (Optional)" variant="standard" name="affiliation" value={formData.affiliation} onChange={handleInputChange} sx={{ mb: 3 }} />
         
         <Typography variant="subtitle1" gutterBottom>Consultation Modes *</Typography>
         <FormGroup row sx={{ mb: 3 }}>
            {["Video Consultation", "Audio Consultation", "Chat-Based Consultation", "Home Visit (If applicable)"].map((mode) => (
                <FormControlLabel
                    key={mode}
                    control={
                        <Checkbox 
                            checked={formData.consultationModes.includes(mode)}
                            onChange={handleCheckboxGroup}
                            value={mode}
                            sx={{ color: THEME_COLOR, '&.Mui-checked': { color: THEME_COLOR } }}
                        />
                    }
                    label={mode}
                />
            ))}
         </FormGroup>

         <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <TextField fullWidth type="number" label="Consultation Fee (₹)" variant="standard" name="consultationFee" value={formData.consultationFee} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="standard" required>
                    <InputLabel>Availability</InputLabel>
                    <Select name="availability" value={formData.availability} onChange={handleInputChange}>
                        <MenuItem value="Full Time">Full Time</MenuItem>
                        <MenuItem value="Part Time">Part Time</MenuItem>
                        <MenuItem value="Flexible Slots">Flexible Slots</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
         </Grid>
      </SectionCard>
    </>
  );

  const renderStep3 = () => (
    <>
      <SectionCard title="Upload Required Documents" subtitle="Please upload clear images or PDFs.">
        <Grid container spacing={3}>
            {[
                { label: "Registration Certificate", name: "regCertificate" },
                { label: "Degree Certificate", name: "degreeCertificate" },
                { label: "ID Proof", name: "idProof" },
                { label: "Profile Photo", name: "profilePhoto" }
            ].map((doc) => (
                <Grid item xs={12} md={6} key={doc.name}>
                    <Typography variant="subtitle2" gutterBottom>{doc.label}</Typography>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        sx={{ color: THEME_COLOR, borderColor: THEME_COLOR, justifyContent: 'flex-start' }}
                    >
                        {formData[doc.name] ? "File Selected" : "Upload File"}
                        <input type="file" hidden name={doc.name} onChange={handleFileChange} accept="image/*,.pdf" />
                    </Button>
                    {formData[doc.name] && <Typography variant="caption" display="block">{formData[doc.name].name}</Typography>}
                </Grid>
            ))}
        </Grid>
      </SectionCard>

      <SectionCard title="Additional Information">
         <TextField 
            fullWidth multiline rows={3} 
            label="Additional Notes (Optional)" 
            variant="standard" name="notes" 
            value={formData.notes} onChange={handleInputChange} 
         />
      </SectionCard>
    </>
  );

  const renderStep4 = () => (
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderLeft: `5px solid ${THEME_COLOR}`, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#333", mb: 2 }}>Review Registration Details</Typography>
        
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Doctor Name</Typography>
                <Typography variant="body1">{formData.fullName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Specialization</Typography>
                <Typography variant="body1">{formData.specialization}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                <Typography variant="body1">{formData.mobile}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Consultation Fee</Typography>
                <Typography variant="body1">₹{formData.consultationFee}</Typography>
            </Grid>
             <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Consultation Modes</Typography>
                <Typography variant="body2">{formData.consultationModes.join(", ") || "None Selected"}</Typography>
            </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, bgcolor: "transparent" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.consent}
              onChange={handleConsentChange}
              sx={{ color: THEME_COLOR, '&.Mui-checked': { color: THEME_COLOR } }}
            />
          }
          label={
            <Typography variant="body2" fontWeight="bold">
              I confirm that all details provided are accurate and authorize verification. *
            </Typography>
          }
        />
      </Paper>
    </>
  );

  // Success Screen
  if (submitted) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5", py: 8 }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 5, textAlign: "center", borderRadius: 3, borderTop: `10px solid ${THEME_COLOR}` }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: THEME_COLOR, mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">Registration Submitted!</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you, Dr. {formData.fullName}. Your registration request has been submitted.
            </Typography>
            <Typography variant="body1" paragraph>
              We will verify your credentials and activate your profile shortly.
            </Typography>
            <Button variant="outlined" sx={{ mt: 3, color: THEME_COLOR, borderColor: THEME_COLOR }} onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#f0f2f5", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="md">
        
        {/* Header Branding */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, borderTop: `10px solid ${THEME_COLOR}`, bgcolor: 'white' }}>
          <Typography variant="h4" sx={{ color: THEME_COLOR, fontWeight: "bold" }}>BIOBURG HEALTH</Typography>
          <Typography variant="subtitle1" color="text.secondary">Doctor Registration – Online Consultation Platform</Typography>
        </Paper>

        {/* Stepper */}
        <Box sx={{ width: '100%', mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label} sx={{ '& .MuiStepLabel-root .Mui-completed': { color: THEME_COLOR }, '& .MuiStepLabel-root .Mui-active': { color: THEME_COLOR } }}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <form>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
          {activeStep === 3 && renderStep4()}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4, p: 2, bgcolor: 'white', borderRadius: 2 }}>
             {/* Left side buttons */}
             <Box>
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    sx={{ color: THEME_COLOR, borderColor: THEME_COLOR, mr: 1 }}
                >
                Previous
                </Button>
            </Box>

            {/* Right side buttons */}
            <Box>
                <Button
                    onClick={handleSaveDraft}
                    startIcon={<SaveIcon />}
                    sx={{ color: "#666", mr: 2 }}
                >
                Save Draft
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                    sx={{
                        bgcolor: THEME_COLOR,
                        "&:hover": { bgcolor: THEME_COLOR_DARK },
                        px: 3
                    }}
                >
                {activeStep === steps.length - 1 ? "Submit Registration" : "Next"}
                </Button>
            </Box>
          </Box>
        </form>

        {/* Snackbar for Save Draft Alert */}
        <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}>
            <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
                Draft saved successfully! You can resume anytime.
            </Alert>
        </Snackbar>

      </Container>
    </Box>
  );
}