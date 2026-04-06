import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box, Container, Paper, Typography, TextField, Button, Grid, FormControl,
  InputLabel, Select, MenuItem, FormControlLabel, Checkbox, FormGroup,
  Avatar, Stepper, Step, StepLabel, InputAdornment, IconButton,
} from "@mui/material";
import {
  MedicalServices, Business, Person, Email, Phone, LocationOn, Lock,
  Visibility, VisibilityOff,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
}));
const StyledButton = styled(Button)(() => ({
  padding: "12px 32px",
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "1rem",
}));

const GREEN      = "#059669";
const DARK_GREEN = "#047857";

const indianStates = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Puducherry",
];

const steps = ["Pharmacy Details", "Contact Information", "Services & Security"];

//Math CAPTCHA
function useCaptcha() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [input, setInput] = useState("");
  const refresh = () => {
    setA(Math.floor(Math.random() * 9) + 1);
    setB(Math.floor(Math.random() * 9) + 1);
    setInput("");
  };
  useEffect(() => { refresh(); }, []);
  const valid = parseInt(input, 10) === a + b;
  return { a, b, input, setInput, valid, refresh };
}

function CaptchaBox({ a, b, input, setInput, valid, refresh }) {
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1.5px solid #e2e8f0" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Security Verification
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
        <Box sx={{
          px: 2.5, py: 1, bgcolor: GREEN, borderRadius: 1.5,
          fontFamily: "monospace", fontSize: 18, fontWeight: 800,
          color: "#fff", letterSpacing: 4, userSelect: "none", transform: "skewX(-4deg)",
        }}>
          {a} + {b} = ?
        </Box>
        <TextField
          size="small" placeholder="SUM" value={input}
          onChange={e => setInput(e.target.value)}
          inputProps={{ maxLength: 3, style: { fontWeight: 700, textAlign: "center", width: 56 } }}
          error={input.length > 0 && !valid}
          sx={{ width: 90 }}
        />
        <Button size="small" onClick={refresh} sx={{ minWidth: 0, color: "#64748b", fontSize: 18, p: 0.5 }}>↻</Button>
        {valid && <Typography sx={{ color: GREEN, fontWeight: 700, fontSize: 20 }}>✓</Typography>}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PharmacyRegistration() {
  const navigate = useNavigate();
  const captcha  = useCaptcha();

  const [loading,             setLoading]            = useState(false);
  const [activeStep,          setActiveStep]         = useState(0);
  const [showPassword,        setShowPassword]       = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors,              setErrors]             = useState({});

  const [formData, setFormData] = useState({
    facilityName: "", facilityType: "pharmacy",
    registrationNumber: "", licenseNumber: "", drugLicenseNumber: "",
    establishedYear: "", gstNumber: "", panNumber: "",
    contactPerson: "", designation: "", email: "", phone: "", alternatePhone: "",
    address: "", city: "", state: "", pinCode: "",
    homeDelivery: false, pharmacy24x7: false, onlinePrescription: false, genericMedicines: false,
    operatingHoursFrom: "09:00", operatingHoursTo: "21:00",
    password: "", confirmPassword: "", agreeToTerms: false,
  });

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pharmacyRegDraft");
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft._draftAt) {
          setFormData(f => ({ ...f, ...draft }));
          toast("Draft restored — continue where you left off", { icon: "📋" });
        }
      }
    } catch {}
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const saveDraft = () => {
    localStorage.setItem("pharmacyRegDraft", JSON.stringify({ ...formData, _draftAt: new Date().toISOString() }));
    toast.success("Draft saved");
  };

  const validateStep = step => {
    const e = {};
    if (step === 0) {
      if (!formData.facilityName)        e.facilityName        = "Pharmacy name is required";
      if (!formData.registrationNumber)  e.registrationNumber  = "Registration number is required";
      if (!formData.licenseNumber)       e.licenseNumber       = "License number is required";
      if (!formData.establishedYear)     e.establishedYear     = "Established year is required";
    }
    if (step === 1) {
      if (!formData.contactPerson) e.contactPerson = "Contact person is required";
      if (!formData.email)         e.email         = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Email is invalid";
      if (!formData.phone)         e.phone         = "Phone is required";
      else if (!/^\d{10}$/.test(formData.phone))     e.phone = "Phone must be 10 digits";
      if (!formData.address)       e.address       = "Address is required";
      if (!formData.city)          e.city          = "City is required";
      if (!formData.state)         e.state         = "State is required";
      if (!formData.pinCode)       e.pinCode       = "Pin code is required";
      else if (!/^\d{6}$/.test(formData.pinCode))    e.pinCode = "Must be 6 digits";
    }
    if (step === 2) {
      if (!formData.password)                              e.password        = "Password is required";
      else if (formData.password.length < 6)               e.password        = "Minimum 6 characters";
      if (formData.password !== formData.confirmPassword)  e.confirmPassword = "Passwords do not match";
      if (!formData.agreeToTerms)                          e.agreeToTerms    = "You must agree to terms";
      if (!captcha.valid)                                  e.captcha         = "Please solve the security check";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep(activeStep)) setActiveStep(s => s + 1); };
  const handleBack = () => setActiveStep(s => s - 1);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateStep(2)) return;
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_API}/api/pharmacy/register`, { ...formData, facilityType: "pharmacy" });
      if (response.data.success) {
        localStorage.removeItem("pharmacyRegDraft");
        toast.success("Pharmacy registered! Awaiting admin approval.");
        setTimeout(() => navigate("/pharmacy/login"), 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
      captcha.refresh();
    } finally {
      setLoading(false);
    }
  };

  const renderStep = step => {
    if (step === 0) return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <MedicalServices sx={{ color: GREEN }} /> Pharmacy Information
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Pharmacy Name *" name="facilityName" value={formData.facilityName}
            onChange={handleChange} error={!!errors.facilityName} helperText={errors.facilityName}
            InputProps={{ startAdornment: <InputAdornment position="start"><Business /></InputAdornment> }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Pharmacy Type</InputLabel>
            <Select name="facilityType" value={formData.facilityType} onChange={handleChange} label="Pharmacy Type">
              <MenuItem value="pharmacy">Standalone Pharmacy</MenuItem>
              <MenuItem value="both">Pharmacy with Clinic</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Registration Number *" name="registrationNumber" value={formData.registrationNumber}
            onChange={handleChange} error={!!errors.registrationNumber} helperText={errors.registrationNumber} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Drug License Number *" name="licenseNumber" value={formData.licenseNumber}
            onChange={handleChange} error={!!errors.licenseNumber} helperText={errors.licenseNumber} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Established Year *" name="establishedYear" type="number" value={formData.establishedYear}
            onChange={handleChange} error={!!errors.establishedYear} helperText={errors.establishedYear}
            inputProps={{ min: 1900, max: new Date().getFullYear() }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="GST Number (Optional)" name="gstNumber" value={formData.gstNumber} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="PAN Number (Optional)" name="panNumber" value={formData.panNumber} onChange={handleChange} />
        </Grid>
      </Grid>
    );

    if (step === 1) return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Person sx={{ color: GREEN }} /> Contact & Address
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
          <TextField fullWidth label="Alternate Phone" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} />
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
                ["homeDelivery",       "Home Delivery"],
                ["pharmacy24x7",       "24/7 Pharmacy"],
                ["onlinePrescription", "Online Prescription Accepted"],
                ["genericMedicines",   "Generic Medicines Available"],
              ].map(([name, label]) => (
                <Grid item xs={12} sm={6} key={name}>
                  <FormControlLabel
                    control={<Checkbox checked={formData[name]} onChange={handleChange} name={name} sx={{ color:GREEN, "&.Mui-checked":{ color:GREEN } }}/>}
                    label={label} />
                </Grid>
              ))}
            </Grid>
          </FormGroup>
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
            type={showPassword ? "text" : "password"} value={formData.password}
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
            type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword}
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
            control={<Checkbox checked={formData.agreeToTerms} onChange={handleChange} name="agreeToTerms" sx={{ color:GREEN, "&.Mui-checked":{ color:GREEN } }}/>}
            label={
              <Typography variant="body2">
                I agree to the{" "}
                <a href="/terms"   target="_blank" style={{ color: GREEN }}>Terms</a> and{" "}
                <a href="/privacy" target="_blank" style={{ color: GREEN }}>Privacy Policy</a>
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
    <Box sx={{ minHeight: "100vh", bgcolor: "#f1f5f9", py: 6 }}>
      <Container maxWidth="md">
        <Box textAlign="center" mb={4}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: GREEN, margin: "0 auto 16px" }}>
            <MedicalServices sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={700} gutterBottom>Pharmacy Registration</Typography>
          <Typography variant="body1" color="text.secondary">
            Register your pharmacy in the Bioburg network
          </Typography>
        </Box>

        <StyledPaper>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          <form onSubmit={handleSubmit}>
            {renderStep(activeStep)}

            <Box sx={{ display:"flex", justifyContent:"space-between", mt:4, flexWrap:"wrap", gap:1 }}>
              <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined" sx={{ minWidth:120 }}>
                Back
              </Button>

              <Box sx={{ display:"flex", gap:1.5, flexWrap:"wrap" }}>
                {/* Save Draft on any step */}
                <Button variant="outlined" onClick={saveDraft}
                  sx={{ minWidth:130, color:"#64748b", borderColor:"#cbd5e1" }}>
                  Save Draft
                </Button>

                {activeStep === steps.length - 1 ? (
                  <>
                    <StyledButton variant="outlined" onClick={() => { saveDraft(); navigate("/"); }}
                      sx={{ minWidth:140, color:"#64748b", borderColor:"#cbd5e1" }}>
                      Save &amp; Exit
                    </StyledButton>
                    <StyledButton type="submit" variant="contained"
                      disabled={loading || !captcha.valid}
                      sx={{ minWidth:200, bgcolor: GREEN, "&:hover": { bgcolor: DARK_GREEN }, "&:disabled": { bgcolor: "#94a3b8" } }}>
                      {loading ? "Registering..." : "Complete Registration"}
                    </StyledButton>
                  </>
                ) : (
                  <StyledButton variant="contained" onClick={handleNext}
                    sx={{ minWidth:120, bgcolor: GREEN, "&:hover": { bgcolor: DARK_GREEN } }}>
                    Next
                  </StyledButton>
                )}
              </Box>
            </Box>
          </form>
        </StyledPaper>

        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Already registered?{" "}
            <a href="/pharmacy/login" style={{ color: GREEN, fontWeight: 600 }}>Login here</a>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}