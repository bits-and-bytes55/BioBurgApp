import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Grid, TextField, MenuItem, Typography, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Chip, Skeleton, Alert, InputAdornment, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider,
} from "@mui/material";
import { Search, Refresh, Add, Edit, Delete, Phone, Email } from "@mui/icons-material";
import axios from "axios";
import PageShell from "./Pageshell";

const API   = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const token = () => localStorage.getItem("agentToken");

const SENTINEL = "__other__";
const DEPT_NAMES   = ["Purchase","Pharmacy","OPD","ICU","Surgery","Gynaecology","Paediatrics","Orthopaedics","Cardiology","Oncology","Radiology","Pathology","Emergency","Admin","Accounts"];
const DESIGNATIONS = ["Purchase Manager","Store Incharge","Head of Department","Medical Superintendent","CMO","Pharmacist","Admin Officer","Accounts Head","Nurse In-Charge"];

function OtherSelect({ label, value, onChange, options }) {
  const isKnown   = options.includes(value);
  const selectVal = value === "" ? "" : isKnown ? value : SENTINEL;
  const [custom, setCustom] = useState(isKnown ? "" : value || "");
  useEffect(() => { if (options.includes(value)) setCustom(""); else if (value) setCustom(value); }, [value]);
  return (
    <Box>
      <TextField fullWidth select size="small" label={label} value={selectVal}
        onChange={e => {
          if (e.target.value === SENTINEL) onChange(custom || "");
          else { setCustom(""); onChange(e.target.value); }
        }}>
        <MenuItem value="" disabled>Select…</MenuItem>
        {options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        <MenuItem value={SENTINEL}>Other (specify)</MenuItem>
      </TextField>
      {selectVal === SENTINEL && (
        <TextField fullWidth size="small" label={`Enter ${label}`} value={custom}
          onChange={e => { setCustom(e.target.value); onChange(e.target.value); }}
          sx={{ mt:1 }} autoFocus />
      )}
    </Box>
  );
}

// ── Add / Edit Department Dialog ──────────────────────────────────────────────
function DeptDialog({ open, hospitals, editData, onClose, onSaved }) {
  const isEdit = !!editData;
  const [hospitalId, setHospitalId] = useState(editData?.hospitalId || "");
  const [form, setForm] = useState({
    name:"", contactPerson:"", designation:"",
    mobile:"", email:"", opdTimings:"", remarks:"",
    ...(editData || {}),
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    if (editData) { setHospitalId(editData.hospitalId); setForm({ ...editData }); }
    else { setHospitalId(""); setForm({ name:"", contactPerson:"", designation:"", mobile:"", email:"", opdTimings:"", remarks:"" }); }
  }, [editData, open]);

  const set    = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const setVal = f => v => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!hospitalId) { setError("Select a hospital"); return; }
    if (!form.name)  { setError("Department name is required"); return; }
    setSaving(true); setError("");
    try {
      if (isEdit) {
        await axios.put(`${API}/api/agent/crm/hospitals/${editData.hospitalId}/departments/${editData._id}`, form, {
          headers: { Authorization: `Bearer ${token()}` },
        });
      } else {
        await axios.post(`${API}/api/agent/crm/hospitals/${hospitalId}/departments`, form, {
          headers: { Authorization: `Bearer ${token()}` },
        });
      }
      onSaved(); onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Department" : "Add Department Contact"}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          {!isEdit && (
            <Grid item xs={12}>
              <TextField fullWidth select size="small" label="Hospital *" value={hospitalId}
                onChange={e => setHospitalId(e.target.value)}>
                <MenuItem value="" disabled>Select hospital…</MenuItem>
                {hospitals.map(h => <MenuItem key={h._id} value={h._id}>{h.name} — {h.area}</MenuItem>)}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <OtherSelect label="Department Name" value={form.name}
              onChange={setVal("name")} options={DEPT_NAMES} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Contact Person Name"
              value={form.contactPerson} onChange={set("contactPerson")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <OtherSelect label="Designation" value={form.designation}
              onChange={setVal("designation")} options={DESIGNATIONS} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Mobile Number"
              value={form.mobile} onChange={set("mobile")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Email (optional)"
              value={form.email} onChange={set("email")} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="OPD / Visit Timings"
              value={form.opdTimings} onChange={set("opdTimings")} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Remarks" multiline rows={2}
              value={form.remarks} onChange={set("remarks")} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Update" : "Add Department"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DepartmentContacts() {
  const [departments, setDepartments] = useState([]);
  const [hospitals,   setHospitals]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [hospFilter,  setHospFilter]  = useState("All");
  const [dialog,      setDialog]      = useState({ open:false, editData:null });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [deptRes, hospRes] = await Promise.all([
        axios.get(`${API}/api/agent/crm/hospitals/departments`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        axios.get(`${API}/api/agent/crm/hospitals`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
      ]);
      setDepartments(deptRes.data.departments);
      setHospitals(hospRes.data.hospitals);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (hospitalId, deptId) => {
    if (!window.confirm("Remove this department contact?")) return;
    try {
      await axios.delete(`${API}/api/agent/crm/hospitals/${hospitalId}/departments/${deptId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      load();
    } catch (e) { setError("Delete failed"); }
  };

  const filtered = departments.filter(d => {
    const matchHosp   = hospFilter === "All" || d.hospitalName === hospFilter;
    const matchSearch = !search ||
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      d.hospitalName?.toLowerCase().includes(search.toLowerCase());
    return matchHosp && matchSearch;
  });

  const hospitalNames = [...new Set(departments.map(d => d.hospitalName).filter(Boolean))].sort();

  return (
    <PageShell
      title="Department Contacts"
      subtitle={`${departments.length} department contacts across all hospitals`}
      breadcrumb={[{ label:"CRM" }, { label:"Hospitals", link:"/agent/crm/hospitals" }, { label:"Departments" }]}
      action={
        <Button startIcon={<Add />} variant="contained" size="small"
          onClick={() => setDialog({ open:true, editData:null })}>
          Add Department
        </Button>
      }
    >
      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ p:2, mb:2, border:"1px solid", borderColor:"divider", borderRadius:3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" placeholder="Search dept, contact, hospital…"
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize:18 }} /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select size="small" label="Hospital" value={hospFilter}
              onChange={e => setHospFilter(e.target.value)}>
              <MenuItem value="All">All Hospitals</MenuItem>
              {hospitalNames.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display:"flex", justifyContent:"flex-end" }}>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={load} sx={{ bgcolor:"#f1f5f9" }}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={0}
        sx={{ border:"1px solid", borderColor:"divider", borderRadius:3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor:"#f8fafc" }}>
              {["Hospital","Area","Department","Contact Person","Designation","Mobile","Email","Timings","Actions"].map(h => (
                <TableCell key={h} sx={{ fontWeight:700, fontSize:12, py:1.5,
                  borderBottom:"2px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(9)].map((_, j) => <TableCell key={j}><Skeleton height={24} /></TableCell>)}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py:5, color:"text.disabled" }}>
                  No department contacts yet
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d, i) => (
                <TableRow key={i} hover sx={{ "&:last-child td":{ borderBottom:0 } }}>
                  <TableCell sx={{ fontSize:12, fontWeight:600 }}>{d.hospitalName}</TableCell>
                  <TableCell sx={{ fontSize:12 }}>{d.area || "—"}</TableCell>
                  <TableCell>
                    <Chip label={d.name} size="small"
                      sx={{ bgcolor:"#dbeafe", color:"#1d4ed8", fontWeight:600, fontSize:11 }} />
                  </TableCell>
                  <TableCell sx={{ fontSize:12 }}>{d.contactPerson || "—"}</TableCell>
                  <TableCell sx={{ fontSize:12 }}>{d.designation || "—"}</TableCell>
                  <TableCell>
                    {d.mobile ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography fontSize={12}>{d.mobile}</Typography>
                        <IconButton size="small" href={`tel:${d.mobile}`}>
                          <Phone sx={{ fontSize:14, color:"#16a34a" }} />
                        </IconButton>
                      </Stack>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {d.email ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography fontSize={11}>{d.email}</Typography>
                        <IconButton size="small" href={`mailto:${d.email}`}>
                          <Email sx={{ fontSize:14, color:"#1d4ed8" }} />
                        </IconButton>
                      </Stack>
                    ) : "—"}
                  </TableCell>
                  <TableCell sx={{ fontSize:12 }}>{d.opdTimings || "—"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small"
                          onClick={() => setDialog({ open:true, editData:d })}>
                          <Edit sx={{ fontSize:15 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error"
                          onClick={() => handleDelete(d.hospitalId, d._id)}>
                          <Delete sx={{ fontSize:15 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <DeptDialog
        open={dialog.open}
        editData={dialog.editData}
        hospitals={hospitals}
        onClose={() => setDialog({ open:false, editData:null })}
        onSaved={load}
      />
    </PageShell>
  );
}