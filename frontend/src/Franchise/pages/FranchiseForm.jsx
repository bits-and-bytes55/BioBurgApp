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
  Checkbox,
  FormGroup,
  Button,
  Paper,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { FranchiseConsoleStyles } from "../components/consoleUi";
import { FRANCHISE_API_BASE } from "../franchiseApi";

// ── LIGHT THEME CONSTANTS ──────────────────────────────────────────────────
const THEME_COLOR = "#d97706";
const PANEL_BG    = "#ffffff";
const PANEL_BORDER = "rgba(0,0,0,0.08)";
const MUTED_TEXT  = "#64748b";

const INPUT_SX = {
  "& .MuiInputBase-root": { color: "#111827" },
  "& .MuiInputLabel-root": { color: MUTED_TEXT },
  "& .MuiInputLabel-root.Mui-focused": { color: "#92400e" },
  "& .MuiInput-root::before": { borderBottomColor: "rgba(0,0,0,0.12)" },
  "& .MuiInput-root:hover:not(.Mui-disabled, .Mui-error)::before": {
    borderBottomColor: "rgba(202,138,4,0.55)",
  },
  "& .MuiInput-root::after": { borderBottomColor: THEME_COLOR },
  "& .MuiSelect-select": { color: "#111827" },
  "& .MuiSvgIcon-root": { color: MUTED_TEXT },
};

// ── SectionCard ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, children, required = false, subtitle = "" }) => (
  <Paper
    sx={{
      position: "relative",
      overflow: "hidden",
      p: { xs: 2.5, md: 3.5 },
      mb: 2.5,
      borderRadius: 5,
      border: `1px solid ${PANEL_BORDER}`,
      bgcolor: PANEL_BG,
      background: PANEL_BG,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",

      /* Amber accent line top-left */
      "&::before": {
        content: '""',
        position: "absolute",
        left: 24,
        top: 0,
        width: 72,
        height: 2,
        background: "linear-gradient(90deg, rgba(217,119,6,0.85), transparent)",
        borderRadius: "0 0 4px 4px",
      },
    }}
  >
    <Typography
      className="console-display"
      sx={{
        fontSize: { xs: 17, md: 20 },
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        fontWeight: 700,
        color: "#111827",
      }}
    >
      {title} {required && <span style={{ color: "#dc2626" }}>*</span>}
    </Typography>

    {subtitle && (
      <Typography sx={{ mb: 2, mt: 0.75, color: MUTED_TEXT, lineHeight: 1.7, fontSize: 13.5 }}>
        {subtitle}
      </Typography>
    )}

    <Box
      sx={{
        mt: 2.5,
        "& .MuiFormControl-root": INPUT_SX,
        "& .MuiTextField-root": INPUT_SX,
        "& .MuiFormControlLabel-label": {
          color: "#374151",
          fontSize: 14,
          lineHeight: 1.8,
        },
        "& .MuiRadio-root, & .MuiCheckbox-root": {
          color: "rgba(202,138,4,0.45)",
        },
        "& .MuiRadio-root.Mui-checked, & .MuiCheckbox-root.Mui-checked": {
          color: THEME_COLOR,
        },
        "& .MuiTypography-caption": { color: MUTED_TEXT },
      }}
    >
      {children}
    </Box>
  </Paper>
);

// ── DocumentUploadField ───────────────────────────────────────────────────────
const DocumentUploadField = ({ label, name, file, onChange }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 4,
      border: "1px dashed rgba(0,0,0,0.14)",
      bgcolor: "rgba(0,0,0,0.015)",
    }}
  >
    <Button
      variant="outlined"
      component="label"
      fullWidth
      sx={{
        justifyContent: "space-between",
        borderRadius: 999,
        borderColor: "rgba(202,138,4,0.35)",
        color: "#92400e",
        textTransform: "none",
        fontWeight: 700,
        minHeight: 46,
        bgcolor: "rgba(234,179,8,0.04)",
        "&:hover": {
          borderColor: "rgba(202,138,4,0.60)",
          bgcolor: "rgba(234,179,8,0.09)",
        },
      }}
    >
      {label}
      <input hidden type="file" accept="image/*,.pdf" onChange={(event) => onChange(event, name)} />
    </Button>
    <Typography sx={{ mt: 1.5, color: MUTED_TEXT, fontSize: 13, lineHeight: 1.7 }}>
      {file ? `Selected: ${file.name}` : "JPG, PNG or PDF"}
    </Typography>
  </Box>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const steps = [
  "General Information",
  "Needs & Challenges",
  "Investment & Business Model",
  "Location & Feedback",
];

const outlinedButtonSx = {
  minHeight: 46,
  borderRadius: 999,
  textTransform: "none",
  fontWeight: 700,
  borderColor: "rgba(0,0,0,0.12)",
  color: "#374151",
  bgcolor: "#ffffff",
  "&:hover": {
    borderColor: "rgba(202,138,4,0.45)",
    bgcolor: "#fffbeb",
  },
};

const filledButtonSx = {
  minHeight: 52,
  borderRadius: 999,
  px: 4,
  textTransform: "none",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  color: "#ffffff",
  background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
  boxShadow: "0 8px 24px rgba(217,119,6,0.28)",
  "&:hover": {
    background: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)",
    boxShadow: "0 10px 28px rgba(217,119,6,0.36)",
  },
  "&.Mui-disabled": {
    color: "rgba(255,255,255,0.55)",
    background: "rgba(217,119,6,0.38)",
  },
};

const pageShellSx = {
  position: "relative",
  minHeight: "100vh",
  overflow: "hidden",
  bgcolor: "#f5f7fa",
  color: "#111827",
  background: "linear-gradient(160deg, #ffffff 0%, #f3f6fb 50%, #edf1f7 100%)",

  /* Ambient tints */
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: [
      "radial-gradient(ellipse 40% 30% at 2% 0%, rgba(234,179,8,0.07) 0%, transparent 100%)",
      "radial-gradient(ellipse 30% 22% at 98% 0%, rgba(59,130,246,0.05) 0%, transparent 100%)",
    ].join(", "),
    pointerEvents: "none",
  },

  /* Dot grid */
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    maskImage: "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 65%)",
    WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 65%)",
    pointerEvents: "none",
  },

  /* Stepper overrides */
  "& .MuiStepLabel-label": { color: "#64748b", fontWeight: 600 },
  "& .MuiStepLabel-label.Mui-active": { color: "#111827" },
  "& .MuiStepLabel-label.Mui-completed": { color: "#374151" },
  "& .MuiStepIcon-root": { color: "rgba(0,0,0,0.12)" },
  "& .MuiStepIcon-root.Mui-active": { color: "#d97706" },
  "& .MuiStepIcon-root.Mui-completed": { color: "#059669" },
  "& .MuiStepConnector-line": { borderColor: "rgba(0,0,0,0.10)" },
};

export default function FranchiseForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "", gender: "", dob: "", mobile: "", email: "",
    isDoctor: "", pathyExpertise: "", patientsPerDay: "",
    agreementRating: "", additionalSupport: [], otherSupportText: "",
    similarBusiness: "", concerns: [], otherConcernText: "",
    challenges: [], otherChallengeText: "",
    investmentBandwidth: "", franchiseModel: "", investmentTimeline: "",
    roiExpectation: "", investingCapacity: "", multipleFranchises: "",
    numberOfStores: "", appealingAspects: [], otherAppealingText: "",
    nearbyPharmacy: "", whyBioburg: "", legalDisputes: "",
    citiesOfInterest: "", locality: "", marketConnect: "",
    locationType: "", comments: "",
  });

  const [documentFiles, setDocumentFiles] = useState({
    profilePhoto: null, governmentId: null,
    addressProof: null, businessProof: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (event, name) => {
    const file = event.target.files?.[0] || null;
    setDocumentFiles((prev) => ({ ...prev, [name]: file }));
  };

  const handleMultiSelect = (e, name, limit = null) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      let currentArray = prev[name];
      let newArray;
      if (checked) {
        if (limit && currentArray.length >= limit) {
          alert(`You can only select up to ${limit} options.`);
          return prev;
        }
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter((item) => item !== value);
      }
      return { ...prev, [name]: newArray };
    });
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      await handleSubmit();
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
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) { payload.append(key, JSON.stringify(value)); return; }
        payload.append(key, value || "");
      });
      Object.entries(documentFiles).forEach(([key, file]) => {
        if (file) payload.append(key, file);
      });
      await axios.post(`${FRANCHISE_API_BASE}/apply`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step renders ─────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <SectionCard title="1. Full Name" required>
        <TextField fullWidth variant="standard" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Enter your full name" />
      </SectionCard>
      <SectionCard title="2. Gender" required>
        <RadioGroup row name="gender" value={formData.gender} onChange={handleInputChange}>
          <FormControlLabel value="Male" control={<Radio />} label="Male" />
          <FormControlLabel value="Female" control={<Radio />} label="Female" />
          <FormControlLabel value="Other" control={<Radio />} label="Other" />
        </RadioGroup>
      </SectionCard>
      <SectionCard title="3. Date of Birth">
        <TextField type="date" fullWidth variant="standard" name="dob" InputLabelProps={{ shrink: true }} value={formData.dob} onChange={handleInputChange} />
      </SectionCard>
      <SectionCard title="Contact Information" required>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="4. Mobile Number" variant="standard" name="mobile" value={formData.mobile} onChange={handleInputChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="5. Email ID" variant="standard" name="email" value={formData.email} onChange={handleInputChange} />
          </Grid>
        </Grid>
      </SectionCard>
      <SectionCard title="6. Are you a practicing doctor?">
        <RadioGroup row name="isDoctor" value={formData.isDoctor} onChange={handleInputChange}>
          <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
          <FormControlLabel value="No" control={<Radio />} label="No" />
        </RadioGroup>
      </SectionCard>
      {formData.isDoctor === "Yes" && (
        <>
          <SectionCard title="7. Pathy Expertise">
            <FormControl fullWidth variant="standard">
              <Select name="pathyExpertise" value={formData.pathyExpertise} onChange={handleInputChange}>
                {["Homoeopathy","Ayurveda","Unani","Naturopathy","Siddha","Others"].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </SectionCard>
          <SectionCard title="8. How many patients do you see in a day?">
            <TextField fullWidth variant="standard" name="patientsPerDay" type="number" placeholder="i.e 300" value={formData.patientsPerDay} onChange={handleInputChange} />
          </SectionCard>
        </>
      )}
    </>
  );

  const renderStep2 = () => (
    <>
      <SectionCard title="9. Understanding Healthcare Professional's Needs">
        <Typography gutterBottom variant="body2" sx={{ color: "#374151" }}>
          Rate your agreement: "Having a pharmacy in my clinic will significantly improve patient satisfaction and outcomes"
        </Typography>
        <RadioGroup name="agreementRating" value={formData.agreementRating} onChange={handleInputChange}>
          {["Strongly Disagree","Disagree","Neutral","Agree","Strongly Agree"].map((opt) => (
            <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
          ))}
        </RadioGroup>
      </SectionCard>
      <SectionCard title="10. What additional support would make Bioburg appealing?" subtitle="(Select Maximum 2)">
        <FormGroup>
          {["Financial assistance","Marketing support","Training programs","Inventory management systems","Centralized Ordering Systems","Other"].map((option) => (
            <FormControlLabel key={option} control={<Checkbox checked={formData.additionalSupport.includes(option)} onChange={(e) => handleMultiSelect(e, "additionalSupport", 2)} value={option} sx={{ color: THEME_COLOR, "&.Mui-checked": { color: THEME_COLOR } }} />} label={option} />
          ))}
        </FormGroup>
        {formData.additionalSupport.includes("Other") && (
          <TextField fullWidth variant="standard" label="Please specify other support" name="otherSupportText" value={formData.otherSupportText} onChange={handleInputChange} sx={{ mt: 1 }} />
        )}
      </SectionCard>
      <SectionCard title="11. Do you own/operate any similar business?">
        <TextField fullWidth multiline rows={2} variant="standard" name="similarBusiness" placeholder="If yes, provide details and years of experience" value={formData.similarBusiness} onChange={handleInputChange} />
      </SectionCard>
      <SectionCard title="12. Biggest concerns about adding a pharmacy?" subtitle="(Select Maximum 2)">
        <FormGroup>
          {["Financial risk","Space constraints","Lack of expertise","Impact on patient services","Operational complexity","Other"].map((option) => (
            <FormControlLabel key={option} control={<Checkbox checked={formData.concerns.includes(option)} onChange={(e) => handleMultiSelect(e, "concerns", 2)} value={option} sx={{ color: THEME_COLOR, "&.Mui-checked": { color: THEME_COLOR } }} />} label={option} />
          ))}
        </FormGroup>
        {formData.concerns.includes("Other") && (
          <TextField fullWidth variant="standard" label="Please specify other concern" name="otherConcernText" value={formData.otherConcernText} onChange={handleInputChange} sx={{ mt: 1 }} />
        )}
      </SectionCard>
      <SectionCard title="13. Primary challenges foreseen in integration?" subtitle="(Select Maximum 2)">
        <FormGroup>
          {["IT and infrastructure management","Regulatory compliance","High initial investment","Managing additional staff","Space constraints","Other"].map((option) => (
            <FormControlLabel key={option} control={<Checkbox checked={formData.challenges.includes(option)} onChange={(e) => handleMultiSelect(e, "challenges", 2)} value={option} sx={{ color: THEME_COLOR, "&.Mui-checked": { color: THEME_COLOR } }} />} label={option} />
          ))}
        </FormGroup>
        {formData.challenges.includes("Other") && (
          <TextField fullWidth variant="standard" label="Please specify other challenge" name="otherChallengeText" value={formData.otherChallengeText} onChange={handleInputChange} sx={{ mt: 1 }} />
        )}
      </SectionCard>
    </>
  );

  const renderStep3 = () => (
    <>
      <SectionCard title="A. What is your Investment Bandwidth to invest in Bioburg?" subtitle="(Gaining Clarity on the Aspirations and Goals)" required>
        <RadioGroup name="investmentBandwidth" value={formData.investmentBandwidth} onChange={handleInputChange}>
          {["< INR 25 Lakhs","INR 25-50 Lakhs","> INR 50 Lakhs"].map((v) => (
            <FormControlLabel key={v} value={v} control={<Radio />} label={v} />
          ))}
        </RadioGroup>
      </SectionCard>
      <SectionCard title="B. Preferred Franchise Business Model">
        <RadioGroup name="franchiseModel" value={formData.franchiseModel} onChange={handleInputChange}>
          <FormControlLabel value="FOCO" control={<Radio />} label="FOCO: Franchisee Owned, Company Operated" />
          <Typography variant="caption" sx={{ ml: 4, display: "block", mb: 1 }}>
            Franchisee (You) owns the business, company (Bioburg) will be responsible for Operations.
          </Typography>
          <FormControlLabel value="FOFO" control={<Radio />} label="FOFO: Franchisee Owned, Franchisee Operated" />
          <Typography variant="caption" sx={{ ml: 4, display: "block" }}>
            Franchisee (You) owns the business, and You will be responsible for Operations.
          </Typography>
        </RadioGroup>
      </SectionCard>
      <SectionCard title="C. How soon you would be able to invest?">
        <Select fullWidth variant="standard" name="investmentTimeline" value={formData.investmentTimeline} onChange={handleInputChange}>
          {["Immediately","Within 2-3 Months","Within 3-6 Months"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </Select>
      </SectionCard>
      <SectionCard title="D. ROI Expectations (Return on Investment)">
        <Select fullWidth variant="standard" name="roiExpectation" value={formData.roiExpectation} onChange={handleInputChange}>
          {["Less than 1 year","1-2 years","2-3 years","More than 3 years"].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </Select>
      </SectionCard>
      <SectionCard title="E. Will you be investing in your own capacity?">
        <RadioGroup name="investingCapacity" value={formData.investingCapacity} onChange={handleInputChange}>
          <FormControlLabel value="Own Money" control={<Radio />} label="I will be investing my own money" />
          <FormControlLabel value="Partners" control={<Radio />} label="I will be investing along with someone else" />
        </RadioGroup>
      </SectionCard>
      <SectionCard title="14. Will you be interested for multiple franchisees?">
        <RadioGroup row name="multipleFranchises" value={formData.multipleFranchises} onChange={handleInputChange}>
          <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
          <FormControlLabel value="No" control={<Radio />} label="No" />
        </RadioGroup>
      </SectionCard>
      <SectionCard title="15. Number of franchise stores you are planning to invest in?">
        <TextField fullWidth variant="standard" name="numberOfStores" placeholder="Enter Your Answer" value={formData.numberOfStores} onChange={handleInputChange} />
      </SectionCard>
    </>
  );

  const renderStep4 = () => (
    <>
      <SectionCard title="16. What aspects of Bioburg franchise are most appealing?" subtitle="(Select all that apply)">
        <FormGroup>
          {["Brand reputation","Product Range","Financial Terms","Support and Training","Other"].map((option) => (
            <FormControlLabel key={option} control={<Checkbox checked={formData.appealingAspects.includes(option)} onChange={(e) => handleMultiSelect(e, "appealingAspects")} value={option} sx={{ color: THEME_COLOR, "&.Mui-checked": { color: THEME_COLOR } }} />} label={option} />
          ))}
        </FormGroup>
        {formData.appealingAspects.includes("Other") && (
          <TextField fullWidth variant="standard" label="Please specify" name="otherAppealingText" value={formData.otherAppealingText} onChange={handleInputChange} sx={{ mt: 1 }} />
        )}
      </SectionCard>
      <SectionCard title="17. Nearby Pharmacy Competition">
        <Typography variant="body2" sx={{ color: MUTED_TEXT, mb: 1.5 }}>
          Are there any other branded or non-branded Ayush pharmacy near your clinic? If yes, please specify.
        </Typography>
        <TextField fullWidth multiline rows={2} variant="standard" placeholder="Enter specific brands or number of pharmacies" name="nearbyPharmacy" value={formData.nearbyPharmacy} onChange={handleInputChange} />
      </SectionCard>
      <SectionCard title="18. Why are you interested in Bioburg Franchisee?">
        <TextField fullWidth multiline rows={3} variant="standard" name="whyBioburg" placeholder="Enter Your Answer" value={formData.whyBioburg} onChange={handleInputChange} />
      </SectionCard>
      <SectionCard title="19. Legal Disputes">
        <Typography variant="body2" sx={{ color: MUTED_TEXT, mb: 1.5 }}>If you or your firm are involved in any legal disputes (If yes, please specify)</Typography>
        <TextField fullWidth variant="standard" name="legalDisputes" placeholder="Enter Your Answer" value={formData.legalDisputes} onChange={handleInputChange} />
      </SectionCard>
      <SectionCard title="20. Cities of interest for store ownership?">
        <TextField fullWidth label="List the cities where you will be most interested" variant="standard" name="citiesOfInterest" value={formData.citiesOfInterest} onChange={handleInputChange} />
      </SectionCard>
      <SectionCard title="21. Location of Property">
        <TextField fullWidth label="Locality where you want to open your store" variant="standard" name="locality" value={formData.locality} onChange={handleInputChange} />
      </SectionCard>
      <SectionCard title="22. Market Connect">
        <Typography variant="body2" sx={{ color: MUTED_TEXT, mb: 1 }}>Do you have a good local market connect or willingness to develop the same to generate demand?</Typography>
        <RadioGroup row name="marketConnect" value={formData.marketConnect} onChange={handleInputChange}>
          <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
          <FormControlLabel value="No" control={<Radio />} label="No" />
        </RadioGroup>
      </SectionCard>
      <SectionCard title="23. Where do you want to open Bioburg Franchise?">
        <RadioGroup name="locationType" value={formData.locationType} onChange={handleInputChange}>
          <FormControlLabel value="In a Rental Space" control={<Radio />} label="In a Rental Space" />
          <FormControlLabel value="In My Own Space" control={<Radio />} label="In My Own Space" />
          <FormControlLabel value="Convert my clinic" control={<Radio />} label="Convert my clinic (Only for Doctors)" disabled={formData.isDoctor !== "Yes"} />
        </RadioGroup>
      </SectionCard>
      <SectionCard title="Comments / Additional Remarks">
        <TextField fullWidth multiline rows={2} variant="standard" name="comments" placeholder="Any other feedback..." value={formData.comments} onChange={handleInputChange} />
      </SectionCard>
      <SectionCard title="24. KYC & Supporting Documents" subtitle="Upload any available identity and business documents so the admin team can review your request faster.">
        <Grid container spacing={2}>
          {[
            { label: "Profile Photo", name: "profilePhoto" },
            { label: "Government ID", name: "governmentId" },
            { label: "Address Proof", name: "addressProof" },
            { label: "Business Proof", name: "businessProof" },
          ].map(({ label, name }) => (
            <Grid item xs={12} md={6} key={name}>
              <DocumentUploadField label={label} name={name} file={documentFiles[name]} onChange={handleDocumentChange} />
            </Grid>
          ))}
        </Grid>
      </SectionCard>
    </>
  );

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <Box className="franchise-console-root" sx={pageShellSx}>
        <FranchiseConsoleStyles />
        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1, py: { xs: 6, md: 10 } }}>
          <Paper
            sx={{
              p: { xs: 3.5, md: 5 },
              textAlign: "center",
              borderRadius: 7,
              border: `1px solid ${PANEL_BORDER}`,
              background: "#ffffff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 72, color: "#059669", mb: 2.5 }} />
            <Typography
              className="console-display"
              sx={{ fontSize: { xs: 32, md: 44 }, lineHeight: 1, letterSpacing: "-0.04em", fontWeight: 700, color: "#111827" }}
            >
              Thank You
            </Typography>
            <Typography sx={{ mt: 2.5, color: "#374151", lineHeight: 1.9, fontSize: 15 }}>
              Thank you for taking the time to complete our franchise application form. Your insights are valuable to the BioBurg team as we evaluate the right market partners.
            </Typography>
            <Typography sx={{ mt: 2, color: MUTED_TEXT, lineHeight: 1.85, fontSize: 14 }}>
              As a next step, our franchise advisor will connect with you soon. Uploaded documents, if any, are now marked for KYC review.
            </Typography>
            <Button variant="outlined" sx={{ ...outlinedButtonSx, mt: 4 }} onClick={() => { window.location.href = "/"; }}>
              Back to Home
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <Box className="franchise-console-root" sx={pageShellSx}>
      <FranchiseConsoleStyles />

      {/* Amber top bar */}
      <Box
        sx={{
          position: "fixed", top: 0, left: 0, right: 0, height: "3px",
          background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.9) 30%, rgba(217,119,6,1) 50%, rgba(59,130,246,0.5) 78%, transparent)",
          zIndex: 9999, pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 4, md: 6 } }}>

        {/* Hero card */}
        <Paper
          sx={{
            p: { xs: 3, md: 5 }, mb: 3, borderRadius: 7,
            border: `1px solid ${PANEL_BORDER}`,
            background: "linear-gradient(135deg, #fffbf0 0%, #ffffff 60%, #f0f7ff 100%)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          <Box
            className="console-mono"
            sx={{
              display: "inline-flex", px: 1.7, py: 0.9, borderRadius: 999,
              border: "1px solid rgba(202,138,4,0.28)", bgcolor: "rgba(234,179,8,0.08)",
              fontSize: 11, letterSpacing: 2.4, textTransform: "uppercase", color: "#92400e",
            }}
          >
            Franchise onboarding
          </Box>

          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} lg={7}>
              <Typography
                className="console-display"
                sx={{
                  mt: 2.5,
                  fontSize: { xs: 30, md: 48 },
                  lineHeight: 0.97,
                  letterSpacing: "-0.05em",
                  fontWeight: 700,
                  color: "#111827",
                  maxWidth: 620,
                }}
              >
                Join the BioBurg franchise network with a sharper, premium application flow.
              </Typography>
              <Typography sx={{ mt: 2.5, maxWidth: 600, color: MUTED_TEXT, fontSize: 15, lineHeight: 1.9 }}>
                Share your business intent, market readiness, investment comfort, and KYC documents in one professional application workspace.
              </Typography>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Box
                sx={{
                  height: "100%", p: 2.5, borderRadius: 5,
                  border: "1px solid rgba(0,0,0,0.07)",
                  bgcolor: "rgba(0,0,0,0.015)",
                  display: "grid", gap: 1.5, alignContent: "start",
                }}
              >
                {[
                  "Structured 4-step application",
                  "KYC-ready document upload",
                  "Faster admin review and franchise follow-up",
                ].map((item) => (
                  <Box key={item} sx={{ display: "flex", gap: 1.4, alignItems: "center" }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "#d97706", boxShadow: "0 0 14px rgba(217,119,6,0.35)", flexShrink: 0 }} />
                    <Typography sx={{ color: "#374151", fontSize: 14, lineHeight: 1.75 }}>{item}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Stepper */}
        <Paper
          sx={{
            p: { xs: 2.5, md: 3 }, mb: 3.5, borderRadius: 5,
            border: `1px solid ${PANEL_BORDER}`,
            background: "#ffffff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        </Paper>

        {/* Steps */}
        <form>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
          {activeStep === 3 && renderStep4()}

          {/* Nav footer */}
          <Paper
            sx={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: 2, mt: 3, p: 2.5, borderRadius: 5,
              border: `1px solid ${PANEL_BORDER}`,
              background: "#ffffff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              flexWrap: "wrap",
            }}
          >
            <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined" startIcon={<ArrowBackIcon />} sx={outlinedButtonSx}>
              Previous
            </Button>
            <Button
              variant="contained" onClick={handleNext} disabled={submitting}
              endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
              sx={filledButtonSx}
            >
              {submitting ? "Submitting..." : activeStep === steps.length - 1 ? "Submit Application" : "Next Step"}
            </Button>
          </Paper>
        </form>
      </Container>
    </Box>
  );
}