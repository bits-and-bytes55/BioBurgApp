import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel,
  InputAdornment,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Link as LinkIcon,
  Search as SearchIcon,
  Article as ArticleIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useMemo } from "react";



const BASE_API = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
  title: "",
  slug: "",
  route: "",
  isActive: true,
  content: "",
};

const toSlug = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function PolicyForm({ form, handleFormChange, copyRoute }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
      <TextField
        autoFocus
        label="Policy Title"
        value={form.title}
        onChange={(e) => handleFormChange("title", e.target.value)}
        fullWidth
        size="small"
      />

      <TextField
        label="Slug"
        value={form.slug}
        onChange={(e) => handleFormChange("slug", e.target.value)}
        fullWidth
        size="small"
      />

      <TextField
        label="Render Route / Link"
        value={form.route}
        onChange={(e) => handleFormChange("route", e.target.value)}
        fullWidth
        size="small"
      />

      <TextField
        multiline
        rows={6}
        value={form.content}
        onChange={(e) => handleFormChange("content", e.target.value)}
        fullWidth
      />
    </Box>
  );
}


export default function PoliciesManager() {
  const [policies, setPolicies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);

  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  // Try to load from API, fallback to defaults
  useEffect(() => {
  const token = localStorage.getItem("adminToken");

  axios
    .get(`${BASE_API}/api/policies`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      setPolicies(res.data.policies || []);
    })
    .catch((err) => {
      console.log("API ERROR:", err);
    });
}, []);

  const filtered = useMemo(() => {
  return policies.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.route.toLowerCase().includes(search.toLowerCase())
  );
}, [policies, search]);
  // ── Open edit ──
  const openEdit = (policy) => {
    setSelectedPolicy(policy);
    setForm({
      title: policy.title,
      slug: policy.slug,
      route: policy.route,
      isActive: policy.isActive,
      content: policy.content || "",
    });
    setEditDialog(true);
  };

  // ── Open view ──
  const openView = (policy) => {
    setSelectedPolicy(policy);
    setViewDialog(true);
  };

  // ── Open delete ──
  const openDelete = (policy) => {
    setSelectedPolicy(policy);
    setDeleteDialog(true);
  };

  // ── Open add ──
  const openAdd = () => {
    setForm(emptyForm);
    setAddDialog(true);
  };

  // ── Handle form change ──
  const handleFormChange = (field, value) => {
    setForm((prev) => {
  let updated = { ...prev, [field]: value };

  if (field === "title") {
    const slug = toSlug(value);
    updated = {
      ...updated,
      slug,
      route: `/policy/${slug}`,
    };
  }

  if (field === "slug") {
    updated = {
      ...updated,
      route: `/policy/${value}`,
    };
  }

  return updated;
});
  };

  // ── Save edit ──
  const saveEdit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${BASE_API}/api/admin/policies/${selectedPolicy._id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (_) {}
    setPolicies((prev) =>
      prev.map((p) =>
        p._id === selectedPolicy._id ? { ...p, ...form } : p
      )
    );
    setEditDialog(false);
    showSnack("Policy updated successfully!");
    setLoading(false);
  };

  // ── Save add ──
  const saveAdd = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("adminToken");

    const res = await axios.post(
      `${BASE_API}/api/admin/policies`,
      form,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setPolicies((prev) => [...prev, res.data.policy]); 

    setAddDialog(false);
    showSnack("Policy added successfully!");
  } catch (err) {
    console.log(err);
    showSnack("Error adding policy", "error");
  }

  setLoading(false);
};

  //Confirm delete
  const confirmDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(
        `${BASE_API}/api/admin/policies/${selectedPolicy._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (_) {}
    setPolicies((prev) => prev.filter((p) => p._id !== selectedPolicy._id));
    setDeleteDialog(false);
    showSnack("Policy deleted.", "info");
    setLoading(false);
  };

  // ── Toggle active ──
  const toggleActive = async (policy) => {
    const updated = { ...policy, isActive: !policy.isActive };
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${BASE_API}/api/admin/policies/${policy._id}`,
        { isActive: updated.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (_) {}
    setPolicies((prev) =>
      prev.map((p) => (p._id === policy._id ? updated : p))
    );
    showSnack(
      `${policy.title} is now ${updated.isActive ? "active" : "inactive"}.`,
      updated.isActive ? "success" : "warning"
    );
  };

  // ── Copy route ──
  const copyRoute = (route) => {
    navigator.clipboard.writeText(route);
    showSnack("Route copied to clipboard!");
  };

  
 

  return (
    <Box>
      {/* ── Header ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: "#4f46e5",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArticleIcon sx={{ color: "white", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#1e293b">
              Policies Manager
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage footer policy pages, routes & content
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 220 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{
              bgcolor: "#4f46e5",
              "&:hover": { bgcolor: "#4338ca" },
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            Add Policy
          </Button>
        </Box>
      </Box>

      {/* ── Stats Row ── */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {[
          { label: "Total Policies", value: policies.length, color: "#4f46e5" },
          { label: "Active", value: policies.filter((p) => p.isActive).length, color: "#16a34a" },
          { label: "Inactive", value: policies.filter((p) => !p.isActive).length, color: "#dc2626" },
        ].map((stat) => (
          <Paper
            key={stat.label}
            elevation={0}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="h5" fontWeight={700} sx={{ color: stat.color }}>
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Table ── */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.8rem" }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.8rem" }}>POLICY TITLE</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.8rem" }}>ROUTE / LINK</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.8rem" }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.8rem" }} align="right">ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No policies found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((policy, index) => (
              <TableRow
                key={policy._id}
                hover
                sx={{ "&:last-child td": { borderBottom: 0 } }}
              >
                <TableCell sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ArticleIcon sx={{ fontSize: 16, color: "#4f46e5" }} />
                    <Typography variant="body2" fontWeight={600} color="#1e293b">
                      {policy.title}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    slug: {policy.slug}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "monospace",
                        bgcolor: "#f1f5f9",
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                        color: "#4f46e5",
                        maxWidth: 220,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {policy.route}
                    </Typography>
                    <Tooltip title="Copy route">
                      <IconButton size="small" onClick={() => copyRoute(policy.route)}>
                        <CopyIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Open in new tab">
                      <IconButton
                        size="small"
                        component="a"
                        href={policy.route}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <Switch
                    size="small"
                    checked={policy.isActive}
                    onChange={() => toggleActive(policy)}
                    color="success"
                  />
                  <Chip
                    label={policy.isActive ? "Active" : "Inactive"}
                    size="small"
                    sx={{
                      ml: 0.5,
                      fontSize: "0.7rem",
                      bgcolor: policy.isActive ? "#dcfce7" : "#fee2e2",
                      color: policy.isActive ? "#16a34a" : "#dc2626",
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                    <Tooltip title="View content">
                      <IconButton
                        size="small"
                        onClick={() => openView(policy)}
                        sx={{ color: "#64748b", "&:hover": { color: "#4f46e5", bgcolor: "#eef2ff" } }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit policy">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(policy)}
                        sx={{ color: "#64748b", "&:hover": { color: "#0284c7", bgcolor: "#e0f2fe" } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete policy">
                      <IconButton
                        size="small"
                        onClick={() => openDelete(policy)}
                        sx={{ color: "#64748b", "&:hover": { color: "#dc2626", bgcolor: "#fee2e2" } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── ADD DIALOG ── */}
      <Dialog open={addDialog} key="add-policy-dialog" onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={700}>Add New Policy</Typography>
          <IconButton size="small" onClick={() => setAddDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <PolicyForm
  form={form}
  handleFormChange={handleFormChange}
  copyRoute={copyRoute}
/>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setAddDialog(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveAdd}
            disabled={loading || !form.title}
            sx={{ bgcolor: "#4f46e5", "&:hover": { bgcolor: "#4338ca" }, textTransform: "none" }}
          >
            {loading ? "Saving..." : "Add Policy"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── EDIT DIALOG ── */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={700}>Edit Policy</Typography>
          <IconButton size="small" onClick={() => setEditDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <PolicyForm
  form={form}
  handleFormChange={handleFormChange}
  copyRoute={copyRoute}
/>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setEditDialog(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveEdit}
            disabled={loading || !form.title}
            sx={{ bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" }, textTransform: "none" }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── VIEW DIALOG ── */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={700}>{selectedPolicy?.title}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#4f46e5" }}>
                {selectedPolicy?.route}
              </Typography>
              <Chip
                label={selectedPolicy?.isActive ? "Active" : "Inactive"}
                size="small"
                sx={{
                  fontSize: "0.65rem",
                  bgcolor: selectedPolicy?.isActive ? "#dcfce7" : "#fee2e2",
                  color: selectedPolicy?.isActive ? "#16a34a" : "#dc2626",
                }}
              />
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setViewDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Paper
            elevation={0}
            sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#fafafa", minHeight: 200 }}
          >
            {selectedPolicy?.content ? (
              <Box dangerouslySetInnerHTML={{ __html: selectedPolicy.content }} />
            ) : (
              <Typography color="text.secondary" variant="body2">
                No content added yet. Click Edit to add content.
              </Typography>
            )}
          </Paper>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Raw HTML source:
            </Typography>
            <TextField
              multiline
              rows={4}
              value={selectedPolicy?.content || ""}
              fullWidth
              size="small"
              InputProps={{ readOnly: true, sx: { fontFamily: "monospace", fontSize: "0.75rem" } }}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              setViewDialog(false);
              openEdit(selectedPolicy);
            }}
            sx={{ textTransform: "none" }}
          >
            Edit This Policy
          </Button>
          <Button onClick={() => setViewDialog(false)} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DELETE CONFIRM DIALOG ── */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Policy</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete{" "}
            <strong>{selectedPolicy?.title}</strong>? This action cannot be
            undone and will remove it from the footer as well.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}