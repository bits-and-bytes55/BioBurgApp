import React, { useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Paper,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
  InputLabel,
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { API_URL } from "../config/api";

//  THEME COLOR (Blue)
const THEME_COLOR = "#1976d2";
const THEME_COLOR_DARK = "#115293";

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
  "Personal & Company Info",
  "Compliance & Order",
  "Shipping & Logistics",
  "Financials & Docs",
  "Portal Preference"
];

export default function BulkManufacturingForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    // Personal Details (Requested)
    fullName: "",
    gender: "",
    dob: "",
    mobile: "",
    
    // Contact Person Details (Extra from list)
    designation: "",
    email: "",
    whatsapp: "",

    // Company Info
    companyName: "",
    country: "",
    orgType: "",
    yearEst: "",
    website: "",

    // Compliance
    importLicenseNum: "",
    taxId: "",

    // Order Requirements
    products: "",
    quantity: "",
    destinationCountry: "",
    port: "",
    purpose: "",
    storageReq: "",

    // Logistics
    shippingMethod: "",
    customsBroker: "",
    customsAssist: "No",

    // Financials
    paymentMethod: "",
    currency: "",

    // Account
    username: "",
    password: "",
    confirmPassword: "",

    // Files
    importLicenseFile: null,
    gdpCert: null,
    buyerLetter: null,
    proofOfFunds: null,
    companyRegCert: null,
    passportCopy: null,
    companyProfile: null,
  });

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert(`"${file.name}" is too large. Maximum file size is 2MB.`);
    e.target.value = "";
    return;
  }
  setFormData((prev) => ({ ...prev, [e.target.name]: file }));
};

  // Navigation
  const handleNext = () => {
  if (activeStep === steps.length - 1) {
    if (formData.password !== formData.confirmPassword) {
      setSubmitError("Passwords do not match. Please re-check.");
      return;
    }
    if (formData.password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }
    void handleSubmit();
  } else {
    setActiveStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  }
};

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError("");

      const payload = new FormData();
      [
        "fullName",
        "gender",
        "dob",
        "mobile",
        "designation",
        "email",
        "whatsapp",
        "companyName",
        "country",
        "orgType",
        "yearEst",
        "website",
        "importLicenseNum",
        "taxId",
        "products",
        "quantity",
        "destinationCountry",
        "port",
        "purpose",
        "storageReq",
        "shippingMethod",
        "customsBroker",
        "customsAssist",
        "paymentMethod",
        "currency",
        "username",
        "password",
      ].forEach((key) => {
        payload.append(key, formData[key] || "");
      });

      [
        "importLicenseFile",
        "gdpCert",
        "buyerLetter",
        "proofOfFunds",
        "companyRegCert",
        "passportCopy",
        "companyProfile",
      ].forEach((key) => {
        if (formData[key]) {
          payload.append(key, formData[key]);
        }
      });

      await axios.post(`${API_URL}/bulk-manufacturing`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
      onUploadProgress: (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`Upload progress: ${percent}%`);
  },
});

      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Bulk manufacturing submit failed:", error);
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Unable to submit your request right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --- STEPS RENDER ---

  const renderStep1 = () => (
    <>
      <SectionCard title="Personal Information" required>
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <TextField fullWidth label="Full Name" variant="standard" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
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
                <TextField type="date" fullWidth label="Date of Birth" variant="standard" name="dob" InputLabelProps={{ shrink: true }} value={formData.dob} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Mobile Number" variant="standard" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
            </Grid>
             <Grid item xs={12} md={6}>
                <TextField fullWidth label="WhatsApp Number" variant="standard" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} />
            </Grid>
             <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email Address" variant="standard" name="email" value={formData.email} onChange={handleInputChange} required />
            </Grid>
             <Grid item xs={12} md={6}>
                <TextField fullWidth label="Designation" variant="standard" name="designation" value={formData.designation} onChange={handleInputChange} required />
            </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Company Information" required>
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <TextField fullWidth label="Company Name" variant="standard" name="companyName" value={formData.companyName} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Country of Origin" variant="standard" name="country" value={formData.country} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth type="number" label="Year of Establishment" variant="standard" name="yearEst" value={formData.yearEst} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="standard" required>
                    <InputLabel>Type of Organization</InputLabel>
                    <Select name="orgType" value={formData.orgType} onChange={handleInputChange}>
                        <MenuItem value="Pharmaceutical Manufacturer">Pharmaceutical Manufacturer</MenuItem>
                        <MenuItem value="Wholesale Distributor">Wholesale Distributor</MenuItem>
                        <MenuItem value="Importer">Importer</MenuItem>
                        <MenuItem value="Export Agent">Export Agent</MenuItem>
                        <MenuItem value="Government Procurement Body">Government Procurement Body</MenuItem>
                        <MenuItem value="Hospital / Healthcare Chain">Hospital / Healthcare Chain</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Company Website" variant="standard" name="website" value={formData.website} onChange={handleInputChange} />
            </Grid>
        </Grid>
      </SectionCard>
    </>
  );

  const renderStep2 = () => (
    <>
      <SectionCard title="Import / Export Compliance" required>
         <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Import License Number" variant="standard" name="importLicenseNum" value={formData.importLicenseNum} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Tax Identification Number (TIN/VAT/GST)" variant="standard" name="taxId" value={formData.taxId} onChange={handleInputChange} />
            </Grid>
            
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Upload Import License *</Typography>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth sx={{ justifyContent: 'flex-start' }}>
                    {formData.importLicenseFile ? "File Selected" : "Upload File"}
                    <input type="file" hidden name="importLicenseFile" onChange={handleFileChange} />
                </Button>
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Valid GDP / GMP Certification *</Typography>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth sx={{ justifyContent: 'flex-start' }}>
                    {formData.gdpCert ? "File Selected" : "Upload File"}
                    <input type="file" hidden name="gdpCert" onChange={handleFileChange} />
                </Button>
            </Grid>
             <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Authorized Buyer / Procurement Letter *</Typography>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth sx={{ justifyContent: 'flex-start' }}>
                    {formData.buyerLetter ? "File Selected" : "Upload File"}
                    <input type="file" hidden name="buyerLetter" onChange={handleFileChange} />
                </Button>
            </Grid>
         </Grid>
      </SectionCard>

      <SectionCard title="Bulk Order Requirements" required>
         <TextField fullWidth multiline rows={2} label="Required Pharmaceutical Products" variant="standard" name="products" value={formData.products} onChange={handleInputChange} sx={{ mb: 2 }} required />
         
         <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Order Quantity" variant="standard" name="quantity" value={formData.quantity} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="standard" required>
                    <InputLabel>Purpose of Purchase</InputLabel>
                    <Select name="purpose" value={formData.purpose} onChange={handleInputChange}>
                        <MenuItem value="Commercial Trade">Commercial Trade</MenuItem>
                        <MenuItem value="Tender Procurement">Tender Procurement</MenuItem>
                        <MenuItem value="Government Supply">Government Supply</MenuItem>
                        <MenuItem value="Hospital / Clinical Use">Hospital / Clinical Use</MenuItem>
                        <MenuItem value="Humanitarian / NGO Aid">Humanitarian / NGO Aid</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Delivery Destination Country" variant="standard" name="destinationCountry" value={formData.destinationCountry} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Preferred Port of Delivery" variant="standard" name="port" value={formData.port} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12}>
                <TextField fullWidth label="Special Storage or Handling Requirements" variant="standard" name="storageReq" value={formData.storageReq} onChange={handleInputChange} />
            </Grid>
         </Grid>
      </SectionCard>
    </>
  );

  const renderStep3 = () => (
    <SectionCard title="Shipping & Logistics">
        <FormControl component="fieldset" sx={{ mb: 2 }} required>
            <FormLabel component="legend">Preferred Shipping Method</FormLabel>
            <RadioGroup row name="shippingMethod" value={formData.shippingMethod} onChange={handleInputChange}>
                <FormControlLabel value="Air Freight" control={<Radio />} label="Air Freight" />
                <FormControlLabel value="Sea Freight" control={<Radio />} label="Sea Freight" />
                <FormControlLabel value="Courier" control={<Radio />} label="Courier (Samples)" />
            </RadioGroup>
        </FormControl>

        <TextField fullWidth label="Customs Broker Details (If Available)" variant="standard" name="customsBroker" value={formData.customsBroker} onChange={handleInputChange} sx={{ mb: 2 }} />

        <FormControl component="fieldset">
            <FormLabel component="legend">Need Assistance for Customs Clearance?</FormLabel>
            <RadioGroup row name="customsAssist" value={formData.customsAssist} onChange={handleInputChange}>
                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="No" control={<Radio />} label="No" />
            </RadioGroup>
        </FormControl>
    </SectionCard>
  );

  const renderStep4 = () => (
    <>
      <SectionCard title="Financial Details" required>
         <FormControl component="fieldset" sx={{ mb: 3 }} required>
            <FormLabel component="legend">Preferred Payment Method</FormLabel>
            <RadioGroup row name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
                <FormControlLabel value="SWIFT Transfer" control={<Radio />} label="SWIFT" />
                <FormControlLabel value="LC" control={<Radio />} label="LC (Letter of Credit)" />
                <FormControlLabel value="TT Advance" control={<Radio />} label="TT Advance" />
                <FormControlLabel value="Paypal" control={<Radio />} label="Paypal (Small Orders)" />
            </RadioGroup>
         </FormControl>

         <Grid container spacing={2}>
             <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="standard" required>
                    <InputLabel>Currency Preference</InputLabel>
                    <Select name="currency" value={formData.currency} onChange={handleInputChange}>
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                        <MenuItem value="AED">AED</MenuItem>
                        <MenuItem value="INR">INR</MenuItem>
                    </Select>
                </FormControl>
             </Grid>
             <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Upload Proof of Funds (Optional)</Typography>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth sx={{ justifyContent: 'flex-start' }}>
                    {formData.proofOfFunds ? "File Selected" : "Upload File"}
                    <input type="file" hidden name="proofOfFunds" onChange={handleFileChange} />
                </Button>
             </Grid>
         </Grid>
      </SectionCard>

      <SectionCard title="Required Document Uploads" required>
         <Grid container spacing={2}>
            {[
                { label: "Company Registration Certificate", name: "companyRegCert" },
                { label: "Authorized Person Passport Copy", name: "passportCopy" },
                { label: "Company Profile / Brochure", name: "companyProfile" },
            ].map((doc) => (
                <Grid item xs={12} md={4} key={doc.name}>
                    <Typography variant="subtitle2" gutterBottom>{doc.label} *</Typography>
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
    </>
  );

  const renderStep5 = () => (
  <SectionCard
    title="Portal Access Preference"
    required
    subtitle="After admin review, the BioBurg team will activate your account using the credentials set below."
  >
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      This stage creates only your request. Login access is activated after compliance review and approval.
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Preferred Username"
          variant="standard"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Set Password"
          variant="standard"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          helperText="Min. 8 characters"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Confirm Password"
          variant="standard"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          required
          error={
            formData.confirmPassword.length > 0 &&
            formData.password !== formData.confirmPassword
          }
          helperText={
            formData.confirmPassword.length > 0 &&
            formData.password !== formData.confirmPassword
              ? "Passwords do not match"
              : ""
          }
        />
      </Grid>
    </Grid>
  </SectionCard>
);

  // Success Screen
  if (submitted) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5", py: 8 }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 5, textAlign: "center", borderRadius: 3, borderTop: `10px solid ${THEME_COLOR}` }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: THEME_COLOR, mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">Request Submitted!</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you, <b>{formData.fullName}</b>.
            </Typography>
            <Typography variant="body1" paragraph>
              Your bulk manufacturing request for <b>{formData.companyName}</b> has been received. Our business and compliance team will review your documents and contact you within 24-48 hours.
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
          <Typography variant="h4" sx={{ color: THEME_COLOR, fontWeight: "bold" }}>BIOBURG PHARMA</Typography>
          <Typography variant="subtitle1" color="text.secondary">Bulk Pharmaceuticals International Orders Registration</Typography>
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
          {submitError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          ) : null}

          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
          {activeStep === 3 && renderStep4()}
          {activeStep === 4 && renderStep5()}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4, p: 2, bgcolor: 'white', borderRadius: 2 }}>
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

            <Box>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={submitting}
                    endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                    sx={{
                        bgcolor: THEME_COLOR,
                        "&:hover": { bgcolor: THEME_COLOR_DARK },
                        px: 3
                    }}
                >
                {submitting ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : activeStep === steps.length - 1 ? (
                  "Submit Request"
                ) : (
                  "Next"
                )}
                </Button>
            </Box>
          </Box>
        </form>

      </Container>
    </Box>
  );
}
