import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  FormHelperText, Chip, IconButton, Tooltip, CircularProgress,
  Paper, Divider, Alert, Snackbar, Grid, InputAdornment,
  Card, CardContent, Avatar, LinearProgress, Stepper, Step,
  StepLabel, StepContent, Badge
} from "@mui/material";
import {
  Add, Close, Refresh, AccountTree, PlayCircle, PauseCircle,
  CheckCircle, RadioButtonUnchecked, FiberManualRecord,
  AssignmentTurnedIn, ExpandMore, Person, Notes, Category,
  Schedule, Visibility, Edit, Flag, Business, Phone,
  CalendarMonth, AccessTime, ErrorOutline
} from "@mui/icons-material";

const API = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem("agentToken");

const WORKFLOW_TYPE_OPTIONS = [
  "Order Processing",
  "Customer Onboarding",
  "Product Complaint",
  "Territory Visit",
  "Sample Distribution",
  "Doctor Enrollment",
  "Distributor Setup",
  "Lead Conversion",
  "Expense Approval",
  "Other",
];

const DEPARTMENT_OPTIONS = [
  "Sales",
  "Marketing",
  "Operations",
  "Finance & Accounts",
  "Logistics",
  "HR & Admin",
  "Technical Support",
  "Management",
  "Other",
];

const STAGE_OPTIONS = [
  "Initiated",
  "Under Review",
  "Approved",
  "In Execution",
  "On Hold",
  "Completed",
  "Rejected",
  "Other",
];

const PRIORITY_OPTIONS = ["Low", "Normal", "High", "Urgent"];

const STATUS_CONFIG = {
  Initiated:      { color: "#6366f1", bg: "#eef2ff", icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} /> },
  "Under Review": { color: "#f59e0b", bg: "#fef3c7", icon: <AccessTime sx={{ fontSize: 16 }} /> },
  Approved:       { color: "#10b981", bg: "#d1fae5", icon: <CheckCircle sx={{ fontSize: 16 }} /> },
  "In Execution": { color: "#3b82f6", bg: "#dbeafe", icon: <PlayCircle sx={{ fontSize: 16 }} /> },
  "On Hold":      { color: "#f97316", bg: "#ffedd5", icon: <PauseCircle sx={{ fontSize: 16 }} /> },
  Completed:      { color: "#059669", bg: "#d1fae5", icon: <AssignmentTurnedIn sx={{ fontSize: 16 }} /> },
  Rejected:       { color: "#ef4444", bg: "#fee2e2", icon: <ErrorOutline sx={{ fontSize: 16 }} /> },
  Other:          { color: "#6b7280", bg: "#f3f4f6", icon: <FiberManualRecord sx={{ fontSize: 16 }} /> },
};

const PRIORITY_COLORS = { Low: "#22c55e", Normal: "#3b82f6", High: "#f59e0b", Urgent: "#ef4444" };

const validate = (f) => {
  const e = {};

  if (!f.title?.trim()) e.title = "Workflow title is required";
  else if (f.title.trim().length < 4) e.title = "At least 4 characters";

  if (!f.workflowType) e.workflowType = "Please select workflow type";
  if (f.workflowType === "Other" && !f.workflowTypeOther?.trim())
    e.workflowTypeOther = "Please describe the workflow type";

  if (!f.department) e.department = "Please select department";
  if (f.department === "Other" && !f.departmentOther?.trim())
    e.departmentOther = "Please describe the department";

  if (!f.currentStage) e.currentStage = "Please select current stage";
  if (f.currentStage === "Other" && !f.currentStageOther?.trim())
    e.currentStageOther = "Please describe the stage";

  if (!f.priority) e.priority = "Please select priority";

  if (!f.description?.trim()) e.description = "Description is required";
  else if (f.description.trim().length < 15) e.description = "At least 15 characters";

  if (f.contactPerson && /\d/.test(f.contactPerson))
    e.contactPerson = "Name cannot contain numbers";

  if (f.contactPhone && !/^\d{10,15}$/.test(f.contactPhone.replace(/\s/g, "")))
    e.contactPhone = "Enter a valid phone number (digits only)";

  if (f.estimatedDays && (isNaN(f.estimatedDays) || Number(f.estimatedDays) < 1))
    e.estimatedDays = "Must be a positive number";

  return e;
};

export default function WorkflowStatus() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewWf, setViewWf] = useState(null);
  const [editStage, setEditStage] = useState(null); // {id, stage, stageOther, note}
  const [filterStage, setFilterStage] = useState("All");
  const [snack, setSnack] = useState({ open: false, msg: "", type: "success" });
  const [errors, setErrors] = useState({});
  const [stageErrors, setStageErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    workflowType: "",
    workflowTypeOther: "",
    department: "",
    departmentOther: "",
    currentStage: "",
    currentStageOther: "",
    priority: "Normal",
    description: "",
    contactPerson: "",
    contactPhone: "",
    estimatedDays: "",
    dueDate: "",
    remarks: "",
  });

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agent/support/workflows`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setWorkflows(data.workflows || []);
    } catch {
      showSnack("Failed to load workflows", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const showSnack = (msg, type = "success") => setSnack({ open: true, msg, type });

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => { const e = { ...p }; delete e[field]; return e; });
  };

  const handlePhoneKeyDown = (e) => {
    const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", "+", " "];
    if (!/\d/.test(e.key) && !allowed.includes(e.key)) e.preventDefault();
  };

  const handleNameKeyDown = (e) => {
    const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter", " ", ".", "-", "'"];
    if (/\d/.test(e.key)) e.preventDefault();
  };

  const handleNumberKeyDown = (e) => {
    const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter"];
    if (!/\d/.test(e.key) && !allowed.includes(e.key)) e.preventDefault();
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        workflowType: form.workflowType === "Other" ? form.workflowTypeOther : form.workflowType,
        department: form.department === "Other" ? form.departmentOther : form.department,
        currentStage: form.currentStage === "Other" ? form.currentStageOther : form.currentStage,
      };
      const res = await fetch(`${API}/api/agent/support/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showSnack("Workflow created successfully!");
        setOpen(false);
        resetForm();
        fetchWorkflows();
      } else {
        showSnack(data.message || "Failed to create workflow", "error");
      }
    } catch {
      showSnack("Server error. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStage = async () => {
    const errs = {};
    if (!editStage?.stage) errs.stage = "Please select a stage";
    if (editStage?.stage === "Other" && !editStage?.stageOther?.trim()) errs.stageOther = "Please describe the stage";
    if (Object.keys(errs).length) { setStageErrors(errs); return; }

    try {
      const stageName = editStage.stage === "Other" ? editStage.stageOther : editStage.stage;
      const res = await fetch(`${API}/api/agent/support/workflows/${editStage.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ stage: stageName, note: editStage.note }),
      });
      const data = await res.json();
      if (data.success) {
        showSnack("Stage updated!");
        setEditStage(null);
        fetchWorkflows();
      } else {
        showSnack(data.message || "Failed to update stage", "error");
      }
    } catch {
      showSnack("Server error.", "error");
    }
  };

  const resetForm = () => {
    setForm({
      title: "", workflowType: "", workflowTypeOther: "", department: "", departmentOther: "",
      currentStage: "", currentStageOther: "", priority: "Normal", description: "",
      contactPerson: "", contactPhone: "", estimatedDays: "", dueDate: "", remarks: "",
    });
    setErrors({});
  };

  const filtered = filterStage === "All"
    ? workflows
    : workflows.filter((w) => w.currentStage === filterStage);

  const allStages = [...new Set(workflows.map((w) => w.currentStage).filter(Boolean))];

  const FieldLabel = ({ label, required }) => (
    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151", mb: 0.5 }}>
      {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </Typography>
  );

  const StageChip = ({ stage }) => {
    const cfg = STATUS_CONFIG[stage] || STATUS_CONFIG.Other;
    return (
      <Chip
        icon={cfg.icon}
        label={stage}
        size="small"
        sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11 }}
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "#7c3aed", width: 44, height: 44 }}>
            <AccountTree />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
              Workflow Status
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
              Track and manage your workflow pipelines
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{ bgcolor: "#7c3aed", borderRadius: 2, fontWeight: 700, px: 3, textTransform: "none" }}
        >
          New Workflow
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total", value: workflows.length, color: "#7c3aed" },
          { label: "In Progress", value: workflows.filter((w) => w.currentStage === "In Execution" || w.currentStage === "Under Review").length, color: "#3b82f6" },
          { label: "Completed", value: workflows.filter((w) => w.currentStage === "Completed").length, color: "#10b981" },
          { label: "On Hold", value: workflows.filter((w) => w.currentStage === "On Hold").length, color: "#f97316" },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "white" }}>
              <Typography sx={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</Typography>
              <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Stage Filter */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "white", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mr: 1 }}>Filter by stage:</Typography>
          {["All", ...Object.keys(STATUS_CONFIG)].map((s) => (
            <Chip
              key={s}
              label={s}
              onClick={() => setFilterStage(s)}
              size="small"
              sx={{
                cursor: "pointer", fontWeight: filterStage === s ? 700 : 400,
                bgcolor: filterStage === s ? "#7c3aed" : "#f3f4f6",
                color: filterStage === s ? "white" : "#374151",
              }}
            />
          ))}
          <Box sx={{ ml: "auto" }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchWorkflows} size="small"><Refresh /></IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Workflow Cards */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#7c3aed" }} />
          <Typography sx={{ mt: 2, color: "#6b7280" }}>Loading workflows...</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px solid #e5e7eb", bgcolor: "white" }}>
          <AccountTree sx={{ fontSize: 56, color: "#d1d5db", mb: 2 }} />
          <Typography sx={{ fontWeight: 600, color: "#374151", fontSize: 16 }}>No workflows found</Typography>
          <Typography sx={{ color: "#9ca3af", mt: 0.5 }}>Start by creating a new workflow</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((wf) => {
            const cfg = STATUS_CONFIG[wf.currentStage] || STATUS_CONFIG.Other;
            return (
              <Grid item xs={12} md={6} key={wf._id}>
                <Paper elevation={0} sx={{
                  p: 2.5, borderRadius: 3, border: `1px solid #e5e7eb`, bgcolor: "white",
                  borderLeft: `4px solid ${cfg.color}`,
                  transition: "all 0.15s",
                  "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#111827", flex: 1 }}>
                      {wf.title}
                    </Typography>
                    <StageChip stage={wf.currentStage} />
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                    <Chip size="small" label={wf.workflowType} sx={{ fontSize: 11, bgcolor: "#f3f4f6", color: "#374151" }} />
                    <Chip size="small" label={wf.department} sx={{ fontSize: 11, bgcolor: "#ede9fe", color: "#7c3aed" }} />
                    {wf.priority && (
                      <Chip size="small" label={wf.priority}
                        sx={{ fontSize: 11, fontWeight: 700, bgcolor: PRIORITY_COLORS[wf.priority] + "20", color: PRIORITY_COLORS[wf.priority] }} />
                    )}
                  </Box>

                  <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {wf.description}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
                    {wf.contactPerson && (
                      <Typography sx={{ fontSize: 11, color: "#6b7280" }}>👤 {wf.contactPerson}</Typography>
                    )}
                    {wf.estimatedDays && (
                      <Typography sx={{ fontSize: 11, color: "#6b7280" }}>⏱ {wf.estimatedDays} days</Typography>
                    )}
                    {wf.dueDate && (
                      <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                        📅 {new Date(wf.dueDate).toLocaleDateString("en-IN")}
                      </Typography>
                    )}
                  </Box>

                  {/* Stage History */}
                  {wf.stageHistory?.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", overflow: "auto" }}>
                        {wf.stageHistory.slice(-4).map((sh, i) => (
                          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                            <Box sx={{
                              width: 6, height: 6, borderRadius: "50%",
                              bgcolor: (STATUS_CONFIG[sh.stage] || STATUS_CONFIG.Other).color,
                            }} />
                            <Typography sx={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap" }}>{sh.stage}</Typography>
                            {i < wf.stageHistory.slice(-4).length - 1 && (
                              <Typography sx={{ fontSize: 10, color: "#d1d5db" }}>→</Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Button size="small" startIcon={<Visibility />} onClick={() => setViewWf(wf)}
                      sx={{ textTransform: "none", color: "#6b7280", fontSize: 12 }}>
                      View
                    </Button>
                    <Button size="small" startIcon={<Edit />}
                      onClick={() => setEditStage({ id: wf._id, stage: wf.currentStage, stageOther: "", note: "" })}
                      sx={{ textTransform: "none", color: "#7c3aed", fontSize: 12, fontWeight: 700 }}>
                      Update Stage
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Workflow Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccountTree sx={{ color: "#7c3aed" }} />
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>New Workflow</Typography>
          </Box>
          <IconButton size="small" onClick={() => { setOpen(false); resetForm(); }}><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2, maxHeight: "70vh", overflowY: "auto" }}>

          {/* Title */}
          <Box>
            <FieldLabel label="Workflow Title" required />
            <TextField fullWidth size="small" placeholder="Enter workflow title"
              value={form.title} onChange={(e) => handleChange("title", e.target.value)}
              error={!!errors.title} helperText={errors.title}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Box>

          {/* Workflow Type */}
          <Box>
            <FieldLabel label="Workflow Type" required />
            <FormControl fullWidth size="small" error={!!errors.workflowType}>
              <Select value={form.workflowType} onChange={(e) => handleChange("workflowType", e.target.value)}
                displayEmpty renderValue={form.workflowType ? undefined : () => <span style={{ color: "#9ca3af" }}>Select type</span>}
                sx={{ borderRadius: 2 }}>
                {WORKFLOW_TYPE_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
              {errors.workflowType && <FormHelperText>{errors.workflowType}</FormHelperText>}
            </FormControl>
            {form.workflowType === "Other" && (
              <TextField fullWidth size="small" placeholder="Describe the workflow type" sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                value={form.workflowTypeOther} onChange={(e) => handleChange("workflowTypeOther", e.target.value)}
                error={!!errors.workflowTypeOther} helperText={errors.workflowTypeOther} />
            )}
          </Box>

          {/* Department */}
          <Box>
            <FieldLabel label="Department" required />
            <FormControl fullWidth size="small" error={!!errors.department}>
              <Select value={form.department} onChange={(e) => handleChange("department", e.target.value)}
                displayEmpty renderValue={form.department ? undefined : () => <span style={{ color: "#9ca3af" }}>Select department</span>}
                sx={{ borderRadius: 2 }}>
                {DEPARTMENT_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
              {errors.department && <FormHelperText>{errors.department}</FormHelperText>}
            </FormControl>
            {form.department === "Other" && (
              <TextField fullWidth size="small" placeholder="Describe the department" sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                value={form.departmentOther} onChange={(e) => handleChange("departmentOther", e.target.value)}
                error={!!errors.departmentOther} helperText={errors.departmentOther} />
            )}
          </Box>

          {/* Current Stage */}
          <Box>
            <FieldLabel label="Current Stage" required />
            <FormControl fullWidth size="small" error={!!errors.currentStage}>
              <Select value={form.currentStage} onChange={(e) => handleChange("currentStage", e.target.value)}
                displayEmpty renderValue={form.currentStage ? undefined : () => <span style={{ color: "#9ca3af" }}>Select stage</span>}
                sx={{ borderRadius: 2 }}>
                {STAGE_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
              {errors.currentStage && <FormHelperText>{errors.currentStage}</FormHelperText>}
            </FormControl>
            {form.currentStage === "Other" && (
              <TextField fullWidth size="small" placeholder="Describe the current stage" sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                value={form.currentStageOther} onChange={(e) => handleChange("currentStageOther", e.target.value)}
                error={!!errors.currentStageOther} helperText={errors.currentStageOther} />
            )}
          </Box>

          {/* Priority */}
          <Box>
            <FieldLabel label="Priority" required />
            <Box sx={{ display: "flex", gap: 1 }}>
              {PRIORITY_OPTIONS.map((p) => (
                <Chip key={p} label={p} onClick={() => handleChange("priority", p)} sx={{
                  cursor: "pointer", fontWeight: 700,
                  bgcolor: form.priority === p ? PRIORITY_COLORS[p] : PRIORITY_COLORS[p] + "20",
                  color: form.priority === p ? "white" : PRIORITY_COLORS[p],
                  border: `1px solid ${PRIORITY_COLORS[p]}`,
                }} />
              ))}
            </Box>
          </Box>

          {/* Description */}
          <Box>
            <FieldLabel label="Description" required />
            <TextField fullWidth multiline rows={3} size="small"
              placeholder="Describe this workflow in detail..."
              value={form.description} onChange={(e) => handleChange("description", e.target.value)}
              error={!!errors.description} helperText={errors.description || `${form.description.length}/1000`}
              inputProps={{ maxLength: 1000 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Box>

          {/* Contact Person - letters only */}
          <Box>
            <FieldLabel label="Contact Person (optional)" />
            <TextField fullWidth size="small" placeholder="Name (letters only)"
              value={form.contactPerson} onChange={(e) => handleChange("contactPerson", e.target.value)}
              onKeyDown={handleNameKeyDown}
              error={!!errors.contactPerson} helperText={errors.contactPerson}
              InputProps={{ startAdornment: <Person sx={{ fontSize: 16, color: "#9ca3af", mr: 0.5 }} /> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Box>

          {/* Contact Phone - digits only */}
          <Box>
            <FieldLabel label="Contact Phone (optional)" />
            <TextField fullWidth size="small" placeholder="10-15 digit phone number"
              value={form.contactPhone} onChange={(e) => handleChange("contactPhone", e.target.value)}
              onKeyDown={handlePhoneKeyDown}
              error={!!errors.contactPhone} helperText={errors.contactPhone}
              inputProps={{ maxLength: 15, inputMode: "numeric" }}
              InputProps={{ startAdornment: <Phone sx={{ fontSize: 16, color: "#9ca3af", mr: 0.5 }} /> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Box>

          {/* Estimated Days - numbers only */}
          <Box>
            <FieldLabel label="Estimated Duration (days)" />
            <TextField fullWidth size="small" placeholder="Number of days"
              value={form.estimatedDays} onChange={(e) => handleChange("estimatedDays", e.target.value)}
              onKeyDown={handleNumberKeyDown}
              error={!!errors.estimatedDays} helperText={errors.estimatedDays}
              inputProps={{ maxLength: 4, inputMode: "numeric" }}
              InputProps={{ startAdornment: <AccessTime sx={{ fontSize: 16, color: "#9ca3af", mr: 0.5 }} /> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Box>

          {/* Due Date */}
          <Box>
            <FieldLabel label="Due Date (optional)" />
            <TextField fullWidth size="small" type="date"
              value={form.dueDate} onChange={(e) => handleChange("dueDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: <CalendarMonth sx={{ fontSize: 16, color: "#9ca3af", mr: 0.5 }} /> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Box>

          {/* Remarks */}
          <Box>
            <FieldLabel label="Remarks / Notes (optional)" />
            <TextField fullWidth multiline rows={2} size="small"
              placeholder="Any additional notes..."
              value={form.remarks} onChange={(e) => handleChange("remarks", e.target.value)}
              inputProps={{ maxLength: 500 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setOpen(false); resetForm(); }} sx={{ textTransform: "none", color: "#6b7280" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Add />}
            sx={{ bgcolor: "#7c3aed", borderRadius: 2, fontWeight: 700, textTransform: "none", px: 3 }}>
            {submitting ? "Creating..." : "Create Workflow"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Stage Dialog */}
      <Dialog open={!!editStage} onClose={() => { setEditStage(null); setStageErrors({}); }} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 800 }}>Update Stage</Typography>
          <IconButton size="small" onClick={() => { setEditStage(null); setStageErrors({}); }}><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151", mb: 0.5 }}>
              New Stage <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <FormControl fullWidth size="small" error={!!stageErrors.stage}>
              <Select value={editStage?.stage || ""}
                onChange={(e) => { setEditStage((p) => ({ ...p, stage: e.target.value, stageOther: "" })); setStageErrors({}); }}
                sx={{ borderRadius: 2 }}>
                {STAGE_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
              {stageErrors.stage && <FormHelperText>{stageErrors.stage}</FormHelperText>}
            </FormControl>
            {editStage?.stage === "Other" && (
              <TextField fullWidth size="small" placeholder="Describe the stage" sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                value={editStage?.stageOther || ""}
                onChange={(e) => setEditStage((p) => ({ ...p, stageOther: e.target.value }))}
                error={!!stageErrors.stageOther} helperText={stageErrors.stageOther} />
            )}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151", mb: 0.5 }}>Note (optional)</Typography>
            <TextField fullWidth size="small" multiline rows={2} placeholder="Reason for stage change..."
              value={editStage?.note || ""}
              onChange={(e) => setEditStage((p) => ({ ...p, note: e.target.value }))}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setEditStage(null); setStageErrors({}); }} sx={{ textTransform: "none", color: "#6b7280" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdateStage}
            sx={{ bgcolor: "#7c3aed", borderRadius: 2, fontWeight: 700, textTransform: "none", px: 3 }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Workflow Dialog */}
      <Dialog open={!!viewWf} onClose={() => setViewWf(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        {viewWf && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccountTree sx={{ color: "#7c3aed" }} />
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{viewWf.title}</Typography>
                  <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{viewWf.workflowType} · {viewWf.department}</Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setViewWf(null)}><Close /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                <Chip label={viewWf.currentStage} size="small"
                  sx={{ bgcolor: (STATUS_CONFIG[viewWf.currentStage] || STATUS_CONFIG.Other).bg, color: (STATUS_CONFIG[viewWf.currentStage] || STATUS_CONFIG.Other).color, fontWeight: 700 }} />
                {viewWf.priority && (
                  <Chip label={viewWf.priority} size="small"
                    sx={{ bgcolor: PRIORITY_COLORS[viewWf.priority] + "20", color: PRIORITY_COLORS[viewWf.priority], fontWeight: 700 }} />
                )}
              </Box>
              <Typography sx={{ fontSize: 13, color: "#374151", lineHeight: 1.7, mb: 2 }}>{viewWf.description}</Typography>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {viewWf.contactPerson && <Grid item xs={6}><Typography sx={{ fontSize: 12, color: "#6b7280" }}> {viewWf.contactPerson}</Typography></Grid>}
                {viewWf.contactPhone && <Grid item xs={6}><Typography sx={{ fontSize: 12, color: "#6b7280" }}> {viewWf.contactPhone}</Typography></Grid>}
                {viewWf.estimatedDays && <Grid item xs={6}><Typography sx={{ fontSize: 12, color: "#6b7280" }}>{viewWf.estimatedDays} days</Typography></Grid>}
                {viewWf.dueDate && <Grid item xs={6}><Typography sx={{ fontSize: 12, color: "#6b7280" }}>Due: {new Date(viewWf.dueDate).toLocaleDateString("en-IN")}</Typography></Grid>}
              </Grid>
              {viewWf.remarks && (
                <Box sx={{ p: 1.5, bgcolor: "#f9fafb", borderRadius: 2, mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: "#374151" }}> {viewWf.remarks}</Typography>
                </Box>
              )}
              {viewWf.stageHistory?.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#374151", mb: 1 }}>Stage History</Typography>
                  {viewWf.stageHistory.map((sh, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.8 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: (STATUS_CONFIG[sh.stage] || STATUS_CONFIG.Other).color, mt: 0.5, flexShrink: 0 }} />
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{sh.stage}</Typography>
                        {sh.note && <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{sh.note}</Typography>}
                        <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>
                          {sh.changedAt ? new Date(sh.changedAt).toLocaleString("en-IN") : ""}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.type} onClose={() => setSnack((p) => ({ ...p, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}