import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import { MANUFACTURER_API_BASE } from "./manufacturerApi";

const THEME_COLOR = "#1976d2";
const THEME_COLOR_DARK = "#115293";

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
    {subtitle ? (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {subtitle}
      </Typography>
    ) : null}
    <Box sx={{ mt: 2 }}>{children}</Box>
  </Paper>
);

const steps = [
  "Personal & Company Info",
  "Manufacturing Details",
  "Quality & Operations",
  "Banking & Login",
];

export default function PharmaManufacturerForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    dob: "",
    personalMobile: "",
    companyName: "",
    companyType: "",
    yearEst: "",
    corpRegNum: "",
    headOfficeAddress: "",
    factoryAddress: "",
    officialEmail: "",
    officialContact: "",
    authName: "",
    authDesignation: "",
    authMobile: "",
    authEmail: "",
    productTypes: [],
    productionCapacity: "",
    licenseNumber: "",
    productListFile: null,
    licenseFile: null,
    gmpCertFile: null,
    isoCertFile: null,
    qualityCerts: [],
    qualityTestDocs: null,
    mfgAccepted: [],
    moq: "",
    businessTerms: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    paymentMethod: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxGroup = (event, fieldName) => {
    const { value, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [fieldName]: checked
        ? [...prev[fieldName], value]
        : prev[fieldName].filter((item) => item !== value),
    }));
  };

  const handleFileChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.files?.[0] || null,
    }));
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
      return;
    }

    setActiveStep((prev) => prev + 1);
    window.scrollTo(0, 0);
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
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const payload = new FormData();

      [
        "fullName",
        "gender",
        "dob",
        "personalMobile",
        "companyName",
        "companyType",
        "yearEst",
        "corpRegNum",
        "headOfficeAddress",
        "factoryAddress",
        "officialEmail",
        "officialContact",
        "authName",
        "authDesignation",
        "authMobile",
        "authEmail",
        "productionCapacity",
        "licenseNumber",
        "moq",
        "businessTerms",
        "bankName",
        "accountHolder",
        "accountNumber",
        "ifscCode",
        "paymentMethod",
        "username",
        "password",
      ].forEach((key) => {
        payload.append(key, formData[key] || "");
      });

      payload.append("productTypes", JSON.stringify(formData.productTypes || []));
      payload.append("qualityCerts", JSON.stringify(formData.qualityCerts || []));
      payload.append("mfgAccepted", JSON.stringify(formData.mfgAccepted || []));

      if (formData.productListFile) {
        payload.append("productListFile", formData.productListFile);
      }
      if (formData.licenseFile) {
        payload.append("licenseFile", formData.licenseFile);
      }
      if (formData.gmpCertFile) {
        payload.append("gmpCertFile", formData.gmpCertFile);
      }
      if (formData.isoCertFile) {
        payload.append("isoCertFile", formData.isoCertFile);
      }
      if (formData.qualityTestDocs) {
        payload.append("qualityTestDocs", formData.qualityTestDocs);
      }

      await axios.post(`${MANUFACTURER_API_BASE}/register`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const renderStep1 = () => (
    <>
      <SectionCard title="Personal Information" required>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
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
            <FormControl component="fieldset" required>
              <FormLabel component="legend" sx={{ fontSize: "0.8rem" }}>
                Gender
              </FormLabel>
              <RadioGroup
                row
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
                <FormControlLabel value="Female" control={<Radio size="small" />} label="Female" />
                <FormControlLabel value="Other" control={<Radio size="small" />} label="Other" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              type="date"
              fullWidth
              label="Date of Birth"
              variant="standard"
              name="dob"
              InputLabelProps={{ shrink: true }}
              value={formData.dob}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Mobile Number"
              variant="standard"
              name="personalMobile"
              value={formData.personalMobile}
              onChange={handleInputChange}
              required
            />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Company Details" required>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Manufacturer / Company Name"
              variant="standard"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="standard" required>
              <InputLabel>Company Type</InputLabel>
              <Select
                name="companyType"
                value={formData.companyType}
                onChange={handleInputChange}
              >
                <MenuItem value="Pharmaceutical Manufacturer">
                  Pharmaceutical Manufacturer
                </MenuItem>
                <MenuItem value="API Manufacturer">API Manufacturer</MenuItem>
                <MenuItem value="Nutraceutical Manufacturer">
                  Nutraceutical Manufacturer
                </MenuItem>
                <MenuItem value="Ayurvedic / Herbal Manufacturer">
                  Ayurvedic / Herbal Manufacturer
                </MenuItem>
                <MenuItem value="Cosmetics / Personal Care Manufacturer">
                  Cosmetics / Personal Care Manufacturer
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Year of Establishment"
              variant="standard"
              name="yearEst"
              value={formData.yearEst}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Corporate Registration Number"
              variant="standard"
              name="corpRegNum"
              value={formData.corpRegNum}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Official Contact Number"
              variant="standard"
              name="officialContact"
              value={formData.officialContact}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Official Email"
              variant="standard"
              name="officialEmail"
              value={formData.officialEmail}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Head Office Address"
              variant="standard"
              name="headOfficeAddress"
              value={formData.headOfficeAddress}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Factory / Plant Address"
              variant="standard"
              name="factoryAddress"
              value={formData.factoryAddress}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Authorized Contact Person">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name"
              variant="standard"
              name="authName"
              value={formData.authName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Designation"
              variant="standard"
              name="authDesignation"
              value={formData.authDesignation}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Mobile Number"
              variant="standard"
              name="authMobile"
              value={formData.authMobile}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email ID"
              variant="standard"
              name="authEmail"
              value={formData.authEmail}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>
      </SectionCard>
    </>
  );

  const renderStep2 = () => (
    <>
      <SectionCard title="Manufacturing Details" required>
        <Typography variant="subtitle2" gutterBottom>
          Type of Products Manufactured
        </Typography>
        <FormGroup row sx={{ mb: 2 }}>
          {[
            "Tablets",
            "Capsules",
            "Syrups",
            "Dry Syrups",
            "Injections (Liquid/Dry)",
            "Ointments / Creams / Lotions",
            "Soft Gel Capsules",
            "Ayurvedic / Herbal",
            "Nutraceuticals",
            "API Manufacturing",
          ].map((product) => (
            <FormControlLabel
              key={product}
              control={
                <Checkbox
                  checked={formData.productTypes.includes(product)}
                  onChange={(event) => handleCheckboxGroup(event, "productTypes")}
                  value={product}
                  sx={{
                    color: THEME_COLOR,
                    "&.Mui-checked": { color: THEME_COLOR },
                  }}
                />
              }
              label={product}
              sx={{ width: { xs: "100%", sm: "45%" } }}
            />
          ))}
        </FormGroup>

        <TextField
          fullWidth
          label="Production Capacity"
          variant="standard"
          name="productionCapacity"
          value={formData.productionCapacity}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Manufacturing License Number"
          variant="standard"
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleInputChange}
          required
        />
      </SectionCard>

      <SectionCard
        title="Document Uploads"
        required
        subtitle="Upload clear PDF or Image files"
      >
        <Grid container spacing={2}>
          {[
            { label: "Complete Product List (PDF/Excel)", name: "productListFile" },
            { label: "Manufacturing License", name: "licenseFile" },
            { label: "GMP / WHO GMP Certificate", name: "gmpCertFile" },
            { label: "ISO / FDA / Other Certifications", name: "isoCertFile" },
          ].map((doc) => (
            <Grid item xs={12} md={6} key={doc.name}>
              <Typography variant="subtitle2" gutterBottom>
                {doc.label}
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  borderColor: THEME_COLOR,
                  color: THEME_COLOR,
                }}
              >
                {formData[doc.name] ? "File Selected" : "Upload File"}
                <input type="file" hidden name={doc.name} onChange={handleFileChange} />
              </Button>
            </Grid>
          ))}
        </Grid>
      </SectionCard>
    </>
  );

  const renderStep3 = () => (
    <>
      <SectionCard title="Quality & Compliance">
        <Typography variant="subtitle2" gutterBottom>
          Quality Certifications
        </Typography>
        <FormGroup row>
          {[
            "GMP",
            "WHO-GMP",
            "ISO 9001",
            "ISO 22000",
            "US-FDA Approved",
            "EU-GMP",
            "Regular State FDA Approval",
          ].map((cert) => (
            <FormControlLabel
              key={cert}
              control={
                <Checkbox
                  checked={formData.qualityCerts.includes(cert)}
                  onChange={(event) => handleCheckboxGroup(event, "qualityCerts")}
                  value={cert}
                  sx={{
                    color: THEME_COLOR,
                    "&.Mui-checked": { color: THEME_COLOR },
                  }}
                />
              }
              label={cert}
              sx={{ width: { xs: "100%", sm: "45%" } }}
            />
          ))}
        </FormGroup>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Upload Quality Testing Documents
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ borderColor: THEME_COLOR, color: THEME_COLOR }}
          >
            {formData.qualityTestDocs ? "File Selected" : "Upload File"}
            <input type="file" hidden name="qualityTestDocs" onChange={handleFileChange} />
          </Button>
        </Box>
      </SectionCard>

      <SectionCard title="Contract Manufacturing Preferences">
        <Typography variant="subtitle2" gutterBottom>
          Type of Manufacturing Accepted
        </Typography>
        <FormGroup row>
          {[
            "Third Party Manufacturing",
            "Private Label Manufacturing",
            "Bulk Manufacturing Supply",
            "Export Manufacturing",
          ].map((type) => (
            <FormControlLabel
              key={type}
              control={
                <Checkbox
                  checked={formData.mfgAccepted.includes(type)}
                  onChange={(event) => handleCheckboxGroup(event, "mfgAccepted")}
                  value={type}
                  sx={{
                    color: THEME_COLOR,
                    "&.Mui-checked": { color: THEME_COLOR },
                  }}
                />
              }
              label={type}
            />
          ))}
        </FormGroup>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Minimum Order Quantity (MOQ)"
              variant="standard"
              name="moq"
              value={formData.moq}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Expected Business Terms"
              variant="standard"
              name="businessTerms"
              value={formData.businessTerms}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>
      </SectionCard>
    </>
  );

  const renderStep4 = () => (
    <>
      <SectionCard title="Banking & Payment Details">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Bank Name"
              variant="standard"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Account Holder Name"
              variant="standard"
              name="accountHolder"
              value={formData.accountHolder}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Account Number"
              variant="standard"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="IFSC / SWIFT Code"
              variant="standard"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="standard">
              <InputLabel>Preferred Payment Method</InputLabel>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
              >
                <MenuItem value="NEFT / RTGS">NEFT / RTGS</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="LC (Letter of Credit)">LC (Letter of Credit)</MenuItem>
                <MenuItem value="Advance Payment">Advance Payment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Login Credentials" required>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create an account to manage your profile and orders.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Create Username"
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
              type="password"
              label="Create Password"
              variant="standard"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="password"
              label="Confirm Password"
              variant="standard"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </Grid>
        </Grid>
      </SectionCard>
    </>
  );

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
              Application Submitted!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you for registering <b>{formData.companyName}</b> as a
              manufacturing partner.
            </Typography>
            <Typography variant="body1" paragraph>
              Your profile is now under admin review. Login access will open once your documents and compliance checks are approved.
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 3, color: THEME_COLOR, borderColor: THEME_COLOR }}
              onClick={() => {
                window.location.href = "/";
              }}
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
          <Typography variant="h4" sx={{ color: THEME_COLOR, fontWeight: "bold" }}>
            BIOBURG MFG
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Online Registration Form for Manufacturer of Pharmaceutical Products
          </Typography>
        </Paper>

        <Box sx={{ width: "100%", mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step
                key={label}
                sx={{
                  "& .MuiStepLabel-root .Mui-completed": { color: THEME_COLOR },
                  "& .MuiStepLabel-root .Mui-active": { color: THEME_COLOR },
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
                onClick={handleSaveDraft}
                startIcon={<SaveIcon />}
                sx={{ color: "#666", mr: 2 }}
              >
                Save Draft
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
                  px: 3,
                }}
              >
                {activeStep === steps.length - 1
                  ? "Submit Registration"
                  : "Next"}
              </Button>
            </Box>
          </Box>
        </form>
      </Container>
    </Box>
  );
}
