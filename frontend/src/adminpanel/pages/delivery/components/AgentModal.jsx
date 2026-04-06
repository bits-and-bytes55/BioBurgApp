import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, MenuItem, Button, Box, Typography, Divider,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";

const BASE = import.meta.env.VITE_API_BASE_URL;

const VEHICLE_TYPES = ["Bike", "Scooter", "Car", "Van", "Cycle"];
const STATUSES = ["Active", "Inactive", "Suspended"];

export default function AgentModal({ open, onClose, agent, onSave }) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    vehicleType: "Bike", vehicleNumber: "", status: "Active",
    aadhaarNumber: "", panNumber: "", bankAccount: "", ifsc: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setForm({
        name: agent.name || "", phone: agent.phone || "", email: agent.email || "",
        vehicleType: agent.vehicleType || "Bike",
        vehicleNumber: agent.vehicleNumber || "", status: agent.status || "Active",
        aadhaarNumber: agent.aadhaarNumber || "", panNumber: agent.panNumber || "",
        bankAccount: agent.bankAccount || "", ifsc: agent.ifsc || "",
      });
    } else {
      setForm({ name: "", phone: "", email: "", vehicleType: "Bike",
        vehicleNumber: "", status: "Active", aadhaarNumber: "", panNumber: "",
        bankAccount: "", ifsc: "" });
    }
  }, [agent]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.phone) return toast.error("Name & phone required");
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      if (agent) {
        await axios.put(`${BASE}/api/delivery/agents/${agent._id}`, form, cfg);
        toast.success("Agent updated");
      } else {
        await axios.post(`${BASE}/api/delivery/agents`, form, cfg);
        toast.success("Agent added");
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving agent");
    } finally { setSaving(false); }
  };

  const field = (label, name, props = {}) => (
    <TextField fullWidth size="small" label={label} name={name}
      value={form[name]} onChange={handle} {...props} />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color: "#1e293b" }}>
          {agent ? "Edit Agent" : "Add New Delivery Agent"}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}><Typography sx={{ fontWeight: 700, color: "#475569", fontSize: 13, mb: .5 }}>BASIC INFO</Typography></Grid>
          <Grid item xs={12} sm={6}>{field("Full Name *", "name")}</Grid>
          <Grid item xs={12} sm={6}>{field("Phone *", "phone")}</Grid>
          <Grid item xs={12} sm={6}>{field("Email", "email", { type: "email" })}</Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" select label="Status" name="status" value={form.status} onChange={handle}>
              {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}><Divider /><Typography sx={{ fontWeight: 700, color: "#475569", fontSize: 13, mt: 1.5 }}>VEHICLE</Typography></Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" select label="Vehicle Type" name="vehicleType" value={form.vehicleType} onChange={handle}>
              {VEHICLE_TYPES.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>{field("Vehicle Number", "vehicleNumber")}</Grid>

          <Grid item xs={12} sx={{ mt: 1 }}><Divider /><Typography sx={{ fontWeight: 700, color: "#475569", fontSize: 13, mt: 1.5 }}>DOCUMENTS & BANKING</Typography></Grid>
          <Grid item xs={12} sm={6}>{field("Aadhaar Number", "aadhaarNumber")}</Grid>
          <Grid item xs={12} sm={6}>{field("PAN Number", "panNumber")}</Grid>
          <Grid item xs={12} sm={6}>{field("Bank Account", "bankAccount")}</Grid>
          <Grid item xs={12} sm={6}>{field("IFSC Code", "ifsc")}</Grid>
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#64748b" }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}
          sx={{ textTransform: "none", borderRadius: 2, px: 3,
            background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "none" }}>
          {saving ? "Saving..." : agent ? "Update Agent" : "Add Agent"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}