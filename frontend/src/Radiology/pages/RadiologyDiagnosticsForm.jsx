import React, { useState } from "react";
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
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';

//  THEME COLOR (Blue matching Franchise Form)
const THEME_COLOR = "#1976d2";
const THEME_COLOR_DARK = "#115293";

const uploadToCloudinary = async (file) => {
  // Compress if image, skip if PDF
  if (file.type.startsWith("image/")) {
    const { compressImage } = await import("../../../utils/mediaCompressor");
    file = await compressImage(file, {
      maxWidthOrHeight: 1280,
      quality: 0.75,
      outputFormat: "image/jpeg",
    });
  }

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "radiologo_unsigned");
  data.append("folder", "partner-docs");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: data }
  );

  return res.json();
};


// Component defined OUTSIDE to prevent focus loss
const SectionCard = ({ title, children, required = false, subtitle = "" }) => (
  <Paper
    elevation={2}
    sx={{
      p: 3,
      mb: 3,
      borderLeft: `5px solid ${THEME_COLOR}`, // Blue Border
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
  "Business Details",
  "Address & Registration",
  "Services & Facilities",
  "Documents Upload",
  "Review & Submit"
];

const SERVICE_OPTIONS = [
  "Blood Tests", "Biochemistry", "Hematology", "Microbiology",
  "X-Ray", "Ultrasound", "CT Scan", "MRI"
];

export default function RadiologyDiagnosticsForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    mobile: "",
    email: "",
    businessType: "",
    yearEst: "",
    gstNumber: "",
    regNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    servicesOffered: [],
    homeCollection: "",
    notes: "",
    
    // Files
    regCertificate: null,
    gstCertificate: null,
    ownerID: null,
    labPhotos: null,

    consent: false,
  });

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxGroup = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      let currentArray = prev.servicesOffered;
      let newArray;
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter((item) => item !== value);
      }
      return { ...prev, servicesOffered: newArray };
    });
  };

  const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const uploaded = await uploadToCloudinary(file);

  setFormData((prev) => ({
    ...prev,
    [e.target.name]: {
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    },
  }));
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
    console.log("Draft Saved:", formData);
    alert("Draft saved successfully!");
  };

 const handleSubmit = async () => {
  if (!formData.consent) {
    alert("Please confirm the details to proceed.");
    return;
  }

  try {
    await axios.post(
      "https://bioburglifescience-1.onrender.com/api/partners/register",
      formData
    );

    setSubmitted(true);
    window.scrollTo(0, 0);
  } catch (err) {
    alert("Something went wrong");
    console.error(err);
  }
};


  // --- STEPS RENDER ---

  const renderStep1 = () => (
    <SectionCard title="Business Information" required>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label="Business / Lab / Centre Name" variant="standard" name="businessName" value={formData.businessName} onChange={handleInputChange} required />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Owner / Authorized Person" variant="standard" name="ownerName" value={formData.ownerName} onChange={handleInputChange} required />
        </Grid>
        <Grid item xs={12} md={6}>
           <TextField fullWidth type="number" label="Year of Establishment" variant="standard" name="yearEst" value={formData.yearEst} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Mobile Number" variant="standard" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Email ID" variant="standard" name="email" value={formData.email} onChange={handleInputChange} required />
        </Grid>
        <Grid item xs={12}>
            <FormControl fullWidth variant="standard" required>
                <InputLabel>Business Type</InputLabel>
                <Select name="businessType" value={formData.businessType} onChange={handleInputChange}>
                    <MenuItem value="Pathology Laboratory">Pathology Laboratory</MenuItem>
                    <MenuItem value="Radiology Centre">Radiology Centre</MenuItem>
                    <MenuItem value="Diagnostic Centre (Both)">Diagnostic Centre (Both)</MenuItem>
                    <MenuItem value="Blood Collection Centre">Blood Collection Centre</MenuItem>
                    <MenuItem value="Home Sample Collection Service">Home Sample Collection Service</MenuItem>
                </Select>
            </FormControl>
        </Grid>
      </Grid>
    </SectionCard>
  );

  const renderStep2 = () => (
    <>
      <SectionCard title="Registration Details" required>
         <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="GST Number" variant="standard" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Lab / Centre Registration Number" variant="standard" name="regNumber" value={formData.regNumber} onChange={handleInputChange} required />
            </Grid>
         </Grid>
      </SectionCard>

      <SectionCard title="Location Details" required>
         <TextField fullWidth multiline rows={2} label="Full Address" variant="standard" name="address" value={formData.address} onChange={handleInputChange} sx={{ mb: 2 }} required />
         <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
                <TextField fullWidth label="City" variant="standard" name="city" value={formData.city} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField fullWidth label="State" variant="standard" name="state" value={formData.state} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField fullWidth label="Pincode" variant="standard" name="pincode" value={formData.pincode} onChange={handleInputChange} required />
            </Grid>
         </Grid>
      </SectionCard>
    </>
  );

  const renderStep3 = () => (
    <>
      <SectionCard title="Services Offered" required subtitle="Select all that apply">
         <FormGroup>
            <Grid container>
                {SERVICE_OPTIONS.map((service) => (
                    <Grid item xs={12} sm={6} key={service}>
                        <FormControlLabel
                            control={
                                <Checkbox 
                                    checked={formData.servicesOffered.includes(service)}
                                    onChange={handleCheckboxGroup}
                                    value={service}
                                    sx={{ color: THEME_COLOR, '&.Mui-checked': { color: THEME_COLOR } }}
                                />
                            }
                            label={service}
                        />
                    </Grid>
                ))}
            </Grid>
         </FormGroup>
      </SectionCard>

      <SectionCard title="Facilities">
         <FormControl component="fieldset" required>
            <FormLabel component="legend">Home Sample Collection Facility available?</FormLabel>
            <RadioGroup row name="homeCollection" value={formData.homeCollection} onChange={handleInputChange}>
                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="No" control={<Radio />} label="No" />
            </RadioGroup>
         </FormControl>

         <TextField 
            fullWidth multiline rows={3} 
            label="Additional Notes (Optional)" 
            variant="standard" name="notes" 
            value={formData.notes} onChange={handleInputChange} 
            sx={{ mt: 3 }}
         />
      </SectionCard>
    </>
  );

  const renderStep4 = () => (
    <SectionCard title="Upload Required Documents" subtitle="Please upload clear images or PDFs.">
        <Grid container spacing={3}>
            {[
                { label: "Registration Certificate", name: "regCertificate" },
                { label: "GST Certificate", name: "gstCertificate" },
                { label: "Owner ID Proof", name: "ownerID" },
                { label: "Lab/Equipment Photos", name: "labPhotos" }
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
  );

  const renderStep5 = () => (
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderLeft: `5px solid ${THEME_COLOR}`, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#333", mb: 2 }}>Review Registration Details</Typography>
        
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Business Name</Typography>
                <Typography variant="body1">{formData.businessName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography variant="body1">{formData.businessType}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Owner</Typography>
                <Typography variant="body1">{formData.ownerName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                <Typography variant="body1">{formData.mobile}</Typography>
            </Grid>
             <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Services</Typography>
                <Typography variant="body2">{formData.servicesOffered.join(", ") || "None Selected"}</Typography>
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
              Thank you for registering <b>{formData.businessName}</b>.
            </Typography>
            <Typography variant="body1" paragraph>
              Our team will verify your documents and contact you at {formData.email} shortly.
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
          <Typography variant="h4" sx={{ color: THEME_COLOR, fontWeight: "bold" }}>BIOBURG PARTNER</Typography>
          <Typography variant="subtitle1" color="text.secondary">Pathology & Radiology Business Registration</Typography>
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
          {activeStep === 4 && renderStep5()}

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

      </Container>
    </Box>
  );
}