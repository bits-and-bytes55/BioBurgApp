import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Divider,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';

// THEME COLOR CONSTANT (BLUE)
const THEME_COLOR = "#1976d2"; // Standard Blue matching your image
const THEME_COLOR_DARK = "#115293"; // Darker blue for hover

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";

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

// Lab Tests Data
const AVAILABLE_TESTS = [
  { id: 1, name: "Complete Blood Count (CBC)", price: 250 },
  { id: 2, name: "Liver Function Test (LFT) - Panel", price: 450 },
  { id: 3, name: "Kidney Function Test (KFT) - Panel", price: 400 },
  { id: 4, name: "Lipid Profile", price: 500 },
  { id: 5, name: "Thyroid Stimulating Hormone (TSH)", price: 350 },
  { id: 6, name: "HbA1c (Glycated Hemoglobin)", price: 550 },
  { id: 7, name: "Fasting & Postprandial Blood Sugar", price: 200 },
  { id: 8, name: "CRP (C-Reactive Protein)", price: 300 },
  { id: 9, name: "Vitamin D (25-OH)", price: 700 },
  { id: 10, name: "Urine Routine & Microscopy", price: 180 },
];

const steps = [
  "Personal Info",
  "Choose Tests",
  "Collection & Schedule",
  "Docs & Payment",
  "Review"
];

export default function LabTestForm() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    selectedTests: [],
    collectionOption: "Home Sample Collection",
    preferredDate: "",
    timeSlot: "",
    prescription: null,
    insuranceDetails: "",
    reportDelivery: [],
    symptoms: "",
    paymentMethod: "Cash on Collection",
    consent: false,
  });

  // Calculation Logic
  const calculateTotal = () => {
    return formData.selectedTests.reduce((total, testName) => {
      const test = AVAILABLE_TESTS.find((t) => t.name === testName);
      return total + (test ? test.price : 0);
    }, 0);
  };

  // Input Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxGroup = (e, fieldName) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      let currentArray = prev[fieldName];
      let newArray;
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter((item) => item !== value);
      }
      return { ...prev, [fieldName]: newArray };
    });
  };

  const handleTestSelection = (e) => handleCheckboxGroup(e, "selectedTests");
  const handleReportDelivery = (e) => handleCheckboxGroup(e, "reportDelivery");

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

const handleSubmit = async () => {
  if (!formData.consent) {
    alert("Please confirm the consent checkbox to proceed.");
    return;
  }

  try {
    const payload = {
      fullName: formData.fullName,
      dob: formData.dob,
      gender: formData.gender,
      mobile: formData.mobile,
      email: formData.email,

      address: {
        fullAddress: formData.address,
        city: formData.city,
        pincode: formData.pincode,
      },

      selectedTests: formData.selectedTests.map((testName) => {
        const test = AVAILABLE_TESTS.find(t => t.name === testName);
        return {
          testName,
          price: test?.price || 0,
        };
      }),

      collectionOption: formData.collectionOption,
      preferredDate: formData.preferredDate,
      timeSlot: formData.timeSlot,

      insuranceDetails: formData.insuranceDetails,
      reportDelivery: formData.reportDelivery,
      symptoms: formData.symptoms,
    };

    console.log("FINAL PAYLOAD 👉", payload);

    const res = await axios.post(
      `${API_BASE_URL}/labs/register`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SERVER RESPONSE 👉", res.data);

   if (res.data?.credentials) {
  alert(
    `Lab Registered Successfully!\n\nEmail: ${res.data.credentials.email}\nPassword: ${res.data.credentials.password}`
  );
  navigate("/pathology-login");
} else {
  alert(res.data?.message || "Lab registered, but credentials not returned");
}

    setSubmitted(true);

  } catch (error) {
    console.error("REGISTER ERROR 👉", error.response?.data || error.message);

    alert(
      error.response?.data?.message ||
      "Something went wrong while registering lab"
    );
  }
};


  // --- STEPS UI ---

  const renderStep1 = () => (
    <>
      <SectionCard title="Patient Personal Details" required>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Full Name"
              variant="standard"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              type="date"
              label="Date of Birth"
              fullWidth
              variant="standard"
              name="dob"
              InputLabelProps={{ shrink: true }}
              value={formData.dob}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormLabel component="legend">Gender *</FormLabel>
            <RadioGroup row name="gender" value={formData.gender} onChange={handleInputChange}>
              <FormControlLabel value="Male" control={<Radio />} label="Male" />
              <FormControlLabel value="Female" control={<Radio />} label="Female" />
              <FormControlLabel value="Other" control={<Radio />} label="Other" />
            </RadioGroup>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Mobile Number"
              variant="standard"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email (for reports)"
              variant="standard"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Address for Sample Collection" required>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Full Address"
          variant="standard"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
        />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="City"
              variant="standard"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="PIN / ZIP Code"
              variant="standard"
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              required
            />
          </Grid>
        </Grid>
      </SectionCard>
    </>
  );

  const renderStep2 = () => {
    const filteredTests = AVAILABLE_TESTS.filter((test) =>
      test.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <SectionCard
        title="Choose Tests / Packages"
        required
        subtitle="Tip: click tests to add/remove. Use the search box to find tests."
      >
        <TextField
          fullWidth
          placeholder="Search for tests..."
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormGroup sx={{ maxHeight: "350px", overflowY: "auto", pl: 1 }}>
          {filteredTests.map((test) => (
            <FormControlLabel
              key={test.id}
              control={
                <Checkbox
                  checked={formData.selectedTests.includes(test.name)}
                  onChange={handleTestSelection}
                  value={test.name}
                  sx={{
                    color: THEME_COLOR,
                    '&.Mui-checked': {
                      color: THEME_COLOR,
                    },
                  }}
                />
              }
              label={
                <Typography variant="body1">
                  {test.name} — <b>₹{test.price}</b>
                </Typography>
              }
            />
          ))}
        </FormGroup>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "#e3f2fd", // Light Blue bg
            borderRadius: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1">
            Selected: {formData.selectedTests.length}
          </Typography>
          <Typography variant="h6" sx={{ color: THEME_COLOR, fontWeight: "bold" }}>
            Total: ₹{calculateTotal()}
          </Typography>
        </Box>
      </SectionCard>
    );
  };

  const renderStep3 = () => (
    <>
      <SectionCard title="Preferred Collection Option" required>
        <RadioGroup
          row
          name="collectionOption"
          value={formData.collectionOption}
          onChange={handleInputChange}
        >
          <FormControlLabel
            value="Home Sample Collection"
            control={<Radio />}
            label="Home Sample Collection"
          />
          <FormControlLabel
            value="Pickup from Lab / Center"
            control={<Radio />}
            label="Pickup from Lab / Center"
          />
        </RadioGroup>
      </SectionCard>

      <SectionCard title="Preferred Schedule">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Preferred Date"
              name="preferredDate"
              InputLabelProps={{ shrink: true }}
              value={formData.preferredDate}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="standard">
              <Select
                displayEmpty
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleInputChange}
              >
                <MenuItem value="" disabled>
                  -- Select Time Slot --
                </MenuItem>
                <MenuItem value="06:00 - 09:00">06:00 - 09:00</MenuItem>
                <MenuItem value="09:00 - 12:00">09:00 - 12:00</MenuItem>
                <MenuItem value="12:00 - 15:00">12:00 - 15:00</MenuItem>
                <MenuItem value="15:00 - 18:00">15:00 - 18:00</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </SectionCard>
    </>
  );

  const renderStep4 = () => (
    <>
      <SectionCard title="Upload Documents & Preferences">
        <Typography variant="subtitle2" gutterBottom>
          Upload Doctor's Prescription (required for some tests)
        </Typography>
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ mb: 3, color: THEME_COLOR, borderColor: THEME_COLOR }}
        >
          Select File
          <input
            type="file"
            hidden
            name="prescription"
            onChange={handleFileChange}
            accept="image/*,.pdf"
          />
        </Button>
        {formData.prescription && (
          <Typography variant="caption" sx={{ ml: 2 }}>
            {formData.prescription.name}
          </Typography>
        )}

        <TextField
          fullWidth
          label="Insurance / TPA Details (Optional)"
          variant="standard"
          name="insuranceDetails"
          value={formData.insuranceDetails}
          onChange={handleInputChange}
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle1" gutterBottom>
          Report Delivery Preference
        </Typography>
        <FormGroup row>
          {["Email", "WhatsApp", "Download from Portal"].map((opt) => (
            <FormControlLabel
              key={opt}
              control={
                <Checkbox
                  checked={formData.reportDelivery.includes(opt)}
                  onChange={handleReportDelivery}
                  value={opt}
                  sx={{
                    color: THEME_COLOR,
                    '&.Mui-checked': {
                      color: THEME_COLOR,
                    },
                  }}
                />
              }
              label={opt}
            />
          ))}
        </FormGroup>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Any Symptoms / Clinical Notes"
          variant="standard"
          name="symptoms"
          value={formData.symptoms}
          onChange={handleInputChange}
          sx={{ mt: 3 }}
        />
      </SectionCard>

      <SectionCard title="Payment Method">
        <RadioGroup
          row
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleInputChange}
        >
          <FormControlLabel value="UPI" control={<Radio />} label="UPI (Online)" />
          <FormControlLabel
            value="Cash on Collection"
            control={<Radio />}
            label="Cash on Collection"
          />
        </RadioGroup>
      </SectionCard>
    </>
  );

  const renderStep5 = () => (
    <>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderLeft: `5px solid ${THEME_COLOR}`,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#333", mb: 2 }}
        >
          Order Summary
        </Typography>

        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                 <Typography variant="subtitle2" color="text.secondary">Patient</Typography>
                 <Typography variant="body1">{formData.fullName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                 <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                 <Typography variant="body1">{formData.city} - {formData.pincode}</Typography>
            </Grid>
        </Grid>
        <Divider sx={{ my: 2 }}/>

        {formData.selectedTests.length > 0 ? (
          formData.selectedTests.map((testName, index) => {
            const testObj = AVAILABLE_TESTS.find((t) => t.name === testName);
            return (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="body2">{testName}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ₹{testObj?.price}
                </Typography>
              </Box>
            );
          })
        ) : (
          <Typography color="error">No tests selected</Typography>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 2,
            pt: 2,
            borderTop: "2px solid #eee",
          }}
        >
          <Typography variant="h6">Total Payable</Typography>
          <Typography variant="h5" sx={{ color: THEME_COLOR, fontWeight: "bold" }}>
            ₹{calculateTotal()}
          </Typography>
        </Box>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Payment Mode: {formData.paymentMethod}
        </Typography>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, bgcolor: "transparent" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.consent}
              onChange={handleConsentChange}
              sx={{
                color: THEME_COLOR,
                '&.Mui-checked': {
                  color: THEME_COLOR,
                },
              }}
            />
          }
          label={
            <Typography variant="body2">
              I confirm that the information provided is accurate and I consent
              to sample collection and test processing. *
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
          <Paper
            elevation={3}
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: 3,
              borderTop: `10px solid ${THEME_COLOR}`,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 80, color: THEME_COLOR, mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Booking Confirmed!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you, {formData.fullName}. Your test order has been placed
              successfully.
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: "#e3f2fd", borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total Amount: ₹{calculateTotal()}
              </Typography>
              <Typography variant="caption">
                Payment Mode: {formData.paymentMethod}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              sx={{ mt: 4, color: THEME_COLOR, borderColor: THEME_COLOR }}
              onClick={() => (window.location.href = "/")}
            >
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
        {/* Header - Consistent with Blue Theme */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            borderTop: `10px solid ${THEME_COLOR}`,
            bgcolor: "white",
          }}
        >
          <Typography
            variant="h4"
            sx={{ color: THEME_COLOR, fontWeight: "bold" }}
          >
            BIOBURG LABS
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Pathology — Online Lab Test Order
          </Typography>
        </Paper>

        {/* Stepper */}
        <Box sx={{ width: "100%", mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}
                sx={{
                  '& .MuiStepLabel-root .Mui-completed': { color: THEME_COLOR },
                  '& .MuiStepLabel-root .Mui-active': { color: THEME_COLOR },
                }}
              >
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

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 4,
              p: 2,
              bgcolor: "white",
              borderRadius: 2,
            }}
          >
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{ color: THEME_COLOR, borderColor: THEME_COLOR }}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={
                activeStep === steps.length - 1 ? (
                  <CheckCircleIcon />
                ) : (
                  <ArrowForwardIcon />
                )
              }
              sx={{
                bgcolor: THEME_COLOR,
                "&:hover": { bgcolor: THEME_COLOR_DARK },
                px: 4,
              }}
            >
              {activeStep === steps.length - 1 ? "Pay / Confirm" : "Next"}
            </Button>
          </Box>
        </form>
      </Container>
    </Box>
  );
}